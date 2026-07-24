import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/components/ui/ThemeProvider';
import { Users, RotateCw, Trophy, Timer, Shuffle, ChevronDown, Check, X, Brain, RefreshCw, Sparkles, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { matchConfigSchema } from '@/schemas/matchSchema';
import toast from 'react-hot-toast';
import { generateTurfMatch, FORMATIONS, assignPlayersToFormation } from '@/lib/engine';
import { balanceTeams } from '@/lib/engine';
import { getTacticalSuggestions } from '@/lib/suggestionEngine';

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
    teamIndex: number | 'bench';
    playerIndex: number;
    player: any;
  } | null>(null);
  const [aiPitchView, setAiPitchView] = useState(false);

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

  const datePickerRef2 = datePickerRef;
  const timePickerRef2 = timePickerRef;

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

    try {
      matchConfigSchema.parse(finalConfig);
    } catch (e: any) {
      const errorMsg = e.errors ? e.errors.map((err: any) => err.message).join(', ') : 'Please fill in all required fields (Date, Time, Location).';
      toast.error(errorMsg);
      console.error('Match config validation error:', e);
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
    } else {
      const result = balanceTeams(availablePlayers as any[]);
      setPreviewData({ matchMode: 'standard', ...result, availablePlayers });
    }
    setSelectedForSwap(null);
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
    setAiPitchView(false);
  };

  // ── AI Best to All: optimise positions then re-assign to formation ──
  const handleApplyAIOptimalAll = () => {
    if (!previewData) return;

    const optimizePlayer = (p: any) => {
      const suggestions = getTacticalSuggestions(
        p.attributes,
        p.height || 175,
        p.weight || 70,
        p.preferredFoot || 'Right',
        p.calculatedAge,
        p.peerRatingAvg,
        p.peerRatingCount
      );
      const best = suggestions.positions[0];
      return {
        ...p,
        primaryPosition: best?.position || p.primaryPosition || 'CMF',
        playStyle: best?.bestPlayStyle || p.playStyle || 'Box-to-Box',
      };
    };

    if (previewData.matchMode === 'standard') {
      const optA = (previewData.teamA || []).map(optimizePlayer);
      const optB = (previewData.teamB || []).map(optimizePlayer);

      // Pick formation that best fits 11 players per team
      const pick433 = FORMATIONS['4-3-3'];
      const formationKey = '4-3-3';

      const assignedA = assignPlayersToFormation(optA, formationKey);
      const assignedB = assignPlayersToFormation(optB, formationKey);

      setPreviewData((prev: any) => ({
        ...prev,
        teamA: assignedA,
        teamB: assignedB,
        aiFormation: formationKey,
      }));
      setAiPitchView(true);
    } else if (previewData.matchMode === 'turf' && previewData.turfResult) {
      const updated = JSON.parse(JSON.stringify(previewData.turfResult));
      if (updated.teams) {
        updated.teams = updated.teams.map((t: any) => ({
          ...t,
          players: (t.players || []).map(optimizePlayer),
        }));
      }
      if (updated.bench) updated.bench = updated.bench.map(optimizePlayer);
      setPreviewData((prev: any) => ({ ...prev, turfResult: updated }));
      setAiPitchView(true);
    }

    toast.success(
      isAr
        ? 'تم تحليل جميع اللاعبين وتحديد مراكزهم المثلى! ⚡'
        : 'AI analysed all players & optimised their positions! ⚡'
    );
  };

  const handlePlayerSwapClick = (teamIndex: number | 'bench', playerIndex: number, player: any) => {
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
      const getPlayerAndSet = (tIdx: number | 'bench', pIdx: number, val?: any) => {
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
      const getList = (tIdx: number | 'bench') => {
        if (tIdx === 0) return nextData.teamA;
        if (tIdx === 1) return nextData.teamB;
        return nextData.bench;
      };
      const l1 = getList(selectedForSwap.teamIndex);
      const l2 = getList(teamIndex);
      const temp = l1[selectedForSwap.playerIndex];
      l1[selectedForSwap.playerIndex] = l2[playerIndex];
      l2[playerIndex] = temp;

      const calcAvg = (list: any[]) => {
        if (!list || list.length === 0) return 70;
        const total = list.reduce((sum, p) => sum + (p.overallRating || p?.stats?.overallRating || 70), 0);
        return Math.round(total / list.length);
      };
      nextData.metrics = {
        teamAAvg: calcAvg(nextData.teamA),
        teamBAvg: calcAvg(nextData.teamB),
      };
      setPreviewData(nextData);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full ${step === 'preview' ? 'max-w-4xl' : 'max-w-lg'} overflow-visible border border-slate-200 dark:border-slate-700 max-h-[92vh] flex flex-col transition-all duration-300`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="p-6 overflow-y-auto overflow-x-visible flex-1">
              {step === 'preview' && previewData ? (
                <div className="space-y-6">
                  {/* Preview Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <Brain className="w-6 h-6 animate-pulse" />
                        </span>
                        <span>{isAr ? 'مراجعة واعتماد التشكيلة (AI)' : 'AI Lineup Review & Approval'}</span>
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          {aiPitchView
                            ? (isAr ? '⚡ عرض التشكيلة المثلى بناءً على تحليل الذكاء الاصطناعي لكل لاعب. اضغط "إعادة توزيع" للعودة.' : '⚡ AI-optimised formation view. Hit Regenerate to go back to default.')
                            : (isAr
                              ? 'التبديل الذكي: اضغط على أي لاعب في فريق ثم اضغط على لاعب آخر في فريق آخر أو الاحتياط للتبديل وإعادة حساب التقييم فوراً.'
                              : 'Smart Swap: Click any player on one team, then click another on a different team or bench to swap & recalculate ratings.')
                          }
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={handleApplyAIOptimalAll}
                        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 shrink-0 ${
                          aiPitchView
                            ? 'bg-purple-700 text-white shadow-purple-700/30 cursor-default opacity-80'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                        }`}
                        title={isAr ? 'تطبيق المراكز وأساليب اللعب المثلى من الذكاء الاصطناعي لجميع اللاعبين وعرض التشكيلة على الملعب' : 'Apply AI best position & play style to all players and show formation on pitch'}
                      >
                        <Zap className="w-4 h-4 fill-white text-white" />
                        <span>{isAr ? 'تطبيق خيار الذكاء الاصطناعي للجميع' : 'Apply AI Best to All'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRegeneratePreview}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إعادة توزيع' : 'Regenerate'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Helper for AI Pitch View */}
                  {(() => {
                    const PITCH_COORDS: Record<string, {x:number;y:number}> = {
                      GK:  {x:50,y:88}, LB:{x:15,y:70}, CB:{x:35,y:70},
                      RB:  {x:85,y:70}, DMF:{x:50,y:55}, LMF:{x:20,y:45},
                      CMF: {x:50,y:45}, RMF:{x:80,y:45}, AMF:{x:50,y:30},
                      LWF: {x:18,y:18}, RWF:{x:82,y:18}, CF:{x:50,y:10}, SS:{x:50,y:18},
                    };

                    const renderHalfPitch = (team: any[], label: string, color: string, flipped: boolean, formation?: string) => (
                      <div className="flex-1 relative min-h-0 min-w-[200px]">
                        <div className="text-xs font-black text-center mb-1.5 tracking-wider uppercase flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: color}} />
                            <span className="text-slate-700 dark:text-slate-200">{label}</span>
                          </div>
                          {formation && <span className="text-[10px] text-slate-500">{formation}</span>}
                        </div>
                        <div
                          className="relative w-full rounded-xl overflow-hidden border border-emerald-600/40"
                          style={{
                            background: 'repeating-linear-gradient(90deg,rgba(34,197,94,0.18) 0 16.66%,rgba(22,163,74,0.22) 16.66% 33.33%)',
                            paddingTop: '130%',
                          }}
                        >
                          {/* Pitch markings */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-0 right-0 border-t border-white/20" style={{top:'50%'}}/>
                            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20" style={{top:'50%'}}/>
                            <div className="absolute left-1/4 right-1/4 top-0 h-[8%] border-b border-x border-white/20"/>
                            <div className="absolute left-1/4 right-1/4 bottom-0 h-[8%] border-t border-x border-white/20"/>
                          </div>

                          {/* Player dots */}
                          {team.map((p: any, i: number) => {
                            const pos = p.assignedPosition || p.primaryPosition || 'CMF';
                            const coords = PITCH_COORDS[pos] || {x:50,y:50};
                            const y = flipped ? 100 - coords.y : coords.y;
                            const ovr = p.overallRating || p?.stats?.overallRating || 70;
                            const name = (p.cardName || p.fullName || 'Player').split(' ')[0];
                            return (
                              <div
                                key={p.uid || i}
                                className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group"
                                style={{left:`${coords.x}%`, top:`${y}%`}}
                              >
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] text-white shadow-lg border-2 border-white/80 transition-transform group-hover:scale-110"
                                  style={{backgroundColor: color, boxShadow:`0 2px 8px ${color}55`}}
                                >
                                  {ovr}
                                </div>
                                <div className="mt-0.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[8px] font-black uppercase tracking-wider whitespace-nowrap">
                                  {pos}
                                </div>
                                <div className="mt-0.5 text-[7px] font-bold text-white bg-slate-800/70 px-1 rounded truncate max-w-[52px] text-center">
                                  {name}
                                </div>
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  {p.cardName || p.fullName} · {pos} · OVR {ovr}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );

                    return (
                      <>
                        {/* Turf Mode Preview */}
                        {previewData.matchMode === 'turf' && previewData.turfResult && (
                    <div className="space-y-6">
                      {aiPitchView ? (
                        <div className="flex flex-wrap gap-3">
                          {previewData.turfResult.teams?.map((team: any, tIdx: number) => {
                            const teamColor = team.color || (tIdx === 0 ? '#3B82F6' : tIdx === 1 ? '#EF4444' : tIdx === 2 ? '#10B981' : '#F59E0B');
                            return renderHalfPitch(
                              team.assignedPlayers && team.assignedPlayers.length > 0 ? team.assignedPlayers : team.players || [],
                              team.name || `Team ${String.fromCharCode(65 + tIdx)}`,
                              teamColor,
                              tIdx % 2 !== 0,
                              team.formation
                            );
                          })}
                        </div>
                      ) : (
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
                                    <span>OVR: {team.totalOvr || 70}</span>
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
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Bench / Reserves */}
                      {previewData.turfResult.bench && previewData.turfResult.bench.length > 0 && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>{isAr ? 'الاحتياط / المنتظرين' : 'Bench / Reserves'}</span>
                              <span className="bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-100 text-xs px-2 py-0.5 rounded-full font-bold">
                                {previewData.turfResult.bench.length}
                              </span>
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {previewData.turfResult.bench.map((player: any, pIdx: number) => {
                              const isSelected = selectedForSwap?.teamIndex === 'bench' && selectedForSwap?.playerIndex === pIdx;
                              const ovr = player.overallRating || player?.stats?.overallRating || 70;
                              return (
                                <button
                                  key={player.uid || `bench-${pIdx}`}
                                  type="button"
                                  onClick={() => handlePlayerSwapClick('bench', pIdx, player)}
                                  className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 scale-[1.02]'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                                  }`}
                                >
                                  <span className="font-bold text-sm truncate">
                                    {player.fullName || player.cardName || 'Player'}
                                  </span>
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}>
                                    {ovr}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard 11v11 Preview */}
                  {previewData.matchMode === 'standard' && (
                    <div className="space-y-6">
                      {/* ── AI PITCH VIEW ── */}
                      {aiPitchView && (() => {
                        return (
                          <div className="space-y-4">
                            {/* Stats bar */}
                            <div className="flex items-center justify-between text-xs font-black gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"/>
                                <span className="text-slate-700 dark:text-slate-300">{isAr ? 'الفريق أ' : 'Team A'}</span>
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">AVG {previewData.metrics?.teamAAvg || '—'}</span>
                              </div>
                              <div className="text-slate-400 text-xs">4-3-3</div>
                              <div className="flex items-center gap-2">
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">AVG {previewData.metrics?.teamBAvg || '—'}</span>
                                <span className="text-slate-700 dark:text-slate-300">{isAr ? 'الفريق ب' : 'Team B'}</span>
                                <span className="w-3 h-3 rounded-full bg-red-500"/>
                              </div>
                            </div>
                            {/* Side-by-side pitches */}
                            <div className="flex gap-3" style={{minHeight:420}}>
                              {renderHalfPitch(previewData.teamA || [], isAr ? 'الفريق أ' : 'Team A', '#3B82F6', false)}
                              {renderHalfPitch(previewData.teamB || [], isAr ? 'الفريق ب' : 'Team B', '#EF4444', true)}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── DEFAULT LIST VIEW ── */}
                      {!aiPitchView && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: isAr ? 'الفريق الأول' : 'Team A', list: previewData.teamA, avg: previewData.metrics?.teamAAvg || 70, tIdx: 0, color: '#3B82F6' },
                          { name: isAr ? 'الفريق الثاني' : 'Team B', list: previewData.teamB, avg: previewData.metrics?.teamBAvg || 70, tIdx: 1, color: '#EF4444' },
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
                            </div>
                          );
                        })}
                      </div>}

                      {/* Bench — list mode only */}
                      {!aiPitchView && previewData.bench && previewData.bench.length > 0 && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 space-y-3">
                          <h4 className="font-black text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>{isAr ? 'الاحتياط' : 'Bench'}</span>
                            <span className="bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-100 text-xs px-2 py-0.5 rounded-full font-bold">
                              {previewData.bench.length}
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {previewData.bench.map((player: any, pIdx: number) => {
                              const isSelected = selectedForSwap?.teamIndex === 'bench' && selectedForSwap?.playerIndex === pIdx;
                              const ovr = player.overallRating || player?.stats?.overallRating || 70;
                              return (
                                <button
                                  key={player.uid || `bench-std-${pIdx}`}
                                  type="button"
                                  onClick={() => handlePlayerSwapClick('bench', pIdx, player)}
                                  className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 scale-[1.02]'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                                  }`}
                                >
                                  <span className="font-bold text-sm truncate">{player.fullName || player.cardName || 'Player'}</span>
                                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{ovr}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                      </>
                    );
                  })()}

                  {/* Tips & Tactics Box */}
                  {((previewData.turfResult && previewData.turfResult.tipsAndTactics && previewData.turfResult.tipsAndTactics.length > 0) ||
                    (previewData.tipsAndTactics && previewData.tipsAndTactics.length > 0)) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 dark:border-blue-500/30 space-y-2">
                      <h4 className="font-black text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isAr ? 'نصائح وتكتيكات الذكاء الاصطناعي' : 'AI Tactical Insights'}</span>
                      </h4>
                      <ul className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {(previewData.turfResult?.tipsAndTactics || previewData.tipsAndTactics).map((tip: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xl">⚙️</span>
                <span>{isAr ? 'إعدادات المباراة' : 'Match Configuration'}</span>
              </h2>

              {/* Mode Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setActiveTab('standard'); setConfig(prev => ({ ...prev, matchMode: 'standard' })); }}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all leading-tight text-center ${
                    activeTab === 'standard'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="text-sm sm:text-base">⚽</span>
                  <span>{isAr ? 'مباراة قانونية (11 × 11)' : 'Standard (11v11)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('turf'); setConfig(prev => ({ ...prev, matchMode: 'turf' })); }}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all leading-tight text-center ${
                    activeTab === 'turf'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Shuffle className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span>{isAr ? 'ملاعب خماسي / سداسي' : 'Turf / Casual'}</span>
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date Picker */}
                  <div className="relative" ref={datePickerRef}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'التاريخ' : 'Date'}</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDatePicker(!showDatePicker);
                        setShowTimePicker(false);
                      }}
                      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center justify-between group"
                    >
                      <span className={config.date ? "font-medium text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                        {config.date || (isAr ? 'يوم/شهر/سنة' : 'mm/dd/yyyy')}
                      </span>
                      <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">📅</span>
                    </button>

                    <AnimatePresence>
                      {showDatePicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 z-50 w-72 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {monthNames[month]} {year}
                            </span>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-bold">‹</button>
                              <button type="button" onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-bold">›</button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                            {dayNames.map(d => (
                              <span key={d} className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</span>
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
                                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-105"
                                      : isToday
                                      ? "border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80"
                                  }`}
                                >
                                  {dayNum}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex justify-between items-center text-xs">
                            <button type="button" onClick={() => { setConfig(prev => ({ ...prev, date: '' })); setShowDatePicker(false); }} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              {isAr ? 'مسح' : 'Clear'}
                            </button>
                            <button type="button" onClick={handleSelectToday} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                              {isAr ? 'اليوم' : 'Today'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Time Picker */}
                  <div className="relative" ref={timePickerRef}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'الوقت' : 'Time'}</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTimePicker(!showTimePicker);
                        setShowDatePicker(false);
                      }}
                      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center justify-between group"
                    >
                      <span className={config.time ? "font-medium text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                        {config.time || "--:-- --"}
                      </span>
                      <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">⏰</span>
                    </button>

                    <AnimatePresence>
                      {showTimePicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 left-auto top-full mt-2 z-50 w-72 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
                        >
                          <div className="mb-3">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                              {isAr ? 'أوقات شائعة' : 'Popular Presets'}
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"].map(t => (
                                <button key={t} type="button" onClick={() => handlePresetTime(t)} className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${config.time === t ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-700/80 my-3 pt-3">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
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
                              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700/60 p-0.5 border border-slate-200 dark:border-slate-700">
                                {["AM", "PM"].map((p) => (
                                  <button key={p} type="button" onClick={() => handleTimeUpdate(selectedHour, selectedMinute, p)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedPeriod === p ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}>
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
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'الملعب' : 'Location / Pitch'}</label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: الملعب الرئيسي' : 'e.g. Cairo Stadium'}
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'التكلفة لكل لاعب' : 'Cost per Player'}</label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: 50 جنيه' : 'e.g. 50 EGP'}
                    value={config.cost}
                    onChange={(e) => setConfig({ ...config, cost: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'ملاحظات' : 'Notes'}</label>
                  <textarea
                    placeholder={isAr ? 'أي تعليمات خاصة للاعبين...' : 'Any special instructions for players...'}
                    value={config.notes}
                    onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] min-h-[80px] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* ────────── Turf Settings ────────── */}
              {activeTab === 'turf' && (
                <div className="space-y-5 mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm">
                    <Shuffle className="w-4 h-4" />
                    <span>{isAr ? 'إعدادات حجز الكورة العادي / الخماسي' : 'Turf / Casual Matchmaking Settings'}</span>
                  </div>

                  {/* Num Teams */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{isAr ? 'عدد الفرق' : 'Number of Teams'}</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[2, 3, 4].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, numTeams: n }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                              config.numTeams === n
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Players per Team — Custom Animated Dropdown */}
                    <div className="relative" ref={playersDropdownRef}>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>{isAr ? 'لاعبين/فريق' : 'Players / Team'}</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">({isAr ? 'شامل حارس المرمى' : 'Includes Goalkeeper'})</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPlayersDropdown(p => !p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 dark:bg-slate-900 border border-slate-700 rounded-2xl text-sm font-black text-white hover:border-amber-500 transition-all"
                      >
                        <span>{config.playersPerTeam} {isAr ? 'لاعبين' : 'players'}</span>
                        <motion.span animate={{ rotate: showPlayersDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {showPlayersDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                            transition={{ duration: 0.18 }}
                            style={{ originY: 0 }}
                            className="absolute z-50 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl"
                          >
                            {[4, 5, 6, 7, 8, 9, 10].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => { setConfig(prev => ({ ...prev, playersPerTeam: n })); setShowPlayersDropdown(false); }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors ${
                                  config.playersPerTeam === n
                                    ? 'bg-amber-500 text-white'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <span>{n} {isAr ? 'لاعبين' : 'players'}</span>
                                {config.playersPerTeam === n && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* GK Mode */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1"><RotateCw className="w-3.5 h-3.5" />{isAr ? 'نظام حارس المرمى' : 'GK System'}</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gkMode: 'fixed' }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          config.gkMode === 'fixed'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        🥅 {isAr ? 'حارس ثابت' : 'Fixed GK'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gkMode: 'rotating' }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          config.gkMode === 'rotating'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        🔄 {isAr ? 'حارس دوار' : 'Rotating GK'}
                      </button>
                    </div>
                    {config.gkMode === 'fixed' && communityPlayers.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
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
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                              config.gkRotationInterval === 'per_match'
                                ? 'bg-amber-400 text-white border-amber-400'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? '🔄 كل مباراة' : '🔄 Per match'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, gkRotationInterval: 'per_goal' }))}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                              config.gkRotationInterval === 'per_goal'
                                ? 'bg-amber-400 text-white border-amber-400'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? '⚽ كل هدف' : '⚽ Per goal'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, gkRotationInterval: 'per_time' }))}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                              config.gkRotationInterval === 'per_time'
                                ? 'bg-amber-400 text-white border-amber-400'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? '⏱️ كل وقت' : '⏱️ By time'}
                          </button>
                        </div>
                        {config.gkRotationInterval === 'per_time' && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 mb-1.5">
                              {isAr ? 'تبديل كل (دقيقة)' : 'Rotate every (minutes)'}
                            </div>
                            <div className="flex gap-1.5">
                              {[5, 7, 10, 12, 15].map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setConfig(prev => ({ ...prev, gkRotationMinutes: m }))}
                                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                                    config.gkRotationMinutes === m
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{isAr ? 'نوع الحجز / البطولة' : 'Match / Tournament Type'}</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, matchType: 'friendly' }))}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                            config.matchType === 'friendly'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>⚽ {isAr ? "حجز ودية (لعب مستمر دون بطولة)" : "Casual Friendly (No Tournament)"}</span>
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchType: 'league' }))}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                              config.matchType === 'league'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? 'دوري' : 'League'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchType: 'knockout' }))}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                              config.matchType === 'knockout'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? 'كأس' : 'Knockout'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, matchType: 'winner_stays' }))}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                            config.matchType === 'winner_stays'
                              ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <RotateCw className="w-4 h-4" />
                          <span>{isAr ? "الكسبان مستمر" : "Winner Stays On"}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{isAr ? 'مدة المباراة (دقيقة)' : 'Match Duration (min)'}</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[10, 15, 20, 25, 30].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchDurationMins: m }))}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                              config.matchDurationMins === m
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Match Limit / End Condition */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-500" />{isAr ? 'شرط انتهاء المباراة' : 'Match End Condition'}</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, endCondition: 'time' }))}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all border ${
                          config.endCondition === 'time' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        ⏱️ {isAr ? 'الوقت فقط' : 'Time Only'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, endCondition: 'goals' }))}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all border ${
                          config.endCondition === 'goals' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        ⚽ {isAr ? 'عدد أهداف' : 'Target Goals'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, endCondition: 'both' }))}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all border ${
                          config.endCondition === 'both' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        ⚡ {isAr ? 'أيهما أقرب' : 'Time or Goals'}
                      </button>
                    </div>
                    {(config.endCondition === 'goals' || config.endCondition === 'both') && (
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{isAr ? 'الهدف المطلوب للفوز/التبديل:' : 'Target Goals to Win:'}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 5].map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setConfig(prev => ({ ...prev, targetGoals: g }))}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                config.targetGoals === g ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
                  className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 shrink-0 ${
                    config.isOpenRegistration ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
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
                  className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 shrink-0 ${
                    config.enableCardsSystem !== false ? 'bg-red-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
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
              <div className="p-3 mt-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200">
                {activeTab === 'turf'
                  ? (isAr
                    ? `سيتم توزيع ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} لاعباً` : 'اللاعبين'} على ${config.numTeams} فرق — ${config.playersPerTeam} لاعب/فريق — ${config.gkMode === 'rotating' ? `حارس دوار ${config.gkRotationInterval === 'per_goal' ? 'كل هدف' : config.gkRotationInterval === 'per_time' ? `كل ${config.gkRotationMinutes} دقيقة` : 'كل مباراة'}` : 'حارس ثابت'} — ${config.matchType === 'friendly' ? 'حجز ودية كاجوال' : config.matchType === 'league' ? 'دوري' : config.matchType === 'knockout' ? 'كأس' : 'الكسبان مستمر'} — ${config.matchDurationMins} دق.`
                    : `Splitting ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} players` : 'players'} into ${config.numTeams} teams — ${config.playersPerTeam}/team — ${config.gkMode === 'rotating' ? `rotating GK ${config.gkRotationInterval === 'per_goal' ? 'per goal' : config.gkRotationInterval === 'per_time' ? `every ${config.gkRotationMinutes}min` : 'per match'}` : 'fixed GK'} — ${config.matchType === 'friendly' ? 'Casual Friendly' : config.matchType === 'league' ? 'League' : config.matchType === 'knockout' ? 'Knockout' : 'Winner Stays On'} — ${config.matchDurationMins}min.`)
                  : (isAr
                    ? `سيتم توزيع ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} لاعباً` : 'اللاعبين'} على فريقين (11 ضد 11 قانوني) بتوازن تقييمات الذكاء الاصطناعي.`
                    : `Splitting ${!config.isOpenRegistration && communityPlayers.length > 0 ? `${selectedUids.size} players` : 'players'} into two balanced 11v11 standard match teams with AI.`)
                }
              </div>

                </>
              )}

              {step === 'preview' ? (
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
              ) : (
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateOrPreview}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98] outline-none focus:ring-2 focus:ring-emerald-500 flex items-center justify-center gap-2"
                  >
                    <span>{isAr ? (config.isOpenRegistration ? 'إنشاء حجز للتسجيل' : 'معاينة وتكوين الفرق الذكي') : (config.isOpenRegistration ? 'Create Open Registration' : 'Preview & Smart Generate')}</span>
                    {!config.isOpenRegistration && <Brain className="w-4 h-4 animate-bounce" />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
