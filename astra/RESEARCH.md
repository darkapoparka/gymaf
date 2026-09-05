# Research sources and evidence boundaries

Consulted 5 September 2026. Primary documentation below informed the target requirements; vendor capabilities, prices, APIs, terms and store rules must be rechecked when implemented/released. Links are reference material, not evidence that an integration exists or that Gymaf has legal/store approval.

The recommended architecture, task order, limits, cohort sizes and product scope are design judgments for this project. They are not facts asserted by these sources. Where an installed package differs from current online documentation, inspect that package's supported documentation and record the compatibility decision.

## Application and data security

**R1 — Next.js authentication guide.** [Official guide](https://nextjs.org/docs/app/guides/authentication). Relevant to separating identity, sessions and authorization; using a data-access layer and restricted DTOs. Gymaf's specific `/api/v1` and module layout are proposed project conventions, not mandatory Next APIs.

**R2 — Supabase advanced server-side authentication.** [Official guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide). Relevant to PKCE/SSR, refresh behavior, browser-accessible tokens, verifying sessions and avoiding unsafe caching. The added `application_sessions` design is a Gymaf proposal to prove in GY-005, not a built-in table or a claim that a JWT signature check provides immediate revocation.

**R3 — Supabase PostgreSQL row-level security.** [Official guide](https://supabase.com/docs/guides/database/postgres/row-level-security). Relevant to policies/grants and database access controls. A platform provider does not supply Gymaf's coach/client ownership rules automatically; the schema and negative tests remain implementation work.

**R4 — Supabase Storage access control.** [Official guide](https://supabase.com/docs/guides/storage/security/access-control). Relevant to private object access policies. Upload quarantine, media consent and retention requirements in these docs are Gymaf application requirements.

**R5 — Supabase Storage schema.** [Official guide](https://supabase.com/docs/guides/storage/schema/design). Important distinction: database storage metadata is not the stored object's bytes; use supported APIs for object operations.

**R6 — Supabase database overview/backups.** [Official overview](https://supabase.com/docs/guides/database/overview). Important recovery limitation: database backups do not include Storage objects. Backup/PITR availability depends on configuration/plan; no plan or recovery target was verified for Gymaf.

## Commercial integrations and native delivery

**R7 — Stripe webhooks.** [Official documentation](https://docs.stripe.com/webhooks). Relevant to signature verification, duplicate deliveries and non-guaranteed event order. Gymaf must implement an explicit entitlement state model and reconciliation; a successful checkout return page is not the integration's acceptance test.

**R8 — Stripe Connect models.** [Connect overview](https://docs.stripe.com/connect) and [SaaS platforms versus marketplaces](https://docs.stripe.com/connect/saas-platforms-and-marketplaces). These are different integration/business patterns. The seller, funds flow, liability and pricing decisions require owner/adviser approval; no fee schedule or supported-country conclusion is asserted here.

**R9 — Expo native development and credential storage.** [Development builds](https://docs.expo.dev/develop/development-builds/introduction/) and [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/). Relevant to actual native builds and platform-dependent secure-storage behavior. Pick the supported SDK matrix at implementation; web dependency pins are not the native matrix. In particular, app uninstall cannot be treated as reliable credential revocation across platforms.

**R10 — Apple App Review Guidelines.** [Official guidelines](https://developer.apple.com/app-store/review/guidelines/). Review sections 3.1 (purchase models), 4.1 (copycats), 5.1 (privacy/account deletion) and 5.2 (intellectual property). The real-time individual service distinction must not be generalized into an exemption for asynchronous digital coaching. Storefront conditions and the actual submitted offer require a fresh review.

**R11 — Google Play policies.** [Payments](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en) and [account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en). These are separate from Apple's rules. Review actual service classification, applicable regional programs, purchase behavior and account/data deletion paths before distribution. No future submission approval is inferred.

## Privacy, security and quality references

**R12 — GDPR primary text.** [Regulation (EU) 2016/679 on EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng). Relevant areas include Article 6, Article 9 where health data is involved, data-subject rights, security and impact assessments. Apply the law to actual purposes/data/roles with qualified advice; this document is not a Bulgaria-specific legal opinion.

**R13 — European Commission breach guidance.** [Business obligations and breach notification](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en). Relevant to the risk-based supervisory/individual notification distinction and timing after awareness. The responsible controller/adviser must assess an actual incident; a coding agent does not autonomously notify regulators or clients.

**R14 — OWASP object-level authorization risk.** [API1:2023 Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/). Supports testing object access independently of UI visibility. This is not a claim of a proven remote exploit in the prototype or a completed penetration test.

**R15 — W3C accessibility standard.** [WCAG 2.2](https://www.w3.org/TR/WCAG22/). AA is the proposed target for Gymaf web acceptance. Automated scans plus screenshots are not complete conformance evidence.

**R16 — Playwright visual comparisons.** [Official guide](https://playwright.dev/docs/test-snapshots). Relevant to deterministic screenshot testing and environmental differences. Snapshot baselines must be reviewed Gymaf screens, not an automatic approval of every historic reference capture.

**R17 — Next.js PWA guide.** [Official guide](https://nextjs.org/docs/app/guides/progressive-web-apps). Useful for manifest/install/push implementation considerations. It does not turn the current prototype into a PWA/native app, nor guarantee every browser capability.

**R18 — Mobbin terms.** [Official terms](https://mobbin.com/terms). Reference access is not treated as a grant of all third-party asset/brand rights. The repository's retained source assets still require a rights/distribution decision.

**R19 — Vercel deployment environments.** [Official environment guide](https://vercel.com/docs/deployments/environments). Relevant to separate deployment configurations. Gymaf's actual project, secrets, domains, region and promotion behavior were not inspected or changed during this audit.

## Repository evidence is distinct from external research

The static audit references immutable baseline `97b24278bdc70f2e1f2cba373acfcd6c56e0664d` and names source files/symbols. Historical `docs/QA.md` contains earlier local verification reports; this audit did not rerun them. The two isolated expression reproductions are recorded separately in [evidence/reproduction-results.json](evidence/reproduction-results.json). Network failure prevented a local checkout/build, not GitHub source inspection.

## Strategy hypotheses, not validated research findings

The user's relationship with Alexander and intended launch partnership are user-provided context. No signed partnership, audience size, conversion rate, coach willingness to pay, Bulgarian market size or unit economics was supplied or measured. The independent brand/flagship-coach launch is a strategic recommendation, not a forecast.

Test the hypothesis with the coach's actual workflow and paying/retaining clients. Separate existing clients adopting software from new customer acquisition. Then test several unrelated coaches using the same product. Do not manufacture a market-size slide, guaranteed income, testimonial or a price from unverified competitor snippets. The business can remain useful coaching software even if marketplace demand is not proven.
