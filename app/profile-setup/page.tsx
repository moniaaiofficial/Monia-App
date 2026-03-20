'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Phone, MapPin, Loader2 } from 'lucide-react';

export default function ProfileSetupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [mobile,   setMobile]   = useState('');
  const [city,     setCity]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && user) {
      if ((user.publicMetadata as any)?.profile_complete) {
        router.push('/dashboard');
        return;
      }
      // Pre-fill suggestion from name
      const first = user.firstName?.toLowerCase() || '';
      const last  = user.lastName?.toLowerCase()  || '';
      if (first) setUsername(first + (last ? `_${last}` : ''));
    }
  }, [isLoaded, user, router]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip any @ the user tries to type so it stays clean
    setUsername(e.target.value.replace(/^@+/, '').replace(/@/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_.–-]+$/.test(cleanUsername)) { setError('Username can only contain letters, numbers, underscores, dots or dashes'); return; }
    if (!mobile.trim()) { setError('Mobile number is required'); return; }
    if (!city.trim()) { setError('City is required'); return; }

    setError('');
    setLoading(true);

    console.log(`📝 [Profile Setup] Submitting profile for user ${user.id}:`, {
      username: cleanUsername,
      mobile: mobile.trim(),
      city: city.trim(),
      full_name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress,
    });

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:   user.id,
          username: cleanUsername,
          mobile:   mobile.trim(),
          city:     city.trim(),
          full_name:  user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email:      user.primaryEmailAddress?.emailAddress || '',
          avatar_url: user.imageUrl || '',
        }),
      });

      console.log(`📤 [Profile Setup] Server response: ${response.status}`);
      const data = await response.json();
      console.log(`📤 [Profile Setup] Response data:`, data);

      if (response.ok) {
        console.log(`✅ [Profile Setup] Profile saved successfully`);
        await user.reload();
        console.log(`✅ [Profile Setup] Clerk user reloaded`);
        router.push('/dashboard');
      } else {
        const errorMsg = data.error || 'Failed to save profile';
        console.error(`❌ [Profile Setup] Save failed:`, errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      console.error('❌ [Profile Setup] Exception:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#06000c' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c6ff33' }} />
      </main>
    );
  }

  const iconStyle = { color: 'rgba(255,255,255,0.28)' };
  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none';

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 page-enter" style={{ background: '#06000c' }}>
      <div className="w-full max-w-sm space-y-7">
        <div className="text-center space-y-2">
          <h1 className="font-black text-white logo-glow" style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}>
            MONiA
          </h1>
          <p className="text-base font-bold text-white">Complete your profile</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>
            Just a few more details to get started
          </p>
        </div>

        {/* Avatar from Google */}
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

          {/* Username with fixed @ prefix */}
          <div className="relative flex items-center">
            <span
              style={{
                position: 'absolute', left: 16, fontSize: 15, fontWeight: 700,
                color: '#c6ff33', pointerEvents: 'none', zIndex: 1, userSelect: 'none',
              }}
            >
              @
            </span>
            <input
              ref={usernameRef}
              type="text"
              placeholder="your_username"
              value={username}
              onChange={handleUsernameChange}
              className="glass-input py-3.5 text-sm font-medium"
              style={{ paddingLeft: 36 }}
              required
              autoComplete="off"
              autoCapitalize="none"
            />
          </div>

          {/* Mobile */}
          <div className="relative">
            <Phone className={iconClass} style={iconStyle} />
            <input
              type="tel"
              placeholder="Mobile Number (mandatory)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="glass-input pl-11 pr-4 py-3.5 text-sm font-medium"
              required
            />
          </div>

          {/* City */}
          <div className="relative">
            <MapPin className={iconClass} style={iconStyle} />
            <input
              type="text"
              placeholder="City (mandatory)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="glass-input pl-11 pr-4 py-3.5 text-sm font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
            style={{ color: '#06000c' }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Continue to MONiA →'}
          </button>
        </form>
      </div>
    </main>
  );
}
