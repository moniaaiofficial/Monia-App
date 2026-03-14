# Monia App

## Overview
A Next.js 14 app with Clerk authentication and Replit PostgreSQL as the database backend.

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (`@clerk/nextjs` v4)
- **Database**: Replit PostgreSQL (accessed via `pg` pool in `lib/db.ts`)
- **Styling**: Tailwind CSS
- **PWA**: next-pwa (disabled in development)
- **Package Manager**: pnpm

## Key Files
- `app/` — Next.js App Router pages and API routes
- `app/api/webhooks/clerk/route.ts` — Clerk webhook handler (syncs users to `profiles` table via direct SQL)
- `app/api/profile/route.ts` — Server-side profile fetch API (GET /api/profile)
- `middleware.ts` — Clerk auth middleware (protects `/app/*` routes, uses v4 `authMiddleware`)
- `lib/db.ts` — PostgreSQL connection pool (uses `DATABASE_URL` secret)
- `components/` — Shared React components

## Database Schema
Tables live in Replit PostgreSQL:
- `profiles` — User profiles synced from Clerk webhooks (id is Clerk user ID as TEXT)
- `media_files` — Media file tracking with 48-hour auto-expiry

## Environment Variables
All secrets are stored in Replit Secrets. Public vars are in Replit shared environment.

### Replit Secrets (sensitive, server-side only)
- `DATABASE_URL` — Replit PostgreSQL connection string (auto-managed)
- `CLERK_SECRET_KEY` — Clerk backend secret key
- `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key

### Replit Environment Variables (shared, non-sensitive)
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
