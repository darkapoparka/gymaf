# Delivery, operations and launch runbook

Target runbook • 5 September 2026. No cloud project, domain, monitoring account, production database or deployment was inspected or configured in this audit. Provider names are recommendations subject to GATE-INFRA. Historical local build records are not deployment evidence.

## Environments and credentials

Use local/disposable development, protected synthetic preview/staging, and production with separate backend/auth/storage/payment configurations. Never connect a pull-request preview to production client data. Restrict preview access and disable indexing. Protect production changes with reviewed branches and an explicit release approval; do not let a documentation push imply permission to release application code.

Maintain an environment inventory with account owner, provider/project ID, intended region, data classification, billing owner/spend cap, backup capability and emergency contacts. Confirm actual Vercel environment and deployment settings rather than assuming branch names imply isolation (R19 in [RESEARCH](RESEARCH.md)). A runtime region is not a full data-transfer assessment.

Proposed configuration names, to validate against chosen SDKs: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for public connection metadata; private privileged provider key only in a server-only module/worker environment; `APP_ORIGIN`; allowed auth return origins; `JOB_DRAIN_SECRET`; optional email provider credentials; and gated Stripe secret/webhook credentials. Use the provider's current key names/types rather than blindly copying deprecated examples. A publishable key is not an authorization boundary; RLS/grants remain mandatory.

Do not prefix private keys with `NEXT_PUBLIC_`, commit environment files, expose them to untrusted fork jobs, paste them into chat, or include them in client bundles. An `.env.example` may list names and dummy values once implemented. Secret rotation needs an owner-approved procedure and test; do not rotate live credentials during a docs task.

## CI and release pipeline

Start from a clean lockfile install on a documented supported Node runtime. Run lint, typecheck, build, unit/policy/contract tests and the affected browser/visual/accessibility checks. Scan dependencies/secrets with an approved current tool and record results; no 'zero vulnerabilities' claim without a run. Verify that release output excludes reference screenshots/fonts without rights, capture tooling and fixture identities. Keep dependency upgrades separate from unrelated product changes.

Use protected staging with synthetic data for E2E and provider sandbox tests. Produce an evidence bundle tied to a commit and environment. For production, build with production-intended public configuration and the approved private environment. Do not blindly promote a staging artifact containing staging public keys/origins or assume promotion rebuilds it. Recheck actual platform behavior/settings before choosing promote versus rebuild. Pin/review CI actions and avoid secrets in arbitrary PR code.

Deployment order: approved additive migrations → compatible application → smoke tests → verify jobs/permissions → enable a narrowly scoped feature flag → observe. Destructive schema cleanup is a later reviewed contract step, not part of the first rollout. Production database migrations do not run implicitly from every web request or preview build.

## Database and data recovery

Before real clients, approve a maximum tolerable data loss/recovery time and select a provider plan/backup process that can support it. Record measured restore results; do not equate a advertised plan feature with a tested recovery objective. Suggested business discussion target is at most one day of pilot data loss with a same-business-day recovery process, but the owner must approve and the drill must demonstrate the actual achievable limits before launch.

Back up schema/data/config as appropriate, and separately protect private object bytes. Supabase's documented database backups do not include Storage objects (R6). Restore a copy into an isolated environment; verify RLS, grants, functions, auth/session behavior, object access and recent domain records. Reapply deletion tombstones and revoke restored stale sessions before permitting traffic. Do not restore a production dump into a public preview.

For an application rollback, verify database compatibility first. A previous frontend version may not understand a migrated schema or entitlement state. Prefer forward fixes/additive reversibility; do not execute a destructive 'down' migration just to make deployment green. Keep a human-approved maintenance/read-only mode for incidents and a tested way to disable risky features without disabling account/support rights.

## Jobs, observability and cost

Outbox jobs use durable event IDs, leases, bounded batches, retry backoff and dead-letter review. Observe oldest queued age, repeated failures and worker health. A failed notification does not erase a saved workout. Re-fetch current resource state before external delivery so deleted/suspended content is not sent from stale payloads.

Record privacy-safe request IDs, endpoint/status/latency, infrastructure errors, job IDs and audit actions. Exclude tokens, signed media URLs, form bodies, message text, injury descriptions and body metrics. Choose the monitoring/email providers and processor terms through GATE-INFRA/PRIVACY; existing platform logs can be the first operational surface if configured safely. No new analytics vendor is mandatory for the pilot.

Monitor authentication failures/rate limits, unexpected authorization denials, error rate, latency, failed writes, database capacity, private-media egress, backup freshness, stuck exports/deletions and payment reconciliation when enabled. Alert to an actual monitored destination with a named responsible human. Start with a documented cost cap and upload/storage quotas; warn before adding expensive video features. Current provider prices are not specified here.

Product events should be minimal and purpose-approved: invitation accepted, first session completed, check-in submitted/reviewed, service renewed. Keep IDs pseudonymous/opaque, separate test/comped/cohort activity and do not send health details to analytics. Pseudonymous events may still be personal data; apply the approved processing/retention policy.

## Incident procedure

1. A responsible human classifies the incident, records discovery time and restricts further exposure/loss; disable affected endpoints/features or sessions as needed.
2. Preserve minimal necessary evidence in restricted storage, identify scope and affected records/providers, and avoid copying sensitive payloads into public tickets.
3. Restore service through an approved rollback/forward fix; test cross-tenant policies and deletion/revocation after recovery.
4. Assess legal/provider/user notification duties with the responsible controller/adviser. The privacy runbook references the GDPR timing/risk distinction; an agent must not autonomously send incident notices.
5. Record cause, remediation, follow-up test and owner. Reopen the launch gate for a material security/data-loss issue.

## Real-data pilot release checklist

Gates PARTNER where his identity is used, INFRA, COMMERCIAL for paid service, PRIVACY, CONTENT and LAUNCH have real approvals. The core-loop E2E and direct policy tests pass using two workspaces and sibling clients. Session history, retries, sign-out/revocation, canceled-service access, export/deletion and support are demonstrated. Approved coach content replaces source fixtures. Backups plus private media recovery/deletion are proven for enabled features. Monitoring and a coach/support schedule exist. No unresolved high/critical exposure or data-loss defects remain.

For disabled media/payments/native integrations, hide UI and deny routes/commands, with honest copy. For enabled integrations, attach their additional test evidence. Provide client onboarding instructions and known limits, including limited offline behavior, actual coach response window and how to get help. Confirm the coach can deliver the cohort's service manually if a non-critical app feature is interrupted.

## Public release and expansion

Repeat pilot gates, remove unnecessary demo surfaces, verify public/private indexability and headers, test BG/EN copy, device/browser paths and accessible billing/support/terms. Track migration clients separately from new acquisition. Expand cohorts based on coach capacity and actual support/reliability evidence, not a fixed promised launch date.

A launch record contains commit/deployment IDs, schema migration version, approved offers/assets/policies, enabled flags, evidence links, approver/time, monitoring owner and rollback/recovery reference. Do not label the build 'production ready' merely because it deploys successfully.
