# Commercial model, billing and entitlements

Proposed implementation plan; legal seller, price, payment provider and partnership terms are NOT approved by this document. Payment integration is not required to prove the first coaching loop, but truthful service access and lifecycle controls are required before a paid pilot.

## Recommended initial separation

Keep three businesses/contributions distinguishable: the coach provides coaching; Gymaf provides software; a referral partner may help acquire customers. The initial hypothesis is that coaches bring their own clients and pay Gymaf a software fee, while those clients buy a clearly defined coaching service from the coach's approved business. Alexander may have founding-partner terms, but no equity, exclusivity, revenue split or marketing commitment is assumed agreed.

The operator must decide who legally sells each offer, appears on receipts, handles refunds/complaints, pays taxes and owns payment-provider accounts. A platform collecting money and later paying coaches is a different flow from software used by coaches who collect their own customer payments. Stripe documents separate SaaS and marketplace integration patterns (R8 in [RESEARCH](RESEARCH.md)); that does not resolve the legal model for Gymaf automatically.

## Private pilot before integrated checkout

Use an approved external payment/invoice process or an explicit complimentary pilot agreement. An authorized operator records a bounded service entitlement after verifying the relevant payment/agreement. The product must say what that entitlement represents; do not label it a settled Stripe subscription when no Stripe transaction exists.

A manual grant includes actor, reason, relationship, approved offer version, start/end dates, source type and a minimal external reference. Do not upload bank statements or full card/payment credentials to GitHub or unrestricted app fields. Reconcile grants against the approved business record. A complimentary grant is excluded from paid-acquisition/revenue metrics.

Manual does not mean insecure: clients cannot grant themselves access, changing localStorage cannot change it, all updates are audited, and expired/canceled service has explicit behavior. Account settings, support, data export and permitted historical records remain accessible even when new coaching is unavailable.

## Entitlement state model

Use `pending`, `active`, `grace_period` if approved, `expired`, `canceled` and `revoked` with explicit effective dates. A cancellation request and its effective service end are separate fields. Define whether an approved cancellation ends immediately or at the paid period end; do not infer that from a display label. Access checks use server time and service scope, not the client clock.

Do not equate order creation, payment initiation, payment settlement, subscription renewal and service fulfillment. An order can await payment without granting access. A refunded payment needs an approved entitlement adjustment policy; a chargeback should enter a reviewed workflow rather than silently deleting the account. Financial records and personal account deletion follow the retention/privacy policy.

## Gated self-service web payments

After the seller model is approved, select a provider-supported integration for that seller. For a single legal seller, hosted checkout and a customer portal may be adequate. For independent coaches receiving funds through Gymaf, evaluate Stripe Connect onboarding/account capabilities, the exact charge model, loss/refund/dispute responsibilities, application fees and reconciliation. Do not default to destination charges merely because they appear in a tutorial. Reverify supported country/currency/payment methods, current fees and contract requirements at implementation; no provider pricing is asserted here.

Use provider-hosted payment collection where possible. Gymaf must not store raw card numbers or security codes. Keep provider IDs scoped to the correct seller/environment. Browser-selected amounts, seller IDs, price IDs and return URLs require allowlisting/server lookup; an offer ID cannot be swapped to obtain another service at a lower price.

Required event flow: verify signature over the raw payload → persist a uniquely keyed event/inbox record → acknowledge receipt → process/reconcile in a transaction with retries → update order/subscription state and entitlement → emit an outbox event. Repeated or out-of-order events must not grant duplicate access or resurrect canceled service. Query the provider's authoritative object state where event order is insufficient. A checkout success redirect is not payment proof. Stripe's webhook guidance covers delivery/signature/retry concerns; Gymaf's exact state transitions remain application requirements (R7).

## Minimum billing tests

Test sandbox success, abandoned checkout, decline, delayed confirmation, duplicate event, invalid signature, stale event, cancel at period end, immediate revocation, renewal after lapse, refund/dispute workflow, provider outage and reconciliation after missed delivery. Verify isolation between test/live and seller accounts. A client must not be charged twice by a retry or accidentally subscribed to duplicate service products.

Launch integrated payments only after a real operator can locate a transaction, explain its service entitlement, process the approved cancellation/refund path, and detect reconciliation failures. No agent may execute a live charge/refund or activate live keys without explicit authorization.

## Native payments are a separate review gate

Do not assume that all 'personal coaching' is exempt from store billing. Apple's published individual person-to-person exception specifically addresses real-time services; that should not be generalized to asynchronous programs or digital subscriptions. Google has its own rules and regional programs. Assess each actual offer and storefront before implementing native purchase or external purchase links; see [MOBILE](MOBILE.md) and R10/R11.

If store billing is required, retain one server entitlement model with verified provider-specific purchase records, restore/reconciliation, refund/cancellation events and account linking. Do not make web users repurchase accidentally. Do not implement hidden external checkout to avoid a store rule. An entitlement abstraction makes multiple legitimate payment sources possible; it does not create an exemption.

## Approval checklist

GATE-PARTNER: ownership and Alexander's role/brand/content permissions. GATE-COMMERCIAL: legal seller, service scope, price/currency, capacity, taxes/invoicing, refund/cancellation and referral terms. GATE-INFRA: provider accounts, spend, environment ownership. GATE-PRIVACY: processing roles/contracts. GATE-NATIVE: storefront/service classification before native distribution. These gates are recorded in [DECISIONS](DECISIONS.md) and cannot be marked approved by an implementation agent.
