'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PlayerAttributes } from '@/types';

/* ──────────────────────────────────────────────
   Translations
   ────────────────────────────────────────────── */
const translations = {
  en: {
    title: 'Player Attributes',
    overall: 'Overall Rating',
    warningHigh: 'Warning: Unrealistic ratings will be flagged for admin review',
    attackingProwess: 'Attacking Prowess',
    defensiveProwess: 'Defensive Prowess',
    speed: 'Speed',
    acceleration: 'Acceleration',
    stamina: 'Stamina',
    dribbling: 'Dribbling',
    passing: 'Passing',
    physicalContact: 'Physical Contact',
    shotPower: 'Shot Power',
    goalkeeping: 'Goalkeeping',
  },
  ar: {
    title: 'سمات اللاعب',
    overall: 'التقييم العام',
    warningHigh: 'تنبيه: التقييمات غير الواقعية ستُراجَع بواسطة المشرف',
    attackingProwess: 'القوة الهجومية',
    defensiveProwess: 'القوة الدفاعية',
    speed: 'السرعة',
    acceleration: 'التسارع',
    stamina: 'اللياقة البدنية',
    dribbling: 'المراوغة',
    passing: 'التمرير',
    physicalContact: 'القوة البدنية',
    shotPower: 'قوة التسديد',
    goalkeeping: 'حراسة المرمى',
  },
} as const;

/* ──────────────────────────────────────────────
   Attribute metadata
   ────────────────────────────────────────────── */
type AttrKey = keyof PlayerAttributes;

const ATTRIBUTE_KEYS: AttrKey[] = [
  'attackingProwess',
  'defensiveProwess',
  'speed',
  'acceleration',
  'stamina',
  'dribbling',
  'passing',
  'physicalContact',
  'shotPower',
  'goalkeeping',
];

const ATTRIBUTE_ICONS: Record<AttrKey, string> = {
  attackingProwess: '⚔️',
  defensiveProwess: '🛡️',
  speed: '💨',
  acceleration: '🚀',
  stamina: '🫁',
  dribbling: '🏃',
  passing: '🎯',
  physicalContact: '💪',
  shotPower: '🔥',
  goalkeeping: '🧤',
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
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function AttributeSliders({
  attributes,
  onChange,
  locale = 'ar',
}: AttributeSlidersProps) {
  const txt = translations[locale];

  const overallAvg = useMemo(() => {
    const vals = Object.values(attributes);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [attributes]);

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
        className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50 text-center"
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

          return (
            <motion.div
              key={key}
              className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 hover:border-emerald-600/30 transition-colors"
              whileHover={{ scale: 1.005 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{ATTRIBUTE_ICONS[key]}</span>
                  <span className="text-sm font-semibold text-slate-200">{label}</span>
                </div>
                <motion.span
                  key={value}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-lg font-black min-w-[2.5rem] text-center rounded-lg px-2 py-0.5"
                  style={{ color, backgroundColor: `${color}15` }}
                >
                  {value}
                </motion.span>
              </div>

              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min={1}
                  max={99}
                  value={value}
                  onChange={(e) => handleChange(key, parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - 1) / 98) * 100}%, rgba(71,85,105,0.4) ${((value - 1) / 98) * 100}%, rgba(71,85,105,0.4) 100%)`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom slider thumb styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid #0f172a;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          transition: box-shadow 0.2s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.7);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid #0f172a;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}
