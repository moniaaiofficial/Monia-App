'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, Shield, FileText, LogOut, ChevronRight } from 'lucide-react';

export default function MorePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(data);
      }
    };
    getProfile();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0102]">
      <div className="sticky top-0 bg-[#0f0102] border-b border-[#fc2857] z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-white">More</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {profile && (
          <div className="bg-[#0f0102] border border-[#fc2857] rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#fc2857] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{profile.full_name}</h2>
                <p className="text-[#e0e0e0] text-sm">{profile.email}</p>
                {profile.mobile_number && (
                  <p className="text-[#e0e0e0] text-sm">{profile.mobile_number}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => router.push('/legal/privacy-policy')}
            className="w-full bg-[#0f0102] border border-[#fc2857] rounded-lg p-4 flex items-center justify-between hover:bg-[#fc2857]/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-white" />
              <span className="text-white font-medium">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={() => router.push('/legal/terms')}
            className="w-full bg-[#0f0102] border border-[#fc2857] rounded-lg p-4 flex items-center justify-between hover:bg-[#fc2857]/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-white" />
              <span className="text-white font-medium">Terms & Conditions</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-[#fc2857] rounded-lg p-4 flex items-center justify-center space-x-3 hover:bg-[#e01f4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">
              {loading ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>

        <div className="text-center text-[#e0e0e0] text-sm mt-8">
          <p>MONiA v1.0.0</p>
          <p className="mt-2">
            Contact:{' '}
            <a href="mailto:moniaaiofficial@gmail.com" className="text-[#fc2857] hover:underline">
              moniaaiofficial@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
