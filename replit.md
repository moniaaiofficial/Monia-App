# Monia App

## Overview
A Next.js 14 app with Clerk authentication and Supabase as the database backend. Migrated to Replit.

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
- `supabase/` — Supabase config/migrations/edge functions

## Environment Variables
All secrets are stored in Replit Secrets (never in files). Public vars are in Replit Environment Variables.

### Replit Secrets (sensitive, server-side only)
- `CLERK_SECRET_KEY` — Clerk backend secret key
- `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

### Replit Environment Variables (shared, non-sensitive)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/auth/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/auth/signup`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` — `/app/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` — `/app/dashboard`

## Running the App
- **Dev**: `pnpm run dev` (port 5000)
- **Build**: `pnpm run build`
- **Start**: `pnpm run start` (port 5000)

## Replit Configuration
- Workflow: "Start application" runs `pnpm run dev` on port 5000
- Host binding: `0.0.0.0` for Replit proxy compatibility
- Port 5000 maps to external port 80
