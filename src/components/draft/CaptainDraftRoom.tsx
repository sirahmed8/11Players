'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PESPosition, PlayerProfile } from '@/types';
import { calculateTeamMetrics, calculatePSI } from '@/lib/engine';
import { getPlayerOverall } from '@/lib/playerUtils';
import { Shield, Trophy, Clock, UserCheck, Shuffle, Play, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { staggerContainerVariants, staggerItemVariants, microSpringProps } from '@/lib/animations';

export interface DraftPickLogItem {
  pickNumber: number;
  team: 'teamA' | 'teamB';
  player: PlayerProfile;
  timestamp: string;
}

export interface PositionalCoverage {
  GK: number;
  DEF: number;
  MID: number;
  ATT: number;
}

export interface DraftBalanceResult {
  teamAOvr: number;
  teamBOvr: number;
  ovrDiff: number;
  teamAPsi: number;
  teamBPsi: number;
  teamACoverage: PositionalCoverage;
  teamBCoverage: PositionalCoverage;
}

// ── Pure Logic Helper Functions for Unit Testing & Component Calculations ──────

/**
 * Computes positional coverage count (GK, DEF, MID, ATT) for a team.
 */
export function calculatePositionalCoverage(team: PlayerProfile[]): PositionalCoverage {
  const coverage: PositionalCoverage = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
  team.forEach((p) => {
    const pos = p.primaryPosition || 'CMF';
    if (pos === 'GK') coverage.GK += 1;
    else if (['CB', 'LB', 'RB'].includes(pos)) coverage.DEF += 1;
    else if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(pos)) coverage.MID += 1;
    else if (['CF', 'SS', 'LWF', 'RWF'].includes(pos)) coverage.ATT += 1;
  });
  return coverage;
}

/**
 * Calculates real-time OVR, PSI, and Positional Coverage balance for Team A and Team B.
 */
export function calculateDraftBalance(teamA: PlayerProfile[], teamB: PlayerProfile[]): DraftBalanceResult {
  const metricsA = calculateTeamMetrics(teamA);
  const metricsB = calculateTeamMetrics(teamB);

  const teamAPsi = teamA.reduce((sum, p) => sum + calculatePSI(p, p.primaryPosition || 'CMF'), 0);
  const teamBPsi = teamB.reduce((sum, p) => sum + calculatePSI(p, p.primaryPosition || 'CMF'), 0);

  const teamAOvr = Math.round(metricsA.overall);
  const teamBOvr = Math.round(metricsB.overall);

  return {
    teamAOvr,
    teamBOvr,
    ovrDiff: Math.abs(teamAOvr - teamBOvr),
    teamAPsi: Math.round(teamAPsi),
    teamBPsi: Math.round(teamBPsi),
    teamACoverage: calculatePositionalCoverage(teamA),
    teamBCoverage: calculatePositionalCoverage(teamB),
  };
}

/**
 * Determines which team picks next given draft mode and zero-indexed pick count.
 * Pick count 0 represents the first choice after captains are assigned.
 */
export function getNextDraftTurn(mode: 'snake' | 'classic', pickIndex: number): 'teamA' | 'teamB' {
  if (mode === 'classic') {
    return pickIndex % 2 === 0 ? 'teamA' : 'teamB';
  }
  // Snake Draft Logic:
  // Round 0 (pick 0, 1): Team A, then Team B
  // Round 1 (pick 2, 3): Team B, then Team A
  // Round 2 (pick 4, 5): Team A, then Team B ...
  const round = Math.floor(pickIndex / 2);
  const isFirstInRound = pickIndex % 2 === 0;

  if (round % 2 === 0) {
    return isFirstInRound ? 'teamA' : 'teamB';
  } else {
    return isFirstInRound ? 'teamB' : 'teamA';
  }
}

/**
 * Auto-draft fallback logic to select the best available player for the drafting team.
 */
export function autoDraftPick(available: PlayerProfile[], draftingTeam: PlayerProfile[]): PlayerProfile | null {
  if (available.length === 0) return null;

  const coverage = calculatePositionalCoverage(draftingTeam);

  // If drafting team has no GK, pick highest OVR GK if available
  if (coverage.GK === 0) {
    const gk = available.find((p) => (p.primaryPosition || '').toUpperCase() === 'GK');
    if (gk) return gk;
  }

  // Otherwise, sort available by OVR descending
  const sorted = [...available].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  return sorted[0] || null;
}



export interface CaptainDraftRoomProps {
  initialPlayers?: PlayerProfile[];
  captain1Uid?: string;
  captain2Uid?: string;
  turnSeconds?: number;
  onMatchLaunch?: (teamA: PlayerProfile[], teamB: PlayerProfile[]) => void;
}

export const CaptainDraftRoom: React.FC<CaptainDraftRoomProps> = ({
  initialPlayers = [],
  captain1Uid,
  captain2Uid,
  turnSeconds = 30,
  onMatchLaunch,
}) => {
  // Mode state
  const [draftMode, setDraftMode] = useState<'snake' | 'classic'>('snake');

  // Separate Captains from Pool
  const { cap1, cap2, initialAvailable } = useMemo(() => {
    const p1 = initialPlayers.find((p) => p.uid === captain1Uid) || initialPlayers[0] || {} as PlayerProfile;
    const p2 = initialPlayers.find((p) => p.uid === captain2Uid) || initialPlayers[1] || {} as PlayerProfile;
    const pool = initialPlayers.filter((p) => p.uid !== p1?.uid && p.uid !== p2?.uid);
    return { cap1: p1, cap2: p2, initialAvailable: pool };
  }, [initialPlayers, captain1Uid, captain2Uid]);

  // Draft State
  const [teamA, setTeamA] = useState<PlayerProfile[]>(() => cap1 ? [cap1] : []);
  const [teamB, setTeamB] = useState<PlayerProfile[]>(() => cap2 ? [cap2] : []);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerProfile[]>(initialAvailable);
  const [pickLogs, setPickLogs] = useState<DraftPickLogItem[]>([]);
  const [pickIndex, setPickIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(turnSeconds);
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerProfile | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [filterPosition, setFilterPosition] = useState<string>('ALL');

  // Form Accessibility Input IDs
  const modeSelectId = useId();
  const positionFilterId = useId();

  // Current turn determination
  const currentTurn = useMemo(() => {
    if (availablePlayers.length === 0) return null;
    return getNextDraftTurn(draftMode, pickIndex);
  }, [draftMode, pickIndex, availablePlayers.length]);

  // Real-time Balance Calculation
  const balance = useMemo(() => calculateDraftBalance(teamA, teamB), [teamA, teamB]);

  // Draft a player
  const executePick = useCallback((player: PlayerProfile) => {
    if (!currentTurn || isCompleted) return;

    const newTeamA = currentTurn === 'teamA' ? [...teamA, player] : teamA;
    const newTeamB = currentTurn === 'teamB' ? [...teamB, player] : teamB;
    const newAvailable = availablePlayers.filter((p) => p.uid !== player.uid);

    const logItem: DraftPickLogItem = {
      pickNumber: pickIndex + 1,
      team: currentTurn,
      player,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setAvailablePlayers(newAvailable);
    setPickLogs((prev) => [logItem, ...prev]);

    if (newAvailable.length === 0) {
      setIsCompleted(true);
    } else {
      setPickIndex((prev) => prev + 1);
      setTimeLeft(turnSeconds);
    }
  }, [currentTurn, isCompleted, teamA, teamB, availablePlayers, pickIndex, turnSeconds]);

  // Auto Draft Fallback
  const handleAutoDraft = useCallback(() => {
    if (!currentTurn || availablePlayers.length === 0) return;
    const draftingTeam = currentTurn === 'teamA' ? teamA : teamB;
    const bestPick = autoDraftPick(availablePlayers, draftingTeam);
    if (bestPick) {
      executePick(bestPick);
    }
  }, [currentTurn, availablePlayers, teamA, teamB, executePick]);

  // Timer Interval Effect
  useEffect(() => {
    if (isCompleted || availablePlayers.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoDraft();
          return turnSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pickIndex, isCompleted, availablePlayers, turnSeconds, draftMode, handleAutoDraft]);

  // Filtered available pool
  const filteredAvailable = useMemo(() => {
    if (filterPosition === 'ALL') return availablePlayers;
    return availablePlayers.filter((p) => {
      const pos = p.primaryPosition || 'CMF';
      if (filterPosition === 'GK') return pos === 'GK';
      if (filterPosition === 'DEF') return ['CB', 'LB', 'RB'].includes(pos);
      if (filterPosition === 'MID') return ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(pos);
      if (filterPosition === 'ATT') return ['CF', 'SS', 'LWF', 'RWF'].includes(pos);
      return true;
    });
  }, [availablePlayers, filterPosition]);

  // Empty state — no real players provided
  if (initialPlayers.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Shield className="w-10 h-10 text-emerald-400/60" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">No Players Available</h2>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            The Captain Draft Room requires at least 4 registered players in your community. Add players first, then come back to start the draft.
          </p>
        </div>
        <Link
          href="/community"
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all"
        >
          Go to Player Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-slate-100 p-2 sm:p-4">
      {/* Top Banner & Control Bar */}
      <div className="glass-card p-5 rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/30 text-amber-400 border border-amber-500/40 shadow-glow-gold">
            <Trophy className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Captain Draft Room (22 Players)
            </h1>
            <p className="text-xs text-slate-400">
              Live snake/classic alternating pick system with real-time OVR & PSI balance meters
            </p>
          </div>
        </div>

        {/* Draft Mode Toggle & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Shuffle className="w-4 h-4 text-emerald-400" />
            <label htmlFor={modeSelectId} className="text-xs font-semibold text-slate-400">Strategy:</label>
            <CustomDropdown
              value={draftMode}
              onChange={(val) => setDraftMode(val as 'snake' | 'classic')}
              options={[
                { value: 'snake', label: 'Snake Draft (1-2-2-2...)' },
                { value: 'classic', label: 'Classic Alternate (1-1-1-1...)' },
              ]}
              className="w-48"
            />
          </div>

          {/* Turn Timer Badge */}
          {!isCompleted && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-md ${
              currentTurn === 'teamA'
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                : 'bg-blue-950/60 border-blue-500/50 text-blue-400'
            }`}>
              <Clock className="w-4 h-4 animate-spin" />
              <span>
                {currentTurn === 'teamA' ? "Captain 1's Turn" : "Captain 2's Turn"} ({timeLeft}s)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* OVR & Positional Balance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Team A Card */}
        <div className="glass-card p-4 rounded-xl border border-rose-500/30 bg-gradient-to-b from-rose-950/40 to-slate-900/80 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" />
              <h3 className="font-black text-rose-300 text-base">Team A (Captain 1)</h3>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white">{balance.teamAOvr} <span className="text-xs font-normal text-slate-400">OVR</span></div>
              <div className="text-[10px] text-rose-400 font-mono">PSI: {balance.teamAPsi}</div>
            </div>
          </div>

          {/* Coverage Badges */}
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div className={`p-1.5 rounded-lg border ${balance.teamACoverage.GK > 0 ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}>
              <div className="text-[10px] font-bold">GK</div>
              <div className="font-mono font-black">{balance.teamACoverage.GK}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
              <div className="text-[10px] font-bold">DEF</div>
              <div className="font-mono font-black">{balance.teamACoverage.DEF}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
              <div className="text-[10px] font-bold">MID</div>
              <div className="font-mono font-black">{balance.teamACoverage.MID}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
              <div className="text-[10px] font-bold">ATT</div>
              <div className="font-mono font-black">{balance.teamACoverage.ATT}</div>
            </div>
          </div>

          {/* Roster List */}
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {teamA.map((p, idx) => (
              <div key={p.uid} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/40 border border-slate-700/40">
                <span className="text-slate-400 font-mono">{idx + 1}.</span>
                <span className="font-bold text-white truncate max-w-[120px]">{p.cardName || p.fullName}</span>
                <span className="font-mono font-black text-rose-400">{p.primaryPosition}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Meter Center Display */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/60 bg-slate-900/90 flex flex-col justify-between items-center text-center">
          <div className="w-full space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Match Equilibrium</h4>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl font-black ${balance.ovrDiff <= 2 ? 'text-emerald-400' : balance.ovrDiff <= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                {balance.ovrDiff <= 2 ? 'Perfect Balance' : `${balance.ovrDiff} OVR Gap`}
              </span>
            </div>
            {/* Visual Balance Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{ width: `${(balance.teamAOvr / Math.max(1, balance.teamAOvr + balance.teamBOvr)) * 100}%` }}
              />
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(balance.teamBOvr / Math.max(1, balance.teamAOvr + balance.teamBOvr)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
              <span>Team A ({balance.teamAOvr})</span>
              <span>Team B ({balance.teamBOvr})</span>
            </div>
          </div>

          {/* Hover Preview Box */}
          <div className="w-full mt-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-left min-h-[64px]">
            {hoveredPlayer ? (
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{hoveredPlayer.cardName || hoveredPlayer.fullName}</span>
                  <span className="text-amber-400 font-mono">{getPlayerOverall(hoveredPlayer)} OVR</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                  <span>Position: {hoveredPlayer.primaryPosition}</span>
                  <span>
                    PSI Preview:{' '}
                    <strong className="text-emerald-400">
                      {Math.round(calculatePSI(hoveredPlayer, hoveredPlayer.primaryPosition || 'CMF'))}
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 text-center py-2 italic">
                Hover over an available player to preview PSI contribution
              </div>
            )}
          </div>

          {/* Completion Trigger */}
          {isCompleted && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => onMatchLaunch && onMatchLaunch(teamA, teamB)}
              className="btn w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black py-2.5 rounded-xl shadow-glow-primary flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" /> Launch Official Match
            </motion.button>
          )}
        </div>

        {/* Team B Card */}
        <div className="glass-card p-4 rounded-xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 to-slate-900/80 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-black text-blue-300 text-base">Team B (Captain 2)</h3>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white">{balance.teamBOvr} <span className="text-xs font-normal text-slate-400">OVR</span></div>
              <div className="text-[10px] text-blue-400 font-mono">PSI: {balance.teamBPsi}</div>
            </div>
          </div>

          {/* Coverage Badges */}
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div className={`p-1.5 rounded-lg border ${balance.teamBCoverage.GK > 0 ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}>
              <div className="text-[10px] font-bold">GK</div>
              <div className="font-mono font-black">{balance.teamBCoverage.GK}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
              <div className="text-[10px] font-bold">DEF</div>
              <div className="font-mono font-black">{balance.teamBCoverage.DEF}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
              <div className="text-[10px] font-bold">MID</div>
              <div className="font-mono font-black">{balance.teamBCoverage.MID}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
              <div className="text-[10px] font-bold">ATT</div>
              <div className="font-mono font-black">{balance.teamBCoverage.ATT}</div>
            </div>
          </div>

          {/* Roster List */}
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {teamB.map((p, idx) => (
              <div key={p.uid} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/40 border border-slate-700/40">
                <span className="text-slate-400 font-mono">{idx + 1}.</span>
                <span className="font-bold text-white truncate max-w-[120px]">{p.cardName || p.fullName}</span>
                <span className="font-mono font-black text-blue-400">{p.primaryPosition}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available Players Draft Pool */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white">
              Available Draft Pool ({filteredAvailable.length} Remaining)
            </h3>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <label htmlFor={positionFilterId} className="sr-only">Filter Position Group</label>
            <CustomDropdown
              value={filterPosition}
              onChange={(val) => setFilterPosition(val)}
              options={[
                { value: 'ALL', label: 'All Positions' },
                { value: 'GK', label: 'Goalkeepers (GK)' },
                { value: 'DEF', label: 'Defenders (DEF)' },
                { value: 'MID', label: 'Midfielders (MID)' },
                { value: 'ATT', label: 'Attackers (ATT)' },
              ]}
              className="w-44"
            />
          </div>
        </div>

        {/* Players Grid */}
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[440px] overflow-y-auto p-2 scrollbar-thin"
        >
          <AnimatePresence>
            {filteredAvailable.map((player) => {
              const ovr = getPlayerOverall(player);
              return (
                <motion.div
                  key={player.uid}
                  layout
                  variants={staggerItemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setHoveredPlayer(player)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                  className="glass-card backdrop-blur-xl p-3.5 rounded-xl border border-slate-800/80 hover:border-emerald-500/60 hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)] bg-slate-900/90 hover:bg-slate-900 transition-all flex items-center justify-between group cursor-pointer relative z-0 hover:z-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-black text-sm text-amber-400 border border-amber-500/30">
                      {ovr}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white truncate max-w-[110px] group-hover:text-emerald-400 transition-colors">
                        {player.cardName || player.fullName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                          {player.primaryPosition}
                        </span>
                        <span>{player.height}cm</span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isCompleted}
                    onClick={() => executePick(player)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow cursor-pointer ${
                      currentTurn === 'teamA'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    Draft
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Draft Timeline Log */}
      {pickLogs.length > 0 && (
        <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Draft Pick Log Timeline</h4>
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {pickLogs.map((log) => (
              <div
                key={log.pickNumber}
                className={`flex-none px-3 py-1.5 rounded-lg text-xs font-mono border ${
                  log.team === 'teamA'
                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                }`}
              >
                <span className="font-bold text-slate-400">#{log.pickNumber}</span>{' '}
                <strong className="text-white">{log.player.cardName || log.player.fullName}</strong> ({log.player.primaryPosition})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainDraftRoom;
