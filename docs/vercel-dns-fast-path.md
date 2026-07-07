# Vercel + Postgres + DNS Fast Path (mrvfxpulse.com)

Use this exact sequence to get live today.

## 1) Import Repo in Vercel
1. Open Vercel dashboard.
2. Click Add New... -> Project.
3. Import your GitHub repo `vfx-pulse`.
4. Framework preset should auto-detect as Next.js.
5. Before clicking Deploy, open Environment Variables.

## 2) Add Environment Variables (Production)
Add in this exact order:
1. `NODE_ENV` = `production`
2. `NEXT_PUBLIC_APP_URL` = `https://mrvfxpulse.com`
3. `AUTH_URL` = `https://mrvfxpulse.com`
4. `AUTH_SECRET` = `<LONG_RANDOM_SECRET>`
5. `DATABASE_URL` = `<PRODUCTION_POSTGRES_URL>`
6. `SMTP_HOST` = `<SMTP_HOST_OR_EMPTY>`
7. `SMTP_PORT` = `587`
8. `SMTP_USER` = `<SMTP_USER_OR_EMPTY>`
9. `SMTP_PASSWORD` = `<SMTP_PASSWORD_OR_EMPTY>`
10. `SMTP_FROM` = `no-reply@mrvfxpulse.com`
11. `DIRECT_URL` = `<DIRECT_POSTGRES_URL_OPTIONAL>`

## 3) Build Command in Vercel
1. Go to Project -> Settings -> General -> Build & Development Settings.
2. Set Build Command to:
   - `npm run deploy:vercel`
3. Keep Install Command as default (`npm install` or `npm ci`).
4. Save.

## 4) First Deployment
1. Go to Deployments.
2. Click Redeploy latest.
3. Wait for success and open the `*.vercel.app` URL.

## 5) Add Custom Domain
1. Go to Settings -> Domains.
2. Add domain: `mrvfxpulse.com`.
3. Add domain: `www.mrvfxpulse.com`.
4. Set `mrvfxpulse.com` as Primary.

## 6) DNS Records (at your registrar)
Use values Vercel displays. Typical records are:
1. Type `A`, Name `@`, Value `76.76.21.21`
2. Type `CNAME`, Name `www`, Value `cname.vercel-dns.com`

## 7) SSL and Final Check
1. Wait for domain status to become Valid in Vercel.
2. Verify:
   - `https://mrvfxpulse.com/login`
   - login flow
   - dashboard loads
   - create/edit actions in Projects/Shots
   - reports export

## 8) Share Link
Share:
- `https://mrvfxpulse.com`

## Troubleshooting
1. 500 on first load: verify `DATABASE_URL` + migrations via `npm run prisma:deploy` in build command.
2. Login/session issues: verify `AUTH_URL` and `NEXT_PUBLIC_APP_URL` both use `https://mrvfxpulse.com`.
3. Domain not reachable: DNS not propagated or record mismatch.
