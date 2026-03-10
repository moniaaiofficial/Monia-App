import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    city: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validations, setValidations] = useState({
    passwordLength: false,
    passwordMatch: false,
    emailValid: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setValidations(prev => ({
        ...prev,
        passwordLength: value.length >= 6,
        passwordMatch: value === formData.confirmPassword && value.length > 0,
      }));
    }

    if (name === 'confirmPassword') {
      setValidations(prev => ({
        ...prev,
        passwordMatch: value === formData.password && value.length > 0,
      }));
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setValidations(prev => ({
        ...prev,
        emailValid: emailRegex.test(value),
      }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (!formData.mobileNumber.trim()) {
      setError('Mobile number is required');
      setLoading(false);
      return;
    }

    if (!validations.passwordLength) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!validations.passwordMatch) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!validations.emailValid) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            mobile_number: formData.mobileNumber.trim(),
            city: formData.city.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('This email is already registered. Please login instead.');
        } else {
          setError(authError.message || 'Failed to create account');
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        setSuccess('Account created successfully! Please check your email for verification.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    formData.fullName.trim() &&
    validations.emailValid &&
    formData.mobileNumber.trim() &&
    validations.passwordLength &&
    validations.passwordMatch;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12 bg-[#0f0102]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">MONiA</h1>
          <p className="text-[#e0e0e0]">Create your account</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
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
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your mobile number"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                City *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Password * {validations.passwordLength && <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#e0e0e0] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#e0e0e0] mb-2">
                Confirm Password *
                {formData.password && !validations.passwordMatch && formData.confirmPassword && (
                  <XCircle className="inline w-4 h-4 text-red-500 ml-2" />
                )}
                {validations.passwordMatch && formData.confirmPassword && (
                  <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />
                )}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#e0e0e0] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full py-4 bg-[#fc2857] text-white font-semibold rounded-lg hover:bg-[#e01f4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="text-center mt-5">
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
