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

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setMyProfile(data as MyProfile);
      console.log('[ProfileContext] Loaded from Supabase:', data.id, 'avatar:', data.avatar_url);
    }
  }, []);

  const refreshMyProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    fetchProfile(user.id);

    const channel = supabase
      .channel(`my-profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload: { new: MyProfile }) => {
          console.log('[ProfileContext] ✅ Global avatar sync fired:', payload.new.avatar_url);
          setMyProfile(payload.new);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
