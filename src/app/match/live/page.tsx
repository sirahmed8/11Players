'use client';

import React from 'react';
import LiveMatchBroadcaster from '@/components/broadcaster/LiveMatchBroadcaster';

export default function LiveMatchPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <LiveMatchBroadcaster />
    </main>
  );
}
