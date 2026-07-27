'use client';

import React from 'react';
import CaptainDraftRoom from '@/components/draft/CaptainDraftRoom';

export default function DraftPage() {
  const handleMatchLaunch = (teamA: any[], teamB: any[]) => {
    console.log('Match Launched with Teams:', { teamA, teamB });
    if (typeof window !== 'undefined') {
      window.location.href = '/match/live';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <CaptainDraftRoom onMatchLaunch={handleMatchLaunch} />
    </main>
  );
}
