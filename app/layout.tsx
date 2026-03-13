import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#0f0102',
};

export const metadata: Metadata = {
  title: 'MONiA - Your AI-Powered Communication Platform',
  description: 'MONiA - Connect, communicate, and collaborate with AI-powered features',
  manifest: '/manifest.json',
  openGraph: {
    title: 'MONiA',
    description: 'Your AI-Powered Communication Platform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MONiA',
    description: 'Your AI-Powered Communication Platform',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MONiA',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/auth/login"
      signUpUrl="/auth/signup"
      afterSignInUrl="/app/dashboard"
      afterSignUpUrl="/app/dashboard"
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

