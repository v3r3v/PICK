# POC evidence and remaining scope

Historical POC 1 evidence. [POC 2 validation](10-queue-validation.md) supersedes the single-vehicle, browser-size and no-location limitations described here where explicitly noted.

Checked locally on Windows with Node 24.18.0. This document distinguishes the runnable synthetic slice from the broader acceptance criteria in docs 01–06.

## Results

- TypeScript and ESLint passed after the browser fetch binding correction.
- All 16 automated tests passed against actual temporary SQLite databases and local HTTP listeners. A fresh run measured foreground two-client convergence at **1,037 ms** with one-second polling. This is local evidence, not a phone, WAN or load SLA.
- Expo install alignment passed; Expo Doctor passed **21/21** after deduplicating SDK-compatible native dependencies.
- Web and iOS JavaScript/Hermes exports passed. No native iOS compile, signing, physical-device accessibility, background execution or Android emulator certification is claimed.
- Browser account selection loaded the authoritative trip successfully. Desktop 1279×609 and narrow 795×630 layouts were captured. Browser viewport overrides did not produce the requested 390-pixel viewport; phone-size and native checks remain explicitly unverified. Screenshots are in `.impeccable/review`.
- Fresh Impeccable reviewer returned a scoped **ship** verdict after scoring three fixes resolved: compact parent plan precedes approval, desktop flex proportions no longer stretch stacked sections, and demo switches have full-row accessible targets. This is a verdict on those browser fixes, not native certification.
- LAN health and Metro status responded on 192.168.86.28 ports 4100 and 8081. A phone QR was supplied. The user is performing the physical-device review; successful native operation must be confirmed separately.
- The running LAN Metro process subsequently served the iOS development bundle (initial bundle about 10.2 seconds, later incremental bundles 58–62 ms). This establishes a native bundle request reached the server; it does not establish a completed native workflow or visual/accessibility pass.
- `npm audit` still reports **51 advisories: 9 moderate and 42 high**, including transitive/metavulnerability entries. Compatible `npm audit fix` was tried; remaining suggested remedies included incompatible Expo/router changes. No `--force` downgrade/upgrade was applied. This dependency risk is unresolved and must be reviewed before any broader distribution.

## What the tests establish

Normal end-to-end role transitions; separate two-party school and home evidence; mandatory final vehicle check; opaque session expiry; per-account idempotency receipts; same-key changed-payload rejection; different-key duplicate finalization rejection; stale-version rejection; before/during/after school-release revocation; preapproved backup identity; indefinite uncertainty blocking; cross-school reads/commands/receipts; same-school receipt ownership; teacher field filtering; reset generation/session invalidation; persisted receipts after database reopening; rollback of state, audit and receipt on injected SQL failure; HTTP role spoof/CORS checks; concurrent finalize attempts through two HTTP servers using independent connections to one SQLite database; lost-response recovery without replay; reconnect and delayed old-session isolation.

The two SQLite connections are in one test process, not a multi-host database benchmark. The server computes available actions through the same domain guards it uses for writes. UI observations are statements by synthetic actors; no real identity, vehicle, child or physical custody is independently verified.

## B01–B06 coverage

| Backlog | Implemented synthetic evidence | Still outside this POC |
|---|---|---|
| B01 | Shared typed states; school A journey; separate school B fixture; reproducible seed/scenarios | Full normalized relational model, migrations, impossible multi-child relationships, operations threat review |
| B02 | Fixed actor selection issues opaque hashed-token sessions; server roles/school scopes; resource authorization; read projections | Production login, guardian verification, scoped duty/case grants, role-revocation propagation, private document storage/RLS |
| B03 | Exact fixture approval and driver acceptance; assignment revision; revocation guards | Editable assignments, vehicle substitutions, real clock policy expiry, eligibility checks, overlapping seat/driver capacity and sibling rules |
| B04 | Readiness/visit/queue/bay distinct from custody; paired school observations; transactional one-release invariant; audit and receipts | Multi-vehicle bay contention, full manifest/sibling workflow, operational identity challenges and notification outbox |
| B05 | Paired home acknowledgement; wrong-recipient rejection; absent-recipient case owner; preapproved backup; vehicle check | Real identity challenge expiry/replay, alternate site/return workflow, coordinator reconciliation and production emergency operations |
| B06 | Role snapshots, versions, freshness, polling, receipt lookup, offline command disable, session/reset isolation | WebSockets/private invalidation, durable notification outbox, push, background delivery, multi-device loss testing under real networks |

These rows are partial coverage, not completion of the original pilot acceptance gates.

## Deliberate architecture deviations

One Expo Router client replaces the proposed separate Next.js school/admin surface for this review. A local Node API and SQLite replace Supabase/PostgreSQL. The domain transition module is separate from the SQLite transaction adapter; stored trip JSON favors a small executable slice over the future normalized schema. `BEGIN IMMEDIATE`, optimistic versions and unique release audit indexes enforce authoritative local writes. This does not demonstrate PostgreSQL row locks or RLS.

Polling replaces realtime subscriptions. Each session has its own in-memory client; the database is the shared source of truth. Web uses a fixed same-origin Metro proxy; native uses the LAN API directly. Demo controls permit fixed-role selection and fault injection, so the service is intentionally unsuitable for untrusted networks. Audit rows are appended by application code in the state transaction; the SQLite file is not tamper-proof.

Only one student/vehicle trip is operated end to end. School B exists to exercise isolation, not a second full staffed school workflow. Approval authorizes a seeded fixed recipient set including the backup; the coordinator cannot add a new adult. Real clock expiry, onboarding, operational licensing, legal compliance, capacity, emergency procedures, payments, real tracking and traffic outcomes remain unimplemented or unvalidated.

No GitHub remote, public deployment, cloud database, actual transport enrollment, firewall change or real data was created.
