# MONiA — AI-Powered Communication Platform

## Overview
MONiA is a Next.js 14 real-time messaging app (similar to WhatsApp) with AI-powered features, built with Clerk for authentication and Supabase for database and real-time messaging.

## Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database & Realtime**: Supabase (PostgreSQL + Supabase Realtime)
- **Styling**: Tailwind CSS + Lucide React icons
- **PWA**: next-pwa (disabled in development)
- **Webhook verification**: svix

## Running the App
```
npm run dev   # starts on port 5000
```

## Required Environment Secrets
All secrets are stored in Replit Secrets:

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key (must match publishable key — same Clerk app) |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

## Project Structure
```
app/
  api/              # API routes (messages, chats, profiles, webhooks)
  auth/             # Login, signup, SSO, password recovery pages
  dashboard/        # Main app shell (chat, AI, calls, status)
  legal/            # Privacy policy, terms of service
components/         # Reusable UI components
lib/
  supabase/         # Supabase client (browser) and server clients
  realtime-messaging.ts  # Supabase Realtime for live chat
  profile-context.tsx    # React context for user profile
supabase/
  migrations/       # Database schema migrations
  setup.sql         # Complete schema setup script
```

## Database Schema
Run `supabase/setup.sql` in your Supabase SQL editor to set up the full schema:
- `profiles` — user profiles (synced from Clerk via webhook)
- `chats` — chat conversations
- `messages` — chat messages
- `media_files` — uploaded media (auto-expires after 48h)

## Key Routes
- `GET/POST /api/messages` — fetch and send messages
- `GET/POST /api/chats` — list and create chats
- `GET /api/profiles/search` — search users
- `POST /api/profile/update` — update profile settings
- `POST /api/webhooks/clerk` — Clerk → Supabase user sync webhook
- `GET /api/health` — environment and DB health check

## AI Features (lib/aiHandler.ts)
- **Universal Translation**: Gemini 1.5 Flash — auto-detects source language, translates to any of 60+ target languages
- **Indian Female Voice (TTS)**: `window.speechSynthesis` with priority: Google Hindi Female → Google English India Female → Microsoft Hemlata
- **Voice Input**: `webkitSpeechRecognition` scoped to selected language
- **AI Analysis**: Context-aware conversation insights via Gemini

## ChatInput AI Panel (components/ChatInput.tsx)
- Language dropdown: 20 Indian + 28 global languages with search
- "Need MONiA's help?" — neon pink breathing glow, prefills `@monia ` in input
- (+) slide-up menu: Voice AI, Media Attach, AI Analysis
- Mic button: toggles voice recognition with pulse animation
- Send button: auto-translates when target language != English or `@monia ` prefix used

## Architecture Notes
- Clerk handles all authentication — no Supabase Auth used
- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side (in `/api` routes)
- Supabase Realtime powers live message delivery
- RLS policies on Supabase tables are set permissively (anon key) since Clerk manages auth
- Gemini API key used client-side in `lib/aiHandler.ts` for translation & analysis
