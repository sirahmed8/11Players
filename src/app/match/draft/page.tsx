'use client';

import React from 'react';
import CaptainDraftRoom from '@/components/draft/CaptainDraftRoom';
import { usePlayers } from '@/contexts/PlayersContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SiteSkeletonLoader from '@/components/ui/SiteSkeletonLoader';

function DraftContent() {
  const { players, loading } = usePlayers();
  const { user } = useAuth();

  const handleMatchLaunch = (teamA: any[], teamB: any[]) => {
    console.log('Match Launched with Teams:', { teamA, teamB });
    if (typeof window !== 'undefined') {
      window.location.href = '/match/live';
    }
  };

  if (loading) {
    return <SiteSkeletonLoader variant="draft-room" />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
      <CaptainDraftRoom
        initialPlayers={players}
        captain1Uid={user?.uid}
        onMatchLaunch={handleMatchLaunch}
      />
    </main>
  );
}

export default function DraftPage() {
  return (
    <ProtectedRoute>
      <DraftContent />
    </ProtectedRoute>
  );
}
