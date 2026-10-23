import { createHash } from 'node:crypto';
import { assignmentFor, assignments, personName, type Account, type LocationSample, type PickupZone, type QueueCommand, type QueueItem, type QueueSnapshot, type QueueState, type TripState } from '@pick/contracts';
import { authorize, DomainError } from './domain.ts';
import type { SqliteStore } from './store.ts';

const demand=(ok:unknown,code:string,message:string)=>{if(!ok)throw new DomainError(409,code,message);};
export const sessionId=(school:string)=>`dismissal-${school}`;
export function authorizeQueue(actor:Account,q:QueueState,gateOnly=false){
  if(actor.schoolId!==q.schoolId || (gateOnly&&actor.role!=='gate')) throw new DomainError(404,'NOT_FOUND','This lane is not available to this account.');
}
export const locked=(s:TripState)=>['called_to_bay','at_bay'].includes(s.visit)||s.certainty!=='confirmed';
export function initialQueue(states:TripState[]):QueueState{
 const s=states[0];
 const visits=states.map(t=>({id:`visit-${t.id}`,tripId:t.id,announcedAt:t.visit==='scheduled'?null:new Date().toISOString(),confirmedAt:['scheduled','arrival_requested'].includes(t.visit)?null:new Date().toISOString(),source:t.visit==='scheduled'?null:'migrated' as const,exception:false,departed:t.visit==='cleared'}));
 return {id:sessionId(s.schoolId),schoolId:s.schoolId,generation:s.generation,revision:1,laneId:`lane-${s.schoolId}-1`,bayVisitId:visits.find(v=>['called_to_bay','at_bay'].includes(states.find(t=>t.id===v.tripId)!.visit))?.id||null,order:visits.filter(v=>v.confirmedAt&&!v.departed).map(v=>v.id),visits,zone:{id:`zone-${s.schoolId}`,version:1,latitude:18.45,longitude:-66.08,radius:100,source:'synthetic'}};
}
export function validateZone(z:Omit<PickupZone,'id'|'version'>){
 demand(z&&typeof z==='object'&&Object.keys(z).every(k=>['latitude','longitude','radius','source'].includes(k))&&Number.isFinite(z.latitude)&&Math.abs(z.latitude)<=90&&Number.isFinite(z.longitude)&&Math.abs(z.longitude)<=180&&Number.isFinite(z.radius)&&z.radius>=25&&z.radius<=500&&['synthetic','reviewer'].includes(z.source),'INVALID_ZONE','Use valid coordinates and a demo radius from 25 to 500 meters.');
}
export function validateLocation(sample:LocationSample|undefined,zone:PickupZone,now=Date.now()){
 demand(sample&&typeof sample==='object','LOCATION_REQUIRED','Check your current foreground location before announcing arrival.');
 const p=sample!;
 demand(Object.keys(p).every(k=>['latitude','longitude','accuracy','timestamp','zoneVersion','source'].includes(k))&&Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180&&['device','simulated'].includes(p.source),'INVALID_LOCATION','Location coordinates or sample source are invalid.');
 demand(p.zoneVersion===zone.version,'ZONE_CHANGED','The pickup zone changed. Check your location again.');
 demand(Number.isFinite(p.timestamp)&&now-p.timestamp<=30000&&p.timestamp<=now+5000,'LOCATION_STALE','Location is stale. Obtain a fresh foreground reading.');
 demand(typeof p.accuracy==='number'&&Number.isFinite(p.accuracy)&&p.accuracy>=0&&p.accuracy<=25,'LOCATION_INACCURATE','Location accuracy is unknown or worse than 25 meters. Try again in the approved waiting area.');
 const rad=(v:number)=>v*Math.PI/180;
 const a=Math.sin(rad(p.latitude-zone.latitude)/2)**2+Math.cos(rad(zone.latitude))*Math.cos(rad(p.latitude))*Math.sin(rad(p.longitude-zone.longitude)/2)**2;
 const distance=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
 demand(distance<=zone.radius,'OUTSIDE_ZONE','You are outside the demo check-in area. Park in the approved waiting area before trying again.');
 demand(distance+p.accuracy!<=zone.radius,'LOCATION_BOUNDARY','The reading overlaps the zone boundary. A more accurate reading is needed.');
 return {source:p.source,distance:Math.round(distance)};
}
export function syncQueue(q:QueueState,before:TripState,after:TripState,source?:'device'|'simulated'){
 const v=q.visits.find(v=>v.tripId===after.id)!;
 if(before.visit==='scheduled'&&after.visit==='arrival_requested'){v.announcedAt=new Date().toISOString();v.source=source||'simulated';}
 if(before.visit==='arrival_requested'&&after.visit==='checked_in'){v.confirmedAt=new Date().toISOString();q.order.push(v.id);}
 if(after.visit==='called_to_bay')q.bayVisitId=v.id;
 if(before.visit!=='cleared'&&after.visit==='cleared'){v.departed=true;q.order=q.order.filter(id=>id!==v.id);if(q.bayVisitId===v.id)q.bayVisitId=null;}
 q.revision++;
}
export class QueueService{
 constructor(private store:SqliteStore){}
 snapshot(token:string,id:string):QueueSnapshot{return this.store.transaction(()=>{
  const actor=this.store.session(token),q=this.store.getQueue(id);authorizeQueue(actor,q);
  let sequence=0;
  const sorted=[...q.visits].sort((a,b)=>{const ai=q.order.indexOf(a.id),bi=q.order.indexOf(b.id);return (ai<0?999:ai)-(bi<0?999:bi)||(a.announcedAt||'z').localeCompare(b.announcedAt||'z')||a.id.localeCompare(b.id);});
  const items:QueueItem[]=[];
  for(const v of sorted){const s=this.store.getState(v.tripId),a=assignmentFor(v.tripId);try{authorize(actor,s);}catch{continue;}
   const pos=q.order.indexOf(v.id),school=actor.role==='teacher';
   items.push({visitId:v.id,tripId:v.tripId,position:pos<0?null:pos+1,...(school&&pos>=0?{classSequence:++sequence}:{}),student:a.child,classroomId:a.classroomId,...(!school?{driver:personName(a.driverId)}:{}),vehicle:a.vehicle,status:v.departed?'Departed':v.exception?'Exception area':s.hold?'Held':s.visit==='at_bay'?'At bay':s.visit==='called_to_bay'?'Called to bay':v.confirmedAt?(s.ready?'Waiting · student ready':'Student not ready'):v.announcedAt?'Arrival announced':'Not announced',ready:s.ready,hold:s.hold,locked:locked(s),announcedAt:v.announcedAt,confirmedAt:v.confirmedAt,source:v.source,exception:v.exception,departed:v.departed,custody:s.certainty==='confirmed'?s.holder:'Uncertain handoff'});
  }
  return {sessionId:q.id,generation:q.generation,revision:q.revision,laneId:q.laneId,bayVisitId:actor.role==='gate'?q.bayVisitId:null,items,...(['gate','driver'].includes(actor.role)?{zone:q.zone}:{}),migrationAvailable:actor.role==='gate'&&assignments.some(a=>a.schoolId===q.schoolId&&!q.visits.some(v=>v.tripId===a.tripId)),events:actor.role==='gate'?this.store.queueEvents(q.id):[]};
 });}
 execute(token:string,c:QueueCommand){return this.store.transaction(()=>{
  const actor=this.store.session(token),q=this.store.getQueue(c.sessionId);authorizeQueue(actor,q,true);
  const hash=createHash('sha256').update(JSON.stringify(c)).digest('hex'),old=this.store.receipt(actor.id,c.key);
  if(old){demand(old.hash===hash,'IDEMPOTENCY_MISMATCH','This key already belongs to a different request.');return old.receipt;}
  demand(c.generation===q.generation,'SCENARIO_CHANGED','This demo was reset. Select your account again.');
  demand(c.expectedRevision===q.revision,'QUEUE_CONFLICT','The lane changed. Your move was not applied. Review the refreshed lane and explicitly retry.');
  const previous=[...q.order],v=q.visits.find(v=>v.id===c.visitId),s=v?this.store.getState(v.tripId):null;
  const reason=()=>demand(typeof c.reason==='string'&&c.reason.trim().length>=8&&c.reason.length<=240,'REASON_REQUIRED','Record a reason of 8–240 characters after observing the physical move.');
  let message:string;
  if(c.action==='reorder'){
   demand(Array.isArray(c.order)&&c.order.length===q.order.length&&new Set(c.order).size===q.order.length&&c.order.every(id=>q.order.includes(id)),'INVALID_ORDER','A reorder must include every confirmed lane visit exactly once.');
   demand(v&&q.order.includes(v.id),'INVALID_VISIT','Choose a confirmed vehicle in this lane.');
   // Exactly one moved visit; peers retain their relative order.
   demand(JSON.stringify(c.order!.filter(id=>id!==v!.id))===JSON.stringify(q.order.filter(id=>id!==v!.id)),'INVALID_ORDER','Only the selected vehicle may be moved by this command.');
   for(const id of q.order){const state=this.store.getState(q.visits.find(x=>x.id===id)!.tripId);demand(!locked(state)||q.order.indexOf(id)===c.order!.indexOf(id),'VISIT_LOCKED','Called, at-bay and unresolved handoff positions are locked. Record an actual exception-area move when appropriate.');}
   demand(!locked(s!),'VISIT_LOCKED','This vehicle cannot be reordered.');q.order=[...c.order!];message=`Recorded physical order: ${assignmentFor(v!.tripId).vehicle.plate} is now position ${q.order.indexOf(v!.id)+1}. This is not an overtaking instruction.`;
  }else if(c.action==='zone'){
   validateZone(c.zone!);q.zone={...c.zone!,id:q.zone.id,version:q.zone.version+1};message='Demo pickup zone configuration changed by gate staff. Existing announcements remain accepted.';
  }else{
   demand(v&&s,'INVALID_VISIT','This vehicle is not part of the dismissal session.');authorize(actor,s!);
   if(c.action==='manual_arrival'){
    reason();demand(!v!.announcedAt&&s!.accepted&&['accepted','approaching'].includes(s!.trip),'ARRIVAL_EXISTS','An accepted active assignment with no arrival is required.');
    v!.announcedAt=new Date().toISOString();v!.confirmedAt=v!.announcedAt;v!.source='manual';s!.visit='waiting';q.order.push(v!.id);message=`Gate physically matched driver and vehicle; manual arrival recorded. Reason: ${c.reason}`;
   }else if(c.action==='exception'){
    reason();demand(q.order.includes(v!.id)&&s!.passenger==='scheduled'&&s!.certainty==='confirmed'&&!s!.schoolTransfer,'VISIT_LOCKED','Resolve any physical handoff before moving to an exception area.');
    q.order=q.order.filter(id=>id!==v!.id);if(q.bayVisitId===v!.id)q.bayVisitId=null;v!.exception=true;s!.visit='waiting';message=`Staff observed vehicle parked in exception area. Reason: ${c.reason}`;
   }else if(c.action==='restore'){
    reason();demand(v!.exception,'INVALID_VISIT','Only an exception-area vehicle can rejoin the lane.');v!.exception=false;q.order.push(v!.id);message=`Staff observed vehicle rejoin the rear of the lane. Reason: ${c.reason}`;
   }else throw new DomainError(400,'INVALID_COMMAND','Unknown lane command.');
   s!.version++;this.store.saveState(s!);this.store.audit(s!,{type:`Queue_${c.action}`,message,actor:actor.name,at:new Date().toISOString(),version:s!.version});
  }
  q.revision++;this.store.saveQueue(q);
  const eventId=this.store.queueAudit(q,c.action,actor.name,message,{previous,newOrder:q.order,reason:c.reason||null});
  const receipt={key:c.key,tripId:v?.tripId||`queue:${q.id}`,sessionId:q.id,action:c.action,committedVersion:q.revision,eventId};this.store.saveReceipt(actor.id,hash,receipt);return receipt;
 });}
}
