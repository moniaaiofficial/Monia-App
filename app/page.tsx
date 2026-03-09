'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0102]">
      <h1 className="text-7xl font-bold text-white animate-pulse" style={{ animation: 'glow 2s ease-in-out infinite' }}>
        MONiA
      </h1>
    </main>
  );
}
