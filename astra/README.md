# Astra — Gymaf implementation and production blueprint

Updated 5 September 2026. `/astra` is the documentation directory; `astra` is also the separate implementation branch. They are not the same thing. `main` remains separate from the current implementation work.

## Current implementation: start here

The owner requested actual implementation and local-agent testing. The `astra` branch now includes a connected web core, SQL migrations, local synthetic setup and tests. Read [LOCAL_TESTING](LOCAL_TESTING.md) for commands and accounts, [IMPLEMENTATION_STATUS](IMPLEMENTATION_STATUS.md) for exact coverage, [ADR-007](ADR-007-CONNECTED-WEB.md) for implementation choices, and [CI evidence](evidence/astra-ci-2026-09-05.json) for observed passing checks. Full browser/provider/device/production acceptance is not claimed.

The original source audit is pinned to `97b24278bdc70f2e1f2cba373acfcd6c56e0664d`. Its findings and verification limits describe that historical baseline, not every subsequent commit. Earlier documentation-only statements apply to the initial documentation task; they are not a claim that this implementation branch contains no code.

## Agent reading order

Read root [AGENTS.md](../AGENTS.md), then the current implementation status and local handoff above. Read [DECISIONS](DECISIONS.md), [PRD](PRD.md), [FEATURES](FEATURES.md) and task-specific contracts for remaining work. The original [backlog](backlog.json) is a full release roadmap, not evidence that every new code path remains absent or that every implemented path is complete. Its `read` entries resolve relative to `/astra`.

For a ready-to-use local-agent assignment, open [AGENT_HANDOFF](AGENT_HANDOFF.md). Keep the existing visual language and avoid replacing working implementation with a generic rewrite.

## Specification index

| Document | Purpose |
|---|---|
| [AUDIT](AUDIT.md) | Historical source audit, defects and scope limits |
| [PRD](PRD.md) | Product, users, release scope and intended outcomes |
| [FEATURES](FEATURES.md) | Feature acceptance criteria, not automatic completion claims |
| [ARCHITECTURE](ARCHITECTURE.md) | Original proposed system and migration boundaries |
| [ADR-007](ADR-007-CONNECTED-WEB.md) | Actual branch architecture choices and differences from proposals |
| [DATA_MODEL](DATA_MODEL.md) | Target ownership/versioning/lifecycle requirements |
| [API_CONTRACTS](API_CONTRACTS.md) | Target resource contracts; see ADR-007 for the implemented command protocol |
| [SECURITY_PRIVACY](SECURITY_PRIVACY.md) | Threats, access controls, privacy and launch gates |
| [DESIGN_CONTENT](DESIGN_CONTENT.md) | Design preservation, content/asset rights and production briefs |
| [BILLING](BILLING.md) | Commercial model and gated payment implementation |
| [TEST_STRATEGY](TEST_STRATEGY.md) | Full quality target; implemented commands are in LOCAL_TESTING |
| [OPERATIONS](OPERATIONS.md) | Environment, monitoring, recovery and release requirements |
| [MOBILE](MOBILE.md) | Future native platform plan; no store binary is claimed delivered |
| [ROADMAP](ROADMAP.md) | Dependency-ordered release milestones |
| [AGENT_PLAYBOOK](AGENT_PLAYBOOK.md) | Bounded implementation workflow and review templates |
| [DECISIONS](DECISIONS.md) | Owner direction, proposed vendors and human gates |
| [RESEARCH](RESEARCH.md) | Original dated references and strategy hypotheses |
| [backlog.json](backlog.json) | Original 32-task roadmap; reconcile with current implementation evidence |
| [asset-manifest.json](asset-manifest.json) | Planned assets; no generated/approved assets implied |
| [historical reproductions](evidence/reproduction-results.json) | Narrow original JavaScript reproductions |
| [historical documentation validation](evidence/documentation-validation.json) | Initial documentation-only checks |
| [current CI evidence](evidence/astra-ci-2026-09-05.json) | Passing build/unit/PostgreSQL checks at a specific source commit |

## Status definitions

Observed source is not verified runtime behavior. Implemented means code is present; verified means the specified test passed at a named commit/environment. Planned native/payment/media operations are not working integrations. A passing build is not a security, privacy, visual, device or launch certificate.

Real client data and publication remain blocked until the corresponding technical and human release gates pass. The local synthetic seed and its MFA bypass must never be deployed to a real environment.
