'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordPage() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError('');

    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
      setStep('code');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.errors?.[0]?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });
      if (result.status === 'needs_new_password') {
        setStep('password');
      }
    } catch (err: any) {
      console.error('Code verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    setError('');

    try {
      const result = await signIn.resetPassword({ password });
      if (result.status === 'complete') {
        router.push('/auth/login?reset=success');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.errors?.[0]?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4 pointer-events-none';
  const inputClass = 'glass-input pl-11 pr-4 py-3.5 text-sm font-medium';

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#ff1e43]/10 flex items-center justify-center mx-auto shadow-glow">
                <Mail className="w-8 h-8 text-[#ff1e43] icon-active-glow" />
              </div>
              <h1 className="text-5xl font-black text-white logo-glow">MONiA</h1>
              <div>
                <h2 className="text-lg font-bold text-white">Forgot Password?</h2>
                <p className="text-white/40 text-sm mt-1">Enter your email and we&apos;ll send a reset code.</p>
              </div>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              {error && <div className="glass-card px-4 py-3 text-sm text-red-400 font-medium">{error}</div>}
              <div className="relative">
                <Mail className={iconClass} />
                <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
              </div>
              <button type="submit" disabled={loading} className="btn-glow w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : 'Send Reset Code'}
              </button>
            </form>
          </>
        );

      case 'code':
        return (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#ff1e43]/10 flex items-center justify-center mx-auto shadow-glow">
                <KeyRound className="w-8 h-8 text-[#ff1e43] icon-active-glow" />
              </div>
              <h1 className="text-5xl font-black text-white logo-glow">MONiA</h1>
              <div>
                <h2 className="text-lg font-bold text-white">Enter Reset Code</h2>
                <p className="text-white/40 text-sm mt-1">
                  We sent a code to <span className="text-[#ff1e43] font-semibold">{email}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              {error && <div className="glass-card px-4 py-3 text-sm text-red-400 font-medium">{error}</div>}
              <input type="text" placeholder="• • • • • •" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="glass-input px-4 py-5 text-center text-3xl font-black tracking-[0.5em]" maxLength={6} required />
              <button type="submit" disabled={loading || code.length !== 6} className="btn-glow w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : 'Verify Code'}
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-white/35 hover:text-white transition-colors text-sm font-medium py-2">
                Try a different email
              </button>
            </form>
          </>
        );

      case 'password':
        return (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#ff1e43]/10 flex items-center justify-center mx-auto shadow-glow">
                <Lock className="w-8 h-8 text-[#ff1e43] icon-active-glow" />
              </div>
              <h1 className="text-5xl font-black text-white logo-glow">MONiA</h1>
              <div>
                <h2 className="text-lg font-bold text-white">Set New Password</h2>
                <p className="text-white/40 text-sm mt-1">Create a strong password for your account.</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && <div className="glass-card px-4 py-3 text-sm text-red-400 font-medium">{error}</div>}
              <div className="relative">
                <Lock className={iconClass} />
                <input type={showPassword ? 'text' : 'password'} placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium" required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Lock className={iconClass} />
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-glow w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : 'Reset Password'}
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#100002] px-5 py-10">
      <div className="w-full max-w-sm space-y-8 page-enter">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
        {renderStep()}
      </div>
    </main>
  );
}
