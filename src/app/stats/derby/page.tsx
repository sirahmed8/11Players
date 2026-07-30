'use client';

import React, { useState, useMemo } from 'react';
import DerbyRivalryEngine, { MatchRecord } from '@/components/derby/DerbyRivalryEngine';
import { useMatchData } from '@/hooks/useMatchData';
import { useCommunity } from '@/contexts/CommunityContext';
import { usePlayers } from '@/contexts/PlayersContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Flame, Users, Swords, ChevronDown, Shield } from 'lucide-react';

function DerbyContent() {
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { historyMatches } = useMatchData(activeCommunityId);
  const { players } = usePlayers();

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Real Captain Selector Header */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl space-y-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full md:w-auto">
              <div className="relative">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 block mb-1">
                  Captain 1
                </label>
                <div className="relative">
                  <select
                    value={captainA}
                    onChange={(e) => setCaptainA(e.target.value)}
                    className="w-full sm:w-56 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-xs font-bold text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none cursor-pointer pr-9 shadow-inner"
                  >
                    {players.map((p) => (
                      <option key={p.uid} value={p.uid} className="bg-slate-900 text-white font-medium">
                        {p.cardName || p.fullName} ({p.primaryPosition}) — OVR {p.overallRating || 80}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 block mb-1">
                  Captain 2
                </label>
                <div className="relative">
                  <select
                    value={captainB}
                    onChange={(e) => setCaptainB(e.target.value)}
                    className="w-full sm:w-56 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-xs font-bold text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-9 shadow-inner"
                  >
                    {players.map((p) => (
                      <option key={p.uid} value={p.uid} className="bg-slate-900 text-white font-medium">
                        {p.cardName || p.fullName} ({p.primaryPosition}) — OVR {p.overallRating || 80}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                </div>
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
