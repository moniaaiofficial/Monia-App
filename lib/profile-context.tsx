'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase/client';

export type MyProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
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

type ProfileContextType = {
  myProfile: MyProfile | null;
  refreshMyProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType>({
  myProfile: null,
  refreshMyProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);

  // ✅ SAFE FETCH (with error handling)
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[ProfileContext] Fetch error:', error.message);
      return;
    }

    if (data) {
      setMyProfile(data as MyProfile);
      console.log('[ProfileContext] Loaded:', data.id, 'avatar:', data.avatar_url);
    }
  }, []);

  const refreshMyProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // 🔥 INITIAL LOAD
    fetchProfile(user.id);

    // 🔥 REALTIME SYNC (avatar instant update)
    const channel = supabase
      .channel(`my-profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('[ProfileContext] ✅ Realtime update:', payload.new.avatar_url);

          // 🔥 ONLY UPDATE IF AVATAR CHANGED (safe)
          setMyProfile((prev) => {
            if (!prev) return payload.new;

            if (prev.avatar_url !== payload.new.avatar_url) {
              return { ...prev, ...payload.new };
            }

            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoaded, user, fetchProfile]);

  return (
    <ProfileContext.Provider value={{ myProfile, refreshMyProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useMyProfile() {
  return useContext(ProfileContext);
}
