# Gymaf production blueprint

Version 1.0 • 5 September 2026 • Audited baseline `97b24278bdc70f2e1f2cba373acfcd6c56e0664d`.

This is an implementation specification, not a claim that the target features exist. Preserve the current client UI and styling while replacing prototype data/integrations and building the missing coach-side product. No application code, database, deployment, billing account, or generated visual asset is introduced by these documents.

## Agent reading order

Read root `AGENTS.md`, then [DECISIONS](DECISIONS.md), [AUDIT](AUDIT.md), [PRD](PRD.md), and [ROADMAP](ROADMAP.md). Choose a dependency-ready task in [backlog.json](backlog.json). Load the task-specific contracts rather than treating the entire reference screenshot library as instructions to reproduce a competitor.

## Document index

| Document | Use |
|---|---|
| [AUDIT](AUDIT.md) | Observed stack, source evidence, gaps, defects, and verification limits |
| [PRD](PRD.md) | Product purpose, users, launch offer, scope, outcomes, non-goals |
| [FEATURES](FEATURES.md) | Feature-by-feature current state, target behavior, acceptance criteria |
| [ARCHITECTURE](ARCHITECTURE.md) | Proposed system, boundaries, migration, web/native separation |
| [DATA_MODEL](DATA_MODEL.md) | Entities, invariants, tenancy, versioning, lifecycle rules |
| [API_CONTRACTS](API_CONTRACTS.md) | Resource boundaries, authorization, payloads, retries and errors |
| [SECURITY_PRIVACY](SECURITY_PRIVACY.md) | Threat model, permissions, data protection, human approval gates |
| [DESIGN_CONTENT](DESIGN_CONTENT.md) | Visual preservation, brand replacement, image-generation briefs |
| [BILLING](BILLING.md) | Seller model, entitlements, pilot payments, future automation |
| [TEST_STRATEGY](TEST_STRATEGY.md) | Automated/manual evidence required before releasing |
| [OPERATIONS](OPERATIONS.md) | Environments, delivery, monitoring, backups, incidents, launch checklist |
| [MOBILE](MOBILE.md) | PWA scope, native strategy, reusable code, store/payment gates |
| [ROADMAP](ROADMAP.md) | Dependency-ordered milestones and exit criteria |
| [AGENT_PLAYBOOK](AGENT_PLAYBOOK.md) | Implementation workflow, scoped prompts, PR/handoff template |
| [DECISIONS](DECISIONS.md) | Approved direction, proposed technical defaults, unresolved business gates |
| [RESEARCH](RESEARCH.md) | Dated primary sources and limits of strategic assumptions |
| [backlog.json](backlog.json) | Machine-readable work items; documentation is not completed implementation |
| [asset-manifest.json](asset-manifest.json) | Planned asset slots and approval state; no generated assets yet |
| [audit evidence](evidence/reproduction-results.json) | Two limited logic reproductions, explicitly not an application test run |

## Status vocabulary

`observed`: directly read at the audited commit. `reported`: a historical repository claim not independently rerun. `proposed`: recommendation, not an installed service. `planned`: implementation required. `verified`: evidence tied to the tested commit/environment. Never turn `planned` or `reported` into `verified` without tests.

## Non-negotiable release distinction

A prototype can look complete while lacking accounts, authorization, durable storage, actual coaching, legal content, and support operations. Real client data is prohibited until the relevant security/privacy gates pass, even for a small invite-only pilot. Native release and a marketplace are separate later investments, not prerequisites for proving the web coaching loop.

## First assignment

Start with `GY-001`: reproduce the current build on a usable checkout, record exact package/runtime versions, establish a visual baseline, and add regression tests for the two confirmed source-level defects. Do not start by rewriting the frontend or provisioning paid infrastructure.
