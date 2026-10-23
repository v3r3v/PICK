# PICK development handoff

Last updated: 22 October 2026 (America/La_Paz).

## Latest user intent

The user develops PICK, a school pickup/custody demo, and reviews it in Expo Go on a phone sharing the development computer's network. They prefer direct execution and brief nontechnical updates. When asked to start the demo, open the preview, show the current QR code, then wait for the next request.

The latest request is to commit and push the source to `https://github.com/v3r3v/PICK.git`, including agent-readable context for continuing across devices. This document and root `AGENTS.md` provide that portable context. They summarize the conversation, not its full transcript. Future agents must update and push these notes with subsequent work; access to prior Codex chats is not assumed.

## Current implementation

- npm workspaces: `apps/mobile` (Expo SDK 57, React Native, TypeScript, Expo Router), `apps/api` (Node/TypeScript and SQLite), and `packages/contracts` (shared types and synthetic fixtures).
- POC 2 implements five vehicles in a server-authoritative gate queue. Two classrooms follow the committed preparation order. Parents, drivers, teachers, gate coordinators, and recipients use independent synthetic accounts.
- Arrival announcement, physical identity confirmation, queue placement, readiness, bay reservation, and school/home custody handoffs remain distinct. Holds/revocation block release. Reorders preserve held vehicles and use revisions, transactional receipts, and explicit conflict recovery.
- Foreground location is requested only through explicit action. Demo tools has labeled simulated samples and separately confirmed local demo-zone settings. Real review coordinates stay in the ignored database.
- iOS uses Expo native tabs with system fallbacks; web/Android use JavaScript tabs. Physical-device behavior remains unverified by the agent.

## Latest completed feature

Five transparent generated PNGs replaced primitive vehicle shapes: blue 2024 Toyota Sienna, blue 2024 Honda Civic sedan, white 2023 Kia Sportage, red Volkswagen Golf Mk8, and silver 2024 Ford Ranger double cab. All use front-left three-quarter views. Trim/generation fidelity is approximate; these are not OEM assets or actual vehicle photos.

`apps/mobile/src/vehicle-catalog.ts` maps fixture IDs plus matching model/color/body to literal Metro asset requires. `vehicle-art.tsx` renders contained 118x84 thumbnails and larger images, with a labeled generic fallback for unknown models or failed loads. `vehicle-gallery.tsx` exposes **Demo tools → Show all five car models**, a read-only gallery. Queue rows and gate details preserve plate/model/color and synthetic driver initials/name. Backend and queue mechanics were unchanged for this feature.

The original five 1536x1024 RGBA PNGs total about 8.65 MB. Exact prompts and provenance live beside the assets. A future licensed model catalog or supplied photos can replace them without changing queue behavior. `DESIGN.md` and `.impeccable/design.json` reflect the final UI. Final scoped artwork/browser review cleared the documentation correction; it did not certify native readiness.

## Continue on another device

1. Clone `https://github.com/v3r3v/PICK.git`, or fetch and pull a clean existing checkout with `git pull --ff-only`. Read `AGENTS.md`; preserve uncommitted/divergent work.
2. Install Node 24.18.x, then run `npm ci` from the repository root.
3. Run `npm run dev` for this computer only, or `npm run dev:lan` for Expo Go on the same trusted network. Both start the API and Expo. Keep the process running.
4. Use the addresses printed at startup and saved in `.local/preview.json`. LAN startup creates `.local/expo-qr.svg`. Default ports: API 4100, Expo 8081. `PICK_LAN_HOST` can select the current adapter address. IPs in older documents are historical examples.
5. Follow `docs/09-queue-poc-runbook.md` for accounts/scenarios. A fresh checkout initializes a separate synthetic database. Git does not transfer another computer's demo queue, sessions, or location. Connect clients to one running host to share live demo state.

No preview is guaranteed to persist across sessions, reboots, or devices. Verify live process/API health before claiming it is ready. Existing demo databases must not be reset simply to restart. No cloud backend, EAS build, or app-store deployment was created.

## Validation and remaining limits

Historical evidence is in `docs/10-queue-validation.md`. Initial queue work passed 27 backend tests, typecheck, lint, dependency alignment, Doctor (21/21), and web/iOS Hermes exports. The artwork update passed typecheck, lint, both exports, alpha inspection, desktop 1280x720 and actual narrow 390x844 browser review. Keyboard and mouse reordering committed correctly in an isolated acceptance database while preserving holds. Screenshots are in `.impeccable/review/`.

Physical iOS/Android rendering, native touch drag, GPS, VoiceOver, Dynamic Type, and OS-specific tab materials still require testing. Browser screenshots and successful bundling do not prove these. The previously recorded audit had 51 advisories (9 moderate, 42 high); that is historical, not a current audit. No force dependency upgrade was applied.

Source-transfer validation on 22 October 2026: TypeScript and ESLint passed; all 27 existing tests passed. The initial sandbox test run could not reach its temporary localhost servers (EACCES); the rerun with local network access passed. Tests used temporary/in-memory databases, preserving the main demo database. Ignore rules were checked for `.local`, SQLite data, `.env`, and dependencies; a targeted source scan found no common credential/private-key patterns. Exports and physical-device checks were not rerun for this documentation/source transfer. This transfer makes no app feature changes.

## Next step

After pushing source and context, wait for the user's next development request. Physical Expo Go review remains outstanding; that is not authorization to expand scope. Preserve existing local demo data on every device.

## Optional historical references

Coordination task: **Define PICK school pickup app**, `01a11df8-7b52-7340-897c-a683583a4fc6`. Implementation task: `01a11dfa-4ce6-7bc2-a635-56427b3a1867`. These notes should suffice without access to those chats.
