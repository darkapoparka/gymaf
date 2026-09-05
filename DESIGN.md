---
name: Future Pro web reference implementation
description: A source-led recreation of Future Pro iOS with a responsive web adaptation.
colors:
  canvas: "#f1f0f6"
  surface: "#ffffffbb"
  ink: "#202020"
  muted: "#77767e"
  line: "#d8d7df"
  accent: "#82d444"
  white: "#ffffff"
  button-surface: "#ffffffd9"
  primary-hover: "#383838"
  focus: "#336ba1"
  message-blue: "#3787ef"
typography:
  display:
    fontFamily: 'var(--font-season), Georgia, serif'
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-0.01em"
  headline:
    fontFamily: 'var(--font-season), Georgia, serif'
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-0.01em"
  title:
    fontFamily: 'var(--font-native), -apple-system, BlinkMacSystemFont, Arial, sans-serif'
    fontSize: "19px"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: 'var(--font-native), -apple-system, BlinkMacSystemFont, Arial, sans-serif'
    fontSize: "16px"
    lineHeight: 1.4
  nav-label:
    fontFamily: 'var(--font-native), -apple-system, BlinkMacSystemFont, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
  summary-numerals:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "52px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
rounded:
  field: "16px"
  card: "24px"
  group: "25px"
  root-radius: "26px"
  sheet: "30px"
  route-sheet: "32px"
  nav: "50px"
  pill: "999px"
spacing:
  compact: "8px"
  control-gap: "10px"
  row-gap: "12px"
  page-gutter: "16px"
  button-inline: "22px"
  desktop-gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.button-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-secondary-hover:
    backgroundColor: "{colors.white}"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "14px"
  row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "18px 16px"
  sheet:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  navigation:
    rounded: "{rounded.nav}"
    padding: "4px"
---

# Design System: Future Pro

## Overview

**Creative North Star: "Future Pro iOS reference fidelity"**

The supplied Future Pro Mobbin reference is the visual authority. The user requested its direct recreation; this document records the built implementation rather than proposing a new identity. The binding source is linked in PRODUCT.md. The earlier Glovo direction is superseded.

The interface pairs a pale lavender canvas, translucent light surfaces, Season Mix headings, compact photographic workout cards, and a floating five-item navigation capsule. Dark coach-selection and photographic training surfaces retain distinct source-led treatments. Desktop expands selected layouts because no desktop reference was supplied.

This records the current Next.js 16.3.4 / React 19.2.8 implementation with custom CSS, not proof of complete reference parity. The visual authority is retained in docs/reference-flows.json, docs/reference-screens.json, and public/reference/screens. All 84 flow families have local entry routes. The state ledger in docs/screen-coverage.json now contains explicit route/state mappings for all 270 unique captures, with 155 additional UI/data fixtures alongside baseline reference fixtures. The former candidate/missing mapping breakdown is obsolete. All 270 capture URLs passed the structural CUA check at 393 × 852 in docs/qa-capture-rendered.json: no error pages, horizontal overflow, broken completed images or loading placeholders were recorded. The image check covers completed-image failures; it is not a guarantee that every image had loaded. No capture is labelled verified 1:1.

The latest review in docs/review-fidelity.md resolves its named correction items and records **ship for the bounded named-fix visual batch**. Its pending final-build condition is now satisfied by docs/build-verification.json: production build, TypeScript and ESLint passed, with the temporary screenshot exporter removed. The emitted review HTML has SHA-256 dc17a822b43a02b070d243b0aac20e003e205448d3c884fe6aa8a4281c5596a8. This does not certify all 270 captures, exact source font metrics or native glyphs, physical camera behavior, external services, or deployment.

Current evidence is indexed in docs/reference-rendered-evidence.json and docs/QA.md, including .impeccable/review/email-393-v2.jpg, weight-393-v2.jpg, cover-393-v2.jpg, weight-320-v2.jpg, home-393-v3.jpg and home-desktop-v3.jpg. Earlier .artifacts captures and docs/review-verdict.md retain historical review scope; their earlier fix disposition is not the latest named-batch verdict. This document reports those evidence levels and adds no browser verification.

Root layout emits the binding direction in its first authored body child, template#design-contract. Next inserts a hidden Suspense element ahead of it in production, so it is not the first emitted body element. The final emitted-output verification in docs/build-verification.json confirms the literal contract and source key, including the exact line: "FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md".

**Key Characteristics:**

- Lavender and warm neutral backgrounds with soft tonal separation.
- Compact photography paired with local Season Mix headings and SF Pro controls.
- Rounded cards, circular actions, and a floating five-item navigation.
- Restrained motion and visible keyboard focus.
- Mobile reference composition with an explicitly adapted desktop layout.

## Colors

The palette is predominantly quiet neutral lavender, white, and dark ink, with fresh green reserved for selected calendar and activity states.

### Primary

- **Ink:** Main text, primary actions, active navigation glyphs, and selected tab underlines.
- **Activity Green:** Selected dates and activity accents; it is not a universal call-to-action fill.

### Secondary

- **Message Blue:** Outgoing conversation bubbles and the joined workout-feedback footer. This is a source-specific communication treatment, not a replacement for ink primary actions.

### Neutral

- **Lavender Canvas:** The default application background.
- **Translucent White Surface:** Grouped rows and soft cards that allow the canvas to remain visible.
- **Muted Gray:** Supporting labels and descriptions.
- **Lavender Gray Line:** Tab baselines and filter borders.
- **White / Button Surface:** Form fields and secondary actions.

The homepage uses an observed lavender-to-warm-neutral gradient. Desktop uses a related full-page gradient. Preserve these surface-specific treatments instead of replacing every background with one solid color. Focus blue identifies keyboard focus and is not a branding accent.

## Typography

Display and heading roles use the locally bundled Season Mix regular and medium faces through --font-season. The native sans role uses SF Pro Text regular and SF Pro Display medium through one --font-native family, followed by Apple system, BlinkMacSystemFont, and Arial fallbacks. The root layout loads all four WOFF2 files from public/fonts with next/font/local and display: swap. The brand manifest in docs/brand-assets.json records their official Future.co website provenance. DM Sans is no longer used.

The frontmatter preserves the actual CSS variable stacks because Next generates the internal font-family names. Only weights 400 and 500 are bundled; CSS requests for 600 and 700 do not imply dedicated semibold or bold font files. Summary numerals explicitly use Georgia with Times New Roman fallback because that role better matches the native capture. Font provenance and selected role corrections do not establish pixel or typography parity across every screen.

The frontmatter records default mobile roles. Main page headings enlarge to 39px at desktop, while back-navigation titles use 27px on mobile and 32px at desktop. The home workout card title uses Season Mix at 22px/500 with tighter tracking; its metadata uses 16px. Weight and progress-photo page titles use 32px; the cover picker uses 22px, reduced to 18px below 360px. Capture email/phone headings use 32px/500 with 1.12 line height. Supporting text commonly uses 13–15px sans serif. Labels retain their source case; there is no global uppercase treatment.

Global h1 and h2 headings use Season Mix medium (500), with the default role sizes and tracking recorded in frontmatter. Source-specific rules remain separate: equipment location uses native sans at 20px/500, and booking uses a compact 22px/600 serif title, reduced to 19px below 360px. Preserve these role-specific choices; bundling a named font does not establish exact source metrics.

## Layout

Source comparisons use a 393 × 852 application viewport after excluding the Mobbin attribution footer from retained source images. Capture previews add a fixed 9:41 status area with inline cellular, Wi-Fi and battery glyphs; this chrome is hidden at desktop widths and does not appear in ordinary web use. It is a comparison aid, not device telemetry or proof of native glyph equivalence.

The standard mobile shell is centered, capped at 480px, with 16px horizontal gutters and 56px top padding. Bottom padding reserves 110px plus the device safe area for navigation. Below 360px the shell gutters tighten to 12px; compact controls and horizontal activity scrolling accommodate small screens.

At 760px and wider, the standard shell expands to 1080px with 40px gutters. Home uses two columns in a 1.25:1 ratio with a 36px gap; workout results expand from two columns to four. Progress, profile, and friends also use multi-column adaptations. Immersive workout and onboarding surfaces remain narrow, capped at 540px on desktop.

The floating navigation remains centered near the bottom of the viewport. Its five destinations are Home, Progress, Messages, Friends, and Profile. Maintain bottom content clearance and safe-area handling.

Flow surfaces usually use 20px mobile gutters and centered headers with 44px / 1fr / 44px columns. Their desktop overrides start at 768px, distinct from the standard shell's 760px breakpoint. Settings and equipment appear as route sheets with a 60px top inset, 32px upper corners and 16px gutters; their inset becomes 30px at 768px. These route surfaces coexist with shared modal dialogs.

Booking uses a viewport-height flex column with a 650px minimum height. Its title begins after 112px top padding at the normal mobile width, reduced to 74px below 360px. The time grid scrolls internally while the alternative-time control and static footer remain in the flow. Summary cards use horizontal scroll snapping and visible adjacent-card cues; the carousel has 50px inline padding on mobile, 38px below 360px, and 80px at 768px, where each card slot is 292px wide.

The desktop wordmark and expanded grids are web adaptations, not source-backed desktop parity. Page-specific composition belongs in implementation and coverage notes rather than becoming a universal layout rule.

## Elevation & Depth

Most depth comes from translucent surfaces, tonal gradients, and photographic contrast. Shadows are soft and limited: circular icon actions use the root shadow, navigation uses a wider ambient shadow and an 18px backdrop blur, and modal sheets use a deeper shadow with a dimmed, 3px-blurred backdrop. Summary cards add a light ambient shadow, route sheets use a thin raised top lip, and schedule pickers use an upward shadow. Exact shadow and motion values live in the sidecar. No unimplemented tonal ramps are prescribed.

Buttons transition background over 0.18 seconds. The local matching indicator rotates over one second and the Dynamic Island representation transitions over 0.25 seconds. The implementation disables animations, transitions, and smooth scrolling when reduced motion is requested. Avoid inventing spring motion, parallax, animated gradients, or hover elevation unsupported by the source.

## Shapes

Cards and row containers have large, continuous rounded corners. Default cards use the card radius, grouped lists use the group radius, and shared modal sheets use the sheet radius. Source-specific goal/weight entry dialogs instead retain nearly square 4px corners; do not normalize them into the shared rounded sheet silhouette. Buttons are capsules; icon controls and avatars are circular. Photography is clipped to its container rather than framed by decorative borders.

Grouped rows share one outer silhouette and subtle inset separators. Filters use a light border; ordinary cards primarily rely on tonal separation.

## Components

### Buttons

Primary buttons use ink with white text; secondary buttons use translucent white. Both use a capsule shape, 46px minimum height, and the frontmatter padding. Hover changes only the background. Icon actions are 44px square. Disabled buttons lower opacity to 0.38. Focus uses a visible two-pixel blue outline with an offset.

### Cards / Containers

The home workout card combines a cropped source photograph with a warm neutral caption region. Its title and metadata remain HTML. The linked card opens workout detail. The source intro artwork has an interactive hotspot that opens the coach intro sheet. The activity strip similarly uses cropped source artwork inside accessible links. Do not describe these raster regions as wholly recreated vector UI.

Challenge cards pair a muted warm panel, serif title, ring illustration, and compact seven-day calendar. Rows use translucent white and become an inset-divider list when grouped. Preserve distinct treatments instead of forcing every card into one generic layout.

### Inputs / Fields

Text fields have white fills, a subtle gray border, 16px corners, and a 50px minimum height. The search field is a lighter capsule with a 44px minimum height and a focus outline around the containing control. Textareas permit vertical resizing. These are real web form controls.

### Filters and Tabs

Filter buttons are compact bordered capsules. Section tabs are evenly distributed text buttons with a muted inactive state and a dark underline for the selected state. The shared Tabs primitive uses a pressed-button group. Summary uses an ARIA tablist with selected tabs, an exercise-count badge and a dark active underline; its implementation does not establish arrow-key navigation.

### Navigation

The navigation capsule uses translucent white, a white border, soft blur, and five equal-width destinations. Active destinations use a muted gray pill and `aria-current="page"`. Messages uses the coach avatar; the other items use compact custom glyphs. Navigation labels remain visible.

### Sheets

Shared sheets use a native modal dialog, a rounded lavender surface, a close action, sticky title header, and scrollable content. They are capped at 440px wide and 88svh tall. Escape, close-button, and backdrop dismissal are supported. Closing restores focus to the opening control when it remains connected. Implementation verification owns the rendered evidence for dismissal and focus behavior.

The workout library route has a source-specific sheet presentation: rounded upper corners, a centered serif title, an X close action, and no floating navigation. Its header uses equal-width action columns around the title. This route presentation is distinct from the shared modal dialog and does not redefine every page header.

### Source-specific Flow Controls

Equipment uses a three-column selection grid with source crops, a sans location picker and a circular dark Done action. Images use a radial mask and darken blending to soften rectangular screenshot backgrounds against the equipment surface. The 55-item list includes authored fixture entries; matching the count is not proof of source inventory parity.

Coach selection retains a dark surface, a naturally proportioned photo, photograph continuation beside the overlapping recommendation card and an adjacent-card cue. Noah, Garrett and Matt have source-derived portrait crops and reference fixture copy. Matt uses a dark rounded portrait card with a native sans name; Noah and Garrett appear in a rounded light sheet over an ocean-photo underlay, with a raised top-edge shadow and adjacent source-photo slivers in the alternative carousel. The sheet starts 60px below the viewport top with 32px upper corners and 30px internal top padding; the neighboring photo strips are 27px wide and rotated by four degrees. The quiz and summary use retained Future emblem assets from public/brand; the brand manifest records provenance. Do not substitute a text glyph for the emblem. Not every retained brand asset is necessarily rendered.

Summary cards have 30px corners, 18px by 14px internal padding and a 520px minimum height inside the carousel. Metrics use the explicit Georgia numeral role, date/title run vertically at the side, and a separate camera action sits beside Share. Uploaded backgrounds, local templates and reference fixture metrics remain distinct from an actual synchronized workout service.

Ordinary flow forms, choice groups, metric ordering, schedule edits, weight history, photo entries, cover selection/uploads and feedback use the localStorage-backed store; recorded clips use IndexedDB. If localStorage writes fail, the implementation falls back to memory, so saved-across-reload behavior is not guaranteed or certified. Capture previews instead use isolated memory external stores keyed by capture identity. Capture-aware links and router navigation preserve the capture query during internal navigation; UI seeds apply to the original surface. The preview data survives soft navigation within the browser document, resets on reload and never writes ordinary localStorage. The bounded QA record confirms preview metric-reorder isolation and Matt-to-booking continuation while ordinary appointments still show Lee. It does not certify every possible navigation sequence.

These controls are real React/HTML interfaces. Accounts, payments, Apple Health/Watch, GPS and coach delivery are not connected, and browser camera behavior has not been verified on actual phone hardware. Preserve the local-state explanations already present in these flows.

### Capture Keyboards and Weight Entry

Twenty mapped capture states use an editable HTML keyboard with text, email, numeric and phone variants. The comparison keyboard is a fixed 308px-high translucent panel; at 393 × 852 its top is 544px. Keys update the focused real input or textarea, including insertion, deletion and selection; Shift, symbols and Done/Return are local controls. It portals into the active dialog when needed, reserves composer/sheet space and hides floating navigation. Ordinary inputs use the device keyboard. Do not describe this deterministic preview keyboard as an actual iOS keyboard or infer native dictation behavior from its microphone action.

Weight uses a lavender page, compact trend plot, three comparison statistics, target row and dated table. Target/log dialogs retain a dimmed canvas, 4px corners, centered compact labels, circular increment/decrement actions and a 36px numeric input. The ordinary field has a visible containing focus outline; deterministic capture styling is separate. Saving valid positive values updates local target/history data and returns to the weight page. The recorded preview check changed 161 to 162 and observed the target and chart update; it is not a synchronized health record.

### Progress Photos, Cover Choices and Recording

Progress photos use dated three-column grids and a centered goal-entry dialog with three photo slots and a disabled Save state until drafts exist. Upload/source selection, save/delete and camera/timer surfaces are interactive. The retained source shows black native-media frames; the black fixture is deliberate source content and contains no original photograph or playable video. Capture camera actions retain this frame without requesting hardware. Ordinary photo capture has a browser camera path, whose hardware, permissions and reload persistence remain unverified.

The cover picker is a rounded route surface with a two-column photo grid, one upload action and nine choices cropped from the retained source: Ocean waves, Color spectrum, Trail runners, Stair workout, Running together, Tropical beach, Desert mesas, Forest path and Mountain lake. Selection has a green check. The selected ocean crop can expand horizontally without increasing row height; keep the source edge clipping and regular row starts. Save updates local preferences and returns to profile editing; capture sessions route the same change to their isolated memory store.

Recording retains the black source frame, top camera/flash actions, red Record/Stop controls, exercise crop and preview/share states. Ordinary recording uses browser camera/microphone APIs and MediaRecorder, with local video persistence; capture recording advances fixture states without an original video file. Flash and exercise-audio actions explain their unavailability instead of presenting a fake enabled state. The send result states that coach delivery is disconnected. Source glyph exactness, real hardware recording, permission denial, playback and storage recovery are not certified by the passing preview flow.

### Conversation, Launch and Achievement States

Conversation capture fixtures reproduce dated messages and event states. Outgoing bubbles use Message Blue, white text, 12px by 15px padding and asymmetric corners (20px except the 6px lower-right corner), capped at 85% width. The yoga result joins workout statistics, challenge progress and a blue feedback footer inside one 26px rounded surface. Duration uses Georgia at 32px; companion statistics use native sans at 28px/600. A separate photographic challenge card has 24px corners and a 220px minimum height. Source-derived photography and grouping are implemented; exact topology and material parity remain review-dependent.

The launch state centers a 48px by 66px inline FutureMark SVG on a white viewport. Its exact path is extracted from the retained public/brand/emblem-flat.svg, with a solid currentColor fill supplied by the launch surface (#403f36). This replaces the earlier filtered metallic asset; the source path is retained without its alpha texture.

The achievement dialog reuses the modal sheet behavior with 26px corners and a 430px width cap. Its centered content has 20px by 18px padding, a source badge crop up to 210px wide, a 40px-high wordmark filtered to black, a 24px/700 native sans congratulation, activity totals and a transparent Share action. The close action sits in the upper-right corner. Presence of the source material does not certify matching typography, spacing or backdrop.

### Reference Photography

The Photo primitive positions retained source screenshots with CSS crop coordinates and overflow clipping. It uses only the intended crop region but keeps the source file for comparison. Image quality is constrained by screenshot resolution. Exercise photographs are static source crops; the original exercise videos are not available. Do not replace reference photography with arbitrary stock images or claim these are original high-resolution source assets.

## Do's and Don'ts

### Do:

- **Do** use the Future Pro reference as the authority for new visual decisions.
- **Do** preserve compact mobile composition, serif hierarchy, and floating five-item navigation.
- **Do** keep real labels, links, buttons, fields, and dialog controls accessible.
- **Do** compare affected screens with the retained source screenshots at matching mobile widths.
- **Do** distinguish bundled font provenance, role-specific Georgia numerals, raster crops, desktop adaptations, local behavior and unverified source states.
- **Do** preserve source-black media frames and distinguish editable capture keyboards from native device keyboards.

### Don't:

- **Don't** introduce a new brand direction, color theme, or decorative design seed.
- **Don't** claim full screenshot or flow parity from a subset of implemented screens.
- **Don't** represent local fixture interactions as connected native, coaching, payment, or messaging services.
- **Don't** trade the source's compact layout for large generic dashboard cards.
- **Don't** treat desktop adaptations as evidence of an original Future Pro desktop design.
