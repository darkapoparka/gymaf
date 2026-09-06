# Decisions, recommendations and owner gates

Updated 6 September 2026. This register prevents an agent from turning a recommendation into a signed business agreement or a connected service. Approval of these docs is not permission for live deployments, purchases or financial transactions.

## Direction established by the conversation

| ID | Decision | Status/evidence |
|---|---|---|
| DIR-001 | Preserve existing layout, styling and visual hierarchy; improve rather than redesign | Explicit current owner instruction |
| DIR-002 | Replace reference content with distinct Gymaf brand/content | Explicit current owner instruction |
| DIR-003 | Launch production web first, native iOS/Android later | Explicit current owner instruction |
| DIR-004 | Independent Gymaf with Alexander as intended flagship coach; multi-coach capability, invited-coach software before open marketplace | Direction carried forward from the strategy conversation; actual partnership remains unagreed |
| DIR-005 | Create AI-agent-ready product/engineering/launch documentation based on source review | Explicit current task |

## Current delegated billing decisions — 6 September 2026

The owner delegated the remaining payment-provider and credit-rule choices while requesting completion of the Future Pro Mobbin web families. [ADR-015](ADR-015-BILLING-AND-GUEST-PASSES.md) supersedes prior undecided-provider/default-price/cancellation/referral-credit statements only within this scope. These are implemented product decisions, not legal seller certification, production approval or provider acceptance.

| ID | Decision | Status/evidence |
| --- | --- | --- |
| BILL-001 | Stripe hosted Checkout and customer portal; verified seller's own account or Connect direct charges for an independent connected coach business; no application fee | Implemented server paths; real Stripe credentials/setup and sandbox transaction acceptance unavailable |
| BILL-002 | Configurable operator default EUR 99/month, tax-inclusive; automatic monthly renewal; cancellation at paid-period end | Implemented offer and portal configuration; no hosted offer or actual seller configured |
| BILL-003 | Full refund or disputed charge on latest paid invoice revokes paid entitlement and prevents renewal; no account deletion | Implemented authoritative provider reconciliation and database rules; provider sandbox refund/dispute test NOT RUN |
| BILL-004 | Three guest-pass creation credits/current paid member/UTC calendar month; seven-day card-free nonrenewing new-client trial; secret expires after 30 days; no rollover, cash value or restored credit on revoke | Implemented transactional server/database rules; one trial per account; default coach trial capacity ten |
| BILL-005 | Lost guest links are replaced by owner-only hash rotation on the same unused pass, preserving original expiry and credit usage | Implemented; source and targeted SQL review passed; final rendered fixes remain unverified |
| BILL-006 | Preserve purchased-offer DTO, stable command/order/provider retries, raw Stripe signatures and separate private HMAC synchronization; no service-role key in web runtime | Implemented; processed-event ledger with synchronous webhook reconciliation, not a durable inbox/outbox worker |

Final reviewer disposition: NEEDS VERIFICATION. Purchased-offer truth, delayed checkout reconciliation and guest creation/recovery are resolved in source; checkout error visibility is partial because the updated mobile capture was blocked. Automated approval review rejected the local production-server restart (`blocked by policy`). Parent-reported local build/type checks, 51 units, five mocked HTTP tests and eighteen migrations/seed/thirteen SQL suites pass; final lint has zero errors/two existing warnings. Hosted development schema/HMAC setup is installed with live mode disabled, but no offer/provider connection exists. Stripe CLI authentication failed (expired 401; fresh login timed out), so provider setup is blocked by authentication, not a new product-decision approval. See [billing evidence](evidence/billing-2026-09-06.json) and [STRIPE_SETUP](STRIPE_SETUP.md).

## Earlier proposed architecture decisions

**ADR-001 — Keep the current frontend stack and migrate incrementally.** Retain Next.js/React/TypeScript and custom CSS. Introduce real services and missing coach screens in vertical slices. Reject a wholesale UI rewrite, new CSS framework and microservices by default. Tradeoff: some legacy structure remains during migration; tests and route isolation manage that risk. Status: recommended, implementation evidence pending.

**ADR-002 — One managed backend family.** Recommend Supabase Postgres/Auth/private Storage, SQL migrations/generated types, with Vercel as managed web hosting. This minimizes separate integration work for a small team; it still requires serious RLS/session/storage testing. Alternative: Neon plus deliberately selected auth/storage services if the owner prefers it. No dual database/auth setup. Status: proposed, GATE-INFRA required for provider adoption/provisioning and spend.

**ADR-003 — Server application policy plus user-token database policies.** Next services validate identity/resource scope; database permissions/RLS/transactional commands enforce the same invariants against direct calls. Application sessions support immediate app-level revocation; the selected Supabase SSR/PKCE lifecycle must be proven in GY-005. Do not call standard browser-accessible auth cookies HttpOnly. Status: proposed implementation design; security proof required, not a claim of existing controls.

**ADR-004 — Separate prescription from performance.** Versioned programs, dated scheduled instances, per-attempt sessions and per-set logs. Completed history is not keyed only by a reusable workout ID. Status: required target invariant addressing observed data-loss semantics.

**ADR-005 — Limited operational footprint.** Start with text messaging/polling, a durable database outbox and bounded worker. Defer realtime infrastructure, private video processing and native hardware integrations until justified. Manual audited pilot entitlements can precede checkout automation. Status: recommended scope reduction; never simulate delivery or payment.

**ADR-006 — Native client, shared backend.** Recommend Expo/React Native after web/API stability; share contracts/domain/tokens, not DOM/CSS. Keep coach authoring on web initially. No separate app per coach. Status: proposed future implementation, GATE-NATIVE before paid developer accounts/publishing.

## Proposed product defaults

Bulgarian-first copy structure with English readiness; metric units; configurable Europe/Sofia initial timezone; adults-only launch; invited coaches; one active primary coaching relationship per client; one initial clearly scoped recurring coaching offer; private progress/media by default; optional private uploads disabled until their gates pass. These defaults reduce scope but are not verified market demand, legal conclusions or approved prices.

For the one-primary-relationship rule, proposed semantics are: an active OR paused primary relationship reserves the slot; ending it releases the slot. Historical/ended relationships remain distinct. A new invitation explains an occupied slot and never silently transfers a client. Implement the corresponding database uniqueness/policy tests in GY-006. Changing this product rule requires updates to DATA_MODEL, contracts and acceptance tests.

## Human approval gates

The remaining owner/legal/release gates below are **pending**; no legal approver/date is invented. The explicitly delegated billing defaults above are decided and must not be requested again as product approvals. Agents can implement delegated defaults and prepare synthetic sandbox tests within granted access; they cannot invent seller identity, credentials, legal agreement or live-release acceptance.

| Gate | Decision/evidence required | Responsible role | Blocks |
|---|---|---|---|
| GATE-PARTNER | Original software ownership/commission understanding; Alexander's role, name/portrait/content use, promotion/referral commitments and exit terms | Product owner + Alexander + suitable adviser | Public use of his identity/content and partnership claims |
| GATE-INFRA | Backend/hosting choice, owner-controlled accounts, region/processor review, spend cap, runtime/support plan, credentials handling | Product/technical owner | New service provisioning, paid plans and production configuration |
| GATE-COMMERCIAL | Actual legal seller/operator, service scope/response window, final published price and terms/tax/invoice/refund responsibility; BILL-001 through BILL-004 already establish provider and product defaults | Owner + coach business + legal/accounting adviser | Paid service and live payment activation |
| GATE-PRIVACY | Purpose/data inventory, roles/legal bases/Article 9 where relevant, processor/transfers review, retention/DPIA assessment, rights workflow | Responsible business/privacy adviser | Real client data, including an invited pilot |
| GATE-CONTENT | Brand/font/media rights, authentic coach identity, reviewed exercise catalog, approved localized copy, distinct commercial identity | Owner + rights holders + qualified coach | Public assets and instructional content |
| GATE-LAUNCH | Required tests/evidence, monitoring, support/security owner, restore/deletion drill, rollback/release approval, known limitations | Owner + technical reviewer | Real-data pilot and public release; repeat for material releases |
| GATE-NATIVE | Developer accounts/entity/IDs, current store rules/offer classification, purchase/restore design, privacy/deletion/support and device tests | Owner + native/release reviewer | Paid enrollment, live store products and submission |
| GATE-DISCOVERY | Evidence of reliable coaching and independent demand; coach verification, ranking fairness, complaints/refunds and service capacity | Owner + coach operations | Curated marketplace exposure; not required for native development |

The billing implementation establishes EUR, the configurable EUR 99 monthly starting price, no application fee and the guest rules above. It does not establish software-fee/equity terms, domain ownership, an existing provider account/plan, marketing audience size or launch date. Agents must not fill those remaining gaps with reference prices, guessed legal text or plausible credentials.

## Change process

For a consequential change, add an ADR with context, options, decision status, tradeoffs, migration/testing impact and real approver/date. Preserve prior decisions as superseded, not silently edited history. Update dependent PRD/feature/API/model/backlog documents in the same PR. Day-to-day implementation details within the approved architecture need not create bureaucracy; privilege, payment, privacy, provider and visual-direction changes do.

This register is the source for gate names used by [backlog.json](backlog.json). A task marked planned remains unfinished until its evidence is attached; completing documentation does not complete the implementation task.
