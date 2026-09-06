# Commercial model, billing and entitlements

Updated 6 September 2026. The owner delegated provider and credit-rule choices for the remaining connected web flow families. [ADR-015](ADR-015-BILLING-AND-GUEST-PASSES.md) is the current implementation contract and supersedes the earlier proposal's undecided-provider/default-price/cancellation/credit statements. This delegation does not approve a legal seller, partnership, tax/invoice policy, production launch or live financial transaction.

## Implemented commercial defaults

Use Stripe-hosted Checkout and the customer portal. A verified coaching business sells the service through its own Stripe account, or through Connect direct charges for an independent connected seller; the implementation adds no application fee. Gymaf software fees and any founding/referral-partner arrangement remain separate and unagreed. No fee, equity, exclusivity or marketing commitment is inferred from this implementation.

The operator form defaults to EUR 99 per month, tax-inclusive, and ten concurrent guest trials per workspace. Price and trial capacity are configurable by an operator; monthly recurrence and EUR are enforced. Seller name comes from the Stripe account, whose charging capability is checked by the server. No hosted offer is enabled and no seller identity has been supplied. Capability checks do not resolve legal business identity, terms, taxes or refund responsibility.

Monthly membership renews automatically. The hosted portal supports card updates, invoice history and cancellation at the paid-period end without proration or subscription-plan editing. A cancellation request is distinct from service expiry. A full refund or disputed charge on the latest paid invoice revokes paid entitlements and requests cancellation at period end to prevent renewal. Partial refunds do not trigger this full-refund policy. Account records are retained according to separate privacy/lifecycle requirements; a dispute does not delete the account.

## Guest passes

Each current paid member receives three creation credits per UTC calendar month. Manual/complimentary access and guest trials earn none. An enabled offer, positive trial capacity, active coaching relationship and active/past-due nonblocked subscription with a current paid period are required to create a pass. The creation allowance is counted per issuer, without unused-credit rollover, cash value or restoration on revocation.

A pass expires after 30 days and can start one seven-day, card-free, nonrenewing trial for an authenticated new client with no previous coaching relationship or accepted trial. Acceptance rechecks the sender's paid eligibility and coach capacity, creates a real relationship/entitlement and notifies the coach. One trial is allowed per account. The recipient decides whether to subscribe afterward; no trial-to-payment conversion occurs automatically.

Only a hash of the 256-bit pass secret is stored. Private links carry the secret in a URL fragment. An owner can recover pass management after reload and replace the link for an unused/unrevoked/unexpired pass: replacement invalidates the old secret on the same pass and preserves its original expiry and credit usage. Owners can create another pass while credits remain. Revoked sender paid access invalidates unaccepted passes; existing accepted trials persist. Friends/leaderboard invitations remain a separate social feature with no paid credits.

## Payment and entitlement authority

A checkout order, browser return, payment settlement and service entitlement are separate facts. Checkout accepts only an owned active relationship and current offer revision. Orders and subscriptions retain the purchased-offer snapshot so later operator changes do not relabel an existing subscription. One open order per relationship and stable client/order/provider retry identity limit duplicate checkout creation. Check Payment Status reconciles the saved checkout session when a completed checkout has not yet produced a local subscription.

Stripe collects raw card details. Server account/environment/price checks and fixed return URLs prevent the browser from choosing a cheaper price or another seller. No service-role key is used by the web app. Raw-body webhook signature verification precedes authoritative Stripe subscription, invoice, price-line and charge reads. The server signs a bounded timestamped snapshot with a private HMAC secret; database synchronization validates the proof, order/seller/environment binding, paid period, duplicate event and observation freshness before changing access.

The current webhook processes the synchronization before acknowledging success. It records processed subscription event IDs and uses transactional entitlement writes, provider delivery retries and explicit refresh. It does **not** implement the earlier proposed durable event inbox, acknowledge-first/outbox worker. Production reconciliation, monitoring and missed-delivery recovery drills remain open. Paid access requires a positive paid invoice period; active/past-due status alone is insufficient. Revoking subscription statuses and blocked payments revoke Stripe entitlements and unused issuer passes.

## Manual and complimentary service

The existing audited manual/complimentary entitlement path remains available within its authorization boundaries. It must truthfully identify the actor, reason, relationship, dates and external source; it must not be presented as a settled Stripe subscription or generate paid guest credits. Account settings, support, export and permitted history remain governed by the existing lifecycle policy even when new coaching access ends. Do not store bank statements or card credentials in unrestricted fields.

## Current setup and acceptance

Local build/TypeScript, 51 unit tests, five mocked HTTP tests and a fresh PostgreSQL 17 run of eighteen migrations/seed/thirteen SQL suites passed, parent-reported. Final lint: zero errors/two pre-existing coach warnings. The development Supabase schema and private HMAC runtime are installed with live mode disabled. That is schema evidence, not provider settlement acceptance.

No offer/provider connection exists. Existing Stripe CLI credentials returned 401 and a fresh login timed out; Stripe API and webhook secrets remain unavailable. Real sandbox payment, decline, portal cancellation, refund and dispute paths are NOT RUN. [STRIPE_SETUP](STRIPE_SETUP.md) records the next provider setup. The blocker is authentication, not approval of the already delegated product defaults.

The final review is NEEDS VERIFICATION: three functional findings are resolved in source; error visibility is source-fixed but awaiting updated mobile captures. The browser pass predates final fixes; automatic approval review rejected restarting the local production server (`blocked by policy`). See [IMPLEMENTATION_STATUS](IMPLEMENTATION_STATUS.md) and [FRONTEND_PARITY](FRONTEND_PARITY.md) for the exact evidence boundary. No live charge/refund, paid resource provisioning, production deployment or main merge occurred.

Before live activation, exercise actual sandbox success/abandon/decline/delayed confirmation, invalid signatures, duplicates/stale delivery, cancellation, renewal, refunds/disputes, provider outage and reconciliation; verify seller/environment isolation and operator support. Native purchase/storefront classification, privacy, media lifecycle and rights/content gates remain separate. An entitlement abstraction does not create an exemption from store rules; consult [MOBILE](MOBILE.md) before native purchase implementation.

## Remaining owner and release gates

The delegated provider, monthly default and guest-credit rules above are decided. GATE-COMMERCIAL still requires the actual legal seller, service scope/response promises, final published offer and tax/invoice/refund responsibility. GATE-PARTNER retains identity/content and business-agreement requirements. GATE-INFRA retains owner-controlled credentials, spend and production configuration; GATE-PRIVACY retains real-data processing requirements; GATE-NATIVE retains storefront and distribution review; GATE-LAUNCH retains release approval. See [DECISIONS](DECISIONS.md). These uncompleted gates cannot be marked passed by local code or synthetic tests.
