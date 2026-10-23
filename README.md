# Aldy Radya Herlambang Portfolio

An English portfolio with a Next.js frontend, an Express backend, and Supabase PostgreSQL, Storage, and Auth. Both apps are in one npm workspace monorepo. Vercel deployment is left to the project owner.

## Structure

```text
fe/                      Next.js frontend, public pages, admin dashboard
be/                      Express API, Supabase adapters, setup scripts, tests
supabase/migrations/     Database and storage bootstrap migration
scripts/                 Workspace development runner
package.json             npm workspaces and shared commands
package-lock.json        One lockfile for both applications
.env.example             Root backend environment template
```

`legacy-dien` and `image-originals` are ignored local archives. They are not part of the application or intended repository contents. The original private configuration remains in the ignored archive. Do not publish it.

## Requirements

Use Node.js 22 or newer and npm. Supabase setup also requires `psql` for the SQL migration. Dependencies are locked at the workspace root.

```bash
npm ci
```

## Environment

The supplied root `.env` is read by backend development and setup scripts. Existing values are preserved. Copy `.env.example` only if the root `.env` does not already exist.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_PROJECT_URL` | Supabase project HTTPS URL |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret key |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy alternative when no secret key is supplied |
| `SUPABASE_ANON_KEY` | Public API key used by backend Auth requests |
| `SUPABASE_PUBLISHABLE_KEY` | Alternative to the legacy anon key |
| `SUPABASE_PASSWORD` | Database password used only by setup and verification scripts |
| `SUPABASE_DB_URL` | Optional pooler connection URL instead of the derived direct database host |
| `SUPABASE_STORAGE_BUCKET` | Defaults to `aldy-portfolio`. Initial setup provisions this name |
| `ALDY_ADMIN_EMAIL` | The only email allowed into the dashboard. Defaults to `Aldyradya2@gmail.com` |
| `ALDY_ADMIN_INITIAL_PASSWORD` | Optional initial Supabase Auth password, at least 12 characters |
| `FRONTEND_URL` | Frontend origin for CORS, defaults to `http://localhost:3000` |
| `PORT` | Backend port, defaults to `3300` |

The frontend uses `ALDY_API_URL`, normally set in `fe/.env.local`, to forward `/api/aldy/*` to the backend. Its local default is `http://127.0.0.1:3300`. This variable is read during the Next.js build.

Never put secret keys, the database password, or admin credentials in variables starting with `NEXT_PUBLIC_`. Do not use the database password as your admin sign-in password.

## Set up Supabase

The scripts use Supabase REST APIs directly with native Node.js fetch. No browser receives the secret key. Read the [Supabase API key guidance](https://supabase.com/docs/guides/api/api-keys), [Auth guidance](https://supabase.com/docs/guides/auth/passwords), and [Storage guidance](https://supabase.com/docs/guides/storage/uploads/standard-uploads) for service configuration.

```bash
npm run setup:supabase
npm run verify:supabase
```

Setup checks API connectivity before making changes, then performs these operations.

1. Apply the checked-in SQL migration to create `public.portfolio_experiences`, enable RLS, and grant access only to `service_role`.
2. Create the public `aldy-portfolio` Storage bucket for optimized WebP images and PDF documents. No public write policies are added.
3. Seed the eight English CV entries without overwriting existing records. No MongoDB or R2 data is changed.
4. Upload the original CV to `cv/aldy-cv.pdf`.
5. Create a confirmed Supabase Auth account for `ALDY_ADMIN_EMAIL` if it does not exist. Existing users and their passwords are preserved.

If no initial admin password is supplied, setup generates a strong password and saves it to `ALDY_ADMIN_INITIAL_PASSWORD` in the ignored root `.env`. It is never printed. Use that email and password at `/admin`. For an existing account, use its existing Supabase Auth password.

If the direct database connection is unavailable, set `SUPABASE_DB_URL` to the session pooler connection string from Supabase. The scripts keep database credentials out of command arguments and console output.

The SQL file can also be run in the Supabase SQL Editor, followed by `npm run seed`. In that manual path, create the authorized email account in Supabase Auth yourself. The setup SQL is idempotent. Seed uses conflict-ignore behavior and preserves dashboard edits. It does not copy any old MongoDB records automatically.

Verification checks the API, RLS and grants, database writes in a rolled-back transaction, temporary image upload/read/delete, and the public CV. It removes the temporary image after testing. Network access is required.

## Local development

```bash
npm run dev
```

This starts both workspaces. Open `http://localhost:3000` for the frontend. The backend listens on port 3300.

```bash
npm run dev:web
npm run dev:api
```

These commands can also be run in separate terminals.

## Pages

| Route | Content |
| --- | --- |
| `/` | Introduction and contribution areas |
| `/about` | Profile, education, and skills |
| `/experiences` | Categorized experience list |
| `/experiences/[slug]` | Experience detail |
| `/cv` | English summary, Supabase CV download, and local PDF fallback |
| `/contact` | Email, WhatsApp, and location |
| `/admin` | Supabase Auth sign-in and admin dashboard |

Old `/tentang`, `/pengalaman`, `/pengalaman/[slug]`, and `/kontak` paths redirect to their English equivalents. Proper names of institutions and programs are preserved. The downloadable original CV remains in Indonesian.

## Admin dashboard

The overview displays experience, category, and image totals, recently updated experiences, and service information. The experience view supports search, create, edit, delete confirmation, and image selection. Existing URL slugs remain fixed during edits. The image library supports upload, preview, reuse, and delete confirmation.

Uploads accept JPG, PNG, or WebP up to 4 MB and are converted to WebP. An image referenced by an experience cannot be deleted. Deleting an experience preserves its image so other entries can reuse it. The image library lists up to 1,000 objects.

Supabase Auth verifies credentials. Every protected backend request validates the user with Supabase and checks the confirmed email against the server-side admin email. User-editable metadata never grants admin access. No public sign-up UI is provided. The access token is stored for the current tab in sessionStorage. Expired sessions require sign-in again. Sign-out clears the local session and requests Supabase sign-out. Supabase access tokens already issued can remain valid until expiry.

The backend is the only data access layer. Table access is revoked for `anon` and `authenticated`. Public visitors read experiences through Express. The public Storage bucket serves portfolio images and the CV, while uploads and deletes go through the protected backend.

## Verification

```bash
npm run build
npm test
npm run verify:supabase
```

The first two commands work without a live Supabase connection. Automated backend checks cover admin access, dashboard responses, create/update/delete flows, validation, safe error responses, REST field mapping, and server-only key handling. `verify:supabase` separately exercises the live project.

## Vercel deployment by the owner

Create two Vercel projects from the same repository.

| Project | Root Directory | Framework |
| --- | --- | --- |
| Frontend | `fe` | Next.js |
| Backend | `be` | Other, using `be/vercel.json` |

Use the root workspace lockfile for installation. Keep Vercel’s option to include source files outside the project root enabled for monorepo dependency resolution. Use Node.js 22 or later.

Set the backend Supabase variables and `ALDY_ADMIN_EMAIL` in the backend project environment. The runtime does not require `SUPABASE_PASSWORD` or the initial admin password after setup. Set `FRONTEND_URL` to your frontend origin. Set frontend `ALDY_API_URL` to the backend Vercel HTTPS URL and redeploy after changing it. No deployment is run by the assistant.

## GitHub handoff

The intended remote is `https://github.com/aldyyesss/aldy-portfolio.git`. This workspace is prepared as an npm monorepo, but the working environment could not resolve GitHub, reported invalid stored GitHub CLI credentials, and denied creation of root `.git` metadata. No commit or push was completed.

On a machine with repository write access, initialize or clone the repository and publish the source after checking ignored files. Preserve any existing remote commits. Do not force-push or include `.env`, archives, dependencies, or build output.

## Verification limits in this environment

Live Supabase setup stopped at the connectivity check because the project host could not be resolved. No remote database schema, seed, storage bucket, or Auth account was created here. Local preview was previously blocked by port restrictions. Build and automated checks are recorded in `docs/verification.md`.
