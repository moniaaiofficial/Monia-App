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
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });

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
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
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
    <main className="min-h-screen flex items-center justify-center bg-[#100002] px-5 py-10">
      <div className="w-full max-w-sm space-y-8 page-enter">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to signup
        </Link>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#ff1e43]/10 flex items-center justify-center mx-auto shadow-glow">
            <Mail className="w-8 h-8 text-[#ff1e43] icon-active-glow" />
          </div>
          <h1 className="text-5xl font-black text-white logo-glow">MONiA</h1>
          <div>
            <h2 className="text-lg font-bold text-white">Verify your email</h2>
            <p className="text-white/40 text-sm mt-1">
              We sent a 6-digit code to
              {email && <span className="block text-[#ff1e43] font-semibold mt-1">{email}</span>}
            </p>
          </div>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          {error && (
            <div className="glass-card px-4 py-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="• • • • • •"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="glass-input px-4 py-5 text-center text-3xl font-black tracking-[0.5em]"
            maxLength={6}
            required
          />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-glow w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
            className="w-full py-3 text-[#ff1e43] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-40"
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
