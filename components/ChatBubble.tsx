import { Check, CheckCheck } from 'lucide-react';
import { formatMsgTime } from '@/lib/chat';

type Props = {
  content: string;
  timestamp: string;
  isSent: boolean;
  status?: 'sent' | 'delivered' | 'read';
  senderName?: string;
};

export default function ChatBubble({ content, timestamp, isSent, status, senderName }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSent ? 'flex-end' : 'flex-start',
        marginBottom: 6,
        paddingLeft: isSent ? '20%' : 0,
        paddingRight: isSent ? 0 : '20%',
      }}
    >
      {senderName && !isSent && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#c6ff33',
            marginBottom: 2,
            paddingLeft: 4,
          }}
        >
          {senderName}
        </span>
      )}
      <div
        style={{
          maxWidth: '100%',
          padding: '10px 14px',
          borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isSent
            ? 'rgba(198,255,51,0.12)'
            : 'rgba(255,255,255,0.07)',
          border: isSent
            ? '1px solid rgba(198,255,51,0.22)'
            : '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <p
          style={{
            color: isSent ? '#e8ffb0' : 'rgba(255,255,255,0.92)',
            fontSize: 14,
            lineHeight: 1.5,
            fontWeight: 400,
            wordBreak: 'break-word',
          }}
        >
          {content}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          marginTop: 3,
          paddingLeft: isSent ? 0 : 4,
          paddingRight: isSent ? 4 : 0,
        }}
      >
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontWeight: 500 }}>
          {formatMsgTime(timestamp)}
        </span>
        {isSent && status && (
          <span style={{ color: status === 'read' ? '#c6ff33' : 'rgba(255,255,255,0.40)' }}>
            {status === 'sent' ? (
              <Check style={{ width: 12, height: 12 }} />
            ) : (
              <CheckCheck style={{ width: 12, height: 12 }} />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
