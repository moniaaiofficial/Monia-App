import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { getInitials } from '@/lib/chat';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function DemoProfilePage({ searchParams }: { searchParams: { userId?: string } }) {
  const userId = searchParams.userId ?? 'user_3BCwaqmFmDgvWAoRsQzW0i6fiLE';
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 2 };
  const valueStyle: React.CSSProperties = { fontSize: 15, color: '#ffffff', fontWeight: 500 };

  if (!profile) return <div style={{ background: '#06000c', minHeight: '100vh', color: '#fff', padding: 24 }}>Profile not found</div>;

  const displayName = profile.full_name || 'MONiA User';
  const initials = getInitials(displayName);

  return (
    <main style={{ background: '#06000c', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(198,255,51,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 12 }}>
          <Link href="/demo" style={{ color: '#c6ff33', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>←</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Profile</h1>
          <div style={{ marginLeft: 'auto', background: 'rgba(198,255,51,0.12)', borderRadius: 8, padding: '3px 10px' }}>
            <span style={{ color: '#c6ff33', fontSize: 10, fontWeight: 700 }}>LIVE FROM SUPABASE</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Avatar + Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(198,255,51,0.35)' }} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(198,255,51,0.10)', border: '2px solid rgba(198,255,51,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#c6ff33' }}>
              {initials}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 21, fontWeight: 900, color: '#fff' }}>{displayName}</p>
            <p style={{ color: '#c6ff33', fontSize: 14, fontWeight: 600, marginTop: 2 }}>@{profile.username || '—'}</p>
          </div>
        </div>

        {/* Info */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.30)', marginBottom: 12 }}>Account Info</p>
          <div style={rowStyle}><div><p style={labelStyle}>Full Name</p><p style={valueStyle}>{profile.full_name || '—'}</p></div></div>
          <div style={rowStyle}><div><p style={labelStyle}>Email</p><p style={valueStyle}>{profile.email || '—'}</p></div></div>
          <div style={rowStyle}><div><p style={labelStyle}>Username</p><p style={valueStyle}>@{profile.username || '—'}</p></div></div>
          <div style={rowStyle}><div><p style={labelStyle}>Mobile</p><p style={valueStyle}>{profile.mobile || '—'}</p></div></div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}><div><p style={labelStyle}>City</p><p style={valueStyle}>{profile.city || '—'}</p></div></div>
        </div>

        {/* Privacy toggles — showing real DB values */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.30)', marginBottom: 12 }}>Privacy (Real values from DB)</p>

          {[
            { key: 'hide_full_name', label: 'Hide full name' },
            { key: 'hide_phone',     label: 'Hide mobile number' },
            { key: 'hide_city',      label: 'Hide city' },
          ].map(({ key, label }) => (
            <div key={key} style={rowStyle}>
              <p style={{ color: '#fff', fontSize: 14 }}>{label}</p>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: (profile as any)[key] ? '#c6ff33' : 'rgba(255,255,255,0.12)',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: 2,
                  left: (profile as any)[key] ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: (profile as any)[key] ? '#06000c' : 'rgba(255,255,255,0.55)',
                }} />
                <span style={{ position: 'absolute', right: (profile as any)[key] ? -45 : -38, top: 2, fontSize: 11, color: (profile as any)[key] ? '#c6ff33' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                  {(profile as any)[key] ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sleep mode */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.30)', marginBottom: 12 }}>Sleep Mode</p>
          <div style={rowStyle}>
            <div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Sleep Mode Enabled</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{profile.sleep_start} → {profile.sleep_end}</p>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: profile.sleep_mode_enabled ? '#c6ff33' : 'rgba(255,255,255,0.12)',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: 2,
                left: profile.sleep_mode_enabled ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: profile.sleep_mode_enabled ? '#06000c' : 'rgba(255,255,255,0.55)',
              }} />
            </div>
          </div>
        </div>

        {/* Other profiles */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Link href="/demo/profile?userId=user_3BD3oRfekjI0b5VFf5QHnZfLFF1" style={{ flex: 1, background: 'rgba(198,255,51,0.08)', border: '1px solid rgba(198,255,51,0.2)', borderRadius: 14, padding: '10px 12px', color: '#c6ff33', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Abhik Viral</Link>
          <Link href="/demo/profile?userId=user_3BCzKqCXMfffO07Nbu1FSgeOVLn" style={{ flex: 1, background: 'rgba(198,255,51,0.08)', border: '1px solid rgba(198,255,51,0.2)', borderRadius: 14, padding: '10px 12px', color: '#c6ff33', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Rishabh Mehta</Link>
        </div>
        <Link href="/demo" style={{ display: 'block', textAlign: 'center', color: '#c6ff33', fontWeight: 700, textDecoration: 'none', marginTop: 8 }}>← Back to Chats</Link>
      </div>
    </main>
  );
}
