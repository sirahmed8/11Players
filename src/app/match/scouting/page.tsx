'use client';

import React, { useState, useMemo } from 'react';
import OppositionScoutingReport, { DEFAULT_OPPONENT_ROSTER } from '@/components/scouting/OppositionScoutingReport';
import MatchActionHubBar from '@/components/match/MatchActionHubBar';
import { useCommunity } from '@/contexts/CommunityContext';
import { usePlayers } from '@/contexts/PlayersContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProGate from '@/components/ui/ProGate';
import { useLocale } from '@/components/ui/ThemeProvider';
import { ShieldAlert, Users, Search, RefreshCw, Sparkles, Building2 } from 'lucide-react';
import { PlayerProfile } from '@/types';

function ScoutingPageContent() {
  const { activeCommunity } = useCommunity();
  const { players, loading } = usePlayers();
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [teamNameInput, setTeamNameInput] = useState<string>('');
  const [selectedSquadMode, setSelectedSquadMode] = useState<'community' | 'default'>('community');

  // Compute active roster based on mode or community players
  const activeRoster: PlayerProfile[] = useMemo(() => {
    if (selectedSquadMode === 'community' && players && players.length >= 5) {
      return players.map(p => ({
        uid: p.uid,
        fullName: p.fullName || 'Community Player',
        cardName: p.cardName || p.fullName || 'Player',
        dateOfBirth: p.dateOfBirth || '2000-01-01',
        calculatedAge: p.calculatedAge || 24,
        height: p.height || 178,
        weight: p.weight || 74,
        preferredFoot: p.preferredFoot || 'Right',
        primaryPosition: p.primaryPosition || 'CMF',
        secondaryPosition: p.secondaryPosition,
        tertiaryPosition: p.tertiaryPosition,
        attributes: p.attributes || {
          offensiveAwareness: 70, ballControl: 70, dribbling: 70, lowPass: 70, loftedPass: 70,
          finishing: 70, heading: 70, speed: 70, acceleration: 70, kickingPower: 70, jump: 70,
          physicalContact: 70, balance: 70, stamina: 70, defensiveAwareness: 70, ballWinning: 70,
          aggression: 70, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
        },
        specialSkills: p.specialSkills || [],
        photoUrl: p.photoUrl || '',
        isVerifiedByAdmin: true,
        hasWarning: false,
        stats: p.stats || { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 }
      }));
    }
    return DEFAULT_OPPONENT_ROSTER;
  }, [selectedSquadMode, players]);

  const effectiveTeamName = useMemo(() => {
    if (teamNameInput.trim()) return teamNameInput.trim();
    if (selectedSquadMode === 'community' && activeCommunity?.name) {
      return `${activeCommunity.name} XI`;
    }
    return 'Cairo Gladiators FC';
  }, [teamNameInput, selectedSquadMode, activeCommunity]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Action Hub Bar */}
        <MatchActionHubBar />

        {/* Page Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isAr ? 'كشافة الخصم الذكية' : 'Pre-Match AI Scouting'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {isAr ? 'تقرير الكشافة التكتيكي 11AI' : '11AI Tactical Opposition Scouting'}
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                {isAr
                  ? 'حلل نقاط ضعف الخصم، ومصادر الخطورة الهجومية، ونقاط التفوق التكتيكي تلقائياً مع خطط مضادة موجهة ونظام ضغط مدروس.'
                  : 'Analyze opponent weakness zones, key attacking threats, and tactical exploits automatically with bespoke counter-strategies and press intensity modes.'}
              </p>
            </div>

            {/* Quick Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center bg-slate-800/60 p-1 rounded-2xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setSelectedSquadMode('community')}
                  disabled={!players || players.length < 5}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    selectedSquadMode === 'community'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white disabled:opacity-40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isAr ? 'روستر المجتمع' : 'Community Roster'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSquadMode('default')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    selectedSquadMode === 'default'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فريق نموذجي' : 'Benchmark XI'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  placeholder={isAr ? 'اسم الفريق الخصم...' : 'Opponent team name...'}
                  className="w-full sm:w-56 px-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pro-Gated Scouting Report Component */}
        <ProGate requiredPlan="pro_captain" featureNameEn="11AI Tactical Opposition Scouting" featureNameAr="كشافة الخصم وتحليل التكتيك بالذكاء الاصطناعي">
          <OppositionScoutingReport
            roster={activeRoster}
            teamName={effectiveTeamName}
          />
        </ProGate>
      </div>
    </div>
  );
}

export default function ScoutingPage() {
  return (
    <ProtectedRoute>
      <ScoutingPageContent />
    </ProtectedRoute>
  );
}
