# PICK local proof of concept

POC 2: one Expo Router app for iOS, Android and web, backed by a local Node/TypeScript API and SQLite. Five vehicles share an authoritative gate queue; two classrooms follow the committed order. Independent demo accounts share server-confirmed custody. All people, authority records, addresses and journeys are synthetic. Optional foreground device location is real and requested explicitly.

With Node 24.18 installed, run `npm ci`, then `npm run dev`. For a phone on the same trusted network, run `npm run dev:lan` instead. The terminal prints the current web/API/Expo addresses and a QR code. Keep that terminal running.

- [POC 2 queue walkthrough and phone setup](docs/09-queue-poc-runbook.md)
- [POC 2 validation and physical-device checklist](docs/10-queue-validation.md)
- [Original single-journey runbook](docs/07-local-poc-runbook.md)
- [Historical POC 1 validation](docs/08-poc-validation.md)

## Continue on another device

Clone `https://github.com/v3r3v/PICK.git`, install Node 24.18.x, and run `npm ci`. For an existing clean checkout, run `git pull --ff-only` before working. Read [agent instructions](AGENTS.md) and the [latest development handoff](docs/12-agent-handoff.md) for completed work, decisions, validation limits, and next steps. Update and push the handoff together with source changes so the next device receives current context.

Git shares source and these notes. Local demo databases, sessions, dependencies, and LAN addresses stay on each device. `npm run dev:lan` prints a fresh QR code for the current host. Existing local data is preserved when restarting.

## Preserved planning package

Implementation proposal, 8 October 2026. The documents below describe the broader product and pilot requirements; the local POC implements only the synthetic slice documented above. This is not an approved transport operation. The repository was empty and had no commits or applicable `AGENTS.md` when initially inspected.

Start with the [product brief](docs/01-product-brief.md). Then use:

1. [Roles, journeys, custody and state transitions](docs/02-workflows-and-state.md)
2. [Architecture, data model and command contracts](docs/03-architecture-and-data.md)
3. [Safety, privacy, telemetry and operating procedures](docs/04-safety-and-operations.md)
4. [Prioritized backlog, acceptance tests and pilot metrics](docs/05-backlog-and-validation.md)
5. [Decision register, open questions and evidence](docs/06-decisions-and-evidence.md)

**Recommended starting point:** one school, scheduled trips, a small vetted driver pool, explicit parent approval of each assignment, and verified school and home handoffs. Build the synthetic end-to-end slice in backlog items B01–B06 before expanding features. All real-child transport remains behind the operational gates in document 04.

The coordination task remains **Define PICK school pickup app**, ID `01a11df8-7b52-7340-897c-a683583a4fc6`. Proposed decisions D01–D10 and unresolved questions Q01–Q06 are recorded in document 06 for discussion there. No additional tasks, services, deployments or enrollments were created.
