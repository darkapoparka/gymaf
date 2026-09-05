# Verification record — 5 September 2026

## Scope
- Inventory: all 84 Mobbin flows and 270 unique source captures are retained locally.
- `docs/coverage.json`: all 84 flow entry routes rendered, with headings, no error page and no broken completed images during the entry pass. That pass used a 490px viewport; it is not a 270-state parity test.
- `docs/screen-coverage.json`: 270 independent records with explicit route/state recipes and isolated reference sessions, including 155 additional UI/data seeds. No record is labelled verified 1:1.
- Each recipe records known divergences, such as historical message subsets, native keyboard/camera surfaces, GPS and appointment fixtures.

## Build and code checks
- Production build, TypeScript compilation and ESLint passed after the initial review correction batch.
- Final production build passed after all named correction batches and removal of both temporary import and export routes. TypeScript passed within that build; final ESLint passed. `docs/build-verification.json` records emitted contract evidence.
- Impeccable detector ran once: `docs/detection-all.json` contains no findings.

## Rendered checks
- Refreshed 393 × 852 captures: home, coach selection, quiz, settings, equipment, booking, summary, profile and workout session. Assets were checked as loaded before capture.
- Exact 320 × 740 iframe checks: home, profile, coaches, metrics, booking, equipment and summary. Booking, equipment and summary initially exposed overflow; corrected measurements show `scrollWidth === clientWidth === 320`.
- Desktop rendering checked inside a 1440 × 1000 frame, with the surrounding preview controls visible in the screenshot. Home content width and scroll width both measured 1440.
- Device frames were used because this browser session did not apply its viewport override consistently to background tabs. No 393px result is reported as a 320px check.

## Interaction checks
- Flagged an exercise, chose Too Hard, added a comment, replaced it with Modified Plyo Push-Up, and observed Undo.
- Booked Mon 29 at 8:00 PM and reached the Apple Health introduction.
- Opened alternate appointment request; Escape closed the sheet and returned focus to the original button.
- Added Total Mileage to metrics, moved it above Daily Steps, reloaded and confirmed the stored order.
- Added a 45-minute run on Thursday, moved it to Friday, saved comments, reopened the schedule and confirmed Friday / Running / 45 min. Duration follows a moved workout.
- Saved a four-star workout rating and comment. Found and fixed a hydration/default-value bug; reopening the route now restores both.
- Logged weight 155 and observed it in the weight screen.

## Capture-session expansion

- All 270 capture URLs rendered at 393px with no structural error pages, horizontal overflow, broken completed images or loading placeholders. This check does not certify pixel equality or every image’s loading completion. Full record: `docs/qa-capture-rendered.json`.
- Reference data stays in a separate memory store across internal preview navigation. A reference metric reorder left the ordinary saved metric order unchanged.
- Selecting Matt continued to booking with Matt, then home after a date/time selection. Opening ordinary appointments afterward still named Lee.
- Six new 393x852 screenshots were saved after every source image loaded: `.artifacts/noah-state-v3.png`, `garrett-state-v3.png`, `launch-state-v3.png`, and the Matt, conversation and achievement `*-state-v2.png` files. Noah and Garrett actions are visible, ending at 796px. All six also fit 1440px; the compact 320px check found a nowrap heart-rate notice, corrected to wrap and confirmed at clientWidth/scrollWidth 320/320.
- Temporary screenshot exporter removed.

## Current delivery status

Independent verdict: **fix**. All named visual and bounded functional findings are resolved; only full 270-state parity remains open. The earlier visual defects are resolved in `.artifacts/*-mobile-v2.png`: sheets, summary underline/carousel, coach portrait proportions and overlap, typography roles, emblem/crop artifacts, booking footer and session photograph. Production contract persistence is proven by emitted HTML, with Next's own hidden Suspense prefix recorded accurately.

The original all-screen request is not complete. Remaining work is the exact-state reproduction/comparison pass, including exact photo/recording fixtures, remaining chart/scroll/selection differences and browser adaptations of native surfaces. All 270 route mappings are explicit; source conversation snapshots, historical list entries, alternative coaches and launch state are now implemented. No state is automatically approved from its route, recipe or screenshot inventory. Continue from `docs/screen-coverage.json` and the independent verdict; preserve local changes and the running development server.

Browser resource pressure interrupted the final capture batch. Closing temporary reference tabs and using a fresh device-preview tab recovered capture; the final v2/v3 files were saved after all source images loaded. Browser permission, camera and codec paths remain untested on phone hardware.

## Boundaries
These are local interactions. No email, coach message, payment, membership cancellation or health data was transmitted. Native camera and recording code exists, but hardware permission, capture and codec paths were not verified on an actual phone. No public deployment or connected-service certification was performed.
## Resumed source-fidelity batch

Updated 5 September 2026 after the prior 270-state structural pass. The structural count is not a pixel-parity result.

- Added source status-bar chrome only in capture previews; app comparison viewport is 393 x 852 after excluding Mobbin attribution.
- Added four recording states, progress-photo entry/source/camera/timer/timeline states, captured cover photographs and weight overview/entry states.
- Added 20 editable capture keyboards. Eleven input families were checked for rendered keyboard, correct focus and no horizontal overflow at 393px. The account phone/email values were verified visually because the browser tool masks sensitive input values in DOM output.
- Browser interaction checks passed: target161 -> delete/add ->162 ->SET updates target and chart; three-photo draft ->Save shows dated timeline; Record ->Stop ->Next shows share sheet; Forest cover ->Save returns to profile editing. These are isolated preview flows, not external-service tests.
- Reviewed source screenshots: email, weight target, progress-photo entry, cover gallery, recording-ready, home; responsive checks320 and desktop1440. Final evidence is indexed in docs/reference-rendered-evidence.json and .impeccable/review. The reviewer scored its named visual defects resolved; full270 pixel parity remains unverified.
- Fixed a duplicate React sibling key on ordinary routes and replaced deprecated Next Image priority use inside the Photo primitive with explicit eager/lazy loading. Final desktop evidence has no issue badge.
- Camera flash and exercise audio are unavailable in these previews; invoking their controls now reports that instead of simulating a successful hardware action.
- Final production build, TypeScript and ESLint passed. Temporary screenshot exporter removed before final build. Build artifact and hash: docs/build-verification.json.

Remaining acceptance work: full270 source-size visual comparison, exact native glyph/font metrics, additional source-specific input/message states, native hardware/permission-denial and reload-persistence tests. Connected authentication/coaching/payment/Health/Watch services and original exercise videos are not present.
