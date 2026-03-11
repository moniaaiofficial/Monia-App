'use client';

import { useState, useEffect } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from session storage
    const signupData = sessionStorage.getItem('signupData');
    if (signupData) {
      const { email } = JSON.parse(signupData);
      setEmail(email);
    }
  }, []);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        sessionStorage.removeItem('signupData');
        router.push('/app/dashboard');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded || !signUp) return;

    setResending(true);
    setError('');

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      setError('');
    } catch (err: any) {
      console.error('Resend error:', err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f0102] px-4">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 text-[#e0e0e0] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to signup
        </Link>

        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#fc2857]/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-[#fc2857]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">MONiA</h1>
          <h2 className="text-xl text-white mb-2">Verify your email</h2>
          <p className="text-[#e0e0e0]">
            We sent a 6-digit verification code to
            {email && <span className="block text-[#fc2857] font-medium mt-1">{email}</span>}
          </p>
        </div>

        <form onSubmit={verifyCode} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-4 bg-transparent border border-[#fc2857] rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-[#fc2857] hover:bg-[#e01f4a] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          <button
            type="button"
            onClick={resendCode}
            disabled={resending}
            className="w-full py-3 text-[#fc2857] hover:text-[#e01f4a] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Code'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
