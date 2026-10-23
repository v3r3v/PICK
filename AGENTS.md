# PICK agent instructions

## Resume on any device

Read `docs/12-agent-handoff.md`, then `README.md`, before changing this project. The handoff is the portable summary of the development conversation. Chat history itself is not stored in Git and may be unavailable on another device.

At the start of work, run `git status --short --branch`, check `git remote -v`, and fetch `origin` when network access is available. On a clean branch with an upstream, use `git pull --ff-only` before editing. If local changes, divergent commits, or an unavailable remote prevent this, preserve the work and explain the situation. Reconcile without a hard reset or force push. Read the handoff again after pulling.

Before pushing, fetch again and account for new remote commits. Update `docs/12-agent-handoff.md` with the date, user-requested changes, checks actually run, unresolved issues, and next step. Commit source and context together; push when authorized. Only committed and pushed updates travel between devices. Do not store credentials, personal location, databases, session tokens, or raw chat transcripts in the handoff.

## Project conventions

- Use Node 24.18.x (package supports >=24.18.0 and <25), `npm ci`, and the committed lockfile.
- `npm run dev:lan` starts the API and Expo Go preview and prints the current LAN address and QR code. Never reuse another device's IP. Check for an existing PICK preview first; do not stop unrelated processes.
- Preserve `.local/pick.sqlite` and sessions. Seeding/resetting replaces demo history and invalidates sessions; only reset when requested, or use a separate disposable review database.
- Queue position, classroom readiness, identity checks, and custody release are separate facts. Preserve server authority, conflict handling, holds, and paired handoffs.
- Committed people and journeys are synthetic. Generated car images are representative, not identity evidence or licensed OEM photos. Preserve asset provenance.
- Follow `DESIGN.md` and `.impeccable/design.json` for UI work. Personal skills may be unavailable on another device; repository documents are the portable baseline.
- Run checks appropriate to changes: typecheck/lint; `npm test` for behavior; web/iOS exports for app bundling. Record exactly what ran. Browser or Hermes export success does not prove physical-device operation.
- Do not create a public deployment, EAS project/build, or production service unless requested. This is a local proof of concept.

## Context map

- `docs/12-agent-handoff.md`: latest development state and continuation notes.
- `docs/09-queue-poc-runbook.md`: startup, accounts, walkthrough, phone setup.
- `docs/10-queue-validation.md`: historical evidence and physical-device checklist.
- `PRODUCT.md`, `DESIGN.md`, and documents 01–06: product direction and broader planning.
- `apps/mobile/assets/vehicles/README.md` and `manifest.json`: asset provenance and exact prompts.
