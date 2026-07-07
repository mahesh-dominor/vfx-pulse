# Security Hardening

## Implemented
- Security headers in next.config.ts.
- Role-based route access checks.
- Zod validation for API and actions.
- Soft-delete for records.

## Recommended next
- CSRF protection for sensitive form endpoints.
- Rate-limiting on auth and mutation routes.
- Secret rotation policy (AUTH_SECRET, DB credentials).
- Dependency scanning in CI.
