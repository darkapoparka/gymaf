# Gymaf local agent handoff — implemented Astra branch

Updated 5 September 2026. The owner requested actual implementation on a separate `astra` branch followed by local-agent testing. That branch now contains the connected-web core and test infrastructure; it is not only a documentation branch.

Read [LOCAL_TESTING.md](LOCAL_TESTING.md), [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md), [ADR-007-CONNECTED-WEB.md](ADR-007-CONNECTED-WEB.md), and root [AGENTS.md](../AGENTS.md). The original PRD/roadmap still applies to unfinished release work. Do not restart implemented features just because the original backlog retains planned statuses.

GitHub CI evidence is in [evidence/astra-ci-2026-09-05.json](evidence/astra-ci-2026-09-05.json). It includes a passing build/typecheck/lint/unit/database run, not a full provider/browser/device certification. The original audit at `97b24278bdc70f2e1f2cba373acfcd6c56e0664d` remains historical.

## Assignment

```text
Fetch origin/astra and create a separate local review branch without overwriting local work.
Read AGENTS.md, astra/LOCAL_TESTING.md, astra/IMPLEMENTATION_STATUS.md and
astra/ADR-007-CONNECTED-WEB.md. Start isolated local Supabase and synthetic seed data.
Run the actual install/unit/lint/typecheck/build/integration commands and record outcomes.
Use your browser tooling to test sign-in, program publish/assign, client per-set logging,
repeat attempts, check-ins, coach reviews, messaging, wrong-user access and account switching.
Review the layout at 393px/1440px plus 320px and real phone keyboard behavior.
Fix failures on the review branch with focused commits; preserve the existing visual direction.
Report all NOT RUN checks and unfinished roadmap items. Do not deploy, charge, merge main,
use real client data or mark the entire 32-task roadmap complete.
```

## Important boundaries

The backend defaults enforce MFA for privileged access; only the supplied local synthetic seed enables a visible test bypass. Seed files/admin tools are not production setup instructions. Service access is manual/complimentary, not a processed payment. Deletion requests are tracked, not falsely fulfilled. No native app, private media service, final content/font clearance or production launch is claimed.

The delivered application code is outside `/astra`, in the actual source, API and migration directories. `/astra` remains the specifications, status and handoff location. `main` is not changed by the implementation branch.
