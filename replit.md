# MONiA App

## Overview
An AI-powered mobile-first communication platform built with Next.js 14. Features real-time chat, Clerk authentication, Supabase for database and real-time subscriptions, and a PWA-ready design.

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (`@clerk/nextjs` v6)
- **Database**: Supabase (PostgreSQL with Realtime)
- **Styling**: Tailwind CSS
- **PWA**: next-pwa (disabled in development)
- **Package Manager**: pnpm

## Key Files
- `app/` — Next.js App Router pages and API routes
- `app/api/webhooks/clerk/route.ts` — Clerk webhook handler (syncs users to `profiles` table in Supabase)
- `app/api/profile/update/route.ts` — Server-side profile update API
- `middleware.ts` — Clerk auth middleware using v6 `clerkMiddleware` + `createRouteMatcher`
- `lib/supabase/client.ts` — Supabase browser client
- `lib/supabase/server.ts` — Supabase server client (SSR)
- `lib/chat.ts` — Chat logic (getUserChats, sendMessage, subscribeToMessages, etc.)
- `lib/clerk-session.ts` — Helper to fetch Clerk session/user metadata
- `components/` — Shared React components

## Database (Supabase)
Tables managed via migrations in `supabase/migrations/`:
- `profiles` — User profiles synced from Clerk webhooks (id is Clerk user ID as TEXT)
- `chats` — Chat conversations with participant arrays
- `messages` — Chat messages with real-time subscriptions
- `media_files` — Media file tracking with 48-hour auto-expiry

## Routes
### Public
- `/` — Splash screen (redirects based on auth status)
- `/welcome` — Onboarding page
- `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/sso-callback`, `/auth/verify-email`
- `/legal/privacy-policy`, `/legal/terms`

### Protected
- `/dashboard` — Main chats list
- `/dashboard/chat/[id]` — Individual chat conversation
- `/dashboard/ai` — M+AI assistant (placeholder)
- `/dashboard/status`, `/dashboard/calls`, `/dashboard/more`
- `/profile` — User profile view
- `/profile-setup` — Initial profile/username setup

## Environment Variables

### Replit Secrets (sensitive, server-side only)
- `CLERK_SECRET_KEY` — Clerk backend secret key
- `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (bypasses RLS)

### Replit Shared Env Vars (non-sensitive)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/auth/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/auth/signup`
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for client)

## Design System
Global design tokens in `app/globals.css` and `tailwind.config.ts`:
- **Background**: `#06000c` (Abyssal Purple-Black)
- **Active/Neon**: `#c6ff33` (Electric Neon)
- **Font**: Inter (all weights)

Key CSS classes: `.btn-neon`, `.glass-card`, `.glass-input`, `.floating-nav`, `.skeleton`, `.logo-glow`, `.icon-active-glow`, `.page-enter`

Providers in `app/layout.tsx`:
- `components/UIProvider.tsx` — Web Audio API sound engine + Vibration API haptics
- `components/TiltLayer.tsx` — DeviceOrientation parallax for `.tilt-target` elements

## Running the App
- **Dev**: `pnpm run dev` (port 5000)
- **Build**: `pnpm run build`
- **Start**: `pnpm run start` (port 5000)

## Replit Configuration
- Workflow: "Start application" runs `pnpm run dev` on port 5000
- Host binding: `0.0.0.0` for Replit proxy compatibility
- Port 5000 maps to external port 80
