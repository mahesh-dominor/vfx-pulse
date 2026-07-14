---
name: deploy-verify-vercel
description: 'Deploy VFX Pulse to Vercel and verify the production deployment. Use when: deploying a new release, re-deploying after schema changes, verifying a Vercel build, running smoke tests after deploy, troubleshooting 500 errors or auth failures on production, adding or rotating environment variables on Vercel.'
---

# Deploy and Verify on Vercel

## When to Use
- Shipping a new feature branch to production
- Applying Prisma schema migrations to the live database
- Rotating secrets or environment variables and re-deploying
- Investigating a broken Vercel build or post-deploy runtime error
- Confirming production health after any infrastructure change

---

## Step 1 — Pre-deploy Checks (local)

Run these before touching Vercel to catch failures early.

```bash
# 1a. Regenerate Prisma client (required after any schema edit)
npm.cmd run prisma:generate

# 1b. TypeScript type-check
npm.cmd run type-check

# 1c. Confirm the Vercel build script succeeds locally
npm.cmd run deploy:vercel
```

> `deploy:vercel` = `prisma:generate` + `next build` — same script Vercel runs.  
> If `type-check` fails, fix errors before proceeding. Do NOT rely on `get_errors` alone — run the terminal command for final verification.

---

## Step 2 — Database Migrations (production)

> Skip if the deployment has no schema changes.

Migrations must be applied **before** the new app code receives traffic.

**Option A — Via Vercel build command** (recommended for most cases)  
The `vercel.json` build command is `npm run deploy:vercel`. To also run migrations during build, temporarily change it to:

```
npm run prisma:deploy && npm run deploy:vercel
```

Reset it after the deploy is confirmed.

**Option B — Via Vercel CLI or a one-off build step**  
```bash
# Using Vercel CLI with production env
npx.cmd vercel env pull .env.production.local
npx.cmd prisma migrate deploy
```

---

## Step 3 — Trigger the Deployment

**Standard push (auto-deploy via GitHub integration)**
```bash
git push origin main
```

**Manual re-deploy from Vercel dashboard**
1. Open [Vercel dashboard](https://vercel.com/dashboard) → select `vfx-pulse`.
2. Go to **Deployments** → latest deployment → **⋮** → **Redeploy**.
3. Confirm "Use existing Build Cache" or uncheck to force a clean build.

---

## Step 4 — Monitor the Build

1. Click the deployment link in the Vercel dashboard.
2. Open **Build Logs** and watch for:
   - `prisma:generate` completing without error.
   - `next build` reaching **✓ Compiled** and **✓ Collecting page data**.
   - Final line: `Build Completed`.
3. If the build fails, copy the error line and jump to [Troubleshooting](#troubleshooting).

---

## Step 5 — Smoke Tests (post-deploy)

Target URLs:
- Production: `https://mrvfxpulse.com`
- Vercel alias: `https://vfx-pulse.vercel.app`

### Manual smoke checks (do in order)
| # | URL / Action | Expected |
|---|---|---|
| 1 | `GET /login` | Login page loads, no JS errors |
| 2 | Login with admin credentials | Redirects to `/dashboard` |
| 3 | `GET /api/dashboard/stats` (authenticated) | HTTP 200, JSON body |
| 4 | `/projects` | Project list renders |
| 5 | `/shots` | Shot list renders |
| 6 | `/reports` | Reports page loads, export button visible |
| 7 | `/planning` | Planning workbench loads |

### Automated user-management smoke test
```bash
# Requires DATABASE_URL or VERCEL_URL env var pointing at production
npm.cmd run smoke:users
```

---

## Step 6 — Post-deploy Sign-off

- [ ] Build logs show no errors or warnings about missing env vars
- [ ] All manual smoke checks pass
- [ ] `smoke:users` script exits 0
- [ ] No new errors in Vercel **Functions → Logs** tab after smoke traffic

---

## Troubleshooting

### 500 at `/api/auth/callback/credentials`
- **Most common cause on Vercel**: `trustHost: true` is missing from the NextAuth config in `src/auth.ts`. Vercel forwards requests via CDN with `x-forwarded-host` headers; Auth.js v5 rejects them as untrusted without this flag → always 500.
- Confirm `src/auth.ts` has `trustHost: true` in the `NextAuth({...})` config.
- Also confirm `AUTH_SECRET` is set in Vercel → Environment Variables.

### Login / session failures
- Confirm `AUTH_URL` = `https://mrvfxpulse.com` (exact, no trailing slash).
- Confirm `NEXT_PUBLIC_APP_URL` = `https://mrvfxpulse.com`.
- Confirm `AUTH_SECRET` is a long random string and has NOT changed since the last deploy.

### Domain not reachable
- Check Vercel → Settings → Domains. Status must be **Valid**.
- DNS records at registrar:
  - `A` `@` → `76.76.21.21`
  - `CNAME` `www` → `cname.vercel-dns.com`
- DNS propagation can take up to 48 h; use `nslookup mrvfxpulse.com` to check.

### Build error: Prisma client out of date
- The build command must include `prisma:generate`. Verify `vercel.json` → `buildCommand` is `npm run deploy:vercel` (not `next build`).

### Type errors during build
- Run `npm.cmd run type-check` locally first and resolve all errors.
- After any Prisma schema change, always run `npm.cmd run prisma:generate` before type-check.

---

## Key Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run deploy:vercel` | `prisma:generate` + `next build` — used as Vercel build command |
| `npm run prisma:deploy` | Apply pending migrations to the target DB |
| `npm run deploy:db` | `prisma:generate` + `prisma:deploy` + seed — full DB setup |
| `npm run smoke:users` | Automated user-management smoke test |
| `npm run type-check` | TypeScript compile check (no emit) |
