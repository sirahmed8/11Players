'use client';

import React from 'react';
import { PESPosition } from '@/types';

interface PositionInfo {
  id: PESPosition;
  x: number;
  y: number;
}

const POSITIONS: PositionInfo[] = [
  { id: 'GK',  x: 200, y: 510 },
  { id: 'CB',  x: 200, y: 430 },
  { id: 'LB',  x: 70,  y: 410 },
  { id: 'RB',  x: 330, y: 410 },
  { id: 'DMF', x: 200, y: 340 },
  { id: 'CMF', x: 200, y: 270 },
  { id: 'LMF', x: 70,  y: 280 },
  { id: 'RMF', x: 330, y: 280 },
  { id: 'AMF', x: 200, y: 200 },
  { id: 'LWF', x: 85,  y: 130 },
  { id: 'RWF', x: 315, y: 130 },
  { id: 'SS',  x: 200, y: 120 },
  { id: 'CF',  x: 200, y: 55  },
];

const TIER_COLORS = {
  0: { fill: '#f59e0b', stroke: '#d97706', glow: 'rgba(245,158,11,0.5)', label: 'Primary' },
  1: { fill: '#94a3b8', stroke: '#64748b', glow: 'rgba(148,163,184,0.5)', label: 'Secondary' },
  2: { fill: '#d97706', stroke: '#b45309', glow: 'rgba(217,119,6,0.5)', label: 'Tertiary' },
} as const;

interface SVGPitchDisplayProps {
  ratings: { position: PESPosition; rating: number; tier: number }[];
}

export default function SVGPitchDisplay({ ratings }: SVGPitchDisplayProps) {
  return (
    <div className="w-full max-w-sm mx-auto relative rounded-2xl overflow-hidden border-2 border-emerald-700/40 shadow-xl shadow-emerald-900/30">
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

        {/* Center line & circle */}
        <line x1={20} y1={280} x2={380} y2={280} stroke="white" strokeWidth={1.5} opacity={0.6} />
        <circle cx={200} cy={280} r={55} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />
        <circle cx={200} cy={280} r={3} fill="white" opacity={0.6} />

        {/* Top penalty area */}
        <rect x={105} y={20} width={190} height={85} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />
        <rect x={140} y={20} width={120} height={40} fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
        <path d="M 155 105 Q 200 130 245 105" fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
        <circle cx={200} cy={78} r={2.5} fill="white" opacity={0.5} />

        {/* Bottom penalty area */}
        <rect x={105} y={455} width={190} height={85} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />
        <rect x={140} y={500} width={120} height={40} fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
        <path d="M 155 455 Q 200 430 245 455" fill="none" stroke="white" strokeWidth={1.5} opacity={0.5} />
        <circle cx={200} cy={480} r={2.5} fill="white" opacity={0.5} />

        {/* Goal areas */}
        <rect x={165} y={20} width={70} height={5} fill="white" opacity={0.3} rx={1} />
        <rect x={165} y={535} width={70} height={5} fill="white" opacity={0.3} rx={1} />

        {/* Corner arcs */}
        <path d="M 20 30 Q 30 20 30 20" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />
        <path d="M 370 20 Q 380 30 380 30" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />
        <path d="M 20 530 Q 30 540 30 540" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />
        <path d="M 370 540 Q 380 530 380 530" fill="none" stroke="white" strokeWidth={1} opacity={0.4} />

        {/* Position Markers */}
        {ratings.map((r) => {
          const pos = POSITIONS.find(p => p.id === r.position);
          if (!pos) return null;
          const tierStyle = TIER_COLORS[r.tier as 0 | 1 | 2];

          return (
            <g key={r.position}>
              {/* Glow */}
              <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke={tierStyle.fill} strokeWidth={2} opacity={0.4} />
              
              {/* Main circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={22}
                fill={tierStyle.fill}
                stroke={tierStyle.stroke}
                strokeWidth={3}
                style={{ filter: `drop-shadow(0 0 8px ${tierStyle.glow})` }}
              />

              {/* Overall Rating Text */}
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#0f172a"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {r.rating}
              </text>

              {/* Position Label Badge */}
              <rect
                x={pos.x - 16}
                y={pos.y + 26}
                width={32}
                height={16}
                rx={4}
                fill="#0f172a"
                opacity={0.85}
              />
              <text
                x={pos.x}
                y={pos.y + 37}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#e2e8f0"
              >
                {r.position}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
