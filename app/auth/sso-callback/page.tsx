'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    async function handleCallback() {
      try {
        await handleRedirectCallback({});
      } catch (err) {
        console.error('SSO callback error:', err);
        window.location.href = '/auth/login';
      }
    }
    handleCallback();
  }, [handleRedirectCallback]);

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#06000c' }}
    >
      <div className="text-center space-y-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto tilt-target"
          style={{ background: 'rgba(198,255,51,0.08)' }}
        >
          <Loader2
            className="w-8 h-8 animate-spin icon-active-glow"
            style={{ color: '#c6ff33' }}
          />
        </div>
        <p className="font-bold text-lg text-white">Completing sign in…</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>Please wait a moment</p>
      </div>
    </main>
  );
}
