'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Search, User, ArrowLeft, Plus, X } from 'lucide-react';
import {
  getUserChats,
  searchProfiles,
  createOrGetChat,
  getInitials,
  formatMsgTime,
  type Chat,
  type Profile,
} from '@/lib/chat';

export default function ChatsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [profileQuery, setProfileQuery] = useState('');
  const [profileResults, setProfileResults] = useState<Profile[]>([]);
  const [profileSearching, setProfileSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load chats ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      const data = await getUserChats(user.id);
      setChats(data);
      setChatsLoading(false);
    })();
  }, [isLoaded, user]);

  /* ── Profile search for new chat ─────────────────────────── */
  useEffect(() => {
    if (!profileQuery.trim() || !user) {
      setProfileResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setProfileSearching(true);
      const results = await searchProfiles(profileQuery.trim(), user.id);
      setProfileResults(results);
      setProfileSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [profileQuery, user]);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const openNewChat = () => {
    setNewChatOpen(true);
    setTimeout(() => profileInputRef.current?.focus(), 80);
  };

  const startChat = async (partnerId: string) => {
    if (!user) return;
    const chat = await createOrGetChat(user.id, partnerId);
    if (chat) {
      setNewChatOpen(false);
      setProfileQuery('');
      router.push(`/app/dashboard/chat/${chat.id}`);
    }
  };

  /* ── Filter displayed chats by search ────────────────────── */
  const displayedChats = searchQuery
    ? chats.filter((c) =>
        c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : chats;

  /* ── Avatar colours (deterministic from name) ─────────────── */
  const avatarColor = (name: string | undefined) => {
    const palette = [
      'rgba(198,255,51,0.15)',
      'rgba(0,229,255,0.12)',
      'rgba(255,0,255,0.10)',
      'rgba(168,85,247,0.12)',
    ];
    if (!name) return palette[0];
    return palette[name.charCodeAt(0) % palette.length];
  };

  return (
    <main className="min-h-screen page-enter" style={{ background: '#06000c' }}>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
      >
        <div className="px-5 py-4">
          {searchOpen ? (
            <div className="flex items-center gap-3">
              <button aria-label="Close search" onClick={closeSearch} style={{ color: '#c6ff33', flexShrink: 0 }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
                <input
                  ref={searchInputRef}
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
            <div className="flex items-center justify-between">
              <button
                className="ask-monia-live text-xl"
                onClick={() => router.push('/app/dashboard/ai')}
                aria-label="Open MONiA AI"
              >
                Ask MONiA
              </button>
              <div className="flex items-center gap-3">
                <button aria-label="Search" onClick={openSearch} style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <Search className="w-5 h-5" />
                </button>
                <button aria-label="New chat" onClick={openNewChat} style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── New Chat Modal ─────────────────────────────────────── */}
      {newChatOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(6,0,12,0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => { setNewChatOpen(false); setProfileQuery(''); }} style={{ color: '#c6ff33' }}>
              <X style={{ width: 22, height: 22 }} />
            </button>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>New Chat</span>
          </div>

          <div style={{ padding: '12px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
              <input
                ref={profileInputRef}
                value={profileQuery}
                onChange={(e) => setProfileQuery(e.target.value)}
                placeholder="Search by name or email…"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '10px 16px 10px 38px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
            {profileSearching && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 60, borderRadius: 16 }} />
                ))}
              </div>
            )}
            {!profileSearching && profileResults.map((profile) => (
              <button
                key={profile.id}
                onClick={() => startChat(profile.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: avatarColor(profile.full_name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#c6ff33',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(profile.full_name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.full_name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.email}
                  </p>
                </div>
              </button>
            ))}
            {!profileSearching && profileQuery.trim() && profileResults.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 40, color: 'rgba(255,255,255,0.38)', fontSize: 14 }}>
                No users found
              </div>
            )}
            {!profileQuery.trim() && (
              <div style={{ textAlign: 'center', paddingTop: 40, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                Search for a MONiA user to start chatting
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chat List ─────────────────────────────────────────── */}
      <div className="p-4">
        {chatsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 18 }}>
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 15, width: '55%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayedChats.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(198,255,51,0.08)' }}
            >
              <User className="w-8 h-8 icon-active-glow" style={{ color: '#c6ff33' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </h2>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {searchQuery ? 'Try a different search term' : 'Tap + to start a new conversation'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {displayedChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => router.push(`/app/dashboard/chat/${chat.id}`)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 18,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: avatarColor(chat.partner?.full_name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 17,
                    color: '#c6ff33',
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {getInitials(chat.partner?.full_name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {chat.partner?.full_name ?? 'User'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
                      {chat.last_message_time ? formatMsgTime(chat.last_message_time) : ''}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.last_message ?? 'No messages yet'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
