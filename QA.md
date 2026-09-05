# Gymaf — current branch verification

The `astra` implementation branch has new CI evidence in [astra/evidence/astra-ci-2026-09-05.json](astra/evidence/astra-ci-2026-09-05.json), separate from the historical prototype audit.

At source commit `5ef5cfd3a68f8f995d3ac44d3d9addb0e31ab405`, GitHub Actions run `33985694273` passed clean install, 12 pure validation tests, ESLint (with internal-navigation warnings), TypeScript, production build and a real PostgreSQL migration/authorization/history regression suite. The database suite uses a simulated Supabase Auth schema/JWT context, not a live provider integration.

The first CI run failed on refresh promise typing and an impure render-time timestamp. The follow-up source commit corrected both and the checks passed. No error was hidden by disabling the relevant test or lint rule.

Full local Supabase integration, browser flows, pixel/layout comparison, MFA/email/cookie acceptance, physical phones, load/security testing and deployment verification have not been completed here. Follow [LOCAL_TESTING](astra/LOCAL_TESTING.md). Passing this suite does not approve real client data or public release.

Historical records in `docs/QA.md`, `docs/legacy/` and the original source audit remain bounded to their stated baseline. The current implementation and remaining gates are listed in [IMPLEMENTATION_STATUS](astra/IMPLEMENTATION_STATUS.md).
