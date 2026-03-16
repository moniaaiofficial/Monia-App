'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Search, User, ArrowLeft } from 'lucide-react';

export default function ChatsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <main className="min-h-screen page-enter" style={{ background: '#06000c' }}>
      {/* ── Top Bar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-10" style={{ background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}>
        <div className="px-5 py-4">
          {searchOpen ? (
            /* ── Expanded search ────────────────────────────── */
            <div className="flex items-center gap-3">
              <button
                aria-label="Close search"
                onClick={closeSearch}
                style={{ color: '#c6ff33', flexShrink: 0 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="glass-input pl-9 pr-4 py-2.5 text-sm font-medium"
                  style={{ borderRadius: '0.875rem' }}
                />
              </div>
            </div>
          ) : (
            /* ── Default bar ────────────────────────────────── */
            <div className="flex items-center justify-between">
              {/* Ask MONiA – animated neon text */}
              <button
                className="ask-monia-live text-xl"
                onClick={() => router.push('/app/dashboard/ai')}
                aria-label="Open MONiA AI"
              >
                Ask MONiA
              </button>

              {/* Right icons */}
              <div className="flex items-center gap-3">
                <button
                  aria-label="Search"
                  onClick={openSearch}
                  style={{ color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}
                  onPointerEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c6ff33')}
                  onPointerLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)')}
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  aria-label="Profile"
                  style={{ color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}
                  onPointerEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c6ff33')}
                  onPointerLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)')}
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="text-center py-24">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(198,255,51,0.08)' }}
          >
            <Search className="w-8 h-8 icon-active-glow" style={{ color: '#c6ff33' }} />
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
