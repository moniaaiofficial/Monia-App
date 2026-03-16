'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase/client';
import { User, Shield, FileText, ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/chat';

export default function MorePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, mobile, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data);
    })();
  }, [isLoaded, user]);

  const avatarUrl = profile?.avatar_url || user?.imageUrl;
  const displayName = profile?.full_name || user?.fullName || 'MONiA User';

  return (
    <main className="min-h-screen page-enter" style={{ background: '#06000c' }}>
      <div className="sticky top-0 section-header z-10">
        <div className="px-5 py-5">
          <h1 className="text-2xl font-black text-white">More</h1>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Profile card — tappable → /app/profile */}
        <button
          onClick={() => router.push('/app/profile')}
          className="w-full text-left"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            borderRadius: 20, background: 'rgba(255,255,255,0.04)',
            border: 'none', cursor: 'pointer',
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(198,255,51,0.30)', flexShrink: 0 }} />
          ) : profile ? (
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(198,255,51,0.10)', border: '1.5px solid rgba(198,255,51,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#c6ff33', flexShrink: 0 }}>
              {getInitials(displayName)}
            </div>
          ) : (
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            {profile ? (
              <>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <p style={{ color: '#c6ff33', fontSize: 13, fontWeight: 600, marginTop: 1 }}>@{profile.username || '—'}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="skeleton h-4 rounded w-3/4" />
                <div className="skeleton h-3 rounded w-1/2" />
              </div>
            )}
          </div>
          <ChevronRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        </button>

        {/* Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => router.push('/legal/privacy-policy')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield style={{ width: 20, height: 20, color: '#c6ff33' }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Privacy Policy</span>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.25)' }} />
          </button>

          <button
            onClick={() => router.push('/legal/terms')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText style={{ width: 20, height: 20, color: '#c6ff33' }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Terms & Conditions</span>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.25)' }} />
          </button>
        </div>

        <div className="text-center pt-4 space-y-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="font-semibold text-xs">MONiA v1.0.0</p>
          <a href="mailto:moniaaiofficial@gmail.com" style={{ color: '#c6ff33', fontSize: 12 }}>
            moniaaiofficial@gmail.com
          </a>
        </div>
      </div>
    </main>
  );
}
