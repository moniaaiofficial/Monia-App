import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { getInitials } from '@/lib/chat';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function avatarBg(name: string | undefined) {
  const p = ['rgba(198,255,51,0.14)', 'rgba(0,229,255,0.11)', 'rgba(255,0,255,0.10)', 'rgba(168,85,247,0.12)'];
  return p[(name?.charCodeAt(0) ?? 0) % p.length];
}

export default async function DemoSearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const queries = [
    { label: 'Name',     q: 'Abhishek', field: 'full_name'  },
    { label: 'Username', q: 'abhik',    field: 'username'   },
    { label: 'Email',    q: 'djabhik',  field: 'email'      },
    { label: 'Mobile',   q: '8050409', field: 'mobile'     },
    { label: 'City',     q: 'Ratlam',   field: 'city'       },
  ];

  const results: Record<string, any[]> = {};
  for (const { q, label } of queries) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, email, mobile, city, avatar_url')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%,mobile.ilike.%${q}%,city.ilike.%${q}%`)
      .limit(5);
    results[label] = data ?? [];
  }

  return (
    <main style={{ background: '#06000c', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(198,255,51,0.08)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/demo" style={{ color: '#c6ff33', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>←</Link>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Search Proof</h1>
        <div style={{ marginLeft: 'auto', background: 'rgba(198,255,51,0.12)', borderRadius: 8, padding: '3px 10px' }}>
          <span style={{ color: '#c6ff33', fontSize: 10, fontWeight: 700 }}>LIVE FROM SUPABASE</span>
        </div>
      </div>

      <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {queries.map(({ label, q, field }) => (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ background: '#c6ff33', borderRadius: 8, padding: '3px 10px' }}>
                <span style={{ color: '#06000c', fontSize: 11, fontWeight: 900 }}>Search by {label.toUpperCase()}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>query: "<span style={{ color: '#c6ff33' }}>{q}</span>"</span>
            </div>
            {results[label].length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, paddingLeft: 12 }}>No results</p>
            ) : (
              results[label].map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 6 }}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.full_name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: avatarBg(p.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#c6ff33', flexShrink: 0 }}>
                      {getInitials(p.full_name)}
                    </div>
                  )}
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{p.full_name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>
                      @{p.username}
                      {p.mobile ? ` · 📱 ${p.mobile}` : ''}
                      {p.city ? ` · 📍 ${p.city}` : ''}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>{p.email}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'rgba(198,255,51,0.12)', borderRadius: 6, padding: '2px 8px' }}>
                    <span style={{ color: '#c6ff33', fontSize: 10, fontWeight: 700 }}>matched {field}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
