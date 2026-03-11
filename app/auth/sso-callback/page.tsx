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
    <main className="min-h-screen flex items-center justify-center bg-[#0f0102]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#fc2857] animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </main>
  );
}
