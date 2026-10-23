import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { simulatedSample, type Action, type Command, type Scenario } from '@pick/contracts';
import { SqliteStore, CommandService } from '../src/store.ts';
import { createApi } from '../src/http.ts';
import { DomainError, scenarioSteps } from '../src/domain.ts';
import { DemoClient } from '../../mobile/src/client.ts';

function fixture(scenario: Scenario = 'normal', path = ':memory:') {
  const store = new SqliteStore(path); store.reset(scenario);
  const service = new CommandService(store); const tokens: Record<string,string> = {};
  for (const id of ['parent-a','driver-a','teacher-a','gate-a','recipient-a','backup-a','support-a','parent-b']) tokens[id]=store.createSession(id).token;
  function command(actor:string, action:Action, extra:Partial<Command> = {}) {
    const state = store.getState('trip-a');
    return {token:tokens[actor],body:{tripId:state.id,expectedVersion:state.version,generation:state.generation,key:randomUUID(),action,...(action==='request_arrival'?{location:simulatedSample(store.getQueue('dismissal-school-a').zone,'inside')}:{}),...extra}};
  }
  const act=(actor:string,action:Action)=>{const c=command(actor,action);return service.execute(c.token,c.body);};
  return {store,service,tokens,command,act};
}
const expectCode=(fn:()=>unknown,code:string)=>assert.throws(fn,(e:unknown)=>e instanceof DomainError&&e.code===code);
async function httpFixture(scenario:Scenario='normal',path=':memory:') {
  const f=fixture(scenario,path), server=createApi(f.store,{allowFaults:true});
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const request=(path:string,token?:string,body?:unknown,extraHeaders:Record<string,string>={})=>fetch(url+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...extraHeaders},body:body?JSON.stringify(body):undefined});
  const close=async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));f.store.close();};
  return {...f,server,url,request,close};
}

test('normal journey: independent actors, two paired transfers and final vehicle check',()=>{
  const f=fixture();
  for(const [actor,action] of scenarioSteps('at-home'))f.act(actor,action);
  f.act('driver-a','prepare_home');
  expectCode(()=>f.act('driver-a','finalize_home'),'STATE_CONFLICT');
  expectCode(()=>f.act('driver-a','acknowledge_home'),'ROLE_DENIED');
  f.act('recipient-a','acknowledge_home');f.act('driver-a','observe_home');f.act('driver-a','finalize_home');
  expectCode(()=>f.act('driver-a','complete'),'STATE_CONFLICT');
  f.act('driver-a','vehicle_check');f.act('driver-a','complete');
  const s=f.store.getState('trip-a');assert.equal(s.trip,'completed');assert.equal(s.holder,'recipient');
  assert.equal(f.store.events('trip-a').filter(e=>e.type==='SchoolHandoffRecorded').length,1);
  assert.equal(f.store.events('trip-a').filter(e=>e.type==='HomeHandoffRecorded').length,1);f.store.close();
});
test('idempotency receipt, payload mismatch and different-key duplicate release',()=>{
  const f=fixture('before-release'),c=f.command('gate-a','finalize_school');
  const first=f.service.execute(c.token,c.body);assert.deepEqual(f.service.execute(c.token,c.body),first);
  expectCode(()=>f.service.execute(c.token,{...c.body,action:'prepare_school'}),'IDEMPOTENCY_MISMATCH');
  expectCode(()=>f.act('gate-a','finalize_school'),'STATE_CONFLICT');
  assert.equal(f.store.events('trip-a').filter(e=>e.type==='SchoolHandoffRecorded').length,1);f.store.close();
});
test('revoke before preparation holds; during pending transfer preserves uncertainty; after release preserves holder',()=>{
  const f=fixture();f.act('parent-a','approve');f.act('parent-a','revoke');
  assert.equal(f.store.getState('trip-a').pickup,'held');expectCode(()=>f.act('driver-a','accept'),'AUTHORIZATION_REVOKED');f.store.close();
  const p=fixture('before-release');p.act('parent-a','revoke');assert.equal(p.store.getState('trip-a').certainty,'disputed');
  expectCode(()=>p.act('gate-a','finalize_school'),'AUTHORIZATION_REVOKED');assert.equal(p.store.events('trip-a').filter(e=>e.type==='SchoolHandoffRecorded').length,0);p.store.close();
  const r=fixture('before-release');r.act('gate-a','finalize_school');r.act('parent-a','revoke');assert.equal(r.store.getState('trip-a').holder,'driver');assert.equal(r.store.getState('trip-a').trip,'recovery');expectCode(()=>r.act('driver-a','depart'),'STATE_CONFLICT');r.store.close();
});
test('absent recipient: no delivery; preapproved backup must personally acknowledge',()=>{
  const f=fixture('at-home');f.act('driver-a','recipient_absent');assert.equal(f.store.getState('trip-a').holder,'driver');
  expectCode(()=>f.act('driver-a','finalize_home'),'STATE_CONFLICT');expectCode(()=>f.act('driver-a','select_backup'),'ROLE_DENIED');
  f.act('support-a','select_backup');f.act('driver-a','prepare_home');
  expectCode(()=>f.act('recipient-a','acknowledge_home'),'RECIPIENT_UNVERIFIED');
  f.act('backup-a','acknowledge_home');f.act('driver-a','observe_home');f.act('driver-a','finalize_home');
  assert.equal(f.store.getState('trip-a').recipientId,'backup-a');assert.equal(f.store.getState('trip-a').passenger,'delivered');f.store.close();
});
test('uncertain handoff cannot time out into another release',()=>{
  const f=fixture('pending');f.act('driver-a','uncertain');
  assert.equal(f.store.getState('trip-a').certainty,'disputed');assert.equal(f.store.getState('trip-a').schoolTransfer?.status,'disputed');
  for(const a of ['prepare_school','finalize_school'] as Action[])expectCode(()=>f.act('gate-a',a),'AUTHORIZATION_REVOKED');
  expectCode(()=>f.act('support-a','select_backup'),'STATE_CONFLICT');f.store.close();
});
test('stale version and role access reject without audit/state writes',()=>{
  const f=fixture(),stale=f.command('parent-a','approve');f.act('teacher-a','ready');
  const n=f.store.events('trip-a').length;expectCode(()=>f.service.execute(stale.token,stale.body),'VERSION_CONFLICT');
  expectCode(()=>f.act('driver-a','observe_school'),'ROLE_DENIED');assert.equal(f.store.events('trip-a').length,n);f.store.close();
});
test('cross-school reads, commands and receipts; same-school receipt ownership; teacher field filtering',()=>{
  const f=fixture();const c=f.command('parent-a','approve');f.service.execute(c.token,c.body);
  expectCode(()=>f.service.snapshot(f.tokens['parent-b'],'trip-a'),'NOT_FOUND');
  expectCode(()=>f.service.execute(f.tokens['parent-b'],c.body),'NOT_FOUND');
  expectCode(()=>f.service.lookup(f.tokens['parent-b'],c.body.key),'NOT_FOUND');
  expectCode(()=>f.service.lookup(f.tokens['gate-a'],c.body.key),'NOT_FOUND');
  const teacher=f.service.snapshot(f.tokens['teacher-a'],'trip-a');assert.equal(teacher.destination,undefined);assert.equal(teacher.recipient,undefined);
  const driver=f.service.snapshot(f.tokens['driver-a'],'trip-a');assert.equal(driver.child,'Assigned student');assert.equal(driver.destination,undefined);f.store.close();
});
test('reset invalidates sessions and stale commands; expiry enforced',()=>{
  const f=fixture(),c=f.command('parent-a','approve');f.store.reset('normal');expectCode(()=>f.service.execute(c.token,c.body),'SESSION_EXPIRED');
  const newSession=f.store.createSession('parent-a');expectCode(()=>f.service.execute(newSession.token,c.body),'SCENARIO_CHANGED');
  f.store.db.exec('UPDATE sessions SET expires=0');expectCode(()=>f.service.snapshot(newSession.token,'trip-a'),'SESSION_EXPIRED');f.store.close();
});
test('state and receipts survive closing and reopening the SQLite adapter',()=>{
  const dir=mkdtempSync(join(tmpdir(),'pick-test-')),path=join(dir,'pick.sqlite');
  try {const f=fixture('before-release',path),c=f.command('gate-a','finalize_school'),receipt=f.service.execute(c.token,c.body);f.store.close();
    const reopened=new SqliteStore(path), service=new CommandService(reopened);assert.equal(reopened.getState('trip-a').holder,'driver');assert.deepEqual(service.lookup(c.token,c.body.key),receipt);assert.deepEqual(service.execute(c.token,c.body),receipt);reopened.close();
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('transaction failure rolls back state, event and receipt together',()=>{
  const f=fixture('before-release'),before=f.store.getState('trip-a');
  f.store.db.exec("CREATE TRIGGER force_failure BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT, 'injected receipt failure'); END;");
  const c=f.command('gate-a','finalize_school');assert.throws(()=>f.service.execute(c.token,c.body));
  assert.deepEqual(f.store.getState('trip-a'),before);assert.equal(f.store.events('trip-a').filter(e=>e.type==='SchoolHandoffRecorded').length,0);assert.equal(f.store.receipt('gate-a',c.body.key),undefined);f.store.close();
});
test('HTTP role spoofing, school/receipt boundaries and untrusted web origin',async()=>{
  const f=await httpFixture();try{
    const c=f.command('parent-a','approve');assert.equal((await f.request('/v1/commands',c.token,{...c.body,role:'gate',actor:'gate-a'})).status,400);
    assert.equal((await f.request('/v1/commands',f.tokens['driver-a'],c.body)).status,403);
    assert.equal((await f.request('/v1/trips/trip-a',f.tokens['parent-b'])).status,404);
    assert.equal((await f.request('/v1/commands',f.tokens['parent-b'],c.body)).status,404);
    assert.equal((await f.request('/v1/commands',c.token,c.body)).status,200);
    assert.equal((await f.request(`/v1/receipts/${c.body.key}`,f.tokens['parent-b'])).status,404);
    assert.equal((await f.request('/v1/trips/trip-a',c.token,undefined,{Origin:'https://untrusted.example'})).status,403);
    assert.equal((await f.request('/v1/trips/trip-a')).status,401);
  }finally{await f.close();}
});
test('concurrent HTTP finalize requests through independent SQLite connections yield one release',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'pick-concurrent-')),path=join(dir,'shared.sqlite');
  const f=await httpFixture('before-release',path),other=new SqliteStore(path),server=createApi(other);
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  try{const c=f.command('gate-a','finalize_school');const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const responses=await Promise.all([f.request('/v1/commands',c.token,c.body),fetch(url+'/v1/commands',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${c.token}`},body:JSON.stringify({...c.body,key:randomUUID()})})]);
    assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal(other.events('trip-a').filter(e=>e.type==='SchoolHandoffRecorded').length,1);
  }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));other.close();await f.close();rmSync(dir,{recursive:true,force:true});}
});
test('lost HTTP acknowledgement resolves receipt, no second command submitted',async()=>{
  const f=await httpFixture('before-release');try{
    const c=f.command('gate-a','finalize_school');await assert.rejects(f.request('/v1/commands',c.token,c.body,{'X-Demo-Drop-Response':'once'}));
    const receipt=await f.request(`/v1/receipts/${c.body.key}`,c.token);assert.equal(receipt.status,200);assert.equal(f.store.getState('trip-a').holder,'driver');
    const client=new DemoClient(f.url);await client.selectAccount('driver-a');client.setDropNext(true);await client.execute('depart');
    assert.equal(client.state.pending,null);assert.match(client.state.notice||'',/Response recovered/);assert.equal(f.store.events('trip-a').filter(e=>e.type==='TripDeparted').length,1);
  }finally{await f.close();}
});
test('independent client polling refreshes within two seconds locally; reconnect converges',async t=>{
  const f=await httpFixture();const a=new DemoClient(f.url),b=new DemoClient(f.url);let timer:ReturnType<typeof setInterval>|undefined;
  try{await a.selectAccount('parent-a');await b.selectAccount('driver-a');
    timer=setInterval(()=>b.tick(),1000);const start=performance.now();await a.execute('approve');
    while(b.state.snapshot?.permission!=='approved'&&performance.now()-start<2100)await new Promise(r=>setTimeout(r,20));
    const elapsed=Math.round(performance.now()-start);assert.equal(b.state.snapshot?.permission,'approved');assert.ok(elapsed<2000);t.diagnostic(`Observed foreground polling convergence: ${elapsed} ms.`);
    b.setPaused(true);f.act('teacher-a','ready');assert.equal(b.state.connected,false);const old=b.state.snapshot?.version;
    await b.execute('accept');assert.equal(f.store.getState('trip-a').accepted,false);
    b.setPaused(false);await new Promise(r=>setTimeout(r,150));assert.ok((b.state.snapshot?.version||0)>(old||0));assert.equal(b.state.connected,true);
  }finally{if(timer)clearInterval(timer);await f.close();}
});
test('old-session delayed snapshots never populate a newly selected account',async()=>{
  const f=await httpFixture();let release:()=>void=()=>{};let delayed=false;
  const fetcher:typeof fetch=async(input,init)=>{const result=await fetch(input,init);if(delayed&&String(input).includes('/v1/trips/trip-a')){delayed=false;await new Promise<void>(r=>{release=r;});}return result;};
  try{const c=new DemoClient(f.url,fetcher);await c.selectAccount('parent-a');delayed=true;const inFlight=c.refresh();await new Promise(r=>setTimeout(r,50));await c.selectAccount('parent-b');release();await inFlight;
    assert.equal(c.state.session?.account.id,'parent-b');assert.equal(c.state.snapshot?.tripId,'trip-b');assert.equal(c.state.snapshot?.child,'Avery Brooks');
  }finally{await f.close();}
});
test('HTTP reset invalidates all independent sessions and rejects missing confirmation',async()=>{
  const f=await httpFixture();try{
    assert.equal((await f.request('/demo/reset',undefined,{scenario:'normal'})).status,400);
    assert.equal((await f.request('/demo/reset',undefined,{scenario:'pending',confirm:'RESET_SHARED_DEMO'})).status,200);
    assert.equal((await f.request('/v1/trips/trip-a',f.tokens['parent-a'])).status,401);
    assert.equal((await f.request('/v1/trips/trip-a',f.tokens['driver-a'])).status,401);
  }finally{await f.close();}
});
