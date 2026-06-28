'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PESPosition } from '@/types';

/* ──────────────────────────────────────────────
   Translations
   ────────────────────────────────────────────── */
const t = {
  en: {
    title: 'Select Your Positions',
    subtitle: 'Tap positions on the pitch in order: Primary → Secondary → Tertiary',
    primary: 'Primary',
    secondary: 'Secondary',
    tertiary: 'Tertiary',
    reset: 'Reset Selections',
    selected: 'Selected',
  },
  ar: {
    title: 'اختر مراكزك',
    subtitle: 'اضغط على المراكز بالترتيب: أساسي ← ثانوي ← ثالث',
    primary: 'أساسي',
    secondary: 'ثانوي',
    tertiary: 'ثالث',
    reset: 'إعادة تعيين',
    selected: 'تم الاختيار',
  },
};

/* ──────────────────────────────────────────────
   Position coordinates on a 400×560 SVG viewBox
   Pitch is oriented bottom→top (GK at bottom)
   ────────────────────────────────────────────── */
interface PositionInfo {
  id: PESPosition;
  x: number;
  y: number;
  label: string;
  labelAr: string;
}

const POSITIONS: PositionInfo[] = [
  { id: 'GK',  x: 200, y: 510, label: 'GK',  labelAr: 'حر' },
  { id: 'CB',  x: 200, y: 430, label: 'CB',  labelAr: 'قلب دفاع' },
  { id: 'LB',  x: 70,  y: 410, label: 'LB',  labelAr: 'ظهير أيسر' },
  { id: 'RB',  x: 330, y: 410, label: 'RB',  labelAr: 'ظهير أيمن' },
  { id: 'DMF', x: 200, y: 340, label: 'DMF', labelAr: 'وسط دفاعي' },
  { id: 'CMF', x: 200, y: 270, label: 'CMF', labelAr: 'وسط' },
  { id: 'LMF', x: 70,  y: 280, label: 'LMF', labelAr: 'وسط أيسر' },
  { id: 'RMF', x: 330, y: 280, label: 'RMF', labelAr: 'وسط أيمن' },
  { id: 'AMF', x: 200, y: 200, label: 'AMF', labelAr: 'وسط هجومي' },
  { id: 'LWF', x: 85,  y: 130, label: 'LWF', labelAr: 'جناح أيسر' },
  { id: 'RWF', x: 315, y: 130, label: 'RWF', labelAr: 'جناح أيمن' },
  { id: 'SS',  x: 200, y: 120, label: 'SS',  labelAr: 'صانع ألعاب' },
  { id: 'CF',  x: 200, y: 55,  label: 'CF',  labelAr: 'مهاجم' },
];

const TIER_COLORS = {
  0: { fill: '#f59e0b', stroke: '#d97706', glow: 'rgba(245,158,11,0.5)', name: 'gold' },      // Primary – Gold
  1: { fill: '#94a3b8', stroke: '#64748b', glow: 'rgba(148,163,184,0.5)', name: 'silver' },    // Secondary – Silver
  2: { fill: '#d97706', stroke: '#b45309', glow: 'rgba(217,119,6,0.5)', name: 'bronze' },      // Tertiary – Bronze
} as const;

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */
interface SVGPitchPickerProps {
  onPositionsSelected: (positions: {
    primary: PESPosition;
    secondary: PESPosition;
    tertiary: PESPosition;
  }) => void;
  locale?: 'en' | 'ar';
  initialPositions?: PESPosition[];
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function SVGPitchPicker({ onPositionsSelected, locale = 'ar', initialPositions = [] }: SVGPitchPickerProps) {
  const [selections, setSelections] = useState<PESPosition[]>(initialPositions);
  const txt = t[locale];

  const handleSelect = useCallback(
    (posId: PESPosition) => {
      setSelections((prev) => {
        // Already selected? Remove it and everything after it
        const idx = prev.indexOf(posId);
        if (idx !== -1) {
          return prev.slice(0, idx);
        }
        // Max 3
        if (prev.length >= 3) return prev;
        const next = [...prev, posId];
        if (next.length === 3) {
          // Fire callback after state update via setTimeout to avoid stale closure
          setTimeout(() => {
            onPositionsSelected({
              primary: next[0],
              secondary: next[1],
              tertiary: next[2],
            });
          }, 0);
        }
        return next;
      });
    },
    [onPositionsSelected],
  );

  const reset = () => setSelections([]);

  const getSelectionTier = (posId: PESPosition): number => selections.indexOf(posId);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">{txt.title}</h2>
        <p className="text-sm text-slate-400 mt-1">{txt.subtitle}</p>
      </div>

      {/* Legend Chips */}
      <div className="flex justify-center gap-3 mb-4">
        {([0, 1, 2] as const).map((tier) => {
          const color = TIER_COLORS[tier];
          const tierLabel = tier === 0 ? txt.primary : tier === 1 ? txt.secondary : txt.tertiary;
          const selected = selections[tier];
          return (
            <div
              key={tier}
              className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-700/50"
            >
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: color.fill, boxShadow: `0 0 6px ${color.glow}` }}
              />
              <span className="text-slate-300">{tierLabel}:</span>
              <span className="text-white">{selected || '—'}</span>
            </div>
          );
        })}
      </div>

      {/* SVG Pitch */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-700/40 shadow-2xl shadow-emerald-900/30">
        <svg
          viewBox="0 0 400 560"
          className="w-full h-auto"
          style={{ background: 'linear-gradient(180deg, #15803d 0%, #166534 50%, #14532d 100%)' }}
        >
          {/* Pitch grass stripes */}
          {Array.from({ length: 8 }).map((_, i) => (
            <rect
              key={i}
              x={0}
              y={i * 70}
              width={400}
              height={70}
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}
            />
          ))}

          {/* Outer boundary */}
          <rect x={20} y={20} width={360} height={520} rx={4} fill="none" stroke="white" strokeWidth={2} opacity={0.7} />

          {/* Center line */}
          <line x1={20} y1={280} x2={380} y2={280} stroke="white" strokeWidth={1.5} opacity={0.6} />

          {/* Center circle */}
          <circle cx={200} cy={280} r={55} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />
          <circle cx={200} cy={280} r={3} fill="white" opacity={0.6} />

          {/* Top penalty area (attacking end) */}
          <rect x={105} y={20} width={190} height={85} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />
          <rect x={140} y={20} width={120} height={40} fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
          {/* Penalty arc top */}
          <path d="M 155 105 Q 200 130 245 105" fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
          <circle cx={200} cy={78} r={2.5} fill="white" opacity={0.5} />

          {/* Bottom penalty area (GK end) */}
          <rect x={105} y={455} width={190} height={85} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />
          <rect x={140} y={500} width={120} height={40} fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
          {/* Penalty arc bottom */}
          <path d="M 155 455 Q 200 430 245 455" fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
          <circle cx={200} cy={480} r={2.5} fill="white" opacity={0.5} />

          {/* Goal areas (small rectangles) */}
          <rect x={165} y={20} width={70} height={5} fill="white" opacity={0.3} rx={1} />
          <rect x={165} y={535} width={70} height={5} fill="white" opacity={0.3} rx={1} />

          {/* Corner arcs */}
          <path d="M 20 30 Q 30 20 30 20" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />
          <path d="M 370 20 Q 380 30 380 30" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />
          <path d="M 20 530 Q 30 540 30 540" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />
          <path d="M 370 540 Q 380 530 380 530" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />

          {/* Position Markers */}
          {POSITIONS.map((pos) => {
            const tier = getSelectionTier(pos.id);
            const isSelected = tier !== -1;
            const isNextPickable = selections.length < 3 && !isSelected;
            const tierStyle = isSelected ? TIER_COLORS[tier as 0 | 1 | 2] : null;

            return (
              <g
                key={pos.id}
                className="cursor-pointer"
                onClick={() => handleSelect(pos.id)}
              >
                {/* Glow ring for selected */}
                {isSelected && tierStyle && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={26}
                    fill="none"
                    stroke={tierStyle.fill}
                    strokeWidth={2}
                    opacity={0.4}
                  >
                    <animate
                      attributeName="r"
                      values="24;28;24"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0.15;0.4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Main circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 20 : 18}
                  fill={isSelected && tierStyle ? tierStyle.fill : 'rgba(30,41,59,0.85)'}
                  stroke={isSelected && tierStyle ? tierStyle.stroke : isNextPickable ? '#34d399' : '#475569'}
                  strokeWidth={isSelected ? 3 : 2}
                  style={{
                    filter: isSelected && tierStyle
                      ? `drop-shadow(0 0 8px ${tierStyle.glow})`
                      : isNextPickable
                        ? 'drop-shadow(0 0 4px rgba(52,211,153,0.3))'
                        : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />

                {/* Tier badge */}
                {isSelected && (
                  <circle
                    cx={pos.x + 14}
                    cy={pos.y - 14}
                    r={8}
                    fill="#0f172a"
                    stroke={tierStyle!.fill}
                    strokeWidth={1.5}
                  />
                )}
                {isSelected && (
                  <text
                    x={pos.x + 14}
                    y={pos.y - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={tierStyle!.fill}
                  >
                    {tier + 1}
                  </text>
                )}

                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill={isSelected ? '#0f172a' : '#e2e8f0'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {pos.id}
                </text>

                {/* Hover hitbox – larger invisible circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={24}
                  fill="transparent"
                  className="hover:cursor-pointer"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Reset Button */}
      <AnimatePresence>
        {selections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-center mt-4"
          >
            <button
              onClick={reset}
              className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              {txt.reset}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
