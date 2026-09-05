# Design preservation and Gymaf content production

Target contract • 5 September 2026. The owner's instruction is to keep the current layout/styling, not commission a redesign. No images, videos or fonts are generated or licensed by this documentation.

## Preserve the product's visual language

Use the current components and CSS as the starting point. Retain the lavender canvas, restrained green accents, light rounded cards, pill controls, serif display hierarchy, readable sans-serif controls, mobile navigation and existing desktop adaptation. Baseline tokens in `src/app/globals.css`: canvas `#f1f0f6`, surface `#ffffffbb`, ink `#202020`, muted `#77767e`, line `#d8d7df`, accent `#82d444`, root radius `26px`, navigation height `68px`.

Preserve layout geometry and interaction intent, not every copied word, asset, historical measurement or inaccessible styling choice. Fix keyboard use, focus visibility, contrast, text reflow and error states with the smallest appropriate visual change. Add coach/operator screens using the same design language; do not introduce a generic unrelated admin template. See [TEST_STRATEGY](TEST_STRATEGY.md) for approval/evidence.

## Explicit production changes

| Existing source area | Required production adaptation |
|---|---|
| `src/components/future-app.tsx`, `future-mark.tsx`, `src/app/layout.tsx` | Replace Future name/emblem/metadata and old clone-contract comments with approved Gymaf identity |
| `src/lib/data.ts`, reference-media/crops, coach-alternatives and conversation-history | Replace fixture people, copied photographs, source conversations and sample outcomes with real approved content or honest empty states |
| `src/app/[[...route]]/page.tsx`, capture components, `/review`, `/preview` | Isolate historical preview tooling and remove production fixture imports/query modes |
| `public/fonts`, root local-font setup | Establish font rights and Cyrillic support; replace with licensed choices if necessary while preserving type roles and measured line breaks |
| Account/onboarding/progress/schedule screens | Real dates, correct units/currency, truthful service/permission wording, no fabricated health integrations or reference achievements |
| Historical design metadata and generation scripts | Keep as clearly superseded provenance only where permitted; not active instructions to reproduce a competitor |

Changing a brand name and some images does not by itself establish IP clearance or guarantee app-store acceptance. Review the overall commercial identity and similarity as well as individual assets (R10, R18 in [RESEARCH](RESEARCH.md)). Do not destroy Git history or change repository visibility without owner authorization. Reference material that cannot be distributed must be excluded from release artifacts; a route password does not protect files shipped under `public/`.

## Asset categories

**Real identity/evidence:** Alexander's portrait, biography, credentials, client testimonials, client results and coaching demonstrations. Obtain permission and use verifiable content. Do not generate an invented photograph and present it as Alexander or as a real customer transformation. A licensed authentic portrait may be retouched only within the permission given; identity consent is separate from a software partnership assumption.

**Generated decorative content:** abstract brand imagery, generic adult fitness lifestyle scenes, program-cover art, neutral equipment still lifes, and non-instructional backgrounds. These can be generated to fit existing slots. Record source/prompt/version and review for unwanted logos, artifacts, stereotyped or misleading bodies, and implied guarantees. Generated artwork is not clinical evidence or proof of a coach's credentials.

**Instructional material:** exercise demonstrations, technique cues and safety-related explanations. Prefer original coach-recorded footage for the initial exercise catalog. Every entry needs coach approval, correct movement naming, usable framing, captions/text guidance and media rights. Generated exercise images are not automatically suitable to teach technique; any use requires explicit expert review.

**Typography/icons:** font files need an appropriate license for the intended web/native uses and Bulgarian Cyrillic glyphs. Image generation does not solve font licensing. Preserve type roles and spacing when substituting fonts. Existing Lucide use can remain subject to the package license; do not redraw an entire icon system by default.

## Planned production slots

The machine-readable [asset-manifest.json](asset-manifest.json) defines the initial slots. Dimensions are recommended master exports, not hardcoded component dimensions; retain existing aspect ratios/focal cropping and serve responsive variants. All records start unproduced/unapproved.

| Slot | Suggested master | Content owner/reviewer |
|---|---|---|
| Gymaf wordmark/app symbol | Vector master; square icon export | Product owner; brand/rights review |
| Web launch hero | 2400×1600 with safe mobile crop | Product owner; decorative generated or licensed photography |
| Founding coach portrait | 1600×2000 plus square crop | Alexander/rights holder approval required |
| Three initial program covers | 1600×1200 each | Coach approves program naming; owner approves artwork |
| Gentle empty-state illustration | 1200×1200 | Product owner; no fabricated statistics |
| Exercise demonstrations | Device-tested video plus poster | Qualified coach, participant and rights holder |
| Share/OG image | 1200×630 | Brand-approved, no private client metrics by default |

## Image-generation briefs

These are instructions for a later asset task, not generated outputs or an instruction to render whole application screens.

**Hero:** editorial photograph-like scene of a generic adult preparing for a strength session in a calm, uncluttered training space; soft natural light; neutral clothing without logos; restrained lavender/green visual accents; subject toward the right with negative space on the left; no text baked into the image; no recognizable coach identity, before-and-after claim or extreme body transformation. Ensure a center crop still works on mobile.

**Program covers:** consistent composition and lighting across strength-foundations, home-training and mobility artwork; equipment or broad lifestyle context, not a technical movement tutorial; safe negative space for separately rendered HTML text; no third-party marks. Program names and claims are placeholders until the coach approves actual programs.

**Empty state:** understated abstract shapes suggesting a training notebook and gradual progress, compatible with the existing lavender canvas and rounded surfaces; no numbers, badges, streaks or outcome claims. Keep the empty-state message as accessible UI text.

**Wordmark/symbol exploration:** distinct Gymaf identity, simple geometry legible at small icon sizes, visually compatible with the existing restrained interface; do not imitate the Future emblem. Generated concepts require vector cleanup, legibility testing and trademark/rights review before production use.

## Asset acceptance workflow

Create brief → generate/commission/acquire → record provenance/license/consent → visual/brand review → coach review if instructional → export optimized formats and focal crops → provide alt text or mark decorative → implement in the existing slot → test responsive/Cyrillic layouts → approve manifest status. No asset becomes approved merely because a file exists.

Manifest fields should include ID, purpose, target path, creation source, rights status, consent requirements, instructional reviewer, dimensions/crop, alt-text key, approval date and approver. Approval must be an actual owner action, never an agent inventing a name/date. Never commit private client source images to this public repository. Public marketing files and private user uploads use entirely separate storage paths/policies.

Use suitable responsive formats and measured compression. Do not encode typography or controls into screenshots. Preserve semantic headings/buttons and real keyboard interactions. Screen reader descriptions describe the image's purpose, not SEO keyword lists. A purely decorative crop should not duplicate adjacent text.

## Content and localization acceptance

External-facing copy identifies the actual coach, offer, legal seller and support route. No invented prices, marketing commitments, qualifications or guarantees. Keep coaching, group sessions and self-guided programs distinct. Prepare Bulgarian-first message keys with English-ready structure, named interpolation and plural/date/number formatting rather than concatenated strings. Review Cyrillic font rendering and text expansion at 320px and 393px. Use system timezone/unit preferences from structured account data; never bake reference dates into images.

Before release, search rendered pages, source bundles, metadata, emails and static assets for Future identity, fixture names, copied support emails, US$ reference prices, old capture modes and unapproved image paths. This is a review aid, not an automatic legal clearance or permission to delete historical audit records blindly.
