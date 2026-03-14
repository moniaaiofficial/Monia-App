'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms,   setAgreedTerms]   = useState(false);
  const [agreed,        setAgreed]        = useState(false);

  const canContinue = agreedPrivacy && agreedTerms && agreed;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 page-enter"
      style={{ background: '#06000c' }}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1
            className="font-black text-white logo-glow"
            style={{ fontSize: 'clamp(3.5rem, 14vw, 5rem)', letterSpacing: '-0.03em' }}
          >
            MONiA
          </h1>
          <p className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Your AI-Powered Communication Platform
          </p>
        </div>

        <div className="space-y-6 mt-10">
          {/* Privacy Policy */}
          <label className="flex items-center gap-4 cursor-pointer group">
            <button
              type="button"
              onClick={() => setAgreedPrivacy(!agreedPrivacy)}
              className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
              style={{
                borderColor: agreedPrivacy ? '#c6ff33' : 'rgba(198,255,51,0.4)',
                background:  agreedPrivacy ? '#c6ff33' : 'transparent',
              }}
            >
              {agreedPrivacy && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#06000c' }} />
              )}
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              I have read and agree to the{' '}
              <Link
                href="/legal/privacy-policy"
                className="font-semibold underline"
                style={{ color: '#c6ff33' }}
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          {/* T&C */}
          <label className="flex items-center gap-4 cursor-pointer group">
            <button
              type="button"
              onClick={() => setAgreedTerms(!agreedTerms)}
              className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
              style={{
                borderColor: agreedTerms ? '#c6ff33' : 'rgba(198,255,51,0.4)',
                background:  agreedTerms ? '#c6ff33' : 'transparent',
              }}
            >
              {agreedTerms && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#06000c' }} />
              )}
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              I have read and agree to the{' '}
              <Link
                href="/legal/terms"
                className="font-semibold underline"
                style={{ color: '#c6ff33' }}
              >
                T&amp;C
              </Link>
            </span>
          </label>

          {/* Main agreement */}
          <div className="flex items-start gap-4 pt-2">
            <button
              type="button"
              disabled={!agreedPrivacy || !agreedTerms}
              onClick={() => setAgreed(!agreed)}
              className="flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 mt-0.5"
              style={{
                borderColor: !agreedPrivacy || !agreedTerms
                  ? 'rgba(255,255,255,0.18)'
                  : agreed ? '#c6ff33' : 'rgba(198,255,51,0.5)',
                background: agreed ? '#c6ff33' : 'transparent',
                cursor: !agreedPrivacy || !agreedTerms ? 'not-allowed' : 'pointer',
                opacity: !agreedPrivacy || !agreedTerms ? 0.4 : 1,
              }}
            >
              {agreed && (
                <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                  <path d="M1 4L4.5 7.5L11 1" stroke="#06000c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <label
              className="text-sm leading-snug"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              I agree to the T&amp;C and Privacy Policy of MONiA.
            </label>
          </div>

          {!agreedPrivacy || !agreedTerms ? (
            <p className="text-xs text-center" style={{ color: 'rgba(198,255,51,0.55)' }}>
              Please read and agree to both documents first
            </p>
          ) : null}

          <button
            onClick={() => canContinue && router.push('/auth/login')}
            disabled={!canContinue}
            className="btn-neon w-full py-4 rounded-2xl font-bold text-sm mt-2"
            style={{ color: '#06000c' }}
          >
            Agree &amp; Continue
          </button>
        </div>
      </div>
    </main>
  );
}
