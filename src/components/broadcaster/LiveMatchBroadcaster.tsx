'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Radio, Shield, Zap, AlertTriangle, Eye, Play, Pause, RotateCcw } from 'lucide-react';

export interface BroadcasterEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'KEY_SAVE' | 'VAR_REVIEW' | 'MOMENTUM_SHIFT' | 'YELLOW_CARD' | 'RED_CARD';
  team: 'teamA' | 'teamB';
  description: string;
  commentaryAr: string;
  coordinates: { x: number; y: number }; // 0..100 pitch percentages
  timestamp: string;
}

export interface LiveMatchBroadcasterProps {
  teamAName?: string;
  teamBName?: string;
  initialScoreA?: number;
  initialScoreB?: number;
  autoSimulate?: boolean;
}

// ── Pure Logic Helper Functions for Testing & State Updates ──────────────────

/**
 * Updates dynamic momentum gauge score (0 to 100 scale).
 * 0 = 100% Team A Pressure, 50 = Neutral Midfield Battle, 100 = 100% Team B Pressure.
 */
export function updateMomentumState(currentMomentum: number, eventType: string, team: 'teamA' | 'teamB' = 'teamA'): number {
  let delta = 0;
  if (eventType === 'GOAL') delta = team === 'teamA' ? -25 : 25;
  else if (eventType === 'SHOT') delta = team === 'teamA' ? -15 : 15;
  else if (eventType === 'KEY_SAVE') delta = team === 'teamA' ? 12 : -12; // Save gives defender counter momentum
  else if (eventType === 'MOMENTUM_SHIFT') delta = team === 'teamA' ? -18 : 18;
  else if (eventType === 'RED_CARD') delta = team === 'teamA' ? 22 : -22; // Red card penalizes team
  else if (eventType === 'YELLOW_CARD') delta = team === 'teamA' ? 5 : -5;

  const next = currentMomentum + delta;
  return Math.max(0, Math.min(100, next));
}

/**
 * Calculates stoppage time (+1 to +6 mins) based on event density and match phase.
 */
export function calculateStoppageTime(matchMinute: number, eventCount: number): number {
  if (matchMinute < 40 && matchMinute < 85) return 0;
  const base = Math.floor(eventCount / 2.5);
  return Math.min(6, Math.max(1, base + 1));
}

/**
 * Speech Synthesis helper calling browser API or backend TTS.
 */
export async function triggerSpeechSynthesis(text: string, isMuted: boolean = false) {
  if (isMuted || !text) return;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      // Removed window.speechSynthesis.cancel() to allow native queueing
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      return;
    } catch (e) {
      console.warn('Browser SpeechSynthesis failed, falling back to API:', e);
    }
  }

  // Fallback to /api/ai/tts
  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: 'ar' }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    }
  } catch (err) {
    console.error('API TTS error:', err);
  }
}

// ── Sample Live Events Data ──────────────────────────────────────────────────

export const INITIAL_MATCH_EVENTS: BroadcasterEvent[] = [
  {
    id: 'e1',
    minute: 12,
    type: 'KEY_SAVE',
    team: 'teamA',
    description: 'Goalkeeper produces a brilliant diving save!',
    commentaryAr: 'تصدى حارس المرمى للكرة ببراعة فائقة!',
    coordinates: { x: 12, y: 50 },
    timestamp: '12:04',
  },
  {
    id: 'e2',
    minute: 24,
    type: 'GOAL',
    team: 'teamA',
    description: 'GOAL! Powerful shot into the top right corner!',
    commentaryAr: 'هدف! تسديدة صاروخية رائعة في الشباك!',
    coordinates: { x: 88, y: 30 },
    timestamp: '24:15',
  },
  {
    id: 'e3',
    minute: 38,
    type: 'MOMENTUM_SHIFT',
    team: 'teamB',
    description: 'Team B mounting intense press in middle third!',
    commentaryAr: 'تحول هجومي كبير وضغط مكثف في منتصف الملعب!',
    coordinates: { x: 50, y: 45 },
    timestamp: '38:50',
  },
  {
    id: 'e4',
    minute: 52,
    type: 'VAR_REVIEW',
    team: 'teamB',
    description: 'VAR Review: Penalty check for potential handball... NO PENALTY!',
    commentaryAr: 'تقنية الفيديو تشير بعدم وجود ركلة جزاء واستمرار اللعب!',
    coordinates: { x: 22, y: 65 },
    timestamp: '52:10',
  },
];

export const LiveMatchBroadcaster: React.FC<LiveMatchBroadcasterProps> = ({
  teamAName = 'Team Alpha (A)',
  teamBName = 'Team Bravo (B)',
  initialScoreA = 1,
  initialScoreB = 0,
  autoSimulate = true,
}) => {
  const [scoreA, setScoreA] = useState<number>(initialScoreA);
  const [scoreB, setScoreB] = useState<number>(initialScoreB);
  const [matchMinute, setMatchMinute] = useState<number>(55);
  const [isPaused, setIsPaused] = useState<boolean>(!autoSimulate);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [momentum, setMomentum] = useState<number>(35); // 35 = 65% Team A pressure
  const [events, setEvents] = useState<BroadcasterEvent[]>(INITIAL_MATCH_EVENTS);
  const [activeEvent, setActiveEvent] = useState<BroadcasterEvent | null>(INITIAL_MATCH_EVENTS[1]);

  // Ball Pitch Animated Coordinates
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 88, y: 30 });

  // Calculate Stoppage Time
  const stoppageTime = useMemo(() => calculateStoppageTime(matchMinute, events.length), [matchMinute, events.length]);

  // Match Simulation Clock Interval
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setMatchMinute((prev) => {
        if (prev >= 90 + stoppageTime) {
          setIsPaused(true);
          return 90 + stoppageTime;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused, stoppageTime]);

  // Trigger New Live Event Simulator
  const triggerEvent = (type: BroadcasterEvent['type'], team: 'teamA' | 'teamB') => {
    const min = Math.min(90, matchMinute + 2);
    let desc = '';
    let commentary = '';
    let coords = { x: 50, y: 50 };

    if (type === 'GOAL') {
      if (team === 'teamA') {
        setScoreA((s) => s + 1);
        desc = `GOAL! ${teamAName} scores!`;
        commentary = `هدف رائع للغاية لفريق أطلس! تسديدة متقنة في المرمى!`;
        coords = { x: 92, y: 48 };
      } else {
        setScoreB((s) => s + 1);
        desc = `GOAL! ${teamBName} scores!`;
        commentary = `هدف تعادل ثمين لصالح الفراعنة! روعة في التنفيذ!`;
        coords = { x: 8, y: 52 };
      }
    } else if (type === 'KEY_SAVE') {
      desc = `KEY SAVE! Outstanding reaction save!`;
      commentary = `تصدى خرافي يمنع هدف محقق ببراعة!`;
      coords = team === 'teamA' ? { x: 10, y: 48 } : { x: 90, y: 52 };
    } else if (type === 'VAR_REVIEW') {
      desc = `VAR REVIEW: Checking penalty box incident...`;
      commentary = `قرار الحكم يتوقف لمراجعة شاشة الڤار!`;
      coords = { x: 25, y: 40 };
    } else if (type === 'MOMENTUM_SHIFT') {
      desc = `MOMENTUM SHIFT! High intensity attacking pressure!`;
      commentary = `ضغط هجومي متواصل وتحول مجريات المباراة!`;
      coords = { x: 60, y: 50 };
    } else if (type === 'YELLOW_CARD') {
      desc = `YELLOW CARD issued for tactical foul.`;
      commentary = `بطاقة صفراء نتيجة تدخل تكتيكي خشين!`;
      coords = { x: 45, y: 70 };
    } else if (type === 'RED_CARD') {
      desc = `RED CARD! Sent off!`;
      commentary = `بطاقة حمراء ومغادرة الملعب فوراً!`;
      coords = { x: 55, y: 30 };
    }

    const newEvt: BroadcasterEvent = {
      id: `evt-${Date.now()}`,
      minute: min,
      type,
      team,
      description: desc,
      commentaryAr: commentary,
      coordinates: coords,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setEvents((prev) => [newEvt, ...prev]);
    setActiveEvent(newEvt);
    setBallPos(coords);
    setMomentum((m) => updateMomentumState(m, type, team));

    // Audio Commentary Trigger
    triggerSpeechSynthesis(commentary, isMuted);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans text-slate-100 p-2 sm:p-4">
      {/* Top Match Scoreboard Header */}
      <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Live Badge */}
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-black tracking-widest text-rose-500 uppercase flex items-center gap-1">
              <Radio className="w-4 h-4 animate-pulse" /> Live Spectator Broadcast
            </span>
          </div>

          {/* Audio Commentary Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-glow-primary'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? 'Muted' : 'Live Commentary ON'}</span>
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white transition-all"
            >
              {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
            </button>
          </div>
        </div>

        {/* Big Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-2 border-y border-slate-800/80">
          {/* Team A */}
          <div className="flex items-center justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600/30 border border-rose-500/50 flex items-center justify-center font-black text-rose-400">
              A
            </div>
            <div>
              <h2 className="font-black text-lg text-white">{teamAName}</h2>
              <span className="text-xs text-rose-400 font-mono">Pressure: {100 - momentum}%</span>
            </div>
          </div>

          {/* Main Clock & Score */}
          <div className="text-center space-y-1">
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-4">
              <span>{scoreA}</span>
              <span className="text-emerald-500 font-light text-3xl">:</span>
              <span>{scoreB}</span>
            </div>
            {/* Clock + Stoppage Time */}
            <div className="text-xs font-mono font-bold text-amber-400 flex items-center justify-center gap-1.5">
              <span>{matchMinute}&apos;</span>
              {stoppageTime > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
                  +{stoppageTime} MINS
                </span>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <h2 className="font-black text-lg text-white">{teamBName}</h2>
              <span className="text-xs text-blue-400 font-mono">Pressure: {momentum}%</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center font-black text-blue-400">
              B
            </div>
          </div>
        </div>

        {/* Dynamic Momentum Pressure Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-rose-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Team A Attack Momentum ({100 - momentum}%)
            </span>
            <span className="text-slate-400 uppercase tracking-widest text-[10px]">Momentum Pressure Gauge</span>
            <span className="text-blue-400 flex items-center gap-1">
              Team B Attack Momentum ({momentum}%) <Zap className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex p-0.5">
            <motion.div
              className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-l-full"
              animate={{ width: `${100 - momentum}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-r-full"
              animate={{ width: `${momentum}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {/* Center Equilibrium Notch */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/80 shadow" />
          </div>
        </div>
      </div>

      {/* Animated 2D Pitch Display & Event Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pitch Area (2 cols) */}
        <div className="lg:col-span-2 glass-card p-4 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
            <span>2D Tactical Live Pitch Radar</span>
            <span className="font-mono text-emerald-400">Ball Track: ({ballPos.x}%, {ballPos.y}%)</span>
          </div>

          {/* Interactive Pitch Canvas Render */}
          <div className="relative w-full aspect-[16/10] rounded-xl bg-gradient-to-b from-emerald-950 to-emerald-900 border border-emerald-800/60 overflow-hidden shadow-inner flex items-center justify-center">
            {/* Pitch Markings */}
            <div className="absolute inset-4 border-2 border-white/30 rounded-sm pointer-events-none">
              {/* Half line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30" />
              {/* Center Circle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-white/30" />
              {/* Penalty boxes */}
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1/6 border-r-2 border-y-2 border-white/30" />
              <div className="absolute right-0 top-1/4 bottom-1/4 w-1/6 border-l-2 border-y-2 border-white/30" />
            </div>

            {/* Animated Ball Position Marker */}
            <motion.div
              className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 z-20"
              animate={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            >
              <div className="w-full h-full rounded-full bg-amber-400 border-2 border-white shadow-glow-gold flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
              </div>
            </motion.div>

            {/* Active Event Visual Overlay */}
            <AnimatePresence mode="wait">
              {activeEvent && (
                <motion.div
                  key={activeEvent.id}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-md shadow-2xl flex items-center gap-3 z-30"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-400">
                      {activeEvent.minute}&apos; — {activeEvent.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm font-black text-white">{activeEvent.description}</div>
                    <div className="text-xs text-slate-300 font-sans dir-rtl mt-0.5">
                      {activeEvent.commentaryAr}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Simulation Control Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <span className="text-xs font-bold text-slate-400">Simulation Controls:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerEvent('GOAL', 'teamA')}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow"
              >
                ⚽ Goal Team A
              </button>
              <button
                onClick={() => triggerEvent('GOAL', 'teamB')}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow"
              >
                ⚽ Goal Team B
              </button>
              <button
                onClick={() => triggerEvent('KEY_SAVE', 'teamA')}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
              >
                🧤 Key Save
              </button>
              <button
                onClick={() => triggerEvent('VAR_REVIEW', 'teamB')}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow"
              >
                🖥️ VAR Review
              </button>
              <button
                onClick={() => triggerEvent('MOMENTUM_SHIFT', 'teamA')}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow"
              >
                ⚡ Momentum Shift
              </button>
            </div>
          </div>
        </div>

        {/* Live Events Ticker Feed (1 col) */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" /> Match Event Stream
              </h3>
              <span className="text-[10px] font-mono text-slate-400">{events.length} Events</span>
            </div>

            {/* Event List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {events.map((evt) => (
                  <motion.div
                    key={evt.id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      evt.type === 'GOAL'
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                        : evt.type === 'VAR_REVIEW'
                        ? 'bg-purple-950/50 border-purple-500/40 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                      <span className="text-amber-400">{evt.minute}&apos;</span>
                      <span className="uppercase text-slate-400">{evt.type.replace('_', ' ')}</span>
                      <span className="text-slate-500">{evt.timestamp}</span>
                    </div>
                    <p className="font-semibold text-white">{evt.description}</p>
                    <p className="text-[11px] text-slate-400 italic dir-rtl">{evt.commentaryAr}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 font-mono">
            Full HD 1080p PES Spectator Engine • Audio TTS Speech Enabled
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchBroadcaster;
