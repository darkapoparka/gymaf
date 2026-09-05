# Target architecture and migration plan

Status: proposed technical default; owner approval required before provider setup/spend. Existing implementation facts are in [AUDIT](AUDIT.md). No listed provider is assumed connected to this repository.

## Recommended stack

Retain Next.js App Router, React, TypeScript, custom CSS and locally owned UI components. Use one Supabase project per isolated environment for managed PostgreSQL, Auth and private Storage. Use versioned SQL migrations and generated database types; do not add a second ORM or database by default. Add a runtime schema library such as Zod, and Vitest/Playwright for testing, only through dependency-reviewed implementation tasks.

Vercel is the proposed managed web deployment target, with a Node runtime and explicit regional placement near the selected EU database region. This is not a guarantee of exclusive EU processing; vendor contracts, logs, subprocessors and transfer controls need review. Supabase is suggested to reduce the number of identity/database/storage integrations, not because it makes authorization automatic. The existing Neon connection in a chat, if available, is not evidence that Gymaf already uses Neon. An owner preference for Neon requires one replacement ADR covering auth/storage/policies; never operate both stacks accidentally.

Native later: Expo/React Native client using the same application API and domain contracts. Keep the coach workspace web-first. Do not attempt to reuse DOM components or CSS directly in native screens, and do not force the web app to be rebuilt in React Native Web.

Primary platform references and dated caveats: [RESEARCH](RESEARCH.md), R1–R6, R9.

## Shape of the system

```text
Public browser -> Next public server-rendered pages -> approved public coach DTOs
Client/coach browser -> Next protected UI + /api/v1 -> application services
Future native app ---------------------> /api/v1 -> same application services
                                                    | verified actor + scoped DTOs
                                                    v
                                    Supabase Auth / Postgres RLS + transactional RPC
                                                    |
                                    private Storage + signed access + durable outbox
                                                    |
                                     bounded job runner / optional email provider
```

Choose a modular monolith: one codebase/deployment boundary with feature modules, not microservices, Kubernetes or a custom WebSocket cluster. Database transactions own multi-record invariants. External delivery occurs after commit via an outbox. Start with authorized polling for messages; add realtime only when its authorization and operational value are proven.

## Proposed source structure

```text
src/app/(public)/                 marketing and /coaches/[slug]
src/app/(auth)/                   login, verification, recovery
src/app/(client)/app/             client home, workouts, progress, messages
src/app/(coach)/coach/            roster, programs, calendar, review inbox
src/app/(operator)/operator/      minimal audited operator controls
src/app/api/v1/                   stable application resource endpoints
src/features/<domain>/           components, view models, feature schemas
src/server/auth/                 per-request identity and session checks
src/server/policies/             actor/resource authorization helpers
src/server/services/             application commands and queries
src/server/repositories/         user-token database calls and RPC adapters
src/server/jobs/                 outbox, export, deletion and cleanup handlers
src/shared/contracts/            platform-neutral request/response schemas
src/shared/domain/               pure calculations and domain types
src/shared/tokens/               serializable approved design tokens
supabase/migrations/             reviewed SQL, grants, policies, functions
supabase/tests/                  policy and invariant tests
```

This is a target map, not a demand to move all files at once. Reuse components from `src/components` and their CSS progressively. Create a monorepo `apps/web`, `apps/mobile`, `packages/*` only when the native app is actually started or a measured need warrants it. Do not create empty packages/microservices as launch work.

## Authentication and sessions

Use Supabase Auth rather than hand-built credentials. Proposed web default is the supported SSR/PKCE flow with request-scoped clients and correctly refreshed secure cookies. Follow the installed SDK's current integration guide. Supabase's ordinary browser/SSR pattern needs browser access to tokens; do not claim these cookies are universally HttpOnly or hide that tradeoff. A strict server-only/BFF HttpOnly design is an alternative requiring a separate implementation/refresh/CSRF proof, not a flag to add to a browser-SDK setup.

For protected operations verify identity using the provider's supported server verification method and check current application user/session/membership state. A JWT signature/expiry check alone does not prove immediate revocation. Require an application session record keyed to the validated provider session identity, with a non-revivable revoked state; enforce active application sessions/users in data-access policy helpers for protected data. Establish/register sessions through a trusted server path after provider validation, not an arbitrary client-supplied ID. Validate this design against the selected SDK in GY-005 before wider feature work.

Native uses PKCE through an appropriate external auth session and stores long-lived credentials with OS-backed secure storage. App API requests carry a verified bearer token. Browser writes use the SSR cookie session and explicit same-origin/CSRF controls. Reject conflicting credentials; do not silently choose between two identities. No user-specific Supabase client or token may live in a process-global singleton. Sign-out/account suspension must invalidate application access and clear local state; provider revocation/expiry is an additional layer.

## Authorization and persistence

An authenticated user is not automatically entitled to any workspace. Resolve the resource to its workspace and relationship, verify actor membership/assignment/ownership, then run the query with the user's JWT so RLS remains effective. Public DTOs are separately allowlisted. A platform operator has no implicit right to browse health notes.

Enable RLS and least-privilege grants on every exposed table; keep privileged tables in a non-exposed schema. Use composite foreign keys and database checks for workspace/relationship consistency. Direct browser access to Supabase REST/RPC remains a possible path even if Gymaf UI only calls Next, so authorization/invariants cannot live solely in Next.

Multi-row commands use narrow transactional SQL functions. Revoke default PUBLIC execution. Prefer invoker security where permissions allow. Where a narrowly scoped definer function is necessary, use a least-privileged owner, fixed search path/qualified names, explicit identity/resource checks and tests against direct invocation; never accept an actor ID as authority. Do not use a service-role key for ordinary client/coach requests. Privileged jobs have isolated credentials and audited scope.

RLS is not a field validator or a replacement for business invariants. Prevent workspace/user reassignment, published-version edits, client-written billing states and forged reviews through database permissions, constraints/triggers and controlled commands, not just TypeScript.

## API and rendering

Server Components call application services directly; do not make loopback HTTP calls to their own API. Browser/native mutations use typed `/api/v1` endpoints. A Server Action, if used, calls the same service and performs equivalent authorization. Keep shared contracts independent of Next/Supabase libraries so native adoption does not duplicate business logic.

Private responses use `Cache-Control: private, no-store`; do not enable shared ISR/CDN caching for session-setting or personalized responses. Never share cached query results across users/workspaces. Cache public coach pages only from explicitly approved public data. Test actual deployment cache headers rather than relying on component defaults.

## Media and background work

Public branded assets and private client media have different buckets/policies. Private objects use opaque identifiers, quarantined upload state, bounded short-lived access and explicit deletion. The database stores metadata/object IDs, not base64 media. Direct-to-storage upload tickets are scoped to one authorized object and expire; completing an upload requires server-side validation before visibility.

Start with a Postgres-backed durable outbox and an authenticated scheduled drain endpoint/worker with bounded batches, leases, retry backoff and dead-letter reporting. Do not depend on a request's unawaited promise for delivery. Provider scheduling/spend is an approval item. Video transcoding, if enabled, is a separate bounded service/job decision; do not run long transcodes inside a web request.

## Migration without redesign

1. Reproduce the audited baseline, version/runtime availability and regression tests. Preserve approved geometry at mobile/desktop widths.
2. Separate reference preview data/tools from production entry points. Replace root product instructions (this documentation PR), then source/metadata/assets in a dedicated implementation PR. Keep historical material only where permitted and exclude it from public artifacts.
3. Introduce real accounts/workspaces in explicit routes. Maintain current UI primitives and build empty/loading states with real DTOs. Do not wrap `useLocalData` with a fake backend that still authorizes locally.
4. Replace fixture programs/schedules with real versioned plans and dated instances; replace session storage with per-attempt/per-set records. Keep each change a testable vertical slice.
5. Add coach authoring/review and real text communications. Remove production imports of capture fixtures and `?capture` behavior.
6. Finish lifecycle, optional media, entitlements and operations. Redirect legacy routes only when their meaning maps unambiguously; a fixture workout slug cannot be assumed to identify a real assignment.

The old localStorage key and IndexedDB contain reference/test data. Never import them automatically into a signed-in account. Provide an explicit demo reset/export path if useful, then separate production keys and clear sensitive state on logout. New accounts start empty.

## Architecture acceptance

A synthetic Coach A can assign a program to Client A, who completes it in a separate browser; Coach A sees the results and responds; Coach B and Client B cannot retrieve any of that data via Next, database REST/RPC, storage or caches. A duplicate command is safe. A repeated real session has distinct history. Restore and session revocation are exercised. Only then is the core architecture demonstrated rather than merely drawn.
