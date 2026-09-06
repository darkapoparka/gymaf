# ADR-010: Private member still photos

Date: 6 September 2026. Status: implemented locally; both migrations installed on the approved hosted development project. Bounded implementation review SHIP; full frontend parity and production acceptance remain open. Review branch `review/mobbin-fidelity`, `M:/gym-fidelity`, starting HEAD `869e4d8`; media source is committed as `ea25393`, not yet pushed, and media CI is pending.

## Decision

Preserve the owner-pinned Future Pro frontend direction and Gymaf authentication/backend. Add private dated progress photos (`front`, `back`, `side`), avatar and cover galleries, preview/view/delete, and explicit saved profile-image selection. Routes are `/app/progress/photos`, `/app/profile/avatar` and `/app/profile/cover`; progress entry is a dialog on its gallery route. Take Photo/Photo Library/Cancel use web file inputs; this does not implement or accept native camera/permission screens. Do not import reference personal photos or imply coach sharing.

## Storage and authorization

`member_media` tracks owner, kind/view, date, immutable object name, normalized content hash and `pending`/`ready`/`removed` state. An active Gymaf actor is required for reads and commands; owner-only RLS and Storage policies govern the private `gymaf-member-media` bucket. No coach access or public sharing is added. Actor ownership cannot be supplied in command payloads. Writes use validated `media.reserve`, `media.complete`, `media.remove` and `media.select` commands, actor-scoped idempotency and serialized owner mutations. Ready-photo limit is 300; recent pending reservations are limited to 30 per day.

The application accepts nonempty binary JPEG/PNG/WebP up to 4 MB. Server decoding rejects invalid/animated inputs, limits decoded pixels, auto-orients and re-encodes still JPEG within 1600×1600 without enlargement; EXIF/camera/location metadata is stripped. Storage paths are `<owner>/<photo-id>.jpg`; no update/upsert policy is supplied. The authenticated image proxy returns private/no-store JPEG with nosniff and no-referrer headers. This is an owner-privacy boundary, not a full security or retention certification.

## Acknowledgement, selection and recovery

Reserve uses the normalized SHA-256 content hash. Retries retain each photo ID and verify existing immutable bytes before completing after a lost upload acknowledgement. A changed payload cannot silently reuse an accepted command. Front/back/side save acknowledgements are tracked individually; successfully saved files remain saved if another upload fails. Composed request timeout and abort handling preserve retry controls. Error/retry states remain accessible.

`selected_at` chooses one ready avatar and one ready cover independently of upload order, committed only with the explicit checkmark. Uploading does not change the current image. Selection migration adopts the latest existing ready image per profile kind once; subsequent behavior uses explicit selection. Deleting a selected image clears selection and returns to the empty fallback without automatically selecting another photo.

`media-drafts.ts` holds selected File objects in account/kind-keyed document memory for same-document Back/Forward. Auth changes/sign-out clear it. Discard removes unsaved selections; acknowledged uploads stay in the private gallery. It is neither durable offline storage nor server acknowledgement, and does not promise recovery after reload or document closure.

## Deletion and cleanup limits

Deletion removes the Storage object first, then records `removed` and clears selection. Lost acknowledgements are retryable; the operation is not an atomic cross-service transaction. Removed metadata, command and audit records remain. Failed/abandoned pending reservations and uploaded-but-uncompleted objects have no automatic cleanup job in this batch. Automatic account-wide Storage erasure, retention periods and backup erasure are not established. The successful synthetic cleanup below proves removal of those two objects only; it is not a system-wide erasure claim.

## Installation and evidence

Hosted project `crhcgcqanoeoddmwaqhb` has source `20260906014124_private_member_media.sql` installed as `20260906015855`, and source `20260906020859_member_media_selection.sql` installed as `20260906021344`, including private bucket/policies. Parent-reported evidence:

- Final local build/TypeScript PASS; 32 unit tests PASS; lint zero errors/two existing coach warnings; two isolated HTTP tests PASS including lost upload/delete acknowledgements, conflicts and auth/origin checks.
- Fresh PostgreSQL 17.4 `gymaf_media_final`: full ten migrations, seed and core/member/training/feedback/media SQL suites PASS. Provider JWT context and Storage metadata are simulated; this proves exercised local database behavior.
- Actual authenticated browser with a synthetic 300×400 plain PNG exercised real Storage HTTP: progress upload/reload/view/delete; cover upload/checkmark/Profile/reopen Current photo/delete. SQL confirmed two synthetic removed records, zero selected and zero remaining objects. No personal files or coach sends.
- Bounded review SHIP, M1–M5 resolved; rendered 320/393/1440 checks and keyboard behavior passed within reviewed states. Avatar retry is mocked failure evidence. Capture list and six individual ledger updates are in [FRONTEND_PARITY.md](FRONTEND_PARITY.md).

All 270 captures across 84 flows remain NOT VERIFIED 1:1. Native camera, video, exercise media, attachments, billing, broader hosted privacy/error/device checks and individual paired visual acceptance remain open. Passing CI [34004476667](https://github.com/darkapoparka/gymaf/actions/runs/34004476667) covers preceding pushed HEAD `869e4d8`, not media source `ea25393`. Draft PR #3 targets `astra`; no main merge or production promotion. `PRODUCT.md`, `DESIGN.md` and `.impeccable` are unchanged.
