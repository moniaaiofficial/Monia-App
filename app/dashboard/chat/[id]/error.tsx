'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[ChatPage] Error caught by boundary:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#14141f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        ⚠️
      </div>
      <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>
        Something went wrong
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
        This chat couldn&apos;t load. Try again or go back to your chats.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 20px',
            borderRadius: 14,
            background: 'rgba(255,0,102,0.12)',
            border: '1px solid rgba(255,0,102,0.25)',
            color: '#ff0066',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 20px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Back to Chats
        </button>
      </div>
    </div>
  );
}
