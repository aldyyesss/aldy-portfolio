# Verification record

Verified locally on October 23, 2026.

## Passed

- `npm run build` from the monorepo root compiles the Express backend and creates the Next.js production build.
- `npm test` passes backend API checks, Supabase REST contract checks, and frontend TypeScript checks.
- `npm ci --ignore-scripts --offline --dry-run --no-audit --no-fund` validates the root workspace lockfile, including cross-platform optional binaries for Next.js and Sharp.
- Generated HTML has English document language, English navigation, and the intended routes for home, about, experience, CV, contact, and admin.
- Backend tests verify denied anonymous and unauthorized access, dashboard loading, create/update/delete flows, missing records, duplicate slugs, invalid months and URLs, and safe provider errors.
- Supabase adapter tests verify secret key headers, user token validation, confirmed-email authorization, snake-case database mapping, storage uploads, and protection of images used by an experience.
- The intended publication source and browser bundles were scanned against supplied credential values. No values were found. Credentials were not printed.

## Blocked

`npm run setup:supabase` stopped at its initial API connectivity check. The environment cannot resolve the Supabase project host. No live schema migration, storage provisioning, seed, CV upload, or Auth-account creation was performed. `npm run verify:supabase` remains required after successful setup.

GitHub access failed because the environment cannot resolve `github.com`. GitHub CLI also reports invalid stored credentials. Root `git init -b main` was denied by the filesystem policy. No local Git commit or remote push was completed. The intended remote remains `https://github.com/aldyyesss/aldy-portfolio.git`.

Browser preview was not performed. The workspace previously rejected local listening ports with EPERM. Production build checks do not replace a visual browser review.

No Vercel deployment was performed, as requested by the owner.
