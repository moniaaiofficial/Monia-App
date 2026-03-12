'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Lock, AtSign, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    mobile: '',
    city: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName,
        lastName,
        username: formData.username,
        unsafeMetadata: {
          mobile: formData.mobile,
          city: formData.city,
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      sessionStorage.setItem('signupData', JSON.stringify({
        email: formData.email,
        username: formData.username,
      }));

      router.push('/auth/verify-email');
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!isLoaded || !signUp) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/auth/sso-callback',
        redirectUrlComplete: '/app/dashboard',
      });
    } catch (err: any) {
      console.error('Google signup error:', err);
      setError('Failed to sign up with Google. Please try again.');
    }
  };

  const inputClass = 'glass-input pl-11 pr-4 py-3.5 text-sm font-medium';
  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4 pointer-events-none';

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#100002] px-5 py-10">
      <div className="w-full max-w-sm space-y-7 page-enter">
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-black text-white logo-glow">MONiA</h1>
          <p className="text-white/45 text-sm font-medium">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="glass-card px-4 py-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="relative">
            <User className={iconClass} />
            <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="relative">
            <AtSign className={iconClass} />
            <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="relative">
            <Mail className={iconClass} />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="relative">
            <Phone className={iconClass} />
            <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="relative">
            <MapPin className={iconClass} />
            <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="relative">
            <Lock className={iconClass} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium"
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className={iconClass} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium"
              required
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="flex items-center justify-center">
            <span className="text-white/25 text-xs font-medium px-3">or continue with</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full py-4 rounded-2xl font-bold text-gray-900 text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.92)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-center text-white/40 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#ff1e43] font-bold hover:opacity-80 transition-opacity">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
