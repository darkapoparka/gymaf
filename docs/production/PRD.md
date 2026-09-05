# Product requirements — Gymaf

Version 1.0 • 5 September 2026 • Target specification, not implemented feature claims.

## Product thesis

Gymaf helps coaches run a repeatable training service and helps clients follow it consistently. Start with Alexander Filipov as the intended founding coach: 'Train with Alexander Filipov on Gymaf.' Keep Gymaf independent so other coaches can deliver their own branded experience without advertising a competitor to their clients.

The initial value is delivering coaching, not operating a general workout-content subscription or an open coach marketplace. The launch partner's reputation and conversion potential are not quantified by available evidence. Treat Bulgarian-first demand and willingness to pay as hypotheses to validate, not established market facts.

## Users and jobs

| User | Primary job | Success |
|---|---|---|
| Invited client | Know today's plan, perform it, record results, receive feedback | Can complete a real session and get a useful response without support |
| Coach/workspace owner | Assign programs, inspect adherence, adjust future training, respond efficiently | Can manage a cohort without parallel spreadsheets/messages being required for the core loop |
| Assigned assistant coach (later) | Help service explicitly assigned clients | Sees only permitted clients; cannot change billing/ownership by default |
| Platform operator | Onboard coaches, handle access/support/incidents | Resolves issues through audited, least-privilege tools |
| Public visitor | Understand a coach's offer and request access | Sees accurate service scope, price/terms when approved, and an unambiguous next step |

## Scope decisions

Fixed owner direction: preserve existing layout/styling; replace reference identity/content; responsive web first; iOS/Android later; independent platform with multi-coach capability.

Proposed launch defaults: adults only; Bulgarian-first interface with English-ready copy structure; metric units; Europe/Sofia default timezone that the user can change; one active primary coaching relationship per client at initial launch; invited coaches; one clearly defined recurring coaching offer. These are recorded as defaults, not legal age rules or signed commercial commitments. Backend implementation must not preclude later multiple relationships, but product complexity should not expose them prematurely.

The initial offer should specify training-plan cadence, weekly check-in cadence, coach response window, service duration, availability limits, price, cancellation process and what is NOT included. Exact amounts, response commitments and terms require owner/coach approval. Never insert plausible-looking prices or 'unlimited' promises into production copy.

## Core journeys

**Partner-sourced client:** approved Alexander page → offer/application → verified account/invitation → service/consent disclosures → goals/equipment/availability → assigned plan → workout log → weekly check-in → coach feedback. Preserve the selected coach; do not make that client choose again from a directory.

**Existing coach's client:** coach sends an expiring invitation → verified recipient accepts → a relationship is created atomically → onboarding and assigned plan. A referral link cannot assign an arbitrary user to a coach without acceptance.

**Coach:** sign in with appropriate assurance → client roster/review inbox → create a program draft from exercises/templates → publish an immutable version → assign dated workouts → inspect actual sets and adherence → submit feedback/adjust future plan. The coach must not overwrite a completed client's historical prescription.

**Client lifecycle:** view service status → request help → cancel service separately from deleting account → export permitted data → revoke relationships/sessions and fulfill deletion policy. A failed payment must not prevent access to account controls, receipts, support or data-rights requests.

## Release scope

### Private web pilot

Real accounts; verified invitations; tested tenant isolation using at least two synthetic coaches even if only one real coach launches; approved coach page; minimal onboarding; versioned programs; dated assignments; per-set session logging; resumption/retry handling; weekly check-in/review; real text messages; in-app notifications; approved service entitlement; usable help/export/deletion; monitoring and tested recovery; approved content and privacy/legal gates.

Private photos/video are optional to the first cohort and stay disabled until their upload, privacy, retention and access tests pass. Minimal coaching can launch without them. No sensitive feature becomes mandatory merely because its reference screen exists.

### Public web release

Add the multi-coach invitation/operator workflows, coach availability and explicit offers, refined onboarding, accessible marketing pages, localized content, installation-friendly web experience where supported, complete lifecycle operations and measured performance. Public self-service purchase is optional until the approved seller/billing model is automated; a truthful application/invitation CTA is acceptable instead.

### Later

Native client apps sharing backend/contracts; broader private-media/notification features; carefully scoped in-person/real-time booking; self-guided programs/group services with separate offer semantics; curated discovery once coaching delivery and acquisition are validated. Native delivery does not depend on building a marketplace first.

## Non-goals for initial release

No open coach registration, algorithmic ranking/matching, public social feed/leaderboard, contact harvesting, health-device integrations, background GPS, wearable widgets, integrated music, automated medical advice, AI-generated exercise prescription without coach review, multi-currency tax engine, or separate native app per coach. Hide unfinished production entry points rather than shipping simulated success. Retain useful prototype work as internal references where rights permit.

## Functional quality requirements

All visible actions have loading, error, empty, unauthorized, expired and retry states where relevant. Persisted means acknowledged by the server; a local draft must be labeled unsynced. A successful message send means durable storage, not necessarily recipient reading. Dates, units and currencies must be formatted from structured values rather than copied display strings. New accounts begin empty, never with reference achievements or measurements.

Privacy defaults to private client profiles and relationship-scoped coaching records. Marketing photos/testimonials require separate permission, not bundled participation consent. A client can report pain/limitations and stop a workout; the application does not diagnose or guarantee a safe replacement. Coaches own the clinical/service decisions appropriate to their qualifications.

## Proposed success measures

Track separately: existing clients migrated versus newly acquired clients; account activation versus first completed session; coach software revenue versus coaching revenue; repeat usage versus actual renewal. Do not count reference sessions, staff tests or comped accounts as paid acquisition.

For the pilot, aim to observe roughly 15–30 clients and then 3–5 additional coaches; these are suggested experiment sizes, not forecasts. Record activation within 7 days, week-4 meaningful usage, assigned-workout completion, check-in review time, support demand, coach minutes per client, and renewal with denominators and cohort dates. An active client is one who completed a session or submitted a check-in in the last 7 days; opening the app alone does not qualify. A reviewed check-in requires a coach review record, not page loading.

An initial internal quality target is no unresolved critical/high data-exposure or data-loss defects, all required acceptance tests passing, and a verified recovery drill. Commercial expansion is a human decision based on small-cohort evidence, not an automatic threshold or a promised revenue outcome.

## Human decisions required before real customers

Agree partner role/rights and original software ownership; approve the initial service and coach capacity; identify the legal seller and platform operator; choose the backend/deployment accounts and spend limit; approve privacy/terms/refund/tax handling; sign off asset rights and medical-content boundaries; assign support/security responsibility. See `DECISIONS.md` for gates. Agents may prepare implementations and sandbox tests, but cannot invent these decisions or mark them approved.
