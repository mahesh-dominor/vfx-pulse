# Logging, Monitoring, Error Tracking

## Logging
- Structured JSON logs for API routes and server actions.
- Include correlation id, user id, entity type, and latency.

## Monitoring
- Metrics: request latency, error rate, DB query latency, queue depth.
- Alerts:
  - 5xx > 2% for 5m
  - p95 latency > 1.5s for 10m
  - DB CPU > 80% for 10m

## Error tracking
- Integrate Sentry (recommended) for server and client errors.
- Capture release tags from CI.
