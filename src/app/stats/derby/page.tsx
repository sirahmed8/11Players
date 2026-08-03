'use client';

import React, { useState, useMemo } from 'react';
import DerbyRivalryEngine, { MatchRecord } from '@/components/derby/DerbyRivalryEngine';
import { useMatchData } from '@/hooks/useMatchData';
import { useCommunity } from '@/contexts/CommunityContext';
import { usePlayers } from '@/contexts/PlayersContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CustomDropdown from '@/components/ui/CustomDropdown';
import ProGate from '@/components/ui/ProGate';
import { Flame, Swords, Shield } from 'lucide-react';

function DerbyContent() {
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { historyMatches } = useMatchData(activeCommunityId);
  const { players } = usePlayers();

  const [captainA, setCaptainA] = useState<string>('');
  const [captainB, setCaptainB] = useState<string>('');

  // Helper to calculate exact votes count across Array, Map, or Number representations
  const getVotesCount = (p: any): number => {
    if (!p) return 0;
    if (Array.isArray(p.captainVotes)) return p.captainVotes.length;
    if (typeof p.captainVotes === 'number') return p.captainVotes;
    if (p.captainVotes && typeof p.captainVotes === 'object') return Object.keys(p.captainVotes).length;
    if (typeof p.votesCount === 'number') return p.votesCount;
    if (typeof p.votes === 'number') return p.votes;
    return 0;
  };

  // Sort players by captain votes & overall rating so top voted captains appear first
  const sortedCaptains = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => {
      const votesA = getVotesCount(a);
      const votesB = getVotesCount(b);
      if (votesB !== votesA) return votesB - votesA;
      return (b.overallRating || 80) - (a.overallRating || 80);
    });
  }, [players]);

  // Set default captains to top 2 most voted captains when players load
  React.useEffect(() => {
    if (sortedCaptains && sortedCaptains.length >= 2) {
      setCaptainA(sortedCaptains[0].uid);
      setCaptainB(sortedCaptains[1].uid);
    }
  }, [sortedCaptains]);

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

  const playerOptions = useMemo(() => {
    return sortedCaptains.map((p) => {
      const votes = getVotesCount(p);
      const voteBadge = votes > 0 ? ` (${votes} 🗳️)` : '';
      return {
        value: p.uid,
        label: `${p.cardName || p.fullName} (${p.primaryPosition})${voteBadge} — OVR ${p.overallRating || 80}`,
      };
    });
  }, [sortedCaptains]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Real Captain Selector Header */}
        <div className="relative z-30 p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Select Real Captain Rivalry</h1>
                <p className="text-xs text-slate-400 font-medium">
                  Compute head-to-head stats & rivalry intensity from real community matches
                </p>
              </div>
            </div>

            {/* Custom Styled Captain Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full md:w-auto min-w-[280px] sm:min-w-[480px]">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 block mb-1">
                  Captain 1
                </label>
                <CustomDropdown
                  value={captainA}
                  onChange={setCaptainA}
                  options={playerOptions}
                  placeholder="Select Captain 1"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 block mb-1">
                  Captain 2
                </label>
                <CustomDropdown
                  value={captainB}
                  onChange={setCaptainB}
                  options={playerOptions}
                  placeholder="Select Captain 2"
                />
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
      <ProGate
        requiredPlan="pro_captain"
        featureNameEn="Derby & H2H Rivalry Engine"
        featureNameAr="محرك الديربي ووجهاً لوجه"
      >
        <DerbyContent />
      </ProGate>
    </ProtectedRoute>
  );
}
