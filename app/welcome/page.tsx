'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const canContinue = agreedPrivacy && agreedTerms && agreed;

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
          {/* Niche wale checkboxes – Privacy Policy */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                agreedPrivacy ? 'bg-green-500 border-green-500' : 'border-[#fc2857]'
              }`}
              onClick={() => setAgreedPrivacy(!agreedPrivacy)}
            >
              {agreedPrivacy && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>
            <span className="text-[#e0e0e0] text-sm">
              I have read and agree to the{' '}
              <Link href="/legal/privacy-policy" className="text-[#fc2857] underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          {/* Niche wale checkboxes – Terms & Conditions */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                agreedTerms ? 'bg-green-500 border-green-500' : 'border-[#fc2857]'
              }`}
              onClick={() => setAgreedTerms(!agreedTerms)}
            >
              {agreedTerms && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>
            <span className="text-[#e0e0e0] text-sm">
              I have read and agree to the{' '}
              <Link href="/legal/terms" className="text-[#fc2857] underline">
                Terms & Conditions
              </Link>
            </span>
          </label>

          {/* Upar wala main checkbox – disabled jab tak niche dono ticked na ho */}
          <div className="flex items-center gap-3 mt-8">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!agreedPrivacy || !agreedTerms}
              className={`w-6 h-6 accent-[#fc2857] cursor-pointer ${
                !agreedPrivacy || !agreedTerms ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <label htmlFor="agree" className="text-sm text-[#e0e0e0] leading-tight">
              I agree to the Terms & Conditions and Privacy Policy of MONiA.
            </label>
          </div>

          {(!agreedPrivacy || !agreedTerms) && (
            <p className="text-xs text-[#fc2857] text-center mt-2">
              Please read and agree to both Privacy Policy and Terms & Conditions
            </p>
          )}

          {/* Agree & Continue button */}
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
        </div>
      </div>
    </main>
  );
}
