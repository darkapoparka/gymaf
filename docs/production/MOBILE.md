# Web first, then native iOS and Android

Target plan • 5 September 2026. The current repository is a web prototype, not an iOS/Android app. Native-looking reference presentations are not evidence of native integrations.

## Stage 1 — responsive production web

Prove the real coaching loop and account/data boundaries first. Retain existing mobile-first layout and improve coach desktop workflows. Test iOS Safari and Android Chrome on devices, including keyboard overlap, safe areas, scrolling, viewport resizing, reconnect and foreground/background behavior. A mobile browser screenshot is not a phone camera/codec/notification test.

Add a manifest, owned app icons and installation guidance as a later web increment. Installation and web push capabilities vary by browser/platform; use feature detection and honest fallbacks, not an 'install app' promise on unsupported contexts (R17 in [RESEARCH](RESEARCH.md)). Keep private API responses and media out of general service-worker caches. Initial offline behavior is explicitly limited to in-memory drafts/retry; it does not guarantee that a closed/offline page can restore health data.

## Stage 2 — native client app

Recommended approach: Expo/React Native with development builds, selected against the supported SDK/React Native dependency matrix when implementation starts (R9). Do not copy this web project's React/Next pins into a native app and assume compatibility. The main reusable investment is the backend, tested authorization, resource contracts, validation, calculations, localization keys and design tokens.

Reuse: shared TypeScript domain/DTO contracts, API client, pure calculations, service-entitlement interpretation, message keys and serializable tokens. Rebuild: screen components using native views/text/inputs, navigation, sheets, image/video handling, gestures, accessibility integration, auth callbacks, OS permissions and secure credential storage. Next Server Components, DOM markup and CSS are not portable native components.

Keep one Gymaf native app with coach-specific content; no separate binary per coach initially. Keep coach authoring/operator tools on web until their native use case is proven. Create the monorepo/shared packages at this stage only if it makes dependency ownership clearer; do not restructure the whole web app during the first auth migration.

A Capacitor wrapper is an alternative only through an explicit ADR demonstrating the required native value, offline/security behavior and store fit. It is not the default answer to 'real native app' and does not guarantee store acceptance.

## Native vertical slice

Implement sign-in/deep-link callback → assigned schedule → workout/set logging → pause/resume/reconnect → summary/history → coach feedback/messages. Use the same resource API; never connect an unrestricted database/service-role key in a mobile bundle. Persist refresh credentials in OS-backed secure storage and validate application-session state on startup; clear on sign-out. SecureStore behavior differs across platforms and may persist through an iOS reinstall, so uninstall is not a revocation mechanism (R9).

Register exact callback/deep-link domains and bundle/package identifiers under owner-controlled accounts. Check return paths, token exposure in URLs/logs and account-linking behavior. Test fresh install, existing-session install, reinstall, expired/revoked session, lost device workflow and two accounts on one device. A secret shipped in a native app is not a server secret.

Start with text communication and reviewed training. Push notifications, private media and durable offline queues are separate gated capabilities. Use generic notification text, authorized resource fetch on tap, deduplication and revoked-device token cleanup. Do not place health notes or signed photo links in push payloads. HealthKit, Health Connect, Apple Watch, background GPS, Live Activities and music remain disabled until separately scoped permissions/privacy/device tests justify them.

## Store and purchase decisions before implementation

Classify the actual service, not the marketing label. An asynchronous plan/check-in subscription, a downloadable program, group coaching and a real-time individual session may have different payment-policy treatment. Apple's real-time individual-to-individual service provision is not a blanket exemption for all coaching products. Google publishes its own payments policy, with regional programs/requirements that must be rechecked at submission (R10/R11). Do not assume being in Bulgaria or selling on web removes store obligations.

Record per platform/storefront: service classification, permitted purchase flow, any required billing integration, external-link restrictions/entitlements, restore behavior and refund/revocation handling. Keep the server entitlement model provider-neutral. Add verified store purchase/renewal notifications and restore/reconciliation if required. A client-side receipt or successful UI callback is not sufficient access proof. Do not hide a web checkout in a view to evade a policy.

Store review also examines originality, accurate metadata and privacy. Replace reference branding/content and review the overall commercial identity; preserving layout intent does not certify compliance. Prepare truthful screenshots of the actual app, support/privacy links, account deletion and appropriate content/reporting controls. Apple's guidelines explicitly address account deletion for apps supporting account creation; review the current corresponding Google requirements too before submission (R10/R11). Avoid claiming legal or store approval in documentation before it happens.

## Native release gates

GATE-NATIVE requires owner-controlled developer accounts, legal entity/publisher decision, app identifiers, approved store/service classification and purchase model, privacy disclosures, media/notification permission copy, support/deletion operation and submission approval. Do not enroll paid accounts, create live in-app products or submit builds without authorization.

Test on at least one supported physical iPhone and one supported physical Android device, including camera/microphone denial if those features are enabled, background/foreground, network loss, large text/screen reader, keyboard/safe areas, codecs, account switch, deletion and purchase restore where relevant. Use beta distribution before public stores. SDK target/OS/store requirements must be reverified at release; no future version or approval is promised here.

Native development can begin after stable web/API evidence without waiting for a marketplace. Discovery is a business expansion; native delivery is a separate client-platform choice.
