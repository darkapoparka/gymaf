# Gymaf — Astra implementation branch

A connected, pre-release web coaching application built on the existing Next.js, React, TypeScript and custom-CSS interface. This `astra` branch adds real account/backend code and coach/client operations; `main` remains separate.

## Run and review

Start with [astra/LOCAL_TESTING.md](astra/LOCAL_TESTING.md). It contains safe checkout instructions, the isolated local Supabase setup, six synthetic accounts, dev commands and a coach-to-client test journey.

```sh
npm ci
npx supabase start
npm run astra:seed
npm run dev
```

For a fresh/disposable local database, the guide includes `npx supabase db reset --local` before seeding. That command deletes local test data; read the warning first. Use the app at `http://127.0.0.1:3210` and request test email codes from the local inbox at `http://127.0.0.1:54324`.

No cloud backend, live payment, deployment or production data is required. Never run the synthetic seed against a real environment. Existing `.env.local` is not overwritten.

## What exists on this branch

Email-code account/session handling, coach/client workspaces and invitations, program drafts and immutable versions, dated assignments, per-attempt/per-set workout logging, check-ins and coach feedback, durable text messages, manual/complimentary service access, operator/support request controls and a bounded personal export. See [implementation status](astra/IMPLEMENTATION_STATUS.md) for precise coverage and unfinished work.

The existing CSS system is retained. The new connected screens use its layout vocabulary and honest placeholders. Original reference screens remain available only in explicit development preview mode. The old fonts/assets are NOT declared cleared for public distribution.

## Verification

GitHub CI passed at source commit `5ef5cfd3a68f8f995d3ac44d3d9addb0e31ab405`: clean install, unit tests, lint, TypeScript, production build and PostgreSQL migration/policy/history checks. The PostgreSQL tests simulate provider authentication; full local Supabase, browser, MFA, device and visual acceptance remain pending. See [evidence](astra/evidence/astra-ci-2026-09-05.json).

```sh
npm run test:unit
npm run lint
npm run typecheck
npm run build
npm run test:integration
```

The last command needs the isolated local Supabase stack. It creates synthetic data and must not run against real customers. Test scripts do not deploy anything.

## Specifications and agent instructions

Read [AGENTS.md](AGENTS.md), [implementation choices](astra/ADR-007-CONNECTED-WEB.md), [documentation index](astra/README.md), [PRD](astra/PRD.md), [feature contracts](astra/FEATURES.md) and [roadmap backlog](astra/backlog.json). The original roadmap is not all complete. Native apps, live billing, private uploads, full deletion/retention, licensed content and launch operations remain separate work.

The original reference documents are preserved under `docs/legacy/`; the static audit in `astra/AUDIT.md` is pinned to the original application baseline. It does not describe every later implementation change.
