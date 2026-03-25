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
    fullName: '', username: '', email: '',
    mobile: '', city: '', password: '', confirmPassword: '',
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (formData.username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_.–-]+$/.test(formData.username)) { setError('Username can only contain letters, numbers, underscores, dots or dashes'); return; }

    setLoading(true);
    setError('');
    try {
      const nameParts = formData.fullName.trim().split(' ');
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        username: formData.username,
        // Store in unsafeMetadata during signup — will be moved to publicMetadata via profile-setup
        unsafeMetadata: { 
          mobile: formData.mobile, 
          city: formData.city,
          profile_complete: false,
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      sessionStorage.setItem('signupData', JSON.stringify({ email: formData.email, username: formData.username }));
      router.push('/auth/verify-email');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to create account. Please try again.');
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
        redirectUrlComplete: '/profile-setup',
      });
    } catch (err: any) {
      setError('Failed to sign up with Google. Please try again.');
    }
  };

  const iconStyle = { color: 'rgba(255,255,255,0.28)' };
  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none';
  const inputClass = 'glass-input pl-11 pr-4 py-3.5 text-sm font-medium';

  return (
    <main
      className="min-h-screen flex items-center justify-center px-5 py-10 page-enter"
      style={{ background: '#14141f' }}
    >
      <div className="w-full max-w-sm space-y-7">
        <div className="text-center space-y-2">
          <h1
            className="font-black text-white logo-glow"
            style={{ fontSize: '3.75rem', letterSpacing: '-0.03em' }}
          >
            MONiA
          </h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.42)' }}>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="glass-card px-4 py-3 text-sm font-medium" style={{ color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          <div className="relative">
            <User className={iconClass} style={iconStyle} />
            <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className={inputClass} required />
          </div>
          <div className="relative">
            <AtSign className={iconClass} style={iconStyle} />
            <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} className={inputClass} required />
          </div>
          <div className="relative">
            <Mail className={iconClass} style={iconStyle} />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputClass} required />
          </div>
          <div className="relative">
            <Phone className={iconClass} style={iconStyle} />
            <input type="tel" name="mobile" placeholder="Mobile Number (mandatory)" value={formData.mobile} onChange={handleChange} className={inputClass} required />
          </div>
          <div className="relative">
            <MapPin className={iconClass} style={iconStyle} />
            <input type="text" name="city" placeholder="City (mandatory)" value={formData.city} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="relative">
            <Lock className={iconClass} style={iconStyle} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={handleChange}
              className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium"
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.28)' }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className={iconClass} style={iconStyle} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="glass-input pl-11 pr-12 py-3.5 text-sm font-medium"
              required
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.28)' }}>
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
            style={{ color: '#14141f' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
            ) : 'Create Account'}
          </button>

          <p className="text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>
            or continue with
          </p>

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

        <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold hover:opacity-80 transition-opacity"
            style={{ color: '#ff0066' }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
