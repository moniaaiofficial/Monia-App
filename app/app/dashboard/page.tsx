'use client';

import { useUser } from '@clerk/nextjs';
import { Search } from 'lucide-react';

export default function ChatsPage() {
  const { user, isLoaded } = useUser();
  const hasNotifications = false;

  return (
    <main className="min-h-screen page-enter" style={{ background: '#06000c' }}>
      <div className="sticky top-0 section-header z-10">
        <div className="px-5 py-4">
          <h1
            className={hasNotifications ? 'logo-notification' : 'logo-glow'}
            style={{ fontSize: '1.5rem', fontWeight: 900 }}
          >
            MONiA
          </h1>
          <div className="relative mt-4">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }}
            />
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
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 tilt-target"
            style={{ background: 'rgba(198,255,51,0.08)' }}
          >
            <Search
              className="w-8 h-8 icon-active-glow"
              style={{ color: '#c6ff33' }}
            />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to MONiA</h2>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Your conversations will appear here
          </p>
        </div>
      </div>
    </main>
  );
}
