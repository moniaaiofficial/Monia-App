import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { getInitials } from '@/lib/chat';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default async function DemoChatPage({ searchParams }: { searchParams: { chatId?: string; viewerId?: string } }) {
  const chatId = searchParams.chatId ?? '';
  const viewerId = searchParams.viewerId ?? 'user_3BD3oRfekjI0b5VFf5QHnZfLFF1';

  if (!chatId) return <div style={{ background: '#06000c', minHeight: '100vh', color: '#fff', padding: 24 }}>No chatId provided</div>;

  const { data: chat } = await supabaseAdmin.from('chats').select('*').eq('id', chatId).single();
  const { data: messages } = await supabaseAdmin.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });

  const partnerId = chat?.participants?.find((id: string) => id !== viewerId);
  const allIds = [...new Set([viewerId, partnerId].filter(Boolean))];
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, username, avatar_url').in('id', allIds);
  const profileMap: Record<string, any> = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  const partner = profileMap[partnerId] ?? null;
  const me      = profileMap[viewerId] ?? null;

  return (
    <main style={{ background: '#06000c', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Link href="/demo" style={{ color: '#c6ff33', textDecoration: 'none', fontWeight: 700, fontSize: 20 }}>←</Link>
        {partner?.avatar_url ? (
          <img src={partner.avatar_url} alt={partner.full_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(198,255,51,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#c6ff33', fontSize: 14 }}>
            {getInitials(partner?.full_name)}
          </div>
        )}
        <div>
          <p style={{ color: '#fff', fontWeight: 700 }}>{partner?.full_name ?? 'MONiA User'}</p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>@{partner?.username ?? ''}</p>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(198,255,51,0.12)', borderRadius: 8, padding: '3px 10px' }}>
          <span style={{ color: '#c6ff33', fontSize: 10, fontWeight: 700 }}>LIVE MESSAGES</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {(messages ?? []).map((msg: any) => {
          const isMine = msg.sender_id === viewerId;
          const sender = profileMap[msg.sender_id];
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{ maxWidth: '72%' }}>
                {!isMine && (
                  <p style={{ color: '#c6ff33', fontSize: 11, fontWeight: 700, marginBottom: 3, marginLeft: 12 }}>
                    {sender?.full_name ?? 'User'}
                  </p>
                )}
                <div style={{
                  background: isMine ? '#c6ff33' : 'rgba(255,255,255,0.08)',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '10px 14px',
                  border: isMine ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ color: isMine ? '#06000c' : '#fff', fontSize: 14, fontWeight: isMine ? 600 : 400 }}>{msg.content}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 4, marginTop: 3 }}>
                  <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>{formatTime(msg.created_at)}</span>
                  {isMine && <span style={{ color: msg.status === 'read' ? '#c6ff33' : 'rgba(255,255,255,0.3)', fontSize: 10 }}>{msg.status === 'read' ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input (visual only for demo) */}
      <div style={{ padding: '12px 16px', background: 'rgba(6,0,12,0.94)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: '10px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
          Type a message…
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#c6ff33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>▶</div>
      </div>
    </main>
  );
}
