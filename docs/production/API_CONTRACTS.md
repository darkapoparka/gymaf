# Application API contracts

Proposed `/api/v1` resource API; no endpoints below are implemented by this documentation. Create a generated OpenAPI/schema artifact and contract tests in GY-007 after validating these contracts against migrations. SQL table shapes are not public DTOs.

## Request boundary

Web: verified SSR cookie session plus same-origin/CSRF checks for mutations. Native later: verified bearer access token with controlled issuer/audience/expiry and application-session checks. Reject conflicting identities. A workspace path/header is only a requested scope, never authority. Resolve every object server-side. Return `404` for inaccessible private object IDs where existence itself is sensitive; `401` for missing/expired identity; `403` for a known action the actor cannot perform.

JSON only for normal commands; reject unsupported content types and excessive bodies. Proposed bounds: 64 KiB standard command body, 4,000-character plain-text message, page size 20 default/100 maximum. Upload bytes use a separate scoped Storage flow. These are engineering defaults to load-test, not established service limits.

Success returns `{ "data": ..., "meta": { "requestId": "..." } }`. Collections add `nextCursor` and `hasMore`. Errors return `{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields.", "fields": { "actualReps": "Must be a nonnegative integer." }, "requestId": "..." } }`. Do not return stack traces, SQL, provider secrets, or existence-sensitive details. Use stable machine codes and localize user text at the presentation boundary.

## Resource map

| Method and path | Actor | Required behavior |
|---|---|---|
| GET /me | signed-in user | minimal profile, active relationship and permitted roles; no token in response |
| PATCH /me | account owner | allowed profile/locale/timezone fields; version/conflict check |
| GET /public/coaches/:slug | anyone | approved public DTO only |
| POST /workspaces/:id/invitations | authorized owner/coach | recipient-bound expiring invitation; rate limit; command idempotency |
| POST /invitations/accept | intended verified recipient | token in body, atomic one-time accept and relationship creation |
| GET /workspaces/:id/clients | authorized staff | permitted roster fields and assignment scope; cursor pagination |
| POST /workspaces/:id/programs | authorized staff | create draft; reject unknown/privileged fields |
| PATCH /programs/:id/draft | authorized staff | revision precondition; editable draft only |
| POST /programs/:id/publish | authorized staff | atomic validation/version creation; immutable result |
| POST /relationships/:id/program-assignments | assigned coach | pin published version; create explicit scheduled instances atomically |
| GET /relationships/:id/schedule | client or assigned staff | bounded date range; real dates/timezone |
| PATCH /scheduled-workouts/:id | authorized actor | revision and policy; no completed-history rewrite |
| POST /workout-sessions | client | authorized assignment/prescription; unique attempt command |
| PUT /workout-sessions/:id/sets/:setLogId | owning client | idempotent set update; session revision/preconditions |
| POST /workout-sessions/:id/events | owning client | deduplicated pause/resume event; valid state |
| POST /workout-sessions/:id/complete | owning client | atomic finalization, adherence event and outbox; same retry returns same result |
| GET /workout-sessions/:id | client or assigned coach | planned-versus-actual DTO, not raw sensitive joins |
| POST /relationships/:id/check-ins | client | draft or submission with command key/revision |
| POST /check-ins/:id/reviews | assigned coach | author from session; review recorded once per command |
| GET /conversations/:id/messages | participant | authorized cursor pagination |
| POST /conversations/:id/messages | participant | durable message ID, no simulated reply |
| POST /conversations/:id/read | recipient | valid message cursor; not sender-forged reading |
| POST /media/upload-intents | permitted uploader | feature gate/purpose/relationship/size/type; one opaque object |
| POST /media/:id/complete | original uploader | verify stored bytes and processing state; does not blindly mark ready |
| POST /media/:id/access | authorized viewer | short-lived scoped access; never public bucket fallback |
| DELETE /media/:id | authorized owner/operator | tracked delete job with storage removal and audit |
| GET /me/entitlements | account owner | server-authoritative current/pending/end dates and offer scope |
| POST /me/service-cancellation | account owner | approved fulfillment flow; separate from account deletion |
| POST /me/data-requests | account owner with reauth | export/deletion, verification and job tracking |
| GET /me/data-requests/:id | requester | current status; expiring export access after authorization |
| POST /support/requests | signed-in user | durable monitored ticket, bounded message, no false delivery state |
| POST /operator/entitlements | privileged operator | MFA, actor/reason/source/period, audited approval |
| POST /webhooks/stripe | verified provider signature | raw body, inbox dedupe, queued processing; disabled until billing gate |
| POST /internal/jobs/drain | scoped job credential | bounded leased processing; never public unauthenticated cron |

Authentication callback/verification/MFA endpoints must follow the selected provider flow; these are not an invitation to implement custom cryptography. Operator workspace creation/suspension and staff assignment endpoints require the same policy tests as client data endpoints.

## Session example

Illustrative payloads use placeholder IDs; implementation validates actual UUIDs.

```json
{
  "scheduledWorkoutId": "<uuid>",
  "clientCommandId": "<uuid-for-this-attempt>"
}
```

`POST /workout-sessions` returns a server session ID, revision, status, planned exercise/set DTOs and acknowledged timestamps. Starting again with the same command ID returns the same session. Repeating the workout intentionally uses a new command ID. The client cannot submit another `clientUserId`, workspace owner or entitlement as authority.

```json
{
  "expectedRevision": 3,
  "clientCommandId": "<uuid-for-this-update>",
  "actualReps": 10,
  "loadKg": 20,
  "durationSeconds": null,
  "distanceM": null,
  "status": "performed"
}
```

A bodyweight set may have `loadKg: 0`; an unrecorded load is `null`. Reject non-finite numbers, invalid enum values and impossible schema combinations. Bounds are operational validation, not medical advice. The server must ensure the set belongs to the caller's active session and prescribed/authorized exercise occurrence.

## Idempotency and concurrency

Use an `Idempotency-Key` on creates/finalization/cancellation/payment commands and a unique client command/message ID for durable business deduplication. Scope keys by authenticated actor and operation/resource; store a canonical request hash and committed result pointer. Same key + different payload returns `409 IDEMPOTENCY_CONFLICT`; same key + same payload returns the original result. Simultaneous requests resolve using a database uniqueness constraint/transaction, not a race-prone 'check then insert'. Authorization is rechecked before returning a previous private result.

Keep request idempotency entries for a proposed minimum 24 hours; session/message/business uniqueness must outlive that cache. A deleted or archived private result must not be revived from a stored response body. Requests may report `409 REQUEST_IN_PROGRESS` while another command with that key is being processed.

Mutable resources return `revision`. Require `If-Match` or `expectedRevision` consistently for updates; the implementation must choose one encoding and generate it in OpenAPI. A stale edit returns `409 REVISION_CONFLICT` with an authorized latest revision, not a silent overwrite. Completed records require a separate audited correction command.

## Offline and retry semantics

MVP starts/retrieves sessions online, saves incremental edits, and exposes unsynced in-memory changes during disconnection. It does not promise successful offline refresh or durable browser storage of health data. Warn before leaving unsynced work; do not display it as safely saved. When reconnecting, retry the same command IDs in order, handle conflicts explicitly and require reauthentication after expiry. A 401/403 must not trigger endless retries or local privilege grants.

Future durable offline queues are user-scoped, minimized, time-bounded and cleared on sign-out/account switch; they need a separate privacy/device-storage design. Service workers must not cache protected API responses or private media indiscriminately.

## Media and jobs

An upload intent returns only an opaque asset ID and scoped upload capability. Start with approved limits such as 10 MiB photos; video remains disabled until a separate duration/codec/byte budget is approved. Re-check the actual uploaded object, not just the declared MIME/size. Quarantine and process before attaching it to a message. Signed downloads are bearer capabilities: expiration limits exposure but is not perfect immediate revocation; sensitive use cases may require an authenticated streaming proxy. Never log signed URLs.

For external events, verify first, commit the inbox record, then return 2xx; process through leased jobs. Provider retries and out-of-order events are normal design cases. Outbox events contain opaque references so workers re-fetch current authorized state, including deletion/suspension, before sending. A failed worker must not roll back a successfully logged workout.
