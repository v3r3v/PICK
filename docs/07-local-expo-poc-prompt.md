Build PICK's first runnable local proof of concept now, using the planning package you created in this task. The user has asked the coordination task to review your output, prepare local development, and supply the first POC prompt. They explicitly require Expo so they can review it and no GitHub repository for this phase. Continue in this existing task and workspace; do not create another task.

Read README.md and docs/01 through docs/06 before implementation, especially the state contract, architecture and B01-B06. Read applicable AGENTS.md. Apply the expo-ios-development and impeccable skills as relevant. This is implementation work: build, run, test and leave a working local preview, not another planning-only response.

Working directory: C:/Users/joser/OneDrive/Documents/ChatGPT/PICK
Coordination task: 01a11df8-7b52-7340-897c-a683583a4fc6

Confirmed local preparation:
- The repository contains only the planning README and six documents.
- Windows PowerShell; Node v24.18.0 and npm 11.17.0 are installed and callable.
- Existing local Git metadata has no commits and no configured remote. Preserve it; do not create a GitHub repository, remote, PR, push, hosting project or cloud database.
- docker and psql were not found on PATH. Do not make Docker, WSL or a global database installation a prerequisite for this POC.
- Recheck ports and runtime compatibility before using them; no preview has been started by the coordination task.

POC outcome:
I should be able to run the application locally, open it in Expo Go on an iPhone or Android phone, open a second view on the computer, and complete a synthetic student pickup and home handoff while both devices observe the same server-backed trip. It must also be fully reviewable using separate desktop browser sessions if phone access is not available to you. A single-device mock with independent state per role does not meet this goal.

Implementation scope and deliberate simplifications:
1. Use TypeScript, Expo Router and a currently Expo Go-compatible Expo SDK, verified from official Expo documentation at implementation time. Pin compatible dependencies and keep a lockfile. Use npx expo install for SDK-managed dependencies. Read matching SDK docs and https://docs.expo.dev/llms.txt. Avoid custom native modules, background location, EAS builds and account/provisioning setup in this POC.
2. One Expo app should cover native and responsive web for this phase. Defer the separate Next.js dashboard from D05. Use task-focused navigation and distinct parent, driver, teacher, gate and recipient experiences inside this app.
3. Implement a small local Node/TypeScript API with SQLite persistence, explicit transactions, server-side role/resource checks, versions and idempotency receipts. Choose a library supported by the installed runtime and verify it. Keep the command service and storage adapter separable. SQLite is a POC convenience, not a replacement decision for the planned PostgreSQL/Supabase architecture. Do not claim local tests establish PostgreSQL locking, RLS, production authentication or the full B01-B06 acceptance criteria.
4. Use server-backed demo sessions for fixed synthetic identities. A labeled demo account picker is acceptable as the entrance; never present it as production login or verified identity. The server issues an opaque, expiring session bound to that fixture identity and derives the actor from it, not from command body role/user fields. Enforce resource boundaries in reads and mutations. Demonstrate at least two schools with unrelated identities for isolation tests. Prevent stale requests/subscriptions from a previous session from updating a newly selected account. Keep demo token handling simple and scoped; no real credentials.
5. Use WebSocket generic invalidation plus authorized snapshot fetch, or authorized polling if it is materially simpler. Aim for a measurable foreground connected-view refresh within two seconds under local test conditions; report actual evidence, not an untested guarantee. Polling must be labeled honestly in implementation documentation. Show last refresh and disconnected state, refetch on reconnect/foreground, disable custody-changing actions while offline, and never queue a release/delivery for blind replay.
6. Use synthetic fixtures only: one visible school, one child, parent, assigned eligible driver/vehicle, teacher, gate adult, named recipient and preapproved backup recipient. A second school exists for isolation checks. Keep eligibility and guardian verification as seeded demo facts, clearly identified as such. The reviewer must be able to switch accounts or open different accounts on different devices without resetting the shared trip.
7. Persist the trip across server restarts. Provide an explicit local-only reset/seed command and one-click demo scenarios with a confirmation if resetting affects all connected reviewers. Reset must invalidate stale sessions/versions or otherwise ensure old in-flight commands cannot mutate the new scenario.

Build this end-to-end journey:
- Parent sees the synthetic child, named driver/vehicle, school, dated service window, destination and recipient, then approves that exact assignment revision.
- Driver accepts the approved assignment and begins approach while parked.
- Teacher marks the child present/ready.
- Driver requests arrival; gate confirms arrival, queues the visit, assigns the available bay and prepares the school handoff only when checks pass.
- Gate and driver submit their own separate observations/acknowledgements. Finalization records exactly one release and updates per-child custody only after both are present. No actor may attest for the other.
- Driver departs, arrives and parks at the synthetic home.
- Driver prepares home handoff; the named receiving adult acknowledges receipt using their own scoped session; driver finalizes. A driver's tap alone cannot mark delivery.
- Trip completes after custody is resolved and the final vehicle check is recorded. Each role sees its permitted timeline and a clear next action.

Preserve these behavioral invariants from docs/02:
- Distinguish permission, pickup readiness, vehicle visit, trip, passenger and custody state. Do not collapse all into a single freely editable status.
- Permission changes invalidate the affected revision; no automatic substitution.
- Revoke-before-release blocks release. Revocation during a pending transfer preserves uncertainty and blocks another release. Revocation after release creates intervention rather than erasing the driver as recorded holder.
- Keep prepared/pending transfer visible; do not silently reset on timeout.
- Absent recipient does not complete delivery. Open a recovery state with a named demo owner. Support a small explicit recovery path to the preapproved backup recipient with separate acknowledgement; preserve the actual custody trail.
- Same command/key produces one result; a reused key with a changed payload fails. Different competing keys cannot produce duplicate release. State/version conflicts explain what changed and refresh the current authorized record.
- If the server committed but the response was lost, look up the command receipt; do not infer failure or blindly resubmit.
- Authority checks apply to API reads, mutations and receipts; no school-wide broadcast containing private trip fields.
- Append audit events in the same transaction as state changes. Do not call the local audit tamper-proof.
- Seed live-looking data from a resettable demo clock/current service date so the POC does not expire merely because it is reviewed tomorrow.

Reviewable scenarios:
A. Normal school-to-home journey, using independent role sessions.
B. Permission revoked before release: gate and driver see a hold; no release occurs.
C. Duplicate/concurrent finalize requests: one release and one custody event.
D. Recipient absent: no delivered state, followed by a verified backup handoff.
E. Disconnection then reconnection: stale status is visible and a fresh snapshot restores agreement.
F. Lost command acknowledgement and pending-transfer uncertainty: receipt resolution or disputed state, never a second release.

Product experience:
Make this feel like a coherent early PICK product, not a developer control panel. Prioritize a readable journey, identity, next action, custody status and freshness. Use a restrained visual system, accessible contrast, native-feeling controls, safe areas, at least 44-point targets, scalable text, clear navigation and helpful error states. Mobile should work at narrow widths; desktop may use a wider operational layout. Use a small role-specific navigation set. Keep technical IDs, raw event JSON, fixture reset and scenario controls in a clearly separated Demo tools area. A compact Demo label is enough in ordinary flows. Avoid fake performance statistics, fabricated reviews or decorative map tiles pretending to be live tracking. A simple illustrated route/progress view is acceptable if labeled simulated. No child photographs needed. Use English copy initially and organize it for later Spanish localization; this is a provisional review choice, not a change to Puerto Rico market assumptions.

Out of scope:
Payments; public signup/driver onboarding; actual background GPS; speed-limit providers or speeding judgments; push notifications; production identity proofing; live child information; cloud services; app-store publishing; real transportation. Do not add hollow screens for all of these. Preserve the original planning files and distinguish remaining pilot requirements from features implemented here.

Local developer experience:
- Prefer npm workspaces with apps/mobile, apps/api and only useful shared packages; do not scaffold unused worker/Next.js/Supabase apps.
- Provide install, dev, dev:lan, seed/reset, typecheck, lint, test and export commands as appropriate. Keep the startup process easy to repeat on Windows.
- Bind normal development to loopback. Provide an explicit LAN mode for phone review of this synthetic demo; no port forwarding or public tunnel by default. Keep the database private/local and do not change firewall settings automatically.
- A physical phone cannot call the PC's localhost. Print the actual LAN API URL and Expo URL/QR, configure EXPO_PUBLIC_API_URL with non-secret connection information, and show an actionable connection error if it is wrong.
- Explain that an Expo Metro tunnel would not also expose the separate API. Verify current Expo Go iPhone account requirements from official docs, report any user sign-in action precisely, and never request account passwords.
- Check existing server processes/ports, reuse where possible, and run background helpers hidden on Windows. Do not terminate unrelated services.
- Add suitable .gitignore rules for node_modules, .expo, generated bundles, local environment files, SQLite database/WAL files and logs. Keep .env.example free of secrets and real data.

Validation and completion:
Run TypeScript, lint, Expo dependency/doctor checks, meaningful domain/API tests using the actual local persistence adapter, and separate iOS JavaScript and web exports. Exercise the normal journey and key exception scenarios with independent sessions; test role spoofing, cross-school read/mutation/receipt access, stale versions, duplicate commands, restart persistence and reconnect. Inspect the browser UI at phone and desktop sizes and fix material usability issues. Report failed and unrun checks explicitly; web or iOS bundle success is not physical iPhone testing.
Provide a concise local runbook with exact PowerShell commands, actual ports, Expo Go QR/URL instructions, same-network requirements, demo accounts, a 5-10 minute walkthrough and reset procedure. Record POC deviations and a truthful B01-B06 coverage matrix in docs; PostgreSQL tests and native background tracking remain deferred. Update README to link the app, runbook and original plans without erasing their status.
Finish with a running local preview if possible, the quickest way for the user to open it, tests performed, what remains simulated, and any phone-only step the user must do. Continue autonomously through ordinary setup and fixes within this scope.
