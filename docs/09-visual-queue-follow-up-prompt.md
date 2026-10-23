# PICK POC 2 — Visual gate queue, arrival check-in and classroom order

Extend the existing PICK Expo POC in this same implementation task. Build the feature end to end; do not replace the working app with a visual mock. Use the Expo iOS development and Impeccable skills, plus an asset skill only where useful. Preserve the local-only workflow, Expo Go review, existing custody safeguards and original school-to-home journey. No GitHub repository, cloud backend or public deployment in this phase.

Read PRODUCT.md, DESIGN.md, the current runbook/validation documents and the queue/custody contract before editing. Inspect current code and installed types. Current versions include Expo 57.0.27 and Expo Router 57.0.25. Keep compatible versions unless a demonstrated blocker requires a change.

## Product idea

The gate coordinator's main screen should be a simple visual representation of the actual line of vehicles approaching the pickup bay. The coordinator looks at the real cars, recognizes them in the app by vehicle appearance and driver portrait, and corrects their queue positions by dragging them.

Driver announcement times are only an initial ordering hint. They do not reliably establish physical order. Once the coordinator confirms or corrects positions, that committed queue becomes the shared order used to prepare students in classrooms.

The central demo is: several drivers announce arrival, a coordinator recognizes that the physical order differs, moves a car, and a teacher on another device immediately sees the corresponding change in student preparation order.

## 1. Gate coordinator: the visual vehicle lane

Make the traffic view the primary gate workspace, with a clearly marked pickup bay at the front and numbered vehicle positions extending behind it. Use a clean schematic lane, not a geographic map or elaborate traffic simulation. Start with one school, one active lane and one bay; structure identifiers so later lanes are possible without building a multi-lane traffic editor now.

Represent each vehicle with:
- A locally bundled vehicle image/illustration matching the fixture's body type and color, plus explicit make/model and color text.
- A visible driver portrait/avatar thumbnail and driver name.
- An identifiable plate label and queue position.
- Written status such as arrival announced, physically confirmed, waiting, student not ready, held, or at bay. Do not rely on color alone.
- Concise readiness information relevant to the coordinator.

Use appropriately sourced/local assets. For synthetic fixture drivers, use clearly synthetic portraits; use imagegen if producing those raster assets. Representative vehicle artwork must not falsely claim to be a photograph of the actual vehicle. Missing images get a legible fallback; identity and plate remain readable.

Keep recently announced, unconfirmed vehicles in an obvious arrivals area next to the confirmed lane. Their arrival appears automatically after the server accepts the driver's check-in. The coordinator can physically match the car, confirm arrival, and place it at its observed position. A confirmation action may accept a default position; drag then corrects it. Dragging alone must not silently claim identity was verified.

Tap or click a vehicle to inspect details and the existing handoff actions. Desktop hover/focus may show a lightweight preview; touch users must have equivalent information through tap and a sheet. Essential identification must not exist only on hover.

Support drag using mouse and touch, with a clear drag handle, visible insertion indicator, bounded auto-scroll and stable selection. Provide Move forward / Move back or Move to position as keyboard and screen-reader alternatives. An accessible reorder announcement should state the new position.

The visual move corrects the recorded physical order. It does not instruct a driver to overtake another car. Keep bay/call-forward as distinct actions. A vehicle at bay or with an active handoff is locked against ordinary queue reordering; holds remain visibly in their physical position until staff records an actual exception-area move. Do not automatically remove a held car as if the obstruction disappeared.

## 2. Driver: location-qualified arrival announcement

On an accepted active assignment, show one clear button: “I'm here — parked.” Explain when it is unavailable.

Add a pickup-zone configuration with center coordinates, radius in meters and version. The user selected a 100-meter radius for this demo. Use that as the initial value and keep it configurable per pickup zone; this selection is not field validation of an operating distance. The zone must represent an approved waiting/check-in area, not imply the driver must stop at a dangerous exact point.

Use expo-location foreground permission and a fresh foreground position for eligibility. Request access in context when the driver chooses arrival check-in, not on every role's launch. Do not add background tracking or automatic continuous surveillance.

Evaluate proximity on the server against server-owned zone settings:
- Validate coordinate bounds, sample timestamp, horizontal accuracy, current session/assignment and appropriate trip state.
- Compute distance server-side; do not accept a client boolean claiming “inside zone.”
- Define and document provisional freshness/accuracy thresholds and boundary handling. Unknown, stale or poor-accuracy location must not appear confidently inside.
- Recheck on button press, even if the screen previously showed eligible.
- Keep repeat taps idempotent: one arrival announcement/active visit, not duplicate cars.
- Show specific outside-zone, permission-denied, locating, inaccurate, network-error and announced states.
- Do not reject an already accepted arrival or reshuffle the queue simply because later GPS jitters or permission changes.

GPS is a proximity signal, not proof of the driver's identity, exact lane, physical queue order or custody. A nearby signal alone should not confirm arrival. For this phase, actual driver announcement remains explicit; automatic detection can suggest “You can check in now.”

Support a separate gate-recorded manual arrival when staff physically sees the vehicle but the driver's location is unavailable. This requires a gate identity, a reason and an audit event. It does not grant the driver an unrestricted outside-zone bypass or skip the existing release checks.

For local testing away from a school, provide explicit Demo tools to configure a synthetic zone, select deterministic inside/outside/stale/poor-accuracy samples, and optionally set the DEMO zone to the reviewer's current location after an explicit action. Label simulated samples and events. Keep real foreground measurement and simulated inputs separate. Do not automatically collect a reviewer's home location as a school setting or put real coordinates in committed fixtures/logs. Do not expose raw driver coordinates in teacher views.

## 3. Classroom teacher: the same queue expressed as student order

Show the teacher's assigned students in the order of their vehicles in the coordinator's committed queue. Show both the vehicle queue position and a compact class-specific sequence where helpful, so gaps caused by other classrooms are understandable.

Use student name, readiness/hold state, relevant vehicle identifier and a clear next action. Do not expose unrelated classrooms' student names, parent contacts, home destinations or full driver location. Unconfirmed announcements belong in “Arrival pending,” not the confirmed dispatch order.

A coordinator reorder must update this teacher view through the shared server state and existing polling, without a manual refresh. Indicate that the order changed without jumping the teacher's focus or interrupting an action. Preserve already-recorded readiness, call-forward, dispatched and custody state.

Queue order determines preparation priority. It never means children are automatically released or should walk unsupervised to the gate. Retain explicit teacher readiness and gate call-forward checks. A held or unready child must remain visibly blocked even when their car reaches the front.

If supporting sibling fixtures, keep each child's readiness and custody separate and share one vehicle visit. Otherwise document sibling support as deferred; never create duplicate car entries for one vehicle.

## 4. Implement a real shared multi-vehicle queue

The current POC has a single active trip per school and hard-coded person/vehicle strings. Refactor the actual server contracts, fixtures, storage, projections and UI to support multiple independently assigned trips in one dismissal session. Do not create five client-only clones of trip-a.

Seed at least five distinguishable vehicles/drivers with corresponding children, assigned parents/recipients, at least two classrooms, and a second school for isolation tests. Include same-color vehicles differentiated by model/plate, an unready student and a held pickup. Preserve the original complete one-child journey as a regression scenario.

Important existing limitation: authorize() currently checks school equality. Before introducing multiple families, enforce relationships within a school: parent-to-child/trip, driver-to-assignment, teacher-to-classroom and recipient-to-authorized handoff. A driver must not acknowledge another driver's trip; a parent must not approve another family's trip. Gate access stays scoped to the assigned school/session. Apply checks to snapshots, commands, queue projections and receipt lookup.

Store the queue as a session-scoped ordered collection of vehicle visit IDs with its own revision. Keep arrival-request time, physical-confirmation time and coordinator order distinct. Use server timestamps with a deterministic tie-breaker for initial suggestions.

Gate reorder commands must include session, current queue revision, moved visit and intended placement (or an equivalent validated complete permutation), plus idempotency key. Validate authorization, membership, duplicates, missing visits and locked states. Commit the order and audit event atomically. Record the actor and previous/new order or sufficient reconstruction data.

New arrivals should not overwrite a manually corrected order. Define how appending an arrival changes the queue revision. If another gate device edits the queue or a new arrival changes it during a drag, preserve the current visual drag until drop, reject/reconcile stale intent and offer an explicit retry after refresh. Do not silently overwrite the other coordinator or lose a vehicle. Persist queue order across server restart.

Local drag feedback can preview a move, but distinguish it from committed state. Other roles see committed order only. Handle rejected moves, uncertain responses through receipt lookup, offline state and reconnect without blind replay. Preserve active selection and scroll position during polling.

## 5. Native iPhone navigation and Liquid Glass

Improve the bottom navigation using system-native iPhone components where supported by this installed SDK. Keep the gate queue as the main Today/Queue destination, with Timeline and Demo tools reachable.

For SDK 57, investigate expo-router/unstable-native-tabs and the supported minimizeBehavior="onScrollDown" option. Prefer native tab behavior and system material over a hand-built translucent web-style bar. Native minimization should respond to scrolling, not to dragging a car. Do not forcibly shrink labels or touch targets.

Use the platform's native Liquid Glass appearance where available. If an additional glass component is useful, use compatible expo-glass-effect with availability guards and Reduce Transparency support. Keep operational vehicle cards and text readable; glass is primarily navigation chrome, not a reason to make the entire traffic view transparent.

Use platform-specific navigation components so Android and web retain appropriate functional fallbacks. Respect safe areas, Dynamic Type, Reduce Motion, contrast and the existing 48-point interaction target convention. Ensure bottom content is not covered by the tab bar and that native back/sheet behavior works.

Preserve Expo Go compatibility. Do not upgrade the SDK merely for appearance or launch an EAS build as a side effect. If a desired native feature needs a different runtime, ship the working fallback and document the exact limitation. Native appearance requires phone verification; a browser screenshot or successful iOS JavaScript export does not prove Liquid Glass rendered.

Current primary references, to verify against installed exported types:
- https://docs.expo.dev/router/advanced/native-tabs/
- https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/
- https://docs.expo.dev/versions/v57.0.0/sdk/location/

## 6. Acceptance and handoff

Demonstrate on independent sessions:
1. A driver outside the zone cannot self-announce; a fresh inside-zone sample enables the action.
2. The accepted announcement adds one visible car to the gate's arrivals area.
3. Gate confirms physical arrival and positions several cars.
4. Coordinator moves position 5 to position 2; the teacher's relevant student list follows the committed order, and the driver sees only their own status/position.
5. Repeated check-in, stale location, simultaneous reorder, arrival during drag, offline/reconnect and lost response behave correctly.
6. At-bay/open-handoff vehicles cannot be casually reordered; a held/unready student's position never bypasses release checks.
7. Same-school unrelated accounts and School B cannot read or mutate unauthorized trips, queue data or receipts.
8. Normal verified school/home handoffs still pass existing regression tests.
9. Queue survives restart, and deliberate demo reset invalidates old sessions/commands appropriately.

Run typecheck, lint, relevant transactional API/client tests, Expo compatibility checks and web/iOS JavaScript exports. Test server rejection by sending requests directly; disabled buttons alone are not evidence. Inspect desktop and narrow/touch layouts. Add an honest physical-phone checklist for drag interaction, foreground location permission, tab minimization, glass availability, safe areas and accessibility; do not claim checks not performed.

Update the runbook, validation record, design context and POC deviations. Keep existing shared demo state where possible; do not silently reset the reviewer's afternoon when introducing fixtures. Provide a safe explicit migration/reset route.

Finish with the working local preview, current Expo connection details, a short driver → gate → teacher walkthrough, test results, and a clear distinction between simulated arrival evidence and actual foreground device location. Keep this bounded to the requested queue, arrival, classroom synchronization and native navigation features.
