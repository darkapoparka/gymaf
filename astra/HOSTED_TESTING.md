# Hosted Supabase with the local Astra review

Configured 6 September 2026, owner-authorized development connection.

## Comparison URLs

- Original main: http://127.0.0.1:3210 (`M:\gym`, unchanged).
- Astra: http://127.0.0.1:3211 (`M:\gym-astra`, branch `astra-local-test`).
- Supabase project: `gymaf` (`crhcgcqanoeoddmwaqhb`), organization `darkapoparka's Org` (`uvqzodfndxevolwqiljt`), region `eu-west-1`.

Astra's ignored `.env.local` contains the project URL, enabled publishable key, `APP_ORIGIN=http://127.0.0.1:3211` and `GYMAF_REFERENCE_PREVIEW=0`. No service-role key or password is stored in that file. The app continues to use its existing server-only Auth/REST adapter.

Restart from `M:\gym-astra` with:

```powershell
npm run dev -- --port 3211
```

Use the exact 127.0.0.1 origin; localhost is a different origin for the write checks. In a second terminal, start main from `M:\gym` with `npm run dev` if it is not already running.

## Database installation

The hosted project had no application tables or migrations before setup. The four checked-in migrations from source `88cef03ca0b8c00ec3e3c4a5dba09daeb5023506` were installed through the Supabase plugin:

| Source migration | Hosted version |
| --- | --- |
| `202609050001_gymaf_schema.sql` | `20260905212006` |
| `202609050002_gymaf_integrity.sql` | `20260905212023` |
| `202609050003_gymaf_commands.sql` | `20260905212048` |
| `202609050004_gymaf_queries.sql` | `20260905212104` |

The plugin generated hosted timestamp versions. Reconcile these with source versions before adopting a CLI push/pull workflow; do not blindly replay table-creation migrations. A same-second plugin timestamp collision initially left the command function installed without a history entry because the source had an explicit COMMIT. After inspecting the function and migration history, the identical command definition was reapplied using CREATE OR REPLACE and an outer tool-managed transaction. The final history contains all four migrations exactly once. The query migration also used the tool-managed transaction.

All 16 public application tables have RLS enabled. `gymaf_private.runtime.synthetic_local` remains false. `supabase/seed.sql` and `gymaf_seed_synthetic` were not installed. Do not run `astra:seed`, the local reset instructions or the local integration harness against this hosted project; they are intentionally loopback-only and include a local MFA bypass.

## Email sign-in and first-account setup

Hosted Astra now uses email links with `GYMAF_EMAIL_AUTH_MODE=link`; disposable local Supabase retains code mode and its supplied OTP templates. The earlier account is email-confirmed, but clicking its old default link did not create an Astra application session.

The correct dashboard account was reached through **Continue with ChatGPT**. The prior password-login attempts used the wrong access path. The project's Free dashboard disables email template editing without custom SMTP or Pro and currently sends default link emails. No paid plan or SMTP service was provisioned.

Saved and reread the project's Auth URL configuration:

- Site URL: `http://127.0.0.1:3211` (previously `http://localhost:3000`).
- Exact allowed redirect: `http://127.0.0.1:3211/auth/callback`.

The app sends an S256 PKCE challenge, keeps its verifier in an HttpOnly cookie, exchanges the callback code server-side and verifies/registers the session before installing access/refresh cookies. Open the newest email link in the same browser on this computer where it was requested. Links issued before this fix cannot complete the new flow. For hosted invitations, keep the invitation tab open, sign in in its new tab, then return and click “I have signed in.”

A fresh browser request after the fix was rejected with HTTP 429 / RATE_LIMITED. The live dashboard confirms a locked limit of **2 auth emails/hour**. No new email was sent by that request. Prior successful sends were at 00:22:59 and 00:47:16 Europe/Sofia on 6 September; the provider does not expose an exact reset time here. Retry later from the login page in the browser you will use to open the email. Do not repeatedly resend. No automatic confirmation, operator grant or MFA bypass was performed.

Actual hosted callback completion and coach/operator onboarding remain unverified. The empty account is not a seeded coaching workspace.

## Verified scope

- Supabase Auth settings read: HTTP 200, email enabled.
- Public coach RPC and Astra public-coach API: HTTP 200 with null for an unpublished test slug.
- Direct anonymous app_users read and private query RPC: HTTP 401 / permission denied.
- Astra `/api/v1/me` without a session: HTTP 401 SIGN_IN_REQUIRED.
- Auth request sent with main's origin: HTTP 403 ORIGIN_REJECTED before provider dispatch.
- Browser: Astra now renders “Send sign-in link” with no code field. The fresh request displays the provider rate-limit error honestly. Main remains available on 3210; a hosted application session has not been verified.
- Security advisor: five warnings for intentionally callable SECURITY DEFINER functions from ADR-007. These remain review items, not a zero-warning security acceptance. See [anonymous function guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [authenticated function guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

After the email-link fix: unit 15/15, lint (0 errors, 3 existing navigation warnings), typecheck and build passed. `npm run test:auth` passed a real HTTP round trip through the built app against an isolated synthetic provider fixture: S256 request/verifier binding, exact callback URL, exchange/user verification/session registration order, HttpOnly cookies, fixed redirect, verifier clearing, and no session on failed registration. This fixture sends no email and is not hosted provider acceptance. Live negative HTTP checks passed for missing/malformed codes, missing/invalid verifiers, a rejected provider code, caller-supplied redirect ignored, cross-origin request rejection and anonymous session denial. Callback query logging is suppressed in Next development logs. Full coach/client authorization, MFA, publication, workouts, messages, lifecycle and mobile acceptance are not established by these connectivity checks. The existing landing-card clipping defect remains open. No public web deployment, merge, billing activation or real client records were introduced.
