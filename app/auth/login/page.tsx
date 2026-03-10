'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [showPassword, setShowPassword] = useState(false);

// ✅ Check existing session
useEffect(() => {
const checkSession = async () => {
const { data } = await supabase.auth.getSession();

  if (data.session) {
    router.push('/app');
  }
};

checkSession();

}, [router]);

const handleEmailLogin = async (e: React.FormEvent) => {
e.preventDefault();

setLoading(true);
setError('');

try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    router.push('/app');
  }
} catch (err: any) {
  setError(err.message || 'Login failed');
} finally {
  setLoading(false);
}

};

const handleGoogleLogin = async () => {
setLoading(true);
setError('');

try {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
} catch (err: any) {
  setError(err.message || 'Google login failed');
  setLoading(false);
}

};

return (
<main className="flex min-h-screen items-center justify-center px-6 bg-[#0f0102]">
<div className="w-full max-w-md space-y-8">

    <div className="text-center">
      <h1 className="text-5xl font-bold text-white mb-2">MONiA</h1>
      <p className="text-[#e0e0e0]">Welcome back</p>
    </div>

    <form onSubmit={handleEmailLogin} className="space-y-6">

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-[#e0e0e0] mb-2">Email</label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white"
          placeholder="Enter your email"
        />
      </div>

      <div className="relative">

        <label className="block text-sm text-[#e0e0e0] mb-2">
          Password
        </label>

        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white pr-12"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-[42px] text-yellow-400"
        >
          {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
        </button>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#fc2857] text-white rounded-lg"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div className="text-center text-sm text-[#e0e0e0]">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-[#fc2857]">
          Create account
        </Link>
      </div>

    </form>

    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full py-4 border-2 border-[#fc2857] text-white rounded-lg"
    >
      Continue with Google
    </button>

  </div>
</main>

);
}
