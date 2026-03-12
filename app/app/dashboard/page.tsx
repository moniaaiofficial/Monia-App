'use client';

import { useUser } from '@clerk/nextjs';
import { Search } from 'lucide-react';

export default function ChatsPage() {
  const { user, isLoaded } = useUser();

  return (
    <main className="min-h-screen bg-[#100002] page-enter">
      <div className="sticky top-0 section-header z-10">
        <div className="px-5 py-4">
          <h1 className="text-2xl font-black text-white logo-glow mb-4">MONiA</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chats..."
              className="glass-input pl-11 pr-4 py-3 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[#ff1e43]/10 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <Search className="w-8 h-8 text-[#ff1e43] icon-active-glow" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to MONiA</h2>
          <p className="text-white/40 text-sm font-medium">Your conversations will appear here</p>
        </div>
      </div>
    </main>
  );
}
