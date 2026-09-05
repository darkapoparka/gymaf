# Security, privacy and safety requirements

Production requirements and review checklist; not a security certification or legal opinion. Real client data is blocked until the relevant controls are implemented and reviewed. A small pilot is not an exemption. Primary references: [RESEARCH](RESEARCH.md), especially R2–R5, R10–R14.

## Data classification and minimization

Public: approved Gymaf marketing and coach profile fields. Internal: non-sensitive operational configuration. Personal: identity/contact details, service relationship and usage records. Restricted: injury/limitation descriptions, body/progress media, private coaching messages and health-revealing measurements. Authentication secrets, provider credentials and payment secrets are a separate highly restricted class.

Whether a specific record is health data depends on content/context; do not claim every fitness datum is automatically special-category data. Where health data is processed, determine the applicable GDPR Article 6 basis and Article 9 condition with qualified advice. Consent, where selected, must be specific, recorded and withdrawable; a checkbox alone is not an entire compliance program. Do not assume coaches and platform have one fixed controller/processor relationship for all purposes.

Collect only what the service needs. Full birth date, biological sex, progress photos and injury narratives are optional/deferred unless there is an approved need. Avoid advertising pixels, session replay and automated external-model processing on private surfaces. Do not put client records in coding-agent prompts, issue trackers, public fixtures, analytics payloads, screenshots or error reports.

## Permission matrix

| Resource/action | Client | Assigned coach | Workspace owner not assigned | Platform operator |
|---|---|---|---|---|
| Own account/settings/export | Own | No | No | Request workflow only |
| Client intake/session/check-in/messages | Own permitted records | Assigned active relationships | No default sensitive access | No default; approved bounded support access only |
| Draft/published program editing | No | Permitted workspace programs; published versions immutable | Workspace management as approved | No routine content editing |
| Actual set logging | Own active session | Read; correction workflow if permitted | No | No routine writes |
| Service offer/staff management | No | Only delegated permission | Workspace authority | Approved operational actions |
| Billing details | Own transaction/access DTO | Minimum fulfillment status | Permitted business records | Least-privilege support/accounting view |
| Other coach's clients/files | Never | Never | Never | No blanket bypass |

Every policy includes active application user/session state and operation-specific permissions. Invitation acceptance is not staff membership. No permissions derive from editable profile metadata, URL parameters, hidden buttons or localStorage. Test BOLA/IDOR by swapping object IDs between clients of the same coach as well as across coaches.

## Threats and controls

**Cross-client/workspace exposure:** explicit server policy checks, user-token RLS, composite tenant foreign keys, safe views/functions, scoped Storage permissions, and direct API/RPC tests. Do not solve recursion in a policy by broadening access. Never use an ordinary service-role query and trust a preceding client-supplied filter.

**Session theft or reuse:** supported provider auth/PKCE, validated redirect allowlists, secure cookie settings appropriate to the SDK, MFA for coaches/operators, revoked application sessions, short-lived provider access tokens and tested recovery. Browser-SDK tokens may be script-accessible in the proposed SSR design; mitigate XSS and document the residual risk. Do not claim HttpOnly while still exposing refresh tokens to browser JavaScript.

**Cross-site requests and content injection:** same-origin/CSRF protection for cookie-authenticated writes, restrictive CORS for browser API use, safe text rendering, schema validation and a Content Security Policy deployed in report-only then enforced after testing. Static template HTML in the inspected layout is not itself evidence of a user-input XSS vulnerability; do not report a vulnerability without a data flow.

**Upload abuse:** approved types/size/duration, actual-content validation, decompression/decode limits, image metadata removal, quarantine, malware/content handling where appropriate, private bucket defaults, quotas and cleanup of abandoned uploads. Untrusted URLs are not fetched server-side without SSRF protections. Exercise demonstration content requires coach review; user uploads must have reporting/removal controls.

**Forged entitlements/payments:** server-authoritative access, webhook signatures on raw bodies, unique provider event IDs, reconciliation, audited manual grants and no access based solely on checkout return URLs. Raw card details never touch Gymaf application storage/logs.

**Sensitive data in caches/logs:** no shared private-response cache, no cached Set-Cookie responses, no process-global per-user clients, no private service-worker caching, no signed URLs/tokens/message bodies in logs, and synthetic-only previews. Treat request URLs and form fields as possible secret carriers; redact at ingestion.

**Privileged abuse/agent mistakes:** minimum scopes, branch reviews, protected release approval, audited support access with reason/expiry, no real production data in agent contexts, and separate privileged worker credentials. Never commit secrets or give an agent permission to merge/deploy/charge merely because it can edit a repository.

## Sessions, revocation and exports

On sign-out, revoke the application session, invoke supported provider sign-out behavior, clear memory/query caches/private local storage and notify other tabs. On suspension/deletion, policies deny access using current application state even while an old JWT remains cryptographically unexpired. Native secure storage is not guaranteed to disappear on every uninstall; validate session state on startup and explicitly clear credentials on sign-out.

Exports are generated for a reauthenticated requester and contain only their permitted data. A shared conversation needs a policy that protects third-party/private staff content; do not dump all joined tables. Download links expire, remain authorized and are never emailed as permanent public links. Store export objects privately and automatically remove them after the approved short retention period.

## Deletion and retention

Before live data, create an owner-approved retention schedule by purpose/category, with controller responsibility, justification, duration, backup behavior, deletion method and exceptions. Proposed operational defaults for review: pending upload cleanup within 24 hours, export files within 7 days, minimal operational logs within 30 days. These are engineering proposals, NOT statutory retention periods. Do not invent financial/legal retention durations or promise immediate erasure of every backup.

Account deletion workflow: verify/reauthenticate requester; record request; revoke application access; cancel/resolve service separately; enumerate private database/media/export objects; remove/anonymize permitted records; restrict legally retained records; revoke sessions/tokens; delete objects through provider APIs; mark job completion only after verification; retain a minimal deletion tombstone so restored backups do not silently resurrect records. Document backup expiry and reapply tombstones before a restored environment serves traffic. A database backup does not automatically include Storage object bytes.

Coach departure and client departure are distinct events. Default new-coach access does not include old coaching records; explicit client-authorized transfer, if later offered, must define exactly what is moved and what rights each party retains. Platform ownership of software is not ownership of every client's personal data.

## Health/content and age boundaries

The application supports fitness coaching, not diagnosis or emergency monitoring. A pain/limitation report must allow stopping and contacting the coach; do not produce an automatic diagnosis or guaranteed-safe substitution. Coaches approve exercise instructions and any nutrition guidance before publication. No medication, rehabilitation or medical-treatment feature is introduced by these documents.

Launch adults-only as a proposed scope simplification until the owner approves otherwise. Do not use generated child imagery as evidence of supported minors' services. A future minors workflow needs its own consent, safeguarding, age assurance and service policy review.

## Legal/commercial review gate

Before accepting customers, identify the operator and legal seller, business contact details, service terms/cancellation/refund path, coach agreements and asset/name permissions. Review GDPR roles, processing records, processor agreements, international transfers, rights requests and whether a DPIA is required. An EU deployment region alone does not settle these issues. Obtain Bulgaria/EU-specific professional review of consumer disclosures, taxation/invoicing and health-data handling; no legal approval is asserted here.

For an incident, contain access, preserve necessary evidence with restricted visibility, determine affected scope and assess notification duties promptly. GDPR supervisory notification is generally required within 72 hours after awareness unless the breach is unlikely to risk individuals' rights/freedoms; affected-person communication has its own high-risk test. The exact obligations and responsible party require qualified assessment, not an automatic email sent by a coding agent (R13).

## Required security evidence

Before real-data pilot: negative access suite for two coaches/three clients; direct table/RPC/storage tests; session revoke/account-switch tests; no leaked provider key or private artifact; restore plus deletion-tombstone drill; upload controls for enabled media; redacted monitoring; approved legal/data-processing matrix; responsible incident/support owner. Unresolved high/critical exposure or data-loss defects block launch. Passing lint/build does not establish any of these controls.
