# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Time Tracker — a full-stack TypeScript application built on the **T3 Stack** (Next.js 15 + tRPC + Prisma + Tailwind CSS). Uses **Better-Auth** for authentication with email/password and Google OAuth, **Resend** for transactional emails, and **React Email** for email templates.

## Commands

| Command | Purpose |
|---------|---------|
| `bun run build` | Production build |
| `bun run check` | Lint + type check (use before committing) |
| `bun run lint` | ESLint only |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run typecheck` | TypeScript type check only |
| `bun run format:check` | Check Prettier formatting |
| `bun run format:write` | Auto-format all files |
| `bun run test` | Run tests (Bun test runner) |
| `bun run db:generate` | Generate Prisma Client + create migration |
| `bun run db:push` | Push schema changes without migration |
| `bun run db:migrate` | Deploy migrations |
| `bun run db:seed` | Seed database (activity types) |
| `bun run db:studio` | Open Prisma Studio |

**Do not run `bun run dev`** — the user manages dev servers themselves.

## Architecture

### Stack
- **Next.js 15** with App Router, React 19, Server Components by default
- **tRPC 11** for end-to-end type-safe API (no REST, no code generation)
- **Prisma 6** with PostgreSQL, client generated to `generated/prisma/` (excluded from tsconfig)
- **Better-Auth** — handles sessions, OAuth, email verification, password reset
- **Tailwind CSS v4** via `@tailwindcss/postcss` plugin (not classic config file)
- **shadcn/ui** (new-york style, RSC-enabled) with Radix UI primitives and Lucide icons
- **Bun** as package manager and test runner (ESM with `"type": "module"`)

### Path Alias
`~/*` maps to `./src/*` (configured in tsconfig.json)

### Key Directories
- `src/server/api/routers/` — tRPC routers: `time-entry`, `project`, `client`, `report`, `rate`, `activity-type`
- `src/server/api/root.ts` — registers all routers (add new routers here)
- `src/server/api/trpc.ts` — context, middleware, procedure definitions
- `src/server/api/utils/` — access-control helpers (`getProjectMembershipOrThrow`, `assertCanManageProject`)
- `src/server/services/` — business logic: `permissions`, `time-entry-validation`, `rates`, `reporting`, `report-pdf`
- `src/server/better-auth/` — auth config (`config.ts`), server helper (`server.ts`), client hook (`client.ts`)
- `src/server/emails/` — React Email templates
- `src/trpc/` — client wiring: `server.ts` (RSC caller), `react.tsx` (client provider), `query-client.ts`, `query-behavior.ts`
- `src/components/ui/` — shadcn components
- `src/app/_components/` — dashboard views: `timer-view`, `entries-view`, `reports-view`, `settings-view`

### tRPC Patterns
- **`publicProcedure`** — no auth required
- **`protectedProcedure`** — requires authenticated session; `ctx.session.user` guaranteed non-null
- Context provides: `db` (Prisma client), `session`, `headers`
- SuperJSON transformer for serializing Dates and other complex types
- Zod error formatting flattens validation errors for the frontend
- Dev middleware adds artificial latency (100-500ms) and logs execution times
- Server Components use `createCaller` from `src/trpc/server.ts`; client components use hooks from `src/trpc/react.tsx`

### Role-Based Access Control
Four project roles: `owner` > `manager` > `member` > `viewer`
- **View project** — all roles
- **Manage project** — owner, manager
- **Manage membership** — owner only
- **Edit time entries** — owner/manager can edit any; member can edit own only

Authorization checks use helpers in `src/server/services/permissions.ts` and `src/server/api/utils/project-access.ts`. Always use `getProjectMembershipOrThrow()` to validate project access in router procedures.

### Data Model
Core entities: `User`, `Client`, `Project`, `ProjectMember` (with role), `TimeEntry`, `ActivityType`, `RateCard`, `ProjectRateOverride`, `Report`, `TimeEntryAudit`

- Time entries support two modes: manual (start + end) and stopwatch (running timer)
- Overlap checking prevents concurrent time entries for the same user
- Multi-step mutations use `ctx.db.$transaction()` for atomicity

### Frontend Architecture
- Root page (`/`) is a protected Server Component — redirects to `/auth/sign-in` if no session
- Dashboard uses **client-side state** for navigation (not URL routing) — `useState` in `dashboard.tsx`
- Four views: timer, entries, reports, settings (mapped in `VIEW_COMPONENTS`)
- Layout: shadcn `SidebarProvider` + `SidebarInset` pattern
- `AppSidebar` shows nav items + project list grouped by client
- `useIsMobile()` hook (768px breakpoint) for responsive design

### Auth Flow
- `getSession()` in `src/server/better-auth/server.ts` is cached with React `cache()`
- Auth API route: `src/app/api/auth/[...all]/route.ts`
- Client auth: `authClient` from `src/server/better-auth/client.ts`
- Email verification required before sign-in

### Environment Variables
Validated via Zod in `src/env.js`. Required server-side vars:
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `BETTER_AUTH_GOOGLE_CLIENT_ID`, `BETTER_AUTH_GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`

Can skip validation with `SKIP_ENV_VALIDATION=true`.

### Design System
- Color palette: stone neutrals + amber accent, OKLch color space
- Fonts: DM Sans (UI), JetBrains Mono (data/mono)
- Theme support via `next-themes` (ThemeProvider in root layout, default: dark)
- Custom CSS variables defined in `src/styles/globals.css`
