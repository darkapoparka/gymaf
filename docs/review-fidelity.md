# Bounded fidelity finish review

Current disposition: **SHIP for the bounded named-fix batch**. Reviewed and closed 2026-09-05 after corrected visual evidence and recorded production-build, TypeScript and ESLint passes. This is a review of the latest media, keyboard, weight and typography batch, not certification of all 270 captures or native service parity. Earlier fix findings and intermediate verdicts below are retained as review history; the final disposition supersedes them.

## Persistence

The source direction is persisted in PRODUCT.md, DESIGN.md, docs/reference-flows.json and the literal design contract in src/app/layout.tsx. The Future Pro source takes precedence over generic craft preferences. DESIGN.md still describes earlier evidence and should be updated with this batch, its review disposition and the distinction between interactive capture keyboards and native device keyboards. The empty docs/detection-fidelity.json is a detector result, not visual acceptance.

Ordinary weight/photo/cover mutations use the local store; capture mutations use the separate in-memory capture store. Video persistence uses IndexedDB. These statements are code inspection findings; this reviewer did not exercise reload persistence. Storage failure falls back to memory without exposing that persistence was lost, so do not claim guaranteed saved-across-reload behavior.

## Fidelity

Fresh browser JPEG evidence inspected: .impeccable/review/email-393.jpg, weight-393.jpg, photo-393.jpg, cover-393.jpg, record-393.jpg, home-393.jpg (393 × 852), weight-320.jpg (320 × 740), and home-desktop.jpg (1440 × 1000). Compared with source images 60e50acd6ca18e02, bfea6e37fa7d9b94, 0c9d6d9336ed2060, cf555b20934717e7, 03c8df3d92da317a and f9ddae79f8fdb799 under public/reference/screens, accounting for the bottom Mobbin attribution outside the 852px application viewport.

- **P1 — Weight backdrop is materially wrong.** Both weight captures show an almost black page behind the dialog. The source has a medium gray dimmed lavender page. Target/log are flow routes, so the shell receives `.immersive { background:#444 }`; `.weight-progress-page` has no canvas background and is then dimmed by `#0009`. Give the weight page/shell its source lavender surface before applying the backdrop. Retain the approximately correct 393px dialog placement and keyboard position. Recapture both widths.
- **P2 — Selected cover enlarges the first grid row.** Source rows after the first begin around 273, 401, 529 and 657px; the current rows begin around 296, 424, 552 and 679px. The selected ocean rule adds 34px width while retaining the button's 1.5 aspect ratio, increasing its height and the entire grid row. Keep the selected tile's height equal to its normal row height, expand its width independently and retain the source right-edge clipping/check position. This should remove the roughly 23px accumulated offset without compressing every later row.
- **P2 — Email composition remains vertically displaced.** The source heading starts around 112px, input around 215px and Continue around 406px; the current equivalents start around 126px, 235px and 423px. Adjust the email-specific heading margins/form spacing while keeping the keyboard top at 544px. The current backdrop is brightest at upper left; the source is brightest toward upper right/center. Match the source backdrop distribution. The QR action currently has a near-white fill with a white glyph, whereas the source uses a dark translucent fill; apply the source surface so the glyph remains visible.
- **P2 — Remaining source details are unproven.** Home is recognizably close in major composition but lacks the source unread-message badge `1`, and its workout metadata is smaller. Scope any source fixture badge to the reference state, rather than manufacturing unread real messages. Typography remains a role-by-role comparison: bundled font names alone do not prove matching metrics. The record frame correctly retains black camera content and the source control hierarchy; line-based camera/flash icons remain approximations of the heavier native glyphs.

The progress-photo dialog closely follows the reference's placement, square-corner geometry, three slots and disabled Save state. The 320px weight capture fits its visible controls and keyboard without visible horizontal clipping. Desktop home is an adaptation, not source parity. Its red development badge was attributed by the builder to the temporary screenshot export route; remove that route and verify the final production build before publishing new clean evidence.

## Craft floor

The source explicitly earns its compact cards, translucent navigation, metric composition and GOAL ENTRY label. Do not remove those to satisfy generic style preferences. Real controls, named icon actions, image crops, reduced-motion support and native dialog primitives are present. Visible small-width composition passes this bounded image inspection.

The QR contrast issue above is actionable. Full computed contrast, keyboard focus traversal, touch-target behavior and motion were not measured by this reviewer. Several source-sized controls are below 44px visually; preserve their appearance and enlarge nonoverlapping hit areas where feasible. The CSS removes the weight input outline globally; ensure keyboard users still receive a visible focus indicator on the containing field, outside deterministic capture styling.

## Functionality

Code inspection supports editable capture keyboard keys, numeric deletion, Done dismissal, weight validation/save, cover selection/upload/save, progress-photo upload/delete, and native-dialog close/Escape/backdrop logic. Ordinary inputs use the device keyboard. The reviewer had no browser and did not independently execute these paths. The builder reports fresh passing preview checks for keyboard `161 → 162 → SET` updating chart/target, three photo drafts saved to the timeline, `Record → Stop → Next → Share`, and selecting Forest then saving to profile/edit. The builder also reports focused-input checks across 11 keyboard families and no 393px horizontal overflow. These are scoped builder runtime results; they do not verify physical camera hardware or an external backend. A phone-account field whose focused value was unexpectedly empty is under builder investigation and must be resolved or explicitly retained as open before final closeout.

Two material limitations need explicit handling before claiming complete functional parity. Photo/record Flash only toggles React state and does not apply a camera torch constraint. Record exercise Mute toggles an icon but has no exercise audio because the exercise is a static source crop. Keep source appearance, but make unsupported actions explain their local limitation when invoked, or implement a capability-checked device action. Do not describe the icon change as working flash/audio.

Real recording code requests camera/microphone access, records a MediaRecorder blob and stores it locally. Sending ends with an explicit local-save/coach-disconnected explanation. Capture recording intentionally advances fixture states without an original video. Camera hardware, permission denial, real recording, playback, upload recovery and reload persistence still require runtime evidence before they can be called verified.

## Verdict

**Fix**, not rebuild: the source structure and media are substantially present. Resolve the weight canvas, cover selected-row sizing, email geometry/background/QR contrast, and truthful unsupported-control behavior, then replace affected screenshots and rerun the final build. Preserve the remaining typography/native-glyph/home fixture differences as open fidelity work unless separately corrected and compared. Neither this review nor an empty detector report establishes complete 1:1 parity.

## Correction-batch verdict pass

Freshly viewed on 2026-09-05: email-393-v2.jpg, weight-393-v2.jpg, cover-393-v2.jpg, home-393-v2.jpg and weight-320-v2.jpg under .impeccable/review. This pass scores the named defects; it does not broaden source acceptance to other screens.

| Named finding | Status | Evidence |
| --- | --- | --- |
| Weight page incorrectly black behind modal | Resolved | Both v2 weight screenshots show the source gray dimmed canvas. The page now explicitly paints the lavender surface. |
| Selected cover increases first row height | Resolved | Cover v2 restores row 2 to about 272px and removes the approximately 23px displacement of subsequent rows. Exact crop equivalence remains unverified. |
| Email heading/input/Continue too low | Resolved | Email v2 moves these to the source positions, retaining the keyboard at 544px. |
| Email background light distribution | Resolved | The named left-versus-right lighting mismatch is corrected. This does not certify exact backdrop pixel equivalence. |
| QR white glyph on near-white fill | Resolved | Email v2 shows a legible white QR glyph on the source dark translucent surface. |
| Home unread fixture `1` absent | Partial | Badge is now present, but home v2 makes it bright red; the source badge is dark with a white numeral. Change `.nav-unread` background from `#ff303b` to source ink. |
| Home workout metadata undersized | Resolved | The named correction to 16px is present in CSS and visible in home v2. Exact font metrics remain unverified. |
| Ordinary weight field has no focus indicator | Resolved in code | An ordinary-mode `label:focus-within` outline is implemented. This reviewer did not perform keyboard traversal. |
| Flash/Mute imply unavailable behavior | Resolved in code | Actions now expose explicit local unavailability feedback instead of changing a fake active icon state. This reviewer did not independently click the feedback states. |
| Empty phone fixture concern | Resolved; invalid tool evidence | The builder inspected a fresh account screenshot and confirmed the phone/email values are visibly present. Empty AX/DOM values were masking of these input types, not application state failure. No app fix was needed. |
| Desktop development badge | Pending clean evidence | The builder corrected the initial explanation: ordinary-route `CaptureKeyboard` and main siblings both used `key=path`, producing a duplicate-key warning. The keyboard key now has a distinct prefix. The exporter validation issue was separate. Clean desktop-v3 and final production-build evidence are pending this pass. |

Current bounded disposition remains **fix** for the unread badge surface and **recapture** for clean desktop evidence; no rebuild is indicated. Source font metrics and native glyph exactness remain unverified. The earlier broad 270-screen parity limitation remains in force.

## Final named-fix visual disposition

Freshly viewed home-393-v3.jpg and home-desktop-v3.jpg on 2026-09-05. The unread badge is now source-dark with a white `1`: **resolved**. The desktop capture has no development issue badge and retains its existing composition: **resolved**. Read-only filesystem inspection confirms src/app/evidence-export/page.tsx is absent. The corrected keyboard key is distinct from the main sibling key.

Disposition: **SHIP for this bounded named-fix batch**. The final docs/build-verification.json records production build passed, TypeScript passed within the build, ESLint passed and temporary exporter removed. Its emitted artifact is .next/server/app/review.html with SHA-256 `dc17a822b43a02b070d243b0aac20e003e205448d3c884fe6aa8a4281c5596a8`. The builder additionally reports the final local browser on port 3210 loaded Morning, Alex with all navigation controls visible and no issue badge. All named correction items are resolved at their recorded evidence level; focus and unavailable-action feedback remain code-reviewed plus builder-owned interaction evidence. No further visual recapture is required for these named fixes. This disposition supersedes the intermediate fix/recapture disposition above and does not certify exact source typography, native glyphs, complete 270-screen fidelity, physical camera behavior, external services, or a deployed release.
