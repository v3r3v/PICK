---
name: PICK
description: Restrained, native-feeling school-to-home custody handoffs.
colors:
  ink: "#18382d"
  muted: "#53665d"
  brand: "#176347"
  brand-pale: "#e5efe8"
  paper: "#f5f6f1"
  white: "#ffffff"
  line: "#d7dfd8"
  amber: "#785014"
  amber-pale: "#fff0d6"
  red: "#993d37"
  red-pale: "#fbece8"
typography:
  title:
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.1764705882
    letterSpacing: "-0.8px"
  heading:
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontSize: "16px"
    lineHeight: 1.5
  button:
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.375
rounded:
  field: "8px"
  control: "12px"
  panel: "16px"
  identity: "20px"
spacing:
  compact: "8px"
  inline: "10px"
  confirmation: "12px"
  group: "16px"
  account: "18px"
  section: "20px"
  panel: "24px"
  wide-gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-secondary:
    backgroundColor: "{colors.brand-pale}"
    textColor: "{colors.brand}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-danger:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-danger-secondary:
    backgroundColor: "{colors.red-pale}"
    textColor: "{colors.red}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  custody-confirmed:
    backgroundColor: "{colors.brand-pale}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  custody-uncertain:
    backgroundColor: "{colors.amber-pale}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  banner-warning:
    backgroundColor: "{colors.amber-pale}"
    textColor: "{colors.amber}"
    rounded: "{rounded.control}"
    padding: "{spacing.group}"
  field:
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "{spacing.confirmation}"
  lane-vehicle:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "{spacing.confirmation}"
  navigation:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    padding: "7px 0"
---

# Design System: PICK

## Overview

**Creative North Star: "The custody handoff slip"**

A restrained, native-feeling interface gives each adult a clear identity, the current recorded custody, and the next authorized action. Paper surfaces and deep green make the synthetic afternoon journey readable; explicit wording carries uncertainty instead of relying on color.

This is the implemented visual system of the authorized, code-first local Expo POC. It retains the established paper-and-green world as the gate lane and classroom preparation views extend it. System typography, quiet grouping and recorded sequences support accessible gate-side work. School custody stays explicit while physical traffic order and class preparation share the authoritative record.

The original custody-handoff-slip direction remains the anchor. Queue imagery now uses original, locally bundled generated raster illustrations of named vehicle models and synthetic initial avatars. Recognizable model shape and paint supplement the written plate and physical driver check; these are representative illustrations, never photographs of the assigned vehicles. Generation and trim details remain approximate.

**Key Characteristics:**

- Current recorded holder and uncertainty lead the content.
- Deep green and paper support restrained, readable task flows.
- System text and large controls support platform familiarity.
- Tonal grouping and space provide depth without decorative effects.
- Physical lane position, classroom priority and custody remain distinct and explicitly labeled.

## Colors

The primary green sits against warm paper and white; amber and red are functional state colors.

### Primary

- **Deep green** (`brand`) identifies primary actions, active navigation and confirmed progress.
- **Pale green** (`brand-pale`) groups confirmed custody, secondary controls and supportive notices.

### Neutral

- **Deep ink** (`ink`) carries headings, values and ordinary body text.
- **Muted green-gray** (`muted`) carries contextual labels and supporting text.
- **Paper** (`paper`) is the page ground and inset evidence surface.
- **White** (`white`) is the ordinary panel and navigation surface, and primary-button text.
- **Soft line** (`line`) separates information rows and inactive progress markers.

### Functional states

- **Amber ink and pale amber** (`amber`, `amber-pale`) express holds, stale connections, pending transfers and unresolved custody.
- **Red ink and pale red** (`red`, `red-pale`) distinguish consequential and cautionary actions.

**The Recorded State Rule.** Color supports the written custody status; a green surface never substitutes for a statement of who is recorded as holding the child.

## Typography

React Native's default system family is the source of truth; there is no explicit family override or downloaded font. Frontmatter sizes are portable pixel representations of React Native logical units. Text remains scalable because the shared text component does not disable font scaling.

### Hierarchy

- **Title** introduces the role's current task.
- **Heading** names the next action, pickup plan or progress section.
- **Body** supplies descriptions, status, row labels and values.
- **Button** centers concise action labels and allows wrapping.

The custody card adds a child name (25/32, weight 700) and holder (22/30, weight 600). Supporting copy uses 12–14-point sizes, with explicit shorter line heights only where the source supplies them. The wordmark is ordinary system text beside a check mark, not a separate identity asset. Vehicle model labels use 18-point bold text; global lane numbers use 22-point bold text and class preparation numbers use 26-point bold text. These are functional identity and sequence roles, not additional display fonts.

## Layout

The shared scroll container centers content at a maximum width of 1120 logical units. Horizontal padding is 20 below 600 and 40 from 600 upward. Major groups use a 20-unit gap; panels use 24-unit padding and 16-unit internal gaps.

Today uses one column below 850. At 850 and above it has two columns in a 1.3:1 ratio: custody and actions on the left, progress and plan on the right. In the compact parent view, the pickup plan appears after custody and before the approval action. Other compact role views retain custody, action, progress and plan order. These are observed Today compositions, not a universal rule for every future screen.

The masthead contains the PICK mark and selected account, followed by connection freshness. Today / Queue, Timeline and Demo tools form the bottom navigation. The root uses safe-area handling; the navigation stack owns the native bar behavior.

The gate lane puts the pickup bay before the numbered front-to-rear sequence. At 1050 and above the lane and arrival sidebar use a 1.5:1 split with a 24-unit gap; below that threshold the sidebar follows the lane. The sidebar separates unconfirmed arrivals, the exception area and expected vehicles. A 390-wide browser view preserves the bay and first vehicle with wrapping identity text and Forward/Back controls. Classroom views present only the assigned class with both its preparation sequence and the global vehicle position.

The Demo tools model gallery uses wrapping cards with a 16-unit gap: 31% width from 1000, 47% from 650, and full width below 650. Each card keeps the model, color, plate and depicted generation beneath its large illustration. This gallery supports inspection without changing the queue.

Browser captures in `.impeccable/review/vehicles/desktop.png`, `mobile.png`, `gallery-desktop.png`, `details-desktop.png` and `details-mobile.png` establish the updated vehicle presentation at desktop (1280 by 720) and narrow browser (390 by 844) sizes. The gate first viewport retains the bay and first vehicle. The prior `.impeccable/review/poc2/teacher.png` remains the compact teacher composition evidence. These are browser captures, not physical iPhone evidence. Native iOS/Android safe areas, text scaling, physical dragging, sheet presentation and system tab material remain pending device verification.

## Elevation & Depth

The implemented shared components have no decorative shadows or animated transitions. White and tinted panels separate content from paper; hairline dividers clarify rows and custody details. A visible focus outline is an interaction cue, not elevation. Hover and pressed primary controls reduce opacity immediately rather than moving or lifting. The queue uses a border and insertion mark for a drag proposal. Native iOS tabs use the system-provided material where available; this platform behavior is not a custom glass token. Reduce Transparency requests a solid white bar with no blur.

## Shapes

Panels use gently rounded corners; controls, evidence insets and banners use the smaller control radius. The child identity block uses the larger identity radius. Progress markers are circles. Information rows retain hairline bottom dividers, while shared panels have no enclosing stroke. Lane vehicle and arrival cards use a fine soft-line stroke; the pickup bay uses a two-unit dashed green outline. These strokes communicate the operational lane and bay, rather than decorating every container.

The main button has a minimum height of 50. Account rows have a minimum height of 84 with a 44-square icon block. Demo switches have one full-row 48-unit target and a decorative 44-by-28 track with a 20-unit thumb. The queue drag handle is 48 units wide with a 64-unit minimum height; inspection targets have a 120-unit minimum height. Demo zone fields have a 48-unit minimum height. These preserve the brief's minimum 48-unit interaction target.

## Components

### Buttons

Primary, secondary, danger and danger-secondary variants share centered, wrapping labels. Feather icons are optional and precede the text. Hover or press applies opacity 0.85; disabled applies opacity 0.48 and prevents activation. Keyboard focus adds a three-unit green outline with a three-unit offset. The minimum height, rather than a fixed height, permits growing text.

### Cards / Containers

The shared panel supports white, green and amber tones. Custody cards place identity before the recorded holder and its explanatory status. Pending or disputed custody changes both the tone and the wording; a hold also uses amber. Evidence for a prepared handoff sits in a paper inset within the action panel.

### Banners

A success or warning icon accompanies readable status text. Warnings use amber; supportive notices use pale green. The component exposes an alert role. A disconnected state also explains that custody actions are unavailable.

### Account list

Each full-row button combines a role icon, name, role description and directional arrow. Pressing gives pale-green feedback; busy state dims the row and disables account changes.

### Navigation

Three labeled tabs pair icons with Today / Queue, Timeline and Demo tools. Green identifies the active destination. Web and Android use the JavaScript tabs and Feather icons, with a minimum bar height of 64. iOS uses Expo Router native tabs and SF Symbols (`car.fill`, `clock`, `slider.horizontal.3`), with native system material where available. The native tab bar may minimize on downward scroll; dragging and Reduce Motion force it to remain expanded. Reduce Transparency selects solid white with no blur. General application icons remain Feather. Focus behavior belongs to the navigation runtime, not the shared Button component.

### Progress and tags

Four numbered markers describe permission, school handoff, travel and home handoff. Completed markers receive check marks, the current marker a green outline and heavier label, and future markers stay neutral. A text note explicitly identifies simulated progress. The small Demo badge marks the synthetic context; it is not an interactive filter.

### Switches and confirmations

Demo switches are single accessible row controls with a checked state; the track and thumb are decorative. Inline confirmations stay beside the relevant action and offer a way to keep the current plan or cancel. Technical connection, scenario and state controls belong to Demo tools. The demo zone numeric radius field uses a soft-line border, an eight-unit radius, 12-unit padding and scalable system text; native focus behavior applies. The field and location source controls remain in Demo tools. Actual foreground device location is the default check-in source and is requested explicitly; simulated samples are visibly labeled.

### Gate lane and vehicle inspection

A numbered vehicle card combines a generated model illustration in a stable 118-by-84 frame, written model/color and plate beside it, a 42-unit initial avatar, driver name and explicit readiness/status. The driver row sits below the vehicle identity row so narrow layouts can wrap the model name without shrinking the image. React Native Image uses contain sizing and no fade; the entire vehicle remains visible.

Five local transparent PNGs depict the blue Toyota Sienna, blue Honda Civic sedan, white Kia Sportage, red Volkswagen Golf and silver Ford Ranger. Explicit fixture mappings require matching model, color and body; unknown or changed assignments and failed image loads use a labeled generic Feather truck placeholder with an image-unavailable message. The images load from the bundled catalog with no remote image service or runtime 3D. Asset provenance and approximate generations are recorded in `apps/mobile/assets/vehicles/README.md` and `manifest.json`. Model shape and paint help recognition, but physical matching remains necessary. Lane reorder is separate from confirming an arrival or changing custody. The 48-unit drag handle previews a position with a green insertion mark; Forward and Back offer keyboard and assistive alternatives. Edge scrolling is bounded and immediate, with no animated reorder. A stale proposal requires an explicit review/retry against the refreshed lane and is never replayed automatically.

Vehicle inspection opens a native `pageSheet` modal with no entry animation, safe-area wrapping and an explicit close action. The underlying trip details retain identity, recorded custody and authorized actions with the actual child's name. Gate details enlarge the same contained illustration to full available width, capped at 480 with a 1.5 aspect ratio, followed by the written plate, initial avatar and driver. A visible reminder says to verify driver and plate. The gallery reuses this large image treatment.

### Classroom preparation

Class preparation uses ordinary white panels, amber for holds, the local preparation number and a separately labeled global vehicle position. Updates explain that committed lane order changed preparation priority without changing readiness or custody. The readiness action names the actual student. A class list never represents release authorization.

The sidecar's HTML/CSS snippets are standalone visual translations of these React Native components. Their native HTML interaction and focus behavior are previews; they do not claim platform parity or replace the application implementation.

## Do's and Don'ts

### Do:

- Do lead custody views with the recorded holder and explicit uncertainty.
- Do keep the compact parent's pickup plan before the approval action.
- Do use text and icons with state colors.
- Do keep bay, confirmed lane and unconfirmed arrivals visibly distinct.
- Do label class preparation sequence separately from global vehicle position.
- Do pair representative named-model illustrations with written identity and physical checks.
- Do preserve scalable text, wrapping labels and large interaction targets.
- Do keep technical review controls in Demo tools.
- Do verify native behavior on devices before claiming native readiness.

### Don't:

- Don't imply background tracking, verified vehicle identity or release authority from a location announcement or queue position.
- Don't hide unresolved custody behind a confirmed-looking label.
- Don't treat browser captures as evidence of native OS behavior.
- Don't introduce a new font, decorative shadow or custom glass treatment as though it were an established token.
