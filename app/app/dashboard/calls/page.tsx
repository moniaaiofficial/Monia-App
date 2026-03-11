'use client';

import { Phone } from 'lucide-react';

export default function CallsPage() {
  return (
    <main className="min-h-screen bg-[#0f0102]">
      <div className="sticky top-0 bg-[#0f0102] border-b border-[#fc2857] z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Calls</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="text-center py-20">
          <Phone className="w-16 h-16 text-[#fc2857] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Calls Yet</h2>
          <p className="text-[#e0e0e0]">Your call history will appear here</p>
        </div>
      </div>
    </main>
  );
}
