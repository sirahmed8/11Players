"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from '@/components/ui/ThemeProvider';

interface PlayerRadarChartProps {
  stats: {
    PAC: number;
    SHO: number;
    PAS: number;
    DRI: number;
    DEF: number;
    PHY: number;
  };
  size?: number;
  color?: string;
  glow?: boolean;
}

const STATS_ORDER = ['PAC', 'SHO', 'PAS', 'PHY', 'DEF', 'DRI'];
const STATS_LABELS_AR = ['السرعة', 'التسديد', 'التمرير', 'البدني', 'الدفاع', 'المراوغة'];

export default function PlayerRadarChart({ 
  stats, 
  size = 280, 
  color = '#10b981', // emerald-500
  glow = true
}: PlayerRadarChartProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const viewBoxSize = 200;
  const center = viewBoxSize / 2;
  const maxRadius = 80;

  // Calculate polygon points
  const getPoints = (values: number[], scale: number = 1) => {
    return values.map((val, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2; // Start from top
      const r = (val / 99) * maxRadius * scale;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const statValues = useMemo(() => [
    stats.PAC, stats.SHO, stats.PAS, stats.PHY, stats.DEF, stats.DRI
  ], [stats]);

  // Background web lines
  const bgPolygons = [1, 0.8, 0.6, 0.4, 0.2].map((scale) => (
    <polygon
      key={scale}
      points={getPoints([99, 99, 99, 99, 99, 99], scale)}
      fill="none"
      stroke="currentColor"
      className="text-slate-700/40"
      strokeWidth={scale === 1 ? 1.5 : 0.5}
    />
  ));

  // Spoke lines
  const spokes = Array.from({ length: 6 }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const x = center + maxRadius * Math.cos(angle);
    const y = center + maxRadius * Math.sin(angle);
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="currentColor"
        className="text-slate-700/40"
        strokeWidth={1}
      />
    );
  });

  const labels = STATS_ORDER.map((statKey, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const radius = maxRadius + 15;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    
    // Adjust label position for better alignment
    let textAnchor: "start" | "middle" | "end" = "middle";
    if (x < center - 10) textAnchor = "end";
    else if (x > center + 10) textAnchor = "start";

    return (
      <text
        key={statKey}
        x={x}
        y={y + 4}
        textAnchor={textAnchor}
        className="text-[9px] font-black fill-slate-300 tracking-wider"
      >
        {isAr ? STATS_LABELS_AR[i] : statKey}
      </text>
    );
  });

  // Calculate actual player polygon
  const playerPoints = getPoints(statValues);

  return (
    <div className="relative flex items-center justify-center font-sans" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full overflow-visible"
      >
        {glow && (
          <defs>
            <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <linearGradient id="poly-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.2" />
            </linearGradient>
          </defs>
        )}

        {/* Background Network */}
        <g>{bgPolygons}</g>
        <g>{spokes}</g>

        {/* Player Data Polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          points={playerPoints}
          fill="url(#poly-gradient)"
          stroke={color}
          strokeWidth="2.5"
          filter={glow ? "url(#radar-glow)" : ""}
          style={{ transformOrigin: 'center' }}
        />

        {/* Data Points */}
        {statValues.map((val, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const r = (val / 99) * maxRadius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return (
            <motion.circle
              key={i}
              initial={{ opacity: 0, r: 0 }}
              animate={{ opacity: 1, r: 3.5 }}
              transition={{ delay: 0.4 + (i * 0.1), duration: 0.3 }}
              cx={x}
              cy={y}
              fill="#fff"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}

        {/* Labels */}
        <g>{labels}</g>
      </svg>
    </div>
  );
}
