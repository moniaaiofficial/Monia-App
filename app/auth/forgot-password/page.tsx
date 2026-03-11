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
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setStep('code');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError('Failed to send reset code. Please try again.');
      }
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
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError('Invalid code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn.resetPassword({
        password,
      });

      if (result.status === 'complete') {
        router.push('/auth/login?reset=success');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-[#fc2857]/20 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-[#fc2857]" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">MONiA</h1>
              <h2 className="text-xl text-white mb-2">Forgot Password?</h2>
              <p className="text-[#e0e0e0]">
                Enter your email address and we&apos;ll send you a reset code.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#fc2857] hover:bg-[#e01f4a] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          </>
        );

      case 'code':
        return (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-[#fc2857]/20 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="w-8 h-8 text-[#fc2857]" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">MONiA</h1>
              <h2 className="text-xl text-white mb-2">Enter Reset Code</h2>
              <p className="text-[#e0e0e0]">
                We sent a code to
                <span className="block text-[#fc2857] font-medium mt-1">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-4 bg-transparent border border-[#fc2857] rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                maxLength={6}
                required
              />

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
                  'Verify Code'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-[#e0e0e0] hover:text-white transition-colors"
              >
                Try a different email
              </button>
            </form>
          </>
        );

      case 'password':
        return (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-[#fc2857]/20 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-[#fc2857]" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">MONiA</h1>
              <h2 className="text-xl text-white mb-2">Set New Password</h2>
              <p className="text-[#e0e0e0]">Create a strong password for your account.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#fc2857] hover:bg-[#e01f4a] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f0102] px-4">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-[#e0e0e0] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to login
        </Link>

        {renderStep()}
      </div>
    </main>
  );
}
