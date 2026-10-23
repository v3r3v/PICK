# Run PICK locally

Historical POC 1 runbook. For the current multi-vehicle queue, location modes and native tabs, use [POC 2 runbook](09-queue-poc-runbook.md). The original custody journey below remains supported.

This is a synthetic review environment. Sessions deliberately let reviewers choose fixed demo identities. Use only a trusted local network. No production service, cloud database, public tunnel or real student data is involved.

## Install and start

Use Node 24.18.x (Node 24 includes the SQLite adapter used here). In PowerShell:

```powershell
Set-Location 'C:\Users\joser\OneDrive\Documents\ChatGPT\PICK'
npm ci
npm run dev
```

Open [the desktop preview](http://localhost:8081). API health is [localhost port 4100](http://127.0.0.1:4100/health). Startup seeds a new database only if none exists; existing trips persist. Ctrl+C stops the API and Metro started by this command. Startup refuses occupied ports without terminating unrelated programs.

For Expo Go, stop the loopback process and run:

```powershell
npm run dev:lan
```

Keep the computer awake and the terminal running. The script prefers Wi-Fi, prints a QR code and writes current addresses to `.local/preview.json`. It also saves `.local/expo-qr.svg`. At handoff on 8 October 2026, the verified Wi-Fi address was **192.168.86.28**:

- Expo Go: `exp://192.168.86.28:8081`
- [Browser on the same network](http://192.168.86.28:8081)
- [API health on the same network](http://192.168.86.28:4100/health)

Scan the QR using the phone camera/Expo Go scanner, or enter the Expo address. This project uses Expo SDK 57. Physical iPhones require Expo CLI and Expo Go to be signed into the same Expo account per [Expo's start guide](https://docs.expo.dev/get-started/start-developing/); run `npx expo login` yourself if needed. Passwords are not part of PICK. Check that Expo Go supports SDK 57 using [Expo Go downloads](https://expo.dev/go).

If the computer has several adapters, set an explicit Wi-Fi IPv4 address before starting:

```powershell
$env:PICK_LAN_HOST = '192.168.86.28'
npm run dev:lan
```

The native app uses the printed API address on port 4100. The web client uses `/pick-api` on Metro's origin; a fixed development proxy forwards to the local API. This avoids cross-origin browser transport issues without changing authorization. Shared resets through the proxy are still restricted to loopback clients. Exported web assets require an equivalent `/pick-api` reverse proxy; the export command alone does not serve the API.

## Connection troubleshooting

First open the API health URL on the phone's browser. If neither port responds, confirm the phone and computer use the same non-guest Wi-Fi and that a VPN or router client isolation is not separating them. If Windows asks about Node network access, review the private-network prompt yourself. No firewall rules have been changed by this project. Expo's tunnel mode alone would not tunnel the separate API, so it is not a complete substitute.

If Expo opens but PICK cannot connect, check the API process and printed address, then reload Expo Go after a host/address change. If the phone reports an SDK mismatch, check Expo Go's supported SDK. Physical-device compatibility has not been certified by the automated checks.

## Review one shared afternoon

Open separate browser tabs or devices and choose a different account in each. Sessions are independent and expire after eight hours. Reloading drops the in-memory session; choose an account again. Switching in **Demo tools** does not reset the shared trip; tap **Today** after selecting a role. Foreground views poll every second; a snapshot older than 2.5 seconds disables custody commands.

1. **Maya Rivera, parent:** review the exact driver, vehicle, destination and named primary/backup recipients; approve the pickup.
2. **Daniel Cruz, driver:** accept the assignment, then begin approach while parked.
3. **Ms. Ellis, teacher:** confirm Leo is present and ready. Readiness alone cannot release custody.
4. **Daniel:** request arrival check-in.
5. **Jordan Lee, gate:** confirm the driver/vehicle, place in waiting queue, call to Bay 1, confirm vehicle at Bay 1, then prepare the school handoff.
6. **Jordan:** record witnessing boarding. **Daniel**, in his own session: confirm boarding. **Jordan:** record school release. Until finalization, the last confirmed holder remains the school and the exchange is pending.
7. **Daniel:** begin the trip, confirm arrival while parked, and prepare the recipient handoff.
8. **Elena Rivera:** acknowledge receiving Leo in her own session. **Daniel:** record witnessing receipt, then record the home handoff.
9. **Daniel:** confirm the vehicle is empty and complete the trip. **Timeline** shows server audit history.

The demo clock fixes the synthetic pickup window at 3:10–3:40 PM; actual audit timestamps remain real. It is not a live route, GPS feed, identity-verification service or transport operation.

## Exception and connection reviews

Coordinate with other reviewers before resetting. From the host computer at `http://localhost:8081`, Demo tools offers four scenarios with an explicit **Reset shared demo** confirmation. This replaces demo history and invalidates every session. On a phone or a LAN URL, reset is intentionally rejected. CLI equivalent, also global:

```powershell
npm run seed -- normal
npm run seed -- before-release
npm run seed -- at-home
npm run seed -- pending
```

For revocation, use Maya before preparation, while a transfer is pending, or after school release. The current confirmed holder is preserved; a pending exchange becomes disputed and no additional handoff is enabled. Alex owns recovery. Manual physical reconciliation and reopening a disputed trip are outside this POC; use a confirmed scenario reset only to start another synthetic review.

For an absent recipient, start at home, choose Daniel and report **Recipient is not here** before preparing a handoff. Alex can activate Sofia only because she was already part of the parent's approved recipient set. Choose Sofia to acknowledge receipt; Elena cannot acknowledge that transfer.

For uncertainty, start the pending scenario and report an uncertain handoff. There is no timer that authorizes another release. For connection checks, pause one device in Demo tools; its commands disable while another device can advance the trip. Resume and refresh to converge. **Lose the next command response** commits a successful command but drops its HTTP acknowledgement; receipt lookup recovers the result without a second submission. If lookup is unavailable, keep the pending state until connectivity and actual custody are reviewed.

## Validation commands and files

```powershell
npm run typecheck
npm run lint
npm test
npm run doctor
npm run export:web
npm run export:ios
```

SQLite lives in `.local/pick.sqlite` with WAL sidecars. Do not share that directory; demo session hashes and receipts live there. Sources: `apps/api`, `apps/mobile`, `packages/contracts`. `dist-web` and `dist-ios` are generated bundles under `apps/mobile`; iOS export is a JavaScript/Hermes export, not a signed iOS application. Expo Go supplies the native runtime. No Apple build, store submission or cloud build was performed.
