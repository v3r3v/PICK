# PICK — recognizable car-model images for the demo

Continue in this existing implementation task. The user reviewed the vehicle direction and explicitly clarified: “I need real 2D car models to be shown,” with car-model examples usable in the PICK demo. They asked the coordination task to prompt this task with the change. Implement this asset/UI update, using relevant skills, and show the resulting artwork in the application.

Source reviewed:
https://chatgpt.com/share/6acc459c-e0e4-83ea-aa06-8783c8527ada
Title: Car Model Recommendation
Underlying ChatGPT conversation ID: 6acbc2e3-4cec-83e9-9849-6dd388fdc649.

The coordinator read the FULL shared page in the browser because read_thread returned only a content-reference marker for the assistant answer. The user's idea there is recognizable vehicles that the gate guard drags into the physical pickup order, synchronized to teacher dispatch views. The recommendation discusses licensed 3D assets rendered to standardized 2D images as a long-term pipeline, optional ComfyUI for illustration exploration, and authoritative backend queue state. The shared page's example uses emoji and is not the desired visual quality. Its third-party reference pictures are references, not automatically licensed downloadable app assets.

Chosen demo approach:
A small, locally bundled catalog of realistic, model-specific 2D raster cutouts in one consistent three-quarter view. Use the built-in image generation tool/skill for original model-specific demo illustrations, not ComfyUI installation or a full live 3D renderer. Aim for recognizable real make/model proportions, characteristic headlights, grille, roofline and body shape. These are representative generated images, not certified OEM drawings or photographs of the actual authorized vehicle. Keep that distinction concise and honest.

“Real car models” here means recognizable Toyota Sienna, Honda Civic, etc., rather than the current primitive body-type SVG. Do not fulfill this by relabeling the same generic silhouette, changing only paint, using emoji, drawing more rectangles/paths in code, or returning an asset plan without actual images. If generated artwork is not recognizable enough, refine it using suitable public manufacturer/reference imagery where permitted; do not claim exactness that was not checked. Do not scrape random transparent PNG sites or assume search-result imagery grants reuse rights.

Current observed code:
- apps/mobile/src/vehicle-art.tsx uses Rect/Path/Line primitives and an 80x116 generic overhead schematic differentiated mainly by body category.
- apps/mobile/src/queue-screen.tsx renders VehicleArt inside the gate queue and arrivals through Identity.
- packages/contracts/src/index.ts defines vehicle.model, color, paint, plate and body for fixed synthetic assignments.
- The five School A fixtures are Blue Toyota Sienna, Blue Honda Civic, White Kia Sportage, Red Volkswagen Golf, and Silver Ford Ranger.
- School B uses a Gray Honda Odyssey, which may remain an explicitly labeled fallback if outside this small demo catalog.
- The API, 100-meter arrival zone, queue dragging, teacher synchronization and custody behaviors already exist. This change is about assets and their presentation, not a backend redesign.

Deliver five individual final images for those five School A models:
1. Blue Toyota Sienna minivan (use a consistent recognizable contemporary generation, such as 2021+).
2. Blue Honda Civic sedan (such as 2022+; distinguish it clearly from the blue minivan).
3. White Kia Sportage SUV (such as 2023+).
4. Red Volkswagen Golf hatchback (such as Mk8).
5. Silver Ford Ranger double-cab pickup (choose and document the depicted generation).

Asset art direction:
- Realistic product/catalog render delivered as a static 2D PNG/WebP, not a 3D runtime asset.
- Same elevated front-three-quarter camera, front pointing toward the left, entire vehicle visible, wheels grounded, centered with consistent framing and generous unclipped edges.
- Neutral studio lighting and restrained reflections; readable vehicle details at thumbnail size.
- True transparent alpha background; no checkerboard baked into the bitmap, scene, floor rectangle, collage, caption, people, student, watermark or decorative effects.
- Keep a very subtle contact shadow only if it reads cleanly across the existing paper/white app surfaces.
- No in-image plate text needs to match a synthetic plate: the actual fixture plate remains rendered as UI text.
- Preserve natural aspect ratio; don't stretch a sedan to fit the minivan.
- Generate each distinct car in its own image tool call, as instructed by the imagegen skill. A contact sheet alone is not a usable substitute for the individual assets.
- If needed, use the first good asset as a viewed style reference for later images. Keep each car's model identity and paint distinct.
- Bundle the selected final images in apps/mobile/assets/vehicles (or a clear equivalent). Project files must not reference only a default generated_images path.
- Ask the generator for suitable compact output; preserve originals and alpha. Use only skill-permitted tooling for image edits. Do not silently substitute the paid API/CLI path if the built-in generator fails.

Implementation:
- Use Expo-compatible static asset requires or an equivalent Metro-supported registry. No runtime image API, network image dependency, API key or downloaded 3D model is needed for normal demo use.
- Create an explicit image catalog mapping model/generation/color keys to local files, rather than hoping an arbitrary vehicle name resolves to an image.
- Keep model name, written color, plate and driver identity next to the artwork. Artwork supplements these identifiers.
- Replace the current generic School A illustrations with the actual new assets. Unknown models and failed image loads should show a clearly generic fallback and readable identifiers; never show a different named model as if it were a match.
- Adjust the thumbnail footprint to suit the three-quarter images and improve recognition on a phone. Keep the lane compact, the drag handle reachable, and the model/plate legible. Do not expand every vehicle into an oversized gallery card or redesign the entire queue.
- Show a larger version when the coordinator opens vehicle details. Include a small local model gallery in existing Demo tools if helpful so the user can inspect all five examples without resetting live demo state.
- Use React Native Image or existing Expo-compatible image facilities, with contain sizing, accessibility labels and predictable loading behavior. Use a stable container so loading does not move drag targets.
- Keep touch dragging, keyboard/button reordering, queue position, locked bay/transfer states and teacher updates intact.
- Remove/update the outdated “Representative vehicle drawings” copy where it specifically describes the old schematic. A concise note such as “Model illustrations · verify driver and plate” is sufficient in ordinary flows.
- Do not replace the driver portraits/initial avatars, logos or app icon as a side effect; this user request concerns car-model assets. No need to create another task.

Traceability and validation:
- Add an asset manifest/readme with filename, intended make/model/generation/color, generated vs sourced status, exact generation prompts and any real source/license attribution used. Do not claim generated illustrations are OEM assets, trademark-cleared or verified vehicle photographs.
- Check every generated image visually before integrating: correct body style and color, distinctive named model, consistent camera direction/scale, no clipping, transparent background.
- Inspect the updated gate queue and enlarged details on desktop and a genuine narrow viewport. Check blue Civic vs blue Sienna are visually distinct; confirm white body remains visible against white/paper surfaces.
- Use the existing Expo/Impeccable workflow and bounded visual review. Do not let generic skill discovery reopen the explicit art brief.
- Run typecheck, lint and web/iOS JavaScript exports appropriate to static asset/import changes; run relevant existing tests if queue logic changes. No new tests that merely mirror the image registry are necessary.
- Preserve current demo data, sessions and local preview where possible; do not reset the school queue just to show the artwork. No GitHub, cloud deployment, ComfyUI installation or EAS build.
- Update the runbook/validation record with what changed and what was actually checked. Do not claim physical iPhone visual validation from a web screenshot.

Finish with:
- Images or a visible app screenshot showing the actual five completed car-model examples, not only descriptions.
- The current Expo preview details and instructions for finding the images in the queue or Demo tools.
- A short explanation of why static bundled model-specific images fit this demo, and that a verified/licensed vehicle catalog or supplied actual vehicle photos can replace them later without changing the queue mechanics.
- Files changed, checks run, and remaining limitations.
