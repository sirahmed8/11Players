'use client';

import React from 'react';
import LiveMatchBroadcaster from '@/components/broadcaster/LiveMatchBroadcaster';
import { useMatchData } from '@/hooks/useMatchData';
import { useCommunity } from '@/contexts/CommunityContext';
import SiteSkeletonLoader from '@/components/ui/SiteSkeletonLoader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Swords, Play } from 'lucide-react';
import Link from 'next/link';

function LiveContent() {
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { matchData, loading } = useMatchData(activeCommunityId);

  if (loading) {
    return <SiteSkeletonLoader variant="live-broadcaster" />;
  }

  // Real Match active
  if (matchData && (matchData.status === 'live' || matchData.status === 'registering')) {
    const teamAName = matchData.teamAName || (activeCommunity ? `${activeCommunity.name} - Team A` : 'Team Alpha');
    const teamBName = matchData.teamBName || (activeCommunity ? `${activeCommunity.name} - Team B` : 'Team Bravo');

    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
        <LiveMatchBroadcaster
          teamAName={teamAName}
          teamBName={teamBName}
          initialScoreA={matchData.scoreA || 0}
          initialScoreB={matchData.scoreB || 0}
          autoSimulate={matchData.status === 'live'}
        />
      </main>
    );
  }

  // No active match running — Clean empty state with zero fake data
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Swords className="w-10 h-10 text-emerald-400" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-black text-white">No Live Match Currently Playing</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          There is no live match broadcast right now in <span className="text-emerald-400 font-bold">{activeCommunity?.name || 'your community'}</span>. Start a new match or open the Live Controller from the matches hub.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/matches"
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Go to Matches Hub</span>
        </Link>
      </div>
    </main>
  );
}

export default function LiveMatchPage() {
  return (
    <ProtectedRoute requireCommunity>
      <LiveContent />
    </ProtectedRoute>
  );
}
