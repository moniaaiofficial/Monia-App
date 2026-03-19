'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Search, ArrowLeft, X, UserPlus } from 'lucide-react';
import {
  getUserChats,
  createOrGetChat,
  searchProfiles,
  getInitials,
  formatMsgTime,
  type Chat,
  type Profile,
} from '@/lib/chat';
import { supabase } from '@/lib/supabase/client';

function avatarBg(name: string | undefined) {
  const p = ['rgba(198,255,51,0.14)', 'rgba(0,229,255,0.11)', 'rgba(255,0,255,0.10)', 'rgba(168,85,247,0.12)'];
  return p[(name?.charCodeAt(0) ?? 0) % p.length];
}

function ChatsPageInner() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useSearchParams();

  const [searchOpen,       setSearchOpen]       = useState(false);
  const [searchQuery,      setSearchQuery]       = useState('');
  const [chats,            setChats]             = useState<Chat[]>([]);
  const [chatsLoading,     setChatsLoading]      = useState(true);

  // New-chat modal
  const [newChatOpen,      setNewChatOpen]       = useState(false);
  const [newChatQuery,     setNewChatQuery]       = useState('');
  const [newChatResults,   setNewChatResults]     = useState<Profile[]>([]);
  const [newChatSearching, setNewChatSearching]   = useState(false);

  const searchInputRef  = useRef<HTMLInputElement>(null);
  const newChatInputRef = useRef<HTMLInputElement>(null);

  // Open new-chat modal if ?newchat=1
  useEffect(() => {
    if (params.get('newchat') === '1') {
      setNewChatOpen(true);
      router.replace('/dashboard');
    }
  }, [params, router]);

  const loadChats = useCallback(async () => {
    if (!user) return;
    setChatsLoading(true);
    const data = await getUserChats(user.id);
    setChats(data);
    setChatsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    loadChats();

    // Real-time: refresh chat list when a new message arrives
    const channel = supabase
      .channel('chats-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, loadChats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoaded, user, loadChats]);

  // New-chat user search (debounced)
  useEffect(() => {
    if (!newChatQuery.trim() || !user) { setNewChatResults([]); return; }
    const t = setTimeout(async () => {
      setNewChatSearching(true);
      const results = await searchProfiles(newChatQuery.trim(), user.id);
      setNewChatResults(results);
      setNewChatSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [newChatQuery, user]);

  const startChat = async (partnerId: string) => {
    if (!user) return;
    const chat = await createOrGetChat(user.id, partnerId);
    if (chat) {
      setNewChatOpen(false);
      setNewChatQuery('');
      setNewChatResults([]);
      router.push(`/dashboard/chat/${chat.id}`);
    }
  };

  const openSearch = () => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 60); };
  const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); };

  const openNewChat = () => { setNewChatOpen(true); setNewChatQuery(''); setNewChatResults([]); setTimeout(() => newChatInputRef.current?.focus(), 80); };
  const closeNewChat = () => { setNewChatOpen(false); setNewChatQuery(''); setNewChatResults([]); };

  const displayedChats = searchQuery
    ? chats.filter((c) =>
        c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.partner?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : chats;

  const avatarUrl   = user?.imageUrl;
  const userInitials = getInitials(user?.fullName || user?.firstName || '');

  return (
    <main className="min-h-screen page-enter" style={{ background: '#06000c' }}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
      >
        <div className="px-5 py-4">
          {searchOpen ? (
            <div className="flex items-center gap-3">
              <button onClick={closeSearch} style={{ color: '#c6ff33', flexShrink: 0 }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.28)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats…"
                  className="glass-input pl-9 pr-4 py-2.5 text-sm font-medium"
                  style={{ borderRadius: '0.875rem' }}
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button className="ask-monia-live text-xl" onClick={() => router.push('/dashboard/ai')} aria-label="Open MONiA AI">
                Ask MONiA
              </button>

              <div className="flex items-center gap-3">
                {/* New chat */}
                <button aria-label="New chat" onClick={openNewChat} style={{ color: '#ffffff' }}>
                  <UserPlus className="w-5 h-5" />
                </button>
                {/* Search */}
                <button aria-label="Search" onClick={openSearch} style={{ color: '#ffffff' }}>
                  <Search className="w-5 h-5" />
                </button>
                {/* Avatar */}
                <button aria-label="Profile" onClick={() => router.push('/profile')} style={{ flexShrink: 0 }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Me" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(198,255,51,0.45)' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(198,255,51,0.12)', border: '1.5px solid rgba(198,255,51,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#c6ff33' }}>
                      {userInitials}
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── New Chat Modal ───────────────────────────────────────────── */}
      {newChatOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: '#06000c' }}
        >
          {/* Modal header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,0,12,0.96)' }}>
            <button onClick={closeNewChat} style={{ color: '#c6ff33', flexShrink: 0 }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
              <input
                ref={newChatInputRef}
                type="text"
                value={newChatQuery}
                onChange={(e) => setNewChatQuery(e.target.value)}
                placeholder="Search by name, username or city…"
                className="glass-input pl-10 pr-4 py-2.5 text-sm font-medium"
                style={{ borderRadius: '0.875rem' }}
              />
            </div>
            {newChatQuery && (
              <button onClick={() => { setNewChatQuery(''); setNewChatResults([]); }} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {newChatSearching && [...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 16, marginBottom: 8 }} />
            ))}

            {!newChatSearching && newChatResults.map((p) => (
              <button
                key={p.id}
                onClick={() => startChat(p.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', marginBottom: 8, cursor: 'pointer', textAlign: 'left', border: 'none' }}
              >
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: avatarBg(p.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#c6ff33', flexShrink: 0 }}>
                  {getInitials(p.full_name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>@{p.username}{p.city ? ` · ${p.city}` : ''}</p>
                </div>
              </button>
            ))}

            {!newChatSearching && newChatQuery.trim() && newChatResults.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 48, color: 'rgba(255,255,255,0.38)', fontSize: 14 }}>
                No users found for "{newChatQuery}"
              </div>
            )}

            {!newChatQuery.trim() && (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <Search style={{ width: 36, height: 36, color: 'rgba(198,255,51,0.25)', margin: '0 auto 12px' }} />
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Search for a MONiA user to start chatting</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chat list ───────────────────────────────────────────────── */}
      <div className="px-4 py-2">
        {chatsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px' }}>
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(198,255,51,0.08)' }}>
              <UserPlus className="w-8 h-8 icon-active-glow" style={{ color: '#c6ff33' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{searchQuery ? 'No chats found' : 'No chats yet'}</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {searchQuery ? 'Try another search term' : 'Start a conversation with someone'}
            </p>
            {!searchQuery && (
              <button
                onClick={openNewChat}
                className="btn-neon px-6 py-3 rounded-2xl font-bold text-sm"
                style={{ color: '#06000c' }}
              >
                Find People
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayedChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => router.push(`/dashboard/chat/${chat.id}`)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '11px 10px', borderRadius: 16, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                onPointerEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)')}
                onPointerLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >
                {chat.partner?.avatar_url ? (
                  <img src={chat.partner.avatar_url} alt={chat.partner.full_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarBg(chat.partner?.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17, color: '#c6ff33', flexShrink: 0 }}>
                    {getInitials(chat.partner?.full_name)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '68%' }}>
                      {chat.partner?.full_name ?? 'User'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
                      {chat.last_message_time ? formatMsgTime(chat.last_message_time) : ''}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

export default function ChatsPage() {
  return (
    <Suspense fallback={<div style={{ background: '#06000c', minHeight: '100vh' }} />}>
      <ChatsPageInner />
    </Suspense>
  );
}
