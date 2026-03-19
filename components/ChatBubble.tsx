import { Check, Eye, EyeOff, MapPin, FileText, Download } from 'lucide-react';
import { formatMsgTime, formatFileSize } from '@/lib/chat';

type Props = {
  content:    string;
  timestamp:  string;
  isSent:     boolean;
  type?:      string;
  status?:    'sent' | 'delivered' | 'read';
  senderName?: string;
};

function MediaContent({ type, content, isSent }: { type: string; content: string; isSent: boolean }) {
  let data: any = null;
  try { data = JSON.parse(content); } catch {}

  const textColor = isSent ? '#06000c' : 'rgba(255,255,255,0.92)';
  const subColor  = isSent ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';

  if (type === 'image') {
    return (
      <div style={{ maxWidth: 240 }}>
        <img
          src={data?.url || content}
          alt="Image"
          style={{ width: '100%', borderRadius: 12, display: 'block', maxHeight: 300, objectFit: 'cover' }}
          loading="lazy"
        />
        {data?.caption && <p style={{ color: textColor, fontSize: 13, marginTop: 6, wordBreak: 'break-word' }}>{data.caption}</p>}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div style={{ maxWidth: 240 }}>
        <video
          src={data?.url || content}
          controls
          style={{ width: '100%', borderRadius: 12, display: 'block', maxHeight: 240 }}
        />
        {data?.caption && <p style={{ color: textColor, fontSize: 13, marginTop: 6 }}>{data.caption}</p>}
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div style={{ minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>🎤</span>
          <p style={{ color: textColor, fontSize: 13, fontWeight: 600 }}>
            Voice note · {data?.duration ? formatFileSize(data.duration) : ''}
          </p>
        </div>
        <audio src={data?.url || content} controls style={{ width: '100%', height: 36 }} />
      </div>
    );
  }

  if (type === 'document') {
    const ext = (data?.fileName || '').split('.').pop()?.toUpperCase() || 'FILE';
    return (
      <a href={data?.url || content} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', minWidth: 180 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: isSent ? 'rgba(0,0,0,0.15)' : 'rgba(198,255,51,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={20} style={{ color: isSent ? '#06000c' : '#c6ff33' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: textColor, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {data?.fileName || 'Document'}
          </p>
          <p style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
            {ext} · {data?.size ? formatFileSize(data.size) : ''}
          </p>
        </div>
        <Download size={16} style={{ color: isSent ? 'rgba(0,0,0,0.5)' : 'rgba(198,255,51,0.6)', flexShrink: 0 }} />
      </a>
    );
  }

  if (type === 'location') {
    const lat = data?.lat ?? parseFloat((content || '').split(',')[0]);
    const lng = data?.lng ?? parseFloat((content || '').split(',')[1]);
    const label = data?.address || `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', textDecoration: 'none' }}
      >
        <div style={{ width: 220, borderRadius: 12, overflow: 'hidden' }}>
          <img
            src={`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=220,120&z=14&l=map&pt=${lng},${lat},pm2rdl`}
            alt="Map"
            style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} style={{ color: '#c6ff33', flexShrink: 0 }} />
            <p style={{ color: textColor, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
          </div>
        </div>
      </a>
    );
  }

  if (type === 'poll') {
    const totalVotes = (data?.options || []).reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
    return (
      <div style={{ minWidth: 200, maxWidth: 260 }}>
        <p style={{ color: textColor, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{data?.question || 'Poll'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(data?.options || []).map((opt: any, i: number) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: textColor, fontSize: 13 }}>{opt.text}</span>
                  <span style={{ color: subColor, fontSize: 12 }}>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: isSent ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isSent ? 'rgba(0,0,0,0.4)' : '#c6ff33', borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ color: subColor, fontSize: 11, marginTop: 8 }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
      </div>
    );
  }

  if (type === 'emoji') {
    return <span style={{ fontSize: 48, lineHeight: 1 }}>{content}</span>;
  }

  // Default: text
  return (
    <p style={{ color: isSent ? '#06000c' : 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word', fontWeight: isSent ? 600 : 400 }}>
      {content}
    </p>
  );
}

export default function ChatBubble({ content, timestamp, isSent, type = 'text', status, senderName }: Props) {
  const isMediaType = type !== 'text' && type !== 'emoji';
  const isEmojiOnly = type === 'emoji';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSent ? 'flex-end' : 'flex-start',
        marginBottom: 6,
        paddingLeft:  isSent ? (isMediaType ? '5%' : '15%') : 0,
        paddingRight: isSent ? 0 : (isMediaType ? '5%' : '15%'),
      }}
    >
      {senderName && !isSent && (
        <span style={{ fontSize: 11, fontWeight: 600, color: '#c6ff33', marginBottom: 2, paddingLeft: 4 }}>
          {senderName}
        </span>
      )}

      {isEmojiOnly ? (
        <div style={{ padding: '4px 0' }}>
          <MediaContent type={type} content={content} isSent={isSent} />
        </div>
      ) : (
        <div
          style={{
            maxWidth: isMediaType ? 280 : '100%',
            padding: isMediaType ? '8px 10px' : '9px 14px',
            borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isSent ? '#c6ff33' : 'rgba(255,255,255,0.06)',
            border: isSent ? 'none' : '1px solid rgba(198,255,51,0.12)',
            overflow: 'hidden',
          }}
        >
          <MediaContent type={type} content={content} isSent={isSent} />
        </div>
      )}

      {/* Timestamp + read receipt */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 3,
          marginTop: 3,
          paddingLeft:  isSent ? 0 : 4,
          paddingRight: isSent ? 4 : 0,
        }}
      >
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
          {formatMsgTime(timestamp)}
        </span>
        {isSent && status === 'read'      && <Eye    style={{ width: 12, height: 12, color: '#c6ff33' }} />}
        {isSent && status === 'delivered' && <EyeOff style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.55)' }} />}
        {isSent && status === 'sent'      && <Check  style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.30)' }} />}
      </div>
    </div>
  );
}
