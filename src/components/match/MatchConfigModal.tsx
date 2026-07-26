import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/components/ui/ThemeProvider';
import { Users, RotateCw, Trophy, Timer, Shuffle, ChevronDown, Check, X, Brain, RefreshCw, Sparkles, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { matchConfigSchema } from '@/schemas/matchSchema';
import toast from 'react-hot-toast';
import { generateTurfMatch, FORMATIONS, assignPlayersToFormation, selectBestFormation, calculatePSI, detectFormationFromTeam } from '@/lib/engine';
import { balanceTeams } from '@/lib/engine';
import { getTacticalSuggestions, getBestPlayStyleNameForPosition } from '@/lib/suggestionEngine';
import { PESPosition } from '@/types';
import { call11AIChat } from '@/lib/aiService';

export interface MatchConfig {
  date: string;
  time: string;
  location: string;
  cost: string;
  notes: string;
  // Turf / Casual mode fields
  matchMode?: 'standard' | 'turf';
  numTeams?: number;              // 2, 3, 4+
  playersPerTeam?: number;        // 4 to 10
  gkMode?: 'fixed' | 'rotating'; // GK rotation style
  fixedGkTeamA?: string;          // UID of fixed GK for Team A
  fixedGkTeamB?: string;          // UID of fixed GK for Team B
  gkRotationInterval?: 'per_match' | 'per_goal' | 'per_time';
  gkRotationMinutes?: number;     // Minutes between GK rotations
  matchType?: 'league' | 'knockout' | 'winner_stays' | 'friendly';
  matchDurationMins?: number;     // Duration per match
  endCondition?: 'time' | 'goals' | 'both'; // Target match condition
  targetGoals?: number;           // Goals needed to win / rotate
  isOpenRegistration?: boolean;   // Open turf registration without initially selecting players
  selectedPlayerUids?: string[];  // Which players will play (null = all)
  enableCardsSystem?: boolean;    // Enable Yellow & Red Card disciplinary system
}

interface CommunityPlayer {
  uid: string;
  fullName?: string;
  cardName?: string;
  primaryPosition?: string;
  photoUrl?: string;
  stats?: any;
}

const FORMATION_COORDS: Record<string, {x:number;y:number}[]> = {
  // 5v5 (خماسي)
  '1-2-1': [{x:50,y:88},{x:50,y:68},{x:30,y:45},{x:70,y:45},{x:50,y:18}],
  '2-1-1': [{x:50,y:88},{x:32,y:68},{x:68,y:68},{x:50,y:45},{x:50,y:18}],
  '1-1-2': [{x:50,y:88},{x:50,y:68},{x:50,y:45},{x:30,y:18},{x:70,y:18}],
  '2-2':   [{x:50,y:88},{x:32,y:68},{x:68,y:68},{x:32,y:22},{x:68,y:22}],

  // 6v6 (سداسي)
  '2-2-1': [{x:50,y:88},{x:32,y:68},{x:68,y:68},{x:32,y:45},{x:68,y:45},{x:50,y:18}],
  '2-1-2': [{x:50,y:88},{x:32,y:68},{x:68,y:68},{x:50,y:45},{x:30,y:18},{x:70,y:18}],
  '1-3-1': [{x:50,y:88},{x:50,y:72},{x:20,y:45},{x:50,y:48},{x:80,y:45},{x:50,y:18}],
  '3-1-1': [{x:50,y:88},{x:20,y:68},{x:50,y:72},{x:80,y:68},{x:50,y:45},{x:50,y:18}],

  // 7v7 (سباعي)
  '2-3-1': [{x:50,y:88},{x:32,y:68},{x:68,y:68},{x:20,y:45},{x:50,y:48},{x:80,y:45},{x:50,y:18}],
  '3-2-1': [{x:50,y:88},{x:20,y:68},{x:50,y:72},{x:80,y:68},{x:35,y:45},{x:65,y:45},{x:50,y:18}],
  '2-2-2': [{x:50,y:88},{x:32,y:68},{x:68,y:68},{x:35,y:48},{x:65,y:48},{x:32,y:20},{x:68,y:20}],
  '3-1-2': [{x:50,y:88},{x:20,y:68},{x:50,y:72},{x:80,y:68},{x:50,y:45},{x:32,y:20},{x:68,y:20}],
  '1-4-1': [{x:50,y:88},{x:50,y:72},{x:18,y:48},{x:38,y:50},{x:62,y:50},{x:82,y:48},{x:50,y:18}],

  // 8v8 (ثماني)
  '3-3-1': [{x:50,y:88},{x:20,y:70},{x:50,y:72},{x:80,y:70},{x:20,y:45},{x:50,y:48},{x:80,y:45},{x:50,y:18}],
  '2-4-1': [{x:50,y:88},{x:32,y:70},{x:68,y:70},{x:18,y:48},{x:38,y:50},{x:62,y:50},{x:82,y:48},{x:50,y:18}],
  '3-2-2': [{x:50,y:88},{x:20,y:70},{x:50,y:72},{x:80,y:70},{x:35,y:48},{x:65,y:48},{x:32,y:20},{x:68,y:20}],
  '2-3-2': [{x:50,y:88},{x:32,y:70},{x:68,y:70},{x:20,y:48},{x:50,y:50},{x:80,y:48},{x:32,y:20},{x:68,y:20}],
  '4-2-1': [{x:50,y:88},{x:15,y:70},{x:38,y:72},{x:62,y:72},{x:85,y:70},{x:35,y:48},{x:65,y:48},{x:50,y:18}],

  // 9v9 (تساعي)
  '3-4-1': [{x:50,y:88},{x:20,y:70},{x:50,y:72},{x:80,y:70},{x:18,y:48},{x:38,y:50},{x:62,y:50},{x:82,y:48},{x:50,y:18}],
  '3-3-2': [{x:50,y:88},{x:20,y:70},{x:50,y:72},{x:80,y:70},{x:20,y:48},{x:50,y:50},{x:80,y:48},{x:32,y:20},{x:68,y:20}],
  '4-3-1': [{x:50,y:88},{x:15,y:70},{x:38,y:72},{x:62,y:72},{x:85,y:70},{x:25,y:48},{x:50,y:50},{x:75,y:48},{x:50,y:18}],
  '3-2-3': [{x:50,y:88},{x:20,y:70},{x:50,y:72},{x:80,y:70},{x:35,y:48},{x:65,y:48},{x:20,y:20},{x:50,y:18},{x:80,y:20}],
  '2-4-2': [{x:50,y:88},{x:32,y:70},{x:68,y:70},{x:18,y:48},{x:38,y:50},{x:62,y:50},{x:82,y:48},{x:32,y:20},{x:68,y:20}],

  // 10v10 (عشاري)
  '4-4-1': [{x:50,y:88},{x:15,y:70},{x:38,y:72},{x:62,y:72},{x:85,y:70},{x:18,y:48},{x:38,y:50},{x:62,y:50},{x:82,y:48},{x:50,y:18}],
  '4-3-2': [{x:50,y:88},{x:15,y:70},{x:38,y:72},{x:62,y:72},{x:85,y:70},{x:25,y:48},{x:50,y:50},{x:75,y:48},{x:32,y:20},{x:68,y:20}],
  '3-4-2': [{x:50,y:88},{x:20,y:70},{x:50,y:72},{x:80,y:70},{x:18,y:48},{x:38,y:50},{x:62,y:50},{x:82,y:48},{x:32,y:20},{x:68,y:20}],
  '3-5-1': [{x:50,y:88},{x:20,y:70},{x:50,y:72},{x:80,y:70},{x:15,y:48},{x:32,y:50},{x:50,y:45},{x:68,y:50},{x:85,y:48},{x:50,y:18}],
  '5-3-1': [{x:50,y:88},{x:12,y:65},{x:32,y:72},{x:50,y:74},{x:68,y:72},{x:88,y:65},{x:25,y:48},{x:50,y:50},{x:75,y:48},{x:50,y:18}],

  // 11v11 (أحد عشري)
  '4-3-3':          [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:32,y:48},{x:50,y:55},{x:68,y:48},{x:18,y:22},{x:50,y:15},{x:82,y:22}],
  '4-3-3 (Attack)': [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:50,y:60},{x:32,y:45},{x:68,y:35},{x:18,y:20},{x:50,y:15},{x:82,y:20}],
  '4-3-3 (Defend)': [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:35,y:60},{x:65,y:60},{x:50,y:45},{x:18,y:20},{x:50,y:15},{x:82,y:20}],
  '4-2-3-1':        [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:38,y:58},{x:62,y:58},{x:18,y:35},{x:50,y:32},{x:82,y:35},{x:50,y:15}],
  '4-4-2':          [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:18,y:45},{x:38,y:52},{x:62,y:52},{x:82,y:45},{x:35,y:18},{x:65,y:18}],
  '4-2-2-2':        [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:35,y:60},{x:65,y:60},{x:32,y:35},{x:68,y:35},{x:35,y:18},{x:65,y:18}],
  '4-1-4-1':        [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:50,y:60},{x:18,y:42},{x:38,y:42},{x:62,y:42},{x:82,y:42},{x:50,y:18}],
  '3-5-2':          [{x:50,y:88},{x:25,y:72},{x:50,y:74},{x:75,y:72},{x:15,y:48},{x:35,y:54},{x:50,y:42},{x:65,y:54},{x:85,y:48},{x:35,y:18},{x:65,y:18}],
  '3-4-3':          [{x:50,y:88},{x:25,y:72},{x:50,y:74},{x:75,y:72},{x:18,y:48},{x:38,y:50},{x:62,y:50},{x:82,y:48},{x:18,y:20},{x:50,y:15},{x:82,y:20}],
  '3-4-1-2':        [{x:50,y:88},{x:25,y:72},{x:50,y:74},{x:75,y:72},{x:18,y:50},{x:38,y:54},{x:62,y:54},{x:82,y:50},{x:50,y:34},{x:35,y:18},{x:65,y:18}],
  '4-1-3-2':        [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:50,y:60},{x:20,y:40},{x:50,y:35},{x:80,y:40},{x:35,y:18},{x:65,y:18}],
  '4-3-2-1':        [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:25,y:52},{x:50,y:55},{x:75,y:52},{x:35,y:32},{x:65,y:32},{x:50,y:15}],
  '4-1-2-1-2':      [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:50,y:60},{x:32,y:48},{x:68,y:48},{x:50,y:32},{x:35,y:18},{x:65,y:18}],
  '5-3-2':          [{x:50,y:88},{x:12,y:65},{x:32,y:72},{x:50,y:74},{x:68,y:72},{x:88,y:65},{x:30,y:48},{x:50,y:52},{x:70,y:48},{x:35,y:18},{x:65,y:18}],
  '5-2-3':          [{x:50,y:88},{x:12,y:65},{x:32,y:72},{x:50,y:74},{x:68,y:72},{x:88,y:65},{x:35,y:50},{x:65,y:50},{x:18,y:20},{x:50,y:15},{x:82,y:20}],
  '4-2-4':          [{x:50,y:88},{x:15,y:70},{x:36,y:72},{x:64,y:72},{x:85,y:70},{x:35,y:52},{x:65,y:52},{x:15,y:20},{x:38,y:16},{x:62,y:16},{x:85,y:20}],
  '5-4-1':          [{x:50,y:88},{x:12,y:65},{x:32,y:72},{x:50,y:74},{x:68,y:72},{x:88,y:65},{x:18,y:45},{x:38,y:48},{x:62,y:48},{x:82,y:45},{x:50,y:18}],
};

const FALLBACK_PITCH_COORDS: Record<string, {x:number;y:number}> = {
  GK:  {x:50,y:88}, LB:{x:15,y:70}, CB:{x:35,y:70},
  RB:  {x:85,y:70}, DMF:{x:50,y:55}, LMF:{x:20,y:45},
  CMF: {x:50,y:45}, RMF:{x:80,y:45}, AMF:{x:50,y:30},
  LWF: {x:18,y:18}, RWF:{x:82,y:18}, CF:{x:50,y:10}, SS:{x:50,y:18},
};

interface FormationDropdownProps {
  label: 'A' | 'B';
  value: string;
  options: string[];
  onChange: (val: string) => void;
  isAr: boolean;
}

function FormationDropdown({ label, value, options, onChange, isAr }: FormationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const labelColor = label === 'A' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30';
  const ringColor = label === 'A' ? 'hover:border-blue-500/60' : 'hover:border-red-500/60';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 bg-slate-900 text-slate-100 border border-slate-700/80 rounded-2xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 ${ringColor}`}
      >
        <span className={`w-4 h-4 rounded-md font-black text-[10px] flex items-center justify-center border ${labelColor}`}>
          {label === 'A' ? (isAr ? 'أ' : 'A') : (isAr ? 'ب' : 'B')}
        </span>
        <span className="font-mono text-xs">{value || (isAr ? 'تلقائي' : 'AI Pick')}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 4 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1 w-44 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl"
          >
            {options.map((fmt) => {
              const isSelected = value === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    onChange(fmt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold font-mono flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/30'
                      : 'text-slate-200 hover:bg-purple-600/20 hover:text-purple-300'
                  }`}
                >
                  <span>{fmt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PLAY_STYLE_LABELS: Record<string, { en: string; ar: string }> = {
  goal_poacher: { en: 'Goal Poacher', ar: 'قناص الأهداف 🎯' },
  dummy_runner: { en: 'Dummy Runner', ar: 'مراوغ وهمي 🏃' },
  fox_in_the_box: { en: 'Fox in the Box', ar: 'ثعلب الصندوق 🦊' },
  target_man: { en: 'Target Man', ar: 'مهاجم محطة 🛡️' },
  creative_playmaker: { en: 'Creative Playmaker', ar: 'صانع ألعاب مبتكر 🎨' },
  prolific_winger: { en: 'Prolific Winger', ar: 'جناح هداف ⚡' },
  roaming_flank: { en: 'Roaming Flank', ar: 'جناح حر 💫' },
  cross_specialist: { en: 'Cross Specialist', ar: 'متخصص العرضيات 🎯' },
  classic_no_10: { en: 'Classic No.10', ar: 'رقم 10 كلاسيكي 🎩' },
  hole_player: { en: 'Hole Player', ar: 'لاعب القادمون من الخلف ⚡' },
  box_to_box: { en: 'Box-to-Box', ar: 'بوكس تو بوكس (مكوك) 🔄' },
  anchor_man: { en: 'Anchor Man', ar: 'ارتكاز دفاعي (مرساة) ⚓' },
  destroyer: { en: 'The Destroyer', ar: 'المقاتل المدمر 💥' },
  the_destroyer: { en: 'The Destroyer', ar: 'المقاتل المدمر 💥' },
  orchestrator: { en: 'Orchestrator', ar: 'مهندس الإيقاع 🎼' },
  offensive_fullback: { en: 'Offensive Fullback', ar: 'ظهير هجومي 🚀' },
  defensive_fullback: { en: 'Defensive Fullback', ar: 'ظهير دفاعي 🛡️' },
  fullback_finisher: { en: 'Fullback Finisher', ar: 'ظهير مقتحم 🎯' },
  build_up: { en: 'Build Up', ar: 'بناء اللعب من الخلف 🧱' },
  extra_attacker: { en: 'Extra Attacker', ar: 'مدافع مقتحم 🚀' },
  offensive_goalkeeper: { en: 'Offensive GK (Sweeper)', ar: 'حارس مانويل نوير 🧤' },
  defensive_goalkeeper: { en: 'Defensive GK (Wall)', ar: 'حارس جداري 🧱' },
};

function getDisplayPlayStyle(p: any, isAr: boolean): string {
  const rawStyle = (p.preferredPlayStyle || p.playStyle || p.mood || '').toString();
  const styleKey = rawStyle.toLowerCase().replace(/[\s-]/g, '_').replace(/^the_/, '');
  if (styleKey && PLAY_STYLE_LABELS[styleKey]) {
    return isAr ? PLAY_STYLE_LABELS[styleKey].ar : PLAY_STYLE_LABELS[styleKey].en;
  }
  if (styleKey && PLAY_STYLE_LABELS[`the_${styleKey}`]) {
    return isAr ? PLAY_STYLE_LABELS[`the_${styleKey}`].ar : PLAY_STYLE_LABELS[`the_${styleKey}`].en;
  }
  if (rawStyle && rawStyle.trim().length > 0) {
    return rawStyle.replace(/_/g, ' ');
  }
  
  const pos = p.assignedPosition || p.primaryPosition || 'CMF';
  if (pos === 'GK') return isAr ? 'حارس مرمى 🧤' : 'Goalkeeper 🧤';
  if (['CB', 'LB', 'RB'].includes(pos)) return isAr ? 'بناء اللعب 🧱' : 'Build Up 🧱';
  if (['DMF', 'CMF'].includes(pos)) return isAr ? 'بوكس تو بوكس (مكوك) 🔄' : 'Box-to-Box 🔄';
  if (['AMF', 'LMF', 'RMF'].includes(pos)) return isAr ? 'صانع ألعاب 🎨' : 'Playmaker 🎨';
  return isAr ? 'قناص الأهداف 🎯' : 'Goal Poacher 🎯';
}

interface HalfPitchProps {
  team: any[];
  label: string;
  color: string;
  flipped: boolean;
  formationName?: string;
  isAr: boolean;
  pitchResetCounter?: number;
  setActiveTacticalPlayer: (val: any) => void;
  onSwapClick?: (teamIndex: number | 'bench' | 'benchA' | 'benchB', playerIndex: number, player: any) => void;
  selectedForSwap?: any;
  teamIndex?: number;
  onPositionDragChange?: (
    teamId: 'A' | 'B' | number,
    playerIndex: number,
    newPos: PESPosition,
    customCoords?: { x: number; y: number }
  ) => void;
}

function HalfPitch({
  team,
  label,
  color,
  flipped,
  formationName,
  isAr,
  pitchResetCounter,
  setActiveTacticalPlayer,
  onSwapClick,
  selectedForSwap,
  teamIndex,
  onPositionDragChange,
}: HalfPitchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultForm = team.length === 5 ? '1-2-1' : team.length === 6 ? '2-2-1' : team.length === 7 ? '2-3-1' : team.length === 8 ? '3-3-1' : team.length === 9 ? '3-4-1' : team.length === 10 ? '4-4-1' : '4-3-3';
  const formKey = formationName || defaultForm;
  const coordsList = FORMATION_COORDS[formKey] || FORMATION_COORDS[defaultForm] || FORMATION_COORDS['4-3-3'];
  const formSlots = FORMATIONS[formKey] || FORMATIONS[defaultForm] || FORMATIONS['4-3-3'];
  const posCounts: Record<string, number> = {};
  const usedSlotIndices = new Set<number>();
  const usedCoordCounts: Record<string, number> = {};

  const actualTeamIdx = teamIndex !== undefined ? teamIndex : (label === 'Team A' || label === (isAr ? 'الفريق أ' : 'Team A') ? 0 : 1);

  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const [dragCoords, setDragCoords] = useState<Record<number, { x: number; y: number }>>({});

  const handlePointerDown = (e: React.PointerEvent, i: number, player: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    let hasMoved = false;

    setActiveDragIdx(i);

    const calcDropCoords = (clientX: number, clientY: number) => {
      const dropX = Math.max(6, Math.min(94, ((clientX - rect.left) / rect.width) * 100));
      const dropY = Math.max(6, Math.min(94, ((clientY - rect.top) / rect.height) * 100));
      return { dropX, dropY };
    };

    const initial = calcDropCoords(startClientX, startClientY);
    setDragCoords(prev => ({ ...prev, [i]: { x: initial.dropX, y: initial.dropY } }));

    const onPointerMoveWindow = (moveEvent: PointerEvent) => {
      const dist = Math.hypot(moveEvent.clientX - startClientX, moveEvent.clientY - startClientY);
      if (dist > 4) {
        hasMoved = true;
      }
      const { dropX, dropY } = calcDropCoords(moveEvent.clientX, moveEvent.clientY);
      setDragCoords(prev => ({ ...prev, [i]: { x: dropX, y: dropY } }));
    };

    const onPointerUpWindow = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMoveWindow);
      window.removeEventListener('pointerup', onPointerUpWindow);
      window.removeEventListener('pointercancel', onPointerUpWindow);

      setActiveDragIdx(null);

      if (!hasMoved) {
        if (onSwapClick) {
          onSwapClick(actualTeamIdx, i, player);
        } else {
          const teamId = label === 'Team A' || label === (isAr ? 'الفريق أ' : 'Team A') ? 'A' : 'B';
          setActiveTacticalPlayer({ teamId, playerIndex: i, player });
        }
        return;
      }

      const { dropX, dropY } = calcDropCoords(upEvent.clientX, upEvent.clientY);
      const actualY = flipped ? 100 - dropY : dropY;

      let detectedPos: PESPosition = 'CMF';
      if (actualY > 82) {
        detectedPos = 'GK';
      } else if (actualY >= 64) {
        if (dropX < 30) detectedPos = 'LB';
        else if (dropX > 70) detectedPos = 'RB';
        else detectedPos = 'CB';
      } else if (actualY >= 48) {
        if (dropX < 28) detectedPos = 'LMF';
        else if (dropX > 72) detectedPos = 'RMF';
        else detectedPos = 'DMF';
      } else if (actualY >= 34) {
        if (dropX < 28) detectedPos = 'LMF';
        else if (dropX > 72) detectedPos = 'RMF';
        else detectedPos = 'CMF';
      } else if (actualY >= 20) {
        if (dropX < 28) detectedPos = 'LWF';
        else if (dropX > 72) detectedPos = 'RWF';
        else detectedPos = 'AMF';
      } else {
        if (dropX < 28) detectedPos = 'LWF';
        else if (dropX > 72) detectedPos = 'RWF';
        else detectedPos = 'CF';
      }

      if (onPositionDragChange) {
        onPositionDragChange(actualTeamIdx, i, detectedPos, { x: dropX, y: actualY });
      }
    };

    window.addEventListener('pointermove', onPointerMoveWindow);
    window.addEventListener('pointerup', onPointerUpWindow);
    window.addEventListener('pointercancel', onPointerUpWindow);
  };

  return (
    <div className="flex-1 relative min-h-0 w-full overflow-hidden select-none touch-none">
      <div className="text-xs font-black text-center mb-1.5 tracking-wider uppercase flex flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: color}} />
          <span className="text-slate-700 dark:text-slate-200">{label}</span>
        </div>
        {formationName && <span className="text-[10px] text-slate-500 font-bold">{formationName}</span>}
      </div>
      <div ref={containerRef} className="relative w-full rounded-xl border border-emerald-600/40 mt-6 mb-4 select-none touch-none" style={{ paddingTop: '130%' }}>
        {/* Pitch Background - Clipped */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none select-none"
          style={{ background: 'repeating-linear-gradient(90deg,rgba(34,197,94,0.18) 0 16.66%,rgba(22,163,74,0.22) 16.66% 33.33%)' }}
        >
          <div className="absolute left-0 right-0 border-t border-white/20" style={{top:'50%'}}/>
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20" style={{top:'50%'}}/>
          <div className="absolute left-1/4 right-1/4 top-0 h-[8%] border-b border-x border-white/20"/>
          <div className="absolute left-1/4 right-1/4 bottom-0 h-[8%] border-t border-x border-white/20"/>
        </div>

        {/* Player dots - Unclipped & Draggable */}
        {team.map((p: any, i: number) => {
          const playerObj = p.player || p;
          const pos = playerObj.assignedPosition || playerObj.primaryPosition || 'CMF';
          
          let displayX: number;
          let displayY: number;

          if (dragCoords[i] && activeDragIdx === i) {
            displayX = dragCoords[i].x;
            displayY = dragCoords[i].y;
          } else if (playerObj.customPitchCoords) {
            displayX = playerObj.customPitchCoords.x;
            displayY = flipped ? 100 - playerObj.customPitchCoords.y : playerObj.customPitchCoords.y;
          } else if (coordsList[i]) {
            displayX = coordsList[i].x;
            displayY = flipped ? 100 - coordsList[i].y : coordsList[i].y;
          } else {
            const fallback = FALLBACK_PITCH_COORDS[pos] || { x: 50, y: 50 };
            displayX = fallback.x;
            displayY = flipped ? 100 - fallback.y : fallback.y;
          }

          const ovr = playerObj.overallRating || playerObj?.stats?.overallRating || 70;
          const name = (playerObj.cardName || playerObj.fullName || 'Player').split(' ')[0];
          const moodStyle = getDisplayPlayStyle(playerObj, isAr);
          const isSelected = selectedForSwap && selectedForSwap.teamIndex === actualTeamIdx && selectedForSwap.playerIndex === i;
          const isDraggingThis = activeDragIdx === i;

          return (
            <div
              key={`pitch-dot-${actualTeamIdx}-${i}-${p.uid || i}`}
              onPointerDown={(e) => handlePointerDown(e, i, p)}
              className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group z-10 cursor-grab active:cursor-grabbing select-none touch-none ${
                isDraggingThis ? 'scale-125 z-50 transition-none' : isSelected ? 'scale-110 z-30 transition-all duration-150' : 'transition-all duration-150'
              }`}
              style={{ left: `${displayX}%`, top: `${displayY}%` }}
              title={isAr ? 'اضغط للتبديل مع أي لاعب آخر، أو اسحب لتعديل المكان، أو اضغط القلم لتعديل المركز' : 'Click to swap with another player, drag to reposition, or click pencil to edit position'}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] text-white shadow-lg border-2 transition-all ${
                  isSelected
                    ? 'border-purple-400 ring-4 ring-purple-500/80 scale-110 shadow-purple-500/50 animate-pulse'
                    : 'border-white/80 group-hover:border-amber-300'
                }`}
                style={{backgroundColor: color, boxShadow: isSelected ? '0 0 16px #a855f7' : `0 2px 8px ${color}55` }}
              >
                {ovr}
              </div>
              <div className="mt-0.5 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-white text-[8px] font-black uppercase tracking-wider whitespace-nowrap shadow flex items-center gap-1 group-hover:bg-amber-500 transition-colors pointer-events-auto select-none">
                <span>{pos}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const teamId = label === 'Team A' || label === (isAr ? 'الفريق أ' : 'Team A') ? 'A' : 'B';
                    setActiveTacticalPlayer({ teamId, playerIndex: i, player: p });
                  }}
                  className="text-[8px] text-amber-300 hover:text-white hover:scale-125 transition-transform"
                  title={isAr ? 'تعديل المركز ونمط اللعب' : 'Edit position & play style'}
                >
                  ✏️
                </button>
              </div>
              <div className="mt-0.5 text-[7px] font-bold text-white bg-slate-800/70 px-1 rounded truncate max-w-[52px] text-center pointer-events-none select-none">
                {name}
              </div>
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 select-none">
                {p.cardName || p.fullName} · {pos} · OVR {ovr} · {moodStyle}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calculateTeamAvg(team: any[]): number {
  if (!team || team.length === 0) return 70;
  const sum = team.reduce((acc, p) => {
    const item = p.player || p;
    return acc + (item.overallRating || item?.stats?.overallRating || 70);
  }, 0);
  return Math.round(sum / team.length);
}

interface TeamBenchProps {
  bench: any[];
  teamName: string;
  isAr: boolean;
  onSwapClick?: (bpIdx: number, bPlayer: any) => void;
  selectedForSwap?: any;
  swapTeamKey?: string;
}

function TeamBench({ bench, teamName, isAr, onSwapClick, selectedForSwap, swapTeamKey }: TeamBenchProps) {
  if (!bench || bench.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
      <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />
        <span>{teamName} {isAr ? 'احتياط' : 'Bench'}</span>
        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {bench.length}
        </span>
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {bench.map((bItem: any, bpIdx: number) => {
          const bPlayer = bItem.player || bItem;
          const bOvr = bPlayer.overallRating || bPlayer?.stats?.overallRating || 70;
          const bPos = bPlayer.primaryPosition || 'CMF';
          const moodStyle = getDisplayPlayStyle(bPlayer, isAr);
          const isSelected = selectedForSwap && swapTeamKey && selectedForSwap.teamIndex === swapTeamKey && selectedForSwap.playerIndex === bpIdx;
          
          if (onSwapClick) {
            return (
              <button
                key={bPlayer.uid || `tb-${bpIdx}`}
                type="button"
                onClick={() => onSwapClick(bpIdx, bPlayer)}
                className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 text-left ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md scale-[1.02]'
                    : 'bg-amber-50/60 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/30 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-black uppercase shrink-0 ${isSelected ? 'text-white' : 'text-amber-700 dark:text-amber-300'}`}>{bPos}</span>
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                    {bPlayer.fullName || bPlayer.cardName || 'Bench Player'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-bold truncate max-w-[65px] ${isSelected ? 'text-amber-200' : 'text-slate-500 dark:text-slate-400'}`}>{moodStyle}</span>
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                    {bOvr}
                  </span>
                </div>
              </button>
            );
          }

          return (
            <div
              key={bPlayer.uid || `tb-${bpIdx}`}
              className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 shrink-0">{bPos}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {bPlayer.fullName || bPlayer.cardName || 'Bench Player'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[65px]">{moodStyle}</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  {bOvr}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ManagerAdvice {
  icon: string;
  title: string;
  body: string;
  type: 'strength' | 'weakness' | 'tactical_tip' | 'key_battle';
}

function generateBilingualManagerAdvices(
  teamA: any[],
  teamB: any[],
  benchA: any[],
  benchB: any[],
  formationA: string,
  formationB: string,
  metrics: any,
  isAr: boolean
): ManagerAdvice[] {
  const advices: ManagerAdvice[] = [];
  
  const startAvgA = metrics?.teamAAvg || calculateTeamAvg(teamA);
  const startAvgB = metrics?.teamBAvg || calculateTeamAvg(teamB);
  
  const fullSquadA = [...(teamA || []), ...(benchA || [])];
  const fullSquadB = [...(teamB || []), ...(benchB || [])];

  const squadAvgA = calculateTeamAvg(fullSquadA);
  const squadAvgB = calculateTeamAvg(fullSquadB);

  const benchAvgA = benchA && benchA.length > 0 ? calculateTeamAvg(benchA) : startAvgA;
  const benchAvgB = benchB && benchB.length > 0 ? calculateTeamAvg(benchB) : startAvgB;

  // 1. Total Squad Balance & Bench Power Analysis
  const squadDiff = squadAvgA - squadAvgB;
  if (Math.abs(squadDiff) <= 1) {
    advices.push({
      icon: '⚖️',
      title: isAr ? 'توازن كامل بين القائمتين (أساسي + دكة)' : 'Complete Squad Balance (Starters + Bench)',
      body: isAr
        ? `الفريقان متعادلان تماماً في المعدل الشامل للقائمة (الفريق أ ${squadAvgA} - الفريق ب ${squadAvgB}). القوة البدنية وتبديلات الشوط الثاني هي الحاسمة.`
        : `Both squads are evenly matched in total squad rating (${squadAvgA} vs ${squadAvgB}). Bench depth and 2nd-half stamina will determine the outcome.`,
      type: 'tactical_tip',
    });
  } else if (squadDiff > 1) {
    advices.push({
      icon: '💎',
      title: isAr ? 'عمق فني أعلى لصالح الفريق أ' : 'Team A Squad Depth Advantage',
      body: isAr
        ? `يمتلك الفريق أ معدلاً شاملاً أكبر (${squadAvgA} مقابل ${squadAvgB}). يتطلب من الفريق ب تنظيم خطوطه وتقليل المساحات بين الدفاع والوسط.`
        : `Team A holds a overall squad rating advantage (${squadAvgA} vs ${squadAvgB}). Team B must compress central lanes to stay competitive.`,
      type: 'key_battle',
    });
  } else {
    advices.push({
      icon: '🛡️',
      title: isAr ? 'عمق فني أعلى لصالح الفريق ب' : 'Team B Squad Depth Advantage',
      body: isAr
        ? `يمتلك الفريق ب معدلاً شاملاً أكبر (${squadAvgB} مقابل ${squadAvgA}). يجب على الفريق أ الضغط العالي لاستخلاص الكرات بسرعة.`
        : `Team B holds a total squad rating advantage (${squadAvgB} vs ${squadAvgA}). Team A needs aggressive high pressing to break rhythm.`,
      type: 'key_battle',
    });
  }

  // 2. Bench Impact & Super-Sub Gameplan
  if (benchAvgA > startAvgA - 2 && benchA && benchA.length > 0) {
    const topSubA = [...benchA].sort((a, b) => (b.overallRating || 70) - (a.overallRating || 70))[0];
    advices.push({
      icon: '⚡',
      title: isAr ? 'ورقة جوكر على دكة الفريق أ' : 'Team A Super-Sub Weapon',
      body: isAr
        ? `دكة الفريق أ تمتلك لاعباً مميزاً (${topSubA?.fullName || topSubA?.cardName || 'لاعب بديل'} بتقييم ${topSubA?.overallRating || 70}). نزوله في الشوط الثاني سيعطي طاقة هجومية هائلة.`
        : `Team A has top quality reserve (${topSubA?.fullName || topSubA?.cardName || 'Reserve'} OVR ${topSubA?.overallRating || 70}). A 2nd-half substitution will inject high energy.`,
      type: 'strength',
    });
  }

  if (benchAvgB > startAvgB - 2 && benchB && benchB.length > 0) {
    const topSubB = [...benchB].sort((a, b) => (b.overallRating || 70) - (a.overallRating || 70))[0];
    advices.push({
      icon: '🔥',
      title: isAr ? 'ورقة جوكر على دكة الفريق ب' : 'Team B Super-Sub Weapon',
      body: isAr
        ? `دكة الفريق ب تملك بديلاً استراتيجياً (${topSubB?.fullName || topSubB?.cardName || 'لاعب بديل'} بتقييم ${topSubB?.overallRating || 70}). استخدامه مبكراً سيزيد الخيارات التكتيكية.`
        : `Team B holds strong bench impact with (${topSubB?.fullName || topSubB?.cardName || 'Reserve'} OVR ${topSubB?.overallRating || 70}). Tactical introduction will stretch the opponent.`,
      type: 'strength',
    });
  }

  // 3. Star Duel / Marquee Head-to-Head
  const getTopStar = (list: any[]) => [...(list || [])].sort((a, b) => (b.overallRating || 70) - (a.overallRating || 70))[0];
  const starA = getTopStar(teamA);
  const starB = getTopStar(teamB);
  if (starA && starB) {
    advices.push({
      icon: '⭐',
      title: isAr ? 'صراع النجوم والمحركات الرئيسية' : 'Marquee Key Player Battle',
      body: isAr
        ? `مواجهة مباشرة بين نجم الفريق أ (${starA.cardName || starA.fullName} - ${starA.assignedPosition || starA.primaryPosition} OVR ${starA.overallRating || 70}) ونجم الفريق ب (${starB.cardName || starB.fullName} - ${starB.assignedPosition || starB.primaryPosition} OVR ${starB.overallRating || 70}).`
        : `Head-to-head spotlight: Team A leader (${starA.cardName || starA.fullName} OVR ${starA.overallRating || 70}) vs Team B leader (${starB.cardName || starB.fullName} OVR ${starB.overallRating || 70}).`,
      type: 'key_battle',
    });
  }

  // 4. Formation Matchup Insights
  if ((formationA.includes('4-3-3') && formationB.includes('4-2-3-1')) || (formationB.includes('4-3-3') && formationA.includes('4-2-3-1'))) {
    advices.push({
      icon: '⚔️',
      title: isAr ? 'صراع التكتيك: 4-3-3 ضد 4-2-3-1' : 'Tactical Clash: 4-3-3 vs 4-2-3-1',
      body: isAr
        ? `معركة خط الوسط حامية: صانع ألعاب الـ 4-2-3-1 سيحاول التحرك خلف خط وسط الـ 4-3-3. مفتاح الحسم هو سرعة افتراض الكرات الثنائية.`
        : `Midfield battle: 4-2-3-1 playmaker will operate between lines against 4-3-3 pivot. Winning 2nd balls will decide possession control.`,
      type: 'tactical_tip',
    });
  } else if (formationA.includes('3-') || formationB.includes('3-') || formationA.includes('5-') || formationB.includes('5-')) {
    advices.push({
      icon: '🚀',
      title: isAr ? 'استغلال أجنحة وأظهيرة الملعب' : 'Flank Overloads & Wing Play',
      body: isAr
        ? `وجود 3 مدافعين يخلق مساحات خلف الأطراف. التمريرات الطولية السريعة للأجنحة ستضع المهاجمين في وضعيات 1 ضد 1.`
        : `3/5-back setups yield spaces behind wing-backs. Quick diagonal balls to isolation wingers will create high-probability chances.`,
      type: 'tactical_tip',
    });
  } else if (formationA.includes('4-2-2-2') || formationB.includes('4-2-2-2') || formationA.includes('4-2-4') || formationB.includes('4-2-4')) {
    advices.push({
      icon: '💥',
      title: isAr ? 'هجوم مزدوج وضغط على خط الدفاع' : 'Dual Striker Central Overload',
      body: isAr
        ? `اعتماد مهاجمين صريحين يرهق قلبي الدفاع. يتوجب على خط الوسط العودة للتغطية وتضييق المسافة أمام منطقة الجزاء.`
        : `Dual striker systems put immense pressure on center-backs. Midfield pivots must drop deep to protect central zones.`,
      type: 'strength',
    });
  }

  // 5. Pace & Explosiveness Threat
  const getAvgAttr = (list: any[], attr: string) => {
    if (!list || list.length === 0) return 70;
    return Math.round(list.reduce((sum, p) => sum + (p.attributes?.[attr] || p.overallRating || 70), 0) / list.length);
  };
  
  const speedA = getAvgAttr(teamA, 'speed');
  const speedB = getAvgAttr(teamB, 'speed');
  if (speedA >= speedB + 3) {
    advices.push({
      icon: '💨',
      title: isAr ? 'تفوق السرعة للفريق أ' : 'Team A Pace & Transition Speed',
      body: isAr
        ? `الفريق أ يمتلك معدل سرعة أعلى (${speedA} vs ${speedB}). الهجمات السريعة المباشرة ستسبب ارتباكاً كبيراً لدفاع الفريق ب.`
        : `Team A has higher overall pace (${speedA} vs ${speedB}). Direct transitions will stretch Team B's defensive shape.`,
      type: 'strength',
    });
  } else if (speedB >= speedA + 3) {
    advices.push({
      icon: '💨',
      title: isAr ? 'تفوق السرعة للفريق ب' : 'Team B Pace & Transition Speed',
      body: isAr
        ? `الفريق ب يمتلك سرعة أعلى (${speedB} vs ${speedA}). يُوصى الفريق أ بعدم التقدم المبالغ فيه لتفادي المرتدات السريعة.`
        : `Team B has superior pace (${speedB} vs ${speedA}). Team A should avoid a high defensive line to prevent counter-attack leaks.`,
      type: 'strength',
    });
  }

  return advices;
}

interface MatchConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: MatchConfig, previewData?: any) => void;
  communityPlayers?: CommunityPlayer[];
}

export default function MatchConfigModal({ isOpen, onClose, onGenerate, communityPlayers = [] }: MatchConfigModalProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'standard' | 'turf'>('standard');
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedForSwap, setSelectedForSwap] = useState<{
    teamIndex: number | 'bench' | 'benchA' | 'benchB';
    playerIndex: number;
    player: any;
  } | null>(null);
  const [aiPitchView, setAiPitchView] = useState(false);
  const [pitchResetCounter, setPitchResetCounter] = useState(0);
  const [selectedFormationA, setSelectedFormationA] = useState<string>('');
  const [selectedFormationB, setSelectedFormationB] = useState<string>('');

  const [config, setConfig] = useState<MatchConfig>({
    date: '',
    time: '',
    location: '',
    cost: '',
    notes: '',
    matchMode: 'standard',
    numTeams: 2,
    playersPerTeam: 6,
    gkMode: 'rotating',
    fixedGkTeamA: '',
    fixedGkTeamB: '',
    gkRotationInterval: 'per_match',
    gkRotationMinutes: 10,
    matchType: 'league',
    matchDurationMins: 20,
    endCondition: 'time',
    targetGoals: 3,
    isOpenRegistration: false,
    selectedPlayerUids: undefined, // undefined = all players
    enableCardsSystem: true,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPlayersDropdown, setShowPlayersDropdown] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('PM');

  // Interactive Pitch Tactical Position Editing (PES/FIFA style)
  const [activeTacticalPlayer, setActiveTacticalPlayer] = useState<{ teamId: 'A' | 'B' | number; playerIndex: number; player: any } | null>(null);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const playersDropdownRef = useRef<HTMLDivElement>(null);

  // Selected players for this match (default: all)
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const allUids = communityPlayers.map(p => p.uid);

  const togglePlayer = (uid: string) => {
    setSelectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedUids.size === allUids.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(allUids));
    }
  };

  // On open, default select all players
  useEffect(() => {
    if (isOpen && communityPlayers.length > 0) {
      setSelectedUids(new Set(communityPlayers.map(p => p.uid)));
    }
  }, [isOpen, communityPlayers]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
      if (playersDropdownRef.current && !playersDropdownRef.current.contains(event.target as Node)) {
        setShowPlayersDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = isAr
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayNames = isAr
    ? ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSelectDate = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setConfig(prev => ({ ...prev, date: formattedDate }));
    setShowDatePicker(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setCurrentMonthDate(today);
    setConfig(prev => ({ ...prev, date: formattedDate }));
    setShowDatePicker(false);
  };

  const handleTimeUpdate = (hour: string, minute: string, period: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    setConfig(prev => ({ ...prev, time: `${hour}:${minute} ${period}` }));
  };

  const [aiTacticalReport, setAiTacticalReport] = useState<string | null>(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  // Clear AI tactical report whenever match parameters are modified
  useEffect(() => {
    setAiTacticalReport(null);
  }, [config, selectedUids, selectedFormationA, selectedFormationB]);

  const handleGetAIMatchAnalysis = async () => {
    if (!previewData) return;
    setAiReportLoading(true);
    setAiTacticalReport(null);

    try {
      let prompt = '';
      if (previewData.matchMode === 'turf' && previewData.turfResult?.teams) {
        const teamsInfo = previewData.turfResult.teams.map((t: any, idx: number) => {
          const name = t.name || `${isAr ? 'فريق' : 'Team'} ${String.fromCharCode(65 + idx)}`;
          const playerList = (t.assignedPlayers || t.players || []).map((p: any) => `${p.fullName || p.cardName} (${p.assignedPosition || p.primaryPosition || 'MID'}, OVR ${p.overallRating || 70})`).join(', ');
          const avg = t.totalOvr || calculateTeamAvg(t.players || []);
          return `• ${name} (${isAr ? 'معدل' : 'OVR'} ${avg}): ${playerList}`;
        }).join('\n');

        prompt = `أنت 11AI المحلل التكتيكي الكروي الاحترافي لمنصة 11Players.
يوجد حجز كورة يحتوي على ${previewData.turfResult.teams.length} فرق مشاركة:
${teamsInfo}

المطلوب:
1. قدم تحليلاً تكتيكياً عادلاً ومتوازناً باللغة العربية الفصحى بدون انحياز لأي فريق.
2. اعطِ كل فريق خطة تكتيكية وتوصية مخصصة للعب والتمركز بشكل متوازن.
3. ممنوع نهائياً توقع فائز أو الجزم بفوز فريق معين! اجعل الخلاصة تركّز على مفاتيح حسم التكافؤ والعوامل التكتيكية المؤثرة على جميع الفرق بشكل متساوي وعدل.`;
      } else {
        const teamNamesA = (previewData.teamA || []).map((p: any) => `${p.fullName || p.cardName} (${p.assignedPosition || p.primaryPosition || 'MID'}, OVR ${p.overallRating || 70})`).join(', ');
        const teamNamesB = (previewData.teamB || []).map((p: any) => `${p.fullName || p.cardName} (${p.assignedPosition || p.primaryPosition || 'MID'}, OVR ${p.overallRating || 70})`).join(', ');

        prompt = `أنت 11AI المحلل التكتيكي الكروي الاحترافي لمنصة 11Players. قم بتحليل متكافئ وعادل لمباراة الفريق (أ) ضد الفريق (ب):
الفريق أ (متوسط ${previewData.metrics?.teamAAvg || calculateTeamAvg(previewData.teamA || [])}): ${teamNamesA}
الفريق ب (متوسط ${previewData.metrics?.teamBAvg || calculateTeamAvg(previewData.teamB || [])}): ${teamNamesB}

المطلوب:
1. خطة تكتيكية وتوصيات موجهة لكل من الفريق (أ) والفريق (ب) بأسلوب كروي راقٍ وعادل.
2. مفاتيح الحسم التكتيكية للطرفين والصراع المتكافئ في الملعب.
3. ممنوع نهائياً توقع فائز أو الجزم بتفوق فريق على الآخر! ركّز على التكافؤ والتوازن التكتيكي بين الفريقين.`;
      }

      const data = await call11AIChat({
        message: prompt,
        playerContext: {},
        communityRoster: [],
        history: [],
      });

      if (data && data.reply) {
        setAiTacticalReport(data.reply);
      }
    } catch (err) {
      toast.error(isAr ? 'فشل تحليل الذكاء الاصطناعي للمباراة' : 'AI match analysis failed');
    } finally {
      setAiReportLoading(false);
    }
  };

  const handlePresetTime = (preset: string) => {
    const [timePart, period] = preset.split(' ');
    const [h, m] = timePart.split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(period);
    setConfig(prev => ({ ...prev, time: preset }));
    setShowTimePicker(false);
  };

  const handleGenerateOrPreview = () => {
    const finalConfig: MatchConfig = {
      ...config,
      selectedPlayerUids: config.isOpenRegistration
        ? []
        : (communityPlayers.length > 0 && selectedUids.size < communityPlayers.length
            ? Array.from(selectedUids)
            : undefined),
    };

    const result = matchConfigSchema.safeParse(finalConfig);
    if (!result.success) {
      const errorMsg = result.error.issues.map(err => err.message).join(' | ');
      toast.error(errorMsg || 'Please fill in all required fields (Date, Time, Location).');
      console.error('Match config validation error:', result.error);
      return;
    }

    if (config.isOpenRegistration) {
      onGenerate(finalConfig);
      onClose();
      return;
    }

    let availablePlayers = communityPlayers.filter((p: any) => !p.isExcludedFromMatchmaking);
    if (finalConfig.selectedPlayerUids && finalConfig.selectedPlayerUids.length > 0) {
      const selectedSet = new Set(finalConfig.selectedPlayerUids);
      availablePlayers = availablePlayers.filter(p => selectedSet.has(p.uid));
    }

    if (config.matchMode === 'turf') {
      const turfConfig = {
        numTeams: config.numTeams || 2,
        playersPerTeam: config.playersPerTeam || 6,
        gkMode: (config.gkMode || 'rotating') as 'fixed' | 'rotating',
        fixedGkTeamA: config.fixedGkTeamA,
        fixedGkTeamB: config.fixedGkTeamB,
        gkRotationInterval: (config.gkRotationInterval || 'per_match') as 'per_goal' | 'per_time',
        gkRotationMinutes: config.gkRotationMinutes,
        matchType: (config.matchType === 'friendly' ? 'friendly' : config.matchType === 'winner_stays' ? 'winner_stays' : config.matchType || 'league') as 'league' | 'knockout' | 'winner_stays' | 'friendly',
        matchDurationMins: config.matchDurationMins || 20,
        endCondition: config.endCondition || 'time',
        targetGoals: config.targetGoals || 3,
      };
      const turfResult = generateTurfMatch(availablePlayers as any[], turfConfig);
      setPreviewData({ matchMode: 'turf', turfResult, availablePlayers, turfConfig });
      setAiPitchView(false);
    } else {
      const result = balanceTeams(availablePlayers as any[]);
      setPreviewData({ matchMode: 'standard', ...result, availablePlayers });
    }
    setSelectedForSwap(null);
    setPitchResetCounter(c => c + 1);
    setStep('preview');
  };

  const handleRegeneratePreview = () => {
    if (!previewData || !previewData.availablePlayers) return;
    if (previewData.matchMode === 'turf') {
      const turfResult = generateTurfMatch(previewData.availablePlayers as any[], previewData.turfConfig);
      setPreviewData({ ...previewData, turfResult });
    } else {
      const result = balanceTeams(previewData.availablePlayers as any[]);
      setPreviewData({ ...previewData, ...result });
    }
    setSelectedForSwap(null);
    setPitchResetCounter(c => c + 1);
    setAiPitchView(false);
  };

  // ── AI Best to All: pick best 11 players for chosen formation from full squad pool ──
  const handleApplyAIOptimalAll = () => {
    if (!previewData) return;

    if (previewData.matchMode === 'standard') {
      const rawA = previewData.teamA || [];
      const rawB = previewData.teamB || [];

      // Extract bench players for each team
      const benchAPlayers = (previewData.benchA || []).map((b: any) => b.player || b);
      const benchBPlayers = (previewData.benchB || []).map((b: any) => b.player || b);
      if (benchAPlayers.length === 0 && benchBPlayers.length === 0 && previewData.bench) {
        const combined = (previewData.bench || []).map((b: any) => b.player || b);
        const half = Math.ceil(combined.length / 2);
        benchAPlayers.push(...combined.slice(0, half));
        benchBPlayers.push(...combined.slice(half));
      }

      // Combine current starters and bench into full squad pools
      const fullPoolA = [...rawA, ...benchAPlayers];
      const fullPoolB = [...rawB, ...benchBPlayers];

      // Formations to use
      const formationA = selectedFormationA || previewData.formation?.teamA || selectBestFormation(fullPoolA);
      const formationB = selectedFormationB || previewData.formation?.teamB || selectBestFormation(fullPoolB);

      const slotsA = FORMATIONS[formationA]?.length || 11;
      const slotsB = FORMATIONS[formationB]?.length || 11;

      // Assign the BEST 11 players for the chosen formation from full squad pool
      const fullAssignedA = assignPlayersToFormation(fullPoolA, formationA);
      const fullAssignedB = assignPlayersToFormation(fullPoolB, formationB);

      const assignedA = fullAssignedA.slice(0, Math.min(slotsA, fullAssignedA.length)).map(p => {
        const copy = { ...p };
        delete (copy as any).customPitchCoords;
        return copy;
      });
      const newBenchA = fullAssignedA.slice(Math.min(slotsA, fullAssignedA.length)).map(p => ({ player: p, reason: 'Substitute (Bench)' }));

      const assignedB = fullAssignedB.slice(0, Math.min(slotsB, fullAssignedB.length)).map(p => {
        const copy = { ...p };
        delete (copy as any).customPitchCoords;
        return copy;
      });
      const newBenchB = fullAssignedB.slice(Math.min(slotsB, fullAssignedB.length)).map(p => ({ player: p, reason: 'Substitute (Bench)' }));

      const teamAAvg = calculateTeamAvg(assignedA);
      const teamBAvg = calculateTeamAvg(assignedB);

      setSelectedFormationA(formationA);
      setSelectedFormationB(formationB);

      setPreviewData((prev: any) => ({
        ...prev,
        teamA: assignedA,
        teamB: assignedB,
        benchA: newBenchA,
        benchB: newBenchB,
        bench: [...newBenchA, ...newBenchB],
        formation: { teamA: formationA, teamB: formationB },
        metrics: {
          ...(prev?.metrics || {}),
          teamAAvg,
          teamBAvg,
        }
      }));
      setPitchResetCounter(c => c + 1);
      setAiPitchView(true);
    } else if (previewData.matchMode === 'turf' && previewData.turfResult) {
      const updated = JSON.parse(JSON.stringify(previewData.turfResult));
      if (updated.teams) {
        updated.teams = updated.teams.map((t: any) => {
          const pList = t.players || [];
          const form = t.formation || selectBestFormation(pList);
          return {
            ...t,
            formation: form,
            assignedPlayers: assignPlayersToFormation(pList, form),
          };
        });
      }
      setPreviewData((prev: any) => ({ ...prev, turfResult: updated }));
      setPitchResetCounter(c => c + 1);
      setAiPitchView(true);
    }

    toast.success(
      isAr
        ? 'تم اختيار أفضل 11 لاعب لكل مركز في التشكيلة المختارة! ⚡'
        : 'AI selected the best 11 players for each position in the chosen formation! ⚡'
    );
  };



  // ── Interactive Position & Mood Edit & Recalculate ──
  const handleSetPlayerPosition = (
    teamId: 'A' | 'B' | number,
    playerIndex: number,
    newPos: PESPosition,
    customCoords?: { x: number; y: number }
  ) => {
    setPreviewData((prev: any) => {
      if (!prev) return prev;
      if (prev.matchMode === 'standard') {
        const teamKey = teamId === 'A' || teamId === 0 ? 'teamA' : 'teamB';
        const updatedTeam = [...(prev[teamKey] || [])];
        const player = updatedTeam[playerIndex];
        if (!player) return prev;

        const newPsi = calculatePSI(player, newPos);
        const effectiveOvr = customCoords
          ? (player.overallRating || Math.round(newPsi))
          : Math.round(newPsi);
        const newStyle = getBestPlayStyleNameForPosition(player, newPos);

        updatedTeam[playerIndex] = {
          ...player,
          assignedPosition: newPos,
          isManualPosition: true,
          customPitchCoords: customCoords || player.customPitchCoords,
          playStyle: newStyle,
          psi: newPsi,
          overallRating: effectiveOvr
        };

        const newAvg = Math.round(updatedTeam.reduce((acc, p) => acc + (p.overallRating || 70), 0) / updatedTeam.length);



        return {
          ...prev,
          [teamKey]: updatedTeam,

          metrics: {
            ...prev.metrics,
            [teamKey === 'teamA' || teamId === 0 ? 'teamAOverall' : 'teamBOverall']: newAvg
          }
        };
      } else if (prev.matchMode === 'turf' && prev.turfResult) {
        const updatedTurf = JSON.parse(JSON.stringify(prev.turfResult));
        const teamIdx = typeof teamId === 'number' ? teamId : 0;
        if (updatedTurf.teams && updatedTurf.teams[teamIdx]) {
          const teamObj = updatedTurf.teams[teamIdx];
          const updatedPlayers = [...(teamObj.assignedPlayers || teamObj.players || [])];
          const player = updatedPlayers[playerIndex];
          if (player) {
            const newPsi = calculatePSI(player, newPos);
            const newStyle = getBestPlayStyleNameForPosition(player, newPos);
            updatedPlayers[playerIndex] = {
              ...player,
              assignedPosition: newPos,
              isManualPosition: true,
              customPitchCoords: customCoords || player.customPitchCoords,
              playStyle: newStyle,
              psi: newPsi,
              overallRating: Math.round(newPsi)
            };
            teamObj.assignedPlayers = updatedPlayers;
            teamObj.avgOvr = Math.round(updatedPlayers.reduce((acc: number, p: any) => acc + (p.overallRating || 70), 0) / updatedPlayers.length);
          }
        }
        return { ...prev, turfResult: updatedTurf };
      }
      return prev;
    });
    setActiveTacticalPlayer(null);
    toast.success(isAr ? `تم تغيير مركز اللاعب إلى ${newPos}` : `Player position updated to ${newPos}`);
  };

  const handlePlayerSwapClick = (teamIndex: number | 'bench' | 'benchA' | 'benchB', playerIndex: number, player: any) => {
    if (!selectedForSwap) {
      setSelectedForSwap({ teamIndex, playerIndex, player });
      return;
    }
    if (selectedForSwap.teamIndex === teamIndex && selectedForSwap.playerIndex === playerIndex) {
      setSelectedForSwap(null);
      return;
    }

    if (previewData.matchMode === 'turf') {
      const nextResult = JSON.parse(JSON.stringify(previewData.turfResult));
      const getPlayerAndSet = (tIdx: number | 'bench' | 'benchA' | 'benchB', pIdx: number, val?: any) => {
        if (tIdx === 'bench') {
          if (val !== undefined) nextResult.bench[pIdx] = val;
          return nextResult.bench[pIdx];
        } else {
          if (val !== undefined) nextResult.teams[tIdx].players[pIdx] = val;
          return nextResult.teams[tIdx].players[pIdx];
        }
      };
      const p1 = getPlayerAndSet(selectedForSwap.teamIndex, selectedForSwap.playerIndex);
      const p2 = getPlayerAndSet(teamIndex, playerIndex);
      getPlayerAndSet(selectedForSwap.teamIndex, selectedForSwap.playerIndex, p2);
      getPlayerAndSet(teamIndex, playerIndex, p1);

      if (nextResult.teams) {
        nextResult.teams.forEach((t: any) => {
          if (t.players && t.players.length > 0) {
            const total = t.players.reduce((sum: number, p: any) => sum + (p.overallRating || p?.stats?.overallRating || 70), 0);
            t.totalOvr = Math.round(total / t.players.length);
          }
        });
      }
      setPreviewData({ ...previewData, turfResult: nextResult });
    } else {
      const nextData = JSON.parse(JSON.stringify(previewData));
      const getList = (tIdx: number | 'bench' | 'benchA' | 'benchB') => {
        if (tIdx === 0) return nextData.teamA;
        if (tIdx === 1) return nextData.teamB;
        if (tIdx === 'benchA') {
          if (!nextData.benchA && nextData.bench) nextData.benchA = (nextData.bench || []).filter((_: any, idx: number) => idx % 2 === 0);
          return nextData.benchA || [];
        }
        if (tIdx === 'benchB') {
          if (!nextData.benchB && nextData.bench) nextData.benchB = (nextData.bench || []).filter((_: any, idx: number) => idx % 2 === 1);
          return nextData.benchB || [];
        }
        return nextData.bench;
      };

      const l1 = getList(selectedForSwap.teamIndex);
      const l2 = getList(teamIndex);

      const raw1 = l1[selectedForSwap.playerIndex];
      const raw2 = l2[playerIndex];

      if (raw1 && raw2) {
        // Extract pure unwrapped player objects
        const p1 = raw1.player ? { ...raw1.player, ...raw1 } : { ...raw1 };
        delete (p1 as any).player;

        const p2 = raw2.player ? { ...raw2.player, ...raw2 } : { ...raw2 };
        delete (p2 as any).player;

        // Only swap the pitch slot (assignedPosition).
        // Each player keeps their own overallRating exactly as set by the AI — no PSI recalc.
        const pos1 = p1.assignedPosition || p1.primaryPosition || 'CMF';
        const pos2 = p2.assignedPosition || p2.primaryPosition || 'CMF';

        p1.assignedPosition = pos2;
        p2.assignedPosition = pos1;
        p1.isManualPosition = true;
        p2.isManualPosition = true;

        l1[selectedForSwap.playerIndex] = p2;
        l2[playerIndex] = p1;
      }

      const calcAvg = (list: any[]) => {
        if (!list || list.length === 0) return 70;
        const total = list.reduce((sum, item) => {
          const p = item.player || item;
          return sum + (p.overallRating || p?.stats?.overallRating || 70);
        }, 0);
        return Math.round(total / list.length);
      };

      nextData.metrics = {
        teamAAvg: calcAvg(nextData.teamA),
        teamBAvg: calcAvg(nextData.teamB),
      };
      setPreviewData(nextData);
      setPitchResetCounter(c => c + 1);
    }
    setSelectedForSwap(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl"
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
            className={`bg-slate-900 rounded-3xl shadow-2xl shadow-emerald-950/50 w-full ${step === 'preview' ? 'max-w-4xl' : 'max-w-xl'} overflow-hidden border border-slate-800 max-h-[92vh] flex flex-col relative text-white`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Header Sticky Navigation Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 relative z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg leading-tight flex items-center gap-2">
                    <span>{isAr ? "مركز إعداد وتنظيم المباريات" : "Match Configuration Hub"}</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full border transition-all ${step === 'config' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40 font-black' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                      1. {isAr ? "الإعدادات" : "Setup"}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className={`px-2.5 py-0.5 rounded-full border transition-all ${step === 'preview' ? 'bg-purple-950 text-purple-400 border-purple-500/40 font-black' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                      2. {isAr ? "التشكيل الذكي" : "AI Lineup"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                title={isAr ? "إغلاق" : "Close"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto overflow-x-visible flex-1 custom-scrollbar">
              <AnimatePresence mode="wait">
                {step === 'preview' && previewData ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                <div className="space-y-6">
                  {/* Preview Header */}
                  <div className="flex flex-col gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                            <Brain className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                          </span>
                          <span className="leading-tight">{isAr ? 'مراجعة واعتماد التشكيلة (AI)' : 'AI Lineup Review & Approval'}</span>
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            {aiPitchView
                              ? (isAr ? '⚡ عرض التشكيلة المثلى. اضغط «إعادة توزيع» للعودة.' : '⚡ AI-optimised view. Hit Regenerate to reset.')
                              : (isAr
                                ? 'اضغط على لاعب ثم اضغط على لاعب آخر للتبديل.'
                                : 'Tap a player then tap another to swap.')
                            }
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Controls row — formation pickers + action buttons, wraps cleanly on mobile */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Formation selectors — only show in standard mode */}
                      {previewData?.matchMode === 'standard' && (() => {
                        const size = (previewData.teamA || []).length || 11;
                        const options = Object.keys(FORMATIONS).filter(f => FORMATIONS[f].length === size);
                        return (
                          <>
                            <FormationDropdown
                              label="A"
                              value={selectedFormationA || previewData.formation?.teamA || ''}
                              options={options}
                              onChange={fmt => setSelectedFormationA(fmt)}
                              isAr={isAr}
                            />
                            <FormationDropdown
                              label="B"
                              value={selectedFormationB || previewData.formation?.teamB || ''}
                              options={options}
                              onChange={fmt => setSelectedFormationB(fmt)}
                              isAr={isAr}
                            />
                          </>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={handleApplyAIOptimalAll}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl font-black text-xs transition-all shadow-md active:scale-95 ${
                          aiPitchView
                            ? 'bg-purple-700 text-white shadow-purple-700/30'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                        }`}
                        title={isAr ? 'اختر أفضل 11 لاعب لكل مركز في التشكيلة المختارة' : 'Pick best 11 players for each position in chosen formation'}
                      >
                        <Zap className="w-3.5 h-3.5 fill-white text-white" />
                        <span>{isAr ? 'تطبيق AI ⚡' : 'Apply AI ⚡'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGetAIMatchAnalysis}
                        disabled={aiReportLoading}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                        title={isAr ? 'احصل على تحليل تكتيكي وتوقع شامل من 11AI للمباراة' : 'Get 11AI tactical analysis and match breakdown'}
                      >
                        {aiReportLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                        <span>{isAr ? 'تحليل 11AI التكتيكي 🤖' : '11AI Tactical Report 🤖'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRegeneratePreview}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-sm active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إعادة توزيع' : 'Regenerate'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 11AI Match Tactical Analysis Report Box */}
                  {aiTacticalReport && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-xs leading-relaxed text-slate-200 shadow-xl space-y-2"
                    >
                      <div className="flex items-center gap-2 text-emerald-400 font-black">
                        <Brain className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? "تحليل 11AI التكتيكي للمباراة" : "11AI Tactical Match Analysis"}</span>
                      </div>
                      <div className="space-y-1.5 text-slate-300 font-medium text-xs leading-relaxed">
                        {aiTacticalReport.split('\n').map((line, idx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={idx} className="h-1" />;

                          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
                          const cleanText = isBullet ? trimmed.replace(/^[-•*]\s*/, '') : trimmed;

                          const parts = cleanText.split(/(\*\*.*?\*\*)/g);
                          const formatted = parts.map((part, pIdx) => {
                            if (part && part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="font-black text-emerald-400">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          });

                          if (isBullet) {
                            return (
                              <div key={idx} className="flex items-start gap-1.5 pl-1 rtl:pl-0 rtl:pr-1">
                                <span className="text-emerald-400 font-bold shrink-0">•</span>
                                <span>{formatted}</span>
                              </div>
                            );
                          }
                          return <p key={idx}>{formatted}</p>;
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Turf Mode Preview */}
                  {previewData.matchMode === 'turf' && previewData.turfResult && (
                    <div className="space-y-6">
                      {/* AI Pitch View for Turf */}
                      {aiPitchView && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{minHeight:420}}>
                            {previewData.turfResult.teams?.map((team: any, tIdx: number) => (
                              <HalfPitch
                                key={`turf-pitch-${tIdx}`}
                                team={team.assignedPlayers || team.players || []}
                                label={team.name || `Team ${String.fromCharCode(65 + tIdx)}`}
                                color={team.color || (tIdx === 0 ? '#3B82F6' : tIdx === 1 ? '#EF4444' : '#10B981')}
                                flipped={tIdx % 2 === 1}
                                formationName={team.formation || (team.players?.length === 5 ? '1-2-1' : team.players?.length === 6 ? '2-2-1' : '3-3-1')}
                                isAr={isAr}
                                pitchResetCounter={pitchResetCounter}
                                setActiveTacticalPlayer={setActiveTacticalPlayer}
                                onSwapClick={handlePlayerSwapClick}
                                selectedForSwap={selectedForSwap}
                                teamIndex={tIdx}
                              />
                            ))}
                          </div>
                          {/* Dedicated Bench for Turf */}
                          {(() => {
                            const waiting = previewData.turfResult.waitingTeams || [];
                            const reserve = previewData.turfResult.reservePlayers || previewData.turfResult.bench || [];
                            const allBenchPlayers: any[] = [];
                            waiting.forEach((wt: any) => {
                              if (wt.players) allBenchPlayers.push(...wt.players);
                              else if (Array.isArray(wt)) allBenchPlayers.push(...wt);
                            });
                            if (reserve.length > 0) allBenchPlayers.push(...reserve);

                            if (allBenchPlayers.length === 0) return null;

                            return (
                              <TeamBench
                                bench={allBenchPlayers}
                                teamName={isAr ? 'دكة بدلاء وقائمة الانتظار' : 'Turf Bench & Reserves'}
                                isAr={isAr}
                                onSwapClick={(bpIdx, bPlayer) => handlePlayerSwapClick('bench', bpIdx, bPlayer)}
                                selectedForSwap={selectedForSwap}
                                swapTeamKey="bench"
                              />
                            );
                          })()}
                        </div>
                      )}

                      {/* Default List View for Turf */}
                      {!aiPitchView && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {previewData.turfResult.teams?.map((team: any, tIdx: number) => {
                            const isTeamSelected = selectedForSwap?.teamIndex === tIdx;
                            return (
                              <div
                                key={`turf-team-${tIdx}`}
                                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col ${
                                  isTeamSelected
                                    ? 'bg-purple-500/5 border-purple-500/40 shadow-md shadow-purple-500/10'
                                    : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                                }`}
                              >
                                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                                      style={{ backgroundColor: team.color || (tIdx === 0 ? '#3B82F6' : tIdx === 1 ? '#EF4444' : '#10B981') }}
                                    />
                                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                                      {team.name || `Team ${String.fromCharCode(65 + tIdx)}`}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-xs font-black border border-emerald-500/30">
                                    <Trophy className="w-3.5 h-3.5" />
                                    <span>OVR: {team.totalOvr || calculateTeamAvg(team.players || [])}</span>
                                  </div>
                                </div>

                                <div className="space-y-2 flex-1">
                                  {(team.assignedPlayers && team.assignedPlayers.length > 0 ? team.assignedPlayers : team.players)?.map((player: any, pIdx: number) => {
                                    const isSelected = selectedForSwap?.teamIndex === tIdx && selectedForSwap?.playerIndex === pIdx;
                                    const ovr = player.overallRating || player?.stats?.overallRating || 70;
                                    const pos = player.assignedPosition || player.primaryPosition || 'CMF';
                                    return (
                                      <button
                                        key={player.uid || `t-${tIdx}-p-${pIdx}`}
                                        type="button"
                                        onClick={() => handlePlayerSwapClick(tIdx, pIdx, player)}
                                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 group ${
                                          isSelected
                                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 scale-[1.02]'
                                            : 'bg-white dark:bg-slate-800/90 border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400 hover:shadow-sm'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs uppercase shrink-0 ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                          }`}>
                                            {pos.slice(0, 3)}
                                          </div>
                                          <span className="font-bold text-sm truncate">
                                            {player.fullName || player.cardName || 'Unknown Player'}
                                          </span>
                                        </div>
                                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${
                                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                          {ovr}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {team.bench && team.bench.length > 0 && (
                                  <TeamBench bench={team.bench} teamName={team.name || `Team ${String.fromCharCode(65 + tIdx)}`} isAr={isAr} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard 11v11 Preview */}
                  {previewData.matchMode === 'standard' && (
                    <div className="space-y-6">
                      {/* ── AI PITCH VIEW ── */}
                      {aiPitchView && (
                        <div className="space-y-4">
                          {/* Stats bar */}
                          {(() => {
                            const bA = previewData.benchA || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 0);
                            const bB = previewData.benchB || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 1);
                            const startAvgA = previewData.metrics?.teamAAvg || calculateTeamAvg(previewData.teamA || []);
                            const startAvgB = previewData.metrics?.teamBAvg || calculateTeamAvg(previewData.teamB || []);
                            const squadAvgA = calculateTeamAvg([...(previewData.teamA || []), ...bA]);
                            const squadAvgB = calculateTeamAvg([...(previewData.teamB || []), ...bB]);

                            return (
                              <div className="flex flex-col gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                                {/* Formation badge centred */}
                                <div className="text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm self-center">
                                  <span className="text-blue-500 font-black">{previewData.formation?.teamA || '4-3-3'}</span>
                                  <span className="text-slate-400 font-normal">vs</span>
                                  <span className="text-red-500 font-black">{previewData.formation?.teamB || '4-3-3'}</span>
                                </div>
                                {/* Stats row wraps on mobile */}
                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-black">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"/>
                                    <span className="text-slate-900 dark:text-white">{isAr ? 'أ' : 'A'}</span>
                                    <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-lg border border-blue-500/20">
                                      {isAr ? `${startAvgA} أساسي` : `${startAvgA} Start`}
                                    </span>
                                    <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-lg border border-indigo-500/20">
                                      {isAr ? `${squadAvgA} شامل` : `${squadAvgA} Squad`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-red-500/10 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-lg border border-red-500/20">
                                      {isAr ? `${startAvgB} أساسي` : `${startAvgB} Start`}
                                    </span>
                                    <span className="bg-purple-500/10 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-lg border border-purple-500/20">
                                      {isAr ? `${squadAvgB} شامل` : `${squadAvgB} Squad`}
                                    </span>
                                    <span className="text-slate-900 dark:text-white">{isAr ? 'ب' : 'B'}</span>
                                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"/>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          {/* Side-by-side pitches */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{minHeight:420}}>
                            <HalfPitch
                              team={previewData.teamA || []}
                              label={isAr ? 'الفريق أ' : 'Team A'}
                              color="#3B82F6"
                              flipped={false}
                              formationName={previewData.formation?.teamA}
                              isAr={isAr}
                              pitchResetCounter={pitchResetCounter}
                              setActiveTacticalPlayer={setActiveTacticalPlayer}
                              onSwapClick={handlePlayerSwapClick}
                              selectedForSwap={selectedForSwap}
                              teamIndex={0}
                              onPositionDragChange={handleSetPlayerPosition}
                            />
                            <HalfPitch
                              team={previewData.teamB || []}
                              label={isAr ? 'الفريق ب' : 'Team B'}
                              color="#EF4444"
                              flipped={true}
                              formationName={previewData.formation?.teamB}
                              isAr={isAr}
                              pitchResetCounter={pitchResetCounter}
                              setActiveTacticalPlayer={setActiveTacticalPlayer}
                              onSwapClick={handlePlayerSwapClick}
                              selectedForSwap={selectedForSwap}
                              teamIndex={1}
                              onPositionDragChange={handleSetPlayerPosition}
                            />
                          </div>

                          {/* Dedicated Bench for both teams in AI Pitch View */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <TeamBench
                              bench={previewData.benchA || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 0)}
                              teamName={isAr ? 'الفريق أ' : 'Team A'}
                              isAr={isAr}
                              onSwapClick={(bpIdx, bPlayer) => handlePlayerSwapClick('benchA', bpIdx, bPlayer)}
                              selectedForSwap={selectedForSwap}
                              swapTeamKey="benchA"
                            />
                            <TeamBench
                              bench={previewData.benchB || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 1)}
                              teamName={isAr ? 'الفريق ب' : 'Team B'}
                              isAr={isAr}
                              onSwapClick={(bpIdx, bPlayer) => handlePlayerSwapClick('benchB', bpIdx, bPlayer)}
                              selectedForSwap={selectedForSwap}
                              swapTeamKey="benchB"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── DEFAULT LIST VIEW ── */}
                      {!aiPitchView && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: isAr ? 'الفريق الأول' : 'Team A', list: previewData.teamA, avg: previewData.metrics?.teamAAvg || calculateTeamAvg(previewData.teamA || []), tIdx: 0, color: '#3B82F6' },
                          { name: isAr ? 'الفريق الثاني' : 'Team B', list: previewData.teamB, avg: previewData.metrics?.teamBAvg || calculateTeamAvg(previewData.teamB || []), tIdx: 1, color: '#EF4444' },
                        ].map((team) => {
                          const isTeamSelected = selectedForSwap?.teamIndex === team.tIdx;
                          return (
                            <div
                              key={`std-team-${team.tIdx}`}
                              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col ${
                                isTeamSelected
                                  ? 'bg-purple-500/5 border-purple-500/40 shadow-md shadow-purple-500/10'
                                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: team.color }} />
                                  <h3 className="font-black text-slate-900 dark:text-white text-base">{team.name}</h3>
                                </div>
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-xs font-black border border-emerald-500/30">
                                  <Trophy className="w-3.5 h-3.5" />
                                  <span>AVG: {team.avg}</span>
                                </div>
                              </div>

                              <div className="space-y-2 flex-1">
                                {team.list?.map((player: any, pIdx: number) => {
                                  const isSelected = selectedForSwap?.teamIndex === team.tIdx && selectedForSwap?.playerIndex === pIdx;
                                  const ovr = player.overallRating || player?.stats?.overallRating || 70;
                                  return (
                                    <button
                                      key={player.uid || `std-${team.tIdx}-p-${pIdx}`}
                                      type="button"
                                      onClick={() => handlePlayerSwapClick(team.tIdx, pIdx, player)}
                                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 group ${
                                        isSelected
                                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 scale-[1.02]'
                                          : 'bg-white dark:bg-slate-800/90 border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400 hover:shadow-sm'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs uppercase shrink-0 ${
                                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}>
                                          {player.primaryPosition ? player.primaryPosition.slice(0, 3) : 'PL'}
                                        </div>
                                        <span className="font-bold text-sm truncate">
                                          {player.fullName || player.cardName || 'Unknown Player'}
                                        </span>
                                      </div>
                                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      }`}>
                                        {ovr}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                                {/* Dedicated Bench for Team A / B */}
                                {(() => {
                                  const teamBench = team.tIdx === 0
                                    ? (previewData.benchA || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 0))
                                    : (previewData.benchB || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 1));
                                  if (!teamBench || teamBench.length === 0) return null;
                                  return (
                                    <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                                      <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{team.name} {isAr ? 'احتياط' : 'Bench'}</span>
                                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                          {teamBench.length}
                                        </span>
                                      </h4>
                                      <div className="space-y-1.5">
                                        {teamBench.map((bItem: any, bpIdx: number) => {
                                          const bPlayer = bItem.player || bItem;
                                          const bOvr = bPlayer.overallRating || bPlayer?.stats?.overallRating || 70;
                                          const bPos = bPlayer.primaryPosition || 'CMF';
                                          const isBenchSelected = selectedForSwap?.teamIndex === (team.tIdx === 0 ? 'benchA' : 'benchB') && selectedForSwap?.playerIndex === bpIdx;
                                          return (
                                            <button
                                              key={bPlayer.uid || `std-b-${team.tIdx}-${bpIdx}`}
                                              type="button"
                                              onClick={() => handlePlayerSwapClick(team.tIdx === 0 ? 'benchA' : 'benchB', bpIdx, bPlayer)}
                                              className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                                isBenchSelected
                                                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/30'
                                                  : 'bg-amber-50/60 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/30 text-slate-800 dark:text-slate-200 hover:border-amber-400'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0">
                                                  {bPos}
                                                </span>
                                                <span className="font-bold text-xs truncate">
                                                  {bPlayer.fullName || bPlayer.cardName || 'Unknown Player'}
                                                </span>
                                              </div>
                                              <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                                {bOvr}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                            </div>
                          );
                        })}
                      </div>}
                    </div>
                  )}

                  {/* Bilingual AI Manager Advice Cards */}
                  {(() => {
                    const bA = previewData.benchA || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 0);
                    const bB = previewData.benchB || (previewData.bench || []).filter((_: any, idx: number) => idx % 2 === 1);
                    const managerAdvices = generateBilingualManagerAdvices(
                      previewData.teamA || [],
                      previewData.teamB || [],
                      bA,
                      bB,
                      previewData.formation?.teamA || '4-3-3',
                      previewData.formation?.teamB || '4-3-3',
                      previewData.metrics,
                      isAr
                    );
                    const engineTips = previewData.turfResult?.tipsAndTactics || previewData.tipsAndTactics || [];
                    if (managerAdvices.length === 0 && engineTips.length === 0) return null;

                    return (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 dark:border-blue-500/30 space-y-3">
                        <h4 className="font-black text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                          <span>{isAr ? 'تحليل ونظرة المدير الفني (AI Manager Insights)' : 'Bilingual AI Manager Insights & Tactical Advice'}</span>
                        </h4>
                        
                        {managerAdvices.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {managerAdvices.map((adv, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 shadow-sm">
                                <span className="text-lg shrink-0">{adv.icon}</span>
                                <div className="space-y-1 min-w-0">
                                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">{adv.title}</p>
                                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">{adv.body}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {engineTips.length > 0 && (
                          <ul className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300 pt-1 border-t border-blue-200/40 dark:border-blue-800/40">
                            {engineTips.map((tip: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Preview Footer */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedForSwap(null);
                      setStep('config');
                    }}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-600 outline-none flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isAr ? 'عودة للإعدادات' : 'Back to Config'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const finalConfig: MatchConfig = {
                        ...config,
                        selectedPlayerUids: config.isOpenRegistration
                          ? []
                          : (communityPlayers.length > 0 && selectedUids.size < communityPlayers.length
                              ? Array.from(selectedUids)
                              : undefined),
                      };
                      onGenerate(finalConfig, previewData);
                      onClose();
                    }}
                    className="flex-1 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98] outline-none flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>{isAr ? 'اعتماد التشكيلة وحفظ المباراة' : 'Confirm & Save Match'}</span>
                  </button>
                </div>
                </motion.div>
                ) : (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                      <span className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xl shadow-inner">⚙️</span>
                      <span>{isAr ? 'إعدادات وخيارات المباراة' : 'Match Settings & Configuration'}</span>
                    </h2>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex gap-2 mb-6 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setActiveTab('standard'); setConfig(prev => ({ ...prev, matchMode: 'standard' })); }}
                      className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all leading-tight text-center ${
                        activeTab === 'standard'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-sm sm:text-base">⚽</span>
                      <span>{isAr ? 'مباراة رسمية 11 × 11' : 'Standard 11v11'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('turf'); setConfig(prev => ({ ...prev, matchMode: 'turf' })); }}
                      className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all leading-tight text-center ${
                        activeTab === 'turf'
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Shuffle className="w-4 h-4 sm:w-4 sm:h-4" />
                      <span>{isAr ? 'حجز خماسي / سداسي' : 'Turf / Casual'}</span>
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date Picker */}
                      <div className="relative" ref={datePickerRef}>
                        <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">{isAr ? 'تاريخ المباراة' : 'Match Date'}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDatePicker(!showDatePicker);
                            setShowTimePicker(false);
                          }}
                          className="w-full text-left rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all duration-200 flex items-center justify-between group shadow-inner"
                        >
                          <span className={config.date ? "font-bold text-white" : "text-slate-500 font-medium"}>
                            {config.date || (isAr ? 'يوم/شهر/سنة' : 'YYYY-MM-DD')}
                          </span>
                          <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">📅</span>
                        </button>

                        <AnimatePresence>
                          {showDatePicker && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 top-full mt-2 z-50 w-72 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-black text-white text-sm">
                                  {monthNames[month]} {year}
                                </span>
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors font-bold">‹</button>
                                  <button type="button" onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors font-bold">›</button>
                                </div>
                              </div>

                              <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                                {dayNames.map(d => (
                                  <span key={d} className="text-xs font-bold text-slate-500 py-1">{d}</span>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                  <div key={`empty-${i}`} />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                  const dayNum = i + 1;
                                  const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                  const isSelected = config.date === formatted;
                                  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                                  const isToday = formatted === todayStr;

                                  return (
                                    <button
                                      key={dayNum}
                                      type="button"
                                      onClick={() => handleSelectDate(dayNum)}
                                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                                        isSelected
                                          ? "bg-emerald-600 text-white font-black shadow-md shadow-emerald-950/40 scale-105"
                                          : isToday
                                          ? "border border-emerald-500 text-emerald-400 bg-emerald-950/40"
                                          : "text-slate-300 hover:bg-slate-800"
                                      }`}
                                    >
                                      {dayNum}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                                <button type="button" onClick={() => { setConfig(prev => ({ ...prev, date: '' })); setShowDatePicker(false); }} className="text-slate-400 hover:text-white font-medium px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors">
                                  {isAr ? 'مسح' : 'Clear'}
                                </button>
                                <button type="button" onClick={handleSelectToday} className="text-emerald-400 hover:text-emerald-300 font-bold px-2 py-1 rounded-lg hover:bg-emerald-950/40 transition-colors">
                                  {isAr ? 'اليوم' : 'Today'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Time Picker */}
                      <div className="relative" ref={timePickerRef}>
                        <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">{isAr ? 'وقت المباراة' : 'Match Time'}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTimePicker(!showTimePicker);
                            setShowDatePicker(false);
                          }}
                          className="w-full text-left rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all duration-200 flex items-center justify-between group shadow-inner"
                        >
                          <span className={config.time ? "font-bold text-white" : "text-slate-500 font-medium"}>
                            {config.time || "--:-- --"}
                          </span>
                          <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">⏰</span>
                        </button>

                        <AnimatePresence>
                          {showTimePicker && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 left-auto top-full mt-2 z-50 w-72 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl"
                            >
                              <div className="mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                  {isAr ? 'أوقات شائعة' : 'Popular Presets'}
                                </span>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"].map(t => (
                                    <button key={t} type="button" onClick={() => handlePresetTime(t)} className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${config.time === t ? "bg-emerald-600 text-white font-black shadow-md" : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"}`}>
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t border-slate-800 my-3 pt-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                  {isAr ? 'وقت مخصص' : 'Custom Time'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1">
                                    <CustomDropdown
                                      value={selectedHour}
                                      onChange={(val) => handleTimeUpdate(val, selectedMinute, selectedPeriod)}
                                      isAr={isAr}
                                      options={["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(h => ({
                                        value: h,
                                        label: h
                                      }))}
                                    />
                                  </div>
                                  <span className="font-bold text-slate-400">:</span>
                                  <div className="flex-1">
                                    <CustomDropdown
                                      value={selectedMinute}
                                      onChange={(val) => handleTimeUpdate(selectedHour, val, selectedPeriod)}
                                      isAr={isAr}
                                      options={["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => ({
                                        value: m,
                                        label: m
                                      }))}
                                    />
                                  </div>
                                  <div className="flex rounded-xl bg-slate-950 p-0.5 border border-slate-800">
                                    {["AM", "PM"].map((p) => (
                                      <button key={p} type="button" onClick={() => handleTimeUpdate(selectedHour, selectedMinute, p)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedPeriod === p ? "bg-emerald-600 text-white font-black shadow-sm" : "text-slate-400 hover:text-white"}`}>
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">{isAr ? 'عنوان الملعب أو المكان' : 'Location / Pitch'}</label>
                      <input
                        type="text"
                        placeholder={isAr ? 'مثال: ملعب الأهلي بالشيخ زايد' : 'e.g. Cairo Stadium Pitch 3'}
                        value={config.location}
                        onChange={(e) => setConfig({ ...config, location: e.target.value })}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all duration-200 placeholder:text-slate-500 font-bold text-sm shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">{isAr ? 'التكلفة لكل لاعب' : 'Cost per Player'}</label>
                      <input
                        type="text"
                        placeholder={isAr ? 'مثال: 50 جنيه' : 'e.g. 50 EGP'}
                        value={config.cost}
                        onChange={(e) => setConfig({ ...config, cost: e.target.value })}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all duration-200 placeholder:text-slate-500 font-bold text-sm shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">{isAr ? 'ملاحظات وتتعليمات المباراة' : 'Notes & Instructions'}</label>
                      <textarea
                        placeholder={isAr ? 'تعليمات المباراة، الزي المطلوبة، أو أي ملاحظات أخرى...' : 'Match instructions, uniform color, or extra details...'}
                        value={config.notes}
                        onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500 min-h-[85px] transition-all duration-200 placeholder:text-slate-500 font-bold text-sm shadow-inner"
                      />
                    </div>
                  </div>

              {/* ────────── Turf Settings ────────── */}
              {activeTab === 'turf' && (
                <div className="space-y-5 mb-6 p-5 bg-slate-950/80 border border-slate-800 rounded-3xl shadow-xl text-white">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <Shuffle className="w-4 h-4" />
                    <span>{isAr ? 'إعدادات حجز الكورة العادي / الخماسي' : 'Turf / Casual Matchmaking Settings'}</span>
                  </div>

                  {/* Num Teams Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-400" />{isAr ? 'عدد الفرق المشاركة' : 'Number of Teams'}</span>
                      <span className="text-[11px] text-emerald-400 font-bold">{config.numTeams} {isAr ? 'فرق' : 'teams'}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, numTeams: n }))}
                          className={`flex-1 min-w-[34px] py-2 rounded-xl text-xs font-black transition-all border ${
                            config.numTeams === n
                              ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner ring-1 ring-emerald-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Players per Team Dropdown */}
                  <div className="relative space-y-1.5" ref={playersDropdownRef}>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>{isAr ? 'عدد اللاعبين بالفريق الواحدة' : 'Players / Team'}</span>
                      <span className="text-[11px] text-slate-400 font-normal">({isAr ? 'شامل حارس المرمى' : 'Includes Goalkeeper'})</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPlayersDropdown(p => !p)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white hover:border-emerald-500/50 transition-all shadow-inner"
                    >
                      <span className="text-emerald-400 font-black">{config.playersPerTeam} {isAr ? 'لاعبين بكل فريق' : 'players per team'}</span>
                      <motion.span animate={{ rotate: showPlayersDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {showPlayersDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                          animate={{ opacity: 1, y: 0, scaleY: 1 }}
                          exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                          transition={{ duration: 0.18 }}
                          style={{ originY: 0 }}
                          className="absolute z-50 top-full mt-1 w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
                        >
                          {[4, 5, 6, 7, 8, 9, 10].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => { setConfig(prev => ({ ...prev, playersPerTeam: n })); setShowPlayersDropdown(false); }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors ${
                                config.playersPerTeam === n
                                  ? 'bg-slate-800 text-emerald-400 border-r-4 border-emerald-500 font-black'
                                  : 'text-slate-300 hover:bg-slate-800/80'
                              }`}
                            >
                              <span>{n} {isAr ? 'لاعبين' : 'players'}</span>
                              {config.playersPerTeam === n && <Check className="w-4 h-4 text-emerald-400" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* GK Mode */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><RotateCw className="w-3.5 h-3.5 text-emerald-400" />{isAr ? 'نظام حارس المرمى' : 'GK System'}</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gkMode: 'fixed' }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border ${
                          config.gkMode === 'fixed'
                            ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        🥅 {isAr ? 'حارس ثابت' : 'Fixed GK'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gkMode: 'rotating' }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border ${
                          config.gkMode === 'rotating'
                            ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        🔄 {isAr ? 'حارس دوار' : 'Rotating GK'}
                      </button>
                    </div>
                    {config.gkMode === 'fixed' && communityPlayers.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            🥅 {isAr ? 'حارس الفريق الأول (A)' : 'Team A Fixed GK'}
                          </label>
                          <CustomDropdown
                            value={config.fixedGkTeamA || ''}
                            onChange={(val) => setConfig(prev => ({ ...prev, fixedGkTeamA: val }))}
                            isAr={isAr}
                            placeholder={isAr ? '-- اختر حارس --' : '-- Select GK --'}
                            options={[
                              { value: '', label: isAr ? '-- اختر حارس --' : '-- Select GK --' },
                              ...communityPlayers.map(p => ({
                                value: p.uid,
                                label: p.cardName || p.fullName || 'Player'
                              }))
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            🥅 {isAr ? 'حارس الفريق الثاني (B)' : 'Team B Fixed GK'}
                          </label>
                          <CustomDropdown
                            value={config.fixedGkTeamB || ''}
                            onChange={(val) => setConfig(prev => ({ ...prev, fixedGkTeamB: val }))}
                            isAr={isAr}
                            placeholder={isAr ? '-- اختر حارس --' : '-- Select GK --'}
                            options={[
                              { value: '', label: isAr ? '-- اختر حارس --' : '-- Select GK --' },
                              ...communityPlayers.map(p => ({
                                value: p.uid,
                                label: p.cardName || p.fullName || 'Player'
                              }))
                            ]}
                          />
                        </div>
                      </div>
                    )}
                    {config.gkMode === 'rotating' && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, gkRotationInterval: 'per_match' }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                              config.gkRotationInterval === 'per_match'
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {isAr ? '🔄 كل مباراة' : '🔄 Per match'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, gkRotationInterval: 'per_goal' }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                              config.gkRotationInterval === 'per_goal'
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {isAr ? '⚽ كل هدف' : '⚽ Per goal'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, gkRotationInterval: 'per_time' }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                              config.gkRotationInterval === 'per_time'
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {isAr ? '⏱️ كل وقت' : '⏱️ By time'}
                          </button>
                        </div>
                        {config.gkRotationInterval === 'per_time' && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 mb-1.5">
                              {isAr ? 'تبديل كل (دقيقة)' : 'Rotate every (minutes)'}
                            </div>
                            <div className="flex gap-1.5">
                              {[5, 7, 10, 12, 15].map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setConfig(prev => ({ ...prev, gkRotationMinutes: m }))}
                                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                                    config.gkRotationMinutes === m
                                      ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                                      : 'bg-slate-950 text-slate-400 border-slate-800'
                                  }`}
                                >
                                  {m}&apos;
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Match Format + Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-emerald-400" />{isAr ? 'نوع الحجز / البطولة' : 'Match / Tournament Type'}</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, matchType: 'friendly' }))}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            config.matchType === 'friendly'
                              ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 font-black shadow-inner'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <span>⚽ {isAr ? "حجز ودية (دون بطولة)" : "Casual Friendly (No Tournament)"}</span>
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchType: 'league' }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                              config.matchType === 'league'
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {isAr ? 'دوري' : 'League'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchType: 'knockout' }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                              config.matchType === 'knockout'
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {isAr ? 'كأس' : 'Knockout'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, matchType: 'winner_stays' }))}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            config.matchType === 'winner_stays'
                              ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 font-black shadow-inner'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{isAr ? "الكسبان مستمر" : "Winner Stays On"}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-emerald-400" />{isAr ? 'مدة المباراة (دقيقة)' : 'Match Duration (min)'}</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[10, 15, 20, 25, 30].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchDurationMins: m }))}
                            className={`flex-1 min-w-[36px] py-2.5 rounded-xl text-xs font-black transition-all border ${
                              config.matchDurationMins === m
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Match Limit / End Condition */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-emerald-400" />{isAr ? 'شرط انتهاء المباراة' : 'Match End Condition'}</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, endCondition: 'time' }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          config.endCondition === 'time' ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        ⏱️ {isAr ? 'الوقت فقط' : 'Time Only'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, endCondition: 'goals' }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          config.endCondition === 'goals' ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        ⚽ {isAr ? 'عدد أهداف' : 'Target Goals'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, endCondition: 'both' }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          config.endCondition === 'both' ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-inner' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        ⚡ {isAr ? 'أيهما أقرب' : 'Time or Goals'}
                      </button>
                    </div>
                    {(config.endCondition === 'goals' || config.endCondition === 'both') && (
                      <div className="flex items-center justify-between p-2.5 mt-2 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-slate-300">{isAr ? 'الهدف المطلوب للفوز/التبديل:' : 'Target Goals to Win:'}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 5].map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setConfig(prev => ({ ...prev, targetGoals: g }))}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                config.targetGoals === g ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50 shadow-inner' : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Open Booking / Make a Match Registration Option */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-between mt-4">
                <div className="flex-1 pr-2">
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 block leading-snug">
                    {isAr ? 'إنشاء حجز مفتوح للتسجيل (بدون اختيار لاعبين الآن)' : 'Open Booking Registration (No initial players required)'}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 leading-snug block mt-1">
                    {isAr ? 'سيتمكن اللاعبون من تسجيل حضورهم لاحقاً حتى اكتمال العدد' : 'Players will sign up/check in later until capacity is reached'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, isOpenRegistration: !prev.isOpenRegistration }))}
                  className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out shrink-0 focus:outline-none ${
                    config.isOpenRegistration ? 'bg-emerald-500 shadow-inner' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      config.isOpenRegistration ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Enable Cards & Disciplinary System Option */}
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-center justify-between mt-3">
                <div className="flex-1 pr-2">
                  <span className="text-sm font-black text-red-800 dark:text-red-300 block leading-snug">
                    {isAr ? 'تفعيل نظام الإنذارات والكروت (أصفر / أحمر / إيقاف)' : 'Enable Cards & Disciplinary System (Yellow/Red/Suspensions)'}
                  </span>
                  <span className="text-xs text-red-600 dark:text-red-400 leading-snug block mt-1">
                    {isAr ? 'تسجيل الكروت أثناء المباراة وتطبيق الإيقاف التلقائي في الحجز التالي للكرت الأحمر' : 'Track cards during match & enforce suspensions for players with red cards'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, enableCardsSystem: prev.enableCardsSystem === false ? true : false }))}
                  className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out shrink-0 focus:outline-none ${
                    config.enableCardsSystem !== false ? 'bg-red-600 shadow-inner' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      config.enableCardsSystem !== false ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Player Selection */}
              <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${!config.isOpenRegistration && communityPlayers.length > 0 ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'}`}>
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {isAr ? 'من سيلعب؟ (اختيار لاعبي المجتمع)' : 'Who\'s Playing? (Select Community Players)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-500">
                        {selectedUids.size}/{communityPlayers.length} {isAr ? 'لاعب' : 'players'}
                      </span>
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        {selectedUids.size === allUids.length ? (isAr ? 'إلغاء الكل' : 'Deselect All') : (isAr ? 'تحديد الكل' : 'Select All')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPlayerPicker(p => !p)}
                        className="text-[10px] font-black px-2 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                      >
                        {showPlayerPicker ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'تعديل' : 'Edit')}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {showPlayerPicker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                          {communityPlayers.map(p => (
                            <button
                              key={p.uid}
                              type="button"
                              onClick={() => togglePlayer(p.uid)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                selectedUids.has(p.uid)
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 line-through opacity-60'
                              } ${config.enableCardsSystem !== false && p.stats?.isSuspended ? 'border-2 border-red-500 bg-red-500/20 text-red-600 dark:text-red-400' : ''}`}
                            >
                              {selectedUids.has(p.uid) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {p.cardName || p.fullName}
                              {config.enableCardsSystem !== false && p.stats?.isSuspended && (
                                <span title={isAr ? 'موقوف بسبب كرت أحمر' : 'Suspended (Red Card)'} className="px-1 py-0.5 bg-red-600 text-white rounded text-[9px] font-black">
                                  🚫 {isAr ? 'موقوف' : 'Suspended'}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3.5 mt-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 leading-relaxed">
                {activeTab === 'turf'
                  ? (isAr
                    ? `سيتم توزيع ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} لاعباً` : 'اللاعبين'} على ${config.numTeams} فرق — ${config.playersPerTeam} لاعب/فريق — ${config.gkMode === 'rotating' ? `حارس دوار ${config.gkRotationInterval === 'per_goal' ? 'كل هدف' : config.gkRotationInterval === 'per_time' ? `كل ${config.gkRotationMinutes} دقيقة` : 'كل مباراة'}` : 'حارس ثابت'} — ${config.matchType === 'friendly' ? 'حجز ودية كاجوال' : config.matchType === 'league' ? 'دوري' : config.matchType === 'knockout' ? 'كأس' : 'الكسبان مستمر'} — ${config.matchDurationMins} دق.`
                    : `Splitting ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} players` : 'players'} into ${config.numTeams} teams — ${config.playersPerTeam}/team — ${config.gkMode === 'rotating' ? `rotating GK ${config.gkRotationInterval === 'per_goal' ? 'per goal' : config.gkRotationInterval === 'per_time' ? `every ${config.gkRotationMinutes}min` : 'per match'}` : 'fixed GK'} — ${config.matchType === 'friendly' ? 'Casual Friendly' : config.matchType === 'league' ? 'League' : config.matchType === 'knockout' ? 'Knockout' : 'Winner Stays On'} — ${config.matchDurationMins}min.`)
                  : (isAr
                    ? `سيتم توزيع ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} لاعباً` : 'اللاعبين'} على فريقين (11 ضد 11 قانوني) بتوازن تقييمات الذكاء الاصطناعي.`
                    : `Splitting ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} players` : 'players'} into two balanced 11v11 standard match teams with AI.`)
                }
              </div>

                {/* Config Footer */}
                <div className="flex gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold transition-all border border-slate-800 outline-none focus:ring-2 focus:ring-slate-700 active:scale-95"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateOrPreview}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-emerald-950/50 active:scale-95 outline-none focus:ring-2 focus:ring-emerald-500 flex items-center justify-center gap-2"
                  >
                    <span>{isAr ? (config.isOpenRegistration ? 'إنشاء حجز للتسجيل' : 'معاينة وتكوين الفرق الذكي') : (config.isOpenRegistration ? 'Create Open Registration' : 'Preview & Smart Generate')}</span>
                    {!config.isOpenRegistration && <Brain className="w-4.5 h-4.5 animate-bounce text-emerald-200" />}
                  </button>
                </div>
                </>
              </motion.div>
              )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* PES/FIFA Interactive Position Selector Modal */}
      {activeTacticalPlayer && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-lg ring-2 ring-emerald-400">
                  {activeTacticalPlayer.player.overallRating || activeTacticalPlayer.player?.stats?.overallRating || 70}
                </div>
                <div>
                  <h3 className="font-black text-white text-base leading-tight">
                    {activeTacticalPlayer.player.cardName || activeTacticalPlayer.player.fullName}
                  </h3>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                    <span>{isAr ? 'تعديل المركز ونمط اللعب (المود) التكتيكي' : 'Tactical Position & Mood Selector'}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTacticalPlayer(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-300 mb-3 font-semibold">
                {isAr ? 'اختر المركز المطلوب على أرضية الملعب وسيقوم المحرك بحساب تقييم اللاعب الفعلي لهذه الخطة فوراً:' : 'Choose assigned position on pitch to recalculate performance & OVR:'}
              </p>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {[
                  { category: isAr ? 'حراسة المرمى' : 'Goalkeeper', positions: ['GK'] as PESPosition[] },
                  { category: isAr ? 'خط الدفاع' : 'Defense', positions: ['CB', 'LB', 'RB'] as PESPosition[] },
                  { category: isAr ? 'خط الوسط' : 'Midfield', positions: ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'] as PESPosition[] },
                  { category: isAr ? 'خط الهجوم' : 'Attack', positions: ['LWF', 'RWF', 'SS', 'CF'] as PESPosition[] },
                ].map(group => (
                  <div key={group.category} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                      {group.category}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {group.positions.map(pos => {
                        const p = activeTacticalPlayer.player;
                        const currentPos = p.assignedPosition || p.primaryPosition;
                        const isCurrent = currentPos === pos;
                        const isPrimary = p.primaryPosition === pos;
                        const isSecondary = p.secondaryPosition === pos;
                        const isTertiary = p.tertiaryPosition === pos;

                        let badgeText = '';
                        if (isPrimary) badgeText = '⭐ 1st';
                        else if (isSecondary) badgeText = '🌟 2nd';
                        else if (isTertiary) badgeText = '⚡ 3rd';

                        return (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => handleSetPlayerPosition(activeTacticalPlayer.teamId, activeTacticalPlayer.playerIndex, pos)}
                            className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 active:scale-95 ${
                              isCurrent
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300'
                                : isPrimary
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                            }`}
                          >
                            <span>{pos}</span>
                            {badgeText && <span className="text-[9px] opacity-90">{badgeText}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
