'use client';

import { Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AiPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen page-enter" style={{ background: '#1a0d00' }}>
      <div className="sticky top-0 section-header z-10">
        <div className="px-5 py-5">
          <h1 className="ask-monia-live text-2xl">M+Ai</h1>
        </div>
      </div>

      <div className="p-5">
        <div className="text-center py-24">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(198,255,51,0.06)', border: '1px solid rgba(198,255,51,0.15)' }}
          >
            <Bot className="middle-icon" style={{ width: 40, height: 40, color: '#ff471a' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">MONiA AI</h2>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
            AI-powered conversations coming soon
          </p>
        </div>
      </div>
    </main>
  );
}
