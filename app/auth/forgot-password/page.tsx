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

  const [step,                setStep]                = useState<Step>('email');
  const [email,               setEmail]               = useState('');
  const [code,                setCode]                = useState('');
  const [password,            setPassword]            = useState('');
  const [confirmPassword,     setConfirmPassword]     = useState('');
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true); setError('');
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
      setStep('code');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to send reset code. Please try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true); setError('');
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code });
      if (result.status === 'needs_new_password') setStep('password');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid code. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const result = await signIn.resetPassword({ password });
      if (result.status === 'complete') router.push('/auth/login?reset=success');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to reset password. Please try again.');
    } finally { setLoading(false); }
  };

  const iconStyle = { color: 'rgba(255,255,255,0.28)' };
  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none';
  const inputClass = 'glass-input pl-11 pr-4 py-3.5 text-sm font-medium';

  const neonIcon = { color: '#c6ff33' };

  const renderStep = () => {
    if (step === 'email') return (
      <>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto tilt-target"
            style={{ background: 'rgba(198,255,51,0.08)' }}>
            <Mail className="w-8 h-8 icon-active-glow" style={neonIcon} />
          </div>
          <h1 className="font-black text-white logo-glow" style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}>MONiA</h1>
          <div>
            <h2 className="text-lg font-bold text-white">Forgot Password?</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>Enter your email and we&apos;ll send a reset code.</p>
          </div>
        </div>
        <form onSubmit={handleSendCode} className="space-y-4">
          {error && <div className="glass-card px-4 py-3 text-sm font-medium" style={{ color: '#ff6b6b' }}>{error}</div>}
          <div className="relative">
            <Mail className={iconClass} style={iconStyle} />
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          </div>
          <button type="submit" disabled={loading} className="btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2" style={{ color: '#06000c' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : 'Send Reset Code'}
          </button>
        </form>
      </>
    );

    if (step === 'code') return (
      <>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto tilt-target"
            style={{ background: 'rgba(198,255,51,0.08)' }}>
            <KeyRound className="w-8 h-8 icon-active-glow" style={neonIcon} />
          </div>
          <h1 className="font-black text-white logo-glow" style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}>MONiA</h1>
          <div>
            <h2 className="text-lg font-bold text-white">Enter Reset Code</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
              We sent a code to <span className="font-semibold" style={{ color: '#c6ff33' }}>{email}</span>
            </p>
          </div>
        </div>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          {error && <div className="glass-card px-4 py-3 text-sm font-medium" style={{ color: '#ff6b6b' }}>{error}</div>}
          <input type="text" placeholder="• • • • • •" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="glass-input px-4 py-5 text-center text-3xl font-black tracking-[0.5em]" maxLength={6} required />
          <button type="submit" disabled={loading || code.length !== 6} className="btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2" style={{ color: '#06000c' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</> : 'Verify Code'}
          </button>
          <button type="button" onClick={() => setStep('email')} className="w-full text-sm font-medium py-2 transition-colors" style={{ color: 'rgba(255,255,255,0.32)' }}>
            Try a different email
          </button>
        </form>
      </>
    );

    return (
      <>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto tilt-target"
            style={{ background: 'rgba(198,255,51,0.08)' }}>
            <Lock className="w-8 h-8 icon-active-glow" style={neonIcon} />
          </div>
          <h1 className="font-black text-white logo-glow" style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}>MONiA</h1>
          <div>
            <h2 className="text-lg font-bold text-white">Set New Password</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>Create a strong password for your account.</p>
          </div>
        </div>
        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && <div className="glass-card px-4 py-3 text-sm font-medium" style={{ color: '#ff6b6b' }}>{error}</div>}
          <div className="relative">
            <Lock className={iconClass} style={iconStyle} />
            <input type={showPassword ? 'text' : 'password'} placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium" required minLength={8} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className={iconClass} style={iconStyle} />
            <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium" required />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2" style={{ color: '#06000c' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting…</> : 'Reset Password'}
          </button>
        </form>
      </>
    );
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-5 py-10 page-enter"
      style={{ background: '#06000c' }}
    >
      <div className="w-full max-w-sm space-y-8">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.38)' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
        {renderStep()}
      </div>
    </main>
  );
}
