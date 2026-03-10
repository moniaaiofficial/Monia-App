'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      
      setMessage('Password reset link has been sent to your email');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-[#0f0102]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-white hover:text-gray-300">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-center text-white font-bold text-xl">MONiA</h1>
        </div>
        
        <div className="space-y-4">
          <p className="text-lg font-semibold text-white">Forgot Password</p>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-white mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                placeholder="Enter your email"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="text-green-500 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fc2857] text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
