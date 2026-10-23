import { randomUUID } from 'node:crypto';
import { assignmentFor, personName, accounts, actions, type Account, type Action, type TripState, type Scenario, type AuditEvent, type Snapshot } from '@pick/contracts';

export class DomainError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
const require = (condition: unknown, message: string, code = 'STATE_CONFLICT') => {
  if (!condition) throw new DomainError(409, code, message);
};
export function authorize(account: Account, state: TripState) {
  const a=assignmentFor(state.id);
  const related=a && (account.role==='gate'||account.role==='support'||(account.role==='parent'&&a.parentId===account.id)||(account.role==='driver'&&a.driverId===account.id)||(account.role==='teacher'&&account.classroomId===a.classroomId)||(account.role==='recipient'&&[a.recipientId,a.backupId].includes(account.id)));
  if (!related || account.schoolId !== state.schoolId) throw new DomainError(404, 'NOT_FOUND', 'This trip is not available to this account.');
}
export function initialState(schoolId: string, generation: string, tripId=schoolId==='school-a'?'trip-a':'trip-b'): TripState {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Puerto_Rico', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return { id:tripId, schoolId, generation, version: 1, serviceDate: date, demoTime: `${date}T15:10:00-04:00`, assignmentRevision: 1, permission: 'awaiting_approval', approvedRevision: null, accepted: false, ready: false, pickup: 'expected', visit: 'scheduled', trip: 'planned', passenger: 'scheduled', holder: 'school', certainty: 'confirmed', schoolTransfer: null, homeTransfer: null, recipientId: assignmentFor(tripId).recipientId, vehicleChecked: false, hold: null, recovery: null };
}
const roles: Record<Action, Account['role'][]> = {
  approve: ['parent'], revoke: ['parent'], accept: ['driver'], approach: ['driver'], ready: ['teacher'],
  request_arrival: ['driver'], confirm_arrival: ['gate'], queue: ['gate'], bay: ['gate'], at_bay: ['gate'], prepare_school: ['gate'], observe_school: ['gate'], acknowledge_school: ['driver'], finalize_school: ['gate'],
  depart: ['driver'], arrive_home: ['driver'], prepare_home: ['driver'], acknowledge_home: ['recipient'], observe_home: ['driver'], finalize_home: ['driver'], vehicle_check: ['driver'], complete: ['driver'], recipient_absent: ['driver'], select_backup: ['support'], uncertain: ['gate', 'driver', 'recipient'],
};
export function transition(original: TripState, actor: Account, action: Action, now = new Date().toISOString()) {
  authorize(actor, original);
  if (!roles[action]?.includes(actor.role)) throw new DomainError(403, 'ROLE_DENIED', 'This action belongs to another participant.');
  const s = structuredClone(original), assignment=assignmentFor(original.id);
  const validPermission = () => require(s.permission === 'approved' && s.approvedRevision === s.assignmentRevision && !s.hold, 'Pickup permission is not current. Keep the child supervised and contact the coordinator.', 'AUTHORIZATION_REVOKED');
  const schoolPending = () => {
    validPermission(); require(s.pickup === 'release_pending' && s.schoolTransfer?.status === 'prepared', 'There is no confirmed, open school handoff.');
    return s.schoolTransfer!;
  };
  const homePending = () => {
    require(s.trip === 'at_stop' && s.homeTransfer?.status === 'prepared' && !s.hold, 'There is no authorized, open recipient handoff.');
    return s.homeTransfer!;
  };
  let event: [string, string];
  switch (action) {
    case 'approve':
      require(s.permission === 'awaiting_approval' && s.passenger === 'scheduled', 'This assignment cannot be approved again.');
      s.permission = 'approved'; s.approvedRevision = s.assignmentRevision; event = ['AssignmentApproved', 'Parent approved the named driver, vehicle and receiving adults.']; break;
    case 'accept':
      validPermission(); require(!s.accepted && s.trip === 'planned', 'This assignment has already been accepted.');
      s.accepted = true; s.trip = 'accepted'; event = ['DriverAccepted', 'Assigned driver accepted the approved assignment.']; break;
    case 'approach':
      validPermission(); require(s.trip === 'accepted', 'Accept the assignment before beginning the approach.');
      s.trip = 'approaching'; event = ['ApproachStarted', 'Driver began the simulated approach while parked.']; break;
    case 'ready':
      require(!s.ready && s.passenger === 'scheduled' && !s.hold, 'Readiness is already recorded or this pickup is held.');
      s.ready = true; s.pickup = 'ready'; event = ['StudentReady', 'Teacher confirmed the child is present and ready.']; break;
    case 'request_arrival':
      validPermission(); require(s.trip === 'approaching' && s.visit === 'scheduled', 'Begin approach before checking in.');
      s.visit = 'arrival_requested'; event = ['ArrivalRequested', 'Driver requested a physical arrival check.']; break;
    case 'confirm_arrival':
      require(s.visit === 'arrival_requested', 'Wait for the driver’s check-in request.');
      s.visit = 'checked_in'; event = ['ArrivalVerified', 'Gate matched the driver and vehicle in person.']; break;
    case 'queue':
      require(s.visit === 'checked_in', 'Verify physical arrival first.');
      s.visit = 'waiting'; event = ['VehicleQueued', 'Vehicle entered the waiting queue.']; break;
    case 'bay':
      validPermission(); require(s.visit === 'waiting' && s.ready, 'The child must be ready and the vehicle must be waiting.');
      s.visit = 'called_to_bay'; event = ['BayAssigned', 'Gate called the vehicle to Bay 1.']; break;
    case 'at_bay':
      validPermission(); require(s.visit === 'called_to_bay', 'Call the vehicle forward first.');
      s.visit = 'at_bay'; s.trip = 'boarding'; event = ['VehicleAtBay', 'Gate confirmed the vehicle is parked at Bay 1.']; break;
    case 'prepare_school':
      validPermission(); require(s.visit === 'at_bay' && s.ready && s.accepted && s.pickup === 'ready' && !s.schoolTransfer && s.holder === 'school', 'Verify readiness, acceptance and Bay 1 before preparing a handoff.');
      s.schoolTransfer = { id: randomUUID(), status: 'prepared', initiatorObserved: false, receiverAcknowledged: false, recipientId: assignment.driverId, preparedAt: now };
      s.pickup = 'release_pending'; s.certainty = 'transfer_pending'; event = ['SchoolTransferPrepared', 'School handoff opened. Both adults must record their own observation.']; break;
    case 'observe_school': {
      const t = schoolPending(); require(!t.initiatorObserved, 'Gate observation is already recorded.'); t.initiatorObserved = true;
      event = ['GateObservedBoarding', 'Gate recorded witnessing the child board.']; break;
    }
    case 'acknowledge_school': {
      const t = schoolPending(); require(!t.receiverAcknowledged, 'Driver acknowledgement is already recorded.'); t.receiverAcknowledged = true;
      event = ['DriverAcknowledgedBoarding', 'Driver independently acknowledged the child boarded.']; break;
    }
    case 'finalize_school': {
      const t = schoolPending(); require(t.initiatorObserved && t.receiverAcknowledged, 'Both the gate and driver must acknowledge the handoff first.');
      require(s.holder === 'school' && s.passenger === 'scheduled', 'A school release is already recorded.');
      t.status = 'confirmed'; s.pickup = 'released'; s.passenger = 'onboard'; s.holder = 'driver'; s.certainty = 'confirmed';
      event = ['SchoolHandoffRecorded', 'School release recorded. Assigned driver now has confirmed custody.']; break;
    }
    case 'depart':
      require(s.trip === 'boarding' && s.passenger === 'onboard' && s.certainty === 'confirmed' && !s.hold, 'Resolve the child’s handoff and any holds before departure.');
      s.trip = 'in_transit'; s.visit = 'cleared'; event = ['TripDeparted', 'Vehicle left the school with the approved child onboard.']; break;
    case 'arrive_home':
      require(s.trip === 'in_transit' && !s.hold, 'This trip is not ready for an arrival confirmation.');
      s.trip = 'at_stop'; event = ['HomeArrivalRecorded', 'Driver confirmed arrival and parking. Custody is still with the driver.']; break;
    case 'prepare_home':
      require(s.trip === 'at_stop' && s.passenger === 'onboard' && !s.homeTransfer && !s.hold, 'Resolve the active stop or handoff before preparing another.');
      s.homeTransfer = { id: randomUUID(), status: 'prepared', initiatorObserved: false, receiverAcknowledged: false, recipientId: s.recipientId, preparedAt: now };
      s.certainty = 'transfer_pending'; event = ['HomeTransferPrepared', 'Recipient handoff opened. Both adults must confirm the exchange.']; break;
    case 'acknowledge_home': {
      const t = homePending(); require(actor.id === t.recipientId, 'Only the currently authorized receiving adult may acknowledge receipt.', 'RECIPIENT_UNVERIFIED');
      require(!t.receiverAcknowledged, 'Recipient acknowledgement is already recorded.'); t.receiverAcknowledged = true;
      event = ['RecipientAcknowledgedReceipt', 'The authorized recipient independently acknowledged receipt.']; break;
    }
    case 'observe_home': {
      const t = homePending(); require(!t.initiatorObserved, 'Driver observation is already recorded.'); t.initiatorObserved = true;
      event = ['DriverObservedReceipt', 'Driver recorded witnessing the authorized adult take custody.']; break;
    }
    case 'finalize_home': {
      const t = homePending(); require(t.initiatorObserved && t.receiverAcknowledged, 'The driver and the authorized recipient must both confirm the exchange.');
      require(s.passenger === 'onboard' && s.holder === 'driver', 'Home custody is already resolved.');
      t.status = 'confirmed'; s.passenger = 'delivered'; s.holder = 'recipient'; s.certainty = 'confirmed';
      event = ['HomeHandoffRecorded', 'Home handoff recorded with the authorized receiving adult.']; break;
    }
    case 'vehicle_check':
      require(s.passenger === 'delivered' && !s.vehicleChecked && s.certainty === 'confirmed', 'Resolve recipient custody before checking the vehicle.');
      s.vehicleChecked = true; event = ['VehicleChecked', 'Driver confirmed the final empty-vehicle check.']; break;
    case 'complete':
      require(s.trip === 'at_stop' && s.passenger === 'delivered' && s.vehicleChecked && !s.hold, 'Complete the verified handoff and empty-vehicle check first.');
      s.trip = 'completed'; event = ['TripCompleted', 'The school-to-home trip is complete.']; break;
    case 'revoke':
      require(s.permission === 'approved' && s.passenger !== 'delivered', 'There is no active pickup permission to revoke.');
      s.permission = 'revoked'; s.approvedRevision = null; s.assignmentRevision += 1;
      s.hold = 'Permission revoked. Alex Morgan is coordinating the next safe step.';
      if (s.schoolTransfer?.status === 'prepared' || s.homeTransfer?.status === 'prepared') {
        if (s.schoolTransfer?.status === 'prepared') s.schoolTransfer.status = 'disputed';
        if (s.homeTransfer?.status === 'prepared') s.homeTransfer.status = 'disputed';
        s.certainty = 'disputed';
      } else if (s.passenger === 'scheduled') s.pickup = 'held';
      if (s.passenger === 'onboard') s.trip = 'recovery';
      s.recovery = { reason: 'Permission revoked', owner: 'Alex Morgan', backupActivated: false };
      event = ['PermissionRevoked', 'Parent revoked permission. Existing custody is preserved; further release is blocked.']; break;
    case 'recipient_absent':
      require(s.trip === 'at_stop' && s.passenger === 'onboard' && !s.homeTransfer && !s.hold, 'Report absence before starting a physical handoff. For an uncertain exchange, report uncertainty instead.');
      s.trip = 'recovery'; s.recovery = { reason: 'Recipient absent', owner: 'Alex Morgan', backupActivated: false };
      event = ['RecipientAbsent', 'Recipient was absent. The child remains with the assigned driver; The coordinator owns recovery.']; break;
    case 'select_backup':
      require(s.trip === 'recovery' && s.recovery?.reason === 'Recipient absent' && s.passenger === 'onboard' && !s.homeTransfer && !s.hold, 'This recovery requires human reconciliation rather than a backup substitution.');
      // Backup is explicitly included in the exact parent-approved assignment, not a new driver/recipient grant.
      s.recipientId = assignment.backupId; s.recovery!.backupActivated = true; s.trip = 'at_stop';
      event = ['BackupActivated', 'Coordinator activated the recipient, the backup already included in parent approval.']; break;
    case 'uncertain': {
      const t = s.homeTransfer?.status === 'prepared' ? s.homeTransfer : s.schoolTransfer?.status === 'prepared' ? s.schoolTransfer : null;
      require(t, 'There is no open handoff to mark uncertain.');
      require(actor.role !== 'recipient' || (t === s.homeTransfer && actor.id === t!.recipientId), 'This receiving account cannot report for that handoff.');
      require(actor.role !== 'gate' || t === s.schoolTransfer, 'Gate staff can report only the school handoff.');
      t!.status = 'disputed'; s.certainty = 'disputed'; s.hold = 'Handoff needs reconciliation. Do not release again.';
      s.recovery = { reason: 'Uncertain physical handoff', owner: 'Alex Morgan', backupActivated: false };
      if (s.passenger === 'onboard') s.trip = 'recovery';
      event = ['CustodyDisputed', 'A participant reported uncertainty. A new handoff is blocked pending reconciliation.']; break;
    }
  }
  s.version += 1;
  return { state: s, event: { type: event[0], message: event[1], actor: actor.name, at: now, version: s.version } };
}
export function project(s: TripState, actor: Account, timeline: AuditEvent[]): Snapshot {
  authorize(actor, s);
  const assignment=assignmentFor(s.id);
  const isSchool = actor.role === 'teacher' || actor.role === 'gate';
  const showChild = actor.role !== 'driver' || s.accepted;
  const activeRecipient = actor.role !== 'recipient' || actor.id === s.recipientId;
  const allowed = actions.filter(action => { try { transition(s, actor, action); return true; } catch { return false; } });
  return {
    account: actor, tripId: s.id, generation: s.generation, version: s.version, serverTime: new Date().toISOString(), demoTime: s.demoTime, serviceDate: s.serviceDate,
    child: showChild ? assignment.child : 'Assigned student', school: actor.school, assignment: {...assignment,child:showChild?assignment.child:'Assigned student',destination:isSchool||!showChild?'':assignment.destination,recipientId:isSchool||!showChild?'':assignment.recipientId,backupId:isSchool||!showChild?'':assignment.backupId,parentId:isSchool||!showChild?'':assignment.parentId},
    driver:personName(assignment.driverId), vehicle:`${assignment.vehicle.color} ${assignment.vehicle.model} · ${assignment.vehicle.plate}`,
    ...(!isSchool && (actor.role !== 'driver' || s.accepted) ? { destination:assignment.destination, recipient:personName(s.recipientId) } : {}),
    assignmentRevision: s.assignmentRevision, permission: s.permission, accepted: s.accepted, pickup: s.pickup, visit: s.visit, trip: s.trip, passenger: s.passenger,
    holder: s.holder === 'school' ? actor.school : s.holder === 'driver' ? personName(assignment.driverId) : isSchool ? 'Authorized receiving adult' : personName(s.recipientId),
    certainty: s.certainty, hold: s.hold, recovery: s.recovery,
    schoolTransfer: actor.role === 'gate' || actor.role === 'driver' ? s.schoolTransfer : null,
    homeTransfer: (actor.role === 'driver' || actor.role === 'recipient') && activeRecipient ? s.homeTransfer : null,
    availableActions: allowed,
    timeline: timeline.map(e => isSchool && /Home|Recipient|Backup|VehicleChecked/.test(e.type) ? { ...e, message: 'Transport team updated the receiving process.', actor: 'Transport team' } : e),
  };
}
export function scenarioSteps(scenario: Scenario): [string, Action][] {
  if (scenario === 'normal' || scenario === 'queue') return [];
  const steps: [string, Action][] = [['parent-a','approve'],['driver-a','accept'],['driver-a','approach'],['teacher-a','ready'],['driver-a','request_arrival'],['gate-a','confirm_arrival'],['gate-a','queue'],['gate-a','bay'],['gate-a','at_bay'],['gate-a','prepare_school']];
  if (scenario === 'pending') return steps;
  steps.push(['gate-a','observe_school'],['driver-a','acknowledge_school']);
  if (scenario === 'before-release') return steps;
  return [...steps, ['gate-a','finalize_school'], ['driver-a','depart'], ['driver-a','arrive_home']];
}
export function fixtureActor(id: string) { const a = accounts.find(a => a.id === id); if (!a) throw new DomainError(400, 'INVALID_ACCOUNT', 'Choose a listed demo account.'); return a; }
