# Gymaf design authority

Updated 7 September 2026. Preserve the original Future Pro template visual language; do not redesign the product by default.

## Original template authority

The owner's explicit direction is the original Future Pro template with the current backend integrated. Its preserved component hierarchy from `M:/gym` main `c69df15` is the member visual authority; the replacement member shell previously shown at `/app` is not an approved substitute. Both `/` and `/app` now use `FutureApp` wrapped by `BackendProvider` in the separate `M:/gym-fidelity` review worktree. Home, profile, workouts, progress, settings, messages and session presentation retain the original hierarchy while actual authenticated records and existing server commands supply their data and behavior. Newer account, billing, media, directory and service controllers remain available; standalone coach/operator surfaces retain their existing interface.

This is a presentation and record-adapter correction, not approval of reference identities, assets or unsupported product claims. Development capture fixtures require an explicit environment flag and capture query, stay separate from signed-in data, and never seed real accounts. [ADR-016](astra/ADR-016-ORIGINAL-TEMPLATE-INTEGRATION.md) records the exact implementation scope; [IMPLEMENTATION_STATUS](astra/IMPLEMENTATION_STATUS.md) separates current checks from historical evidence. The bounded signed-in mobile/desktop read pass does not establish 1:1 acceptance of all 270 captures or provider, payment, native/device and asset-rights readiness. The existing design sidecar and product brief are unchanged by this documentation handoff.

## Preserve

Existing screen compositions, information hierarchy, soft lavender canvas, light rounded cards/sheets, restrained green accents, serif display roles, readable sans-serif controls, compact mobile navigation, and the corresponding desktop adaptation. Start from the current CSS and components rather than recreating them in a different UI kit.

Observed baseline tokens: canvas `#f1f0f6`, ink `#202020`, muted `#77767e`, line `#d8d7df`, accent `#82d444`, root radius `26px`, nav height `68px`. These are preservation references, not evidence that every contrast combination is accessible. Fix contrast, focus, reflow, and touch-target defects without an unrelated stylistic change.

## Change deliberately

Use Gymaf identity, accurate coach/service content, licensed fonts with Bulgarian Cyrillic support, and owned/cleared imagery. Preserve typography roles and measured layout if font files need replacement; visual similarity does not establish font rights. Replace Future trademarks, logo/emblem, copied photographs, fake people, reference US prices/dates, and unsupported device claims before launch.

A coach's customer journey can carry that coach's approved identity without turning other coach workspaces into Alexander's brand. New coach/admin screens should reuse existing tokens and interaction patterns; their absence in the prototype is not permission for a generic dashboard redesign.

## Acceptance

Capture an approved Gymaf baseline at 393px and 1440px and check 320px reflow, Bulgarian text expansion, keyboard use, reduced motion, loading/error/empty states, and safe-area/keyboard behavior. Keep a reviewable list of intentional differences. Do not require new Gymaf assets to match third-party screenshots pixel-for-pixel.

Detailed rules and asset briefs: [DESIGN_CONTENT](astra/DESIGN_CONTENT.md). The original reference design document is preserved unchanged at [legacy DESIGN](docs/legacy/DESIGN-reference-2026-09-05.md). Existing reference metadata and source comments are historical where they conflict with this production direction.
