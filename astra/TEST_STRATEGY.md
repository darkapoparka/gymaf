# Test strategy and release evidence

Target quality plan • 5 September 2026. Most commands/tests below do not yet exist. The source audit did NOT rerun the application build or browser checks; see [AUDIT](AUDIT.md) and its narrow reproduction evidence.

## Establish a reproducible baseline first

On an authorized usable checkout, record `git rev-parse HEAD`, Node/npm versions, lockfile hash and install output. Run existing commands `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`. Inspect installed Next documentation as required by root `AGENTS.md`. Do not substitute dependency versions silently when installation fails. Investigate registry/lockfile/platform/advisory issues, propose a minimal compatible update and review it separately from design changes.

Add a test runner and CI in GY-001/GY-002. Proposed scripts `test:unit`, `test:db`, `test:contract`, `test:e2e`, `test:visual` and `test:a11y` are desired interfaces, NOT runnable claims about the baseline repository. Document real commands and required local services when implemented. Keep clean synthetic seeds and a disposable database reset path that cannot target production.

## Test layers

| Layer | Must prove | Proposed tooling |
|---|---|---|
| Pure/unit | domain calculations, validation, state machines, retry identity, unit/date formatting | Vitest or approved equivalent |
| Database/policy | tenant/relationship authorization, grants/RLS/RPC, immutable published data, FK/uniqueness, revoked sessions | Supabase local PostgreSQL plus SQL policy tests/pgTAP or equivalent |
| Service/API integration | auth/session verification, CSRF, DTO filtering, transaction/outbox, error semantics | HTTP/service tests with real disposable DB and controlled provider doubles |
| Contract | generated API schemas and web/native-safe types agree with runtime behavior | OpenAPI/schema validation and example fixtures |
| Browser E2E | real actor-to-actor coaching loop and lifecycle | Playwright with separate browser contexts |
| Visual/accessibility | preserved approved layout, semantics, keyboard/reflow/focus | Playwright screenshots, automated accessibility checks, manual keyboard/screen-reader review |
| Operational/device | restore, delete/revoke, jobs, phone background/permissions and network behavior | documented staging drills and real devices |

Provider mocks prove application behavior under a simulated response, not a real provider integration. Add sandbox end-to-end evidence for enabled external services. Do not depend on one successful UI flow to establish RLS correctness.

## Required synthetic actors

Use Coach A and Coach B in different workspaces; Client A1 and Client A2 with Coach A; Client B1 with Coach B; a suspended user; an invited-but-not-accepted user; and a nonassigned workspace staff member. Use distinct browser contexts and actual test tokens. An operator is separate from ordinary staff.

Attempt reads/writes/links/exports/media access by swapping IDs across both workspace and sibling-client boundaries. Test unauthenticated, expired, revoked and conflicting identities. Directly invoke database REST/RPC and Storage access using ordinary user tokens; bypassing the Next UI must not bypass business invariants. Test reassignment of `workspace_id`, `client_user_id`, sender/reviewer fields and published-version content.

## Critical regression scenarios

**Source findings:** reproduce AUD-003 (two genuine attempts of one workout survive) and AUD-004 (malformed local nested state produces a controlled recovery instead of a crash). Keep the old-expression reproductions as historical evidence; write tests against the production implementation after replacement. Test invalid active-session JSON too.

**Training:** create draft → publish → assign → start → log multiple sets with different reps/loads → pause/resume → complete → repeat on another date → coach review. A retry of the same command gives the same result; a new attempt gives a new session. Template edits cannot alter prior prescriptions/history. Zero/null/skipped semantics are preserved. No reference workout becomes a real client assignment accidentally.

**Schedule:** two calendar weeks, multiple workouts per day, locale conversion, timezone changes, daylight-saving boundaries, reschedule conflict and completed-history immutability. Use deterministic clocks and real date utilities rather than string comparisons of weekday labels.

**Network/concurrency:** double click, reordered response, request timeout after a committed write, two tabs editing the same draft, authentication expiry mid-save, offline memory draft and reconnect. Unsynced work is never presented as durably saved. The pilot does not promise offline refresh persistence.

**Coach workflow:** roster visibility, publish validation, unresolved review inbox, text message observed by another authenticated browser, failed-send/retry and correct read acknowledgement. Disabling or ending a relationship must remove future unauthorized access without corrupting the client's own permitted export/history.

**Lifecycle:** invitation expiry/replay/wrong email, MFA and recovery, logout and account switch, revoked JWT/application session, cancellation versus deletion, export scope, private object deletion, restored backup reapplying tombstones, and operator support-access audit.

**Payments when enabled:** tests in [BILLING](BILLING.md), including malicious price/seller substitution and valid signature with an irrelevant/old event. No production transactions in automated tests.

## Visual preservation

Capture deterministic baseline screens at 393×852 and 1440×1000; check 320px reflow and a tablet layout. Prioritize home, program/workout detail, active session, summary/history, coach profile/onboarding, messages, settings and the new coach roster/program/review screens. Use approved synthetic content, fixed dates, loaded fonts/images and controlled animations. The original reference screenshots are historical; production baselines must use cleared Gymaf assets.

Screenshot comparisons vary by execution environment; keep browser/OS/fonts consistent and review intentional diffs rather than auto-updating all snapshots (R16). Add DOM assertions for headings, disabled controls, errors and semantics: a screenshot cannot prove an action worked. No claim of 270-state pixel parity is needed for the Gymaf release.

Use WCAG 2.2 AA as the proposed accessibility target (R15). Test contrast, accessible names, logical reading/tab order, sheets/dialog focus trap and return, Escape where appropriate, reduced motion, touch targets, zoom and text reflow. Automated scans are not a complete accessibility audit. Bulgarian copy and Cyrillic glyphs must appear in visual tests; do not test only shorter English labels.

## Performance and resilience

Measure production builds, not dev mode. Record route JS/CSS transfer, key render/interaction timings, slow-network behavior, API latency and database query plans at a documented synthetic workload. Proposed initial API budget: p95 under 750 ms for ordinary non-upload authenticated requests at 20 concurrent synthetic users in the selected region; this is a target to calibrate, not a measured promise or capacity estimate. Keep expensive exports/media work asynchronous and bounded.

Test throttling/backoff, provider outage, database failure, job lease expiry/dead letters and unavailable optional media. Failure should be clear and recoverable, not a fake success. Budget error reporting and egress before enabling uploads. Observe real pilot performance before increasing cohort size.

## Definition of done and evidence record

A task is done when its acceptance criteria pass at a named commit, required denied-access paths pass, the intended UI diff is approved, migrations and rollback/forward-recovery notes are documented, and no unresolved high-risk defect is hidden behind a passing lint result. Required fields: task/feature IDs, commit, environment, date, test command, result, artifact path, reviewer and known limits.

A launch evidence bundle includes the real core-loop E2E result, policy matrix tests, enabled provider sandbox results, visual/a11y report, asset approvals, restore/deletion drill, monitoring/support readiness and human gates. All required gates must be satisfied even for an invited real-data pilot. Hardware/OS integrations remain disabled until actual device evidence exists.
