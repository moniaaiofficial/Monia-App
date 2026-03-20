import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { getInitials, formatMsgTime } from '@/lib/chat';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function avatarBg(name: string | undefined) {
  const p = ['rgba(198,255,51,0.14)', 'rgba(0,229,255,0.11)', 'rgba(255,0,255,0.10)', 'rgba(168,85,247,0.12)'];
  return p[(name?.charCodeAt(0) ?? 0) % p.length];
}

export default async function DemoDashboard() {
  const { data: chats } = await supabaseAdmin
    .from('chats')
    .select('*')
    .order('last_message_time', { ascending: false });

  const validChats = (chats ?? []).filter((c: any) => Array.isArray(c.participants) && c.participants.length >= 2);

  const partnerIds = [...new Set(validChats.flatMap((c: any) => c.participants))];
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, username, avatar_url, city').in('id', partnerIds);
  const profileMap: Record<string, any> = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  const viewerId = 'user_3BD3oRfekjI0b5VFf5QHnZfLFF1'; // Abhik Viral
  const enriched = validChats.map((chat: any) => {
    const partnerId = chat.participants.find((id: string) => id !== viewerId) ?? chat.participants[0];
    return { ...chat, partner: profileMap[partnerId] ?? null };
  });

  return (
    <main style={{ background: '#06000c', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(198,255,51,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#c6ff33', letterSpacing: '-0.04em' }}>MONiA</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(198,255,51,0.12)', borderRadius: 8, padding: '3px 10px' }}>
              <span style={{ color: '#c6ff33', fontSize: 10, fontWeight: 700 }}>LIVE FROM SUPABASE</span>
            </div>
            <Link href="/demo/profile" style={{ textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(198,255,51,0.14)', border: '1.5px solid rgba(198,255,51,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#c6ff33' }}>
                AV
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Chat list */}
      <div style={{ padding: '8px 16px' }}>
        {enriched.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingTop: 80 }}>No chats</p>
        ) : (
          enriched.map((chat: any) => (
            <Link key={chat.id} href={`/demo/chat?chatId=${chat.id}&viewerId=${viewerId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '11px 10px', borderRadius: 16, marginBottom: 4 }}>
              {chat.partner?.avatar_url ? (
                <img src={chat.partner.avatar_url} alt={chat.partner.full_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarBg(chat.partner?.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17, color: '#c6ff33', flexShrink: 0 }}>
                  {getInitials(chat.partner?.full_name)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.partner?.full_name ?? 'MONiA User'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>
                    {chat.last_message_time ? formatMsgTime(chat.last_message_time) : ''}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chat.last_message ?? 'No messages yet'}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer note */}
      <div style={{ margin: '32px 20px 0', background: 'rgba(198,255,51,0.05)', border: '1px solid rgba(198,255,51,0.15)', borderRadius: 16, padding: '14px 16px' }}>
        <p style={{ color: '#c6ff33', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Demo View — Logged in as: Abhik Viral</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>All data is fetched live from Supabase using the service role key. The actual app uses Clerk auth to protect each user's data.</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Link href="/demo/profile" style={{ background: 'rgba(198,255,51,0.10)', border: '1px solid rgba(198,255,51,0.25)', borderRadius: 10, padding: '8px 14px', color: '#c6ff33', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>View Profile →</Link>
          <Link href="/demo/search" style={{ background: 'rgba(198,255,51,0.10)', border: '1px solid rgba(198,255,51,0.25)', borderRadius: 10, padding: '8px 14px', color: '#c6ff33', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Search Demo →</Link>
        </div>
      </div>
    </main>
  );
}
