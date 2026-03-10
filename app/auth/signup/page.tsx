'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react'; // Lucide icons already available in your project

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Metadata save kar rahe hain auth.users mein (future use ke liye)
          data: {
            full_name: formData.fullName,
            mobile_number: formData.mobileNumber,
            city: formData.city,
          },
          // Verification link click pe redirect dashboard pe
          emailRedirectTo: window.location.origin + '/app',
        },
      });

      if (authError) throw authError;

      // Manually profiles table mein row insert kar rahe hain (authenticated context mein chalega)
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,  // auth.users.id se match
            full_name: formData.fullName,
            email: formData.email,
            mobile_number: formData.mobileNumber,
            city: formData.city,
          });

        if (profileError) {
          console.error('Profile insert error:', profileError);
          throw profileError;
        }
      }

      alert('Check your email for verification! Click the link to confirm your account.');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      console.error('Signup error details:', err);
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

            {/* Password with show/hide */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] pr-12"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[42px] text-[#ffeb3b] hover:text-[#ffea00] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Password with show/hide */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] pr-12"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-[42px] text-[#ffeb3b] hover:text-[#ffea00] transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
