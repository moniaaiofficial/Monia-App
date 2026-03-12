# Monia App

## Overview
A Next.js 14 app with Clerk authentication and Supabase as the database backend. Migrated from Vercel to Replit.

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Supabase (PostgreSQL via `@supabase/supabase-js` and `@supabase/ssr`)
- **Styling**: Tailwind CSS
- **PWA**: next-pwa (disabled in development)
- **Package Manager**: pnpm

## Key Files
- `app/` — Next.js App Router pages and API routes
- `app/api/webhooks/clerk/route.ts` — Clerk webhook handler (syncs users to Supabase `profiles` table)
- `middleware.ts` — Clerk auth middleware (protects `/app/*` routes)
- `lib/supabase/` — Supabase client helpers (client + server)
- `components/` — Shared React components
- `supabase/` — Supabase config/migrations

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (set in `.env`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (set in `.env`)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only, set as secret)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key (server-side only, set as secret)
- `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret (server-side only, set as secret)

## Running the App
- **Dev**: `pnpm run dev` (port 5000)
- **Build**: `pnpm run build`
- **Start**: `pnpm run start` (port 5000)

## Replit Configuration
- Workflow: "Start application" runs `pnpm run dev` on port 5000
- Host binding: `0.0.0.0` for Replit proxy compatibility
