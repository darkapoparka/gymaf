# ADR-012: Explicitly opted-in coach directory

Date: 6 September 2026. Status: implemented locally after `4651f0b6e787656bc10c1133734ba3963e497088` on `review/mobbin-fidelity` in `M:/gym-fidelity`. Migration installed on the approved hosted development project. Final bounded review SHIP; directory source commit/push/CI pending. Overall Future Pro parity remains NOT COMPLETE / NOT VERIFIED 1:1.

## Decision

Add `/app/coaches`, `/app/coaches/search`, `/app/coaches/results`, `/app/coaches/profile/[slug]`, `/app/coaches/change` and `/app/coaches/reasons` while retaining Gymaf identity, invitations and current coaching relationships. Profile offers Change/Explore links; members without a coach can Browse. The existing pinned Future Pro direction governs this ordinary extension. `DESIGN.md`, `PRODUCT.md` and `.impeccable` are outside the write boundary; acknowledged legacy drift is not repaired.

Explore browses actual listed profiles; it does not recommend or match coaches. Search supplies collapsed/expanded expertise, Default order/A–Z expertise choices, and expertise/style/sport/language filters. Within each category, selected values match with OR; selected categories and text search combine with AND. Text search matches name, biography or experience. Counts describe the loaded eligible profiles, capped at 500 with `hasMore` disclosure; no full-directory pagination or ranking is delivered.

Profiles render the coach's authored name, biography and directory metadata, with initials and honest missing-photo copy. These are unverified self-authored qualifications, not approved portraits or verified credentials. Connect opens an explanation of private invitations and a support link. It sends no message, books no call, takes no payment, creates no match and replaces no coach. Change reasons are private in-memory browsing notes; they are not submitted or used as a matching contract.

## Publication, ownership and export

`coach_directory_profiles` stores one validated metadata record per workspace, with revision/update timestamp. Metadata contains an explicit `listed` opt-in; finite expertise/style/sport/language lists; and bounded experience, qualifications, loves and location text. Existing workspace public name and biography supply the profile identity. A listing is public only when the workspace is active, published and explicitly opted in. Saving an owner's draft metadata does not bypass those visibility conditions.

`/coach/profile` includes `DirectoryEditor`. The `directory.save` command requires an active actor and workspace-owner authorization with the existing owner MFA boundary. Direct table access is read-only and owner-scoped by RLS; writes validate exact fields through the command. Actor-scoped serialization, workspace locking, revisions and idempotency retain the established command/audit behavior. Same UUID/payload retry returns the acknowledgement; stale revision or changed reuse produces `GY409`. Authenticated account export includes only the owner's directory metadata through RLS.

`gymaf_directory_query(null)` returns the limited public directory to anonymous or authenticated callers. An owner-scoped workspace query requires an active authenticated owner. Public responses include only opted-in active published workspace records and their authored metadata; private account information is not imported into directory cards.

## Draft and failure behavior

Filters, expansion, sort and browsing reasons live in account-scoped document memory. Back from a profile retains filters. Owner editor drafts are account/workspace scoped and preserve baseline, revision and failed command ID; changing fields resets the ID. Authentication changes clear these maps. Drafts are not durable offline storage or server acknowledgement.

The editor warns on document exit while dirty, focuses recoverable errors, retries the unchanged command and confirms replacement before reloading saved data. Acknowledgement advances the baseline and clears dirty state. Connect-dialog Escape restores trigger focus. Unlisted/missing profiles, no matches and load failures have explicit recovery states. These behaviors have bounded mocked browser evidence; hosted mutation/conflict/privacy journeys remain unverified.

## Installation and verification

- **Hosted schema/read PASS, parent-reported:** source `20260906035415_coach_directory.sql` installed as `20260906041513` on approved development project `crhcgcqanoeoddmwaqhb`; thirteen hosted migrations total. The actual unauthenticated development endpoint `/api/v1/public/directory` returned 200, `private, no-store`, and `{coaches:[],hasMore:false}`. No profiles have opted in. This is live hosted-backed read evidence, not a hosted editor/publication browser journey.
- **Local database PASS, parent-reported:** fresh PostgreSQL 17.4 `gymaf_directory_final` passed all thirteen migrations, seed and eight SQL suites. Provider JWT context and Storage metadata are simulated. Logs: `.artifacts/discovery-review/full-db.log` and `directory-db-final.log`.
- **Local source PASS, parent-reported:** build/TypeScript, 42 unit tests, lint zero errors/two existing coach warnings and three mocked HTTP tests. Directory coverage extends the private-account HTTP suite with public/authenticated route, origin, validation and RPC mapping checks. Logs in `.artifacts/discovery-review/`: `build-final.log`, `unit-final.log`, `lint.log`, `http-final.log` (final build/HTTP/unit logs include review fixes).
- **Mocked browser PASS, parent-reported:** six directory routes at 320/393/1440 had no overflow or checked controls below 44px. Filter/profile/Back restoration, Connect Escape/focus return, nonmatching/unlisted empties and retry from load failure passed. Editor failed-save/retry used UUID `9406d16d-8fbe-418e-b684-7793db633f68` and revision 1 twice; mocked acknowledgement cleared dirty state; focused errors and confirmed reload/discard passed. Request evidence: `editor-retry-requests.json`; responsive checks: `layout-checks.txt`.
- **Bounded finish review SHIP:** initial contrast and caption-overlap findings resolved. Final contrast: filter labels 5.07:1, See More 5.29:1, change copy 5.00:1. Caption overlap resolved at 320/393/1440. A–Z shows Adaptive Exercise first with visible focus. Detector `[]` is not parity acceptance. Final screenshots are listed in [FRONTEND_PARITY.md](FRONTEND_PARITY.md).

Only seven individual capture rows gain partial coverage: explore, profile top, collapsed filters, expanded expertise, results, change introduction and reasons. Totals are **229 partial / 41 not implemented / zero verified 1:1**, across 270 captures/84 flows. No source recommendation, availability/booking, original portrait, native/private-public flow or separate A–Z capture is accepted by working control coverage.

Prior exact HEAD `4651f0b6e787656bc10c1133734ba3963e497088` passed [CI 34010073109](https://github.com/darkapoparka/gymaf/actions/runs/34010073109); this does not cover the uncommitted directory source. Draft PR [#3](https://github.com/darkapoparka/gymaf/pull/3) targets `astra`. No main merge or production promotion.
