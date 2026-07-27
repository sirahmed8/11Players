'use client';

import React, { useState, useMemo } from 'react';
import DerbyRivalryEngine, { MatchRecord } from '@/components/derby/DerbyRivalryEngine';
import { useMatchData } from '@/hooks/useMatchData';
import { useCommunity } from '@/contexts/CommunityContext';
import { usePlayers } from '@/contexts/PlayersContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SiteSkeletonLoader from '@/components/ui/SiteSkeletonLoader';
import { Flame, Users, Swords } from 'lucide-react';

function DerbyContent() {
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { historyMatches, loading: matchLoading } = useMatchData(activeCommunityId);
  const { players, loading: playersLoading } = usePlayers();

  const [captainA, setCaptainA] = useState<string>('');
  const [captainB, setCaptainB] = useState<string>('');

  // Set default captains when players load
  React.useEffect(() => {
    if (players && players.length >= 2) {
      if (!captainA) setCaptainA(players[0].uid);
      if (!captainB) setCaptainB(players[1].uid);
    }
  }, [players]);

  // Transform real community history matches into MatchRecord[]
  const realMatchRecords: MatchRecord[] = useMemo(() => {
    if (!historyMatches) return [];
    return historyMatches.map((m) => {
      const dateStr = m.createdAt
        ? new Date(m.createdAt.seconds * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      return {
        id: m.id,
        date: dateStr,
        teamAName: m.teamAName || `${activeCommunity?.name || 'Community'} Team A`,
        teamBName: m.teamBName || `${activeCommunity?.name || 'Community'} Team B`,
        captainAUid: m.captainAUid || captainA || 'c1',
        captainBUid: m.captainBUid || captainB || 'c2',
        scoreA: m.scoreA ?? 0,
        scoreB: m.scoreB ?? 0,
        yellowCards: m.yellowCards || 0,
        redCards: m.redCards || 0,
        venue: m.venue || `${activeCommunity?.name || 'Community'} Turf Pitch`,
      };
    });
  }, [historyMatches, activeCommunity, captainA, captainB]);

  const captAPlayer = players.find((p) => p.uid === captainA);
  const captBPlayer = players.find((p) => p.uid === captainB);

  if (matchLoading || playersLoading) {
    return <SiteSkeletonLoader variant="derby" />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Real Captain Selector Header */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">Select Real Captain Rivalry</h1>
                <p className="text-xs text-slate-400">Calculate head-to-head stats from real community matches</p>
              </div>
            </div>

            {/* Captain Pickers */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400">Capt 1:</span>
                <select
                  value={captainA}
                  onChange={(e) => setCaptainA(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white outline-none focus:border-rose-500"
                >
                  {players.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.cardName || p.fullName} ({p.primaryPosition})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400">Capt 2:</span>
                <select
                  value={captainB}
                  onChange={(e) => setCaptainB(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white outline-none focus:border-blue-500"
                >
                  {players.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.cardName || p.fullName} ({p.primaryPosition})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Derby Engine */}
        <DerbyRivalryEngine
          matches={realMatchRecords}
          captainAName={captAPlayer?.cardName || captAPlayer?.fullName || 'Captain 1'}
          captainBName={captBPlayer?.cardName || captBPlayer?.fullName || 'Captain 2'}
          captainAUid={captainA}
          captainBUid={captainB}
        />
      </div>
    </main>
  );
}

export default function DerbyPage() {
  return (
    <ProtectedRoute requireCommunity>
      <DerbyContent />
    </ProtectedRoute>
  );
}
