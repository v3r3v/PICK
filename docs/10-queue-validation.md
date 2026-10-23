# POC 2 evidence and remaining checks

## Vehicle-image update — 12 October 2026 UTC

Replaced the five School A body-type SVGs with individual generated transparent PNG model illustrations. The explicit local catalog maps fixture ID plus matching model/color/body to model/generation/color assets; no remote image service is used. Fixed contain-sized 118×84 thumbnail containers retain stable drag targets. Gate details provide larger artwork, and the read-only Demo tools gallery shows all five without changing live state. Driver avatars and backend queue/custody code are unchanged.

All five PNGs were visually inspected and their alpha channels checked: 1536×1024 RGBA, all four corners fully transparent, about 46–52% fully transparent pixels, and no clipped opaque vehicle bounds. They total about 8.65 MB, preserved unchanged from the built-in generator. Sienna and Civic remain visibly different despite both being blue. Sportage contours remain visible on the actual white detail panel. Model generation/trim fidelity is representative, not certified.

TypeScript and ESLint passed. A narrowly documented lint exception permits literal Metro asset requires in the catalog. Web and iOS Hermes exports passed and explicitly list the five bundled PNGs. Dependencies and backend logic did not change, so the existing 27-test backend suite was not rerun for this asset-only update.

Browser inspection covered the desktop queue/gallery/details at 1280×720 and actual narrow queue/details at 390×844, with width verified from the rendered viewport. Screenshots: `.impeccable/review/vehicles/gallery-desktop.png`, `desktop.png`, `mobile.png`, `details-desktop.png`, `details-mobile.png`. Keyboard Forward/Back committed a Civic move and restoration in the isolated acceptance database. Desktop mouse drag subsequently committed held Ranger from position 3 to 2 without clearing its hold. Initial gesture attempts after viewport changes did not dispatch; an explicit browser reload restored event delivery. Temporary gesture diagnostics were removed. Physical touch dragging, native image rendering, Dynamic Type and device accessibility were not verified by these browser checks.

Main `.local/pick.sqlite` data and existing sessions were not reset. Review commands used the existing separate `.local/queue-acceptance.sqlite` on ports 4101/8082, subsequently stopped. Main Expo remains `exp://192.168.86.28:8081`; reload in Expo Go and use Demo tools to compare the artwork without affecting the live queue.

Changed files: `src/vehicle-art.tsx`, new `src/vehicle-catalog.ts` and `src/vehicle-gallery.tsx`, vehicle identity presentation in `src/queue-screen.tsx`, the gate detail panel in `src/trip-screen.tsx`, gallery placement in `app/demo.tsx`, five PNGs and their `assets/vehicles/README.md`/`manifest.json`, runbook/validation and design documentation. All application paths are under `apps/mobile`.

## Original POC 2 validation

Validated locally on Windows, 8 October 2026 America/La_Paz (9 October UTC). This supplements historical POC 1 results and does not certify a real transport operation.

## Executed

- TypeScript and ESLint passed for the final implementation. All **27 tests passed** against temporary SQLite databases and actual local HTTP servers.
- The latest test run measured foreground queue-to-classroom polling convergence at **1,056 ms**. The separate trip polling test measured 1,044 ms. These are local observations, not WAN, phone or load guarantees.
- Expo dependency alignment passed and Expo Doctor passed **21/21** with the installed SDK 57 dependencies. Final web export (about 1.3 MB) and iOS Hermes export (about 2.6 MB) passed. Sandbox child-process restrictions initially blocked tests/Hermes; the authorized rerun passed.
- Desktop browser review at **1280×720** and narrow browser review at **390×844** showed gate lane, separate arrivals, identities, readiness/hold state and classroom sequence. Evidence is in `.impeccable/review/poc2/desktop.png`, `mobile.png` and `teacher.png`. `desktop-lane.png` is an earlier interaction capture with superseded longer button labels.
- In separate browser sessions sharing an isolated acceptance database, simulated outside arrival was rejected; inside arrival appeared at gate; gate confirmation appended the visit; teacher updated without manual refresh. Five distinct vehicles were then present. Forward controls moved the fifth vehicle to second, changing Maple's global positions to 1, 2, 4. Desktop mouse dragging subsequently moved the Civic from third to second and received server confirmation. Held Isla remained in the lane.
- Fresh finish review returned **ship the local POC** after correcting child-specific custody labels and the explicit-location disclosure. The verdict covers inspected browser/source evidence, not native certification.
- Main SQLite state was preserved through additive migration and preview restart. The complete five-vehicle browser walkthrough used `.local/queue-acceptance.sqlite` on separate ports 4101/8082. That temporary preview was stopped. The main LAN preview remains on 4100/8081.
- Main Metro served an iOS development bundle. This proves a native bundle request reached the host, not that the phone completed any workflow. The user is connecting Expo Go for physical review; no successful physical test is inferred.

## Server evidence

Tests cover finite geographic bounds, freshness, accuracy, stale zone version, distance and uncertainty margin; rejection of a client-supplied inside-zone boolean; same-school parent/driver/teacher/recipient restrictions; cross-school queue isolation; actor-owned receipts; one visit per assignment and duplicate arrival stability; exact reorder permutations; moved-visit consistency; fifth-to-second classroom projection; preserved readiness and hold state; bay contention and locked transfer positions; unready/held release rejection; reason-required gate manual arrival and exception/restore; stale edits/new arrivals without lost vehicles; atomic rollback on receipt insertion failure; restart persistence; additive migration and reset invalidation; dropped-response recovery; and simultaneous HTTP gate commands producing one success and one conflict.

The original custody tests still establish paired school/home evidence, explicit uncertainty, revocation behavior, backup recipient identity, one-release transactions, session expiry, independent-connection finalize concurrency and delayed old-session isolation. Queue acceptance is not custody release.

## Physical phone checklist — not yet verified

Record phone model, OS, Expo Go version and test outcome separately for each platform.

1. Open the LAN Expo project and select independent accounts on phone and host. Confirm connected status and live shared changes.
2. Test native tab safe areas, scroll minimization, return expansion and drag-time suppression. On an eligible iOS version inspect actual system Liquid Glass, then Reduce Transparency and Reduce Motion fallbacks. Check older supported iOS tab behavior separately.
3. Test drag by touch from fifth to second, insertion feedback, bounded edge autoscroll and cancellation. Use Forward/Back with VoiceOver; ensure focus survives polling and teacher messages do not steal it. Test Dynamic Type, portrait/landscape, safe areas and sheet dismissal. Tablet/Android checks remain separate.
4. On a disposable review session, deny foreground location, then grant it through the expected OS flow. Explicitly set a local review zone and confirm it. Exercise actual inside/outside readings and accuracy/boundary failures. Check that the app does not request location on launch, polling or account switching. Simulated source tests do not satisfy this step.
5. Use two gate devices for a conflicting reorder and a new arrival during drag. Confirm explicit conflict/retry and that all vehicles survive. Verify one teacher per classroom follows committed order without manual refresh.
6. Disconnect/reconnect the phone and use the lost-response switch. Resolve the receipt before continuing; confirm no automatic replay or duplicate release. Verify held/unready front vehicles cannot proceed to bay or release.

## Limits and deferred scope

Native iOS compilation, signing, physical touch/GPS, OS glass appearance, VoiceOver/Dynamic Type and Android runtime testing were not performed by the agent. Web screenshots and successful Hermes bundling are not substitutes. No EAS project/build, app-store submission or public deployment was created.

This local adapter stores trip/queue JSON in SQLite and uses optimistic revisions plus immediate transactions. Demo identity selection is not production authentication. Appended audit rows are not tamper-proof. One visit per trip is supported; sibling/multiple-child vehicle manifests, real eligibility verification, duty grants, robust device-location attestation, background delivery, production notifications, real school operating policies and traffic outcomes remain deferred.

The waiting-zone radius and error thresholds are provisional review settings. A precise reviewer-selected center stays in the private local database and authorized zone projections; raw arrival measurements are not logged or exposed to teachers. Manual reason text is entered by demo users and should not contain real personal data.

The known dependency audit remains **51 advisories (9 moderate, 42 high)**, including transitive/metavulnerability entries. No incompatible force fix or SDK upgrade was applied. Review these before broader distribution.
