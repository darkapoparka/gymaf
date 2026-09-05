# ADR-007 — implementation choices on the astra branch

Date: 5 September 2026. Status: implemented for local review; production/security approval pending. This records differences from the proposed architecture rather than silently treating an earlier recommendation as installed software.

## Scope and authority

The owner authorized a separate `astra` implementation branch and a local-agent validation workflow. `main` remains unchanged. This branch adds the connected web core but does not complete every roadmap item or approve real client data, infrastructure spend, payments or publication.

## Server-only browser authentication boundary

The implemented web adapter calls the published Supabase Auth REST API using native server fetch. Email OTP is verified by the provider; access/refresh tokens are stored in HttpOnly SameSite=Lax cookies, Secure with `__Host-` names on HTTPS. Browser JavaScript does not receive refresh/access tokens. Refresh is explicit and single-flight within a tab, with Web Locks where supported across tabs. Verified provider identity and an active application session precede database operations. Supabase service-role credentials are not part of the web application configuration.

This is the strict server-only alternative contemplated in the earlier architecture, not the Supabase browser/SSR SDK pattern. It avoids adding an unverified SDK dependency/lockfile change but adds responsibility for provider-contract compatibility, refresh failure behavior, cookie/CSRF tests, MFA lifecycle and account recovery. Native bearer clients have an API boundary, but no native application has been implemented. OAuth/PKCE and social login are not claimed implemented by this email-code flow.

## Resource queries and a command endpoint

Read endpoints under `/api/v1` map to an invoker-security query RPC, with RLS-enforced SELECT access. Mutations use `POST /api/v1/commands` and the runtime-validated `{action, commandId, payload}` envelope. The command RPC has an explicit operation switch, fixed search path, operation-specific resource authorization and no dynamic SQL. Ordinary roles have no table mutation grants. Target authorization occurs before replaying a minimal stored result; actor/command uniqueness, request hashes, row locks and optimistic revisions protect supported retry/conflict cases.

This differs from implementing every individual REST mutation in `API_CONTRACTS.md`. The implemented commands are listed in `src/shared/gymaf/validation.ts` and SQL migration 003. A generated OpenAPI contract, exhaustive DTO-field review and broader concurrency/abuse tests remain future acceptance work. A security-definer command dispatcher is not a security guarantee merely because it is explicit; keep direct-call negative tests and review every new case.

## Versioned JSON prescriptions, relational actuals

Programs and immutable published versions currently store bounded runtime/database-validated JSON prescriptions. Assignment copies one published workout prescription into a dated scheduled instance; sessions snapshot it again. Actual sets are relational and scoped to distinct session attempts. Published-version and completed-session mutation triggers preserve history.

This is simpler than the fully normalized exercise/prescription catalog proposed in `DATA_MODEL.md`. It supports testing a coach-authored program now without pretending a reviewed exercise/media catalog exists. A later catalog can reference immutable exercise versions; do not silently alter assigned JSON snapshots. Program names/instructions are coach-entered, not generated advice.

## UI and reference separation

The existing Next/React/TypeScript/custom-CSS stack, core tokens, shell, cards, sheets and responsive grid vocabulary are retained. New operational screens live under `src/features/gymaf`; old reference components are not rewritten. Connected pages use real records and honest empty states, not reference people/messages/results. Decorative slots currently use restrained CSS/icon placeholders. No photos, exercise videos or font rights have been created by this code task.

The historical catch-all interface and review routes require the development preview flag; a production build disables them. The retained assets still exist under public paths and in Git history, so this is not full distribution/IP cleanup. Existing font files remain solely to preserve the local comparison baseline; they are a public-release blocker until reviewed/replaced/licensed.

## Deliberately bounded operations

Complimentary/manual entitlements are distinct from provider payment settlement. A cancellation records non-renewal through the stored end date, not a provider refund. Text messages persist and poll; notifications are stored, but an external outbox/delivery service is not implemented. Support/data requests are real records in an operator inbox. A deletion request is not erased data and cannot be falsely closed as fulfilled in the current operator UI. A bounded synchronous export is an interim implementation requiring recent-auth/privacy/retention review before real customers.

Local seed data bypasses MFA only in the disposable test runtime. The migration defaults do not bypass MFA. Do not apply the local-only seed helper to a hosted real-data project. Full Supabase Auth/PostgREST integration, browser/device behavior, sustained concurrency, privileged recovery and release operations remain validation gates beyond the passing simulated-provider PostgreSQL tests.

## Primary implementation references

- Supabase Auth OpenAPI: https://raw.githubusercontent.com/supabase/auth/master/openapi.yaml
- Email OTP: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Auth email templates: https://supabase.com/docs/guides/auth/auth-email-templates
- CLI configuration: https://supabase.com/docs/guides/local-development/cli/config
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Next route handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Node TypeScript execution: https://nodejs.org/api/typescript.html

Consulted during implementation on 5 September 2026. These sources describe provider interfaces; the branch's exact behavior still requires its own tests. Do not treat a reference link as successful integration evidence.
