# Release Process (v1.0+)

## 1. Pre-release checks
1. npm ci
2. npm run release:prepare

## 2. Database rollout
1. Backup production database.
2. Run `npm run prisma:deploy` in deployment environment.
3. Validate critical endpoints and login flow.

## 3. Tagging
1. Create and push semantic version tag:
   - git tag v1.0.0
   - git push origin v1.0.0
2. CD workflow builds and pushes Docker image to GHCR.

## 4. Post-release checks
- /api/health returns 200.
- /login, /dashboard, /users, /projects load.
- Error rate and latency are within alert thresholds.

## 5. Rollback
- Restore latest verified backup.
- Redeploy previous tagged image.
