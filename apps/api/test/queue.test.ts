import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import type {AddressInfo} from 'node:net';
import {assignments,accounts,simulatedSample,type Action,type QueueCommand,type LocationSample} from '@pick/contracts';
import {SqliteStore,CommandService} from '../src/store.ts';
import {QueueService,validateLocation} from '../src/queue.ts';
import {DomainError} from '../src/domain.ts';
import {createApi} from '../src/http.ts';
import {DemoClient} from '../../mobile/src/client.ts';
const code=(fn:()=>unknown,expected:string)=>assert.throws(fn,(e:unknown)=>e instanceof DomainError&&e.code===expected);
function setup(path=':memory:'){
 const store=new SqliteStore(path);store.reset('queue');const trips=new CommandService(store),queues=new QueueService(store),tokens=Object.fromEntries(accounts.map(a=>[a.id,store.createSession(a.id).token]));
 const q=()=>store.getQueue('dismissal-school-a');
 const body=(tripId:string,action:Action,location?:LocationSample)=>{const s=store.getState(tripId);return {tripId,action,expectedVersion:s.version,generation:s.generation,key:randomUUID(),...(location?{location}:{})};};
 const act=(id:string,tripId:string,action:Action,location?:LocationSample)=>trips.execute(tokens[id],body(tripId,action,location));
 const command=(input:Partial<QueueCommand>)=>({sessionId:q().id,generation:q().generation,expectedRevision:q().revision,key:randomUUID(),action:'reorder' as const,...input});
 const announce=(tripId:string)=>act(assignments.find(a=>a.tripId===tripId)!.driverId,tripId,'request_arrival',simulatedSample(q().zone,'inside'));
 const confirm=(tripId:string)=>{announce(tripId);act('gate-a',tripId,'confirm_arrival');act('gate-a',tripId,'queue');};
 const full=()=>{for(const a of assignments.filter(a=>a.schoolId==='school-a')){if(a.tripId==='trip-5')queues.execute(tokens['gate-a'],command({action:'manual_arrival',visitId:'visit-trip-5',reason:'Physically matched the parked held vehicle.'}));else confirm(a.tripId);}};
 return {store,trips,queues,tokens,q,body,act,command,announce,confirm,full};
}
test('location boundaries: valid inside only, freshness, accuracy, bounds and server zone revision',()=>{
 const f=setup(),zone=f.q().zone;
 validateLocation(simulatedSample(zone,'inside'),zone);
 for(const [mode,error] of [['outside','OUTSIDE_ZONE'],['stale','LOCATION_STALE'],['inaccurate','LOCATION_INACCURATE']] as const)code(()=>validateLocation(simulatedSample(zone,mode),zone),error);
 code(()=>validateLocation(undefined,zone),'LOCATION_REQUIRED');
 code(()=>validateLocation({...simulatedSample(zone,'inside'),latitude:91},zone),'INVALID_LOCATION');
 code(()=>validateLocation({...simulatedSample(zone,'inside'),accuracy:null},zone),'LOCATION_INACCURATE');
 code(()=>validateLocation({...simulatedSample(zone,'inside'),timestamp:Date.now()+10000},zone),'LOCATION_STALE');
 code(()=>validateLocation({...simulatedSample(zone,'inside'),zoneVersion:0},zone),'ZONE_CHANGED');
 code(()=>validateLocation({...simulatedSample(zone,'inside'),latitude:zone.latitude+85/111195,accuracy:25},zone),'LOCATION_BOUNDARY');f.store.close();
});
test('same-school relationship authorization for trips, commands, queue projections and receipts',()=>{
 const f=setup();
 for(const actor of ['parent-2','driver-2','teacher-oak','recipient-2','parent-b']){
  code(()=>f.trips.snapshot(f.tokens[actor],'trip-a'),'NOT_FOUND');
  code(()=>f.trips.execute(f.tokens[actor],f.body('trip-a','approve')),'NOT_FOUND');
 }
 assert.deepEqual(f.queues.snapshot(f.tokens['driver-2'],f.q().id).items.map(v=>v.tripId),['trip-2']);
 const teacher=f.queues.snapshot(f.tokens['teacher-a'],f.q().id);assert.equal(teacher.items.length,3);assert.equal(teacher.zone,undefined);assert.equal(teacher.items.some(v=>v.driver!==undefined),false);assert.equal(JSON.stringify(teacher).includes('Garden Lane'),false);assert.equal(teacher.items.some(v=>['Nora Santos','Zoe Park'].includes(v.student!)),false);
 code(()=>f.queues.snapshot(f.tokens['parent-b'],f.q().id),'NOT_FOUND');
 code(()=>f.queues.execute(f.tokens['driver-a'],f.command({action:'zone',zone:{latitude:0,longitude:0,radius:100,source:'synthetic'}})),'NOT_FOUND');
 const receipt=f.announce('trip-a');code(()=>f.trips.lookup(f.tokens['driver-2'],receipt.key),'NOT_FOUND');f.store.close();
});
test('announcement is one visit, proximity does not confirm identity, repeats and jitter cannot reshuffle',()=>{
 const f=setup(),b=f.body('trip-a','request_arrival',simulatedSample(f.q().zone,'inside'));
 const first=f.trips.execute(f.tokens['driver-a'],b);assert.deepEqual(f.trips.execute(f.tokens['driver-a'],b),first);
 const q=f.q();assert.equal(q.order.length,0);assert.equal(q.visits.filter(v=>v.announcedAt).length,1);
 f.act('driver-a','trip-a','request_arrival',simulatedSample(q.zone,'outside'));assert.equal(f.q().revision,q.revision);
 assert.equal(f.queues.snapshot(f.tokens['teacher-a'],q.id).items.find(v=>v.tripId==='trip-a')?.position,null);f.store.close();
});
test('position five to two changes classroom priority, retains readiness and held physical car',()=>{
 const f=setup();f.full();const original=f.q().order;
 const order=[original[0],original[4],...original.slice(1,4)];f.queues.execute(f.tokens['gate-a'],f.command({visitId:original[4],order}));
 assert.deepEqual(f.q().order,order);const teacher=f.queues.snapshot(f.tokens['teacher-a'],f.q().id);
 assert.deepEqual(teacher.items.map(v=>v.position),[1,2,4]);assert.deepEqual(teacher.items.map(v=>v.classSequence),[1,2,3]);assert.ok(teacher.items.find(v=>v.tripId==='trip-5')!.hold);assert.equal(f.store.getState('trip-4').ready,false);assert.equal(f.store.getState('trip-3').ready,true);f.store.close();
});
test('stale simultaneous reorder and new arrival during drag reject without lost vehicles',()=>{
 const f=setup();f.confirm('trip-a');f.confirm('trip-2');const stale=f.command({visitId:'visit-trip-2',order:['visit-trip-2','visit-trip-a']});
 f.announce('trip-3');code(()=>f.queues.execute(f.tokens['gate-a'],stale),'QUEUE_CONFLICT');assert.deepEqual(f.q().order,['visit-trip-a','visit-trip-2']);
 const c=f.command({visitId:'visit-trip-2',order:['visit-trip-2','visit-trip-a']});f.queues.execute(f.tokens['gate-a'],c);code(()=>f.queues.execute(f.tokens['gate-2'],{...c,key:randomUUID()}),'QUEUE_CONFLICT');
 f.act('gate-a','trip-3','confirm_arrival');assert.deepEqual(f.q().order,['visit-trip-2','visit-trip-a','visit-trip-3']);f.store.close();
});
test('invalid permutations, bay lock, unready and held release guards and actual exception move',()=>{
 const f=setup();f.full();const order=f.q().order;
 code(()=>f.queues.execute(f.tokens['gate-a'],f.command({visitId:order[0],order:[order[0],order[0],...order.slice(2)]})),'INVALID_ORDER');
 code(()=>f.queues.execute(f.tokens['gate-a'],f.command({visitId:order[0],order:order.slice(1)})),'INVALID_ORDER');
 code(()=>f.act('gate-a','trip-2','bay'),'BAY_BLOCKED');f.act('gate-a','trip-a','bay');f.act('gate-a','trip-a','at_bay');f.act('gate-a','trip-a','prepare_school');
 code(()=>f.queues.execute(f.tokens['gate-a'],f.command({visitId:order[0],order:[order[1],order[0],...order.slice(2)]})),'VISIT_LOCKED');
 code(()=>f.queues.execute(f.tokens['gate-a'],f.command({action:'exception',visitId:order[0],reason:'Physically moved to exception area.'})),'VISIT_LOCKED');
 const held='visit-trip-5';f.queues.execute(f.tokens['gate-a'],f.command({action:'exception',visitId:held,reason:'Staff observed parking in exception area.'}));assert.equal(f.q().order.includes(held),false);assert.ok(f.store.getState('trip-5').hold);
 f.queues.execute(f.tokens['gate-a'],f.command({action:'restore',visitId:held,reason:'Staff observed rejoining rear of lane.'}));assert.equal(f.q().order.at(-1),held);f.store.close();
});
test('manual arrival needs gate role and reason; does not clear a permission hold',()=>{
 const f=setup(),c=f.command({action:'manual_arrival',visitId:'visit-trip-5',reason:'Driver location unavailable; physically matched.'});
 code(()=>f.queues.execute(f.tokens['driver-5'],c),'NOT_FOUND');code(()=>f.queues.execute(f.tokens['gate-a'],{...c,reason:''}),'REASON_REQUIRED');f.queues.execute(f.tokens['gate-a'],c);
 assert.equal(f.q().order.length,1);code(()=>f.act('gate-a','trip-5','bay'),'AUTHORIZATION_REVOKED');assert.equal(f.store.getState('trip-5').holder,'school');assert.equal(f.store.getState('trip-5').permission,'revoked');f.store.close();
});
test('a hold after announcement still permits recording physical obstruction; unready front cannot use bay',()=>{
 const f=setup();f.announce('trip-a');f.act('parent-a','trip-a','revoke');f.act('gate-a','trip-a','confirm_arrival');f.act('gate-a','trip-a','queue');assert.deepEqual(f.q().order,['visit-trip-a']);
 code(()=>f.act('gate-a','trip-a','bay'),'AUTHORIZATION_REVOKED');
 f.queues.execute(f.tokens['gate-a'],f.command({action:'exception',visitId:'visit-trip-a',reason:'Staff observed held car parked in exception area.'}));
 f.confirm('trip-4');assert.equal(f.q().order[0],'visit-trip-4');code(()=>f.act('gate-a','trip-4','bay'),'STATE_CONFLICT');assert.equal(f.store.getState('trip-4').holder,'school');f.store.close();
});
test('queue state, audit and idempotency receipt roll back as one transaction',()=>{
 const f=setup();f.confirm('trip-a');f.confirm('trip-2');const before=f.q();
 f.store.db.exec("CREATE TRIGGER fail_queue_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'fault'); END;");
 assert.throws(()=>f.queues.execute(f.tokens['gate-a'],f.command({visitId:'visit-trip-2',order:['visit-trip-2','visit-trip-a']})));assert.deepEqual(f.q(),before);assert.equal(f.store.queueEvents(before.id).some(e=>e.type==='reorder'),false);f.store.close();
});
test('queue survives restart; reset invalidates queue commands; migration preserves existing state',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pick-queue-')),path=join(dir,'test.sqlite');const f=setup(path);f.full();const before=f.q(),token=f.tokens['gate-a'];f.store.close();
 const store=new SqliteStore(path);assert.deepEqual(store.getQueue(before.id),before);const service=new QueueService(store);assert.equal(service.snapshot(token,before.id).items.length,5);
 // Represent a legacy DB without the four additional trips. Preserve original trip/session exactly.
 store.db.exec("DELETE FROM audit WHERE trip_id IN ('trip-2','trip-3','trip-4','trip-5'); DELETE FROM trips WHERE id IN ('trip-2','trip-3','trip-4','trip-5');");const q=store.getQueue(before.id);q.visits=q.visits.filter(v=>v.tripId==='trip-a');q.order=q.order.filter(id=>id==='visit-trip-a');store.saveQueue(q);const state=store.getState('trip-a');
 assert.equal(store.migrateQueue().added,4);assert.deepEqual(store.getState('trip-a'),state);assert.equal(store.session(token).id,'gate-a');assert.equal(store.migrateQueue().added,0);
 store.reset('normal');code(()=>service.snapshot(token,before.id),'SESSION_EXPIRED');store.close();const absolute=resolve(dir);assert.ok(absolute.startsWith(resolve(tmpdir())));rmSync(absolute,{recursive:true,force:true});
});
test('HTTP rejects spoofed/outside/stale check-ins and queue edits; lost response, concurrent edits and polling converge',async(t)=>{
 const f=setup(),server=createApi(f.store,{allowFaults:true});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 const post=(path:string,token:string,b:unknown)=>fetch(url+path,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(b)});
 try{
  for(const mode of ['outside','stale','inaccurate'] as const){const r=await post('/v1/commands',f.tokens['driver-a'],f.body('trip-a','request_arrival',simulatedSample(f.q().zone,mode)));assert.equal(r.status,409);}
  const spoof=await post('/v1/commands',f.tokens['driver-a'],{...f.body('trip-a','request_arrival'),insideZone:true});assert.equal(spoof.status,400);
  const forbidden=await post('/v1/queue-commands',f.tokens['parent-a'],f.command({action:'manual_arrival',visitId:'visit-trip-a',reason:'Trying to bypass location.'}));assert.equal(forbidden.status,404);
  f.full();const gate=new DemoClient(url),teacher=new DemoClient(url),driver=new DemoClient(url);await Promise.all([gate.selectAccount('gate-a'),teacher.selectAccount('teacher-a'),driver.selectAccount('driver-2')]);
  teacher.setPaused(true);const pausedRevision=teacher.state.queue!.revision;gate.setDropNext(true);const order=gate.state.queue!.items.filter(v=>v.position!==null).sort((a,b)=>a.position!-b.position!).map(v=>v.visitId);
  assert.equal(await gate.executeQueue({action:'reorder',visitId:order[4],order:[order[0],order[4],...order.slice(1,4)]}),true);assert.equal(gate.state.pending,null);assert.match(gate.state.notice!,/recovered/);assert.equal(teacher.state.queue!.revision,pausedRevision);
  teacher.setPaused(false);await teacher.refresh();await driver.refresh();assert.equal(driver.state.queue!.items.length,1);assert.equal(driver.state.queue!.items[0].position,3);
  const start=Date.now();while(teacher.state.queue!.revision!==gate.state.queue!.revision&&Date.now()-start<1900){await new Promise(r=>setTimeout(r,20));}assert.equal(teacher.state.queue!.revision,gate.state.queue!.revision);
  assert.equal(f.store.queueEvents(f.q().id).filter(e=>e.type==='reorder').length,1);
  const latest=f.q(),c=f.command({visitId:'visit-trip-5',order:['visit-trip-a','visit-trip-2','visit-trip-3','visit-trip-4','visit-trip-5']});
  const started=Date.now(),timer=setInterval(()=>teacher.tick(),1000);
  try{
   const racing=await Promise.all([post('/v1/queue-commands',f.tokens['gate-a'],c),post('/v1/queue-commands',f.tokens['gate-2'],{...c,key:randomUUID()})]);assert.deepEqual(racing.map(r=>r.status).sort(),[200,409]);
   while(teacher.state.queue!.revision===latest.revision&&Date.now()-started<1950)await new Promise(r=>setTimeout(r,20));
   assert.equal(teacher.state.queue!.revision,f.q().revision);t.diagnostic(`Queue-to-classroom polling convergence: ${Date.now()-started} ms.`);
  }finally{clearInterval(timer);}
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));f.store.close();}
});
