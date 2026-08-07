"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { Users, RotateCw, Trophy, Timer, ChevronDown, ChevronUp, RefreshCw, Bot, X, UserPlus, UserMinus, Settings, Check, Sparkles, Shield, UserCheck, Search, SlidersHorizontal, Save } from 'lucide-react';
import { generateTurfMatch, type TurfMatchmakingResult, type TurfTeam } from '@/lib/engine';
import { renderMiniPitch } from './shared/PitchRenderer';
import { OVR_BADGE } from './shared/PlayerBadge';
import PlayerCardCompact from '@/components/player/PlayerCardCompact';
import { PlayerProfile } from '@/types';
import toast from 'react-hot-toast';

interface TurfMatchDisplayProps {
  turfResult: TurfMatchmakingResult;
  isAr?: boolean;
  isAdmin?: boolean;
  captainVotes?: Record<string, string>;
  onVoteCaptain?: (targetUid: string) => void;
  currentUserUid?: string;
  allCommunityPlayers?: PlayerProfile[];
  signedUpPlayerUids?: string[];
  onSaveTurfResult?: (newResult: TurfMatchmakingResult, newConfig?: any) => Promise<void>;
  onSaveAttendance?: (newUids: string[]) => Promise<void>;
  matchConfig?: any;
}





const TeamCard = ({
  team,
  isAr,
  gkMode,
  onSubstitute,
  captainVotes = {},
  onVoteCaptain,
  currentUserUid
}: {
  team: TurfTeam;
  isAr: boolean;
  gkMode: string;
  onSubstitute: (teamId: string, playerUid: string) => void;
  captainVotes?: Record<string, string>;
  onVoteCaptain?: (targetUid: string) => void;
  currentUserUid?: string;
}) => {
  const [expanded, setExpanded] = useState(true);

  // Compute vote counts for this turf team
  const { topCaptainUid, voteCounts } = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let topUid = '';
    let maxVotes = 0;
    const teamUids = new Set(team.players.map(p => p.uid));

    Object.values(captainVotes || {}).forEach(candidateUid => {
      if (teamUids.has(candidateUid)) {
        counts[candidateUid] = (counts[candidateUid] || 0) + 1;
        if (counts[candidateUid] > maxVotes) {
          maxVotes = counts[candidateUid];
          topUid = candidateUid;
        }
      }
    });
    return { topCaptainUid: maxVotes > 0 ? topUid : (team.players[0]?.uid || ''), voteCounts: counts };
  }, [captainVotes, team.players]);


  const teamHex = (() => {
    const idx = parseInt(team.id.replace('team_', '')) - 1;
    return ['#059669', '#2563EB', '#F59E0B', '#E11D48'][idx % 4];
  })();

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
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xl"
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

      
      {/* Mini Pitch View */}
      {renderMiniPitch(team.assignedPlayers && team.assignedPlayers.length > 0 ? team.assignedPlayers : team.players, teamHex, team.formation)}

      {/* Players List */}

      {expanded && (
        <div className="p-4 space-y-2">
          {team.players.map((player, idx) => {
            const isGk = gkMode === 'rotating'
              ? team.gkOrder[0]?.uid === player.uid // First in rotation is current GK
              : (team.fixedGkUid === player.uid || (!team.fixedGkUid && idx === team.players.length - 1)); // Fixed GK picked or fallback to last

            const isCaptain = topCaptainUid === player.uid;
            
            const isVotedByMe = currentUserUid && captainVotes[currentUserUid] === player.uid;
            const voteCount = voteCounts[player.uid] || 0;
            const canVote = !!currentUserUid && currentUserUid !== player.uid;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                key={player.uid}
                className="w-full relative"
              >
                <PlayerCardCompact
                  player={player}
                  currentUserId={currentUserUid}
                  isMatchCaptain={isCaptain}
                  isMatchGK={isGk}
                  isMatchSuspended={player.stats?.isSuspended}
                  matchVoteCount={voteCount > 0 ? voteCount : undefined}
                  onVoteCaptain={canVote ? onVoteCaptain : undefined}
                  rightActionSlot={
                    <button
                      onClick={() => onSubstitute(team.id, player.uid)}
                      title={isAr ? "تبديل لاعب" : "Substitute Player"}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all shadow-sm bg-slate-900/50 border border-slate-700 hover:border-amber-500/50 group"
                    >
                      <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-300" />
                    </button>
                  }
                />
              </motion.div>
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

type PenaltyState = {
  active: boolean;
  kicks: number; // per team (1-5)
  kingKeeper: string | null;
  challengerKeeper: string | null;
  results: { team: 'king' | 'challenger'; scored: boolean }[];
  suddenDeath: boolean;
  done: boolean;
  winner: 'king' | 'challenger' | null;
};

const DEFAULT_PENALTY: PenaltyState = {
  active: false,
  kicks: 3,
  kingKeeper: null,
  challengerKeeper: null,
  results: [],
  suddenDeath: false,
  done: false,
  winner: null,
};

const WinnerStaysOnTracker = ({ teams, isAr }: { teams: TurfTeam[], isAr: boolean }) => {
  const [activeTeams, setActiveTeams] = useState<[TurfTeam, TurfTeam]>([teams[0], teams[1]]);
  const [waitingTeams, setWaitingTeams] = useState<TurfTeam[]>(teams.slice(2));
  const [currentStreak, setCurrentStreak] = useState(0);
  const [matchHistory, setMatchHistory] = useState<{ winner: string, loser: string | 'draw', streak: number, pens?: string }[]>([]);
  const [penalty, setPenalty] = useState<PenaltyState>(DEFAULT_PENALTY);
  const [showSetup, setShowSetup] = useState(false); // Penalty setup screen

  const [king, challenger] = activeTeams;

  // --- Penalty logic helpers ---
  const kingScore = penalty.results.filter(r => r.team === 'king' && r.scored).length;
  const challengerScore = penalty.results.filter(r => r.team === 'challenger' && r.scored).length;
  const kingTotal = penalty.results.filter(r => r.team === 'king').length;
  const challengerTotal = penalty.results.filter(r => r.team === 'challenger').length;

  const checkPenaltyDone = (results: PenaltyState['results'], kicks: number, suddenDeath: boolean) => {
    const kS = results.filter(r => r.team === 'king' && r.scored).length;
    const cS = results.filter(r => r.team === 'challenger' && r.scored).length;
    const kT = results.filter(r => r.team === 'king').length;
    const cT = results.filter(r => r.team === 'challenger').length;
    const remaining_k = kicks - kT;
    const remaining_c = kicks - cT;

    if (!suddenDeath) {
      // Early win: team mathematically can't be caught
      if (kT === kicks && cT === kicks) {
        if (kS > cS) return { done: true, winner: 'king' as const };
        if (cS > kS) return { done: true, winner: 'challenger' as const };
        // Tied after all kicks -> sudden death
        return { done: false, suddenDeath: true };
      }
      // King takes all their kicks early win check
      if (kS > cS + remaining_c) return { done: true, winner: 'king' as const };
      if (cS > kS + remaining_k) return { done: true, winner: 'challenger' as const };
    } else {
      // Sudden death: each team takes 1 kick per round
      if (kT === cT && kT > 0) {
        // Both have taken same number in SD
        const sdStart = kicks; // rounds done before SD
        const sdKings = results.slice(sdStart * 2).filter(r => r.team === 'king');
        const sdChallengers = results.slice(sdStart * 2).filter(r => r.team === 'challenger');
        const lastRound = Math.min(sdKings.length, sdChallengers.length);
        if (lastRound > 0) {
          const lastKingScored = sdKings[lastRound - 1]?.scored;
          const lastChallengerScored = sdChallengers[lastRound - 1]?.scored;
          if (lastKingScored && !lastChallengerScored) return { done: true, winner: 'king' as const };
          if (!lastKingScored && lastChallengerScored) return { done: true, winner: 'challenger' as const };
          // both scored or both missed -> continue SD
        }
      }
    }
    return { done: false };
  };

  // Who kicks next?
  const nextKicker = (): 'king' | 'challenger' | null => {
    if (penalty.done) return null;
    const kicks = penalty.kicks;
    const results = penalty.results;
    const kT = results.filter(r => r.team === 'king').length;
    const cT = results.filter(r => r.team === 'challenger').length;

    if (!penalty.suddenDeath) {
      // Alternate: king, challenger, king, challenger...
      // Position in sequence: kT + cT kicks taken total
      const total = kT + cT;
      // King kicks at even positions (0,2,4...) = positions where total % 2 == 0
      if (total % 2 === 0 && kT < kicks) return 'king';
      if (total % 2 === 1 && cT < kicks) return 'challenger';
      if (kT < kicks) return 'king';
      if (cT < kicks) return 'challenger';
    } else {
      // Sudden death: king kicks then challenger alternates
      const sdResults = results.slice(kicks * 2);
      const sdKings = sdResults.filter(r => r.team === 'king').length;
      const sdChall = sdResults.filter(r => r.team === 'challenger').length;
      if (sdKings === sdChall) return 'king';
      return 'challenger';
    }
    return null;
  };

  const recordKick = (scored: boolean) => {
    const kicker = nextKicker();
    if (!kicker) return;
    const newResults = [...penalty.results, { team: kicker, scored }];
    const { done, winner, suddenDeath } = checkPenaltyDone(newResults, penalty.kicks, penalty.suddenDeath || false) as any;

    if (done && winner) {
      const winTeam = winner === 'king' ? king : challenger;
      const loseTeam = winner === 'king' ? challenger : king;
      const kS2 = newResults.filter(r => r.team === 'king' && r.scored).length;
      const cS2 = newResults.filter(r => r.team === 'challenger' && r.scored).length;
      setPenalty(prev => ({ ...prev, results: newResults, done: true, winner, suddenDeath: suddenDeath || prev.suddenDeath }));
      // Auto-resolve after brief display
      setTimeout(() => {
        resolvePenaltyWinner(winner, winTeam, loseTeam, `${kS2}-${cS2}`);
      }, 2000);
    } else {
      setPenalty(prev => ({ ...prev, results: newResults, suddenDeath: suddenDeath || prev.suddenDeath }));
    }
  };

  const resolvePenaltyWinner = (winner: 'king' | 'challenger', winTeam: TurfTeam, loseTeam: TurfTeam, score: string) => {
    const newStreak = winner === 'king' ? currentStreak + 1 : 1;
    setMatchHistory(prev => [...prev, {
      winner: winTeam.name,
      loser: loseTeam.name,
      streak: newStreak,
      pens: `pens ${score}`
    }]);

    let nextWaiting = [...waitingTeams];
    nextWaiting.push(loseTeam);
    const nextChallenger = nextWaiting.length > 0 ? nextWaiting.shift()! : loseTeam;
    setActiveTeams([winTeam, nextChallenger]);
    setWaitingTeams(nextWaiting);
    setCurrentStreak(newStreak);
    setPenalty(DEFAULT_PENALTY);
    setShowSetup(false);
  };

  const handleResult = (result: 'king_wins' | 'challenger_wins' | 'draw') => {
    if (result === 'draw') {
      // Trigger penalty setup instead of immediate rotation
      setShowSetup(true);
      return;
    }

    let nextKing: TurfTeam;
    let nextWaiting = [...waitingTeams];
    let newStreak = 0;

    if (result === 'king_wins') {
      nextKing = king;
      nextWaiting.push(challenger);
      newStreak = currentStreak + 1;
      setMatchHistory(prev => [...prev, { winner: king.name, loser: challenger.name, streak: newStreak }]);
    } else {
      nextKing = challenger;
      nextWaiting.push(king);
      newStreak = 1;
      setMatchHistory(prev => [...prev, { winner: challenger.name, loser: king.name, streak: newStreak }]);
    }

    const nextChallenger = nextWaiting.length > 0 ? nextWaiting.shift()! : (result === 'king_wins' ? challenger : king);
    setActiveTeams([nextKing, nextChallenger]);
    setWaitingTeams(nextWaiting);
    setCurrentStreak(newStreak);
  };

  const kicker = nextKicker();
  const kickerTeam = kicker === 'king' ? king : challenger;

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

      {/* Current Match */}
      <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
        <div className="text-center">
          <div className="text-xs font-bold text-amber-500 mb-1">{isAr ? 'الملك' : 'King'}</div>
          <div className="font-black text-slate-900 dark:text-white text-lg">{king.name}</div>
        </div>
        <div className="text-center font-black text-slate-400">VS</div>
        <div className="text-center">
          <div className="text-xs font-bold text-blue-500 mb-1">{isAr ? 'المتحدي' : 'Challenger'}</div>
          <div className="font-black text-slate-900 dark:text-white text-lg">{challenger.name}</div>
        </div>
      </div>

      {/* Result Buttons (hidden during penalty) */}
      {!showSetup && !penalty.active && (
        <div className="flex gap-2">
          <button
            onClick={() => handleResult('king_wins')}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black transition-colors"
          >
            {isAr ? `فوز ${king.name}` : `${king.name} Wins`}
          </button>
          <button
            onClick={() => handleResult('draw')}
            className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-black transition-colors"
          >
            ⚖️ {isAr ? 'تعادل ← ركلات' : 'Draw → Pens'}
          </button>
          <button
            onClick={() => handleResult('challenger_wins')}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black transition-colors"
          >
            {isAr ? `فوز ${challenger.name}` : `${challenger.name} Wins`}
          </button>
        </div>
      )}

      {/* ─── Penalty Shootout Setup ─── */}
      <AnimatePresence>
        {showSetup && !penalty.active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  🥅 {isAr ? 'إعداد ركلات الترجيح' : 'Penalty Shootout Setup'}
                </div>
                <button
                  onClick={() => setShowSetup(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Format selector */}
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  {isAr ? 'عدد الركلات لكل فريق' : 'Kicks per team'}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setPenalty(p => ({ ...p, kicks: n }))}
                      className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                        penalty.kicks === n
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {n}v{n}
                    </button>
                  ))}
                </div>
              </div>

              {/* King Keeper selector */}
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  🥅 {isAr ? `حارس ${king.name} (الملك)` : `${king.name} Keeper (King)`}
                </div>
                <div className="flex flex-wrap gap-2">
                  {king.players.map(p => (
                    <button
                      key={p.uid}
                      onClick={() => setPenalty(prev => ({ ...prev, kingKeeper: p.uid }))}
                      className={`px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                        penalty.kingKeeper === p.uid
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                      }`}
                    >
                      {p.cardName || p.fullName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Challenger Keeper selector */}
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  🥅 {isAr ? `حارس ${challenger.name} (المتحدي)` : `${challenger.name} Keeper (Challenger)`}
                </div>
                <div className="flex flex-wrap gap-2">
                  {challenger.players.map(p => (
                    <button
                      key={p.uid}
                      onClick={() => setPenalty(prev => ({ ...prev, challengerKeeper: p.uid }))}
                      className={`px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                        penalty.challengerKeeper === p.uid
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      {p.cardName || p.fullName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!penalty.kingKeeper || !penalty.challengerKeeper) return;
                  setPenalty(p => ({ ...p, active: true }));
                  setShowSetup(false);
                }}
                disabled={!penalty.kingKeeper || !penalty.challengerKeeper}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                {isAr ? '🚀 ابدأ ركلات الترجيح' : '🚀 Start Penalty Shootout'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Live Penalty Shootout ─── */}
      <AnimatePresence>
        {penalty.active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-blue-400/40 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="font-black text-lg text-slate-900 dark:text-white">
                {penalty.suddenDeath
                  ? (isAr ? '⚡ ركلة مفاجئة' : '⚡ Sudden Death')
                  : (isAr ? `🥅 ركلات ${penalty.kicks}×${penalty.kicks}` : `🥅 ${penalty.kicks}v${penalty.kicks} Pens`)}
              </div>
              {/* Scoreboard */}
              <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 rounded-xl px-4 py-2">
                <span className="text-amber-400 font-black text-xl">{kingScore}</span>
                <span className="text-slate-500 font-black">–</span>
                <span className="text-blue-400 font-black text-xl">{challengerScore}</span>
              </div>
            </div>

            {/* Kick dots */}
            <div className="grid grid-cols-2 gap-4">
              {/* King kicks */}
              <div>
                <div className="text-xs font-bold text-amber-500 mb-2 text-center">{king.name}</div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {Array.from({ length: penalty.kicks }).map((_, i) => {
                    const kick = penalty.results.filter(r => r.team === 'king')[i];
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                          !kick
                            ? 'border-slate-300 dark:border-slate-600 bg-transparent text-slate-400'
                            : kick.scored
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-red-500 bg-red-500 text-white'
                        }`}
                      >
                        {!kick ? i + 1 : kick.scored ? '⚽' : '✗'}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Challenger kicks */}
              <div>
                <div className="text-xs font-bold text-blue-500 mb-2 text-center">{challenger.name}</div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {Array.from({ length: penalty.kicks }).map((_, i) => {
                    const kick = penalty.results.filter(r => r.team === 'challenger')[i];
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                          !kick
                            ? 'border-slate-300 dark:border-slate-600 bg-transparent text-slate-400'
                            : kick.scored
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-red-500 bg-red-500 text-white'
                        }`}
                      >
                        {!kick ? i + 1 : kick.scored ? '⚽' : '✗'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Winner Banner */}
            {penalty.done && penalty.winner && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-black text-xl"
              >
                🏆 {penalty.winner === 'king' ? king.name : challenger.name} {isAr ? 'يفوز بالركلات!' : 'wins on pens!'}
              </motion.div>
            )}

            {/* Next kicker prompt */}
            {!penalty.done && kicker && (
              <div className="text-center">
                <div className={`text-sm font-black mb-3 ${kicker === 'king' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {isAr ? `دور ${kickerTeam.name}` : `${kickerTeam.name}'s turn`}
                  {kicker === 'king' && penalty.challengerKeeper && (
                    <span className="text-slate-500 font-normal text-xs block">
                      {isAr ? `ضد الحارس: ` : `vs keeper: `}
                      {challenger.players.find(p => p.uid === penalty.challengerKeeper)?.cardName || ''}
                    </span>
                  )}
                  {kicker === 'challenger' && penalty.kingKeeper && (
                    <span className="text-slate-500 font-normal text-xs block">
                      {isAr ? `ضد الحارس: ` : `vs keeper: `}
                      {king.players.find(p => p.uid === penalty.kingKeeper)?.cardName || ''}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => recordKick(true)}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-lg transition-all hover:scale-105 active:scale-95"
                  >
                    ⚽ {isAr ? 'هدف!' : 'Goal!'}
                  </button>
                  <button
                    onClick={() => recordKick(false)}
                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-lg transition-all hover:scale-105 active:scale-95"
                  >
                    ✗ {isAr ? 'تصدى / خطأ' : 'Miss / Saved'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting teams */}
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

      {/* Match History */}
      {matchHistory.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div className="text-xs font-bold text-slate-500 mb-2">{isAr ? 'سجل النتائج:' : 'Match Log:'}</div>
          {[...matchHistory].reverse().slice(0, 5).map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="font-bold">{h.winner}</span>
              {h.pens && <span className="text-blue-500 font-bold">({h.pens})</span>}
              {h.streak > 1 && <span className="text-amber-500 font-bold">🔥×{h.streak}</span>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};


const TurfMatchDisplay = React.memo(function TurfMatchDisplay({
  turfResult,
  isAr = false,
  isAdmin = false,
  captainVotes = {},
  onVoteCaptain,
  currentUserUid,
  allCommunityPlayers = [],
  signedUpPlayerUids = [],
  onSaveTurfResult,
  onSaveAttendance,
  matchConfig = {}
}: TurfMatchDisplayProps) {
  const [showFixtures, setShowFixtures] = useState(true);
  const [localTeams, setLocalTeams] = useState<TurfTeam[]>(turfResult.teams);
  const [localWaitingTeams, setLocalWaitingTeams] = useState<TurfTeam[]>(turfResult.waitingTeams || []);
  const [subTarget, setSubTarget] = useState<{ teamId: string, playerUid: string } | null>(null);

  // Live Attendance & Roster Management State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceUids, setAttendanceUids] = useState<Set<string>>(() => {
    if (signedUpPlayerUids && signedUpPlayerUids.length > 0) {
      return new Set(signedUpPlayerUids);
    }
    // Fallback: collect UIDs from current turf teams
    const currentUids = new Set<string>();
    turfResult.teams.forEach(t => t.players.forEach(p => currentUids.add(p.uid)));
    (turfResult.waitingTeams || []).forEach(t => t.players.forEach(p => currentUids.add(p.uid)));
    return currentUids;
  });
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Quick Format Switcher State
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'friendly' | 'league' | 'knockout' | 'winner_stays'>(
    (turfResult.matchType === 'friendly' ? 'friendly' : turfResult.matchType === 'winner_stays' ? 'winner_stays' : turfResult.matchType || 'league') as any
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTeams(turfResult.teams);
    setLocalWaitingTeams(turfResult.waitingTeams || []);
    if (signedUpPlayerUids && signedUpPlayerUids.length > 0) {
      setAttendanceUids(new Set(signedUpPlayerUids));
    }
  }, [turfResult, signedUpPlayerUids]);

  const {
    fixtures,
    matchType,
    numTeams,
    playersPerTeam,
    gkMode,
    gkRotationInterval,
    matchDurationMins,
    endCondition,
    targetGoals
  } = turfResult;

  const formatLabel = isAr
    ? `${numTeams} فرق × ${playersPerTeam} لاعبين — ${matchDurationMins} دق — ${gkMode === 'rotating' ? `دوران الحراسة ${gkRotationInterval === 'per_goal' ? 'كل هدف' : 'كل مباراة'}` : 'حارس ثابت'}`
    : `${numTeams} teams × ${playersPerTeam} players — ${matchDurationMins} min — ${gkMode === 'rotating' ? `rotating GK ${gkRotationInterval === 'per_goal' ? 'per goal' : 'per match'}` : 'fixed GK'}`;

  // Handle Dynamic Re-Generation of Teams from Attendance
  const handleRegenerateTeamsFromAttendance = async () => {
    if (!onSaveTurfResult) {
      toast.error(isAr ? "غير متاح إجراء التعديل الان" : "Update action unavailable");
      return;
    }
    setIsSaving(true);
    try {
      const activeUidsArray = Array.from(attendanceUids);
      const activePlayers = allCommunityPlayers.filter(p => activeUidsArray.includes(p.uid));

      if (activePlayers.length < 4) {
        toast.error(isAr ? "يلزم اختيار 4 لاعبين حاضرين على الأقل لتكوين الفرق" : "At least 4 checked-in players required");
        setIsSaving(false);
        return;
      }

      const currentTurfConfig = {
        numTeams: turfResult.numTeams || matchConfig.numTeams || 2,
        playersPerTeam: turfResult.playersPerTeam || matchConfig.playersPerTeam || 6,
        gkMode: (turfResult.gkMode || matchConfig.gkMode || 'rotating') as 'fixed' | 'rotating',
        fixedGkTeamA: matchConfig.fixedGkTeamA,
        fixedGkTeamB: matchConfig.fixedGkTeamB,
        gkRotationInterval: (turfResult.gkRotationInterval || matchConfig.gkRotationInterval || 'per_match') as any,
        gkRotationMinutes: matchConfig.gkRotationMinutes,
        matchType: selectedFormat,
        matchDurationMins: matchConfig.matchDurationMins || turfResult.matchDurationMins || 20,
        endCondition: matchConfig.endCondition || turfResult.endCondition || 'time',
        targetGoals: matchConfig.targetGoals || turfResult.targetGoals || 3,
      };

      const newTurfResult = generateTurfMatch(activePlayers, currentTurfConfig);

      if (onSaveAttendance) {
        await onSaveAttendance(activeUidsArray);
      }
      await onSaveTurfResult(newTurfResult, { ...matchConfig, matchType: selectedFormat });

      setIsAttendanceModalOpen(false);
      setIsFormatModalOpen(false);
      toast.success(isAr ? "تم إعادة توزيع وتنسيق الفرق وحفظ الحضور بنجاح! ⚡" : "Teams re-balanced and attendance saved successfully! ⚡");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء التحديث" : "Failed to re-generate teams");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Changing Match Format Live
  const handleApplyFormatChange = async (newFormat: 'friendly' | 'league' | 'knockout' | 'winner_stays') => {
    setSelectedFormat(newFormat);
    if (!onSaveTurfResult) return;
    setIsSaving(true);
    try {
      const activePlayers = localTeams.flatMap(t => t.players).concat(localWaitingTeams.flatMap(t => t.players));
      const currentTurfConfig = {
        numTeams: turfResult.numTeams || matchConfig.numTeams || 2,
        playersPerTeam: turfResult.playersPerTeam || matchConfig.playersPerTeam || 6,
        gkMode: (turfResult.gkMode || matchConfig.gkMode || 'rotating') as 'fixed' | 'rotating',
        fixedGkTeamA: matchConfig.fixedGkTeamA,
        fixedGkTeamB: matchConfig.fixedGkTeamB,
        gkRotationInterval: (turfResult.gkRotationInterval || matchConfig.gkRotationInterval || 'per_match') as any,
        gkRotationMinutes: matchConfig.gkRotationMinutes,
        matchType: newFormat,
        matchDurationMins: matchConfig.matchDurationMins || turfResult.matchDurationMins || 20,
        endCondition: matchConfig.endCondition || turfResult.endCondition || 'time',
        targetGoals: matchConfig.targetGoals || turfResult.targetGoals || 3,
      };

      const newTurfResult = generateTurfMatch(activePlayers.length >= 4 ? activePlayers : allCommunityPlayers.slice(0, 12), currentTurfConfig);
      await onSaveTurfResult(newTurfResult, { ...matchConfig, matchType: newFormat });

      setIsFormatModalOpen(false);
      toast.success(isAr ? "تم تغيير نظام الحجز والمباريات بنجاح! 🏆" : "Match format updated successfully! 🏆");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل تغيير النظام" : "Failed to update match format");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Admin Tools */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0">
              ⚽
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {isAr ? 'حجز الكورة المباشر' : 'Live Turf Match Booking'}
              </h2>
              <p className="text-xs text-white/90 font-medium">{formatLabel}</p>
            </div>
          </div>

          {/* Admin Control Bar */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 backdrop-blur-md shadow-sm border border-white/20 active:scale-95 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>{isAr ? "👥 كشف الحضور والغياب" : "👥 Attendance Roster"}</span>
              </button>

              <button
                onClick={() => setIsFormatModalOpen(true)}
                className="px-3.5 py-2 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/20 active:scale-95 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>{isAr ? "⚙️ نظام الحجز" : "⚙️ Format"}</span>
              </button>

              <button
                onClick={handleRegenerateTeamsFromAttendance}
                disabled={isSaving}
                className="px-3.5 py-2 bg-slate-950 text-emerald-400 hover:bg-slate-900 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-emerald-500/40 shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <span>{isAr ? "⚡ إعادة تقسيم وتنسيق الفرق" : "⚡ Re-Balance Teams"}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/20">
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
            {matchType === 'friendly' ? (isAr ? '⚽ ودية كاجوال (دون بطولة)' : '⚽ Casual Friendly') : matchType === 'league' ? (isAr ? '🏆 دوري مجموعات' : '🏆 League') : matchType === 'knockout' ? (isAr ? '⚔️ كأس خروج المغلوب' : '⚔️ Knockout') : (isAr ? '👑 الكسبان مستمر' : '👑 Winner Stays On')}
          </div>
          {gkMode === 'rotating' && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
              <RotateCw className="w-3.5 h-3.5" />
              {isAr ? 'دوران الحراسة' : 'Rotating GK'}
            </div>
          )}
          {endCondition && endCondition !== 'time' && targetGoals && (
            <div className="flex items-center gap-1 bg-black/30 border border-white/20 rounded-full px-3 py-1 text-xs font-black animate-pulse">
              ⚽ {isAr ? `الهدف: ${targetGoals} أهداف للفوز` : `Target: ${targetGoals} Goals to Win`}
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
            captainVotes={captainVotes}
            onVoteCaptain={onVoteCaptain}
            currentUserUid={currentUserUid}
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

      
      {/* Benched Players (Waiting Teams) */}
      {localWaitingTeams.length > 0 && localWaitingTeams[0]?.players?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-200">{isAr ? 'دكة البدلاء' : 'Benched Players'}</h3>
              <p className="text-xs text-slate-500">{isAr ? 'قم بتبديلهم إلى أي فريق' : 'Substitute them into any team'}</p>
            </div>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {localWaitingTeams.flatMap(team => team.players).map(player => {
              const ovr = Math.round(Object.values(player.attributes || {}).reduce((a: number, b: number) => a + b, 0) / Math.max(1, Object.values(player.attributes || {}).length));
              return (
                <div key={player.uid} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 overflow-hidden">
                    {player.photoUrl ? (
                      <Image src={player.photoUrl} alt={player.fullName} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-black text-slate-500">
                        {(player.cardName || player.fullName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {player.cardName || player.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500">{player.primaryPosition}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <OVR_BADGE ovr={ovr || 60} />
                    <button
                      onClick={() => setSubTarget({ teamId: 'waiting', playerUid: player.uid })}
                      title={isAr ? "دخول كبديل" : "Sub In"}
                      className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
                {subTarget.teamId === 'waiting' ? (
                  <>
                    {/* Substituting a Benched Player INTO an active team */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-bold">
                      {isAr ? 'اختر الفريق واللاعب الذي تريد استبداله بهذا اللاعب.' : 'Select the team and player to swap with this benched player.'}
                    </p>
                    <div className="space-y-4">
                      {localTeams.map(team => (
                        <div key={team.id}>
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{team.name}</h4>
                          <div className="space-y-2">
                            {team.players.map(activePlayer => {
                              const ovr = Math.round(Object.values(activePlayer.attributes || {}).reduce((a: number, b: number) => a + b, 0) / Math.max(1, Object.values(activePlayer.attributes || {}).length));
                              return (
                                <button
                                  key={activePlayer.uid}
                                  onClick={() => {
                                    const benchedPlayer = localWaitingTeams.flatMap(t => t.players).find(p => p.uid === subTarget.playerUid)!;
                                    
                                    // Remove from waiting teams
                                    const newWaitingTeams = localWaitingTeams.map(t => ({
                                      ...t,
                                      players: t.players.filter(p => p.uid !== subTarget.playerUid)
                                    }));
                                    
                                    // Add active player to waiting teams
                                    if (newWaitingTeams.length > 0) {
                                      newWaitingTeams[0].players.push(activePlayer);
                                    } else {
                                      newWaitingTeams.push({ id: 'waiting_1', name: 'Bench', players: [activePlayer], assignedPlayers: [], gkOrder: [], totalOvr: 0, avgOvr: 0 });
                                    }

                                    // Replace in localTeams
                                    const newTeams = localTeams.map(t => {
                                      if (t.id === team.id) {
                                        return {
                                          ...t,
                                          players: t.players.map(p => p.uid === activePlayer.uid ? benchedPlayer : p)
                                        };
                                      }
                                      return t;
                                    });

                                    setLocalTeams(newTeams);
                                    setLocalWaitingTeams(newWaitingTeams);
                                    setSubTarget(null);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                >
                                  <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                                      {activePlayer.cardName || activePlayer.fullName}
                                    </div>
                                    <div className="text-xs text-slate-500">{activePlayer.primaryPosition}</div>
                                  </div>
                                  <OVR_BADGE ovr={ovr || 60} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Substituting an ACTIVE Player OUT */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-bold">
                      {isAr ? 'اختر لاعب من الاحتياط أو فريق آخر للتبديل معه.' : 'Select a player from the bench or another team to swap with.'}
                    </p>

                    {/* Benched Candidates First */}
                    {localWaitingTeams.flatMap(t => t.players).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-2">{isAr ? 'البدلاء (دكة)' : 'Bench'}</h4>
                        <div className="space-y-2">
                          {localWaitingTeams.flatMap(t => t.players).map(benchPlayer => {
                            const ovr = Math.round(Object.values(benchPlayer.attributes || {}).reduce((a: number, b: number) => a + b, 0) / Math.max(1, Object.values(benchPlayer.attributes || {}).length));
                            return (
                              <button
                                key={benchPlayer.uid}
                                onClick={() => {
                                  const targetTeam = localTeams.find(t => t.id === subTarget.teamId)!;
                                  const targetPlayer = targetTeam.players.find(p => p.uid === subTarget.playerUid)!;
                                  
                                  const newWaitingTeams = localWaitingTeams.map(t => ({
                                    ...t,
                                    players: t.players.map(p => p.uid === benchPlayer.uid ? targetPlayer : p)
                                  }));

                                  const newTeams = localTeams.map(t => {
                                    if (t.id === subTarget.teamId) {
                                      return {
                                        ...t,
                                        players: t.players.map(p => p.uid === subTarget.playerUid ? benchPlayer : p)
                                      };
                                    }
                                    return t;
                                  });

                                  setLocalTeams(newTeams);
                                  setLocalWaitingTeams(newWaitingTeams);
                                  setSubTarget(null);
                                }}
                                className="w-full flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-left"
                              >
                                <div className="flex-1">
                                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                                    {benchPlayer.cardName || benchPlayer.fullName}
                                  </div>
                                  <div className="text-xs text-slate-500">{benchPlayer.primaryPosition}</div>
                                </div>
                                <OVR_BADGE ovr={ovr || 60} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Active Candidates */}
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
                                  <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                                      {player.cardName || player.fullName}
                                    </div>
                                    <div className="text-xs text-slate-500">{player.primaryPosition}</div>
                                  </div>
                                  <OVR_BADGE ovr={ovr || 60} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendance & Roster Management Modal */}
      <AnimatePresence>
        {isAttendanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsAttendanceModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">
                      {isAr ? "إدارة كشف الحضور والغياب" : "Manage Match Day Roster"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? `الحاضرون حالياً: ${attendanceUids.size} لاعباً` : `Checked-in: ${attendanceUids.size} players`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    placeholder={isAr ? "ابحث باسم اللاعب..." : "Search player by name..."}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Roster Player Checkbox List */}
              <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-[50vh]">
                {allCommunityPlayers
                  .filter(p => {
                    const name = (p.cardName || p.fullName || '').toLowerCase();
                    return name.includes(attendanceSearch.toLowerCase().trim());
                  })
                  .map(p => {
                    const isAttending = attendanceUids.has(p.uid);
                    return (
                      <div
                        key={p.uid}
                        onClick={() => {
                          const next = new Set(attendanceUids);
                          if (isAttending) {
                            next.delete(p.uid);
                          } else {
                            next.add(p.uid);
                          }
                          setAttendanceUids(next);
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          isAttending
                            ? "bg-emerald-950/30 border-emerald-500/40 text-white"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${
                            isAttending ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"
                          }`}>
                            {isAttending ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white block">
                              {p.cardName || p.fullName}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {p.primaryPosition || "CMF"}
                            </span>
                          </div>
                        </div>

                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isAttending ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                        }`}>
                          {isAttending ? (isAr ? "حاضر ⚽" : "Attending") : (isAr ? "غائب" : "Absent")}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 font-bold">
                  {isAr ? `${attendanceUids.size} لاعب مسجل` : `${attendanceUids.size} selected`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAttendanceModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={handleRegenerateTeamsFromAttendance}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? "تكوين وإعادة توزيع الفرق ⚡" : "Re-Generate Teams ⚡"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Format Switcher Modal */}
      <AnimatePresence>
        {isFormatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsFormatModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-white space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-lg text-white">
                    {isAr ? "تغيير نظام الحجز والمباريات" : "Change Match Format"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormatModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "friendly",
                    titleAr: "⚽ مباراة وديّة كاجوال (دون بطولة)",
                    titleEn: "⚽ Casual Friendly (No Tournament)",
                    descAr: "مباراة 2 فريق مباشر دون تصفيات",
                    descEn: "Single 2-team match format"
                  },
                  {
                    id: "league",
                    titleAr: "🏆 دوري مجموعات (Round Robin)",
                    titleEn: "🏆 League Format",
                    descAr: "جدول مباريات يتواجه فيه كل فريق ضد الآخر",
                    descEn: "All teams play against each other"
                  },
                  {
                    id: "knockout",
                    titleAr: "⚔️ كأس خروج المغلوب (Knockout)",
                    titleEn: "⚔️ Knockout Tournament",
                    descAr: "خروج المغلوب مباشرة للتأهل للنهائي",
                    descEn: "Single elimination bracket format"
                  },
                  {
                    id: "winner_stays",
                    titleAr: "👑 الكسبان يستمر (Winner Stays On)",
                    titleEn: "👑 Winner Stays On (Rotation)",
                    descAr: "الفائز في كل شوط يستمر بالملعب والخاسر يخرج للدكة",
                    descEn: "Winner stays on pitch, loser rotates to bench"
                  },
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => handleApplyFormatChange(fmt.id as any)}
                    className={`w-full text-start p-4 rounded-2xl border transition-all ${
                      selectedFormat === fmt.id
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold shadow-lg"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-extrabold text-sm text-white">
                      {isAr ? fmt.titleAr : fmt.titleEn}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">
                      {isAr ? fmt.descAr : fmt.descEn}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});

export default TurfMatchDisplay;
