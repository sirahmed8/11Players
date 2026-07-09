'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PlayerAttributes, PESPosition } from '@/types';
import { useLocale } from '@/components/ThemeProvider';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

/* ──────────────────────────────────────────────
   Translations
   ────────────────────────────────────────────── */
const translations = {
  en: {
    title: 'Player Attributes',
    overall: 'Overall Rating',
    warningHigh: 'Warning: Unrealistic ratings will be flagged for admin review',
    offensiveAwareness: 'Offensive Awareness',
    ballControl: 'Ball Control',
    dribbling: 'Dribbling',
    lowPass: 'Low Pass',
    loftedPass: 'Lofted Pass',
    finishing: 'Finishing',
    heading: 'Heading',
    speed: 'Speed',
    acceleration: 'Acceleration',
    kickingPower: 'Kicking Power',
    jump: 'Jump',
    physicalContact: 'Physical Contact',
    balance: 'Balance',
    stamina: 'Stamina',
    defensiveAwareness: 'Defensive Awareness',
    ballWinning: 'Ball Winning',
    aggression: 'Aggression',
    gkAwareness: 'GK Awareness',
    gkCatching: 'GK Catching',
    gkClearing: 'GK Clearing',
    gkReflexes: 'GK Reflexes',
    gkReach: 'GK Reach',
  },
  ar: {
    title: 'سمات اللاعب',
    overall: 'التقييم العام',
    warningHigh: 'تنبيه: التقييمات غير الواقعية ستُراجَع بواسطة المشرف',
    offensiveAwareness: 'الوعي الهجومي',
    ballControl: 'التحكم بالكرة',
    dribbling: 'المراوغة',
    lowPass: 'التمرير القصير',
    loftedPass: 'التمرير الطويل',
    finishing: 'الإنهاء',
    heading: 'الرأسيات',
    speed: 'السرعة',
    acceleration: 'التسارع',
    kickingPower: 'قوة التسديد',
    jump: 'القفز',
    physicalContact: 'القوة البدنية',
    balance: 'التوازن',
    stamina: 'اللياقة البدنية',
    defensiveAwareness: 'الوعي الدفاعي',
    ballWinning: 'افتكاك الكرة',
    aggression: 'الشراسة',
    gkAwareness: 'وعي حارس المرمى',
    gkCatching: 'الإمساك بالكرة',
    gkClearing: 'إبعاد الكرة',
    gkReflexes: 'ردود الفعل',
    gkReach: 'التغطية والوصول',
  },
} as const;

const descriptions = {
  en: {
    offensiveAwareness: 'Attacking awareness and positioning.',
    ballControl: 'Ability to control the ball upon receiving it.',
    dribbling: 'Agility and ball control while moving.',
    lowPass: 'Accuracy of passes along the ground.',
    loftedPass: 'Accuracy of passes in the air.',
    finishing: 'Accuracy of shots on target.',
    heading: 'Accuracy and power of headers.',
    speed: 'Top running speed without the ball.',
    acceleration: 'How quickly the player reaches top speed.',
    kickingPower: 'Power behind shots and long passes.',
    jump: 'Ability to jump high.',
    physicalContact: 'Strength to hold off opponents.',
    balance: 'Ability to stay upright under pressure.',
    stamina: 'Fitness to maintain performance throughout the match.',
    defensiveAwareness: 'Defensive positioning and reading the game.',
    ballWinning: 'Ability to tackle and win the ball back.',
    aggression: 'Aggression in challenging for the ball.',
    gkAwareness: 'Goalkeeper positioning and reading the game.',
    gkCatching: 'Ability to catch the ball securely.',
    gkClearing: 'Ability to clear the ball out of danger.',
    gkReflexes: 'Quick reactions to make saves.',
    gkReach: 'Ability to reach distant shots.',
  },
  ar: {
    offensiveAwareness: 'التمركز والوعي الهجومي.',
    ballControl: 'القدرة على السيطرة على الكرة عند استلامها.',
    dribbling: 'الرشاقة والتحكم بالكرة أثناء الحركة.',
    lowPass: 'دقة التمريرات الأرضية.',
    loftedPass: 'دقة التمريرات العالية.',
    finishing: 'دقة التسديد على المرمى.',
    heading: 'دقة وقوة الضربات الرأسية.',
    speed: 'السرعة القصوى بدون كرة.',
    acceleration: 'مدى سرعة الوصول للسرعة القصوى.',
    kickingPower: 'قوة التسديدات والتمريرات الطويلة.',
    jump: 'القدرة على القفز عاليًا.',
    physicalContact: 'القوة البدنية للاحتفاظ بالكرة.',
    balance: 'القدرة على الحفاظ على التوازن تحت الضغط.',
    stamina: 'اللياقة للحفاظ على الأداء طوال المباراة.',
    defensiveAwareness: 'التمركز والوعي الدفاعي وقراءة اللعب.',
    ballWinning: 'القدرة على قطع الكرة وافتكاكها.',
    aggression: 'الشراسة في الضغط وافتكاك الكرة.',
    gkAwareness: 'تمركز حارس المرمى وقراءة اللعب.',
    gkCatching: 'القدرة على الإمساك بالكرة بثبات.',
    gkClearing: 'القدرة على إبعاد الكرة عن منطقة الخطر.',
    gkReflexes: 'سرعة رد الفعل في التصديات.',
    gkReach: 'القدرة على الوصول للتسديدات البعيدة.',
  },
} as const;

/* ──────────────────────────────────────────────
   Attribute metadata
   ────────────────────────────────────────────── */
type AttrKey = keyof PlayerAttributes;

const ATTRIBUTE_KEYS: AttrKey[] = [
  'offensiveAwareness', 'ballControl', 'dribbling', 'lowPass', 'loftedPass',
  'finishing', 'heading', 'speed', 'acceleration', 'kickingPower',
  'jump', 'physicalContact', 'balance', 'stamina',
  'defensiveAwareness', 'ballWinning', 'aggression',
  'gkAwareness', 'gkCatching', 'gkClearing', 'gkReflexes', 'gkReach'
];

import { 
  Brain, CircleDot, Wand2, Footprints, Plane, Target, 
  Wind, Rocket, Zap, ArrowUpCircle, Dumbbell, Scale, HeartPulse, 
  Shield, Axe, Hand
} from 'lucide-react';

const ATTRIBUTE_ICONS: Record<AttrKey, React.ReactNode> = {
  offensiveAwareness: <Brain className="w-4 h-4 text-emerald-500" />,
  ballControl: <CircleDot className="w-4 h-4 text-emerald-500" />,
  dribbling: <Wand2 className="w-4 h-4 text-emerald-500" />,
  lowPass: <Footprints className="w-4 h-4 text-amber-500" />,
  loftedPass: <Plane className="w-4 h-4 text-amber-500" />,
  finishing: <Target className="w-4 h-4 text-red-500" />,
  heading: <ArrowUpCircle className="w-4 h-4 text-amber-500" />,
  speed: <Wind className="w-4 h-4 text-blue-500" />,
  acceleration: <Rocket className="w-4 h-4 text-blue-500" />,
  kickingPower: <Zap className="w-4 h-4 text-red-500" />,
  jump: <ArrowUpCircle className="w-4 h-4 text-emerald-500" />,
  physicalContact: <Dumbbell className="w-4 h-4 text-emerald-500" />,
  balance: <Scale className="w-4 h-4 text-emerald-500" />,
  stamina: <HeartPulse className="w-4 h-4 text-emerald-500" />,
  defensiveAwareness: <Shield className="w-4 h-4 text-blue-500" />,
  ballWinning: <Axe className="w-4 h-4 text-blue-500" />,
  aggression: <Axe className="w-4 h-4 text-red-500" />,
  gkAwareness: <Brain className="w-4 h-4 text-amber-500" />,
  gkCatching: <Hand className="w-4 h-4 text-amber-500" />,
  gkClearing: <Footprints className="w-4 h-4 text-amber-500" />,
  gkReflexes: <Zap className="w-4 h-4 text-amber-500" />,
  gkReach: <Target className="w-4 h-4 text-amber-500" />,
};

/* ──────────────────────────────────────────────
   Color helpers
   ────────────────────────────────────────────── */
function getRatingColor(value: number): string {
  if (value >= 90) return '#ef4444'; // red
  if (value >= 80) return '#f59e0b'; // amber
  if (value >= 65) return '#10b981'; // emerald
  if (value >= 50) return '#3b82f6'; // blue
  return '#64748b'; // slate
}

function getOverallGrade(avg: number): { label: string; color: string } {
  if (avg >= 90) return { label: 'WORLD CLASS', color: '#ef4444' };
  if (avg >= 80) return { label: 'EXCELLENT', color: '#f59e0b' };
  if (avg >= 70) return { label: 'GOOD', color: '#10b981' };
  if (avg >= 60) return { label: 'AVERAGE', color: '#3b82f6' };
  return { label: 'DEVELOPING', color: '#64748b' };
}

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */
interface AttributeSlidersProps {
  attributes: PlayerAttributes;
  onChange: (attrs: PlayerAttributes) => void;
  locale?: 'en' | 'ar';
  primaryPosition?: PESPosition | null;
  playStyle?: string;
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default React.memo(function AttributeSliders({
  attributes,
  onChange,
  locale = 'ar',
  primaryPosition,
  playStyle,
}: AttributeSlidersProps) {
  const txt = translations[locale];
  const desc = descriptions[locale];

  const overallAvg = useMemo(() => {
    if (primaryPosition) {
      return calculateRealisticOverall(attributes, primaryPosition, playStyle || '');
    }
    // Fallback if no position selected yet
    const vals = Object.values(attributes);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [attributes, primaryPosition, playStyle]);

  const showWarning = overallAvg > 90;
  const grade = getOverallGrade(overallAvg);

  const handleChange = (key: AttrKey, value: number) => {
    onChange({ ...attributes, [key]: value });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      {/* Overall Rating Card */}
      <motion.div
        layout
        className="bg-slate-100 dark:bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 text-center"
      >
        <p className="text-sm text-slate-400 font-medium mb-1">{txt.overall}</p>
        <motion.div
          key={overallAvg}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black"
          style={{ color: grade.color }}
        >
          {overallAvg}
        </motion.div>
        <p className="text-xs font-bold tracking-widest mt-1" style={{ color: grade.color }}>
          {grade.label}
        </p>
      </motion.div>

      {/* Warning Banner */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3"
        >
          <span className="text-amber-400 text-xl">⚠️</span>
          <p className="text-amber-300 text-sm font-medium">{txt.warningHigh}</p>
        </motion.div>
      )}

      {/* Sliders */}
      <div className="space-y-3">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = attributes[key];
          const color = getRatingColor(value);
          const label = txt[key];
          const description = desc[key];

          return (
            <motion.div
              key={key}
              className="bg-slate-100 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700/30 hover:border-emerald-500/40 dark:hover:border-emerald-600/30 transition-colors"
              whileHover={{ scale: 1.005 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ATTRIBUTE_ICONS[key]}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 max-w-[200px] sm:max-w-[300px]">
                    {description}
                  </span>
                </div>
                <motion.span
                  key={value}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-lg font-black min-w-[2.5rem] text-center rounded-lg px-2 py-0.5 h-min"
                  style={{ color, backgroundColor: `${color}15` }}
                >
                  {value}
                </motion.span>
              </div>

              {/* Slider - Forced LTR to fix rendering issues across languages */}
              <div className="relative mt-2">
                <input
                  type="range"
                  min={40}
                  max={99}
                  value={value}
                  onChange={(e) => handleChange(key, parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
                  dir="ltr"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - 40) / 59) * 100}%, rgba(71,85,105,0.4) ${((value - 40) / 59) * 100}%, rgba(71,85,105,0.4) 100%)`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom slider thumb & track styles */}
      <style jsx>{`
        .slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
          border: none;
        }
        /* Webkit (Chrome, Safari, Edge) */
        .slider-thumb::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 999px;
        }
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid #065f46;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
          margin-top: -7px;
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.8);
          transform: scale(1.15);
        }
        /* Firefox */
        .slider-thumb::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(100, 116, 139, 0.3);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid #065f46;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
        }
        .slider-thumb::-moz-range-progress {
          background: #10b981;
          height: 8px;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
});
