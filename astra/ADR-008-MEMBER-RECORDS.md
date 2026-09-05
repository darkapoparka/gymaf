# Member records for the connected frontend

6 September 2026. Source implementation on `review/mobbin-fidelity`; hosted migration requires owner approval. This extends ADR-007 without replacing coaching relationships, published plans, performed sessions, authorization or provider authentication.

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

The existing hosted Gymaf project was inspected read-only and has the four prior migrations. The new migration is `supabase/migrations/20260905224715_member_frontend_records.sql`; no hosted application or account-data changes have been made. Owner approval is pending for installing it and configuring the review build against that backend. Do not seed a hosted project with the local-only fixtures or enable the local MFA bypass.

See `FRONTEND_PARITY.md` and `connected-screen-parity.json` for presentation coverage. The 270-image reference inventory is not a completed-feature count, and no record is marked verified 1:1.
