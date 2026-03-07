# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Skim Pintar** — membership and subscription management portal for Masjid Ar-Raudhah. Admin dashboard for managing members/payments/subscriptions and a member self-service portal. Stripe for online payments, Better Auth for authentication, Resend for transactional emails.

## Commands

```bash
bun run dev          # Dev server on port 3000
bun run build        # Production build (bun --bun vite build)
bun run start        # Run production server (.output/server/index.mjs)
bun run lint         # Oxlint
bun run type-check   # TypeScript check (tsgo --noEmit)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
bun run db:studio    # Drizzle Studio UI
bun run db:seed      # Seed plans
```

**Database migrations: ALWAYS use `db:generate` then `db:migrate`. NEVER use `db:push`.** The database is production — `db:push` bypasses the migration journal and causes tracking drift.

Package manager is **bun**. Runtime is **Bun** (Nitro preset: `bun`).

## Architecture

**Framework:** TanStack Start (React 19 SSR) + Nitro backend + Vite 7
**Database:** PostgreSQL via Drizzle ORM (`src/db/schema.ts`)
**Auth:** Better Auth with email+password (admin) and magic link (member) — `src/lib/auth.ts`
**Payments:** Stripe SDK — webhook at `src/routes/api/webhooks/stripe.ts`
**Email:** Resend with React Email templates in `src/emails/`, sent via `src/lib/notifications.ts`
**Styling:** Tailwind CSS v4 with custom design tokens in `src/styles/app.css`
**UI Components:** shadcn/Radix in `src/components/ui/`

### Routing

File-based routing via TanStack Router. Route tree auto-generated in `src/routeTree.gen.ts`.

- `/` — public landing page
- `/donate` — donation checkout
- `/member/*` — member portal (magic link auth, `beforeLoad` guard)
- `/admin/*` — admin dashboard (email+password auth, role check)
- `/api/auth/$` — Better Auth catch-all handler
- `/api/webhooks/stripe` — Stripe webhook

### Server functions

All server-side API logic lives in `src/lib/server-fns.ts` using `createServerFn()` from TanStack Start. Pattern:

```typescript
export const myFunc = createServerFn({ method: "GET" })
  .inputValidator((data: MyType) => data)
  .handler(async ({ data }) => {
    const session = await getSession(); // or requireAdminSession()
    // Drizzle queries, business logic
    return result;
  });
```

Auth helpers in the same file: `getSession()` throws if unauthenticated, `requireAdminSession()` also checks `role === "admin"`.

Exported server functions in `src/lib/server-auth.ts` (`getServerSession`, `requireAdmin`, `requireMember`) are used by route `beforeLoad` guards.

### Protected routes pattern

```typescript
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await requireAdmin();
    return { session };
  },
  component: AdminLayout,
});
```

### Database

Schema in `src/db/schema.ts`. Key tables: `user`, `session` (Better Auth managed), `members`, `plans`, `subscriptions`, `dependants`, `payments`, `auditLog`.

Subscription status enum: `pending_payment → active → grace → lapsed → cancelled`. Coverage transitions handled by `src/lib/coverage-engine.ts` (cron-triggered).

### Audit trail

Mutations log to `auditLog` table with entity type, entity ID, action, old/new values, and performer ID.

### Path alias

`~/*` maps to `./src/*` (tsconfig paths + vite-tsconfig-paths).

### Environment

Variables validated via envalid in `src/env.ts`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`. Local dev uses `.env.local`.

### Design tokens

Landing/email visual identity defined in `src/styles/app.css`: deep green (`#064234`), cream (`#FFFDF5`), gold (`#F5C842`), mint (`#2DD4A8`). Fonts: Fraunces (headings), Plus Jakarta Sans (body).
