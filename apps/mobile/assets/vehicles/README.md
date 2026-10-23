# PICK model illustrations

Five original generated catalog cutouts, created individually with the built-in Imagegen tool on 12 October 2026 UTC. The unmodified selected PNGs preserve their original alpha and dimensions. Each is 1536×1024 RGBA, around 1.7 MB (8.65 MB total); the generator returned this size despite a compact-output preference. They are bundled locally by Metro and require no image service, API key, 3D runtime or network image fetch during normal use.

| File | Intended model/generation | Paint |
|---|---|---|
| `toyota-sienna-2024-blue.png` | Toyota Sienna, fourth generation, 2024 XLE | Blue |
| `honda-civic-2024-blue.png` | Honda Civic sedan, eleventh generation, 2024 EX | Blue |
| `kia-sportage-2023-white.png` | Kia Sportage, fifth generation NQ5, 2023 North American | White |
| `volkswagen-golf-mk8-red.png` | Volkswagen Golf five-door, Mk8, 2021–2024 | Red |
| `ford-ranger-2024-silver.png` | Ford Ranger double cab/SuperCrew, P703, 2024 XLT | Silver |

These are representative generated illustrations, not OEM assets, trademark-cleared artwork or photographs of the actual assigned vehicles. Model/generation/trim details are approximate, not independently certified. The plates, driver identities and physical checks in the UI remain authoritative. No third-party photographs are shipped in this directory.

`manifest.json` records exact prompts, original generation filenames, the discarded first Sienna attempt, and source usage. The final Sienna was compared visually against a [public dealership reference](https://www.sheehyhyundaiwaldorf.com/auto/used-2024-toyota-sienna-xle-near-capitol-heights-md/109104968/); that reference was not supplied to generation, bundled or licensed for app redistribution. The comparison confirmed the generation's front/side cues; it does not establish exact trim fidelity.

Official product descriptions consulted for model context: [Toyota](https://pressroom.toyota.com/vehicle/2024-toyota-sienna/), [Honda](https://www.hondainfocenter.com/2024/Civic-Sedan/), [Kia](https://www.kiamedia.com/us/en/media/pressreleases/18069/all-new-2023-sportage-undergoes-total-transformation-gets-bigger-gets-bolder), [Volkswagen](https://www.volkswagen-newsroom.com/en/the-new-golf-gti-international-media-drive-6282/the-new-golf-gti-short-version-6283), [Ford](https://corporate.ford.com/articles/products/all-new-ford-ranger). These pages confer no image reuse license. No source image from those pages is shipped.

All five were visually inspected for body style, written-color agreement, left-facing three-quarter direction and unclipped vehicles. Alpha inspection found transparent corners on every file and roughly 46–52% fully transparent pixels. PNG RGB data behind fully transparent pixels can look dark in a viewer that ignores alpha; the actual app composites the images correctly on paper/white surfaces. The generated Sportage's white body retains gray contours and black trim.

`src/vehicle-catalog.ts` maps explicit model/generation/color keys and known fixture IDs. Model, color and body must still match; unknown vehicles and failed image loads use a labeled generic placeholder. Replace catalog entries with a verified/licensed catalog or supplied actual vehicle photographs later without changing queue mechanics.
