# Member records for the connected frontend

6 September 2026. Source implementation on `review/mobbin-fidelity`; the owner-approved hosted member migration is installed. This extends ADR-007 without replacing coaching relationships, published plans, performed sessions, authorization or provider authentication.

## Decision

Use a private `member_records` table for six bounded record kinds: preferences, locations, injuries, travel/events, weight measurements and a weight target. These records belong to an authenticated application actor, independently of their coaching relationships. Another client or coach cannot read or change them. Saving an injury or travel event does not notify a coach or change a prescribed plan.

`GET /api/v1/me/details` calls `gymaf_member_query`. Validated `member.save` and `member.delete` commands call `gymaf_member_command`, using the existing command ID, actor, audit and revision conventions. The user export includes these private records. Direct table writes and anonymous RPC execution are revoked; RLS restricts reads to the active actor. Commands validate both envelope and kind-specific JSON, serialize actor edits, enforce a 2,000-record limit and unique preference/target records, and acknowledge retries without duplicating data.

## Payloads

All saves carry `id`, `kind`, `revision` and `data`; new records use revision zero. Deletes carry the first three fields and cannot delete preferences.

| Kind | Data |
| --- | --- |
| preferences | units (Metric/Imperial), privateProfile, instructions (Never/Periodic/Every Time), tone (Marimba/Beep), countdown, vibration |
| location | name, type (Home/Gym/Outdoor/Somewhere Else), equipment names |
| injury | description, affectsMovement, excluded movement names |
| event | name, type (Travel/Event), details, startDate, endDate, training preference |
| weight | ISO date, valueKg (20–500) |
| weight-target | valueKg (20–500) |

The frontend converts displayed weights for Imperial units while storing kg. Preference defaults are shared with the player. Instruction disclosure, an optional three-second exercise advance countdown, synthesized browser audio and supported vibration consume the saved settings. Countdown and exercise navigation do not create performed set logs. Native integrations, original audio assets, public profile sharing and automatic scheduling remain absent; the privacy switch stays disabled-on.

## Validation and deployment boundary

The full migration chain was applied to a new isolated PostgreSQL 17.4 database, `gymaf_member_final`, at loopback port 55445 under `.artifacts/member-db/data`. Core coaching tests and member tests pass. Member tests cover all-kind create/edit/delete, durable reads, weight retry/revision handling, invalid dates/nulls/owner overrides, direct-write denial and other-client/coach/anonymous access denial. Provider JWT/Auth context is simulated. This does not prove Supabase Auth or authenticated browser persistence.

Following the owner's subsequent approval to continue, source migration `supabase/migrations/20260905224715_member_frontend_records.sql` was successfully installed on existing hosted Gymaf project `crhcgcqanoeoddmwaqhb` as version `20260905235553` (`member_frontend_records`). The ignored review-worktree `.env.local` uses the copied Astra publishable-key configuration with `APP_ORIGIN` on port 3212. No service-role key is part of this web configuration. The local-only seed and MFA bypass are not hosted deployment instructions.

The parent task reports a successful authenticated browser persistence check using an existing session: create a Gym location named `Temporary UI verification location`, select Dumbbell, save/reload, reopen Your Setup with count 1 and Dumbbell pressed, delete, and reload settings to verify removal. No other member data, health data or messages were created. This is bounded hosted location/equipment evidence; other member kinds, conflicts, failed saves, cross-account browser checks and device cues remain unverified. It is not full provider-auth or production acceptance.

The later training extension is separately installed: source `20260906000529_training_library.sql` maps to hosted version `20260906002504`. Source `20260906003017_application_conflict_codes.sql` maps to hosted version `20260906003110`. The conflict migration changes only explicit application-conflict raises from `40001` to `GY409` in three named command functions; genuine PostgreSQL serialization errors remain uncaught. This separates application revision conflicts from retryable database serialization errors. The full chain and core/member/training SQL passed on disposable PostgreSQL 17.4 databases `gymaf_training_final` and fresh `gymaf_training_conflicts` with simulated provider JWT context; the test cluster was stopped. An expanded mocked-auth HTTP test verifies `GY409` becomes HTTP 409.

Separate hosted favorites browser checks saved/reloaded a favorite, reproduced two stale-tab timeouts before the conflict fix, then verified immediate `CONFLICT` and recovery through Reload Favorites after the fix. Unfavorite acknowledged restoration of the original false value, confirmed after reload; the temporary second tab was closed. This does not extend the bounded member-location evidence to all member kinds, privacy boundaries or provider authentication.

See `FRONTEND_PARITY.md` and `connected-screen-parity.json` for presentation coverage. The 270-image reference inventory is not a completed-feature count, and no record is marked verified 1:1.
