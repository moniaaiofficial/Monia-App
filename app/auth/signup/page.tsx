'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    city: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Signup successful, redirect user
      router.push('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12 bg-[#0f0102]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">MONiA</h1>
          <p className="text-[#e0e0e0]">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Mobile Number *
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                placeholder="Enter your mobile number"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#fc2857] text-white font-semibold rounded-lg hover:bg-[#e01f4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="text-center">
            <p className="text-[#e0e0e0] text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#fc2857] hover:underline font-semibold">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
