export type Role = 'parent' | 'driver' | 'teacher' | 'gate' | 'recipient' | 'support';
export type Account = { id: string; name: string; role: Role; schoolId: string; school: string; description: string; classroomId?: string };
export const accounts: Account[] = [
  { id: 'parent-a', name: 'Maya Rivera', role: 'parent', schoolId: 'school-a', school: 'Cedar Grove School', description: "Leo’s parent" },
  { id: 'driver-a', name: 'Daniel Cruz', role: 'driver', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Assigned driver' },
  { id: 'teacher-a', name: 'Ms. Ellis', role: 'teacher', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Classroom teacher · Maple', classroomId: 'maple' },
  { id: 'gate-a', name: 'Jordan Lee', role: 'gate', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Gate coordinator' },
  { id: 'recipient-a', name: 'Elena Rivera', role: 'recipient', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Named home recipient' },
  { id: 'backup-a', name: 'Sofia Rivera', role: 'recipient', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Preapproved backup recipient' },
  { id: 'support-a', name: 'Alex Morgan', role: 'support', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Demo recovery coordinator' },
  { id: 'teacher-oak', name: 'Mr. Chen', role: 'teacher', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Classroom teacher · Oak', classroomId: 'oak' },
  { id: 'gate-2', name: 'Robin Patel', role: 'gate', schoolId: 'school-a', school: 'Cedar Grove School', description: 'Second gate coordinator' },
  { id: 'parent-b', name: 'Sam Brooks', role: 'parent', schoolId: 'school-b', school: 'Harbor School', description: 'Unrelated School B parent' },
];
export const actionLabels = {
  approve: 'Approve this pickup', accept: 'Accept assignment', approach: 'Begin approach · parked', ready: 'Confirm {child} is present and ready',
  request_arrival: "I'm here — parked", confirm_arrival: 'Confirm driver and vehicle', queue: 'Place in waiting queue', bay: 'Call to Bay 1', at_bay: 'Confirm vehicle at Bay 1',
  prepare_school: 'Prepare school handoff', observe_school: 'I witnessed {child} board', acknowledge_school: 'I confirm {child} boarded', finalize_school: 'Record school release',
  depart: 'Begin trip', arrive_home: 'Confirm arrival · parked', prepare_home: 'Prepare recipient handoff', acknowledge_home: 'I have received {child}', observe_home: 'I witnessed the recipient take custody', finalize_home: 'Record home handoff',
  vehicle_check: 'Confirm vehicle is empty', complete: 'Complete trip', revoke: 'Revoke pickup permission', recipient_absent: 'Recipient is not here', select_backup: 'Activate preapproved backup', uncertain: 'Report uncertain handoff',
} as const;
export type Action = keyof typeof actionLabels;
export function actionLabelForChild(action:Action,child:string):string { return actionLabels[action].replace('{child}',child); }
export const actions = Object.keys(actionLabels) as Action[];
export type Transfer = { id: string; status: 'prepared' | 'confirmed' | 'disputed'; initiatorObserved: boolean; receiverAcknowledged: boolean; recipientId: string; preparedAt: string };
export type TripState = {
  id: string; schoolId: string; generation: string; version: number; serviceDate: string; demoTime: string;
  assignmentRevision: number; permission: 'awaiting_approval' | 'approved' | 'revoked'; approvedRevision: number | null;
  accepted: boolean; ready: boolean; pickup: 'expected' | 'ready' | 'release_pending' | 'released' | 'held';
  visit: 'scheduled' | 'arrival_requested' | 'checked_in' | 'waiting' | 'called_to_bay' | 'at_bay' | 'cleared';
  trip: 'planned' | 'accepted' | 'approaching' | 'boarding' | 'in_transit' | 'at_stop' | 'recovery' | 'completed';
  passenger: 'scheduled' | 'onboard' | 'delivered'; holder: 'school' | 'driver' | 'recipient';
  certainty: 'confirmed' | 'transfer_pending' | 'disputed'; schoolTransfer: Transfer | null; homeTransfer: Transfer | null;
  recipientId: string; vehicleChecked: boolean; hold: string | null; recovery: { reason: string; owner: string; backupActivated: boolean } | null;
};
export type AuditEvent = { id: number; type: string; message: string; actor: string; at: string; version: number };
export type Snapshot = {
  account: Account; tripId: string; generation: string; version: number; serverTime: string; demoTime: string; serviceDate: string;
  child: string; school: string; assignment: Assignment; driver: string; vehicle: string; destination?: string; recipient?: string;
  assignmentRevision: number; permission: TripState['permission']; accepted: boolean; pickup: TripState['pickup']; visit: TripState['visit']; trip: TripState['trip']; passenger: TripState['passenger'];
  holder: string; certainty: TripState['certainty']; hold: string | null; recovery: TripState['recovery'];
  schoolTransfer: Transfer | null; homeTransfer: Transfer | null; availableActions: Action[]; timeline: AuditEvent[];
};
export type Command = { tripId: string; key: string; expectedVersion: number; generation: string; action: Action; location?: LocationSample };
export type Receipt = { key: string; tripId: string; action: string; committedVersion: number; eventId: number; sessionId?: string };
export const scenarios = [
  { id: 'queue', title: 'Five-vehicle queue review', detail: 'Approved and accepted drivers; one unready and one held pickup. Announce arrivals next.' },
  { id: 'normal', title: 'Start a new afternoon', detail: 'Begin with parent approval.' },
  { id: 'before-release', title: 'Ready for school release', detail: 'Both observations recorded. Try revoking or finalizing.' },
  { id: 'at-home', title: 'Arrived at home', detail: 'Try a normal receipt or an absent recipient.' },
  { id: 'pending', title: 'School handoff pending', detail: 'An open transfer. Try reporting uncertainty.' },
] as const;
export type Scenario = typeof scenarios[number]['id'];

export type Vehicle = { id:string; model:string; color:string; paint:string; plate:string; body:'van'|'sedan'|'suv'|'hatchback'|'pickup' };
export type Assignment = {tripId:string;schoolId:string;classroomId:string;child:string;parentId:string;driverId:string;recipientId:string;backupId:string;destination:string;vehicle:Vehicle};
export const assignments: Assignment[] = [
 {tripId:'trip-a',schoolId:'school-a',classroomId:'maple',child:'Leo Rivera',parentId:'parent-a',driverId:'driver-a',recipientId:'recipient-a',backupId:'backup-a',destination:'18 Garden Lane · synthetic address',vehicle:{id:'vehicle-a',model:'Toyota Sienna',color:'Blue',paint:'#35688e',plate:'PICK 024',body:'van'}},
 {tripId:'trip-2',schoolId:'school-a',classroomId:'oak',child:'Nora Santos',parentId:'parent-2',driverId:'driver-2',recipientId:'recipient-2',backupId:'backup-2',destination:'22 Cedar Way · synthetic address',vehicle:{id:'vehicle-2',model:'Honda Civic',color:'Blue',paint:'#35688e',plate:'PICK 182',body:'sedan'}},
 {tripId:'trip-3',schoolId:'school-a',classroomId:'maple',child:'Amir Khan',parentId:'parent-3',driverId:'driver-3',recipientId:'recipient-3',backupId:'backup-3',destination:'31 Willow Lane · synthetic address',vehicle:{id:'vehicle-3',model:'Kia Sportage',color:'White',paint:'#e4e8e4',plate:'PICK 307',body:'suv'}},
 {tripId:'trip-4',schoolId:'school-a',classroomId:'oak',child:'Zoe Park',parentId:'parent-4',driverId:'driver-4',recipientId:'recipient-4',backupId:'backup-4',destination:'46 Acorn Road · synthetic address',vehicle:{id:'vehicle-4',model:'Volkswagen Golf',color:'Red',paint:'#a9473d',plate:'PICK 416',body:'hatchback'}},
 {tripId:'trip-5',schoolId:'school-a',classroomId:'maple',child:'Isla Reed',parentId:'parent-5',driverId:'driver-5',recipientId:'recipient-5',backupId:'backup-5',destination:'50 Fern Street · synthetic address',vehicle:{id:'vehicle-5',model:'Ford Ranger',color:'Silver',paint:'#a5b1b6',plate:'PICK 550',body:'pickup'}},
 {tripId:'trip-b',schoolId:'school-b',classroomId:'harbor',child:'Avery Brooks',parentId:'parent-b',driverId:'driver-b',recipientId:'recipient-b',backupId:'backup-b',destination:'7 Harbor Lane · synthetic address',vehicle:{id:'vehicle-b',model:'Honda Odyssey',color:'Gray',paint:'#718086',plate:'HARBOR 12',body:'van'}},
];
const driverNames=['Daniel Cruz','Lucia Torres','Owen Blake','Mei Tan','Rafael Ortiz','Casey Wells'];
for (const [i,a] of assignments.entries()) {
 const school=a.schoolId==='school-a'?'Cedar Grove School':'Harbor School';
 for (const [id,name,role,description] of [[a.parentId,`${a.child.split(' ')[1]} parent`,'parent',`${a.child}’s parent`],[a.driverId,driverNames[i],'driver',`${a.vehicle.color} ${a.vehicle.model} · ${a.vehicle.plate}`],[a.recipientId,`${a.child.split(' ')[1]} recipient`,'recipient','Named home recipient'],[a.backupId,`${a.child.split(' ')[1]} backup`,'recipient','Preapproved backup recipient']] as const) {
  if(!accounts.some(x=>x.id===id)) accounts.push({id,name,role,schoolId:a.schoolId,school,description});
 }
}
export const personName=(id:string)=>accounts.find(a=>a.id===id)?.name||'Assigned adult';
export const assignmentFor=(id:string)=>assignments.find(a=>a.tripId===id)!;
export type LocationSample={latitude:number;longitude:number;accuracy:number|null;timestamp:number;zoneVersion:number;source:'device'|'simulated'};
export type PickupZone={id:string;version:number;latitude:number;longitude:number;radius:number;source:'synthetic'|'reviewer'};
export type Visit={id:string;tripId:string;announcedAt:string|null;confirmedAt:string|null;source:'device'|'simulated'|'manual'|'migrated'|null;exception:boolean;departed:boolean};
export type QueueState={id:string;schoolId:string;generation:string;revision:number;laneId:string;bayVisitId:string|null;order:string[];visits:Visit[];zone:PickupZone};
export type QueueItem={visitId:string;tripId:string;position:number|null;classSequence?:number;student?:string;classroomId?:string;driver?:string;vehicle:Vehicle;status:string;ready:boolean;hold:string|null;locked:boolean;announcedAt:string|null;confirmedAt:string|null;source:Visit['source'];exception:boolean;departed:boolean;custody:string};
export type QueueSnapshot={sessionId:string;generation:string;revision:number;laneId:string;bayVisitId:string|null;items:QueueItem[];zone?:PickupZone;migrationAvailable:boolean;events:{id:number;type:string;actor:string;at:string;message:string}[]};
export type QueueCommand={sessionId:string;generation:string;expectedRevision:number;key:string;action:'reorder'|'manual_arrival'|'exception'|'restore'|'zone';visitId?:string;order?:string[];reason?:string;zone?:Omit<PickupZone,'id'|'version'>};
export type DemoLocationMode='device'|'inside'|'outside'|'stale'|'inaccurate';
export function simulatedSample(zone:PickupZone,mode:Exclude<DemoLocationMode,'device'>):LocationSample {
 return {latitude:zone.latitude+(mode==='outside'?.01:0),longitude:zone.longitude,accuracy:mode==='inaccurate'?120:5,timestamp:Date.now()-(mode==='stale'?60000:0),zoneVersion:zone.version,source:'simulated'};
}
