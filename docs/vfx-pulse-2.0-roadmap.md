# VFX Pulse 2.0 Roadmap

## Product Direction
VFX Pulse 2.0 evolves the app from tracking to production intelligence with three guiding outcomes:

- Plan every show backward from delivery with configurable pipeline milestones.
- Balance artist workload and department capacity before deadlines slip.
- Give producers and studio managers real-time operational visibility without spreadsheet overhead.

## Delivery Phases

### Phase 1: Planning Intelligence Foundation (Implemented in this iteration)
- Expanded dashboard KPIs for production risk and forecasting:
  - Client Review Shots
  - Overdue Shots
  - Upcoming Deliveries (14-day window)
  - High-Risk Projects
  - Artist Utilization %
  - Burn Rate (hours/day)
  - Delivery Forecast (days)
- Added reverse scheduling engine:
  - API: `POST /api/planning/reverse-schedule`
  - Supports configurable step durations, buffers, parallel groups, holidays, and weekend handling.
- Added department capacity forecasting engine:
  - API: `GET /api/planning/capacity`
  - Computes pending hours, in-progress hours, available artists, capacity/day, forecast finish, and shortage risk.
- Added Planning workspace page:
  - Route: `/planning`
  - Shows reverse milestones and department capacity table.

### Phase 2: Production Data Model Expansion
- Add missing production entities and fields:
  - Episode, shot complexity, dependencies, assigned lead, internal/client due dates, final comp date, attachment metadata.
  - Artist employment type, skill level, experience, weekly capacity, leave calendar, reporting lead.
  - Project bid metadata and milestone snapshots for historical planning comparisons.
- Introduce explicit review stage transitions:
  - Internal -> Lead -> Supervisor -> Client -> Approved.

### Phase 3: Scheduling and Allocation UX
- Interactive planning board:
  - Timeline + calendar + kanban synchronized views.
  - Drag-and-drop task allocation with instant capacity validation.
- Allocation warnings:
  - Over-capacity artists
  - Deadline infeasibility
  - Department understaffing
  - Milestone collision risks
- Bulk import/export:
  - CSV and Excel for shots/tasks/planning data.

### Phase 4: Analytics and Reporting 2.0
- Producer dashboards:
  - Capacity vs demand
  - Department health
  - Bid vs actual burn
  - Weekly delivery forecast
  - Project burndown
- Downloadable reports:
  - Daily/weekly production status
  - Department performance
  - Utilization and bid variance
  - Delivery forecast and project health
  - Formats: PDF, CSV, Excel.

### Phase 5: Integrations and AI Assistant
- Integration-ready adapters:
  - Slack, Teams, Google Calendar, Frame.io, Drive, S3.
- AI assistant (forecasting-first):
  - Delivery risk prediction
  - Bottleneck detection
  - Assignment recommendations
  - Resource shortage forecasting
  - Bid estimation refinement from actuals.

## Technical Decisions
- Keep Next.js App Router + API routes and Prisma as the core architecture.
- Introduce production planning as service modules first, then expand to dedicated feature slices.
- Favor incremental schema migrations over large one-shot migrations to preserve deploy safety.
- Keep RBAC enforcement in API and server-action boundaries, not only UI.

## Success Metrics
- 80% reduction in manual scheduling spreadsheets for active projects.
- Forecast accuracy within +/-10% for 2-week delivery windows.
- At least 90% of overdue shots detected 3+ days before final delivery date.
- Producer daily review time reduced below 20 minutes per project.

## Immediate Next Build Targets
1. Persist reverse milestone plans at project level with version history.
2. Add leave calendar and artist availability constraints to capacity forecasts.
3. Build drag-and-drop assignment with real-time overload prevention.
4. Add dashboard charts for utilization, demand, and project risk trend.
