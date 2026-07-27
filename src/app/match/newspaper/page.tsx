'use client';

import React, { useState } from 'react';
import SportsNewspaperCover, { MatchResultData, DEFAULT_MATCH_DATA } from '@/components/newspaper/SportsNewspaperCover';
import { Newspaper, Sparkles, RefreshCw, Trophy, Flame } from 'lucide-react';

export default function NewspaperPage() {
  const [matchData, setMatchData] = useState<MatchResultData>(DEFAULT_MATCH_DATA);

  const presets: { label: string; data: MatchResultData }[] = [
    {
      label: '🔥 3-2 Derby Comeback',
      data: DEFAULT_MATCH_DATA
    },
    {
      label: '⚡ 5-0 Tactical Masterclass',
      data: {
        teamAName: 'Cairo Giants',
        teamBName: 'Alexandria Titans',
        scoreA: 5,
        scoreB: 0,
        matchType: 'League',
        isComeback: false,
        isCleanSheet: true,
        venue: 'Cairo International Stadium',
        date: 'JULY 27, 2026',
        motm: {
          name: 'Omar Farouk',
          rating: 9.8,
          goals: 3,
          assists: 2,
          keyPasses: 6
        },
        lineupA: ['H. El-Shenawy', 'A. Hakimi', 'M. Abdelmonem', 'R. Saiss', 'Y. Attiat-Allah', 'S. Amrabat', 'A. Ounahi', 'O. Farouk', 'H. Ziyech', 'Y. En-Nesyri', 'K. Al-Masri'],
        lineupB: ['Y. Bounou', 'N. Mazraoui', 'K. Koulibaly', 'N. Aguerd', 'A. Davies', 'T. Partey', 'F. Kessie', 'M. Kudus', 'M. Salah', 'V. Osimhen', 'S. Mane']
      }
    },
    {
      label: '🤝 2-2 Epic Draw',
      data: {
        teamAName: 'Red Devils FC',
        teamBName: 'White Knights FC',
        scoreA: 2,
        scoreB: 2,
        matchType: 'Classic',
        venue: 'Air Defense Stadium',
        date: 'JULY 27, 2026',
        motm: {
          name: 'Youssef Nabil',
          rating: 8.9,
          goals: 1,
          assists: 1,
          keyPasses: 3
        },
        lineupA: ['H. El-Shenawy', 'A. Hakimi', 'M. Abdelmonem', 'R. Saiss', 'Y. Attiat-Allah', 'S. Amrabat', 'A. Ounahi', 'B. Diaz', 'H. Ziyech', 'Y. En-Nesyri', 'K. Al-Masri'],
        lineupB: ['Y. Bounou', 'N. Mazraoui', 'K. Koulibaly', 'N. Aguerd', 'A. Davies', 'T. Partey', 'F. Kessie', 'M. Kudus', 'M. Salah', 'V. Osimhen', 'S. Mane']
      }
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            11Media Generator
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            "HAGOOZAT DAILY" Post-Match Cover
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Generate retro sports newspaper headlines, MOTM spotlight cards, and match reports instantly downloadable as high-res PNG images.
          </p>
        </div>

        {/* Customization Controls Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              Customize Match Data & Headline Presets
            </h2>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              Quick Presets:
            </span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setMatchData(preset.data)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
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

        {/* Live Newspaper Component */}
        <SportsNewspaperCover matchData={matchData} />
      </div>
    </main>
  );
}
