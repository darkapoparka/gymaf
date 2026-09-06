# Stripe development setup and acceptance

This runbook enables the implemented web integration on the approved development project. It does not activate live billing. Product rules are in [ADR-015](ADR-015-BILLING-AND-GUEST-PASSES.md).

## Current setup

The development Supabase project is `crhcgcqanoeoddmwaqhb`. All eighteen migrations are installed. The private billing HMAC secret is configured in the local ignored `.env.local` and `gymaf_private.billing_runtime`; no service-role key is used by the app. Both live switches remain off. No seller offer, Stripe customer, checkout, or subscription has been created in this project by this implementation run.

Stripe account authentication is outstanding. Existing CLI test credentials returned 401; a new device login expired without confirmation. Do not use another project's credentials. Do not copy secrets into chat, commits, screenshots or test artifacts.

## Connect the test account

1. Authenticate the intended Gymaf Stripe account with `stripe login --project-name gymaf`. On this machine the CLI is `J:/stripe/stripe.exe`. Complete its device confirmation in your browser, verifying the account shown.
2. Set that account's **test** API secret in the server-only `STRIPE_SECRET_KEY` entry of ignored `.env.local`. Leave `GYMAF_STRIPE_LIVE_ENABLED=false`. The database's `live_enabled` also stays false.
3. Configure a test webhook endpoint at the app's `/api/v1/billing/webhook`, or use Stripe CLI forwarding to the approved local listener during development. Set the endpoint/listener signing secret as `STRIPE_WEBHOOK_SECRET`; CLI and Dashboard secrets are different. Subscribe to checkout session completion/expiry, subscription changes/deletion, invoice paid/payment failure, charge refunds, and dispute events. For independent sellers, configure connected-account events as well. The installed Stripe SDK 22.6.1 uses API version `2026-08-26.dahlia`; use a compatible event version because invoice subscription references are read from `parent.subscription_details`.
4. Verify `APP_ORIGIN` matches the exact local/preview origin. The API uses it for same-origin writes and Stripe return URLs. Confirm listener ownership before starting the app. The most recent production restart was rejected by automatic approval review, so updated browser checks remain outstanding.
5. Sign in as a real authorized operator (including required MFA), select the coach workspace, and use **Stripe membership setup**. Supply its verified Stripe seller account, monthly EUR amount and trial capacity. The default is EUR 99/month, tax-inclusive, capacity ten. Revision zero creates the first offer; subsequent edits require the current revision. Enable only the test offer. The server checks account readiness and retrieves the actual seller name, then creates a monthly product/price scoped to that account. No application fee is charged by this implementation. Tax-inclusive price behavior does not itself calculate/remit taxes or replace the seller's tax setup.

An account owned by the API key uses its own charges. An independent coach account uses Stripe Connect direct charges, with all prices, customers, subscriptions and portals scoped to that account. Coach onboarding, seller identity, provider account permissions and contractual responsibility must exist before an offer can be enabled. No coach payout routing or platform revenue split is invented. See [Stripe Connect subscriptions](https://docs.stripe.com/connect/subscriptions).

## Required real sandbox acceptance

Use synthetic Gymaf accounts and Stripe test payment methods. Never enter a real card for this acceptance run.

- Confirm the displayed seller, EUR total and monthly renewal before opening hosted checkout. Verify a successful test invoice creates exactly one bounded Stripe entitlement for the correct relationship; the redirect alone must not grant access.
- Interrupt/retry checkout creation and its database acknowledgement. Confirm the same order/session and no duplicate subscription. Cancel or abandon checkout, exercise a decline and delayed webhook, then use **Check Payment Status** to reconcile the owned session.
- Change the workspace's new-offer price and verify the existing member still sees their purchased offer. Existing subscriptions are not automatically repriced.
- Use **Manage Billing** to update the test payment method, read invoices and cancel renewal. Verify access lasts through the paid period. Test renewal/payment failure, period expiration, duplicate deliveries and out-of-order delivery. Stripe retries failed webhooks; the handler returns success only after its synchronous database transaction finishes. There is no durable application inbox worker or scheduled account-wide reconciliation yet.
- Issue three guest passes. Verify a fourth is denied, replacing an unused link retains its pass/credit, the old secret fails, another member cannot rotate/revoke it, and an unrelated row's revocation preserves the currently displayed link. Check these controls and checkout failure copy at 320px and 393px.
- Redeem one pass as a new client. Verify explicit acceptance creates one coaching relationship and exactly seven days of access without a card or renewal. Reject self/reuse/existing clients and enforce simultaneous trial capacity. Cancellation of an issuer does not erase an already accepted trial; future acceptance requires the issuer's paid eligibility.
- Perform test-mode full refund/dispute scenarios and inspect the latest paid invoice, revoked access and prevented renewal. Partial refunds retain access. Recovery from disputed/revoked invoices needs operator review; do not assume a later event restores a revoked period.
- Check webhook delivery failures in Stripe and review the corresponding app request IDs. Never log event bodies, secrets or client information. A pending checkout older than 23 hours with an uncertain provider acknowledgement requires manual reconciliation before another payment; do not delete it merely to let a user retry.

[Stripe webhook guidance](https://docs.stripe.com/billing/subscriptions/webhooks) explains delivery and subscription events; [Connect webhook guidance](https://docs.stripe.com/connect/webhooks) covers seller-account events. Local SQL and HTTP fixtures passing is not this provider acceptance.

## Release boundary

Live keys, live-switch activation, live charges/refunds and production release require explicit authorization. Fonts/content rights, native services, privacy/retention operations, seller/account readiness, complete provider lifecycle acceptance and exact reference pairing remain separate open gates. Supabase advisory output is not clean: the intentional HMAC-protected anonymous definer RPC and authenticated definer RPCs trigger warnings, and existing password-protection/performance advisories remain. [Supabase's definer-function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) documents that exposed privileged boundary; signature, actor, ownership and negative tests are mandatory controls here.
