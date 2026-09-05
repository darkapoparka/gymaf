# Gymaf

Independent coaching software, launching with a flagship coach experience for Alexander Filipov and designed to support other coaches. Responsive web first; native iOS/Android later.

## Start here — /astra

- [Production documentation and agent reading order](astra/README.md)
- [Agent handoff and starter prompt](astra/AGENT_HANDOFF.md)
- [Source audit and verification limits](astra/AUDIT.md)
- [PRD](astra/PRD.md), [feature acceptance criteria](astra/FEATURES.md), and [architecture](astra/ARCHITECTURE.md)
- [32-task implementation backlog](astra/backlog.json) and [agent instructions](AGENTS.md)

`/astra/` is the canonical production-documentation directory. The initial documentation PR used `docs/production/`; current agents should read and maintain `/astra/` instead.

## Current implementation is a prototype

The audited baseline is `97b24278bdc70f2e1f2cba373acfcd6c56e0664d` (5 September 2026). It is a Next.js/React/TypeScript interactive reference implementation. Local browser state and reference fixtures power its coaching, account, and training screens. Production authentication, a coaching backend, payment processing, and cross-device synchronization are not implemented at that baseline.

The production documents describe the target and the work required; they do not certify a deployed or production-ready service. The documentation change does not alter application source, styling, dependencies, or deployment settings.

## Run the current prototype

```sh
npm ci
npm run dev
```

The dev server listens on `127.0.0.1:3210`. Existing commands: `npm run lint`, `npm run typecheck`, `npm run build`, and `npm start`. Do not start dev and production servers on the same port. Runtime/version verification is the first implementation task; no dependency upgrade is implied by these docs.

`/review` and `/preview` are historical reference-review tools, not customer features. They and their assets require separation from public production builds. Never enter real payment, health, or client information into the current prototype.

## Design direction

Keep the existing layout and styling. Build a distinct Gymaf brand/content layer and real coaching functionality underneath it. See [DESIGN.md](DESIGN.md) and the [content production plan](astra/DESIGN_CONTENT.md).

## Historical work

The original [README](docs/legacy/README-reference-2026-09-05.md), [product brief](docs/legacy/PRODUCT-reference-2026-09-05.md), [design document](docs/legacy/DESIGN-reference-2026-09-05.md), and [root QA record](docs/legacy/QA-reference-2026-09-05.md) are preserved unchanged for provenance. Their old one-to-one Future reproduction goal is superseded for production. Existing capture ledgers and `docs/QA.md` remain historical reference evidence, not current release certification.
