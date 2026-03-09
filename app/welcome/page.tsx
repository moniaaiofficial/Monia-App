'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [viewedPrivacy, setViewedPrivacy] = useState(false);
  const [viewedTerms, setViewedTerms] = useState(false);

  const canContinue = viewedPrivacy && viewedTerms && agreed;

  const handleContinue = () => {
    if (canContinue) {
      router.push('/auth/login');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-[#0f0102]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-white">MONiA</h1>
          <p className="text-xl text-[#e0e0e0]">
            Your AI-Powered Communication Platform
          </p>
        </div>

        <div className="space-y-6 mt-12">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[#fc2857] cursor-pointer"
              disabled={!viewedPrivacy || !viewedTerms}
            />
            <label htmlFor="agree" className="text-sm text-[#e0e0e0] leading-tight">
              I agree to the Terms & Conditions and Privacy Policy of MONiA.
            </label>
          </div>

          {(!viewedPrivacy || !viewedTerms) && (
            <p className="text-xs text-[#fc2857] text-center">
              Please read both Privacy Policy and Terms & Conditions before continuing
            </p>
          )}

          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-4 rounded-lg text-white font-semibold text-lg transition-all ${
              canContinue
                ? 'bg-[#fc2857] hover:bg-[#e01f4a] active:scale-95'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            Agree & Continue
          </button>

          <div className="flex flex-col space-y-3 text-center">
            <Link
              href="/legal/privacy-policy"
              onClick={() => setViewedPrivacy(true)}
              className="text-[#fc2857] hover:underline text-sm font-medium"
            >
              Privacy Policy {viewedPrivacy && '✓'}
            </Link>
            <Link
              href="/legal/terms"
              onClick={() => setViewedTerms(true)}
              className="text-[#fc2857] hover:underline text-sm font-medium"
            >
              Terms & Conditions {viewedTerms && '✓'}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
