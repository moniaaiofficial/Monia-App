'use client';

import { useState, useEffect } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [code,      setCode]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState('');
  const [email,     setEmail]     = useState('');

  useEffect(() => {
    const signupData = sessionStorage.getItem('signupData');
    if (signupData) setEmail(JSON.parse(signupData).email);
  }, []);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        sessionStorage.removeItem('signupData');
        // Redirect to profile-setup for email signup (not Google OAuth)
        router.push('/profile-setup');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please try again.');
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
      setError(err.errors?.[0]?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-5 py-10 page-enter"
      style={{ background: '#06000c' }}
    >
      <div className="w-full max-w-sm space-y-8">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to signup
        </Link>

        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto tilt-target"
            style={{ background: 'rgba(198,255,51,0.08)' }}
          >
            <Mail className="w-8 h-8 icon-active-glow" style={{ color: '#c6ff33' }} />
          </div>
          <h1
            className="font-black text-white logo-glow"
            style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}
          >
            MONiA
          </h1>
          <div>
            <h2 className="text-lg font-bold text-white">Verify your email</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
              We sent a 6-digit code to
              {email && (
                <span className="block font-semibold mt-1" style={{ color: '#c6ff33' }}>
                  {email}
                </span>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          {error && (
            <div className="glass-card px-4 py-3 text-sm font-medium" style={{ color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
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
            className="btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ color: '#06000c' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</>
            ) : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={resendCode}
            disabled={resending}
            className="w-full py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ color: '#c6ff33' }}
          >
            {resending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
            ) : 'Resend Code'}
          </button>
        </form>
      </div>
    </main>
  );
}
