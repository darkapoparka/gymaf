# ADR-014 — remaining web flow adaptations

Date: 6 September 2026. Status: implemented for bounded local review on `review/mobbin-fidelity` in `M:/gym-fidelity`, after `3fd9e6a88cd225cb9632efb5d13836a6c9f4ae22`. Source and evidence belong to the review-branch commit containing this decision. Three new migrations are local-only; hosted installation and account acceptance are pending. This decision extends [ADR-007](ADR-007-CONNECTED-WEB.md), [ADR-010](ADR-010-PRIVATE-MEDIA.md) and [ADR-012](ADR-012-COACH-DIRECTORY.md).

## Decision and scope

Implement truthful browser counterparts for the remaining camera, video, booking, private friends, directory introduction and workout activity families. Preserve the Future Pro visual direction while using real Gymaf accounts, authored availability, attempts, authorization and persistence contracts. A web counterpart receives `Partial family adaptation`; it is not verified 1:1 or an implemented iOS service. `DESIGN.md`, `PRODUCT.md`, `.impeccable` and legacy design metadata remain unchanged under the current AGENTS authority.

The ledger moves from 232 partial / 38 not implemented to **264 partial / 6 not implemented / zero verified 1:1**. The 32 newly mapped rows are partial family adaptations, not 32 exact source-state completions. This includes the shipping browser-owned select counterpart; custom native picker and iOS chrome remain unverified. [Current evidence](evidence/remaining-web-2026-09-06.json) records the parent ledger reconciliation. All 270 captures across 84 flows remain NOT COMPLETE / NOT VERIFIED 1:1. Six commercial captures remain Not implemented: `818823fea239b926`, `10cf3bdb6b6600bd`, `1c9c16701eb28a46`, `6699b1f8a7f819b9`, `230ba48bd84b5618`, `37e236af15c00e2a`.

## Camera and private media lifecycle

`CameraCapture` requests `getUserMedia` only when opened. It supports camera switching, capability-dependent torch, timer off/5/10 seconds, cancellation, denied/disconnected recovery and a library fallback. It captures a JPEG still, then uses the existing private-photo draft/upload flow. Timer cleanup, generation guards and stream-track shutdown protect close/unmount; hiding the document closes the still camera. Hardware support and successful physical-device capture are not established by mocked streams.

`VideoRecorder` uses `MediaRecorder` with a supported WebM/MP4 type, a 30-second recorder limit, bounded byte accumulation and audio off by default. Users explicitly enable sound. Recording stops on document hiding and supports preview, Retake, Next and discard confirmation. Streams, timers and object URLs are cleaned up. These are browser controls, not source OS camera UI. The 30-second rule is enforced by the recorder; the server's generic upload endpoint enforces the 4 MiB body limit, not a trusted parsed video duration.

`conversation-media.ts` adds a separate private `gymaf-conversation-media` bucket and record lifecycle: pending reservation → uploaded/ready → explicitly shared, or removed. Upload uses a stable media UUID and content hash; the server normalizes still photos. Video validation checks the claimed type against WebM/MP4 container magic only. Video is not transcoded, deeply decoded, stripped of metadata or proven playable on every supported device. A matching Storage object after an uncertain upload acknowledgement allows a retry to complete without creating a second object.

Private uploads are not automatically sent. Explicit Send invokes `attachment.share`, which requires a ready object and an active permitted relationship; it creates the normal persisted message and notification through the existing message command. Optional exercise context must identify an exercise from the member's actual session snapshot. Coaches cannot inspect unshared uploads. Shared reads remain relationship-authorized; gallery DTOs omit object names, hashes and owner IDs and expose an owned flag for removal. Reads are authenticated with private/no-store response headers. Gallery lists are bounded to 500 entries; a user may retain at most 300 nonremoved media records.

The gallery supports inspecting and deleting owned uploads, including private uploads. Removal first deletes the Storage object, then marks its record removed; repeated removal can recover an uncertain acknowledgement. Sending and removing use existing actor-scoped command identity and validation. Removing media does not retract the existing text message or prove erasure from prior recipient downloads, backups or audit history. Automatic abandoned-upload cleanup, account-wide object erasure, retention operations and production abuse controls remain open.

Attachment drafts retain the same file, ID and upload acknowledgement in auth-scoped document memory across supported navigation; auth changes clear them. They are neither durable offline recovery nor proof of upload. No personal files or real coach sends were used for this batch's browser evidence.

## Authored appointments

`20260906140000_coach_appointments.sql` adds coach slots and member appointments. Workspace owners publish exact future starts/ends with cancellation notice, inspect bookings, withdraw unbooked availability and cancel appointments. Slots are at most four hours, begin within one year and carry 0–10080 cancellation-notice minutes. Member availability requires an active workspace and either an opted-in published directory profile or an existing active/paused relationship. The member sees available slots and only their own appointments; owner views remain workspace-authorized.

Commands are `booking.slot-create`, `booking.reserve`, `booking.withdraw` and `booking.cancel`. Server checks, actor/workspace locks, command hashes and a unique active slot reservation prevent supported duplicate/conflicting bookings. Overlapping active slots and overlapping member appointments are rejected. A member cancellation is permitted only before the saved deadline; an owner can cancel the workspace appointment. Booked slots cannot be withdrawn before cancellation. Stored values are UTC instants; member display uses the account timezone. Selected date and saved confirmation display full calendar dates, including month/year, following the review fix.

Booking reserves a real appointment record. It does not create a coaching relationship, grant membership, charge money, match a coach, generate a meeting URL or deliver an external calendar/email invitation. Provider reminders, calendar integration, hosted concurrency and full lifecycle acceptance remain open.

## Private friends and invitation recovery

`20260906143000_private_friend_connections.sql` adds explicit accepted peer connections and private invitations. A generated invitation has a 256-bit random secret, a seven-day lifetime and one successful acceptance. SQL stores its SHA-256 hash, not the raw secret. The share URL places the secret in `/friend-invite#invite=...`; invitation lookup posts it in the body instead of a URL query. The local QR encodes that private URL. The invitation page explains the sharing contract before acceptance and preserves the invitation tab while sign-in occurs separately.

Only accepted peers and self appear in the weekly leaderboard. It shares display names and completed-workout counts for the viewer's current calendar week/timezone; IDs support connection management. Photos, weight, messages and workout details are excluded. Either participant can remove the connection. No public leaderboard, address-book lookup, referral reward, free trial or commercial credit is created.

Commands include `social.invite`, `social.accept`, `social.revoke`, `social.revoke-id` and `social.remove`. The active session, invitation owner and command hash are checked; expiration, self-acceptance, reuse and other-owner revocation are rejected. At most ten unaccepted/unexpired invitations can remain active. The owner query returns active invitation IDs and expiration dates without raw secrets. The Active Invitations list survives reload and allows owner-only ID revocation even after the original share link leaves document memory. Revoking an invitation does not remove an already accepted connection; use Remove Friend for that. Expired invitation retention/account erasure and broader abuse handling still require acceptance.

## Directory and workout web counterparts

`/app/onboarding/coach` introduces the real opted-in directory; `/app/onboarding/matching` displays the actual pending directory request in a full view before discovery; no artificial delay, fake match, matching algorithm or promised recommendation is introduced. Existing search/results/profile routes gain appropriate authored details and booking links. Coach identity remains authored metadata and initials until approved portraits/content exist. No reference person is imported.

`/app/system/live-activity`, `/app/system/dynamic-island` and `/app/system/widgets` render browser activity or saved workout-summary counterparts; `/app/system/launch` provides the Gymaf continuation screen. Activity reads the actual attempt, updates while the browser is open and uses existing revisioned pause/resume commands. Summary distinguishes active minutes from planned exercise count. These pages do not install lock-screen widgets, iOS Live Activities/Dynamic Island, background execution, native launch screens or Apple Health integration.

## Verification and release limits

Evidence is bounded and parent-reported unless the artifact is directly identified below. `.artifacts/remaining-review/` contains the captures, request assertions and logs.

- Local checks: 48 unit tests PASS; lint zero errors/two existing coach warnings; final production build/TypeScript PASS after review fixes. Final four HTTP suites and 48 units PASS.
- Four isolated HTTP tests PASS, including lost upload acknowledgement and delete retry. Mocked provider authorization is not hosted provider acceptance.
- Disposable PostgreSQL 17 passed seventeen migrations and twelve SQL suites with simulated provider JWT/Storage context before the final social-function adjustment. `friends-final.log` passed the final invitation-ID recovery change. The full final chain rerun remains subject to the parent checkpoint.
- Mocked browser assertions: 12 camera/booking/discovery/friends, 11 media/activity, 3 gallery and 8 review-fix assertions PASS. Final booking dates fit 320/393/1440; recovered invitations can be revoked after reload. These do not prove hosted persistence or physical camera/microphone/codec behavior.
- Final bounded reviewer disposition: SHIP after two P2 fixes, full booking dates and recoverable invitation management. Detector `[]` and reviewer SHIP are not per-capture source acceptance.

The three source migrations `20260906140000_coach_appointments.sql`, `20260906143000_private_friend_connections.sql` and `20260906150000_conversation_media.sql` are NOT INSTALLED HOSTED. The prior fourteen hosted development migrations do not supply these contracts. No current-batch push/CI, hosted migration, provider-account mutation, native acceptance, merge to main or deployment is claimed. Commercial membership/payment/credits, approved assets, native integrations, privacy/lifecycle/provider checks and individual paired source-state acceptance remain gates.
