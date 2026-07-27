'use client';

import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PESPosition, PlayerProfile } from '@/types';
import { calculateTeamMetrics, calculatePSI } from '@/lib/engine';
import { getPlayerOverall } from '@/lib/playerUtils';
import { Shield, Trophy, Clock, UserCheck, Shuffle, Play, ChevronRight, Zap, AlertCircle } from 'lucide-react';

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

// ── Default 22 Players Mock Pool for Live Draft Room ─────────────────────────

export const DEFAULT_DRAFT_POOL_22: PlayerProfile[] = [
  { uid: 'c1', cardName: 'Achraf Hakimi', fullName: 'Achraf Hakimi', primaryPosition: 'RB', secondaryPosition: 'LB', height: 181, weight: 73, calculatedAge: 25, attributes: { speed: 92, acceleration: 91, stamina: 88, defensiveAwareness: 78, ballWinning: 80, lowPass: 81, loftedPass: 82, dribbling: 84, ballControl: 83, finishing: 70, heading: 68, kickingPower: 81, jump: 76, physicalContact: 74, balance: 80, offensiveAwareness: 82, aggression: 78, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'c2', cardName: 'Brahim Díaz', fullName: 'Brahim Díaz', primaryPosition: 'AMF', secondaryPosition: 'RWF', height: 171, weight: 68, calculatedAge: 24, attributes: { speed: 84, acceleration: 88, stamina: 78, defensiveAwareness: 45, ballWinning: 42, lowPass: 86, loftedPass: 83, dribbling: 90, ballControl: 89, finishing: 81, heading: 58, kickingPower: 82, jump: 64, physicalContact: 62, balance: 88, offensiveAwareness: 85, aggression: 55, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p3', cardName: 'Yassine Bounou', fullName: 'Yassine Bounou', primaryPosition: 'GK', height: 195, weight: 78, calculatedAge: 33, attributes: { speed: 60, acceleration: 58, stamina: 70, defensiveAwareness: 85, ballWinning: 70, lowPass: 68, loftedPass: 75, dribbling: 50, ballControl: 60, finishing: 35, heading: 70, kickingPower: 78, jump: 85, physicalContact: 82, balance: 70, offensiveAwareness: 40, aggression: 65, gkAwareness: 90, gkCatching: 88, gkClearing: 86, gkReflexes: 92, gkReach: 91 } } as any,
  { uid: 'p4', cardName: 'Munir Mohamedi', fullName: 'Munir Mohamedi', primaryPosition: 'GK', height: 190, weight: 83, calculatedAge: 35, attributes: { speed: 55, acceleration: 55, stamina: 68, defensiveAwareness: 80, ballWinning: 65, lowPass: 62, loftedPass: 70, dribbling: 45, ballControl: 55, finishing: 30, heading: 68, kickingPower: 75, jump: 82, physicalContact: 80, balance: 65, offensiveAwareness: 40, aggression: 60, gkAwareness: 84, gkCatching: 83, gkClearing: 82, gkReflexes: 85, gkReach: 86 } } as any,
  { uid: 'p5', cardName: 'Nayef Aguerd', fullName: 'Nayef Aguerd', primaryPosition: 'CB', height: 190, weight: 76, calculatedAge: 28, attributes: { speed: 76, acceleration: 74, stamina: 80, defensiveAwareness: 86, ballWinning: 87, lowPass: 75, loftedPass: 78, dribbling: 66, ballControl: 70, finishing: 52, heading: 86, kickingPower: 76, jump: 84, physicalContact: 84, balance: 72, offensiveAwareness: 58, aggression: 82, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p6', cardName: 'Romain Saïss', fullName: 'Romain Saïss', primaryPosition: 'CB', height: 188, weight: 80, calculatedAge: 34, attributes: { speed: 70, acceleration: 68, stamina: 78, defensiveAwareness: 85, ballWinning: 86, lowPass: 74, loftedPass: 76, dribbling: 64, ballControl: 68, finishing: 55, heading: 85, kickingPower: 78, jump: 82, physicalContact: 85, balance: 70, offensiveAwareness: 60, aggression: 85, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p7', cardName: 'Chadi Riad', fullName: 'Chadi Riad', primaryPosition: 'CB', height: 187, weight: 78, calculatedAge: 21, attributes: { speed: 75, acceleration: 73, stamina: 77, defensiveAwareness: 80, ballWinning: 81, lowPass: 72, loftedPass: 70, dribbling: 62, ballControl: 66, finishing: 45, heading: 80, kickingPower: 72, jump: 79, physicalContact: 78, balance: 70, offensiveAwareness: 50, aggression: 78, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p8', cardName: 'Noussair Mazraoui', fullName: 'Noussair Mazraoui', primaryPosition: 'LB', secondaryPosition: 'RB', height: 183, weight: 74, calculatedAge: 26, attributes: { speed: 82, acceleration: 81, stamina: 84, defensiveAwareness: 80, ballWinning: 81, lowPass: 82, loftedPass: 80, dribbling: 81, ballControl: 82, finishing: 65, heading: 70, kickingPower: 76, jump: 74, physicalContact: 73, balance: 78, offensiveAwareness: 76, aggression: 76, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p9', cardName: 'Yahia Attiyat Allah', fullName: 'Yahia Attiyat Allah', primaryPosition: 'LB', height: 176, weight: 70, calculatedAge: 29, attributes: { speed: 80, acceleration: 79, stamina: 85, defensiveAwareness: 76, ballWinning: 77, lowPass: 76, loftedPass: 78, dribbling: 74, ballControl: 75, finishing: 58, heading: 68, kickingPower: 74, jump: 72, physicalContact: 71, balance: 76, offensiveAwareness: 72, aggression: 75, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p10', cardName: 'Sofyan Amrabat', fullName: 'Sofyan Amrabat', primaryPosition: 'DMF', height: 185, weight: 80, calculatedAge: 27, attributes: { speed: 76, acceleration: 74, stamina: 92, defensiveAwareness: 88, ballWinning: 90, lowPass: 82, loftedPass: 80, dribbling: 76, ballControl: 80, finishing: 58, heading: 76, kickingPower: 82, jump: 78, physicalContact: 88, balance: 82, offensiveAwareness: 66, aggression: 90, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p11', cardName: 'Azzedine Ounahi', fullName: 'Azzedine Ounahi', primaryPosition: 'CMF', height: 182, weight: 67, calculatedAge: 24, attributes: { speed: 80, acceleration: 82, stamina: 86, defensiveAwareness: 68, ballWinning: 70, lowPass: 86, loftedPass: 84, dribbling: 88, ballControl: 87, finishing: 70, heading: 60, kickingPower: 76, jump: 68, physicalContact: 64, balance: 85, offensiveAwareness: 78, aggression: 68, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p12', cardName: 'Selim Amallah', fullName: 'Selim Amallah', primaryPosition: 'CMF', height: 187, weight: 80, calculatedAge: 27, attributes: { speed: 75, acceleration: 73, stamina: 82, defensiveAwareness: 72, ballWinning: 74, lowPass: 80, loftedPass: 78, dribbling: 78, ballControl: 80, finishing: 72, heading: 74, kickingPower: 78, jump: 75, physicalContact: 78, balance: 74, offensiveAwareness: 75, aggression: 76, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p13', cardName: 'Amir Richardson', fullName: 'Amir Richardson', primaryPosition: 'CMF', height: 197, weight: 82, calculatedAge: 22, attributes: { speed: 76, acceleration: 74, stamina: 84, defensiveAwareness: 76, ballWinning: 78, lowPass: 81, loftedPass: 80, dribbling: 79, ballControl: 81, finishing: 66, heading: 80, kickingPower: 77, jump: 82, physicalContact: 84, balance: 72, offensiveAwareness: 72, aggression: 75, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p14', cardName: 'Ismael Saibari', fullName: 'Ismael Saibari', primaryPosition: 'AMF', height: 185, weight: 82, calculatedAge: 23, attributes: { speed: 82, acceleration: 83, stamina: 82, defensiveAwareness: 60, ballWinning: 64, lowPass: 84, loftedPass: 81, dribbling: 86, ballControl: 85, finishing: 78, heading: 70, kickingPower: 84, jump: 74, physicalContact: 82, balance: 80, offensiveAwareness: 81, aggression: 72, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p15', cardName: 'Hakim Ziyech', fullName: 'Hakim Ziyech', primaryPosition: 'RWF', secondaryPosition: 'AMF', height: 180, weight: 70, calculatedAge: 31, attributes: { speed: 80, acceleration: 82, stamina: 78, defensiveAwareness: 55, ballWinning: 56, lowPass: 89, loftedPass: 92, dribbling: 88, ballControl: 89, finishing: 82, heading: 60, kickingPower: 88, jump: 66, physicalContact: 65, balance: 80, offensiveAwareness: 86, aggression: 65, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p16', cardName: 'Ilias Chair', fullName: 'Ilias Chair', primaryPosition: 'AMF', height: 158, weight: 62, calculatedAge: 26, attributes: { speed: 83, acceleration: 86, stamina: 78, defensiveAwareness: 48, ballWinning: 50, lowPass: 83, loftedPass: 81, dribbling: 86, ballControl: 85, finishing: 76, heading: 50, kickingPower: 80, jump: 60, physicalContact: 55, balance: 90, offensiveAwareness: 80, aggression: 58, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p17', cardName: 'Sofiane Boufal', fullName: 'Sofiane Boufal', primaryPosition: 'LWF', height: 175, weight: 70, calculatedAge: 30, attributes: { speed: 84, acceleration: 88, stamina: 76, defensiveAwareness: 42, ballWinning: 44, lowPass: 80, loftedPass: 78, dribbling: 92, ballControl: 90, finishing: 77, heading: 55, kickingPower: 78, jump: 68, physicalContact: 62, balance: 89, offensiveAwareness: 82, aggression: 55, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p18', cardName: 'Abde Ezzalzouli', fullName: 'Abde Ezzalzouli', primaryPosition: 'LWF', height: 177, weight: 72, calculatedAge: 22, attributes: { speed: 89, acceleration: 91, stamina: 80, defensiveAwareness: 40, ballWinning: 42, lowPass: 75, loftedPass: 73, dribbling: 89, ballControl: 87, finishing: 76, heading: 60, kickingPower: 80, jump: 70, physicalContact: 68, balance: 84, offensiveAwareness: 81, aggression: 62, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p19', cardName: 'Youssef En-Nesyri', fullName: 'Youssef En-Nesyri', primaryPosition: 'CF', height: 188, weight: 78, calculatedAge: 27, attributes: { speed: 85, acceleration: 83, stamina: 85, defensiveAwareness: 48, ballWinning: 50, lowPass: 68, loftedPass: 65, dribbling: 76, ballControl: 78, finishing: 86, heading: 92, kickingPower: 84, jump: 92, physicalContact: 84, balance: 75, offensiveAwareness: 88, aggression: 78, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p20', cardName: 'Ayoub El Kaabi', fullName: 'Ayoub El Kaabi', primaryPosition: 'CF', height: 182, weight: 75, calculatedAge: 31, attributes: { speed: 82, acceleration: 81, stamina: 82, defensiveAwareness: 45, ballWinning: 48, lowPass: 70, loftedPass: 68, dribbling: 78, ballControl: 79, finishing: 85, heading: 86, kickingPower: 82, jump: 86, physicalContact: 80, balance: 76, offensiveAwareness: 87, aggression: 76, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p21', cardName: 'Soufiane Rahimi', fullName: 'Soufiane Rahimi', primaryPosition: 'CF', secondaryPosition: 'SS', height: 181, weight: 74, calculatedAge: 28, attributes: { speed: 86, acceleration: 87, stamina: 86, defensiveAwareness: 50, ballWinning: 52, lowPass: 76, loftedPass: 74, dribbling: 84, ballControl: 83, finishing: 84, heading: 78, kickingPower: 83, jump: 80, physicalContact: 76, balance: 82, offensiveAwareness: 86, aggression: 80, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
  { uid: 'p22', cardName: 'Tariq Tissoudali', fullName: 'Tariq Tissoudali', primaryPosition: 'SS', secondaryPosition: 'CF', height: 182, weight: 75, calculatedAge: 31, attributes: { speed: 81, acceleration: 83, stamina: 78, defensiveAwareness: 46, ballWinning: 48, lowPass: 78, loftedPass: 75, dribbling: 84, ballControl: 84, finishing: 80, heading: 72, kickingPower: 79, jump: 74, physicalContact: 72, balance: 81, offensiveAwareness: 83, aggression: 65, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40 } } as any,
];

export interface CaptainDraftRoomProps {
  initialPlayers?: PlayerProfile[];
  captain1Uid?: string;
  captain2Uid?: string;
  turnSeconds?: number;
  onMatchLaunch?: (teamA: PlayerProfile[], teamB: PlayerProfile[]) => void;
}

export const CaptainDraftRoom: React.FC<CaptainDraftRoomProps> = ({
  initialPlayers = DEFAULT_DRAFT_POOL_22,
  captain1Uid,
  captain2Uid,
  turnSeconds = 30,
  onMatchLaunch,
}) => {
  // Mode state
  const [draftMode, setDraftMode] = useState<'snake' | 'classic'>('snake');

  // Separate Captains from Pool
  const { cap1, cap2, initialAvailable } = useMemo(() => {
    const p1 = initialPlayers.find((p) => p.uid === captain1Uid) || initialPlayers[0];
    const p2 = initialPlayers.find((p) => p.uid === captain2Uid) || initialPlayers[1];
    const pool = initialPlayers.filter((p) => p.uid !== p1.uid && p.uid !== p2.uid);
    return { cap1: p1, cap2: p2, initialAvailable: pool };
  }, [initialPlayers, captain1Uid, captain2Uid]);

  // Draft State
  const [teamA, setTeamA] = useState<PlayerProfile[]>([cap1]);
  const [teamB, setTeamB] = useState<PlayerProfile[]>([cap2]);
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

  // Timer Interval Effect
  useEffect(() => {
    if (isCompleted || availablePlayers.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-Draft Trigger on Timeout
          handleAutoDraft();
          return turnSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pickIndex, isCompleted, availablePlayers, turnSeconds, draftMode]);

  // Draft a player
  const executePick = (player: PlayerProfile) => {
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
  };

  // Auto Draft Fallback
  const handleAutoDraft = () => {
    if (!currentTurn || availablePlayers.length === 0) return;
    const draftingTeam = currentTurn === 'teamA' ? teamA : teamB;
    const bestPick = autoDraftPick(availablePlayers, draftingTeam);
    if (bestPick) {
      executePick(bestPick);
    }
  };

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
            <select
              id={modeSelectId}
              disabled={pickIndex > 0}
              value={draftMode}
              onChange={(e) => setDraftMode(e.target.value as 'snake' | 'classic')}
              className="bg-slate-900 text-xs font-bold text-emerald-400 border border-slate-700 rounded-lg px-2.5 py-1 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="snake">Snake Draft (1-2-2-2...)</option>
              <option value="classic">Classic Alternate (1-1-1-1...)</option>
            </select>
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
            <select
              id={positionFilterId}
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1 outline-none"
            >
              <option value="ALL">All Positions</option>
              <option value="GK">Goalkeepers (GK)</option>
              <option value="DEF">Defenders (DEF)</option>
              <option value="MID">Midfielders (MID)</option>
              <option value="ATT">Attackers (ATT)</option>
            </select>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filteredAvailable.map((player) => {
              const ovr = getPlayerOverall(player);
              return (
                <motion.div
                  key={player.uid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onMouseEnter={() => setHoveredPlayer(player)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                  className="glass-card p-3 rounded-xl border border-slate-800 hover:border-emerald-500/60 bg-slate-900/60 hover:bg-slate-900 transition-all flex items-center justify-between group"
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

                  <button
                    disabled={isCompleted}
                    onClick={() => executePick(player)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
                      currentTurn === 'teamA'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    Draft
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
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
