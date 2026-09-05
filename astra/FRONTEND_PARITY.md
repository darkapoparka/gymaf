# Mobbin frontend parity implementation

Owner confirmation, 6 September 2026: use the Future Pro Mobbin project for frontend layouts, styling, UI states and interaction flows, while retaining Gymaf identity, real backend, current authentication and persistence. This supersedes the earlier permission to retain only a general visual vocabulary. It does not authorize replacing real records with reference fixtures.

Worktree: M:/gym-fidelity. Review branch: review/mobbin-fidelity. Base: dffa707 (includes hosted email-link repair and latest local testing evidence).

Acceptance:
- Connected client screens use reference structure and measured geometry; real domain values replace captured personal content.
- Existing server commands, revision checks, session identity, authorization and errors remain authoritative.
- The source inventory remains 270 images across 84 flows. A source route is not counted as a connected implementation.
- Every capture records connected route, frontend coverage, backend capability gaps, image/content gaps, visual evidence and flow evidence separately.
- Synthetic visual comparison routes remain development-only, use no private records, and cannot submit backend mutations.
- Verify 393x852 source geometry, 320px and desktop1440; run build/type/lint/unit and relevant interaction checks. Never claim all270 parity from representative coverage.

Implementation order: connected shell/home, progress/goal, schedule/detail/player, conversation, profile/settings/auth, remaining state families. Original unavailable media and native service boundaries stay explicit. Pending unsupported domain features must not appear as working buttons backed by localStorage.

## Current handoff — 6 September 2026

Status: **NOT COMPLETE; all 270 captures across 84 flows remain NOT VERIFIED 1:1**. `astra/connected-screen-parity.json` is the current connected-screen ledger: 214 `Partial family adaptation` and 56 `Not implemented` mappings. The preceding shell/player batch recorded 208 partial and 62 absent mappings; neither set of family counts represents completed screens. The member extension below adds domain and presentation coverage without establishing individual source-state acceptance. Authenticated connected browser flows remain unverified in this worktree. The older 270-screen reference ledger under `docs/` describes the separate reference implementation and must not be counted as connected acceptance.

This document records the active frontend direction and resumable work. Existing `DESIGN.md`, `PRODUCT.md` and `.impeccable` design context are known to describe an older world; they were not refreshed because that drift repair was not authorized. Use the owner decision above, actual connected components and this ledger for this task's scope.

## Implemented frontend world

The connected client now uses the reference's pale lavender canvas, serif titles, translucent light surfaces, broad rounded cards and floating bottom navigation. Source tokens remain in `src/app/globals.css`: canvas `#f1f0f6`, ink `#202020`, line `#d8d7df`, muted `#77767e`, green accent `#82d444`, 26px general radius. Local Season Mix headings and SF Pro body fonts are retained through `src/app/layout.tsx`; font rights and Bulgarian coverage remain release gates in `astra/DESIGN_CONTENT.md`.

`src/app/connected-fidelity.css` is loaded after the existing styles. Its client scope supplies 32px primary headings, 22px section headings, mobile 16px gutters, roughly 60px top spacing, and route-specific full-height detail/player layouts. Below 360px, gutters shrink to 12px. At 760px and above, the home shell expands to 1080px; detail/player remain narrow, and schedule/profile/conversation remain centered. These are current implementation choices awaiting exact source-state comparison, not measured acceptance values.

| Surface | Current composition and ownership |
| --- | --- |
| Home, `/app` | `ClientHome` in `client-views.tsx`: next assigned workout, quick training links, loaded-history progress and upcoming records. |
| Progress, `/app/history` | `ProgressView`: goal sheet, rolling 30-day consistency, day dialog, seven-day completed-session minutes and loaded attempt history; calculations in `progress-data.ts` use the client's timezone. |
| Schedule, `/app/schedule` | `ScheduleView`: week navigation, day rows and native date-input move sheet. Source drag/reorder/add/replace variants are absent. |
| Workout, `/app/workouts/[id]` | `WorkoutDetailView`: full-height artwork region, title, prescription overview and connected start/resume/new-attempt action. |
| Player, `/app/sessions/[id]` | `SessionView` in `session-view.tsx`: saved-set progress, elapsed time, pause/resume, exercise navigation, overview, set sheet and finish sheet. `SessionScreen` retains data and mutation ownership. |
| Profile/settings | `ProfileOverview` plus `ProfileScreen`: overview, edit, security, manual membership and support/data subroutes. Profile totals explicitly say "From loaded completed workouts" and display numeric zero for empty completed history. |
| Conversation, `/app/messages` | `messages.tsx`: explicit client presentation with coach heading, text bubbles, older-message control and fixed composer. Default embedded presentation is retained for coach screens. |
| Login, `/login` | Dark email-entry composition in `auth-ui.tsx`, using the existing email code/link form. |

Training artwork currently falls back to a Gymaf dumbbell/gradient; avatars use initials and profile cover uses a gradient. Original trainer, exercise, workout and personal media are not connected. These visible gaps prevent source-image fidelity even when layout is similar. Source personal names, photos and health values must not replace actual account records.

## Retained backend boundaries

The reviewed bindings still call `profile.save` with user revision, `schedule.move` with workout revision, `session.start`, `session.save-set` with set revision, and `session.transition` with session revision. Session editors retain dirty-set tracking, acknowledged-save feedback and unload protection; the player delegates actions to those owners. Relationship selection/query context is carried through adapted workout links.

Conversation still uses `message.send`, `message.read`, cursor pagination and server read timestamps. Profile/settings retain MFA, manual `service.cancel`, `request.create`, export and logout paths. Existing authentication, authorization, entitlement checks and persisted records remain the intended authority. The preceding shell/player batch did not change `src/server`, `src/shared` or `supabase`; the member extension deliberately adds server/shared contracts and a migration as described below. Command presence and source review do not establish end-to-end correctness; reload, conflict, failure and cross-account behavior must be exercised against the retained backend.

## Evidence and limits

- **PASS, local presentation only:** parent-task browser checks at 393px for home, progress, schedule, profile, workout detail, player and login. Progress at 320px and home at 1440px had no horizontal overflow. This is representative responsive coverage, not a full route matrix or source comparison.
- **PASS, isolated interactions:** synthetic goal change/save plus Escape/focus behavior; player pause/resume and overview; schedule date changed using the native keyboard from `2026-09-06` to `2026-09-07`, saved in fixture state and shown in the next week.
- **PASS, source tests reported by parent task:** 17 unit tests; one `test:auth` test. The auth test uses a mocked HTTP contract and is not live email delivery, hosted sign-in or a connected browser test.
- **PASS after all seven review fixes, reported by parent task:** final production build including TypeScript; ESLint with zero errors and two pre-existing coach warnings; `git diff --check`. The 17 unit and one mocked auth test passes remain recorded above. The reviewer confirmed all seven reported defects resolved within the review scope; this does not establish overall 270-screen parity.
- **NOT TESTED here:** authenticated connected browser mutations, persistence after reload, multiple relationships, revision conflicts, backend errors, hosted auth, coach/operator regression, media integrations and native capabilities.
- **NOT VERIFIED 1:1:** every source capture; no exact source-state visual pass was established.

Screenshots are local ignored artifacts in `.artifacts/fidelity/`: `home-393.jpg`, `progress-393.jpg`, `schedule-393.jpg`, `profile-393.jpg`, `workout-393.jpg`, `player-393.jpg`, `player-paused-393.jpg`, `login-393.jpg`, `progress-320.jpg` and `home-1440.jpg`. They show this local presentation, not hosted or backend proof. `detector.json` is an empty array and is not a parity report.

`/design-review?view=home|progress|schedule|profile|workout|player&width=393` provides a development-only iframe review; supported widths are 320, 393 and 1440. The `frame=1` route renders shared presentation components with synthetic fixture state. It makes no backend mutations; its start control is disabled and player set entry is explanatory. Ordinary component links can leave the fixture for connected routes, so fixture navigation is not a connected workflow test. The page calls `notFound()` outside development; the final production artifact `.next/server/app/design-review.meta` records status 404, confirming build-time exclusion. Login evidence is the ordinary login presentation without a completed authentication flow.


## Review corrections closed

The final review closed these seven reported defects within its scope. Geometry below comes from local 393x852 presentation captures; it is not an exact source-state parity verdict.

| Finding | Final correction and evidence |
| --- | --- |
| Workout detail hierarchy | Title moved to approximately y=148; metadata and overview/start controls occupy the footer. See `workout-393-fixed.jpg`. |
| Player controls obscured the stage | Collapsed controls occupy approximately y=663–852. See `player-393-fixed.jpg`. |
| Profile action positioning | Edit/settings controls restored to approximately y=58. See `profile-393-fixed.jpg`. |
| Profile total truthfulness | Empty completed history shows 0 and totals explicitly describe loaded completed workouts. See `profile-393-fixed.jpg` and `ProfileOverview`. |
| Login field identification | Visible Email placeholder added while the accessible field label is retained. See `login-393-fixed.jpg`. |
| Coach conversation regression | Default embedded `Messages` presentation restored; client composition requires its explicit variant. Source-reviewed, without authenticated coach browser proof. |
| Send-button target | Client send control now has a 44px target around its smaller visible circle; embedded coach control retains its standard button. Source/CSS-reviewed. |

The four `*-393-fixed.jpg` files supersede the earlier workout/player/profile/login screenshots for the corrected initial states. Earlier interaction checks and other screenshots retain their stated scope. The temporary screenshot-export route was removed. Local ignored artifacts remain evidence attachments only; they are not application routes or backend records.

## Remaining capability and source-state gaps

- Onboarding is invitation-based; phone authentication, questionnaire, coach discovery/matching/booking, public workout catalog, favorites and on-demand picks lack the source contracts.
- Private weight records/target, injuries/exclusions, locations/equipment, travel/events and selected app/workout preferences now have a connected implementation in this branch. Hosted migration and authenticated browser acceptance remain pending. Steps, health sync and further preference/source variants remain absent; injuries and travel records do not automatically alter assigned workouts or notify a coach.
- Calls, attachments, media upload, avatars/covers, social graph/invites, rating flows, GPS, music, replacement exercises and share templates are not backed by the source capabilities. The private travel/event editor does not implement every source event workflow.
- Checkout, shipping, paid plan changes, retention/refunds and provider billing are absent. Existing manual service cancellation is not a payment-provider action.
- Apple Watch, Live Activities, Dynamic Island and widgets require native/service work beyond a browser presentation; device keyboards and permission sheets require device-specific acceptance.
- Exact source variants, error/loading/empty states, media geometry, long localized content, connected keyboard/focus/history behavior and full responsive coverage remain open even in adapted families.

## Next acceptance steps

1. Preserve the completed build/lint/test/review evidence and dirty work. Before further editing or browser work, recheck checkout and listener identity; the latest parent-verified development server is port 3212 in this worktree. Verify coach/operator shared-style behavior with authenticated browser sessions; the corrected default embedded conversation has source-review proof only.
2. Select individual rows in `connected-screen-parity.json` by source ID and state. Open their `/reference/screens/<id>.webp` and corresponding connected state at 393x852; compare geometry, type, spacing, content/media substitutions and controls. Attach paired captures and an explicit PASS/FAIL/BLOCKED result per row. Do not promote an entire family from one screenshot.
3. Use synthetic authenticated accounts against the actual Gymaf backend to prove goal/profile saves, date move across weeks, workout start/resume, set acknowledgement, dirty-sheet protection, pause/resume/finish, read-only entitlements and persistence after reload. Exercise revision conflicts and failed saves before accepting mutation flows.
4. Verify conversation send/read/pagination, relationship switching, settings/MFA/support/export/logout and email code/link auth separately. Distinguish local contract evidence, connected browser evidence and hosted provider evidence in each ledger row.
5. Complete missing source-state variants and establish backend/media/native contracts where required; leave unsupported states explicitly blocked rather than implementing apparent success with localStorage or fixture data.
6. Expand rendered acceptance to each connected route and overlay at 320px, 393x852 and 1440px, including long Bulgarian/English content, keyboard navigation, touch targets, focus return, scroll and browser history. Update this handoff and the connected ledger with reproducible evidence as each state is accepted.

## Member extension — 6 September 2026

This batch extends the pinned Future Pro visual world while retaining Gymaf/Astra identity and backend authority. It is not a replacement design system. `DESIGN.md` and `.impeccable/design.json` remain unchanged; the previously acknowledged broad legacy design drift remains outside this batch. Source inspection was performed on `review/mobbin-fidelity`, starting from `df577e97a094a6f76658e7da137250097ed857f5`, with the member implementation still in the working tree. No current-batch CI, push or PR evidence is recorded here.

| Surface | Implemented scope and remaining boundary |
| --- | --- |
| Settings, `/app/settings` | Saved travel/events, locations/equipment and injuries link to private member editors alongside app/workout, security, membership and support settings. |
| Locations/equipment, `/app/settings/location`, `/app/settings/equipment/[id]` | Location-type and naming sheets, editable location name, equipment search, Your Setup/All Equipment tabs, category filters, three-column selection grid, save and delete. Generic equipment icons remain a source-media gap. |
| Injuries, `/app/settings/injury[/id]`, `/app/settings/injury/[id]/exclusions` | Description, movement flag and saved excluded-movement selections. Entering exclusions saves the current injury draft before navigation. These records remain private and do not automatically change prescriptions. |
| Travel/events, `/app/profile/event[/id]` | Travel/Event choice, name, details, start/end dates and saved-record deletion. Dates are structured; the UI explicitly asks the member to message their coach to arrange plan changes. |
| Weight, `/app/progress/weight`, `/app/progress/log-weight`, `/app/progress/target` | Private measurements, history/trend, target and entry sheets, deletion and metric/imperial display. Storage remains kilograms; this does not add health sync, steps or body-composition integrations. |
| Preferences, `/app/settings/app`, `/app/settings/workout`, `/app/settings/instructions`, `/app/settings/tones` | Units, instruction visibility, tone, countdown and vibration persist through member commands. Public profile sharing remains disabled. Shared defaults are Metric, private profile, Periodic instructions, Marimba, countdown on and vibration on. |
| Connected player | `SessionScreen` loads member preferences; `SessionView` uses instruction visibility, next-exercise countdown, browser audio tone and supported vibration. Audio/device capability and exact native behavior remain separate acceptance work. |

`member-area.tsx` owns loading and mutation state; `member-views.tsx` supplies shared connected/fixture presentation. The `me/details` read and `member.save`/`member.delete` commands use `20260905224715_member_frontend_records.sql`; [ADR-008-MEMBER-RECORDS.md](ADR-008-MEMBER-RECORDS.md) records their backend contract and deployment boundary. Its `member_records` table supports six kinds: preferences, location, injury, event, weight and weight-target. Reads use an active actor and RLS; writes validate fields, ownership and revisions, and preserve actor-scoped command idempotency. Preferences and weight-target are singletons. Query DTOs omit `user_id`; ownership cannot be supplied by the caller. These are account-private records, with no implicit coach sharing. An injury/exclusion or event save does not rewrite a workout, send a message or imply coach acknowledgement.

### Member evidence and limits

- **PASS, final local source/build evidence reported by the parent task:** production build including TypeScript after the last guard fix, 21 unit tests, one mocked-auth HTTP test, ESLint with zero errors/two pre-existing coach navigation warnings and `git diff --check`. The auth test was rerun sequentially after the build; its earlier premature startup failure is superseded. The mocked contract does not prove hosted email/authentication.
- **PASS, isolated database evidence reported by the parent task:** PostgreSQL 17.4 at `.artifacts/member-db/data`, loopback port 55445, clean disposable database `gymaf_member_final`; all migrations, synthetic seed, core coaching SQL tests and member SQL tests passed. Member coverage exercises every kind's supported create/read/update/delete behavior (preferences deletion is intentionally denied), weight retry/revision handling, invalid/null payloads, owner override, sibling-client, coach and anonymous denial. Provider schema/JWT context is simulated. This is real local PostgreSQL command/policy evidence, not hosted Supabase Auth or browser persistence proof.
- **PASS, bounded local presentation/review reported by the parent task:** all six final member findings were resolved: nested draft loss, equipment hierarchy, contrast/44px weight controls, event-details height, in-flight weight editing/dismissal locks and shared preference defaults. At 393px, equipment columns measured 115px and the event date section began at approximately y=404.59 with a 95px details textarea. Reviewed member states had no horizontal overflow at 320px, 393px and 1440px. Clicking the header Back control during a fixture tone save remained on the current view; returning after the save retained the selected tone. No geometry changed after the fixed captures. These measurements cover the reviewed states, not every member route or every source capture.
- **PASS, fixture exclusion verified from the current build artifact:** `.next/server/app/design-review.meta` records status 404. Member fixture saves use a synthetic 1200ms delay and in-memory state, without API mutations. This fixture evidence cannot establish backend persistence.
- **PENDING:** applying the new migration to the existing hosted `gymaf` project (`crhcgcqanoeoddmwaqhb`), subject to the outstanding owner approval. No hosted member migration has been applied, no `.env.local` exists in this worktree, and no real client data was used. Hosted CRUD, authenticated browser reload/retry/conflict/privacy checks and real device cues remain unverified.

Development review supports `settings`, `location`, `equipment`, `injury`, `event`, `weight`, `log-weight`, `app-settings`, `workout-settings`, `tones` and `instructions` through `/design-review?view=<view>&width=393`; widths 320 and 1440 are also available. These share presentation components with the account routes but use synthetic records. Fixture navigation and delayed successful saves are presentation exercises only.

Current local screenshots are in `.artifacts/member-review/`: `equipment-393-fixed.jpg`, `event-393-fixed.jpg`, `event-1440-fixed.jpg`, `log-weight-320-fixed.jpg`, `log-weight-393-fixed.jpg` and `workout-settings-393-fixed.jpg`, plus prior `injury-393.jpg`, `location-393.jpg` and `settings-320.jpg` captures. The fixed captures supersede the corresponding earlier member states. `detector.json` alone is not a visual parity report.

Next member acceptance requires paired source/connected captures per ledger row, a hosted migration decision and synthetic authenticated browser journeys covering create/edit/delete, refresh, revision conflicts, failed saves, nested editing and relationship/account boundaries. Overall 270-screen/84-flow 1:1 parity remains **NOT COMPLETE / NOT VERIFIED**.

## Review branch publication

Member source committed as `d64a56d` and pushed to `origin/review/mobbin-fidelity`. Draft PR [#3](https://github.com/darkapoparka/gymaf/pull/3) targets `astra`; no merge or deployment occurred. The preceding working-tree descriptions identify the inspection snapshot. CI for this PR is pending at publication and must be checked separately before claiming hosted validation. The local disposable PostgreSQL test server on port 55445 was stopped after its successful checks; its synthetic data/logs remain under `.artifacts/member-db/`. The review app remains on port 3212. Hosted member migration approval is still pending.
