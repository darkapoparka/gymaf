# ADR-011: Private account details, interests and coach rating

Date: 6 September 2026. Status: implemented locally on `review/mobbin-fidelity` in `M:/gym-fidelity`, starting HEAD `442aa4d`. Both migrations are installed on the approved hosted development project; final combined local verification passed at this checkpoint. Account and rating finish reviews are bounded SHIP dispositions. Full frontend parity and production acceptance remain open.

## Decision

Extend the pinned Future Pro frontend while retaining Gymaf identity, authenticated commands and real records. `/app/account` is a Close/checkmark sheet with About You and Login groups, private account fields, verified login email, existing weight-history and avatar links, membership/help links and Sign Out. `/app/profile/edit` adds removable private interests and keeps the existing training preferences in a disclosure. `/app/messages/rate?relationship=[id]` opens a private coach-rating dialog from the conversation Star control. Reference personal names, photos and health values are not copied into member records.

These are ordinary extensions of the approved visual direction. Existing `DESIGN.md`, `PRODUCT.md` and `.impeccable` are outside this handoff; their acknowledged legacy drift is not repaired here.

## Account and profile ownership

An account singleton is stored in the existing owner-only `member_records` boundary with kind `account`. Its string fields are `preferredName`, `firstName`, `lastName`, `biologicalSex`, `dateOfBirth`, `heightCm` and `phone`. The existing `member.save` command validates these fields, retains revisions/idempotency and disallows account deletion through `member.delete`. Preferred Name is private and does not change the shared display name or the coach's training plan. Weight uses the existing dated weight records; the account form links to their editor instead of keeping a second weight value.

Login email comes from the server-authenticated user and is read-only. The optional phone field is private contact information, not phone authentication. Biological sex, date and height use validated ordinary web controls; native keyboard, picker and unit-conversion parity are not established.

`profile_interests` is owner-readable under active-actor RLS. `profile.save` updates interests atomically with the existing profile revision; older clients that omit `interests` preserve the saved list. The validated list holds at most 20 unique, case-insensitive tags of 1–40 characters. The UI retains unfinished tag input in the scoped draft; it is not a saved interest until added. Private Profile is visibly enabled and disabled for editing, with explicit unavailable-public-sharing copy. The source off/public state remains absent and must not be counted as accepted.

## Coach-rating ownership and acknowledgement

`coach_ratings` stores one 1–5 rating per coaching relationship, its revision and update timestamp. `coach-rating.save` requires the active authenticated actor to own an active relationship in an active workspace. It serializes actor commands, locks the relationship against ending, validates exact payload fields and uses the existing command/audit infrastructure. A retry with the same command ID and payload returns the saved acknowledgement; changed payload reuse or a stale revision returns `GY409`. An ended relationship remains owner-readable but cannot be edited.

`gymaf_coach_rating_query` is active-actor authenticated and owner-only. Coaches and other members cannot read these ratings. Saving a rating creates no coach message or notification and no public aggregate. Account export includes the owner's rating records, private interests and member records through their authenticated queries. Hosted browser privacy, export and save journeys still require evidence; the contract alone is not their acceptance.

## Drafts, failure and focus

Account/profile drafts retain the original saved baseline, revision and failed command ID through photo navigation and same-document history; changing submitted fields resets the ID. Rating drafts are account/relationship scoped and also recover through same-document Back/Forward. Auth/session changes and sign-out clear draft memory. This is neither durable offline storage nor a server save acknowledgement.

Dirty exits offer Save, Keep Editing and explicit Discard. Reload Saved Account/Profile/Rating requires an explicit replacement choice. Recoverable failures receive focus and expose retry/reload actions; pending and unmount guards prevent duplicate or stale completions. Confirmed mock browser recovery does not prove a real hosted conflict or successful mutation.

## Installation and evidence boundaries

- **Hosted installation, parent-reported:** source `20260906031729_private_account_details.sql` is installed as `20260906033135` on project `crhcgcqanoeoddmwaqhb`; source `20260906033420_private_coach_rating.sql` is installed as `20260906034708`. All twelve hosted migrations are installed. These are development-schema facts, not production or browser acceptance.
- **Local database, parent-reported:** fresh PostgreSQL 17.4 database `gymaf_account_rating_final` on port 55445 passed all twelve migrations, seed and seven SQL suites, including malformed account fields, singleton and owner-override checks (`.artifacts/rating-review/full-db.log`). Provider JWT context and Storage metadata are simulated locally.
- **Local source, parent-reported:** final combined build/TypeScript PASS, 39 unit tests PASS, lint zero errors/two existing coach warnings and three mocked HTTP tests PASS. Logs in `.artifacts/rating-review/`: `build-final.log`, `unit-final.log`, `lint-final.log`, `http-final.log`. The added private-account HTTP test covers authenticated ownership/schema mapping, origin, 422, GY409 and 404; these do not prove live provider behavior.
- **Mocked browser, parent-reported:** account/profile failed-save, photo/back/retry paths retained the original UUID/revision; dirty close/discard, focused errors and reload Escape/focus return were checked at bounded 320/393/1440 states. Rating Back/Forward retained unsaved selection 4; page-exit beforeunload fired and was canceled; failed save/retry retained one UUID and revision 0; dirty close and trigger-focus return were checked, with no overflow in the checked 320px state. No hosted account/profile/rating mutation was tested in this batch.
- **Bounded review:** account SHIP after visibility/copy/switch/error-spacing corrections; rating SHIP with no material findings. Screenshots and request evidence are listed in [FRONTEND_PARITY.md](FRONTEND_PARITY.md). Detector `[]` is not source-state parity acceptance.

Exactly two rating captures gain partial coverage; ten already-partial account/profile rows gain current evidence. Totals become **222 partial / 48 not implemented / zero verified 1:1**, across 270 captures/84 flows. Native controls, original media, public sharing, commercial/native service variants, hosted recovery/privacy journeys and individual paired source-state acceptance remain open. Draft PR [#3](https://github.com/darkapoparka/gymaf/pull/3) targets `astra`; current-batch commit/push/CI are pending. No main merge or production promotion is claimed.
