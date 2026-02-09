# Time Tracker Build Checklist

## Milestone A: Foundation and Data Model

- [ ] Define Prisma models for `Client`, `Project`, `ProjectMember`, `ActivityType`, `TimeEntry`, `RateCard`, `ProjectRateOverride`, `Report`, `ReportSnapshot`, `TimeEntryAudit`
- [ ] Add schema constraints, foreign keys, and indexes for reporting queries
- [ ] Add migration and local seed data for activity types
- [ ] Add failing tests for role-based project permissions
- [ ] Implement role checks in API layer
- [ ] Add failing tests for client/project/member CRUD behavior
- [ ] Implement routers and procedures for CRUD
- [ ] Verify with tests, lint, and type-check

## Milestone B: Time Tracking UX

- [ ] Add failing tests for stopwatch start/stop behavior
- [ ] Implement stopwatch UI and persistence flow
- [ ] Add failing tests for manual entry validation rules
- [ ] Implement manual entry create/edit/delete
- [ ] Add failing tests for edit audit creation
- [ ] Implement `TimeEntryAudit` write path on key edits
- [ ] Add filters (date range, member, project, activity) for entry list view
- [ ] Verify with tests, lint, and type-check

## Milestone C: Rates and Costing

- [ ] Add failing tests for default-rate and override-rate resolution
- [ ] Implement user default rate management
- [ ] Implement per-project rate override management
- [ ] Add failing tests for billable total calculations
- [ ] Implement aggregation logic with deterministic totals
- [ ] Verify with tests, lint, and type-check

## Milestone D: Reporting and PDF Export

- [ ] Add failing tests for report aggregation output structure
- [ ] Build dashboard report views with required filters
- [ ] Add failing tests for PDF export generation
- [ ] Implement PDF export service and report layout
- [ ] Persist report metadata and snapshots
- [ ] Validate dashboard totals match PDF totals
- [ ] Verify with tests, lint, and type-check

## Milestone E: Operational Hardening

- [ ] Add reminder workflow for missing time entries
- [ ] Add empty/loading/error states on reporting and tracking views
- [ ] Add logging/monitoring hooks for report generation failures
- [ ] Review key query performance and add indexes as needed
- [ ] Verify with tests, lint, and type-check

## Cross-Cutting Quality Gates

- [ ] Keep timestamps in UTC and render in user time zone
- [ ] Enforce permission checks on all project-scoped procedures
- [ ] Maintain audit trail for important entry edits
- [ ] Keep docs updated as scope evolves
