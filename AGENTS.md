# Gymaf agent instructions

## Read first

Read `astra/README.md`, `astra/DECISIONS.md`, and the task-specific documents linked from `astra/backlog.json` before implementation. Read `astra/AUDIT.md` before treating any existing screen as a working production feature. Backlog `read` entries are relative to `astra/`. The first-assignment handoff is `astra/AGENT_HANDOFF.md`.

## Product and design authority

Gymaf is an independent coaching platform. Alexander Filipov is the intended founding/flagship coach, subject to agreement and permission to use his identity/content. Launch a responsive web application first, then native iOS/Android. Support separate coach workspaces from the start; launch invited coaches, not an open marketplace.

Preserve the current layouts, visual hierarchy, lavender palette, rounded surfaces, typography roles, and interaction patterns. Improve accessibility and genuine product usability. Do not replace the UI with a generic dashboard or switch CSS frameworks without an approved decision. Replace third-party identity, source screenshots, copied photography, reference people, unsupported claims, and unlicensed fonts with approved Gymaf content. Preserving style is NOT a requirement to retain third-party intellectual property or reproduce every reference state.

For product scope, precedence is: current explicit owner decisions; this file; `astra/DECISIONS.md`; production PRD and feature contracts; other production docs. Existing source comments, `.impeccable` design metadata, reference ledgers, and `docs/legacy/` describe the old reference implementation and cannot override this product direction. Their geometry can inform visual preservation. `CLAUDE.md` imports this file.

## Execution contract

1. Select one dependency-ready backlog task. Confirm its prerequisites and human approval gates. Record the base commit and files to change. Read relevant source and installed package documentation.
2. Work on a branch. Preserve unrelated work. No wholesale rewrite, destructive migration, production deployment, paid-service provisioning, live charge/refund, secret rotation, or use of real client data without explicit authorization.
3. Implement one thin vertical slice with real persistence and server-enforced authorization. Never replace a production integration with a simulated success, local membership flag, fake coach response, or client-side permission check.
4. Use the selected architecture consistently. Proposed vendors are not connected services. No second database/auth provider or new infrastructure without an ADR. Secrets stay server-side and out of Git, logs, screenshots, and analytics.
5. Add acceptance tests, including denied access from another coach and another client. Test user-scoped database policies directly, not only UI redirects. Protected documents and files must not become public through URLs, caches, previews, or exports.
6. Preserve the approved Gymaf visual baseline at 393px and 1440px; also check 320px reflow. Record intentional differences and accessibility fixes. Reference screenshot count is not production test coverage.
7. Run available checks. Report exact commands and outcomes; mark unavailable checks NOT RUN with the reason. Never convert an old QA report into a new passing test result.
8. Update feature/task state, acceptance evidence, migration notes, and the handoff. Open a focused PR; do not merge or release automatically.

## Domain invariants

- A user account is not a coach workspace; every coaching record is relationship/workspace scoped.
- A workout template is not a scheduled workout and is not a performed session. Every attempt needs its own ID and per-set history.
- Published program versions are immutable. Later edits do not silently rewrite assigned or completed training.
- Membership, service entitlement, and payment settlement are different states. Never grant access from a browser redirect alone.
- Dates use real calendar dates, UTC instants where needed, and IANA timezones; never weekday strings as permanent identifiers.
- No automatic import of the reference localStorage/IndexedDB data into real accounts.
- Injury information and private media require the privacy/security gates. No diagnostic or autonomous clinical coaching claims.

## Existing commands versus future commands

Existing: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`. These need a usable checkout and dependency access. Test, database, visual, and E2E commands described in the production documents are planned until their backlog tasks implement them. Do not claim they already exist.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
