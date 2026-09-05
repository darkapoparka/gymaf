# Source audit and production gap assessment

Audit date: 5 September 2026. Repository: `darkapoparka/gymaf`. Immutable baseline: `97b24278bdc70f2e1f2cba373acfcd6c56e0664d`. This is a scoped static/architectural audit, not a penetration test, comprehensive line-by-line review, or runtime certification.

## Method and limits

The connected GitHub tools were used to inspect the branch, root tree, complete `src/app`, `src/components`, `src/lib`, and `scripts` file inventories, package/config files, root instructions, selected feature implementations, and historical QA/asset records. Source evidence below uses paths and symbols so an implementation agent can reproduce the findings at the pinned commit.

A container `git clone` failed with `Could not resolve host: github.com`; an archive was not obtained. Therefore `npm ci`, application lint/typecheck/build, dependency/advisory scanning, browser rendering, performance profiling, real-device testing, and connected-service verification were NOT run. `docs/QA.md` reports earlier build/lint/typecheck and bounded render successes, which remain historical claims. No latest-version/security conclusion can be drawn from a package pin alone.

Two copied JavaScript expression reproductions ran on Node `v22.16.0`: repeated workout completion overwrites a previous session; malformed `locations` passes the current read guard and subsequently throws. See `evidence/reproduction-results.json`. These confirm the narrow logic, not a tested application exploit or browser session.

## Observed stack

| Area | Observed evidence | Assessment |
|---|---|---|
| Framework | `package.json`: Next `16.3.4`, React/React DOM `19.2.8` | Retain the framework family; verify installability, compatibility, support and advisories before deployment |
| Language | TypeScript `^5.9.0`; `tsconfig.json` has `strict: true` | Useful foundation; runtime input validation is still missing from the local store |
| UI | Custom CSS; `lucide-react` `1.41.0`; `qrcode` `^1.5.4` | No need for a styling-framework migration |
| Routing | `src/app/[[...route]]/page.tsx`, central `FutureApp` switch, `isFlowRoute` | Suitable prototype routing; progressively introduce explicit protected/public route boundaries |
| State | `src/lib/store.ts`, `useSyncExternalStore`, `future-pro-local-v1` | Browser-local singleton data, not account-scoped persistence |
| Reference tooling | capture provider/context, `?capture=`, `/review`, `/preview`, JSON fixtures | Useful historical tooling; must not be a public production surface |
| Media | Local image references; browser media/IndexedDB helpers listed under `src/lib` | No production private-media service established by this audit |
| QA | Existing lint/typecheck/build scripts; reference-generation scripts | No test script or test-framework dependency in package.json; no `.github` workflow directory in the root tree |
| Deployment/security | `next.config.ts` only disables dev indicators; metadata is globally noindex | Production controls and environment design are unimplemented in inspected configuration |

The source inventory contains 8 app files, 30 component files, and 9 library files. The three CSS sources total 112,520 raw bytes; this is NOT the minified/compressed transfer size or a measured performance defect. Their ordered global cascade is a refactoring risk worth testing, not a reason to redesign.

## Directly inspected implementation areas

`src/lib/store.ts` in full; `src/components/future-app.tsx` in full; catch-all page and root layout in full; `workout-session.tsx` source; `account-flows.tsx` selected ranges covering coach change, injuries, preferences, account/membership/payment/cancellation/deletion; `community.tsx` messaging and beginning of friends; `schedule.tsx` schedule/move logic; `globals.css` token/base-style section. Config/package files and `docs/QA.md`/`docs/brand-assets.json` were read. Other feature coverage is inventory/documentation-based unless explicitly stated. No claim is made that every component body, fixture, dependency, or Git history object was reviewed.

## Findings

### AUD-001 — Launch blocker: no real identity/authorization boundary

Evidence: `store.ts` holds one local record with no user/workspace ownership; `account-flows.tsx` sign-out sets `preferences.signedIn` to `false`; the catch-all route renders allowed paths without a verified session. No backend/auth route, workspace model, or migration layer appears in the inspected source inventory.

Impact: browser state must never be treated as proof of identity, client ownership, or paid access. An account switch on one device must not expose the previous client's records.

Required: real authentication, workspace memberships, coaching relationships, server authorization, database policies, private routes/files, logout cleanup, and negative authorization tests. Acceptance: A cannot read/write B's record through any API or direct database API path.

### AUD-002 — Launch blocker: essential coaching operations are not a connected product

Evidence: `MessagesScreen.send` appends to local messages and explicitly reports no coach delivery. Payment update does not process payment; cancellation changes a local preference; account deletion reports that no data was deleted. Coach-facing roster, program authoring, review inbox and operational admin are absent from the source file inventory.

Required: implement the assign → perform → log → review → feedback loop, plus truthful account/support/payment state. Do not infer production functionality from clickable screens. The inspected payment handler intentionally does NOT persist submitted card fields; this audit is not alleging stored raw-card leakage.

### AUD-003 — High: repeated workouts overwrite history; no per-set record

Evidence: `WorkoutSession.finish()` sets `sessions[w.id] = {seconds, reps}` and stores `completed` as unique workout IDs. Two attempts at the same workout leave one session. The weight control is disabled and reps are one session-level value, not a set-by-set history.

Required: distinct template, scheduled instance, session attempt, session exercise and set log entities. Retrying the same completion request is idempotent; genuinely repeating the workout creates another attempt. Test both cases. Do not migrate the old shape as if it were complete history.

### AUD-004 — High: local-state validation accepts malformed nested values

Evidence: `store.ts.read()` checks only `favorites` is an array and `name` is a string. `useLocalData()` then calls `value.locations.map`. `{favorites: [], name: 'Example', locations: null}` passes the guard and throws. `WorkoutSession` also parses `preferences.activeSession` without a parse guard.

Required: versioned runtime schemas, safe parse, explicit recovery notice and export/reset choice for demo data. Network requests require independent server validation. Do not silently accept corrupted or untrusted browser data as a production migration.

### AUD-005 — High: schedules and timing are prototype semantics

Evidence: `schedule.tsx` indexes assignments by weekday and renders fixed day numbers; `store.ts` seeds a historical event; `WorkoutSession` increments elapsed time with `setInterval` and saves active progress when navigating to record, not through a complete durable session lifecycle.

Impact: the model cannot distinguish weeks reliably. A backgrounded tab or interrupted session can produce inaccurate/lost state; that timing risk is inferred from code, not measured on devices here.

Required: real dates/timezones, scheduled instance IDs, persisted session timestamps/pause intervals, resume/reconnect tests, conflict handling, and server-authoritative completion.

### AUD-006 — Launch blocker: reference material is intertwined with customer routes

Evidence: the catch-all route imports capture fixtures/coverage and accepts `?capture=`; `FutureApp` imports capture components and renders Future identity; root layout loads SF Pro/Season Mix files from `public/fonts` and includes Future metadata; `docs/brand-assets.json` records downloads from Future's site.

Required: Gymaf branding and content inventory, rights review, replacement/licensing, removal of reference assets from production artifacts, and isolated internal previews. Guarding `/review` alone does NOT protect files still under `public/`. Existing Git history and public-repository exposure require a separate owner-reviewed rights/removal decision; moving a file does not erase history. No legal infringement determination is made by this audit.

### AUD-007 — High: health/private-media lifecycle is not production-defined

Evidence: local data includes injury descriptions, excluded movements, photos, messages and weight history; account deletion is a preview only. There is no implemented production retention, consent, private-file authorization or verified deletion flow in the inspected architecture.

Required: data minimization, documented lawful processing/roles, relationship-scoped access, private object storage, controlled uploads, export/deletion, log redaction and a restore/deletion policy. Privacy review applies before a real-data pilot, not only public launch.

### AUD-008 — High: no reproducible production quality/security gate

Evidence: package scripts lack test/E2E tasks; root tree lacks GitHub workflows; `scripts/` contains reference catalog/fixture/coverage/OCR utilities, not a production test suite. Earlier QA is bounded reference evidence and includes untested phone hardware paths.

Required: CI from a clean install, runtime/lockfile verification, security scanning, unit/integration/RLS/E2E/visual/accessibility tests, and tested migration/restore procedures. No dependency vulnerability severity is asserted without a fresh scan.

### AUD-009 — Medium: public rendering, localization and route/module boundaries need deliberate migration

Evidence: `FutureApp` waits for a client-ready signal before displaying app content; root metadata uses Future identity, `lang='en'` and global noindex. Large flow components route by string and share reference data imports. Mixed lbs/kg and US prices appear in account screens.

Required: server-render public coach/marketing pages, protected application layouts, locale-aware BG/EN copy and units, intentional indexability, split feature modules incrementally, then measure bundle/performance. Do not claim the current app is slow without profiling.

## What should be retained

Retain Next.js/React/TypeScript, strict type checking, usable interactive UI primitives, existing layout/CSS direction, explicitly disclosed prototype boundaries, historical route inventories and useful interaction ideas. These are assets for implementation. Do not confuse keeping them with shipping all reference flows or adopting their business rules.

## Immediate sequence

First reproduce install/build/visual behavior; establish the Gymaf design/content contract; choose/configure one backend architecture; implement real identity and tenancy; implement versioned programs and session logs; connect coach review/messages; then finish lifecycle, operations and launch gates. See `ROADMAP.md` and `backlog.json`.
