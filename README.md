# VFX Pulse

Production management platform for VFX studios.

## Stack
- Next.js 16 App Router
- React 19 + TypeScript (strict)
- Prisma 7 + PostgreSQL
- NextAuth v5 (credentials)
- Zod validation

## Architecture
- Feature-based structure:
	- src/app
	- src/features
	- src/components
	- src/services
	- src/lib
	- src/hooks
	- src/types
	- src/constants

## Modules
1. Authentication
2. Dashboard
3. Users
4. Projects
5. Sequences
6. Shots
7. Daily Updates
8. Review System
9. Asset Management
10. Reports
11. Notifications
12. Settings

## Local Setup
1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
	 - `npm ci`
3. Validate and generate Prisma:
	 - `npm run prisma:validate`
	 - `npm run prisma:generate`
4. Run migrations:
	 - `npm run prisma:migrate -- --name init`
5. Start development server:
	 - `npm run dev`

## Quality Commands
- `npm run type-check`
- `npm run lint`
- `npm run build`

## Production and DevOps
- Docker:
	- `Dockerfile`
	- `docker-compose.yml`
- CI/CD:
	- `.github/workflows/ci.yml`
- Docs:
	- `docs/deployment-guide.md`
	- `docs/database-migration-strategy.md`
	- `docs/backup-strategy.md`
	- `docs/logging-monitoring-error-tracking.md`
	- `docs/security-hardening.md`
	- `docs/performance-optimization.md`
	- `docs/testing-checklist.md`
	- `docs/api-documentation.md`

## Version
- Release baseline: v1.0.0
