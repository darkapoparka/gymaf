# Dependency-ordered implementation roadmap

Work by verified milestones, not arbitrary dates. Task IDs refer to [backlog.json](backlog.json). Every item is planned; the documentation audit is not completion of an implementation milestone. Preserve the existing design throughout.

## M0 — Reproducible baseline and production boundary

GY-001, GY-002, GY-003. Reproduce install/build and source findings, add test infrastructure, preserve a measured visual baseline, and separate reference tooling/assets from production. Do not start by recreating 270 competitor screenshots. Exit: actual command outcomes recorded, baseline screens reviewed, no reference-only feature can be confused with a live service in the intended release path.

## M1 — Identity, tenancy and contracts

GY-004 through GY-008. Approve one backend approach, build disposable migrations/seeds, prove auth/session/MFA/revocation, staff/client relationships and invitations, and establish typed API/DTO boundaries. Add the approved coach entry and minimal onboarding using existing components. Exit: two synthetic coaches and three clients cannot cross-read/write through UI, API, direct database calls or session reuse. Public coach content is separately approved.

## M2 — Training can actually be delivered

GY-009 through GY-014. Reviewed exercise catalog → coach drafts/published program versions → dated client assignment → per-set session logging → resume/retry/conflict correctness → genuine history. Exit: the same workout can be performed twice without overwriting, one request retry does not create duplicate history, and future template edits leave old prescriptions unchanged. The coach can operate the flow without editing JSON manually.

## M3 — Coaching feedback and customer lifecycle

GY-015 through GY-019. Weekly check-in/review, real text messaging, in-app notifications/outbox, operator/service entitlements and working support/export/deletion. GY-020 private media is optional and remains off without its own acceptance. Exit: a real actor-to-actor coaching loop is demonstrated in isolated staging with truthful delivery/access state and lifecycle controls.

## M4 — Private pilot gate

GY-021 through GY-024. Localization/accessibility/visual preservation, adversarial security/integrity tests, deployment/recovery/monitoring and an owner-approved invited cohort. Include all required human gates before real client data. The first paid cohort may use an approved external payment process plus audited time-bounded entitlements; integrated checkout is not necessary to prove coaching value.

Do not skip the coach workspace because the client UI looks finished. Do not postpone privacy/security until 'after beta'. Do not enable optional video to satisfy a reference screenshot if the service works without it.

## M5 — Public web release

GY-025 is optional automated billing after the seller model is approved. GY-026 validates public launch with accurate offers, approved assets, operating support and the feature set actually enabled. GY-027 adds installation/PWA improvements when useful. Exit: documented reliable service and commercial/operational readiness, not merely a public URL. Where payments/media are enabled, their tests become mandatory release prerequisites even if their backlog dependency is conditional.

## M6 — Native apps

GY-028 through GY-031. Prove shared contracts and choose a supported Expo matrix, build the native client core, optionally add gated device/offline/notification capabilities, then complete store/payment/legal/device acceptance. Native work can start after a stable pilot/API; it need not wait for a marketplace or every public-web enhancement. Do not claim DOM/CSS reuse or submit an unreviewed wrapper.

## M7 — Curated discovery, only after delivery evidence

GY-032. Validate whether independently arriving customers can select suitable available coaches and whether coaches accept the acquisition model. Begin with approved profiles and manual matching, not open registration/ranking. Establish coach verification, service quality, complaints/refunds and attribution before exposing broader discovery. Native release is not a prerequisite for this experiment, and neither track proves the other has demand.

## Work selection

Choose the earliest unsatisfied dependency, not the most visually exciting screen. A task is dependency-ready only when its required preceding implementation has evidence; planned docs alone do not satisfy it. Human gates may allow design/synthetic work while blocking provisioning, real data, charges or publishing. Split a broad work item into reviewed sub-tasks before coding when it cannot fit one safe vertical-slice PR. Update dependencies/status/evidence in the backlog instead of working an untracked parallel rewrite.

## Re-evaluate at the pilot

Measure activation, genuine completed sessions/check-ins, coach review time, coach time spent per client, support issues, retention and renewal, separating existing clients, new customers, tests and complimentary access. Interview clients/coaches using actual workflows. If only Alexander's service has demand, a focused coach-led business remains valid. If coaches pay for software but discovery does not convert, focus on software. Marketplace expansion is not inevitable and should not dictate the first release's complexity.
