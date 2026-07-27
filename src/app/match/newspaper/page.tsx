'use client';

import React, { useState, useEffect } from 'react';
import SportsNewspaperCover, { MatchResultData } from '@/components/newspaper/SportsNewspaperCover';
import { Newspaper, Sparkles, RefreshCw, Trophy, Flame, ChevronDown } from 'lucide-react';
import { useMatchData } from '@/hooks/useMatchData';
import { useCommunity } from '@/contexts/CommunityContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SiteSkeletonLoader from '@/components/ui/SiteSkeletonLoader';

function NewspaperContent() {
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { historyMatches, loading } = useMatchData(activeCommunityId);

  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [matchData, setMatchData] = useState<MatchResultData>({
    teamAName: 'Team A',
    teamBName: 'Team B',
    scoreA: 0,
    scoreB: 0,
    matchType: 'League Match',
    isComeback: false,
    isCleanSheet: false,
    venue: activeCommunity ? `${activeCommunity.name} Pitch` : 'Community Pitch',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
    motm: {
      name: 'Player MOTM',
      rating: 8.5,
      goals: 1,
      assists: 1,
      keyPasses: 2,
    },
    lineupA: [],
    lineupB: [],
  });

  // Automatically load selected real history match
  useEffect(() => {
    if (historyMatches && historyMatches.length > 0) {
      const match = historyMatches.find((m) => m.id === selectedMatchId) || historyMatches[0];
      if (match) {
        setSelectedMatchId(match.id);

        const dateStr = match.createdAt
          ? new Date(match.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
          : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

        const motmName = match.motm?.cardName || match.motm?.fullName || 'Match MVP';

        setMatchData({
          teamAName: match.teamAName || `${activeCommunity?.name || 'Community'} Team A`,
          teamBName: match.teamBName || `${activeCommunity?.name || 'Community'} Team B`,
          scoreA: match.scoreA ?? 0,
          scoreB: match.scoreB ?? 0,
          matchType: match.matchType || 'Community Hagaz',
          isComeback: Math.abs((match.scoreA || 0) - (match.scoreB || 0)) <= 1 && (match.scoreA || 0) > 0,
          isCleanSheet: match.scoreA === 0 || match.scoreB === 0,
          venue: match.venue || `${activeCommunity?.name || 'Community'} Turf Pitch`,
          date: dateStr,
          motm: {
            name: motmName,
            rating: match.motmRating || 9.0,
            goals: match.motmGoals || 1,
            assists: match.motmAssists || 0,
            keyPasses: match.motmKeyPasses || 2,
          },
          lineupA: (match.teamA || []).map((p: any) => p.cardName || p.fullName || 'Player'),
          lineupB: (match.teamB || []).map((p: any) => p.cardName || p.fullName || 'Player'),
        });
      }
    }
  }, [historyMatches, selectedMatchId, activeCommunity]);

  if (loading) {
    return <SiteSkeletonLoader variant="newspaper" />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            11Media Post-Match Journal
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            "HAGOOZAT DAILY" Newspaper Cover
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Generate vintage sports newspaper headlines and MOTM spotlight cards from real community match results, ready to export as HD PNG images.
          </p>
        </div>

        {/* Real Match Selector Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Select Real Community Match</span>
            </h2>

            {historyMatches && historyMatches.length > 0 ? (
              <div className="relative w-full sm:w-80">
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer pr-10"
                >
                  {historyMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.teamAName || 'Team A'} {m.scoreA} - {m.scoreB} {m.teamBName || 'Team B'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-400">
                No past matches recorded yet in this community
              </span>
            )}
          </div>

          {/* Dynamic Match Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Team A Name</label>
              <input
                type="text"
                value={matchData.teamAName}
                onChange={(e) => setMatchData({ ...matchData, teamAName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Score Team A</label>
              <input
                type="number"
                value={matchData.scoreA}
                onChange={(e) => setMatchData({ ...matchData, scoreA: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Score Team B</label>
              <input
                type="number"
                value={matchData.scoreB}
                onChange={(e) => setMatchData({ ...matchData, scoreB: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Team B Name</label>
              <input
                type="text"
                value={matchData.teamBName}
                onChange={(e) => setMatchData({ ...matchData, teamBName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Newspaper Render Component */}
        <SportsNewspaperCover matchData={matchData} />
      </div>
    </main>
  );
}

export default function NewspaperPage() {
  return (
    <ProtectedRoute requireCommunity>
      <NewspaperContent />
    </ProtectedRoute>
  );
}
