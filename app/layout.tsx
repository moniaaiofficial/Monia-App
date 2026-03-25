import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import UIProvider from '@/components/UIProvider';
import TiltLayer from '@/components/TiltLayer';
import { ProfileProvider } from '@/lib/profile-context';
import Splash from './page'; // Tera Splash component (page.tsx)

export const viewport: Viewport = {
  themeColor: '#14141f',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/auth/login" signUpUrl="/auth/signup">
      <html lang="en" className="dark" style={{ backgroundColor: '#14141f' }}>
        <body style={{ backgroundColor: '#14141f', color: '#ffffff', margin: 0 }}>
          
          {/* ✅ Splash ab Provider ke andar hai, error nahi aayega */}
          <Splash /> 

          <UIProvider>
            <TiltLayer>
              <ProfileProvider>
                {children}
              </ProfileProvider>
            </TiltLayer>
          </UIProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
