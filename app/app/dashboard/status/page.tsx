'use client';

import { Sparkles } from 'lucide-react';

export default function StatusPage() {
  return (
    <main className="min-h-screen page-enter" style={{ background: '#06000c' }}>
      <div className="sticky top-0 section-header z-10">
        <div className="px-5 py-5">
          <h1 className="text-2xl font-black text-white">Status</h1>
        </div>
      </div>

      <div className="p-5">
        <div className="text-center py-24">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(198,255,51,0.08)' }}
          >
            <Sparkles className="w-8 h-8 icon-active-glow" style={{ color: '#c6ff33' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Status Updates</h2>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Status updates from your contacts will appear here
          </p>
        </div>
      </div>
    </main>
  );
}
