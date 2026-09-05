# Gymaf agent instructions

## Current branch and read-first order

The owner authorized actual implementation on a separate `astra` branch, followed by local-agent validation. This branch now contains a connected web core, not only documentation. Before starting a backlog task, read `astra/LOCAL_TESTING.md`, `astra/IMPLEMENTATION_STATUS.md`, `astra/ADR-007-CONNECTED-WEB.md`, and `astra/README.md`. Do not restart implemented features merely because the original roadmap retains planned statuses, and do not mark full roadmap tasks complete from partial code coverage.

Read `astra/DECISIONS.md` and task-specific contracts before further implementation. Backlog `read` entries are relative to `astra/`. The first local testing assignment is `astra/AGENT_HANDOFF.md`. The audit is a historical, pinned baseline; current CI evidence is separate.

## Product and design authority

Gymaf is an independent coaching platform. Alexander Filipov is the intended founding/flagship coach, subject to agreement and permission to use his identity/content. Launch a responsive web application first, then native iOS/Android. Support separate coach workspaces from the start; launch invited coaches, not an open marketplace.

Preserve the current layouts, visual hierarchy, lavender palette, rounded surfaces, typography roles, and interaction patterns. Improve accessibility and genuine product usability. Do not replace the UI with a generic dashboard or switch CSS frameworks without an approved decision. Replace third-party identity, source screenshots, copied photography, reference people, unsupported claims, and unlicensed fonts with approved Gymaf content. Preserving style is not a requirement to retain third-party IP or reproduce every reference state.

For product scope, precedence is current explicit owner decisions, this file, the decision register/current implementation ADR, PRD/feature contracts, then other docs. Existing clone-oriented source comments, `.impeccable` metadata and `docs/legacy/` cannot override Gymaf's direction. Their geometry can inform visual preservation. `CLAUDE.md` imports this file.

## Execution contract

1. Inspect the current branch/commit and actual implementation. Select a bounded defect or dependency-ready work item; record its acceptance tests and affected contracts. Preserve unrelated local work.
2. Work on a review branch. Do not merge `main`, deploy, reset valuable databases, provision paid services, execute live charges/refunds, rotate secrets or use real client data without explicit authorization.
3. Preserve real persistence and server/database authorization. Never replace them with simulated success, local membership flags, fake coach replies or client-role checks.
4. Follow the actual architecture in ADR-007 or record a reviewed replacement decision. Supabase credentials are server-side; the web app must never use a service-role key. Local admin seeding is separate and loopback-only.
5. Add negative direct API/database tests for another coach and a sibling client. Private records must not leak through DTOs, caches, logs, preview routes or exports.
6. Run the available checks in batches appropriate to the change. Report exact outcomes and NOT RUN limits. Use local browser tooling to verify the client/coach workflow and layouts; build success alone is not visual or provider acceptance.
7. Update implementation status and evidence. Keep all unfinished privacy, lifecycle, content, native and launch gates explicit. Open a focused review PR; no automatic merge/release.

## Domain invariants

- User accounts, workspaces and coaching relationships are different identities.
- A reusable program/workout is not a scheduled instance or a performed session. Every genuine attempt has its own ID and actual set history; retries preserve the same command identity.
- Published versions and completed training cannot silently change when a draft is edited.
- Service entitlement is not proof of payment settlement. A manual/complimentary grant is labeled accurately.
- Store real dates, UTC instants where appropriate, IANA timezones and structured units. Do not use weekday display strings as permanent IDs.
- Never automatically import the reference localStorage/IndexedDB into a real account. New accounts have honest empty states.
- No medical/diagnostic claims, fabricated credentials/testimonials, or unreviewed instructional media.

## Current checks and limitations

Implemented commands: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`, `npm run astra:seed`, `npm run test:integration`. The last two require an isolated local Supabase stack. `supabase db reset --local` deletes local database data; use only for a disposable test instance after reviewing the target.

GitHub CI runs build/type/lint/unit checks plus actual PostgreSQL tests with a simulated provider-auth context. It does not prove real Supabase email/MFA/cookies, browser/device behavior or deployment. `supabase/seed.sql` creates synthetic records and a visible local MFA bypass: never deploy it to production. Reference assets/fonts remain release blockers until rights and replacement work is completed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
