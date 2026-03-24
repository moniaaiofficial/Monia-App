'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, LogOut, Loader2, Check, Share2, Camera,
} from 'lucide-react';
import { getInitials } from '@/lib/chat';
import { useMyProfile } from '@/lib/profile-context';

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  city: string | null;
  avatar_url: string | null;
  hide_phone: boolean;
  hide_city: boolean;
  hide_full_name: boolean;
  sleep_mode_enabled: boolean;
  sleep_start: string;
  sleep_end: string;
};

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? '#c6ff33' : 'rgba(255,255,255,0.12)',
        position: 'relative',
        transition: 'background 0.2s',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: value ? '#06000c' : 'rgba(255,255,255,0.55)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { refreshMyProfile } = useMyProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const [editUsername, setEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/profile/get');
        const json = await res.json();

        if (res.ok && json.data) {
          const data = json.data;
          console.log('[Profile] Loaded from server:', { id: data.id, username: data.username, mobile: data.mobile, city: data.city });
          const p: Profile = {
            ...data,
            hide_phone: data.hide_phone ?? false,
            hide_city: data.hide_city ?? false,
            hide_full_name: data.hide_full_name ?? false,
            sleep_mode_enabled: data.sleep_mode_enabled ?? false,
            sleep_start: data.sleep_start || '20:00',
            sleep_end: data.sleep_end || '07:00',
          };
          setProfile(p);
          setNewUsername(p.username || '');
        } else if (res.status === 404) {
          console.warn('[Profile] No profile found — creating from Clerk metadata');
          const createRes = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              full_name: user.fullName || '',
              username: (user.username as string) || (user.publicMetadata as any)?.username || `user_${user.id.slice(-6)}`,
              avatar_url: user.imageUrl || '',
              mobile: (user.publicMetadata as any)?.mobile || null,
              city: (user.publicMetadata as any)?.city || null,
            }),
          });
          const createJson = await createRes.json();
          if (createRes.ok && createJson.data) {
            const data = createJson.data;
            const p: Profile = {
              ...data,
              hide_phone: data.hide_phone ?? false,
              hide_city: data.hide_city ?? false,
              hide_full_name: data.hide_full_name ?? false,
              sleep_mode_enabled: data.sleep_mode_enabled ?? false,
              sleep_start: data.sleep_start || '20:00',
              sleep_end: data.sleep_end || '07:00',
            };
            setProfile(p);
            setNewUsername(p.username || '');
          } else {
            setError('Could not load profile. Please try again.');
          }
        } else {
          console.error('[Profile] Server error:', json.error);
          setError(json.error || 'Failed to load profile');
        }
      } catch (err) {
        console.error('[Profile] Exception:', err);
        setError('Network error — please refresh');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user]);

  const saveProfile = async (patch: Partial<Profile>) => {
    if (!user || !profile) return;
    setSaving(true);
    setError('');

    const optimistic = { ...profile, ...patch };
    setProfile(optimistic);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...patch }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save');
        setProfile({ ...profile });
      } else {
        if (data.data) setProfile(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch {
      setError('Network error');
      setProfile({ ...profile });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    const username = newUsername.trim().replace(/^@/, '');
    if (username.length < 3) { setError('At least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Letters, numbers, underscores only'); return; }
    await saveProfile({ username });
    setEditUsername(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }

    setAvatarUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Avatar upload failed');
    } else {
      setProfile((p) => p ? { ...p, avatar_url: data.avatarUrl } : p);
      await refreshMyProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }

    setAvatarUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleShare = () => {
    const url = 'https://monia-app.vercel.app/';
    const text = `Hey, I'm using MONiA — an AI-powered messaging app. Come connect with me! 🤙`;
    if (typeof navigator.share === 'function') {
      navigator.share({ title: 'Join me on MONiA', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => alert('Link copied to clipboard!'));
    }
  };

  if (loading || !isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#06000c' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c6ff33' }} />
      </main>
    );
  }

  const displayName = profile?.full_name || user?.fullName || 'MONiA User';
  const avatarUrl = profile?.avatar_url || user?.imageUrl;
  const initials = getInitials(displayName);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 2,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: 500,
  };

  return (
    <main className="min-h-screen page-enter pb-10" style={{ background: '#06000c' }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(198,255,51,0.08)' }}
      >
        <div className="flex items-center px-5 py-4 gap-3">
          <button onClick={() => router.back()} style={{ color: '#c6ff33' }}>
            <ArrowLeft style={{ width: 22, height: 22 }} />
          </button>
          <h1 className="text-lg font-black text-white">Profile</h1>
          <div className="ml-auto flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#c6ff33' }} />}
            {saveSuccess && <Check className="w-4 h-4" style={{ color: '#c6ff33' }} />}
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* ── Avatar + Name ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(198,255,51,0.35)' }}
              />
            ) : (
              <div
                style={{
                  width: 84, height: 84, borderRadius: '50%',
                  background: 'rgba(198,255,51,0.10)', border: '2px solid rgba(198,255,51,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: '#c6ff33',
                }}
              >
                {initials}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: '#c6ff33', border: '2px solid #06000c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {avatarUploading
                ? <Loader2 style={{ width: 13, height: 13, color: '#06000c', animation: 'spin 1s linear infinite' }} />
                : <Camera style={{ width: 13, height: 13, color: '#06000c' }} />
              }
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p className="text-xl font-black text-white">{displayName}</p>
            <p style={{ color: '#c6ff33', fontSize: 14, fontWeight: 600, marginTop: 2 }}>
              @{profile?.username || '—'}
            </p>
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="glass-card px-4 py-3 text-sm" style={{ color: '#ff6b6b' }}>{error}</div>
        )}

        {/* ── Info ────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>Account Info</p>

          {/* Username */}
          <div style={rowStyle}>
            <div>
              <p style={labelStyle}>Username</p>
              {editUsername ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ color: '#c6ff33', fontWeight: 700 }}>@</span>
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    autoFocus
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(198,255,51,0.4)',
                      borderRadius: 10, padding: '6px 10px', color: '#fff', fontSize: 14, outline: 'none', width: 140,
                    }}
                  />
                  <button onClick={handleSaveUsername} style={{ color: '#c6ff33', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => { setEditUsername(false); setNewUsername(profile?.username || ''); }} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <p style={valueStyle}>@{profile?.username || '—'}</p>
              )}
            </div>
            {!editUsername && (
              <button onClick={() => setEditUsername(true)} style={{ color: '#c6ff33', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
            )}
          </div>

          <div style={rowStyle}>
            <div>
              <p style={labelStyle}>Full Name</p>
              <p style={valueStyle}>{profile?.full_name || user?.fullName || '—'}</p>
            </div>
          </div>

          <div style={rowStyle}>
            <div>
              <p style={labelStyle}>Email</p>
              <p style={valueStyle}>{profile?.email || user?.primaryEmailAddress?.emailAddress || '—'}</p>
            </div>
          </div>

          <div style={rowStyle}>
            <div>
              <p style={labelStyle}>Mobile</p>
              <p style={valueStyle}>{profile?.mobile || '—'}</p>
            </div>
          </div>

          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <div>
              <p style={labelStyle}>City</p>
              <p style={valueStyle}>{profile?.city || '—'}</p>
            </div>
          </div>
        </div>

        {/* ── Privacy ─────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>Privacy</p>

          {[
            { key: 'hide_full_name' as const, label: 'Hide full name from others' },
            { key: 'hide_phone'     as const, label: 'Hide mobile number' },
            { key: 'hide_city'      as const, label: 'Hide city' },
          ].map(({ key, label }) => (
            <div key={key} style={rowStyle}>
              <p style={{ color: '#ffffff', fontSize: 14 }}>{label}</p>
              <Toggle
                value={profile?.[key] ?? false}
                onChange={(v) => saveProfile({ [key]: v })}
                disabled={saving || !profile}
              />
            </div>
          ))}
        </div>

        {/* ── Sleep Mode ──────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>Sleep Mode 🌙</p>

          <div style={rowStyle}>
            <div>
              <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 500 }}>Enable Sleep Mode</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                Delay notifications during sleep hours
              </p>
            </div>
            <Toggle
              value={profile?.sleep_mode_enabled ?? false}
              onChange={(v) => saveProfile({ sleep_mode_enabled: v })}
              disabled={saving || !profile}
            />
          </div>

          {profile?.sleep_mode_enabled && (
            <div style={{ display: 'flex', gap: 16, paddingTop: 8, paddingBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={labelStyle}>Sleep from</p>
                <input
                  type="time"
                  value={profile.sleep_start}
                  onChange={(e) => setProfile((p) => p ? { ...p, sleep_start: e.target.value } : p)}
                  onBlur={() => saveProfile({ sleep_start: profile.sleep_start })}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', colorScheme: 'dark',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={labelStyle}>Wake at</p>
                <input
                  type="time"
                  value={profile.sleep_end}
                  onChange={(e) => setProfile((p) => p ? { ...p, sleep_end: e.target.value } : p)}
                  onBlur={() => saveProfile({ sleep_end: profile.sleep_end })}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', colorScheme: 'dark',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Share MONiA ─────────────────────────────────────────── */}
        <button
          onClick={handleShare}
          style={{
            width: '100%', borderRadius: 16, padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(198,255,51,0.08)', border: '1px solid rgba(198,255,51,0.25)',
            color: '#c6ff33', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          <Share2 style={{ width: 18, height: 18 }} />
          Share MONiA
        </button>

        {/* ── Logout ──────────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', borderRadius: 16, padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)',
            color: '#ff3b30', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          <LogOut style={{ width: 18, height: 18 }} />
          Log Out
        </button>
      </div>
    </main>
  );
}
