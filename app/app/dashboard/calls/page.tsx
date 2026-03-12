'use client';

import { Phone } from 'lucide-react';

export default function CallsPage() {
  return (
    <main className="min-h-screen bg-[#100002] page-enter">
      <div className="sticky top-0 section-header z-10">
        <div className="px-5 py-5">
          <h1 className="text-2xl font-black text-white">Calls</h1>
        </div>
      </div>

      <div className="p-5">
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[#ff1e43]/10 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <Phone className="w-8 h-8 text-[#ff1e43] icon-active-glow" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Calls Yet</h2>
          <p className="text-white/40 text-sm font-medium">Your call history will appear here</p>
        </div>
      </div>
    </main>
  );
}
