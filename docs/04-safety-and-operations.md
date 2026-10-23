# Safety, privacy and operating design

These are proposed controls to validate with the school, transport operator, families and qualified local advisers. They do not establish legal eligibility or guarantee safe transport.

## Driver partner enrollment

Application states: `draft → submitted → in_review → needs_information / approved / declined`; approved eligibility may later become `restricted`, `suspended`, `expired` or `removed`. Preserve every decision, policy version, reviewer and evidence reference. A driver's application is not permission to see children or accept trips.

| Area | Proposed evidence and review | Enforcement point |
| --- | --- | --- |
| Identity | Verified legal identity, contact and match to the person driving; method approved locally | Application review and visual match at gate |
| Driving authority | Correct license/class, current validity and any applicable transport permissions | Enrollment, expiry checks and pre-trip check |
| Vehicle | Registration, inspection, approved vehicle type, seat/restraint capacity, condition and accessibility suitability | Assign exact vehicle; recheck at gate; no silent swap |
| Insurance | Qualified confirmation of coverage for the actual paid/unpaid student-transport model, driver, vehicle and operating periods | Written coverage verification before eligibility |
| Screening | Lawful identity-linked driving/background checks and relevant disqualifier review | Human decision; define re-screen schedule and change-reporting duty |
| Training | Child safeguarding, boarding/restraints, recipient verification, absent recipient, emergencies, distracted driving, outage practice | Document completion and scenario demonstration |
| Agreement | Versioned operating policies, incident reporting, approved routes/stops, data use and appeal process | Acceptance before eligibility, renewed for material changes |
| School acceptance | School-specific rules and accepted driver/vehicle scope | Separate from platform approval |

Verification must include provenance and expiry; uploading a photo of a document does not verify it. Use the minimum reviewer access and a second review for high-risk exceptions. Do not waive a required credential through a generic override. Renew before expiry; fail new assignment/release at expiry even if jobs or emails fail. For expiry or suspension discovered during transport, prevent new pickups and initiate a safe custody resolution rather than abandoning children.

Parents choosing a driver should see identity/vehicle details, current eligibility and school acceptance, relevant experience that has been verified, review count/distribution and completion history. Label verification scope and date; “approved” means the required process was completed, not a promise of future conduct. No raw screening documents or complainant identities are public.

## Incidents, reviews and restrictions

Use separate records for a parent review, reported allegation, telemetry candidate and substantiated finding. A completed ride permits a parent review under a documented policy; no anonymous bulk reviews, paid positive reviews or safety-ranking shortcuts. Moderate identifying student details, threats and retaliation without hiding legitimate criticism. Small samples show their count; do not display a star average as a safety certificate. Safety reports remain available even for cancelled or incomplete trips.

Incident workflow: `reported → triaged → protective_action / investigating → finding → action → appeal / closed`. Capture severity, ongoing risk, actual custody holder, assigned owner, response acknowledgements, evidence access, communications and decision reasons. Use received time as well as reported event time.

| Condition | Immediate action | Review/outcome |
| --- | --- | --- |
| Credible urgent child danger or serious identity/vehicle mismatch | Staff stops new release; safety officer can temporarily suspend new work; activate emergency procedure if appropriate | Human investigation and safe plan for any children already aboard |
| Suspected speeding or route anomaly | Confidence check; triage context; contact only through safe operational protocol | Preserve source data; investigate before treating as established misconduct |
| Repeated lower-severity substantiated problems | Proportionate restrictions, training or supervised requalification | Defined conditions and documented reevaluation |
| Serious substantiated misconduct or failure to meet required eligibility | Removal or prolonged suspension as justified by policy and applicable obligations | Written rationale, records preservation and appeal route |
| False or inconclusive report | Record uncertainty, remove unjustified provisional restriction when appropriate | Correct derived summaries; preserve allegation/finding distinction |

Urgent protective action need not wait for a completed investigation. Permanent removal should have a documented human decision and independent appeal reviewer where feasible. Restoration requires authorization by the safety decision role, not ordinary customer support. An appealed driver remains under the active protective restrictions until changed by a recorded decision. Parents receive appropriate outcome information without exposing other children or confidential evidence. A driver may be refused by one school while still platform-eligible; the UI distinguishes scopes.

Active transport hours require an actually staffed safety/dispatch function with a backup and escalation contacts. An “SOS” button must explain who receives it; it must not imply continuous emergency response if none exists. For a small pilot, schedule rides only during support and receiving-site coverage. No live pilot proceeds with this role unassigned.

## Trip-scoped location and speed exploration

Start driver location only when the accepted run begins its approved approach window; stop after all child custody is resolved or a no-custody cancellation. Do not follow the driver home afterward. The parent sees fresh vehicle location only while their child is onboard, and loses live access after that child's delivery. For later pooled runs, suppress other households' addresses, stop identities and route history; even a shared vehicle dot can reveal places, so review residual privacy before pooling. School gate staff need arrival state, not the driver's full route.

The ingest API checks actor, active trip, device-session lease, sequence and plausible sample time, and marks delayed uploads as historical. Record horizontal accuracy, available speed accuracy, provider speed, measurement units, receive time and tracking health. Normalize speed internally to meters per second; convert limits explicitly (`mph × 0.44704`, `km/h ÷ 3.6`). Missing/negative/invalid speed is unknown. Device positions can be spoofed or erroneous; telemetry is corroborating evidence.

Expo and Android documentation describe lifecycle, permission and background-delivery constraints. Tune sampling from physical-device route tests, battery measurements and acceptable freshness; do not promise an uninterrupted stream or fixed update interval under all OS conditions. [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/), [Android background location](https://developer.android.com/develop/sensors-and-location/location/background).

Proposed telemetry pipeline:

1. Validate monotonic session sequence, sample age and quality; retain original sample with quality flags. Reject impossible timestamps and unauthorized/off-trip uploads. Batch/deduplicate reconnect uploads without presenting them as live.
2. Match a sequence to a road and direction, accounting for parallel roads, intersections, overpasses and sparse samples. A nearest-road lookup alone may select the wrong limit. Poor/ambiguous matches remain unknown.
3. Obtain a licensed limit for the matched segment and vehicle context; store source, retrieval time, validity and units. Check pilot-region coverage and rights to display, cache, retain and derive alerts before selecting a vendor.
4. Evaluate only when measured-speed uncertainty and limit applicability meet a documented confidence policy. Require sustained excess over multiple consecutive credible samples, using configurable margin, duration, gap tolerance and hysteresis. Those thresholds remain disabled pending adult-only calibration and policy review; there is no invented “legal tolerance.”
5. Reset/suppress candidate evaluation on road ambiguity, unknown limits, stale data, excessive gaps or unhandled conditional limits. No green “safe speed” badge in these cases.
6. Store a candidate with algorithm version, sample window, exceeded margin and suppression reasons. In the pilot, review shadow-mode candidates; no automatic parent alarm or driver sanction. Validate precision against independently checked road signs and route context before enabling alerts.

Google states that its speed-limit data may be inaccurate, incomplete or outdated, describes license restrictions, and notes that variable-limit segments return the maximum automobile limit. This is not proof of the currently applicable school-zone, temporary, weather or vehicle-specific limit. [Google Roads speed limits](https://developers.google.com/maps/documentation/roads/speed-limits). Coverage in the selected Puerto Rico routes and access to a suitable license remain unverified. Do not copy Waze data or assume its navigation app exposes a usable telemetry/limit API.

Track location availability and valid-limit coverage separately: a location dot with no trustworthy limit cannot yield a speeding assessment. If the mapping service fails, keep custody operations working and show speed assessment unavailable. Do not encourage a driver to look at or acknowledge alerts while moving; safety staff review first, with any driver action deferred until safely stopped.

## Privacy and abuse boundaries

No student-facing account, advertisements, public route lookup or biometric recognition in the MVP. Collect only the identifying information, emergency instructions and authority evidence required for the actual workflow. Separate necessary restraint/assistance instructions from medical or family records. Drivers see only the operational instruction needed to care for an assigned child, not unrelated diagnoses or custody dispute documents.

| Abuse/failure | Prevention and detection |
| --- | --- |
| Impersonated guardian or account takeover | School-verified relationship, reauthentication for recipient/destination changes, recovery reviewed independently of a new phone number, alert existing authorized contact when appropriate |
| Shared screenshot or guessed pickup code | Short expiry, single use, purpose/subject binding, rate limits and physical identity check; no static code as bearer authority |
| Driver swap or stolen account | Exact approved vehicle/driver, visual gate match, device-session review; no automatic substitution |
| Cross-school enumeration | Non-enumerating API errors, scoped queries/RLS, composite keys, negative tests across APIs/storage/realtime/exports |
| Staff stalking or support overreach | Duty/case scopes, live-location restriction, logged sensitive reads, time-bound elevated access and review |
| Parent follows another family | Per-child projection, end live access at their own handoff, no other stops/recipient details |
| Driver and recipient collude or false handoff tap | Paired evidence plus physical verification and follow-up reporting; preserve dispute procedure. Software cannot eliminate collusion |
| Malicious reports or ratings retaliation | Separate allegation/finding, restrict complainant exposure, human review and appeal |
| GPS spoofing, replay or manipulated clock | Server times, sequence deduplication, plausibility/confidence flags and corroboration; do not claim spoof-proof tracking |
| Leaked device, evidence URL or logs | Private storage, short-lived scoped downloads, redacted logs, revocable sessions, minimal cache and documented device-loss procedure |

Proposed retention configuration for review, **not a legal retention conclusion**: ordinary raw location up to 30 days; non-sensitive operational telemetry up to 90 days; custody/approval/audit records and substantiated incident evidence on a separately approved school/insurer/counsel schedule. No indefinite default. B10 must require configured durations before live mode is enabled. Evidence subject to a documented hold is restricted, excluded from routine deletion and periodically reviewed; holds have an owner and purpose. Declined applicant records also need an explicit schedule.

Implement deletion across database, object storage, caches and replicas/backup lifecycle, plus restoration reapplication of deletion markers. Keep only minimal pseudonymous audit references when personal identifiers may be removed. Never delete evidence needed for an active incident simply because the related account closes; counsel must resolve competing obligations. Record data access/export/correction requests and verify requester authority. Vendor contracts, permitted processing region, breach response, secondary use and access by school versus operator need explicit decisions.

## Operational prerequisites before any real student transport

| Gate | Responsible owner to appoint | Evidence required |
| --- | --- | --- |
| Market and legal classification | Founder/operator with qualified local counsel | Written determination of applicable transport category, permits, driver/vehicle rules, child restraint/age requirements, employment/contractor and safeguarding duties |
| Insurance | Operator and qualified insurer/broker | Written coverage for named operating model, vehicles/drivers, approach/waiting/passenger periods, limits/exclusions and incident procedure |
| School agreement and authority | School lead and counsel | Authorized roster/guardian process, accepted drivers, custody boundary, supervised hours, data responsibilities and manual procedure |
| Home handoff and failure plan | School/operator/safety lead | Authorized adult/backup process, maximum waiting/escalation rules, receiving location availability and absent-recipient drill |
| Physical dismissal | School operations lead | Safe lanes/bays, marshal roles, child staging, pedestrian separation, capacity, accessibility and off-line exception area |
| Privacy and security | Product/engineering lead with advisers | Data map, retention schedule, vendor review, access test evidence, breach procedure and rights request owner |
| Native and operational reliability | Engineering + operator | Physical-device tracking tests, training, backup connectivity/communication, outage/restore rehearsal and incident coverage |
| Pilot measurement and stop rules | School + product + safety lead | Baseline, agreed numeric performance criteria, safety halt conditions, named decision owners and daily reconciliation |

If Puerto Rico is selected, the [NTSP official portal](https://ntsp.pr.gov/Pages/default.aspx) is a starting point for locating current transport rules; this plan does not conclude which license or vehicle category applies. Avoid treating an old search-result regulation as a current complete legal answer. Qualified review must also address child protection reporting, contracts, liability, background-screening practices, data processing and any payment/tax obligations.

FERPA applicability depends on the participating institution and arrangement; the U.S. Department of Education describes conditions on contractors acting as school officials, including institutional control and legitimate educational interest. [School official guidance](https://studentprivacy.ed.gov/faq/who-school-official-under-ferpa). Counsel must determine the appropriate disclosure basis and contract; a transport marketplace cannot simply declare itself a school official.

COPPA applicability requires analysis of actual collection, audience and operating model. The FTC's school-consent guidance limits that route to the educational context; do not infer either automatic coverage or an exemption merely from having adults use the app. [FTC COPPA FAQs](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions). School authorization, guardian authority, app data consent and lawful driver eligibility are different questions.

Proposed immediate pilot pause conditions: unexplained/unknown child custody, unauthorized release, missing staffed escalation, expired critical eligibility/coverage, or an unsafe physical queue arrangement. Stop new PICK releases safely while resolving the issue; preserve supervision and current-trip accountability. Performance expansion thresholds are set with baseline evidence; any severe incident triggers review even if averages look favorable.
