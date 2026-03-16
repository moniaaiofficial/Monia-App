'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AtSign, Phone, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ProfileSetupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState({ username: '', mobile: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  /* ── If user already has username, skip to dashboard ───────── */
  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, mobile')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.username) {
        router.replace('/app/dashboard');
        return;
      }

      /* Pre-fill mobile if available */
      if (data?.mobile) setFormData((p) => ({ ...p, mobile: data.mobile }));
      setChecking(false);
    })();
  }, [isLoaded, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const username = formData.username.trim().replace(/^@/, '');
    const mobile = formData.mobile.trim();
    const city = formData.city.trim();

    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers and underscores'); return; }
    if (!mobile) { setError('Mobile number is required'); return; }

    setLoading(true);
    setError('');

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const permanentId = `${randomNum}-${user.id}`;

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        username,
        mobile,
        city,
        permanent_id: permanentId,
        full_name: user.fullName || user.firstName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar_url: user.imageUrl || '',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to save profile');
      setLoading(false);
      return;
    }

    router.replace('/app/dashboard');
  };

  if (checking || !isLoaded) {
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

        {/* Avatar preview */}
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
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Setting up…</> : 'Continue to MONiA'}
          </button>
        </form>
      </div>
    </main>
  );
}
