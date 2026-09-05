# Data model, ownership and invariants

Proposed logical schema, not applied migrations. Names are canonical for new contracts; agents must generate reviewed SQL and tests before use. Use PostgreSQL UUID identifiers, UTC `timestamptz` for instants, `date` for planned local days, IANA timezone names, explicit status enums/checks, and timestamps/actor fields for changes.

## Identity and tenancy

| Entity | Key fields | Ownership/invariant |
|---|---|---|
| app_users | id linked to auth identity, preferred_name, locale, timezone, unit_system, status | Private account; clients cannot set staff/operator privileges |
| application_sessions | provider_session_id, user_id, created_at, revoked_at | Registered only after server provider verification; revoked session cannot re-register itself |
| workspaces | id, slug, display_name, status | Coach business; not a user account |
| workspace_memberships | workspace_id, user_id, role, status | Owner/coach staff only; unique pair; last-owner removal forbidden |
| coach_profiles | workspace_id, coach_user_id, public_slug, approved_public_fields, publication_state | Private edit record and allowlisted public DTO; no health/client joins |
| coaching_relationships | id, workspace_id, client_user_id, primary_coach_user_id, state, started_at, ended_at | Client membership in a service, not workspace staff access |
| relationship_staff | workspace_id, relationship_id, staff_user_id, permission, revoked_at | Assigned coach access; owner does not automatically gain all sensitive records |
| invitations | id, workspace_id, recipient_identity, token_hash, expires_at, accepted_at, revoked_at, created_by | Single-use recipient-bound token; never store/log raw token |

MVP states: relationship `invited -> active -> paused -> ended`; reactivation is explicit and audited. One active primary relationship globally per client is the proposed product constraint; implement a partial uniqueness constraint on the chosen primary/active states and document paused behavior. Do not make `client_user_id` globally unique across all historical relationships. A new coach relationship does not inherit the old coach's conversation/media automatically.

A workspace owner manages commercial settings/staff. Access to a client's detailed coaching records additionally requires assignment or an explicit approved support workflow. Bootstrap the founding owner as assigned coach when creating a relationship; do not accidentally lock out the only servicing coach.

## Programs and prescriptions

| Entity | Key fields | Invariant |
|---|---|---|
| exercises | id, owning_workspace_id nullable for approved global library, status | Stable catalog identity; archived entries retain history |
| exercise_versions | id, exercise_id, version, instructions, equipment, media_asset_id, reviewed_by | Published instruction version immutable |
| program_templates | id, workspace_id, title, archived_at | Editable program identity, not client performance |
| program_versions | id, workspace_id, template_id, version, state, published_at | Draft editable; published immutable |
| prescription_workouts | id, workspace_id, program_version_id, sequence, label | One workout definition within a specific version |
| prescription_exercises | id, workspace_id, prescription_workout_id, exercise_version_id, position, client_notes | Ordered planned exercise occurrence; same exercise may appear twice |
| prescription_sets | id, workspace_id, prescription_exercise_id, position, target_reps_min/max, target_load_kg, target_duration_seconds, target_distance_m, rest_seconds | Validate relevant target types; null is not zero |
| program_assignments | id, workspace_id, relationship_id, program_version_id, assigned_by, start_date, state | Pins a published version; never points to a moving 'latest' draft |
| scheduled_workouts | id, workspace_id, relationship_id, program_assignment_id, prescription_workout_id, scheduled_date, timezone, state, revision | Multiple per day allowed; optimistic concurrency; date independent of template ID |

A personalized change creates a new immutable prescription/version or a separately versioned override linked to its origin. It does not mutate another client's assigned template. The initial implementation may use a cloned version per personalized assignment for simplicity; record that choice consistently. Template deletion means archiving if referenced. Coach instructions meant only for staff live in a separately protected record, not a field casually included in client DTOs.

## Performed training

| Entity | Key fields | Invariant |
|---|---|---|
| workout_sessions | id, workspace_id, relationship_id, scheduled_workout_id nullable for authorized ad-hoc work, prescription_workout_id, client_command_id, status, started_at, completed_at, elapsed_seconds, revision | Distinct attempt ID; unique relationship/client_command_id; same prescription may have many sessions |
| session_exercises | id, workspace_id, relationship_id, session_id, prescription_exercise_id, actual_exercise_version_id, position, substitution_reason | Captures what actually happened without rewriting prescription |
| set_logs | id, workspace_id, relationship_id, session_exercise_id, set_index, actual_reps, load_kg, duration_seconds, distance_m, status, revision | Unique occurrence/set index; numbers validated; client owns actual data |
| session_events | id, workspace_id, relationship_id, session_id, client_event_id, type, recorded_at, client_time, payload | Deduplicated pause/resume/correction events; server time separate from client claim |
| session_corrections | id, session_id, actor_id, reason, previous_revision, correction, created_at | Completed history cannot be silently overwritten |

Session states: `in_progress <-> paused`, then `completed` or `abandoned`. A completed attempt cannot return to in-progress. A new attempt uses a new command/session ID; retrying the original start/finish uses the old command ID. Adherence can mark an assignment complete based on qualifying attempts, while history still shows every attempt. Do not count duplicate retries or abandoned attempts as completed workouts.

Derive display timers from persisted start/pause intervals and current time; an interval only refreshes the display. Validate impossible/negative values and clock drift rather than treating client elapsed time as trusted billing or health evidence. Background/reconnect behavior requires device tests. The initial web release can keep offline edits in memory and warn about unsaved changes; durable offline storage is a separate privacy-reviewed feature.

## Feedback, progress and communication

| Entity | Key fields | Invariant |
|---|---|---|
| check_ins | id, workspace_id, relationship_id, period_start, revision, state, submitted_at, structured answers, optional note | Unique period/revision; drafts private to client unless explicitly shared |
| coach_reviews | id, workspace_id, relationship_id, check_in_id or session_id, author_id, feedback, created_at | Author is assigned active staff; client cannot forge reviews |
| metric_entries | id, workspace_id, relationship_id, client_user_id, type, canonical_value, unit, measured_date, provenance | Optional; source/user entry explicit; no fabricated wearable values |
| client_limitations | id, workspace_id, relationship_id, client_user_id, optional description, reviewed_at | Restricted sensitive record; not public profile data |
| conversations | id, workspace_id, relationship_id | One per relationship initially |
| messages | id, workspace_id, relationship_id, conversation_id, sender_id, client_message_id, body, created_at, deleted_at | Unique sender/client_message_id; immutable sender/time; plain text |
| conversation_reads | conversation_id, user_id, last_read_message_id, read_at | Recipient acknowledgement only; no implied reading from delivery |
| media_assets | id, workspace_id, relationship_id nullable for permitted catalog media, owner_id, purpose, object_key, mime, bytes, state, reviewed_at | Private by default; state pending/quarantined/ready/rejected/deleting/deleted |
| message_attachments | message_id, media_asset_id, workspace_id, relationship_id | Both records belong to same authorized relationship |
| notifications | id, user_id, event_id, type, resource_id, read_at | Unique logical event/recipient; no private body in external payload |

## Commercial and operational records

`offers`/`offer_versions` define the seller, service type, fulfillment and approved price/currency; historical purchases pin a version. `service_entitlements` grants bounded access to a relationship/offer and records source (`manual`, `stripe`, later `app_store`/`play_store`), validity and status. `orders`, `payment_events` and later subscriptions are not interchangeable with entitlements. Store amounts in integer currency minor units with an ISO currency code; zero-decimal currencies require explicit handling. Never store full card numbers or security codes.

`consent_events` record purpose/version/user action and withdrawal without treating every processing purpose as consent-based. `audit_events` contain actor/action/opaque resource/reason/result/time, not copied private message or injury bodies. `idempotency_records` contain actor/scope/key/request_hash/result pointer, not unbounded sensitive response caches. `outbox_jobs` contain event/type/opaque references/state/attempts/next_run/lease/dead-letter metadata. `data_requests` track exports/deletion/verification/status; `deletion_tombstones` permit restored backups to reapply deletions. Detailed retention requires the approved policy.

## Database enforcement

Use `UNIQUE(workspace_id,id)` on tenant parents and composite foreign keys `(workspace_id,parent_id)` on children. Relationship-scoped records also enforce `(workspace_id,relationship_id)` and, where needed, session-to-relationship composite consistency. Never rely only on globally unique UUIDs to avoid cross-tenant linking. Index the columns used by authorization predicates, client timelines, review queues and message cursors; inspect actual plans before adding speculative indexes.

Enable RLS and review grants, views, functions and object-storage policies. `UPDATE` checks must prevent ownership/workspace changes as well as authorize the old row. Separate public coach fields from private tables. Published-version immutability and status transitions require database enforcement for all entry paths. Avoid recursive RLS membership policies; test carefully scoped helper functions with fixed search paths and minimal privileges.

An initial policy sketch is: active app user/session AND (record client identity equals actor for allowed client operations OR active assigned staff in the matching workspace/relationship for allowed coach operations). This is a requirement, NOT complete copy-paste SQL. Revoked/ended relationship rules, field permissions and audit access need operation-specific policies. Direct table mutations should be revoked where a transactional command is required.

## Lifecycle and migrations

Build each schema change using expand/migrate/validate/contract steps. Test from an empty database and the previous migration state. Include deterministic synthetic seeds, never real client exports. Do not cascade-delete financial/legal retention records accidentally. Fulfill private object deletion through Storage APIs; deleting storage metadata alone is not an object deletion procedure (R5 in [RESEARCH](RESEARCH.md)).

End-of-service stops new coaching but preserves client access to permitted historical/export/account data. Coach access ends by default unless a documented lawful retention/service need is approved. On account deletion, revoke active sessions, queue permitted removal, restrict retained records and retain a minimal tombstone for restore safety. A new account or coach does not silently inherit erased/previous-relationship data.
