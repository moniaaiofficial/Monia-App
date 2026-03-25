'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WelcomePage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12 page-enter"
      style={{ background: '#14141f' }}
    >
      {/* Top section */}
      <div />

      {/* Center: Logo + tagline */}
      <div className="flex flex-col items-center text-center space-y-4">
        <h1
          className="font-black text-white logo-glow"
          style={{ fontSize: '4.5rem', letterSpacing: '-0.04em', lineHeight: 1 }}
        >
          MONiA
        </h1>
        <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 260 }}>
          Your AI-Powered Communication Platform
        </p>
      </div>

      {/* Bottom: legal agreement + buttons */}
      <div className="w-full max-w-sm space-y-5">
        {/* Checkbox row */}
        <label
          className="flex items-start gap-3 cursor-pointer"
          style={{ userSelect: 'none' }}
        >
          <div
            onClick={() => setAgreed((v) => !v)}
            style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: agreed ? 'none' : '1.5px solid rgba(255,255,255,0.30)',
              background: agreed ? '#ff0066' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
          >
            {agreed && (
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#14141f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            I agree to MONiA&apos;s{' '}
            <Link
              href="/legal/terms"
              className="font-semibold hover:underline"
              style={{ color: '#ff0066' }}
              onClick={(e) => e.stopPropagation()}
            >
              Terms & Conditions
            </Link>
            {' '}and{' '}
            <Link
              href="/legal/privacy-policy"
              className="font-semibold hover:underline"
              style={{ color: '#ff0066' }}
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
          </span>
        </label>

        {/* Agree & Continue button */}
        <button
          disabled={!agreed}
          onClick={() => router.push('/auth/login')}
          className="btn-neon w-full py-4 rounded-2xl font-bold text-sm transition-all"
          style={{
            color: '#14141f',
            opacity: agreed ? 1 : 0.35,
            cursor: agreed ? 'pointer' : 'not-allowed',
          }}
        >
          Agree &amp; Continue
        </button>

        {/* Sign up link */}
        <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
          New here?{' '}
          <Link
            href="/auth/signup"
            className="font-bold hover:opacity-80 transition-opacity"
            style={{ color: '#ff0066' }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
