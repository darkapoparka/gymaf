> Historical core-surface check only. Superseded for the expanded all-screen request by [docs/QA.md](docs/QA.md) and [docs/review-verdict.md](docs/review-verdict.md). Current overall disposition: **fix**; 270-state parity remains open.

# Verification record

2026-09-05, Windows, Next.js development server at 127.0.0.1:3210, process command rooted in M:\gym. Workspace started empty without Git metadata or a remote.

## Completed checks

- TypeScript, ESLint, and optimized Next.js build pass.
- Rendered Home at 393×852, 320×740, and desktop 1365×950; images loaded, desktop columns and mobile navigation inspected.
- Rendered Progress, Messages, Profile, More Workouts, Yoga detail, and active session.
- Goal selection updates; favorites toggle; search has a usable empty state and clear controls.
- Profile edits survive a reload and populate the edit form with the saved value.
- Workout timer, pause/resume, reps edit, finish, actual duration, persistence across reload, and removal checked in the browser.
- Dialog initial focus, Escape, close-button, and selection dismissal checked. All three dismissal paths restore focus to the Change Goal trigger after the correction.
- Progress at 320px has scrollWidth 320px after the tabs-margin correction.
- More Workouts at 393px has scrollWidth 393px, centered title, X dismissal, rounded sheet, and no main navigation.
- Console: no runtime errors observed. Next development image-loading hints appeared for shared reference images.
- One UI detector pass: no impeccable findings; clean-product-ui glass finding is justified by the original reference's translucent navigation.

## Evidence limits

Browser screenshots were inspected live; this browser API did not expose a screenshot file path. The independent finish reviewer therefore reviewed source and original reference image files, with parent browser measurements supplied separately. This is not an independent pixel-diff certification.

Finish reviewer disposition: **ship**, with all three scoped material findings resolved (narrow overflow, sheet focus restoration, More Workouts composition). The reviewer did not independently inspect rendered screenshots.

No physical iPhone/Safari, health hardware, production hosting, backend delivery, complete 270-screen comparison, or 200% text-only zoom was verified. Reference fixtures remain intentionally separate from local user-entered data. Read README.md for implementation coverage and integrations still absent.
