# ADR-016: Connect the original Future Pro template

Date: 7 September 2026. Status: implemented in the uncommitted review worktree; production builds passed and scoped source finish review passed. Full parity and provider/device acceptance remain open.

## Decision and scope

The owner explicitly requested the original Future Pro template with the current backend integrated after `/app` exposed a replacement member interface. In `M:/gym-fidelity`, branch `review/mobbin-fidelity`, the original component hierarchy is now the primary member presentation at both `/` and `/app`, wrapped by `BackendProvider`. The preserved template source is `M:/gym` main `c69df15`; this integration is based on review HEAD `606a7e33de50152a58a3cfdca7c9eb044b11f298` plus working-tree changes. The original main checkout was not edited.

The restored home, profile, workouts, progress, settings, messages and session presentation supplies the visual authority. Existing account, billing, media, coach-directory and service controllers remain integrated where they own newer workflows. Standalone `/coach` and `/operator` retain `ConnectedApp`; this decision does not replace their working interfaces. Existing APIs, server commands and database migrations retain ownership of authentication, authorization and persistence.

## Record and fixture boundaries

`src/lib/backend/context.tsx` loads the authenticated account, selected relationship, assigned workouts, private member records, media and favorites. Relationship context travels with member links. The template receives actual account data and assigned prescriptions rather than reference people, workouts or progress records.

`src/lib/backend/member-adapter.ts` maps saved preferences, locations/equipment, injuries/exclusions, events and weight into the template view model. Changes use the existing revisioned `member.save` and `member.delete` commands, including kilograms as the stored weight unit. Backend commands retain retry identities until acknowledgement; UI feedback must distinguish saved data from failed or pending work. Template reference local storage is never imported into a real account. Missing account records and unavailable native capabilities must remain truthful empty/unavailable states.

Reference captures are separately gated: the root catch-all requires `NODE_ENV=development`, `GYMAF_REFERENCE_PREVIEW=1` and an explicit valid `capture` query before rendering fixture data. Normal root navigation and `/app` use the authenticated provider. Capture fixtures remain synthetic reference evidence and must never be treated as account data or persisted to a real account.

## Evidence and limits

The parent task reports 54 passing unit tests, five passing mocked HTTP tests, passing TypeScript and lint with zero errors/two existing coach warnings. Production build passed twice; the latest build includes the coach-route namespace correction and auth link-mode handling. The subsequent small paused-player padding, inert-state and Close Workout correction passed TypeScript and rendered verification; it was made after that production build. No new migration or database acceptance claim is introduced by this integration.

The parent task's bounded CUA pass used an actual signed-in account for read-only inspection: at 393×852, home, profile, settings, messages, attachment modal, progress, library, workout detail and overview; at 1440×1000, home and profile. Sampled checks found no horizontal overflow or broken images, modal focus returned to its trigger, and the inspected console error log was empty. Additional read-only checks confirmed Profile → Change Coach reaches `/app/coaches/change`, rendered actual History and an existing paused workout, and verified corrected player padding and Close Workout returning safely to History. No user records were mutated. These observations do not establish save/send/payment acceptance or every responsive state.

The final reviewer reported that all source findings were addressed and the scoped source review passed. This verdict does not certify all 270 captures, native behavior or live providers. The parent task's rendered observations above remain bounded evidence separate from that source review.

| Criterion | Final verdict |
|---|---|
| Summary link and dirty-feedback exit | Relationship-preserving imports confirmed |
| Previously reported source findings | All addressed |
| Source finish review | Pass within reviewed scope |
| Rendered QA, typecheck, unit/HTTP tests | Parent reports passing; not independently rerun |
| 270-screen fidelity, native features, live providers | Not certified |
| Acceptance | Ready for scoped local acceptance |

The existing ledger remains **270 Partial family adaptation / zero verified 1:1** across 84 flows. This routing correction does not promote any capture to verified parity. Provider authentication and actual Stripe sandbox journeys, native/device behavior, media lifecycle/privacy, asset/font rights, legal seller/content and complete paired capture acceptance retain their existing gates. Current changes are uncommitted; no push, new CI, main merge or production deployment is claimed. Earlier source, CI, hosted-schema and browser records in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) retain their original scope.
