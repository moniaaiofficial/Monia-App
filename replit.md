# MONiA App — v2.0.0

## Overview
An AI-powered mobile-first communication platform built with Next.js 14. Features real-time chat, Clerk authentication, Supabase for database and real-time subscriptions, and a PWA-ready design.

## Routing Rules (CRITICAL — no `/app/` prefix)
- All dashboard routes: `/dashboard`, `/dashboard/chats`, `/dashboard/explore`, `/dashboard/notifications`, `/dashboard/more`
- Profile page: `/profile` (NOT `/dashboard/profile`)
- Auth pages: `/auth/login`, `/auth/signup`, `/auth/verify-email`, `/auth/sso-callback`
- Post-OAuth setup: `/profile-setup` (Google new users only)
- Legal: `/legal/privacy-policy`, `/legal/terms`
- NEVER use `/app/...` prefix — this is a historical bug

## Auth Flow
1. `/` (splash) → checks auth → `/welcome` (unauthenticated) or `/dashboard` (authenticated)
2. Email signup → `/auth/verify-email` → `/dashboard`
3. Google OAuth signup → `/auth/sso-callback` → `/profile-setup` (new users)
4. Google OAuth login → `/auth/sso-callback` → `/dashboard` (returning users)

## Server API Routes (ALL use service role key — bypasses Supabase RLS)
- `GET /api/profile/get` — Fetch current user's profile
- `POST /api/profile/update` — Upsert profile fields (userId + any subset of username, mobile, city, full_name, email, avatar_url, hide_phone, hide_city, hide_full_name, sleep_mode_enabled, sleep_start, sleep_end)
- `POST /api/profile/avatar` — Upload avatar to Supabase storage
- `GET /api/profiles/search?q=<query>` — Search all users by name, username, email, mobile, or city
- `GET /api/chats` — List current user's chats with partner profiles embedded
- `POST /api/chats` — Create or fetch an existing 1:1 chat (`{ partnerId }`)
- `GET /api/messages?chatId=<id>` — List messages for a chat
- `POST /api/messages` — Send a message (`{ chatId, content, type }`)
- `PATCH /api/messages` — Update message status (`{ messageId, status }`)

## CRITICAL: RLS Architecture
The app uses Clerk auth (NOT Supabase Auth), so `auth.uid()` is always null on the client. All database reads/writes are routed through Next.js API routes that use `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. The anon Supabase client is used ONLY for realtime subscriptions (channel events), NOT for data queries.

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (`@clerk/nextjs` v6)
- **Database**: Supabase (PostgreSQL with Realtime)
- **Styling**: Tailwind CSS
- **PWA**: next-pwa (disabled in development)
- **Package Manager**: npm

## Key Files
- `app/` — Next.js App Router pages and API routes
- `app/api/webhooks/clerk/route.ts` — Clerk webhook handler (syncs users to `profiles` table in Supabase)
- `app/api/profile/update/route.ts` — Server-side profile update API
- `app/api/upload/route.ts` — File upload endpoint using Supabase service role (uploads to `chat-media` bucket)
- `middleware.ts` — Clerk auth middleware using v6 `clerkMiddleware` + `createRouteMatcher`
- `lib/supabase/client.ts` — Supabase browser client
- `lib/supabase/server.ts` — Supabase server client (SSR)
- `lib/chat.ts` — Chat logic (getUserChats, sendMessage, subscribeToMessages, formatMsgTime, formatFileSize, etc.)
- `lib/upload.ts` — Client-side upload helper (uploadChatFile, formatFileSize, getFileIcon)
- `lib/clerk-session.ts` — Helper to fetch Clerk session/user metadata
- `components/` — Shared React components
- `components/AttachmentMenu.tsx` — WhatsApp-style attachment bottom sheet (camera, gallery, document, location, voice, poll, emoji, link)
- `components/VoiceRecorder.tsx` — Voice note recorder with 15-min limit, live timer, playback before send
- `components/EmojiPicker.tsx` — Categorized emoji picker with search (Smileys, Hearts, Hands, People, Animals, Food, Sports, Objects, Symbols)
- `components/ChatBubble.tsx` — Multi-media type bubbles (text, image, video, audio, document, location, poll, emoji)
- `components/ChatInput.tsx` — Input bar with attachment (📎), emoji (😊), and send (▶) buttons
- `components/TypingIndicator.tsx` — Animated three-dot typing indicator

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

### Replit Secrets (public/frontend keys — also stored as secrets for safety)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for client)

### Replit Shared Env Vars (non-sensitive config)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/auth/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — `/auth/signup`

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
- **Dev**: `npm run dev` (port 5000)
- **Build**: `npm run build`
- **Start**: `npm run start` (port 5000)

## Replit Configuration
- Workflow: "Start application" runs `npm run dev` on port 5000
- Host binding: `0.0.0.0` for Replit proxy compatibility
- Port 5000 maps to external port 80
- All secrets stored in Replit Secrets vault (not in .env file)
