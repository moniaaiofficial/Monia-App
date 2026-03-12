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
    <main className="min-h-screen flex items-center justify-center bg-[#100002]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#ff1e43]/10 flex items-center justify-center mx-auto shadow-glow">
          <Loader2 className="w-8 h-8 text-[#ff1e43] animate-spin icon-active-glow" />
        </div>
        <p className="text-white font-bold text-lg">Completing sign in...</p>
        <p className="text-white/40 text-sm">Please wait a moment</p>
      </div>
    </main>
  );
}
