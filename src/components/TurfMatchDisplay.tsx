"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { Users, RotateCw, Trophy, Timer, ChevronDown, ChevronUp, RefreshCw, Bot, X } from 'lucide-react';
import type { TurfMatchmakingResult, TurfTeam } from '@/lib/turfMatchmaker';

interface TurfMatchDisplayProps {
  turfResult: TurfMatchmakingResult;
  isAr?: boolean;
}

const OVR_BADGE = ({ ovr }: { ovr: number }) => {
  const color =
    ovr >= 80 ? 'bg-amber-400 text-black' :
    ovr >= 70 ? 'bg-emerald-500 text-white' :
    ovr >= 60 ? 'bg-blue-500 text-white' :
    'bg-slate-500 text-white';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${color}`}>
      {ovr}
    </span>
  );
};

const TeamCard = ({ team, isAr, gkMode, onSubstitute }: { team: TurfTeam; isAr: boolean; gkMode: string; onSubstitute: (teamId: string, playerUid: string) => void }) => {
  const [expanded, setExpanded] = useState(true);

  const teamColorClass = (() => {
    const colors = [
      'from-emerald-600 to-teal-600',
      'from-blue-600 to-indigo-600',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-600',
    ];
    const idx = parseInt(team.id.replace('team_', '')) - 1;
    return colors[idx % colors.length];
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Team Header */}
      <div className={`bg-gradient-to-r ${teamColorClass} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{team.name}</h3>
            <p className="text-xs text-white/80">
              {isAr ? `متوسط التقييم: ${team.avgOvr}` : `Avg OVR: ${team.avgOvr}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-black text-white">{team.avgOvr}</div>
            <div className="text-xs text-white/70">{isAr ? 'متوسط OVR' : 'Avg OVR'}</div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Players List */}
      {expanded && (
        <div className="p-4 space-y-2">
          {team.players.map((player, idx) => {
            const isGk = gkMode === 'rotating'
              ? team.gkOrder[0]?.uid === player.uid // First in rotation is current GK
              : idx === team.players.length - 1; // Last added as fixed GK

            const ovr = Math.round(
              Object.values(player.attributes || {}).reduce((a: number, b: number) => a + b, 0) / 
              Math.max(1, Object.values(player.attributes || {}).length)
            );

            return (
              <div
                key={player.uid}
                className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-black text-slate-500">
                      {(player.cardName || player.fullName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {player.cardName || player.fullName}
                    </span>
                    {isGk && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md">
                        🥅 GK
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {player.primaryPosition}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <OVR_BADGE ovr={ovr || 60} />
                  <button
                    onClick={() => onSubstitute(team.id, player.uid)}
                    title={isAr ? "تبديل لاعب" : "Substitute Player"}
                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GK Rotation Order */}
      {gkMode === 'rotating' && expanded && team.gkOrder.length > 1 && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
            <div className="text-xs font-black text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              {isAr ? 'ترتيب دوران حارس المرمى:' : 'GK Rotation Order:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {team.gkOrder.map((player, i) => (
                <span
                  key={player.uid}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    i === 0
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {i + 1}. {player.cardName || player.fullName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const WinnerStaysOnTracker = ({ teams, isAr }: { teams: TurfTeam[], isAr: boolean }) => {
  // activeTeams[0] is always considered the "King" (current winner), activeTeams[1] is the "Challenger"
  const [activeTeams, setActiveTeams] = useState<[TurfTeam, TurfTeam]>([teams[0], teams[1]]);
  const [waitingTeams, setWaitingTeams] = useState<TurfTeam[]>(teams.slice(2));
  const [currentStreak, setCurrentStreak] = useState(0);
  const [matchHistory, setMatchHistory] = useState<{ winner: string, loser: string | 'draw', streak: number }[]>([]);

  const handleResult = (result: 'king_wins' | 'challenger_wins' | 'draw') => {
    const [king, challenger] = activeTeams;
    let nextKing: TurfTeam;
    let nextWaiting = [...waitingTeams];
    let newStreak = 0;

    if (result === 'king_wins') {
      nextKing = king;
      nextWaiting.push(challenger);
      newStreak = currentStreak + 1;
      setMatchHistory(prev => [...prev, { winner: king.name, loser: challenger.name, streak: newStreak }]);
    } else if (result === 'challenger_wins') {
      nextKing = challenger;
      nextWaiting.push(king);
      newStreak = 1;
      setMatchHistory(prev => [...prev, { winner: challenger.name, loser: king.name, streak: newStreak }]);
    } else {
      // Draw: The challenger stays, King leaves (or vice versa, but usually King leaves if they draw to give others a chance)
      nextKing = challenger;
      nextWaiting.push(king);
      newStreak = 0;
      setMatchHistory(prev => [...prev, { winner: 'Draw', loser: 'draw', streak: 0 }]);
    }

    if (nextWaiting.length > 0) {
      const nextChallenger = nextWaiting.shift()!;
      setActiveTeams([nextKing, nextChallenger]);
      setWaitingTeams(nextWaiting);
    } else {
      // If only 2 teams total
      setActiveTeams([nextKing, nextWaiting.pop() || (result === 'king_wins' ? challenger : king)]);
    }
    setCurrentStreak(newStreak);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-lg">
          <RotateCw className="w-5 h-5 text-amber-500" />
          {isAr ? 'الكسبان مستمر' : 'Winner Stays On'}
        </div>
        {currentStreak > 0 && (
          <div className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black rounded-xl text-sm animate-pulse">
            🔥 {isAr ? `سلسلة انتصارات: ${currentStreak}` : `Win Streak: ${currentStreak}`}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
        <div className="text-center">
          <div className="text-xs font-bold text-amber-500 mb-1">{isAr ? 'الملك' : 'King'}</div>
          <div className="font-black text-slate-900 dark:text-white text-lg">{activeTeams[0].name}</div>
        </div>
        <div className="text-center font-black text-slate-400">VS</div>
        <div className="text-center">
          <div className="text-xs font-bold text-blue-500 mb-1">{isAr ? 'المتحدي' : 'Challenger'}</div>
          <div className="font-black text-slate-900 dark:text-white text-lg">{activeTeams[1].name}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleResult('king_wins')}
          className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black transition-colors"
        >
          {isAr ? `فوز ${activeTeams[0].name}` : `${activeTeams[0].name} Wins`}
        </button>
        <button
          onClick={() => handleResult('draw')}
          className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-black transition-colors"
        >
          {isAr ? 'تعادل' : 'Draw'}
        </button>
        <button
          onClick={() => handleResult('challenger_wins')}
          className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black transition-colors"
        >
          {isAr ? `فوز ${activeTeams[1].name}` : `${activeTeams[1].name} Wins`}
        </button>
      </div>

      {waitingTeams.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-slate-500 mb-2">{isAr ? 'في الانتظار:' : 'Waiting:'}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {waitingTeams.map((t, i) => (
              <div key={t.id} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {i + 1}. {t.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function TurfMatchDisplay({ turfResult, isAr = false }: TurfMatchDisplayProps) {
  const [showFixtures, setShowFixtures] = useState(true);
  const [localTeams, setLocalTeams] = useState<TurfTeam[]>(turfResult.teams);
  const [subTarget, setSubTarget] = useState<{ teamId: string, playerUid: string } | null>(null);

  // When turfResult updates (e.g. from MatchConfigModal generation), reset localTeams
  useEffect(() => {
    setLocalTeams(turfResult.teams);
  }, [turfResult]);

  const {
    fixtures,
    matchType,
    numTeams,
    playersPerTeam,
    gkMode,
    gkRotationInterval,
    matchDurationMins
  } = turfResult;

  const formatLabel = isAr
    ? `${numTeams} فرق × ${playersPerTeam} لاعبين — ${matchDurationMins} دق — ${gkMode === 'rotating' ? `دوران الحراسة ${gkRotationInterval === 'per_goal' ? 'كل هدف' : 'كل مباراة'}` : 'حارس ثابت'}`
    : `${numTeams} teams × ${playersPerTeam} players — ${matchDurationMins} min — ${gkMode === 'rotating' ? `rotating GK ${gkRotationInterval === 'per_goal' ? 'per goal' : 'per match'}` : 'fixed GK'}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            ⚽
          </div>
          <div>
            <h2 className="text-xl font-black">
              {isAr ? 'حجز كورة عادي / خماسي' : 'Turf / Casual Match'}
            </h2>
            <p className="text-xs text-white/80">{formatLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {numTeams} {isAr ? 'فرق' : 'teams'}
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            <Timer className="w-3.5 h-3.5" />
            {matchDurationMins} {isAr ? 'دق' : 'min'}
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            {matchType === 'league' ? (isAr ? 'دوري' : 'League') : (isAr ? 'كأس' : 'Knockout')}
          </div>
          {gkMode === 'rotating' && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
              <RotateCw className="w-3.5 h-3.5" />
              {isAr ? 'دوران الحراسة' : 'Rotating GK'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Teams Grid */}
      <div className={`grid gap-4 ${numTeams === 2 ? 'grid-cols-1 sm:grid-cols-2' : numTeams === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {localTeams.map((team, idx) => (
          <TeamCard
            key={team.id}
            team={team}
            isAr={isAr}
            gkMode={gkMode}
            onSubstitute={(teamId, playerUid) => setSubTarget({ teamId, playerUid })}
          />
        ))}
      </div>

      {/* Winner Stays On Tracker */}
      {matchType === 'winner_stays' && localTeams.length >= 2 && (
        <WinnerStaysOnTracker teams={localTeams} isAr={isAr} />
      )}

      {/* Fixture Schedule */}
      {matchType !== 'winner_stays' && fixtures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
        >
          <button
            onClick={() => setShowFixtures(f => !f)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <Trophy className="w-5 h-5 text-amber-500" />
              {isAr
                ? `جدول المباريات (${matchType === 'league' ? 'دوري' : 'كأس'}) — ${fixtures.length} مباراة`
                : `${matchType === 'league' ? 'League' : 'Knockout'} Schedule — ${fixtures.length} matches`
              }
            </div>
            {showFixtures ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showFixtures && (
            <div className="px-4 pb-4 space-y-2">
              {fixtures.map((fixture, idx) => {
                const teamA = localTeams.find(t => t.id === fixture.teamA);
                const teamB = localTeams.find(t => t.id === fixture.teamB);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
                  >
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-12 shrink-0 text-center">
                      {isAr ? `م ${fixture.round}` : `R${fixture.round}`}
                    </span>
                    <div className="flex-1 flex items-center justify-center gap-3">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{teamA?.name || fixture.teamA}</span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-xs font-black text-slate-600 dark:text-slate-400 rounded-full">
                        {isAr ? 'ضد' : 'vs'}
                      </span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">{teamB?.name || fixture.teamB}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      <Timer className="w-3.5 h-3.5" />
                      {matchDurationMins}&apos;
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Substitution Modal */}
      <AnimatePresence>
        {subTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSubTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-500" />
                  {isAr ? 'تبديل لاعب' : 'Substitute Player'}
                </h3>
                <button
                  onClick={() => setSubTarget(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-bold">
                  {isAr ? 'قم باختيار لاعب بديل من الفرق المريحة (خارج الملعب) أو دع الذكاء الاصطناعي يختار أفضل بديل متاح.' : 'Choose a substitute from resting teams or let AI auto-select the best fit.'}
                </p>

                <button
                  onClick={() => {
                    // AI Selection Logic
                    const targetTeam = localTeams.find(t => t.id === subTarget.teamId)!;
                    const targetPlayer = targetTeam.players.find(p => p.uid === subTarget.playerUid)!;
                    const targetPos = targetPlayer.primaryPosition || 'CMF';

                    // Get all players not in the current active team
                    let candidateTeams = localTeams.filter(t => t.id !== subTarget.teamId);
                    
                    const candidates = candidateTeams.flatMap(t => t.players.map(p => ({ player: p, sourceTeamId: t.id })));
                    
                    // Simple heuristic: same primary position, closest OVR
                    const targetOvr = Math.round(Object.values(targetPlayer.attributes || {}).reduce((a: number, b: number) => a + b, 0) / Math.max(1, Object.values(targetPlayer.attributes || {}).length));
                    
                    const sortedCandidates = candidates.sort((a, b) => {
                      const aIsSamePos = (a.player.primaryPosition || 'CMF') === targetPos;
                      const bIsSamePos = (b.player.primaryPosition || 'CMF') === targetPos;
                      if (aIsSamePos && !bIsSamePos) return -1;
                      if (!aIsSamePos && bIsSamePos) return 1;
                      
                      const aOvr = Math.round(Object.values(a.player.attributes || {}).reduce((sum: number, val: number) => sum + val, 0) / Math.max(1, Object.values(a.player.attributes || {}).length));
                      const bOvr = Math.round(Object.values(b.player.attributes || {}).reduce((sum: number, val: number) => sum + val, 0) / Math.max(1, Object.values(b.player.attributes || {}).length));
                      
                      return Math.abs(aOvr - targetOvr) - Math.abs(bOvr - targetOvr);
                    });

                    if (sortedCandidates.length > 0) {
                      const bestCandidate = sortedCandidates[0];
                      // Perform Swap
                      const newTeams = localTeams.map(team => {
                        if (team.id === subTarget.teamId) {
                          return {
                            ...team,
                            players: team.players.map(p => p.uid === subTarget.playerUid ? bestCandidate.player : p)
                          };
                        }
                        if (team.id === bestCandidate.sourceTeamId) {
                          return {
                            ...team,
                            players: team.players.map(p => p.uid === bestCandidate.player.uid ? targetPlayer : p)
                          };
                        }
                        return team;
                      });
                      setLocalTeams(newTeams);
                      setSubTarget(null);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-3 rounded-xl hover:shadow-lg transition-all mb-6"
                >
                  <Bot className="w-5 h-5" />
                  {isAr ? 'التبديل التلقائي (AI)' : 'Auto-Select Substitute'}
                </button>

                <div className="space-y-4">
                  {localTeams.filter(t => t.id !== subTarget.teamId).map(team => (
                    <div key={team.id}>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{team.name}</h4>
                      <div className="space-y-2">
                        {team.players.map(player => {
                          const ovr = Math.round(Object.values(player.attributes || {}).reduce((a: number, b: number) => a + b, 0) / Math.max(1, Object.values(player.attributes || {}).length));
                          return (
                            <button
                              key={player.uid}
                              onClick={() => {
                                // Manual swap
                                const targetTeam = localTeams.find(t => t.id === subTarget.teamId)!;
                                const targetPlayer = targetTeam.players.find(p => p.uid === subTarget.playerUid)!;
                                const newTeams = localTeams.map(t => {
                                  if (t.id === subTarget.teamId) {
                                    return {
                                      ...t,
                                      players: t.players.map(p => p.uid === subTarget.playerUid ? player : p)
                                    };
                                  }
                                  if (t.id === team.id) {
                                    return {
                                      ...t,
                                      players: t.players.map(p => p.uid === player.uid ? targetPlayer : p)
                                    };
                                  }
                                  return t;
                                });
                                setLocalTeams(newTeams);
                                setSubTarget(null);
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {player.cardName || player.fullName}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {player.primaryPosition}
                                </div>
                              </div>
                              <OVR_BADGE ovr={ovr || 60} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
