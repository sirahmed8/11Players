'use client';

import React from 'react';
import CaptainDraftRoom from '@/components/draft/CaptainDraftRoom';
import { usePlayers } from '@/contexts/PlayersContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Swords, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function DraftContent() {
  const { players } = usePlayers();
  const { user } = useAuth();

  const handleMatchLaunch = (teamA: any[], teamB: any[]) => {
    console.log('Match Launched with Teams:', { teamA, teamB });
    if (typeof window !== 'undefined') {
      window.location.href = '/match/live';
    }
  };

  const hasEnoughPlayers = players && players.length >= 2;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      {!hasEnoughPlayers ? (
        <div className="max-w-xl mx-auto py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Swords className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Captain Draft Room Inactive</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto font-medium">
              The Captain Draft Room activates during match preparation when team captains pick squads from available registered community players.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>How Squad Drafting Works</span>
            </div>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>Captains alternate picks in real-time (Classic / Snake Draft).</li>
              <li>OVR & Positional Suitability Index (PSI) balance meters auto-update after each pick.</li>
              <li>Once balanced squads are selected, captains launch the live match.</li>
            </ul>
          </div>

          <Link
            href="/matches"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-emerald-500/25"
          >
            <Calendar className="w-4 h-4" />
            <span>Go to Matches Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <CaptainDraftRoom
          initialPlayers={players}
          captain1Uid={user?.uid}
          onMatchLaunch={handleMatchLaunch}
        />
      )}
    </main>
  );
}

export default function DraftPage() {
  return (
    <ProtectedRoute requireCommunity>
      <DraftContent />
    </ProtectedRoute>
  );
}
