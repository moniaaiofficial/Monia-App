import { Check, Eye, EyeOff } from 'lucide-react';
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
        paddingLeft: isSent ? '15%' : 0,
        paddingRight: isSent ? 0 : '15%',
      }}
    >
      {senderName && !isSent && (
        <span style={{ fontSize: 11, fontWeight: 600, color: '#c6ff33', marginBottom: 2, paddingLeft: 4 }}>
          {senderName}
        </span>
      )}

      <div
        style={{
          maxWidth: '100%',
          padding: '9px 14px',
          borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isSent ? 'rgba(198,255,51,0.11)' : 'rgba(255,255,255,0.06)',
        }}
      >
        <p
          style={{
            color: isSent ? '#e8ffb0' : 'rgba(255,255,255,0.92)',
            fontSize: 14,
            lineHeight: 1.55,
            wordBreak: 'break-word',
          }}
        >
          {content}
        </p>
      </div>

      {/* Timestamp + read receipt */}
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
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
          {formatMsgTime(timestamp)}
        </span>

        {/* Eye-based read receipts for sent messages */}
        {isSent && status && status !== 'sent' && (
          status === 'read' ? (
            /* Open eye = read (neon green) */
            <Eye style={{ width: 12, height: 12, color: '#c6ff33' }} />
          ) : (
            /* Closed eye = delivered (white) */
            <EyeOff style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.45)' }} />
          )
        )}
        {isSent && status === 'sent' && (
          <Check style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.30)' }} />
        )}
      </div>
    </div>
  );
}
