# Decision register, questions and evidence

Prepared 8 October 2026, America/La_Paz (research session crossed into 9 October UTC). This package is for the project coordination task **Define PICK school pickup app**, ID `01a11df8-7b52-7340-897c-a683583a4fc6`.

## Decision status

User direction is described in document 01. Every item below is **proposed**, pending discussion; none has been silently promoted to a user-approved requirement. Later tasks should update this register when decisions are accepted or superseded, citing the decision source/date and affected contract/backlog items.

| ID | Proposed decision | Tradeoff and reason to revisit | Impact |
| --- | --- | --- | --- |
| D01 | Scheduled one-school pilot with small vetted pool; prefer suitable existing operator partnership | Less marketplace flexibility; revisit after supply, insurance and support model are proven | B03, B08, Q02–Q03 |
| D02 | Exact dated assignment approval per child; no automatic replacement; changed driver/vehicle/destination/recipient rules require fresh approval | More parent actions; recurring scopes may later reduce burden without allowing silent substitutions | B03, T03 |
| D03 | Verified adult handoff at both ends; custody separate from trip/queue; uncertain transfer blocks new release | More handoff time; physical identity and recipient availability must work in practice | B04–B05, T05/T08, Q01/Q04 |
| D04 | First pilot supports siblings to one household; defer multi-household pooling | Simpler home handoff and privacy, but limits vehicle-volume benefit; traffic reduction may initially come only from queue time | B11/B14, traffic metrics |
| D05 | Expo/React Native + Next.js + PostgreSQL/Supabase, central transactional commands | Requires SQL/concurrency expertise; revisit for demonstrated team constraints, not brand preference | B01–B07, doc 03 |
| D06 | Realtime is generic per-user invalidation; sensitive state always fetched under current authority | Extra reads and modest latency, but avoids sensitive data on channels with cached permissions | B06, T04/T06 |
| D07 | No automatic offline custody authorization; manual procedure and explicit reconciliation | Outages slow release; requires staffing and trusted alternate communications | B10, T11 |
| D08 | Ratings, allegations, findings and telemetry are separate; human permanent-removal decisions | Review staffing cost and slower final judgments; urgent protective suspension remains available | B09, T10/T13 |
| D09 | Speed analysis in shadow mode after license/coverage/device validation | Cannot market validated speed alerts at launch; preserves truthful safety claims | B13 |
| D10 | Measure school-wide congestion and per-child custody outcomes against baseline | Adds observation work; cannot claim effectiveness from booking volume or app adoption alone | B11–B12, metric plan |

## Material open questions

Resolve these in coordination without blocking synthetic engineering. Owners below are suggested responsibilities; no person has been appointed or contacted.

| ID / question | Provisional working assumption | Who resolves / when needed | What changes with answer |
| --- | --- | --- | --- |
| Q01: What student ages and assistance needs are in scope? | School-age minors, adult receipt, no student accounts; only children whose required restraints/support are explicitly available | Founder + school + qualified advisers; before vehicle/eligibility policy or enrollment | Vehicle type, training, assistance, capacity and permitted handoff |
| Q02: Exact market, municipality and school type? | Puerto Rico likely; one school; locale/time zone configured, not hard-coded | Founder + prospective school + local counsel; before regulatory/vendor/coverage commitments | Transport classification, privacy agreements, language, road data, operating hours |
| Q03: Who operates transport and bears each duty? | Partner with a qualified existing operator if feasible; PICK coordinates and records; liability allocation remains unresolved | Founder + operator + counsel/insurer; before driver recruitment or paid service | Partner/employment model, insurance, screening, dispatch, support, contracts and economics |
| Q04: Who may receive a child and what happens if nobody is present? | Verified named adult or preapproved backup; no unattended home drop; confirmed staffed return location | School + guardian policy + operator + safety lead; before real transport | Recipient enrollment, waiting/escalation policy, recovery routes and supervision coverage |
| Q05: Who pays whom, and how? | Manual/commercial arrangements outside the synthetic app; compare school-funded contract and parent-paid scheduled rides | Founder + finance/counsel; before a commercial pilot | Billing, refunds, payouts, taxes, marketplace obligations and sustainability |
| Q06: Actual pilot capacity and staffing? | Synthetic fixture cap: one school, five drivers, twenty children, one household destination per run | School + operator + support lead; before live gate | Bay count, arrival windows, maximum ride time, support coverage, performance/load criteria |

After these answers, approve a pilot policy package: authority verification, substitute handling, handoff evidence, outage/manual control, escalation, retention, restrictions/appeals and measurable exit criteria. Do not turn unresolved policies into default database booleans that allow a live pilot to start.

## Evidence register

Current primary documentation was checked during this planning session. Sources support the narrow facts listed, not PICK's product-market fit, legal compliance, tested performance or safety efficacy. Engineering and operating proposals in the other documents are recommendations derived from the supplied requirements and identified failure cases.

| Source | Narrow relevance / unresolved limit |
| --- | --- |
| [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) and [Expo documentation index](https://docs.expo.dev/llms.txt) | Background/lifecycle constraints and configuration; actual device/route performance remains untested |
| [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) | Native credential-storage option; not a substitute for server authorization |
| [Android background location](https://developer.android.com/develop/sensors-and-location/location/background) | Platform background-location constraints; no universal uninterrupted tracking guarantee |
| [Google Roads speed limits](https://developers.google.com/maps/documentation/roads/speed-limits) | Data accuracy, license and variable-limit caveats; pilot coverage/licensing/applicable school-zone limits not verified |
| [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security) | Database exposure, grants, RLS and bypass risks; secure PICK policies not yet implemented |
| [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization) | Private channels and cached access policy behavior; motivates generic invalidation design |
| [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html) | Transaction lock semantics; application lock discipline and race tests still required |
| [Firebase transactions](https://firebase.google.com/docs/firestore/manage-data/transactions) | Credible alternative with atomic transactions/retries and offline limitations |
| [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication) | Authorization at server/data boundaries; chosen runtime/version must be pinned and tested later |
| [Puerto Rico NTSP](https://ntsp.pr.gov/Pages/default.aspx) | Official starting point for jurisdiction review, not a conclusion on applicable permits |
| [U.S. Department of Education: school officials](https://studentprivacy.ed.gov/faq/who-school-official-under-ferpa) | Conditions on the school-official disclosure route; school/model applicability needs qualified review |
| [FTC COPPA FAQs](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) | School-consent limits and applicability questions; no blanket conclusion for adult-operated transport service |

The supplied summary of “Ganancia de Pikmykid” provided project context. This task did not independently reread that private conversation or verify competitor/revenue assertions. No numerical commercial, traffic or safety outcome is claimed.

## Handoff to subsequent implementation work

Read documents 02 and 03 together before coding. B01–B06 define the first synthetic vertical slice; do not start with public driver enrollment or a generic ride marketplace template. Preserve decision IDs, canonical states and test IDs in future issues/PRs. If implementation changes a safety invariant, update the behavioral contract and tests together and record the tradeoff here.

Planning validation performed: repository/ancestor instruction inspection, primary-document research, local Markdown link and fenced-block checks, and review against the requested deliverables. State/permission consistency review included pending physical transfers, cancellation versus custody, revoked receipt access and restricted recovery access. No application, background tracking, legal classification or operational pilot has been validated by this planning task.
