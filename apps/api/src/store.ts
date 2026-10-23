import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { assignments, type QueueState, type Account, type AuditEvent, type Command, type Receipt, type Scenario, type TripState } from '@pick/contracts';
import { authorize, DomainError, fixtureActor, initialState, project, scenarioSteps, transition } from './domain.ts';

import { initialQueue, sessionId, syncQueue, validateLocation, authorizeQueue } from './queue.ts';

type Row = Record<string, unknown>;
export interface Storage {
  transaction<T>(fn: () => T): T;
  getState(id: string): TripState;
  saveState(s: TripState): void;
  audit(s: TripState, event: Omit<AuditEvent, 'id'>): number;
  events(id: string): AuditEvent[];
  receipt(actor: string, key: string): { hash: string; receipt: Receipt } | undefined;
  saveReceipt(actor: string, hash: string, receipt: Receipt): void;
  session(token: string): Account;
}
export class SqliteStore implements Storage {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS queues(id TEXT PRIMARY KEY,state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS queue_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT NOT NULL,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS trips(id TEXT PRIMARY KEY, state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, actor TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts(actor TEXT NOT NULL, key TEXT NOT NULL, hash TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(actor,key));
      CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id TEXT NOT NULL REFERENCES trips(id), type TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS one_school_handoff ON audit(trip_id) WHERE type='SchoolHandoffRecorded';
      CREATE UNIQUE INDEX IF NOT EXISTS one_home_handoff ON audit(trip_id) WHERE type='HomeHandoffRecorded';`);
    if (!this.db.prepare('SELECT id FROM trips LIMIT 1').get()) this.reset('normal');
    for(const school of ['school-a','school-b']) if(!this.db.prepare('SELECT id FROM queues WHERE id=?').get(sessionId(school))) this.saveQueue(initialQueue(this.states().filter(s=>s.schoolId===school)));
  }
  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const r = fn(); this.db.exec('COMMIT'); return r; } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  getState(id: string): TripState {
    const row = this.db.prepare('SELECT state FROM trips WHERE id=?').get(id) as Row | undefined;
    if (!row) throw new DomainError(404, 'NOT_FOUND', 'This trip is not available.');
    return JSON.parse(row.state as string);
  }
  saveState(s: TripState) { this.db.prepare('INSERT INTO trips(id,state) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state').run(s.id, JSON.stringify(s)); }
  audit(s: TripState, event: Omit<AuditEvent, 'id'>) {
    return Number(this.db.prepare('INSERT INTO audit(trip_id,type,payload) VALUES (?,?,?)').run(s.id, event.type, JSON.stringify(event)).lastInsertRowid);
  }
  events(id: string): AuditEvent[] {
    return (this.db.prepare('SELECT id,payload FROM audit WHERE trip_id=? ORDER BY id').all(id) as Row[]).map(r => ({ ...JSON.parse(r.payload as string), id: r.id }));
  }
  receipt(actor: string, key: string) {
    const r = this.db.prepare('SELECT hash,result FROM receipts WHERE actor=? AND key=?').get(actor, key) as Row | undefined;
    return r ? { hash: r.hash as string, receipt: JSON.parse(r.result as string) as Receipt } : undefined;
  }
  saveReceipt(actor: string, hash: string, receipt: Receipt) { this.db.prepare('INSERT INTO receipts(actor,key,hash,result) VALUES (?,?,?,?)').run(actor, receipt.key, hash, JSON.stringify(receipt)); }
  states():TripState[]{return (this.db.prepare('SELECT state FROM trips ORDER BY id').all() as Row[]).map(r=>JSON.parse(r.state as string));}
  getQueue(id:string):QueueState{const row=this.db.prepare('SELECT state FROM queues WHERE id=?').get(id) as Row|undefined;if(!row)throw new DomainError(404,'NOT_FOUND','Dismissal session not found.');return JSON.parse(row.state as string);}
  saveQueue(q:QueueState){this.db.prepare('INSERT INTO queues(id,state) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state').run(q.id,JSON.stringify(q));}
  queueAudit(q:QueueState,type:string,actor:string,message:string,detail:unknown={}){return Number(this.db.prepare('INSERT INTO queue_audit(session_id,payload) VALUES (?,?)').run(q.id,JSON.stringify({type,actor,message,at:new Date().toISOString(),revision:q.revision,detail})).lastInsertRowid);}
  queueEvents(id:string){return (this.db.prepare('SELECT id,payload FROM queue_audit WHERE session_id=? ORDER BY id DESC LIMIT 30').all(id) as Row[]).map(r=>{const e=JSON.parse(r.payload as string);return {id:Number(r.id),type:e.type,actor:e.actor,at:e.at,message:e.message};});}
  migrateQueue(){return this.transaction(()=>{
    let added=0;
    for(const a of assignments){if(this.db.prepare('SELECT id FROM trips WHERE id=?').get(a.tripId))continue;
      const q=this.getQueue(sessionId(a.schoolId));let state=initialState(a.schoolId,q.generation,a.tripId);
      for(const [id,action] of [[a.parentId,'approve'],[a.driverId,'accept'],[a.driverId,'approach']] as const){const r=transition(state,fixtureActor(id),action);state=r.state;this.saveState(state);this.audit(state,r.event);}
      if(a.tripId!=='trip-4'){const teacher=fixtureActor(a.classroomId==='maple'?'teacher-a':'teacher-oak');const r=transition(state,teacher,'ready');state=r.state;this.saveState(state);this.audit(state,r.event);}
      if(a.tripId==='trip-5'){const r=transition(state,fixtureActor(a.parentId),'revoke');state=r.state;this.saveState(state);this.audit(state,r.event);}
      q.visits.push({id:`visit-${a.tripId}`,tripId:a.tripId,announcedAt:null,confirmedAt:null,source:null,exception:false,departed:false});q.revision++;this.saveQueue(q);this.queueAudit(q,'FixturesAdded','Demo migration','Additional synthetic assignment added; existing trips, sessions and custody preserved.');added++;
    }return {added,preserved:true};
  });}
  createSession(actorId: string) {
    const actor = fixtureActor(actorId), token = randomBytes(32).toString('hex');
    const expires = Date.now() + 8 * 60 * 60 * 1000;
    this.db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    this.db.prepare('INSERT INTO sessions(token_hash,actor,expires) VALUES (?,?,?)').run(digest(token), actor.id, expires);
    return { token, account: actor, expiresAt: new Date(expires).toISOString(), tripId: this.states().find(s=>{try{authorize(actor,s);return true;}catch{return false;}})?.id||'', sessionId:sessionId(actor.schoolId) };
  }
  session(token: string): Account {
    const r = this.db.prepare('SELECT actor,expires FROM sessions WHERE token_hash=?').get(digest(token)) as Row | undefined;
    if (!r || Number(r.expires) <= Date.now()) throw new DomainError(401, 'SESSION_EXPIRED', 'This demo session expired or the shared scenario was reset. Choose an account again.');
    return fixtureActor(r.actor as string);
  }
  endSession(token: string) { this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token)); }
  reset(scenario: Scenario) {
    return this.transaction(() => {
      this.db.exec('DELETE FROM sessions; DELETE FROM receipts; DELETE FROM queue_audit; DELETE FROM queues; DELETE FROM audit; DELETE FROM trips;');
      const generation = randomUUID();
      for (const assignment of assignments) {
        const school=assignment.schoolId;
        let s = initialState(school, generation, assignment.tripId); this.saveState(s);
        this.audit(s, { type: 'DemoSeeded', message: 'Synthetic afternoon created. Eligibility and guardian authority are seeded demo facts.', actor: 'Demo setup', at: new Date().toISOString(), version: s.version });
        if (assignment.tripId === 'trip-a') for (const [id, action] of scenarioSteps(scenario)) {
          const result = transition(s, fixtureActor(id), action); s = result.state;
          this.saveState(s); this.audit(s, result.event);
        }
      }
      for(const school of ['school-a','school-b'])this.saveQueue(initialQueue(this.states().filter(s=>s.schoolId===school)));
      if(scenario==='queue')for(const a of assignments.filter(a=>a.schoolId==='school-a')){
        let state=this.getState(a.tripId);
        const steps:[string,Command['action']][]=[[a.parentId,'approve'],[a.driverId,'accept'],[a.driverId,'approach']];
        if(a.tripId!=='trip-4')steps.push([a.classroomId==='maple'?'teacher-a':'teacher-oak','ready']);
        if(a.tripId==='trip-5')steps.push([a.parentId,'revoke']);
        for(const [id,action] of steps){const r=transition(state,fixtureActor(id),action);state=r.state;this.saveState(state);this.audit(state,r.event);}
      }
      return { generation, scenario };
    });
  }
  close() { this.db.close(); }
}
function digest(text: string) { return createHash('sha256').update(text).digest('hex'); }
export class CommandService {
  constructor(private store: SqliteStore) {}
  snapshot(token: string, tripId: string) {
    return this.store.transaction(() => {
      const actor = this.store.session(token), state = this.store.getState(tripId);
      return project(state, actor, this.store.events(tripId));
    });
  }
  execute(token: string, command: Command) {
    return this.store.transaction(() => {
      // Session is checked inside the write transaction: reset cannot leave an in-flight actor authorized.
      const actor = this.store.session(token), state = this.store.getState(command.tripId); authorize(actor, state);
      const hash = digest(JSON.stringify([command.tripId, command.generation, command.expectedVersion, command.action, command.location||null]));
      const existing = this.store.receipt(actor.id, command.key);
      if (existing) {
        if (existing.hash !== hash) throw new DomainError(409, 'IDEMPOTENCY_MISMATCH', 'This command key was already used with different content. Refresh before acting.');
        return existing.receipt;
      }
      if (command.generation !== state.generation) throw new DomainError(409, 'SCENARIO_CHANGED', 'The shared demo was reset. Choose an account again.');
      if (command.expectedVersion !== state.version) throw new DomainError(409, 'VERSION_CONFLICT', 'Another participant updated this trip. The latest state has been loaded; review it before acting again.');
      const q=this.store.getQueue(sessionId(state.schoolId)),visit=q.visits.find(v=>v.tripId===state.id)!;
      if(command.action==='request_arrival'&&visit.announcedAt){
        const eventId=this.store.events(state.id).find(e=>e.type==='ArrivalRequested'||e.type==='Queue_manual_arrival')?.id||0;
        const receipt={key:command.key,tripId:state.id,action:command.action,committedVersion:state.version,eventId};this.store.saveReceipt(actor.id,hash,receipt);return receipt;
      }
      if(command.action==='request_arrival')validateLocation(command.location,q.zone);
      if(['bay','at_bay','prepare_school'].includes(command.action)){
        if(q.order[0]!==visit.id||visit.exception||(q.bayVisitId&&q.bayVisitId!==visit.id))throw new DomainError(409,'BAY_BLOCKED','Only the front vehicle can use the free bay. Held vehicles remain an obstruction until staff records a physical exception move.');
      }
      const result = transition(state, actor, command.action);
      if(command.action==='request_arrival')result.event.message+=` ${command.location!.source==='simulated'?'SIMULATED sample':'Foreground device sample'} qualified proximity only; gate confirmation still required.`;
      syncQueue(q,state,result.state,command.location?.source);this.store.saveQueue(q);
      if(['request_arrival','confirm_arrival','depart'].includes(command.action))this.store.queueAudit(q,command.action,actor.name,result.event.message);

      this.store.saveState(result.state);
      const eventId = this.store.audit(result.state, result.event);
      const receipt = { key: command.key, tripId: state.id, action: command.action, committedVersion: result.state.version, eventId };
      this.store.saveReceipt(actor.id, hash, receipt);
      return receipt;
    });
  }
  lookup(token: string, key: string) {
    return this.store.transaction(() => {
      const actor = this.store.session(token), r = this.store.receipt(actor.id, key);
      if (!r) throw new DomainError(404, 'NOT_FOUND', 'No committed receipt is visible for this command. Refresh and review the handoff before any new action.');
      if(r.receipt.sessionId)authorizeQueue(actor,this.store.getQueue(r.receipt.sessionId));else authorize(actor,this.store.getState(r.receipt.tripId)); return r.receipt;
    });
  }
}
