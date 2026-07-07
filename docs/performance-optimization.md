# Performance Optimization

## App
- Prefer server components for data-heavy views.
- Cache stable reference data where safe.
- Paginate large tables and APIs.

## Database
- Add indexes for high-cardinality filters.
- Track slow queries and optimize joins.

## Frontend
- Avoid loading large JSON blobs in UI.
- Keep dashboard payloads bounded by limits.
