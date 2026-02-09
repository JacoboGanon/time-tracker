# MVP Implementation Plan

## Goal

Implement a usable first version of the internal time tracker with:

- multi-client and multi-project data model
- project-level role permissions
- stopwatch and manual time entry workflows
- rate resolution and billing totals
- internal reporting with PDF export

## Scope for This Phase

1. Data foundation
2. Server domain services (permissions, validation, rates, reporting, PDF)
3. tRPC API routers for CRUD and workflows
4. Dashboard UI wired to the new API
5. Automated tests for core business rules
6. Lint and type-check validation

## Implementation Sequence

1. Add failing tests for core business behavior.
2. Implement minimal service modules until tests pass.
3. Expand Prisma schema with required entities and relations.
4. Implement tRPC routers using shared service logic.
5. Replace template dashboard with time-tracker workflows.
6. Re-run tests and static checks.
7. Update checklist with completed items.

## Quality Targets

- Timestamps stored and processed in UTC
- Role checks enforced on project-scoped mutations/queries
- Time entry edits create audit records for critical field changes
- Rate selection prefers project override, then user default
- Aggregation totals deterministic for same filters
