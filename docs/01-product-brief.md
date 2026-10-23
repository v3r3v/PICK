# PICK product brief and scope

Status: recommended design for review, 8 October 2026. Requirements below come from the supplied coordination context. Pilot sizes, workflows and technology choices are proposals, not user approvals.

## Product definition

PICK coordinates school dismissal and scheduled transport from school to an authorized home recipient. Parents choose and explicitly approve a driver; school personnel prepare students and verify release; drivers transport only their approved manifest; the receiving adult participates in the home handoff. Each participant sees an authorized view of the same pickup and trip records.

The problem is twofold: uncertain custody during dismissal and transport, and vehicles spending unnecessary time around the school. An app can coordinate information, but a safe curb layout, supervised holding areas and staffed exception handling remain essential. The value proposition to test is fewer avoidable delays and a traceable chain of custody without adding excessive work for staff or distracting drivers.

| User | Job to accomplish | Value hypothesis |
| --- | --- | --- |
| Parent/guardian | Arrange a trusted ride; know who has the child; change plans safely | Explicit assignment approval and reliable handoff status reduce uncertainty |
| Driver partner | Qualify, accept feasible scheduled work, collect the correct children and deliver them | A confirmed manifest and clear exception procedure reduce wasted trips and ambiguity |
| Teacher | Prepare assigned students at the right time | Readiness requests avoid sending children to crowded gates too early |
| Gate staff | Match child, authorized driver, vehicle and bay | Separate verification and queue controls reduce mistaken or blocked releases |
| School administrator | Configure dismissal, staffing and accepted drivers; resolve exceptions | One operational view and measurable curb performance |
| Platform safety/support | Validate eligibility, handle active incidents and review evidence | A case timeline supports protective action and accountable decisions |
| Home recipient | Receive specific children and acknowledge custody | Time-limited verification makes delivery more than a driver assertion |

Students do not need accounts or phones in the pilot. The customer, payer and transport operator are still unresolved; these are distinct roles.

## Confirmed direction versus hypotheses

Confirmed requirements: driver applications and enrollment policies; parent selection/approval; teacher and school coordination; iPhone, Android and computer access; synchronized role-appropriate views; driver safety history and parent reviews; incident response and restrictions; exploration of speed relative to the road limit; traffic reduction as a core purpose.

There is no field evidence yet for queue delays, demand, willingness to pay, driver supply, school adoption, cost per ride, reduced traffic or improved safety. The supplied earlier discussion is context, not independent validation. Its revenue estimates and competitor comparisons are excluded. No feature in this plan is asserted to be a unique competitor differentiator.

| Assumption to test | Practical validation before or during pilot | Decision affected |
| --- | --- | --- |
| Readiness and bay coordination are major delay sources | Observe the current dismissal sequence and timestamp a representative baseline | Whether queue software is the first operational investment |
| Families accept scheduled, named drivers | Structured interviews and a nonbinding schedule exercise | Scheduled service viability; no demand forecast yet |
| Suitable drivers and vehicles can operate under the local model | Qualified legal/insurance review and later documented provider verification | Whether PICK can offer transport at all |
| School has enough staff and safe space for exceptions | Walk through normal dismissal, no-show and absent-recipient drills | Capacity and school participation |
| Enough families share destinations or routes | Use consenting adults' synthetic/example schedules before real enrollment | Whether pooling can reduce vehicles without excessive ride time |
| Mobile tracking is adequate on local routes | Adult-only tests on physical iOS/Android devices and difficult road segments | Tracking configuration and coverage disclosures |

## Recommendations and explicit rejections

1. **Use scheduled transport, initially through a small vetted pool.** Operationally prefer an established transport operator if a suitable one exists; validate this commercial model. An open marketplace adds supply screening, dispatch, payments, insurance and substitute-driver problems before the core custody flow is proven.
2. **Require fresh approval after a material assignment change.** Driver, vehicle, child list, destination, receiving-adult rules or service window changes invalidate the affected trip approval. A saved favorite driver is a preference, not authorization. Pilot approval is per dated trip revision; recurring approval can come later.
3. **Treat school and home as separate custody transfers.** GPS, a geofence, a scanned code alone or a driver's “delivered” tap cannot establish delivery. Human verification is still necessary; software records evidence and exposes uncertainty rather than guaranteeing physical truth.
4. **Preserve the congestion objective.** Replacing one family car with one hired car does not necessarily reduce vehicle volume and can add empty driving. Measure vehicle counts, occupancy, curb time and spillback. Do not promise a traffic reduction from transport bookings alone.
5. **Schedule arrivals within staffed supervision hours.** Readiness, an available bay and arrival jointly govern call-forward. Early or late drivers use a school-approved waiting procedure; the app must not instruct them to circle the neighborhood or double-park.
6. **Keep ratings, allegations, substantiated incidents and telemetry separate.** Reject a public “safe driver score” assembled from these incomparable signals, automatic permanent bans from GPS, and review averages presented as proof of safety.
7. **Use native tracking for drivers and responsive web for operations.** Desktop access covers planning and administration; it cannot substitute for the active driver's mobile runtime. All clients show freshness and disconnected states.
8. **Defer automated speed enforcement.** Investigate licensed speed-limit coverage in shadow mode. A missing limit means unknown, not “within the limit.” Do not assume access to a Waze data API.

## Provisional pilot envelope

For design and synthetic load fixtures only: one school, up to five scheduled drivers and twenty children per dismissal session, one trip per driver at a time, one household destination per initial trip, and siblings supported. These are proposed capacity caps, not demand estimates or validated safe capacity. Actual capacity is bounded by vehicles/restraints, school staffing, receiving adults, route duration and support coverage, and must be agreed before enrollment.

Assume school-age minors who require adult handoff; no unaccompanied home drop-off. Exact ages and additional assistance needs are Q01. Puerto Rico is the likely market to confirm (Q02), not a settled legal jurisdiction. Use Spanish-first copy with English support if Puerto Rico is selected; store school time zone and locale explicitly. No monetary processing is needed to prove the software slice; economics and lawful compensation still must be settled before a paid pilot.

## Phases and completion gates

| Phase | Included end-to-end scope | Exit evidence |
| --- | --- | --- |
| 0: definition and feasibility | Confirm operating model; baseline observation plan; custody protocol; synthetic fixtures; adult-only tracking feasibility | Owners accept policies and test plan; unresolved legal/operational blockers identified |
| 1: buildable demonstration | Two synthetic schools for isolation tests; parent approval; driver acceptance; one bay; student readiness; school release; home recipient confirmation; event history and reconnect recovery | B01–B06 demonstrate a full synthetic school-to-home journey and required failure cases |
| 2: supervised pilot MVP | Verified onboarding; staff roles; siblings in one visit with per-child custody; manual schedule; queue/exception area; native tracking; support console; protective suspension; reviews; outage drills; measurements | All B01–B12 P0 gates pass, launch prerequisites complete, school and operator approve controlled operation |
| 3: evidence-led expansion | Small manually planned multi-household routes with per-child approvals, multiple stops and privacy filtering; recurring schedules; operational integrations | Demonstrated support capacity, acceptable ride durations and evidence of benefit; every new stop/group scenario tested |
| Later | Broader marketplace, dispatch optimization, automated payouts, institution integrations and validated speed alerts | Separate product, regulatory and technical decisions supported by pilot evidence |

The pilot must include home handoff, no-show handling, absent-recipient escalation and incident coverage. A queue-only demo does not qualify as the transport MVP. Phase 1 may simulate tracking; Phase 2 may not claim tracking capability without physical-device evidence.

Excluded from the initial pilot: unrestricted on-demand matching; automatic driver substitutions; unauthenticated pickup links; children booking rides; public child/driver location maps; facial recognition; continuous off-trip surveillance; automatic permanent bans; route optimization; cross-school pooled rides; public incident allegations; advertisements or sale of student data; in-app payment custody. Accessibility and necessary restraints are eligibility requirements, not features to waive to meet a launch date.

## Discovery and economics

Before claiming business viability, model revenue per completed ride or school contract against driver compensation, paid waiting, empty miles, screening, commercial insurance, support staffing, mapping/telemetry, messages, refunds and taxes. Compare school subscription plus contracted transport against parent-paid rides and a transaction fee. No pricing, take rate, profitability or vendor-cost claims are established here. A low software bill cannot compensate for an unstaffed incident desk or an unsuitable insurance arrangement.
