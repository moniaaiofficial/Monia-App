'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/UIProvider';

export default function SplashScreen() {
  const router  = useRouter();
  const { playStartup } = useUI();
  const played  = useRef(false);

  useEffect(() => {
    if (!played.current) {
      played.current = true;
      playStartup();
    }
    const timer = setTimeout(() => router.push('/welcome'), 3000);
    return () => clearTimeout(timer);
  }, [router, playStartup]);

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ background: '#06000c' }}
    >
      <div className="flex flex-col items-center gap-6 select-none">
        <h1
          className="liquid-metal-text"
          style={{
            fontSize: 'clamp(4rem, 18vw, 7rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          MONiA
        </h1>

        {/* Sub-line */}
        <p
          className="text-sm font-medium tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.22)', animationDelay: '0.4s' }}
        >
          AI Communication Platform
        </p>

        {/* Loading bar */}
        <div
          className="mt-4"
          style={{
            width: 120,
            height: 2,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #c6ff33, transparent)',
              backgroundSize: '200% 100%',
              animation: 'skeletonWave 1.4s ease-in-out infinite',
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    </main>
  );
}
