# Backup Strategy

## Policy
- Full backup: daily
- WAL/incremental: every 15 minutes
- Retention: 30 days hot, 180 days cold archive

## Recovery objectives
- RPO: 15 minutes
- RTO: 2 hours

## Verification
- Weekly restore drill to staging.
- Validate row counts and app login after restore.
