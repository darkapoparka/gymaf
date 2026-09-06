# ADR-013: Private shipping address preference

Date: 6 September 2026. Status: implemented locally after `4de2d3c3d167c6cdb1320e4be57890d838a93657` on `review/mobbin-fidelity` in `M:/gym-fidelity`. Migration installed on approved hosted development. Bounded finish review SHIP, including closure of P3 local-validation feedback. Shipping source commit/push/CI pending; overall parity remains NOT COMPLETE / NOT VERIFIED 1:1.

## Decision

Add `/app/account/shipping` from Your Account, adapting the source light sheet, state/ZIP pair, XS–XXL shirt selector and Update control. Country supports non-US addresses with optional region/postal fields. The saved address and shirt size are private preferences. Saving creates no order or shipment, sends nothing to a coach and invokes no fulfillment service.

The pinned Future Pro direction and existing Gymaf backend remain authoritative. These are ordinary extensions; `DESIGN.md`, `PRODUCT.md` and `.impeccable` remain outside scope. Reference private addresses and personal data are not imported. Native keyboard/picker and original background acceptance remain open.

## Ownership, validation and removal

The existing `member_records` boundary gains kind `shipping`, with an owner singleton index. Fields are `street`, `apartment`, `city`, `region`, `postalCode`, `country` and `shirtSize`. Existing authenticated owner-only RLS, queries, account export, `member.save` and `member.delete` retain their authorization, revisions and idempotency. The command accepts the validated shape, not a caller-supplied owner override.

Street/city/country and shirt size are required for saving; apartment is optional. US aliases require a recognized state/DC code and five-digit or ZIP+4 postal code. Other countries allow optional region/postal fields within bounded text lengths. This is input validation, not postal verification or proof of deliverability. Country accepts 2–80 trimmed characters. Local validation presents `InputError.message` in a focused alert; incomplete trimmed input does not become a network-error instruction.

Explicit Remove confirmation deletes the saved preference through the existing revisioned member command. This does not establish comprehensive account erasure, backup/audit retention or cancellation of any external order; there is no fulfillment contract in this increment.

## Drafts and retry behavior

Auth-scoped document-memory drafts retain fields, baseline, revision and separate save/delete retry IDs across same-document history. Auth changes clear memory. Dirty Close, reload replacement and Remove require explicit choices; beforeunload warns on dirty document exit. Abort/unmount guards and focused actionable errors preserve recovery. Unchanged retries retain their original command IDs; a mocked acknowledgement returning to Your Account is not hosted persistence proof. Drafts are neither durable offline storage nor server acknowledgement.

## Evidence and limits

- **Hosted schema, parent-reported:** source `20260906042113_private_shipping_address.sql` installed as `20260906043258` on approved development project `crhcgcqanoeoddmwaqhb`; fourteen migrations total. Read-only SQL found zero shipping records. No hosted browser mutation, persistence, conflict, remove or export was tested.
- **Local verification, parent-reported:** build/TypeScript, 44 unit tests, lint zero errors/two existing coach warnings and three mocked HTTP tests PASS; HTTP coverage includes valid/invalid shipping and delete. Fresh PostgreSQL 17.4 `gymaf_shipping_final` passed fourteen migrations, seed and nine SQL suites, using simulated provider JWT context and Storage metadata. Post-fix build/unit/HTTP reruns also passed; logs are `.artifacts/shipping-review/{build-final,unit-final,lint,http-final,full-db,db}.log`.
- **Mocked browser, parent-reported:** save UUID `657f375d-e44d-49d1-b4ff-a6cdb34b0290` and delete UUID `4aaa5353-dffc-4bd0-8d7f-0470a8ea10ce` each retried twice with revision 1. Back/Forward retained `Synthetic preserved draft`; dirty-close Escape restored Close focus; reload/discard and mocked acknowledgement back to Your Account passed. Country-aware validation was checked. `save-delete-retries.json` and `layout-checks.txt` are in `.artifacts/shipping-review/`; checked 320/393/1440 states had no overflow or controls below 44px.
- **Final bounded SHIP:** P3 misleading network advice on local validation is closed. `local-validation-393-fixed.png` shows the focused Country length error. Reviewer source comparison reports card bottom within 2px and Update within 4px at 393px. These bounded geometry checks and detector `[]` are not full source-state acceptance.

Only initial form `35d81d4c979a3195`, filled/no-size `c69fee952cd49b41` and filled/size `693755a9410f5831` move individually to partial. Native picker `716fd33fa6bc37d2` remains Not implemented. Totals: **232 partial / 38 not implemented / zero verified 1:1**, across 270 captures/84 flows. Original background, OS keyboard/picker, hosted browser save/conflict/remove/export, fulfillment and native acceptance remain open.

Prior directory HEAD `4de2d3c3d167c6cdb1320e4be57890d838a93657` was pushed and passed [CI 34011418342](https://github.com/darkapoparka/gymaf/actions/runs/34011418342). PR #3's Vercel Preview check passed deployment completion; that is not hosted UI acceptance. These checks do not cover shipping source. Draft PR [#3](https://github.com/darkapoparka/gymaf/pull/3) targets `astra`; no main merge or production promotion.
