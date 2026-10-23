import type { Role, Snapshot } from '@pick/contracts';
// English review copy is kept separate so later Spanish translation does not alter domain commands.
export const roleHeadings: Record<Role,string> = { parent: 'A clear path home.', driver: 'Your afternoon route.', teacher: 'Ready for a good goodbye.', gate: 'Every handoff, accounted for.', recipient: 'A warm welcome home.', support: 'Keep the next step safe.' };
export function nextStep(s: Snapshot): string {
  if (s.certainty === 'disputed') return 'The physical handoff needs reconciliation. Keep the child supervised; Alex Morgan owns the next step. This demo does not provide an emergency service.';
  if (s.hold) return 'This pickup is on hold. No new handoff can be recorded. The last confirmed custody record stays visible.';
  if (s.trip === 'completed') return 'Both custody transfers and the final vehicle check are recorded. Everyone is looking at the same completed trip.';
  if (s.recovery && s.trip === 'recovery') return 'The child remains with the assigned driver. Alex Morgan can activate the backup already approved by the parent.';
  if (s.passenger === 'delivered') return 'The receiving adult has confirmed custody. The driver still needs to check the vehicle and close the trip.';
  if (s.homeTransfer) return 'The driver and the authorized recipient each confirm their own part of the exchange. A driver’s tap alone cannot complete delivery.';
  if (s.trip === 'at_stop') return 'Arrival is recorded. The child remains with the assigned driver until an authorized adult receives them.';
  if (s.trip === 'in_transit') return 'The simulated trip is underway. No live position is collected. The driver’s next action is after parking at home.';
  if (s.passenger === 'onboard') return 'School release is recorded. The driver may depart after checking the child and manifest.';
  if (s.pickup === 'release_pending') return 'Keep the vehicle at the bay. Gate staff and the driver must submit their own boarding observations before release is recorded.';
  if (s.permission === 'awaiting_approval') return `${s.account.name} reviews the exact driver, vehicle and receiving adults before approving this pickup.`;
  if (!s.accepted) return 'Parent permission is recorded. The driver can now accept this exact assignment.';
  if (s.visit === 'at_bay') return 'Match the child, assigned driver and vehicle in person before preparing the school handoff.';
  if (s.visit === 'waiting') return 'Gate staff call the vehicle forward only when the child is ready and the bay is available.';
  return 'Teacher readiness and the gate’s physical vehicle check bring this pickup together. Each adult sees their own next action.';
}
