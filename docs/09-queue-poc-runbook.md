# POC 2: gate queue and phone review

This is a local synthetic review, using one SQLite source of truth. Queue position, classroom readiness and physical custody are separate facts. Moving a vehicle in the interface does not authorize overtaking, call it into the bay or release a child.

## Connect

From the repository, run `npm ci` with Node 24.18, then `npm run dev:lan`. Keep the process running. Current review addresses are web `http://192.168.86.28:8081`, Expo Go `exp://192.168.86.28:8081`, API `http://192.168.86.28:4100`. The terminal and `.local/preview.json` contain the actual addresses after each start; Wi-Fi changes can change the address. Scan `.local/expo-qr.svg` on a phone sharing the trusted network. Do not use the phone's localhost.

The app uses Expo SDK 57. A compatible Expo Go installation is required. A web page loading on the phone establishes web connectivity, not native operation. If the app opens but shows disconnected state, verify that the phone can reach the API health URL at port 4100. This task did not change firewall rules or create a tunnel or EAS build.

The host browser can use `http://localhost:8081`. Native connects directly to the LAN API; web uses a fixed same-origin Metro proxy. `npm run dev` is loopback-only. For an isolated review database, set `PICK_DB_PATH`, `PICK_API_PORT` and `PICK_METRO_PORT` before starting, using distinct available ports.

## Preserve or deliberately reset

The existing `.local/pick.sqlite` was preserved. The additive queue migration added four assignments without changing the original journey, audit history or sessions. Its backup is `.local/before-queue-1791510471408.sqlite`.

For another older database, stop PICK and run `npm run migrate:queue`, then restart. The command takes a SQLite backup and adds missing fixtures idempotently. Gate Demo tools also offers an additive host-only migration when needed. It does not reset the original trip.

To start a reproducible review from scratch, use host **Demo tools → Five-vehicle queue review → Reset shared demo**. The explicit reset replaces current history and invalidates every session. Each reviewer then chooses an account again. This scenario seeds accepted/approaching assignments, not fake arrived vehicles: announce and physically match them next. Merely switching accounts never resets data.

## Fixtures

All names and authority records below are synthetic. Every assignment has its own parent, driver, primary recipient and approved backup in Demo tools.

| Child | Class | Driver | Vehicle | Review condition |
|---|---|---|---|---|
| Leo Rivera | Maple | Daniel Cruz | Blue Toyota Sienna · PICK 024 | Ready |
| Nora Santos | Oak | Lucia Torres | Blue Honda Civic · PICK 182 | Ready |
| Amir Khan | Maple | Owen Blake | White Kia Sportage · PICK 307 | Ready |
| Zoe Park | Oak | Mei Tan | Red Volkswagen Golf · PICK 416 | Not ready |
| Isla Reed | Maple | Rafael Ortiz | Silver Ford Ranger · PICK 550 | Permission revoked; hold |
| Avery Brooks | Harbor School | Casey Wells | Gray Honda Odyssey · HARBOR 12 | Separate school |

Maple teacher is Ms. Ellis; Oak teacher is Mr. Chen. Gate coordinators Jordan Lee and Robin Patel allow concurrent-edit review. The blue Sienna and blue Civic deliberately require model/plate recognition rather than color alone. Vehicle artwork is now five locally bundled, generated model illustrations; avatars remain synthetic initials. Neither is identity evidence.

## Inspect the new car images without resetting

Reload the Expo project to pick up the latest artwork. Open **Demo tools → Show all five car models** to compare the Sienna, Civic, Sportage, Golf and Ranger. The gallery is read-only and does not announce arrivals, reorder cars or reset a school. Gate queue rows use compact versions; tap a vehicle for a larger illustration beside its actual fixture plate and driver. The white Sportage retains shaded body contours on white/paper surfaces. Unknown models, including the uncatalogued Harbor Odyssey, and failed image loads use a labeled generic placeholder rather than another named car.

The illustrations represent intended model generations, with approximate trim detail. They are not OEM assets or photos of the authorized vehicles. See [asset inventory and provenance](../apps/mobile/assets/vehicles/README.md) and [exact generation prompts](../apps/mobile/assets/vehicles/manifest.json). A licensed model catalog or supplied vehicle photos can replace these static images without changing queue state or handoff rules.

## Driver, gate and classroom walkthrough

1. On one device choose Daniel Cruz. With an approved, accepted, approaching assignment, choose a location source in Demo tools, return to Today and press **I'm here — parked**. The driver sees only the assigned trip and its own queue position.
2. On a second device choose Jordan Lee. The announcement appears separately from the confirmed lane. Inspect PICK 024, physically match the synthetic driver and vehicle, then **Confirm driver and vehicle** and **Place in waiting queue**. A location check never performs this identity match.
3. Repeat for Lucia, Owen and Mei. For held Isla, gate staff can inspect the expected vehicle and record manual arrival after physical matching with a reason, for example “Location unavailable; driver and vehicle physically matched.” The hold remains active.
4. Keep a third device on Ms. Ellis. Only Maple's students appear. Mr. Chen sees Oak's two students. Confirmed vehicles determine preparation order; each row shows classroom sequence and global vehicle position. Reorders arrive by foreground polling and display a noninterruptive message. Readiness and custody remain unchanged.
5. With all five confirmed in original order, move PICK 550 from fifth to second. Use its drag handle or Forward/Back controls. Maple becomes Leo, Isla, Amir at global positions 1, 2, 4. Isla's hold remains visible. Teacher order is preparation guidance; it never releases students automatically.
6. The front eligible vehicle may be called to Bay 1. Bay reservation, arrival at bay and paired school handoff still require separate explicit actions. Bay/open-handoff positions are locked. An unready or held front vehicle blocks release; it does not disappear or get silently overtaken. Record an observed move to the exception area with a reason only after the physical move. Rejoining appends it to the rear and also requires a reason.
7. Complete the original two-party school and home handoffs and final empty-vehicle check as described in the POC 1 runbook. Every child-specific action now names the selected child.

## Location sources and demo zone

**Actual foreground device location** is the default when an account is selected. No permission or sample is requested on launch or during polling. The explicit arrival button requests foreground permission, obtains a current measurement and submits it for server validation. Permission denial and measurement timeout remain actionable errors; they do not produce an arrival.

**SIMULATED inside/outside/stale/inaccurate sample** modes in Demo tools never access the device location. Inside uses the configured center and 5-meter accuracy; outside offsets latitude; stale is 60 seconds old; inaccurate reports 120-meter accuracy. All use the same server validation path, with source recorded distinctly. They are testing evidence, not proof of actual proximity.

The server checks assignment, role, trip state, generation/version, server-owned zone version, finite coordinate bounds, sample age at most 30 seconds, future skew at most 5 seconds and accuracy at most 25 meters. Distance must be inside the radius, including the accuracy margin. Boundary uncertainty is rejected. The default 100-meter zone is synthetic and provisional, not a field-validated school zone.

To test real location where you are, gate Demo tools offers **Use my current location for the DEMO zone**, followed by a separate **Confirm demo zone settings** step. This explicitly stores the measured center in the private local SQLite database and advances the zone version. It is not written into committed school fixtures. Radius is configurable from 25–500 meters. Raw arrival coordinates are not persisted in trip/audit logs or teacher views. Zone coordinates are available only in authorized driver/gate projections. Existing accepted announcements survive subsequent GPS jitter or zone edits. The POC does not attest or prevent spoofed device coordinates.

## Conflicts and connection loss

Dragging freezes the displayed lane preview. The command includes the displayed queue revision, a complete permutation and the moved visit. New arrivals and competing gate edits advance the revision. A stale drop is rejected with an explicit proposal retry; retry rebuilds against fresh state with a new command key. It never silently overwrites another gate edit or drops a new vehicle. Confirmed arrivals append to the current committed order.

Queue state, audit and receipt commit in one SQLite transaction. A repeated key recovers its original receipt; changed payloads under that key are rejected. A dropped response triggers receipt lookup, not command replay. Paused/offline devices cannot mutate, and reconnect refreshes state. Queue order persists when the API restarts.

## Native navigation

iOS uses SDK 57 `expo-router/unstable-native-tabs`, with system material where the OS supports it. Scroll-down minimization is disabled during drag and with Reduce Motion. Reduce Transparency requests a solid tab background. Web/Android retain JavaScript tabs. No custom glass cards, SDK upgrade, EAS build or deployment was introduced.

The SDK 57 documentation records iOS 16.4+, Android 7+ and Xcode 26.4+ for native compilation. Native tab appearance and minimization depend on the installed OS; older supported iOS uses system fallback behavior. See [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [native tabs](https://docs.expo.dev/router/advanced/native-tabs/) and [location](https://docs.expo.dev/versions/v57.0.0/sdk/location/). The physical-device checklist and actual validation limits are in [POC 2 validation](10-queue-validation.md).
