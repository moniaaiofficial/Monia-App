'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search } from 'lucide-react';

export default function ChatsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <main className="min-h-screen bg-[#0f0102]">
      <div className="sticky top-0 bg-[#0f0102] border-b border-[#fc2857] z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">MONiA</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-3 bg-transparent border border-[#fc2857] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc2857]"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-white mb-2">Welcome to MONiA</h2>
          <p className="text-[#e0e0e0]">Your conversations will appear here</p>
        </div>
      </div>
    </main>
  );
}
