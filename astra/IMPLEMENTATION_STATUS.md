# Astra implementation status

Updated 5 September 2026. Development branch: `astra`. Base: `82b75bde5b4ac2fa355ee98e0efc39fc470ebac6`. The current implementation is the connected web core for local review, not the completed production/native roadmap.

## Implemented code

| Area | Code delivered | Remaining acceptance |
|---|---|---|
| Identity | Provider email OTP, server-only HttpOnly cookies, explicit refresh/logout, app-session revocation, MFA enrollment/verification UI | Actual provider/browser/MFA recovery, multi-tab edge cases and abuse controls |
| Tenancy | Workspaces, assigned coach/client relationships, recipient-bound hashed invitations, RLS reads and operation-authorized commands | Wider role/reassignment/concurrency matrix and account suspension flows |
| Coach tools | Roster, draft builder, immutable publication, dated program assignment, client detail and check-in review | Full catalog/version workflow, UX refinement and larger-list pagination |
| Training | Distinct attempts, prescribed-versus-actual sets, resume after acknowledged saves, timestamp timing, completion/abandonment, history | Browser foreground/offline/conflict/device checks; rest guidance and complete original-player fidelity |
| Feedback | Weekly check-ins, authored coach reviews and durable text messages/read cursors | Browser-to-browser interaction checks, notifications UI/delivery and moderation operations |
| Service/account | Audited manual/complimentary entitlement backend, complimentary operator UI, cancel-through-end state, settings, support requests, bounded export | Real seller/payment model, recent-auth gates, automated deletion/retention, full lifecycle policies |
| Design | Retained CSS stack/tokens/layout vocabulary, separate connected screens and development-only legacy routes | Local visual approval, licensed assets/fonts, original branding and full BG localization |
| Test/CI | Twelve pure validation tests, PostgreSQL migrations/ownership/history/retry tests, local Supabase integration script, GitHub workflow | Local integration execution, browser/a11y/device suite and release/security review |

Runtime implementation is in `src/features/gymaf`, `src/shared/gymaf`, `src/server/gymaf`, explicit app/API routes and `supabase/`. Specifications remain in `/astra`. The old local store is not a production adapter and is not imported by connected domain components.

## Verified evidence

GitHub Actions run `33985694273` at source commit `5ef5cfd3a68f8f995d3ac44d3d9addb0e31ab405` completed successfully: clean npm install, the unit suite, ESLint, TypeScript, production build, migration application and database ownership/history regression tests. ESLint is passing with three internal-navigation warnings; it is not a zero-warning claim. The first run found a refresh-promise typing defect and render-time `Date.now` issue; both were fixed in that source commit and the checks rerun.

The database job uses real PostgreSQL with a **simulated provider-auth schema/JWT context**. It proves only the exercised migration/command/policy behavior. It does not prove Supabase Auth, email, HttpOnly cookie behavior, actual MFA, browser rendering, visual parity, load capacity or production security. The separate local integration script has been written but was not run in this environment.

The original container still cannot resolve GitHub for a full checkout; GitHub-hosted CI supplied the build/database execution above. Historical static audit reports are preserved at their original baseline and do not supersede these new, scoped results.

## Roadmap tracking

The original `backlog.json` remains the full release plan; no broad task is marked done simply because a first implementation exists. GY-001/002/004–019 have varying implementation coverage represented above. GY-003/008/021 have only partial content/localization/visual coverage. GY-020 and automated billing GY-025 are not implemented. Native GY-028–031 and discovery GY-032 are not implemented. Pilot/public release GY-024/026 remain blocked by technical, service and human gates.

A local agent should reconcile each acceptance criterion with current code and attach evidence, not restart all implemented features from scratch and not mark the entire backlog complete. Read `ADR-007-CONNECTED-WEB.md` for the changed implementation choices.

## Explicitly unfinished

No native iOS/Android binary, store billing, live Stripe integration, uploaded private photos/video pipeline, reviewed exercise-media catalog, generated brand pack, automatic data-erasure job, external notification outbox, full email/notification operations, complete Bulgarian translation, complete legacy-feature migration, public marketplace, physical-device verification, accessibility certification, production deployment or launch approval is delivered here.

Additional hardening includes recent-authentication enforcement for data export/deletion, authentication abuse limits/CAPTCHA, large-account pagination/export jobs, simultaneous permission-revocation/write races, stricter per-operation database payload validation, owner/staff recovery and suspension, final DTO minimization, browser refresh/retry error handling, and verified recovery/retention procedures. Do not use real customers to test these unfinished controls.

## Next local action

Follow `LOCAL_TESTING.md`, run the supplied checks against isolated synthetic Supabase, then exercise the real browser coach/client workflow and compare the interface. Fix failures in small commits on a local review branch. Keep `main` and live services untouched until the owner reviews the results.
