# Developer Documentation

## Architecture
- Feature-based structure under src/features.
- Services in src/services hold business logic.
- API routes and server actions call services.

## Standards
- Strict TypeScript
- Zod validation on all input boundaries
- Soft-delete via deletedAt

## Common commands
- npm run dev
- npm run type-check
- npm run prisma:validate
- npm run prisma:generate
