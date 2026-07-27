'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Zap, 
  Target, 
  Flame, 
  CheckCircle2, 
  RotateCw, 
  UserCheck, 
  ChevronRight,
  BrainCircuit,
  Swords,
  Activity,
  AlertTriangle,
  Award
} from 'lucide-react';
import { PlayerProfile, PESPosition } from '@/types';
import { getPlayerOverall } from '@/lib/playerUtils';
import { microSpringProps, microSpringButtonProps, staggerContainerVariants, staggerItemVariants } from '@/lib/animations';

// ── Types ──────────────────────────────────────────────────────────────────

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface WeaknessZone {
  id: string;
  name: { en: string; ar: string };
  score: number; // 0 - 100
  severity: SeverityLevel;
  description: { en: string; ar: string };
  recommendedExploit: { en: string; ar: string };
}

export interface KeyThreatPlayer {
  uid: string;
  name: string;
  position: PESPosition;
  overall: number;
  photoUrl?: string;
  dangerTrait: { en: string; ar: string };
  counterTip: { en: string; ar: string };
}

export interface CounterStrategy {
  formation: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  keyInstructions: { en: string[]; ar: string[] };
}

export interface PressIntensityMode {
  mode: 'HIGH_PRESS' | 'GEGENPRESS' | 'MID_BLOCK' | 'LOW_BLOCK';
  title: { en: string; ar: string };
  intensityScore: number; // 1 - 10
  rationale: { en: string; ar: string };
}

export interface ScoutingReportData {
  opponentTeamName: string;
  overallThreatScore: number;
  weaknessZones: WeaknessZone[];
  keyThreats: KeyThreatPlayer[];
  recommendedCounter: CounterStrategy;
  pressIntensity: PressIntensityMode;
  tacticalTakeaways: { id: string; en: string; ar: string }[];
}

// ── Default Mock Opponent Squad (for demo / fallback) ───────────────────────

export const DEFAULT_OPPONENT_ROSTER: PlayerProfile[] = [
  {
    uid: 'opp_1',
    fullName: 'Karim Al-Masri',
    cardName: 'K. AL-MASRI',
    dateOfBirth: '1998-05-12',
    calculatedAge: 28,
    height: 175,
    weight: 70,
    preferredFoot: 'Right',
    primaryPosition: 'CF',
    secondaryPosition: 'SS',
    tertiaryPosition: 'LWF',
    attributes: {
      offensiveAwareness: 88, ballControl: 84, dribbling: 86, lowPass: 72, loftedPass: 68,
      finishing: 89, heading: 71, speed: 91, acceleration: 92, kickingPower: 85, jump: 74,
      physicalContact: 68, balance: 82, stamina: 76, defensiveAwareness: 42, ballWinning: 40,
      aggression: 55, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
    },
    specialSkills: ['First-time Shot', 'Acrobatic Finishing'],
    photoUrl: '',
    isVerifiedByAdmin: true,
    hasWarning: false,
    stats: { goals: 18, assists: 4, mvp: 6, matchesPlayed: 20 }
  },
  {
    uid: 'opp_2',
    fullName: 'Omar Farouk',
    cardName: 'O. FAROUK',
    dateOfBirth: '2001-09-20',
    calculatedAge: 24,
    height: 182,
    weight: 75,
    preferredFoot: 'Right',
    primaryPosition: 'AMF',
    secondaryPosition: 'CMF',
    tertiaryPosition: 'RWF',
    attributes: {
      offensiveAwareness: 85, ballControl: 89, dribbling: 87, lowPass: 90, loftedPass: 88,
      finishing: 78, heading: 64, speed: 79, acceleration: 81, kickingPower: 80, jump: 66,
      physicalContact: 70, balance: 84, stamina: 72, defensiveAwareness: 54, ballWinning: 52,
      aggression: 50, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
    },
    specialSkills: ['Through Passing', 'Vision'],
    photoUrl: '',
    isVerifiedByAdmin: true,
    hasWarning: false,
    stats: { goals: 7, assists: 15, mvp: 5, matchesPlayed: 20 }
  },
  {
    uid: 'opp_3',
    fullName: 'Tarek Zaki',
    cardName: 'T. ZAKI',
    dateOfBirth: '1995-03-15',
    calculatedAge: 31,
    height: 172,
    weight: 68,
    preferredFoot: 'Right',
    primaryPosition: 'RB',
    secondaryPosition: 'RMF',
    tertiaryPosition: 'CB',
    attributes: {
      offensiveAwareness: 62, ballControl: 68, dribbling: 65, lowPass: 64, loftedPass: 62,
      finishing: 50, heading: 60, speed: 64, acceleration: 63, kickingPower: 65, jump: 62,
      physicalContact: 66, balance: 70, stamina: 62, defensiveAwareness: 66, ballWinning: 65,
      aggression: 70, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
    },
    specialSkills: ['Fighting Spirit'],
    photoUrl: '',
    isVerifiedByAdmin: true,
    hasWarning: false,
    stats: { goals: 1, assists: 2, mvp: 1, matchesPlayed: 20 }
  },
  {
    uid: 'opp_4',
    fullName: 'Hassan Sherif',
    cardName: 'H. SHERIF',
    dateOfBirth: '1997-11-04',
    calculatedAge: 28,
    height: 176,
    weight: 72,
    preferredFoot: 'Left',
    primaryPosition: 'LB',
    secondaryPosition: 'LMF',
    tertiaryPosition: 'CB',
    attributes: {
      offensiveAwareness: 60, ballControl: 66, dribbling: 64, lowPass: 62, loftedPass: 65,
      finishing: 48, heading: 62, speed: 65, acceleration: 66, kickingPower: 64, jump: 64,
      physicalContact: 65, balance: 68, stamina: 64, defensiveAwareness: 64, ballWinning: 63,
      aggression: 68, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
    },
    specialSkills: ['Early Cross'],
    photoUrl: '',
    isVerifiedByAdmin: true,
    hasWarning: false,
    stats: { goals: 0, assists: 3, mvp: 0, matchesPlayed: 20 }
  },
  {
    uid: 'opp_5',
    fullName: 'Youssef Nabil',
    cardName: 'Y. NABIL',
    dateOfBirth: '1999-01-30',
    calculatedAge: 27,
    height: 181,
    weight: 78,
    preferredFoot: 'Right',
    primaryPosition: 'CB',
    secondaryPosition: 'DMF',
    tertiaryPosition: 'RB',
    attributes: {
      offensiveAwareness: 52, ballControl: 62, dribbling: 58, lowPass: 66, loftedPass: 64,
      finishing: 45, heading: 72, speed: 62, acceleration: 60, kickingPower: 70, jump: 70,
      physicalContact: 74, balance: 66, stamina: 65, defensiveAwareness: 72, ballWinning: 74,
      aggression: 76, gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
    },
    specialSkills: ['Interception'],
    photoUrl: '',
    isVerifiedByAdmin: true,
    hasWarning: false,
    stats: { goals: 1, assists: 0, mvp: 2, matchesPlayed: 20 }
  }
];

// ── Pure Logic Calculation Functions (Exported for Testing) ────────────────

export function calculateWeaknessZones(roster: PlayerProfile[]): WeaknessZone[] {
  if (!roster || roster.length === 0) return [];

  // Calculate average stats
  const getAvgAttr = (key: keyof typeof roster[0]['attributes']) => {
    const sum = roster.reduce((acc, p) => acc + (p.attributes?.[key] || 50), 0);
    return sum / roster.length;
  };

  const avgSpeed = getAvgAttr('speed');
  const avgStamina = getAvgAttr('stamina');
  const avgDefAwareness = getAvgAttr('defensiveAwareness');
  const avgBallWinning = getAvgAttr('ballWinning');
  const avgHeading = getAvgAttr('heading');

  const fullbacks = roster.filter(p => ['LB', 'RB', 'LMF', 'RMF'].includes(p.primaryPosition));
  const fullbacksAvgSpeed = fullbacks.length > 0
    ? fullbacks.reduce((acc, p) => acc + (p.attributes?.speed || 50), 0) / fullbacks.length
    : avgSpeed;

  const cbAndGk = roster.filter(p => ['CB', 'GK'].includes(p.primaryPosition));
  const avgHeight = cbAndGk.length > 0
    ? cbAndGk.reduce((acc, p) => acc + (p.height || 175), 0) / cbAndGk.length
    : roster.reduce((acc, p) => acc + (p.height || 175), 0) / roster.length;

  // 1. Flank Exploitation score (0-100)
  // Low fullback speed or low fullback defensive attributes = High vulnerability score
  const flankScore = Math.min(100, Math.max(0, Math.round((82 - fullbacksAvgSpeed) * 2.8 + (75 - avgDefAwareness) * 1.2)));

  // 2. Stamina Deficit score
  const staminaScore = Math.min(100, Math.max(0, Math.round((78 - avgStamina) * 3.2 + 25)));

  // 3. Aerial Vulnerability score
  const heightDeficit = Math.max(0, 184 - avgHeight);
  const aerialScore = Math.min(100, Math.max(0, Math.round(heightDeficit * 4.5 + (75 - avgHeading) * 1.5)));

  // 4. Midfield Overrun score
  const midfieldScore = Math.min(100, Math.max(0, Math.round((78 - (avgDefAwareness + avgBallWinning) / 2) * 2.2 + 20)));

  // Helper for severity rating
  const getSeverity = (score: number): SeverityLevel => {
    if (score >= 75) return 'CRITICAL';
    if (score >= 55) return 'HIGH';
    if (score >= 35) return 'MODERATE';
    return 'LOW';
  };

  return [
    {
      id: 'flank_exploit',
      name: { en: 'Flank Exploitation', ar: 'اختراق الأطراف' },
      score: flankScore,
      severity: getSeverity(flankScore),
      description: {
        en: 'Opponent fullbacks lack pace and recovery speed. High potential for wide overlaps.',
        ar: 'ظهراء الفريق الخصم يفتقرون للسرعة والتغطية العكسية. فرصة عالية للاختراق من الأجنحة.'
      },
      recommendedExploit: {
        en: 'Deploy fast wingers and instruct fullbacks to overlap heavily.',
        ar: 'استغل أجنحة سريعة وأعطِ تعليمات للظهيرين بالصعود الهجومي المستمر.'
      }
    },
    {
      id: 'stamina_deficit',
      name: { en: 'Stamina Deficit', ar: 'عجز اللياقة البدنية' },
      score: staminaScore,
      severity: getSeverity(staminaScore),
      description: {
        en: 'Opponent stamina dips drastically in the 2nd half, causing defensive gaps.',
        ar: 'معدل لياقة الخصم ينخفض بشدة في الشوط الثاني مما يولد ثغرات دفاعية واسعة.'
      },
      recommendedExploit: {
        en: 'Maintain high tempo, press aggressively after the 60th minute.',
        ar: 'احافظ على إيقاع مرتفع ومارس الضغط الهجومي بعد الدقيقة 60.'
      }
    },
    {
      id: 'aerial_vulnerability',
      name: { en: 'Aerial Vulnerability', ar: 'ضعف الكرات العرضية والهوائية' },
      score: aerialScore,
      severity: getSeverity(aerialScore),
      description: {
        en: 'Defensive line is below average height and weak in heading duels.',
        ar: 'خط الدفاع يتسم بقصر القامة وضعف الارتقاء في الكرات العالية.'
      },
      recommendedExploit: {
        en: 'Deliver high whipped crosses into the box for tall target strikers.',
        ar: 'اعمتد على العرضيات المرتفعة الموجهة للمهاجم القوي داخل الصندوق.'
      }
    },
    {
      id: 'midfield_overrun',
      name: { en: 'Midfield Overrun', ar: 'سهولة اختراق المنتصف' },
      score: midfieldScore,
      severity: getSeverity(midfieldScore),
      description: {
        en: 'Opponent central midfielders lack defensive awareness and tackling efficiency.',
        ar: 'خط وسط الخصم يفتقر للوعي الدفاعي وافتكاك الكرات بفعالية.'
      },
      recommendedExploit: {
        en: 'Control the middle with a 3-man midfield and quick one-touch passing.',
        ar: 'سيطر على المنتصف بثلاثي وسط وتمريرات سريعة من لمسة واحدة.'
      }
    }
  ];
}

export function identifyKeyThreats(roster: PlayerProfile[]): KeyThreatPlayer[] {
  if (!roster || roster.length === 0) return [];

  // Sort by calculated overall or attribute total
  const sorted = [...roster].sort((a, b) => {
    const ovrA = getPlayerOverall(a);
    const ovrB = getPlayerOverall(b);
    return ovrB - ovrA;
  });

  return sorted.slice(0, 3).map((p) => {
    const ovr = getPlayerOverall(p);
    const speed = p.attributes?.speed || 50;
    const finishing = p.attributes?.finishing || 50;
    const passing = p.attributes?.lowPass || 50;

    let traitEn = 'Tactical Engine';
    let traitAr = 'محرك تكتيكي';
    let tipEn = 'Mark tightly and force onto weaker foot.';
    let tipAr = 'فرض رقابة لصيقة وإجباره على اللعب بالقدم الضعيفة.';

    if (speed >= 85) {
      traitEn = 'Lightning Speedster';
      traitAr = 'سريع وكاسر للمصيدة';
      tipEn = 'Drop defensive line deep to eliminate space behind.';
      tipAr = 'تراجع بخط الدفاع لمنع المساحات خلف المدافعين.';
    } else if (finishing >= 85) {
      traitEn = 'Lethal Finisher';
      traitAr = 'هداف حاسم داخل الصندوق';
      tipEn = 'Block shooting lanes and double-team in the box.';
      tipAr = 'إغلاق زوايا التسديد وفرض ضغط ثنائي داخل منطقة الجزاء.';
    } else if (passing >= 85) {
      traitEn = 'Master Playmaker';
      traitAr = 'صانع ألعاب خطير';
      tipEn = 'Press tightly in central zone to block key through-balls.';
      tipAr = 'الضغط الفوري لمنع البينيات القاتلة.';
    }

    return {
      uid: p.uid,
      name: p.cardName || p.fullName,
      position: p.primaryPosition,
      overall: ovr,
      photoUrl: p.photoUrl,
      dangerTrait: { en: traitEn, ar: traitAr },
      counterTip: { en: tipEn, ar: tipAr }
    };
  });
}

export function recommendCounterStrategy(weaknessZones: WeaknessZone[], keyThreats: KeyThreatPlayer[]): CounterStrategy {
  const topWeakness = [...weaknessZones].sort((a, b) => b.score - a.score)[0];
  const primaryId = topWeakness?.id || 'flank_exploit';

  if (primaryId === 'flank_exploit') {
    return {
      formation: '4-3-3 Wide',
      name: { en: 'Wide Overload Counter', ar: 'خطة الهجوم من الأجنحة' },
      description: {
        en: 'Exploits opponent slow fullbacks with overlapping wingers and fast transitions.',
        ar: 'استغلال بطء ظهيري الخصم عن طريق تحركات الأجنحة السريعة والعرضيات.'
      },
      keyInstructions: {
        en: ['Focus play on left/right wings', 'High wing-back overlap', 'Quick early crosses'],
        ar: ['تركيز اللعب على الأطراف', 'صعود الهجومي للظهيرين', 'عرضيات سريعة ومباغتة']
      }
    };
  }

  if (primaryId === 'aerial_vulnerability') {
    return {
      formation: '4-4-2 Target Man',
      name: { en: 'Aerial Assault Counter', ar: 'خطة الهجوم الجوي والمرتفعات' },
      description: {
        en: 'Capitalizes on opponent height deficit with twin strikers and set-piece focus.',
        ar: 'استغلال قصر قامة مدافعي الخصم بثنائي هجومي قوي وركنيات موجهة.'
      },
      keyInstructions: {
        en: ['Target physical CF with long balls', 'Pump high crosses', 'Pack box on corner kicks'],
        ar: ['اعتماد الكرات الطويلة للمهاجم', 'تكثيف العرضيات المرتفعة', 'التواجد بكثافة في الركنيات']
      }
    };
  }

  return {
    formation: '4-2-3-1 Counter-Block',
    name: { en: 'Solid Compact Counter', ar: 'خطة التكتل الدفاعي والمرتدات' },
    description: {
      en: 'Protects against key threat players while punishing midfield gaps.',
      ar: 'تأمين دفاعي محكم ضد أبرز نجوم الخصم مع ضرب ثغرات المنتصف بالمرتدات.'
    },
    descriptionAr: 'تأمين دفاعي محكم ضد أبرز نجوم الخصم مع ضرب ثغرات المنتصف بالمرتدات.',
    keyInstructions: {
      en: ['Compact double pivot DMF', 'Quick forward passes on transition', 'Man-mark star player'],
      ar: ['محور دفاعي مزدوج متماسك', 'تمريرات طولية سريعة عند الارتداد', 'رقابة لصيقة لمصدر الخطورة']
    }
  } as CounterStrategy;
}

export function determinePressIntensity(roster: PlayerProfile[], weaknessZones: WeaknessZone[]): PressIntensityMode {
  const staminaWeakness = weaknessZones.find(w => w.id === 'stamina_deficit')?.score || 0;
  
  if (staminaWeakness >= 60) {
    return {
      mode: 'HIGH_PRESS',
      title: { en: 'Aggressive High Press', ar: 'ضغط عالي شرس' },
      intensityScore: 9,
      rationale: {
        en: 'Opponent has low stamina. Pushing high will force errors early and break them late.',
        ar: 'الخصم يعاني من ضعف اللياقة. الضغط المتقدم سيعجل بأخطائهم ويكسر دفاعهم.'
      }
    };
  }

  return {
    mode: 'GEGENPRESS',
    title: { en: 'Heavy Counter-Pressing', ar: 'ضغط عكسي خاطف' },
    intensityScore: 8,
    rationale: {
      en: 'Win back possession within 5 seconds of turnover to exploit disorganized structure.',
      ar: 'استعادة الكرة خلال 5 ثوانٍ من فقدانها لاستغلال عدم التمركز الدفاعي للخصم.'
    }
  };
}

export function calculateOppositionScoutingReport(
  roster: PlayerProfile[] = DEFAULT_OPPONENT_ROSTER,
  teamName: string = 'Opposing Team'
): ScoutingReportData {
  const weaknessZones = calculateWeaknessZones(roster);
  const keyThreats = identifyKeyThreats(roster);
  const recommendedCounter = recommendCounterStrategy(weaknessZones, keyThreats);
  const pressIntensity = determinePressIntensity(roster, weaknessZones);

  const avgOvr = roster.length > 0
    ? Math.round(roster.reduce((acc, p) => acc + getPlayerOverall(p), 0) / roster.length)
    : 75;

  const takeaways = [
    {
      id: 't1',
      en: `Exploit top weakness zone (${weaknessZones[0]?.name.en || 'Flanks'}) with tactical instructions.`,
      ar: `استغل نقطة الضعف الأولى (${weaknessZones[0]?.name.ar || 'الأطراف'}) بتعليمات هجومية مباشرة.`
    },
    {
      id: 't2',
      en: `Neutralize threat key player (${keyThreats[0]?.name || 'Star Striker'}) using counter-tips.`,
      ar: `تحييد خطورة النجم (${keyThreats[0]?.name || 'المهاجم الرئيسي'}) باتباع نصائح التغطية.`
    },
    {
      id: 't3',
      en: `Adopt ${recommendedCounter.formation} formation structure for optimal spacing.`,
      ar: `اعتماد تشكيلة ${recommendedCounter.formation} لتحقيق التوازن وسد الفراغات.`
    },
    {
      id: 't4',
      en: `Execute ${pressIntensity.title.en} intensity strategy during defense transitions.`,
      ar: `تطبيق استراتيجية ${pressIntensity.title.ar} عند التحول الدفاعي.`
    }
  ];

  return {
    opponentTeamName: teamName,
    overallThreatScore: Math.min(99, Math.max(50, avgOvr + 5)),
    weaknessZones,
    keyThreats,
    recommendedCounter,
    pressIntensity,
    tacticalTakeaways: takeaways
  };
}

// ── Component Props ────────────────────────────────────────────────────────

export interface OppositionScoutingReportProps {
  roster?: PlayerProfile[];
  teamName?: string;
  className?: string;
}

// ── React Component ────────────────────────────────────────────────────────

export const OppositionScoutingReport: React.FC<OppositionScoutingReportProps> = ({
  roster = DEFAULT_OPPONENT_ROSTER,
  teamName = 'Cairo Gladiators FC',
  className = ''
}) => {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [completedTakeaways, setCompletedTakeaways] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'WEAKNESS' | 'THREATS' | 'COUNTER'>('WEAKNESS');

  const report = useMemo(() => {
    return calculateOppositionScoutingReport(roster, teamName);
  }, [roster, teamName]);

  const toggleTakeaway = (id: string) => {
    setCompletedTakeaways(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSeverityBadgeClass = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MODERATE': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border border-slate-800/80 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <BrainCircuit className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold tracking-widest uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                11AI Scouting Engine
              </span>
              <span className="text-xs text-slate-400">Pre-Match Intelligence</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
              {lang === 'ar' ? `تقرير الكشافة: ${report.opponentTeamName}` : `Scouting Report: ${report.opponentTeamName}`}
            </h2>
          </div>
        </div>

        {/* Controls: Language Toggle & Threat Meter */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">
              {lang === 'ar' ? 'مستوى الخطورة:' : 'Threat Rating:'}
            </span>
            <span className="text-sm font-black text-amber-400">{report.overallThreatScore}/99</span>
          </div>

          <button
            onClick={() => setLang(prev => (prev === 'en' ? 'ar' : 'en'))}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>{lang === 'en' ? 'العربية 🇪🇬' : 'English 🇬🇧'}</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 my-6 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
        <motion.button
          whileHover={microSpringButtonProps.whileHover}
          whileTap={microSpringButtonProps.whileTap}
          transition={microSpringButtonProps.transition}
          onClick={() => setActiveTab('WEAKNESS')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'WEAKNESS' 
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{lang === 'ar' ? 'مناطق الضعف' : 'Weakness Zones'}</span>
        </motion.button>

        <motion.button
          whileHover={microSpringButtonProps.whileHover}
          whileTap={microSpringButtonProps.whileTap}
          transition={microSpringButtonProps.transition}
          onClick={() => setActiveTab('THREATS')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'THREATS' 
              ? 'bg-gradient-to-r from-amber-600 to-emerald-600 text-white shadow-lg shadow-amber-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>{lang === 'ar' ? 'أبرز التهديدات' : 'Key Threats'}</span>
        </motion.button>

        <motion.button
          whileHover={microSpringButtonProps.whileHover}
          whileTap={microSpringButtonProps.whileTap}
          transition={microSpringButtonProps.transition}
          onClick={() => setActiveTab('COUNTER')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'COUNTER' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الخطة المضادة' : 'Counter Strategy'}</span>
        </motion.button>
      </div>

      {/* ── Tab Contents ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'WEAKNESS' && (
          <motion.div
            key="weakness"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {report.weaknessZones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      {zone.name[lang]}
                    </h3>
                    <span className={`px-2.5 py-0.5 text-xs font-black rounded-full border ${getSeverityBadgeClass(zone.severity)}`}>
                      {zone.severity} ({zone.score}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${zone.score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full ${
                        zone.severity === 'CRITICAL' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        zone.severity === 'HIGH' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                        'bg-gradient-to-r from-yellow-500 to-amber-500'
                      }`}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {zone.description[lang]}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      {lang === 'ar' ? 'طريقة الاستغلال التكتيكية:' : 'Recommended Exploit:'}
                    </span>
                    <span className="text-xs text-slate-200">
                      {zone.recommendedExploit[lang]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'THREATS' && (
          <motion.div
            key="threats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {report.keyThreats.map((threat) => (
              <div
                key={threat.uid}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center font-bold text-amber-300 text-lg overflow-hidden shrink-0">
                      {threat.photoUrl ? (
                        <img src={threat.photoUrl} alt={threat.name} className="w-full h-full object-cover" />
                      ) : (
                        threat.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{threat.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 text-[10px] font-black rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {threat.position}
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          OVR {threat.overall}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">
                      {lang === 'ar' ? 'عنصر الخطورة:' : 'Danger Trait:'}
                    </span>
                    {threat.dangerTrait[lang]}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                      {lang === 'ar' ? 'نصيحة الترقيب والخنق:' : 'Counter-Marking Tip:'}
                    </span>
                    {threat.counterTip[lang]}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'COUNTER' && (
          <motion.div
            key="counter"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Formation & Press Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formation Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {report.recommendedCounter.formation}
                  </span>
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-extrabold text-white mb-2">
                  {report.recommendedCounter.name[lang]}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {report.recommendedCounter.description[lang]}
                </p>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    {lang === 'ar' ? 'التعليمات الرئيسية:' : 'Key Tactics:'}
                  </span>
                  {report.recommendedCounter.keyInstructions[lang].map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Press Mode Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    {report.pressIntensity.mode}
                  </span>
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-extrabold text-white mb-2">
                  {report.pressIntensity.title[lang]}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-400">
                    {lang === 'ar' ? 'شدة الضغط:' : 'Intensity Score:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full ${
                          i < report.pressIntensity.intensityScore 
                            ? 'bg-amber-400' 
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.pressIntensity.rationale[lang]}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Interactive Tactical Takeaways Checklist ── */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            {lang === 'ar' ? 'قائمة الاستعداد التكتيكي للمباراة' : 'Pre-Match Tactical Checklist'}
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {Object.values(completedTakeaways).filter(Boolean).length} / {report.tacticalTakeaways.length} {lang === 'ar' ? 'مكتمل' : 'Ready'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {report.tacticalTakeaways.map((item) => {
            const isChecked = !!completedTakeaways[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleTakeaway(item.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                    isChecked ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-600'
                  }`}
                />
                <span className="text-xs font-medium leading-tight">
                  {item[lang]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OppositionScoutingReport;
