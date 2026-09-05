# Astra branch — local implementation handoff

Updated 5 September 2026. This branch contains implementation code, not only specifications. It is a pre-release connected-web build. Do not merge/deploy it or use real client information merely because CI passes.

## Get the implementation without disturbing local work

In your existing checkout, inspect `git status` and preserve unrelated work first. Then:

```sh
git fetch origin
git switch --create astra-local-test --track origin/astra
npm ci
```

Use a different local branch name if `astra-local-test` already exists. Do not use `reset --hard`, force-push, or overwrite your existing local changes. The remote development branch is `astra`; `/astra` in the repository is the documentation directory.

The application dependency versions and lockfile are retained. Node 22 is the tested CI runtime family; the native Node TypeScript test command needs a recent Node 22 release. Docker and the Supabase CLI are needed for the complete local backend. No paid cloud project or remote database is required by this setup.

## Start an isolated local backend

From the repository root, with Docker running:

```sh
npx supabase start
```

For a **new/disposable local Gymaf test database**, apply the complete migrations and local seed helper reproducibly:

```sh
npx supabase db reset --local
npm run astra:seed
```

**The reset deletes data in this project's local Supabase database.** Do not run it against valuable local data. Do not use `--linked`, a remote `--db-url`, or production credentials. The local seeding script independently refuses non-loopback API endpoints. It does not overwrite an existing `.env.local`.

The seed command creates synthetic accounts and coach/client relationships, grants time-bounded complimentary access and prints only test email addresses and IDs. It creates `.env.local` with the local public/anonymous key, not a service-role key. The admin key is read in memory from the local CLI solely for local synthetic account creation.

Check `.env.local` matches `.env.example`. Open the app using the exact `APP_ORIGIN` (default `http://127.0.0.1:3210`), not a different localhost alias. Origin matching deliberately rejects cookie-authenticated writes from another origin.

```sh
npm run dev
```

App: `http://127.0.0.1:3210`. Local email inbox: `http://127.0.0.1:54324`. Local Supabase Studio: `http://127.0.0.1:54323`. Port conflicts or a different CLI configuration must be resolved before testing; do not point previews at a real database to work around them.

## Test accounts

| Role | Email |
|---|---|
| Coach A | coach-a@gymaf.example |
| Coach B | coach-b@gymaf.example |
| Client A1 | client-a1@gymaf.example |
| Client A2 (same coach, different client) | client-a2@gymaf.example |
| Client B1 | client-b1@gymaf.example |
| Operator | operator@gymaf.example |

At `/login`, request a code for a test address, read it in the local email inbox, and enter it in the form. No shared password is committed. Use separate browser profiles/contexts for simultaneous coach/client accounts; tabs in one profile share cookies.

The seed enables a **synthetic local MFA bypass**, clearly shown in the UI, so the first workflow can be exercised without enrolling six authenticators. This bypass is stored in `gymaf_private.runtime`; production migrations default it to false. Never ship `supabase/seed.sql`, its helper function, or its bypass into a real environment. To test actual MFA locally, use the local SQL editor to set `synthetic_local=false`, then enroll/verify through `/app/profile`. Rerunning the synthetic seed turns the bypass back on. Provider MFA, recovery and cookie/device behavior still need explicit tests.

## Main routes

`/` Gymaf entry; `/login` email-code sign-in; `/join#token=...` private invitation; `/app` client home; `/app/profile` profile, security, service and data requests; `/app/schedule`, `/app/history`, `/app/check-ins`, `/app/messages`; `/app/workouts/:id`; `/app/sessions/:id`; `/coach` roster; `/coach/programs` builder/versioning; `/coach/reviews`; `/coach/clients/:id`; `/operator`; `/coaches/:slug` published public fields only.

## First manual test journey

1. Sign in as Coach A. Create a program with one workout, two exercises and differing set targets. Save, then publish the saved draft. Open Client A1 and assign that published version to an explicit date.
2. In a separate browser context, sign in as Client A1. Update the profile, open the assigned workout, start a session, enter and save distinct actual values per set. Reload after acknowledgement and confirm persistence. Pause/resume, finish, then intentionally start a second attempt and confirm both histories remain.
3. Submit the weekly check-in (the period begins on Monday) and a text message. As Coach A, open the client/review inbox, inspect actual set logs, reply and submit feedback. Refresh or leave the conversation visible for its 15-second polling interval.
4. As Client A2 and Coach B, attempt A1's copied relationship/session URLs. Their records must not be returned. A disabled button is not sufficient evidence; run the direct REST tests too.
5. As operator, create a workspace for an account that has signed in, grant synthetic complimentary access, and acknowledge support requests. Deletion requests deliberately cannot be marked fulfilled by a fake button.
6. Test logout/account switch in multiple tabs, expired access, fresh OTP login, MFA, failed writes, slow networking, unsaved-set navigation, messages after service end, and invitation expiry/wrong recipient.
7. Compare mobile/desktop layouts with the existing visual direction. Check 320px, 393px and 1440px, phone keyboard/safe areas, focus order, actual Bulgarian glyphs and text expansion. Record differences; do not assume visual parity from a passing build.

## Repeatable checks

```sh
npm run test:unit
npm run lint
npm run typecheck
npm run build
npm run test:integration
```

`test:integration` requires the local Supabase stack and creates additional synthetic records. It reseeds the local actors and checks the real local Auth/PostgREST path, ownership, history, retries, messages and app-session revocation. It is not a browser/MFA/real-device test. Avoid running it during your manual session because it can revoke a synthetic session used by the tests.

GitHub Actions separately runs the unit suite and app checks, plus actual PostgreSQL migration/ownership tests using a **simulated Supabase Auth context**. That database suite must not be described as a real Supabase Auth integration test. See `evidence/astra-ci-2026-09-05.json` for observed CI results.

## Original UI comparison mode

For development-only comparison set `GYMAF_REFERENCE_PREVIEW=1` in `.env.local` and restart `npm run dev`. The historical catch-all screens, `/review` and `/preview` then become available. Set it back to `0` for normal Gymaf testing. Connected routes remain separate. Production-mode builds never enable those reference routes.

The old reference components/data/assets are retained rather than destructively removed. The old local-state bugs are not declared fixed in preview mode: the connected app bypasses that state store. Source fonts/images still require rights cleanup before distribution, and route gating does not make files under `public/` private. No generated media was added.

## Known limits to report, not hide

The app is not the full 32-item roadmap. Actual store apps, live payments, private uploads, reviewed exercise-media catalog, automated erasure/retention, external notifications/outbox, full localization, exhaustive accessibility/visual review, load tests and operational launch approval remain unfinished. Profiles/programs are form-based; the complete original feature set is not all wired to real services. History/schedule lists are bounded and some views need broader pagination. Recent-authentication gates for exports/deletion, concurrency/abuse hardening and provider session recovery require further work before real data.

## Local agent prompt

```text
Work on a new local review branch tracking origin/astra. Preserve unrelated local work.
Read AGENTS.md, astra/LOCAL_TESTING.md, astra/IMPLEMENTATION_STATUS.md and
astra/ADR-007-CONNECTED-WEB.md before treating the old backlog as unimplemented code.
Start isolated local Supabase using the supplied config and synthetic seed only.
Run install/lint/typecheck/build/unit/integration commands and record exact results.
Start the dev server and use the available browser tooling to verify the client/coach loop,
negative permissions, account switching and layouts at 393px/1440px plus 320px reflow.
Fix failures in small commits on the review branch; do not replace the visual design.
Do not deploy, merge main, collect real data, enable live billing, or claim all roadmap
items complete. Update the implementation status with evidence and remaining gaps.
```
