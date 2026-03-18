'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AtSign, Phone, MapPin, User, Moon, LogOut, Loader2, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getInitials } from '@/lib/chat';

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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? '#c6ff33' : 'rgba(255,255,255,0.12)',
        position: 'relative',
        transition: 'background 0.2s',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const [editUsername, setEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          ...data,
          sleep_start: data.sleep_start || '20:00',
          sleep_end: data.sleep_end || '07:00',
          hide_phone: data.hide_phone ?? false,
          hide_city: data.hide_city ?? false,
          hide_full_name: data.hide_full_name ?? false,
          sleep_mode_enabled: data.sleep_mode_enabled ?? false,
        });
        setNewUsername(data.username || '');
      }
      setLoading(false);
    })();
  }, [isLoaded, user]);

  const saveProfile = async (patch: Partial<Profile>) => {
    if (!user || !profile) return;
    setSaving(true);
    setError('');

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...patch }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to save');
    } else {
      setProfile((p) => p ? { ...p, ...patch } : p);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setSaving(false);
  };

  const handleSaveUsername = async () => {
    const username = newUsername.trim().replace(/^@/, '');
    if (username.length < 3) { setError('At least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Letters, numbers, underscores only'); return; }
    await saveProfile({ username });
    setEditUsername(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
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
          {saving && <Loader2 className="w-4 h-4 animate-spin ml-auto" style={{ color: '#c6ff33' }} />}
          {saveSuccess && <Check className="w-4 h-4 ml-auto" style={{ color: '#c6ff33' }} />}
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* ── Avatar + Name ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
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
          <div style={{ textAlign: 'center' }}>
            <p className="text-xl font-black text-white">{displayName}</p>
            <p style={{ color: '#c6ff33', fontSize: 14, fontWeight: 600, marginTop: 2 }}>
              @{profile?.username || 'no-username'}
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
                  <button onClick={handleSaveUsername} style={{ color: '#c6ff33', fontWeight: 700, fontSize: 13 }}>Save</button>
                  <button onClick={() => { setEditUsername(false); setNewUsername(profile?.username || ''); }} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Cancel</button>
                </div>
              ) : (
                <p style={valueStyle}>@{profile?.username || '—'}</p>
              )}
            </div>
            {!editUsername && (
              <button onClick={() => setEditUsername(true)} style={{ color: '#c6ff33', fontSize: 13, fontWeight: 600 }}>Edit</button>
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
            { key: 'hide_city'     as const, label: 'Hide city' },
          ].map(({ key, label }) => (
            <div key={key} style={rowStyle}>
              <p style={{ color: '#ffffff', fontSize: 14 }}>{label}</p>
              <Toggle
                value={profile?.[key] ?? false}
                onChange={(v) => saveProfile({ [key]: v })}
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

        {/* ── Logout ──────────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="btn-neon w-full rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-sm"
          style={{ color: '#06000c' }}
        >
          <LogOut style={{ width: 18, height: 18 }} />
          Logout
        </button>

        <div className="text-center space-y-1 pb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="text-xs font-semibold">MONiA v1.9.0</p>
          <a href="mailto:moniaaiofficial@gmail.com" style={{ color: '#c6ff33', fontSize: 12 }}>
            moniaaiofficial@gmail.com
          </a>
        </div>
      </div>
    </main>
  );
}
