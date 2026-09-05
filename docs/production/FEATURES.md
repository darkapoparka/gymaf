# Feature contracts and acceptance criteria

Target requirements • 5 September 2026. `Prototype` means UI/local behavior, not a connected service. All implementation statuses remain planned. Source findings are in [AUDIT](AUDIT.md); task IDs are in [backlog.json](backlog.json).

## Common acceptance contract

Every protected feature must validate the session, actor, workspace/relationship, input and state transition on the server; apply database policies; expose only necessary fields; and pass direct unauthorized API/database tests. Disabled features reject requests as well as hiding controls. Loading, empty, validation, network failure, permission loss and retry states must use the existing visual language. No success toast before the promised operation is durable. Test at least two coaches and three clients, including two clients of the same coach.

## F-01 — Identity and account session | Pilot | Prototype only

Use verified email authentication; do not implement a new password/credential database. Invite acceptance requires the intended verified recipient or an explicit owner-reviewed reassignment. Rate-limit sign-in and verification; return non-enumerating responses. Recovery and session expiry must be usable on mobile browsers. Coaches/operators require MFA before real client access.

Accept when sign-in survives a reload, expired/replayed credentials fail, sign-out revokes the application session and clears private browser caches, and another person signing in on that device sees none of the previous person's data. Never authorize using `preferences.signedIn`. Return paths must be allowlisted local paths, not arbitrary redirect URLs.

## F-02 — Coach workspaces and invitations | Pilot | Missing backend/workspace UI

Create a workspace, owner membership and coach profile through an operator-approved workflow. A client relationship is separate from staff membership. An invitation has a recipient, expiry, hashed token, creator, workspace and single-use state. A client is not granted coach privileges merely by accepting an invitation.

Accept when duplicate acceptance is safe, expired/revoked/wrong-recipient links fail, workspace A cannot invite/edit on behalf of B, and ending a relationship stops new coach access according to the approved lifecycle policy. The MVP allows one active primary relationship per client; a second invitation must explain the conflict, not silently transfer records.

## F-03 — Coach page and service offer | Pilot | Reference coach screens exist

A public page contains only approved coach identity, credentials, portrait, service description, availability/capacity and CTA. Service type is explicit: asynchronous coaching, live one-to-one session, group service or self-guided program. Do not imply access to personal feedback in a content-only offer.

Accept when an Alexander-sourced visitor retains that selected coach through account onboarding; draft/unapproved profiles are not public; unavailable coaches cannot accept a paid engagement accidentally; other coach pages do not display Alexander as their coach. Prices and claims remain unpublished until approved; use an application/invitation CTA instead of fake checkout.

## F-04 — Client onboarding | Pilot | Local forms exist

Collect preferred name, goals, experience, equipment, training availability and timezone. Injury/limitation information is optional, purpose-limited and enabled only after privacy/content review. Do not collect a full date of birth, biological sex, body photos or weight merely because the reference form did. Adults-only is a proposed launch policy, not an assertion about the law.

Accept when valid drafts resume on the same account, optional sensitive questions can be skipped, a coach can read only assigned-client responses, locale/units are correct, and new profiles contain no reference measurements. Show the scope of coach review and a non-diagnostic safety notice.

## F-05 — Exercise library | Pilot | Small fixture library exists

A reviewed exercise has a stable ID, version, BG/EN name/instructions as available, equipment, category, optional approved demonstration media and reviewer/provenance. Distinguish a coach-specific exercise from a platform-shared entry. Archive entries without breaking older prescriptions.

Accept when search and filters operate on real authorized data, unpublished content cannot enter a published plan, historical sessions retain their original instruction version, and every instructional media item is cleared and reviewed. Generic generated artwork is not a technique demonstration.

## F-06 — Program builder and versioning | Pilot | Coach authoring missing

A coach creates a draft program with weeks/days, ordered exercises, sets/reps or duration/distance targets, rest and notes. MVP editing is form-based using existing cards/sheets; drag-and-drop is optional and never the only editing method. Publish produces an immutable version. Editing creates a new draft/version.

Accept when a coach can publish and assign without developer intervention; required fields/ranges are validated; a failed publish makes no partial version; and changing a template never rewrites an already assigned or completed workout. Coach-only notes and client-visible instructions are separate fields.

## F-07 — Dated training schedule | Pilot | Weekday fixture model exists

Create real scheduled workout instances associated with a relationship and prescription version. Store a calendar date in the client's scheduling timezone; add UTC instants only for actual time-specific events. Allow multiple workouts per date, rest days and explicit rescheduling where the coach permits it. Kickoff calendar booking is later; pilot can use a clearly described manual arrangement.

Accept when two Mondays in different weeks remain different records, moving a session preserves its prescription/duration, date changes do not move completed history, timezone changes require clear future-schedule behavior, and concurrent edits produce a conflict rather than silent loss. Client changes cannot modify another client's schedule.

## F-08 — Workout execution and actual set logs | Pilot | Local session UI, model inadequate

Separate planned targets from actual repetitions, load, duration, distance, skipped sets and notes. Each attempt has its own session ID. Log per exercise/set; zero, null, skipped and unrecorded have different meanings. Permit stopping for discomfort without forcing completion. Proposed substitutions require coach-approved options, not a hard-coded push-up replacement.

Accept when a client performs the same workout twice and retains both attempts; double-tapping/retrying one completion produces one attempt; partial progress survives reload after server acknowledgement; rest/pause timing survives foreground/background transitions; disconnection shows unsynced state; and a coach can read actual results. Completed records are immutable except through an audited correction with an explicit reason.

## F-09 — Weekly check-in and coach review | Pilot | Dedicated review workflow missing

A check-in includes adherence, perceived difficulty, an optional note and optional approved metrics. A submission is versioned and produces a coach review item. The review inbox highlights unreviewed check-ins, training issues and unread messages without claiming clinical triage. Coach feedback records its author and timestamp.

Accept when submitting twice with one command ID does not duplicate the review item; a coach can filter their own outstanding items; reviewing creates a visible feedback record; a revision is distinguishable from the original; and another coach/client cannot read it. The agreed response window is configurable service copy, not a fabricated SLA.

## F-10 — Real coach–client text messaging | Pilot | Local messages exist

One conversation per active coaching relationship initially. Plain text, bounded length, pagination and durable client message IDs. Keep sender IDs and timestamps server-controlled. MVP uses short polling/refresh, not a new standalone chat service. Image/video attachments are F-12, not implied by text delivery.

Accept when a message appears in another authenticated browser, retries do not duplicate it, 'sending'/'sent'/'failed' are accurate, and 'read' appears only after a recipient acknowledgement. Reject messages outside authorized relationships, render text safely and provide a support/report route. No fake coach replies or fabricated conversation history.

## F-11 — Progress and history | Pilot minimum | Fixture/local screens exist

Calculate adherence/history from sessions and dated assignments. Show optional user-entered weight or other approved metrics with canonical units, capture dates and provenance. Do not display fabricated calorie burn, steps, rings, achievements or wearable connections. Unknown is not zero.

Accept when data agrees with underlying records, repeated workouts are counted separately but retries are not, timezones do not shift dates incorrectly, empty charts explain the absence of data, and unit conversions round only for display. The client can view/export their permitted historical records even when new-coaching entitlement ends.

## F-12 — Private photos and form-check video | Optional pilot extension | Browser/local media paths exist

Keep off until private upload, storage authorization, scanning/validation, retention and deletion are implemented. Obtain purpose-specific permission and explain exactly which coach can view the upload. Progress photos are private by default and never become marketing assets automatically.

Accept when MIME/size/decode checks reject invalid files, unapproved uploads remain quarantined, object names contain no email/name, a guessed path or another user's signed-download request fails, EXIF/location metadata is removed where applicable, and deleting a record removes the corresponding object through the storage API. Private video needs codec/device testing and a processing plan before enablement.

## F-13 — Service entitlement and billing status | Pilot | Local membership UI only

Represent service access independently of how it was paid. An audited operator can grant a time-bounded pilot entitlement after checking an approved external payment or complimentary agreement. Self-service web payments are a separate gated task. Every grant records relationship, offer version, source, period and actor.

Accept when changing browser state cannot grant access; expired access stops new paid coaching operations without blocking account/support/export; cancellation date is accurate; and retries/out-of-order payment events cannot resurrect a canceled entitlement. See [BILLING](BILLING.md).

## F-14 — Notifications | Pilot in-app; external later | Preference screens only

Create durable in-app notifications from committed events. Use an outbox for email/push when enabled. External text is generic and contains no injury details, message body, body measurements or private media URL. Preferences distinguish necessary transactional notices from optional reminders/marketing.

Accept when transactional events generate one logical notification, delivery can retry without duplicate user-visible items, failures are observable and no notification falsely claims a message was read. Web push is not required for the first pilot.

## F-15 — Settings, support, export and deletion | Pilot | Mostly local/simulated

Allow profile/timezone changes, contact verification changes through the identity provider, support requests, service cancellation, personal export and account deletion requests. Reauthenticate for sensitive operations. Cancellation and deletion are separate actions; neither is hidden behind forced retention screens.

Accept when support reaches a monitored destination, exports exclude other people's private content, deletion is a tracked job with a clear policy/status, revoked sessions cannot return, storage objects/caches are included, and legally retained billing records are restricted rather than falsely declared erased. See [SECURITY_PRIVACY](SECURITY_PRIVACY.md).

## F-16 — Operator controls | Pilot minimum | Missing

Approve/invite coaches, inspect non-sensitive operational status, suspend access, handle entitlements and requests. Avoid a default 'view all client health data' administrator role. Exceptional support access requires a reason, bounded scope and an audit trail.

Accept when privileged actions require MFA/reauthentication, actor/target/reason are logged without sensitive bodies, permissions cannot be self-assigned, and ordinary coaches cannot invoke operator endpoints.

## F-17 — Public web, localization and accessibility | Public web gate | English/reference metadata

Server-render approved marketing/coach pages; retain noindex for private pages and all preview environments. Provide Bulgarian-first copy structure and verified English fallback. Use metric defaults, real dates and a configurable transaction currency approved by the seller/accountant. Do not hard-code copied US prices.

Accept when public metadata reflects Gymaf, private pages/files are neither cached publicly nor indexed, Cyrillic does not break layout, keyboard/focus/contrast/reflow checks pass and legal/support links are functional. Indexability is a route decision, not a global toggle.

## Deferred surfaces

F-18: installation-friendly PWA and native apps, specified in [MOBILE](MOBILE.md). F-19: curated discovery after evidence of reliable delivery and coach/customer demand. Friends, public leaderboards, contact sync, native Health/Watch/GPS/music presentations and marketplace ranking remain unavailable, not misleading demonstrations, in production. Record each removed/hid entry point in the route migration checklist.
