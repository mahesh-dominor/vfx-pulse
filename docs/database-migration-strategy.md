# Database Migration Strategy

## Principles
- Use Prisma migrations only.
- Never modify past applied migration files.
- Always run prisma:generate after schema changes.

## Environments
- Development: prisma migrate dev
- Staging/Production: prisma migrate deploy

## Rollback
- Keep point-in-time DB backups before deploy.
- Rollback is done by restore, not down migrations.

## Safe rollout checklist
1. Backup database.
2. Run migrations in maintenance window for large changes.
3. Validate critical read/write paths.
4. Monitor DB latency and error rates.
