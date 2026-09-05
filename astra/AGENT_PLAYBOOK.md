# AI coding-agent execution playbook

Read root `AGENTS.md` first; it is the concise governing contract. This playbook turns the specifications into bounded implementation work. Current code is a local prototype; target documents are not proof of working integrations.

## Context loading

For every task: read DECISIONS, the backlog item and its linked docs/source; inspect the actual current commit/diff; identify whether dependencies are really implemented. Read the installed Next/React/provider guidance for the versions in the checkout. Do not assume an online code example matches a pinned future package version. Avoid loading historical OCR/capture data as a substitute for product requirements.

Read AUDIT before using an existing screen. Read FEATURES for user-visible acceptance. Read DATA_MODEL/API_CONTRACTS/SECURITY_PRIVACY for any stored record or endpoint. Read DESIGN_CONTENT before visual/content changes. Read BILLING/MOBILE before purchase/native work. Existing clone-oriented source comments and `.impeccable` metadata are superseded where they conflict with Gymaf's production direction.

## Implementation loop

Select one dependency-ready work item and break it down if necessary. State the observable outcome, relevant acceptance tests, files/modules, migration scope, human gates and intentionally excluded work. Work on a feature branch and preserve unrelated edits. A shared contract or schema change must include affected consumers and tests; do not leave a half-migrated app behind a fake local adapter.

Build a thin end-to-end slice with synthetic data. Keep presentation separated from services and replace prototype state intentionally. Use user-token authorization/RLS and operation-specific DTOs, not client-role flags. Validate input at runtime and in database invariants where bypass paths exist. Add negative tests before declaring success.

Run existing and newly implemented checks, verify representative views at mobile/desktop widths, and record exact outcomes. A mocked provider test is labeled mocked. A network/tool limitation is NOT RUN, not PASS. Never reuse historical QA screenshots/build claims as fresh evidence. Do not make a test pass by weakening ownership/policy checks or removing a necessary assertion.

Update task evidence, feature status, schema/API changes and any ADR. Open a focused PR; do not merge/deploy/provision/charge/delete live data automatically. Report remaining risks and next dependency-ready work without claiming the whole platform is ready.

## Starter prompt: baseline and first implementation gate

```text
Work in darkapoparka/gymaf. Read AGENTS.md and astra/README.md,
astra/DECISIONS.md, astra/AUDIT.md, astra/TEST_STRATEGY.md,
and astra/backlog.json.
Start with GY-001 on a feature branch. Preserve current layout/styling.
Record the current commit, runtime, lockfile and dependency install results.
Run the existing lint/typecheck/build commands where available. Establish
representative mobile/desktop visual evidence. Add focused regression tests
for repeated workout history and malformed local-state handling; distinguish
historical defect reproductions from tests of a new fix. Propose minimal fixes
without a UI rewrite or unapproved dependency changes. Report exact commands,
results and any NOT RUN checks. Do not provision services, deploy to production,
use real client data, or implement the entire backlog in one PR.
```

## Prompt: real coaching vertical slice after foundations

```text
Select the next ready GY-009 through GY-016 work item after GY-004 through GY-007
have verified evidence. Read its feature, schema, API and security contracts.
Use two coach workspaces and three synthetic clients. Keep the current UI
language. Implement the specified real operation, not a local success state.
Test actor ownership, sibling-client isolation, direct API/database access,
idempotent retries and relevant revision conflicts. Attach migration and
visual evidence. Do not enable gated media/payments or change the brand style.
```

## PR body and handoff template

```text
Task/feature/audit IDs:
Base commit / tested commit:
Observable behavior delivered:
Files and contracts changed:
Database migration and compatibility notes:
Authorization and negative cases tested:
Commands and outcomes (PASS / FAIL / NOT RUN, with reason):
Provider tests (mock / sandbox / actual, no live financial action):
Visual evidence and intentional differences:
Privacy/content approvals needed or recorded:
Deployment/rollback impact (deployment not executed unless authorized):
Known limitations and unresolved defects:
Backlog/status updates:
Next dependency-ready task:
```

## Prohibited shortcuts

No generic redesign, universal backend/service-role client, hardcoded Alexander tenant, fabricated paid state, generated client testimonial, fake coach response, invented font license, implicit reference-data migration, unchecked public upload, silently cached private response, or unsupported medical claim. A green build cannot substitute for a cross-user test. Do not copy a huge API/model plan into code in one unreviewed change; implement tested slices.

When an owner gate is unresolved, prepare the smallest useful synthetic implementation/design and clearly leave the external action disabled. Do not invent a legal seller, price, partnership split, policy approval or cloud account. Avoid unnecessary clarifications when repository reads can resolve a technical question; genuinely human commercial approvals remain explicit gates.
