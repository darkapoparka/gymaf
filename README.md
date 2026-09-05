# Future Pro web

Interactive web recreation of the supplied [Future Pro iOS Mobbin collection](https://mobbin.com/apps/future-pro-ios-e5c0e84e-d7e7-46cd-9662-23bffc92ca32/f4ddb8cd-b304-5687-8b52-ea09c577dfae/screens). Built with Next.js 16.3.4, React 19.2.8, TypeScript and custom CSS.

## Run

```sh
npm ci
npm run dev
```

[Open the app](http://127.0.0.1:3210/) · [Browse all reference captures](http://127.0.0.1:3210/review) · [Device preview](http://127.0.0.1:3210/preview)

`npm run build` creates a production build. `npm start` uses port 3210, so do not run it alongside the development server on that port. Checks: `npm run lint` and `npm run typecheck`.

## Coverage

All 84 captured flow families now have a local implementation entry. All 270 unique source images are retained, individually indexed and accessible in `/review`. **This is not verified 1:1 parity across all 270 states.** The review page exposes an explicit route, state recipe, evidence scope and known differences for each capture. All 270 capture URLs passed a structural render check at 393px. This is not an exact-state or pixel comparison. `docs/screen-coverage.json` is the authoritative state ledger; `docs/coverage.json` tracks flow families.

| Area | Implemented UI and local behavior |
| --- | --- |
| Onboarding | Contact/email, coach questionnaire, matching, coach profile/search/filter/sort, checkout forms, welcome, kickoff booking/rescheduling, health introduction, personal details, activities, setup, injuries, notes, notifications |
| Training | Library/search/filter/favorites, equipment, workout settings, session timer/pause/restart, overview, reps, flags/comments, replacement/undo, history, music unavailable state, recording/preview/local sharing, running, summary carousel/backgrounds/sharing, feedback and flag removal |
| Schedule and progress | Add/move/remove workouts and duration, schedule comments/history, goals, consistency/calendar/completion, rings/steps/measurements, metric ordering, weight targets and logs, progress photos |
| Community and profile | Messages/attachments/photos, saved recordings, coach rating, friends/leaderboard/invites/QR, profile/cover/interests/privacy, travel/events, coach change |
| Account and settings | Account fields, sign out, membership/plan/retention/cancellation, shipping/payment forms, help/questions/deletion explanation, locations/equipment/injuries/exclusions, app settings, watch/permissions/about, local login flow |
| Native presentations | Launch surface and interactive web representations of Live Activities, Dynamic Island and widgets |

UI controls are real React/HTML components. No screen is replaced by a full-screen reference screenshot. Reference screenshots supply cropped photographic assets; original exercise videos are unavailable. Future's official website supplied the retained Season Mix/SF Pro fonts and emblem assets, recorded in `docs/brand-assets.json`. Serif numerals use Georgia where it better matches the captured native app; font provenance alone is not a parity claim.

Reference previews use isolated in-memory data keyed by capture. Selections follow internal preview navigation; reloading resets that document’s preview session. Ordinary app data remains untouched. The 270 fixtures include 155 additional UI/data seeds; the rest initialize the mapped surface with baseline reference data.

## State and boundaries

Data is stored locally under `future-pro-local-v1`, with recorded clips in IndexedDB `future-pro-media`. Client initialization waits for the browser before forms read saved defaults. Schedule duration follows reordered workouts. Source names, June 2026 statistics and the initial event are fixtures. The 55-item commercial-gym list combines source-visible equipment with an authored fixture; it is not a live gym inventory.

No coach messaging, authentication provider, subscriptions, payments, Apple Health, Apple Watch or GPS integration is connected. Forms and messages save locally and explain that limitation. Camera/file capture uses browser capabilities; hardware behavior has not been validated on a phone. Ordinary inputs use device keyboards. Twenty capture states render an interactive reference keyboard for comparison; native date pickers and camera access remain browser-dependent. Source conversation snapshots, Noah/Garrett/Matt coach alternatives, the launch emblem and achievement dialog are implemented. Photo/recording/gallery states now have source fixtures. The complete coach directory, exact native controls and remaining source-specific differences are not claimed as 1:1.

This is a local build, not a deployed service. See `docs/QA.md` for tested behavior and viewport evidence, and `docs/review-fidelity.md` for the latest bounded finish review. The temporary asset/screenshot import endpoint has been removed.
