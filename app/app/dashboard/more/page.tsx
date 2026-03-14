'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { User, Shield, FileText, LogOut, ChevronRight } from 'lucide-react';

export default function MorePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      if (!isLoaded || !user) return;
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    getProfile();
  }, [isLoaded, user]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen page-enter" style={{ background: '#06000c' }}>
      <div className="sticky top-0 section-header z-10">
        <div className="px-5 py-5">
          <h1 className="text-2xl font-black text-white">More</h1>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {profile ? (
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(198,255,51,0.08)' }}
              >
                <User className="w-8 h-8 icon-active-glow" style={{ color: '#c6ff33' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile.full_name}</h2>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {profile.email}
                </p>
                {profile.mobile && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {profile.mobile}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="skeleton w-16 h-16 rounded-2xl flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-5 rounded w-3/4" />
                <div className="skeleton h-4 rounded w-1/2" />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/legal/privacy-policy')}
            className="w-full glass-card px-5 py-4 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: '#c6ff33' }} />
              <span className="text-white font-semibold text-sm">Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
          </button>

          <button
            onClick={() => router.push('/legal/terms')}
            className="w-full glass-card px-5 py-4 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" style={{ color: '#c6ff33' }} />
              <span className="text-white font-semibold text-sm">Terms & Conditions</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="btn-neon w-full rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-sm"
            style={{ color: '#06000c' }}
          >
            <LogOut className="w-5 h-5" />
            {loading ? 'Logging out…' : 'Logout'}
          </button>
        </div>

        <div className="text-center pt-4 space-y-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <p className="font-semibold text-xs">MONiA v1.0.0</p>
          <p className="text-xs">
            Contact:{' '}
            <a
              href="mailto:moniaaiofficial@gmail.com"
              className="font-medium"
              style={{ color: '#c6ff33' }}
            >
              moniaaiofficial@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
