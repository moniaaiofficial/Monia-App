# MONiA - Your AI-Powered Communication Platform

A modern, production-ready Progressive Web Application (PWA) built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Splash Screen**: 3-second animated splash screen with glow effect
- **Welcome Flow**: Mandatory policy agreement system before signup
- **Authentication**:
  - Email/password login and signup
  - Google OAuth integration
  - Forgot password functionality
  - Protected routes with middleware
- **App Dashboard**: WhatsApp-style interface with bottom navigation
  - Chats tab
  - Calls tab
  - Updates tab
  - More/Settings tab
- **Legal Pages**: In-app Privacy Policy and Terms & Conditions
- **PWA Support**: Installable app with offline capabilities
- **Media Auto-Delete**: Automatic deletion of media files after 48 hours
- **Modern Design**: Custom color scheme with Poppins font and Lucide icons

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **Icons**: Lucide React
- **PWA**: next-pwa

## Design System

```css
### Design System (2026 Futuristic Update)
- **Primary Background:** #06000c (Deep Indigo Black)
- **Primary Accent:** #c6ff33 (Electric Neon Yellow)
- **Text Primary:** #ffffff (Pure White)
- **Text Secondary:** #94a3b8 (Cool Slate)
- **Border Color:** #c6ff33 (Electric Neon)
- **User Chat Bubble:** #1a1033 (Deep Indigo)
- **Other Chat Bubble:** #06000c (Black Indigo)
- **Icon Style:** Diamond White Shine (#ffffff)

```

**Font**: Poppins (Google Fonts)
**Icons**: Lucide Icons (pure white)

## Project Structure

```
├── app/
│   ├── page.tsx                    # Splash screen
│   ├── welcome/page.tsx            # Welcome/onboarding
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   ├── signup/page.tsx         # Signup page
│   │   └── forgot-password/page.tsx # Password reset
│   ├── app/
│   │   ├── layout.tsx              # App layout with bottom nav
│   │   ├── page.tsx                # Chats tab
│   │   ├── calls/page.tsx          # Calls tab
│   │   ├── updates/page.tsx        # Updates tab
│   │   └── more/page.tsx           # Settings/More tab
│   └── legal/
│       ├── privacy-policy/page.tsx # Privacy policy
│       └── terms/page.tsx          # Terms & conditions
├── components/
│   └── BottomNav.tsx               # Bottom navigation component
├── lib/
│   └── supabase/
│       ├── client.ts               # Supabase client (client-side)
│       └── server.ts               # Supabase client (server-side)
├── supabase/
│   └── functions/
│       └── cleanup-expired-media/  # Edge function for media cleanup
└── middleware.ts                   # Auth middleware
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the placeholder values with your actual Supabase credentials from your Supabase project dashboard.

### 3. Database Setup

The database schema is already set up with the following tables:

- `profiles`: User profile information (full_name, email, mobile_number, city)
- `media_files`: Media file tracking with auto-expiry timestamps

Row Level Security (RLS) is enabled on all tables.

### 4. Google OAuth Setup (Optional)

To enable Google login:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 6. Build for Production

```bash
npm run build
```

## Key Features Explained

### Media Auto-Delete System

All media files (images, videos, documents, voice notes) are automatically deleted after 48 hours:

- Files are tracked in the `media_files` table
- `media_expiry` timestamp is automatically calculated as `created_at + 48 hours`
- A Supabase Edge Function (`cleanup-expired-media`) handles the deletion
- Text messages are NOT deleted

### Authentication Flow

1. User opens app → Splash screen (3 seconds)
2. Redirects to Welcome screen
3. User must view Privacy Policy and Terms & Conditions
4. User checks agreement checkbox
5. User can then proceed to Login or Signup
6. Protected routes redirect unauthenticated users to login

### Protected Routes

The middleware automatically protects `/app/*` routes and redirects unauthenticated users to `/auth/login`.

## Important Notes

- **NOT End-to-End Encrypted**: MONiA does not use end-to-end encryption
- **Media Deletion**: All media files auto-delete after 48 hours
- **Age Requirement**: Users must be 13+ years old
- **Contact Email**: moniaaiofficial@gmail.com

## License

This project is proprietary software for MONiA.

## Support

For questions or support, contact: moniaaiofficial@gmail.com
