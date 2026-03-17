
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AtSign, Phone, MapPin, Loader2 } from 'lucide-react';

export default function ProfileSetupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState({ username: '', mobile: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.profile_complete) {
      router.push('/dashboard');
    }
  }, [isLoaded, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user.id }),
      });

      if (response.ok) {
        await user.reload(); // Reload the user to get the latest metadata
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#06000c' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c6ff33' }} />
      </main>
    );
  }

  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none';
  const iconStyle = { color: 'rgba(255,255,255,0.28)' };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 page-enter" style={{ background: '#06000c' }}>
      <div className="w-full max-w-sm space-y-7">
        <div className="text-center space-y-2">
          <h1 className="font-black text-white logo-glow" style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}>
            MONiA
          </h1>
          <p className="text-base font-bold text-white">Set up your profile</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>
            Choose your username to get started
          </p>
        </div>

        {user?.imageUrl && (
          <div className="flex justify-center">
            <img
              src={user.imageUrl}
              alt="Profile"
              style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(198,255,51,0.35)', objectFit: 'cover' }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="glass-card px-4 py-3 text-sm font-medium" style={{ color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          <div className="relative">
            <AtSign className={iconClass} style={iconStyle} />
            <input
              type="text"
              placeholder="Username (e.g. john_doe)"
              value={formData.username}
              onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
              className="glass-input pl-11 pr-4 py-3.5 text-sm font-medium"
              required
              autoComplete="off"
            />
          </div>

          <div className="relative">
            <Phone className={iconClass} style={iconStyle} />
            <input
              type="tel"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))}
              className="glass-input pl-11 pr-4 py-3.5 text-sm font-medium"
              required
            />
          </div>

          <div className="relative">
            <MapPin className={iconClass} style={iconStyle} />
            <input
              type="text"
              placeholder="City (optional)"
              value={formData.city}
              onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
              className="glass-input pl-11 pr-4 py-3.5 text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
            style={{ color: '#06000c' }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying & Saving...</> : 'Continue to MONiA'}
          </button>
        </form>
      </div>
    </main>
  );
}
