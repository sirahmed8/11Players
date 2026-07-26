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

interface SVGPitchDisplayProps {
  ratings: { position: PESPosition; rating: number; tier: number }[];
}

export default function SVGPitchDisplay({ ratings }: SVGPitchDisplayProps) {
  return (
    <div className="w-full max-w-sm mx-auto relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl shadow-emerald-950/50 group">
      {/* Glossy Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-10" />

      <svg
        viewBox="0 0 400 560"
        className="w-full h-auto"
        style={{ background: 'linear-gradient(180deg, #022c22 0%, #064e3b 50%, #022c22 100%)' }}
      >
        <defs>
          {/* Gradients for Nodes */}
          <linearGradient id="primaryGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="secondaryGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="tertiaryGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* Glow Filter for Lines */}
          <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Shadow Filter for Nodes */}
          <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Tactical Pitch Grass Stripes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={0}
            y={i * 70}
            width={400}
            height={70}
            fill={i % 2 === 0 ? 'rgba(16, 185, 129, 0.04)' : 'transparent'}
          />
        ))}

        {/* Tactical Radar Grid Guidelines */}
        <line x1={0} y1={140} x2={400} y2={140} stroke="#10b981" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.25} />
        <line x1={0} y1={420} x2={400} y2={420} stroke="#10b981" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.25} />
        <line x1={133} y1={0} x2={133} y2={560} stroke="#10b981" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.25} />
        <line x1={267} y1={0} x2={267} y2={560} stroke="#10b981" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.25} />

        {/* Outer Boundary Markings */}
        <rect x={20} y={20} width={360} height={520} rx={8} fill="none" stroke="#34d399" strokeWidth={2} opacity={0.8} filter="url(#emeraldGlow)" />

        {/* Center Line & Circle */}
        <line x1={20} y1={280} x2={380} y2={280} stroke="#34d399" strokeWidth={1.8} opacity={0.75} />
        <circle cx={200} cy={280} r={55} fill="none" stroke="#34d399" strokeWidth={1.8} opacity={0.75} />
        <circle cx={200} cy={280} r={3.5} fill="#34d399" opacity={0.9} />

        {/* Top Penalty Area */}
        <rect x={105} y={20} width={190} height={85} fill="none" stroke="#34d399" strokeWidth={1.8} opacity={0.75} />
        <rect x={140} y={20} width={120} height={40} fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.65} />
        <path d="M 155 105 Q 200 130 245 105" fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.65} />
        <circle cx={200} cy={78} r={3} fill="#34d399" opacity={0.8} />

        {/* Bottom Penalty Area */}
        <rect x={105} y={455} width={190} height={85} fill="none" stroke="#34d399" strokeWidth={1.8} opacity={0.75} />
        <rect x={140} y={500} width={120} height={40} fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.65} />
        <path d="M 155 455 Q 200 430 245 455" fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.65} />
        <circle cx={200} cy={480} r={3} fill="#34d399" opacity={0.8} />

        {/* Goal Frames */}
        <rect x={165} y={15} width={70} height={5} fill="#34d399" opacity={0.6} rx={1.5} />
        <rect x={165} y={540} width={70} height={5} fill="#34d399" opacity={0.6} rx={1.5} />

        {/* Corner Arcs */}
        <path d="M 20 35 Q 35 20 35 20" fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.6} />
        <path d="M 365 20 Q 380 35 380 35" fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.6} />
        <path d="M 20 525 Q 35 540 35 540" fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.6} />
        <path d="M 365 540 Q 380 525 380 525" fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.6} />

        {/* Position Nodes */}
        {ratings.map((r) => {
          const pos = POSITIONS.find(p => p.id === r.position);
          if (!pos) return null;

          const isPrimary = r.tier === 0;
          const isSecondary = r.tier === 1;

          const fillGrad = isPrimary ? "url(#primaryGrad)" : isSecondary ? "url(#secondaryGrad)" : "url(#tertiaryGrad)";
          const ringStroke = isPrimary ? "#f59e0b" : isSecondary ? "#14b8a6" : "#f97316";

          return (
            <g key={r.position} filter="url(#nodeShadow)">
              {/* Outer Pulse Glow Ring */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isPrimary ? 28 : 24}
                fill="none"
                stroke={ringStroke}
                strokeWidth={isPrimary ? 2.5 : 1.5}
                opacity={isPrimary ? 0.6 : 0.35}
              />

              {/* Main Rating Sphere */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isPrimary ? 23 : 20}
                fill={fillGrad}
                stroke="#090d16"
                strokeWidth={2.5}
              />

              {/* Rating Text inside Node */}
              <text
                x={pos.x}
                y={pos.y + (isPrimary ? 5 : 4.5)}
                textAnchor="middle"
                fontSize={isPrimary ? "15" : "13"}
                fontWeight="900"
                fill="#090d16"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {r.rating}
              </text>

              {/* Position Label Pill */}
              <rect
                x={pos.x - (r.position.length > 2 ? 20 : 17)}
                y={pos.y + (isPrimary ? 26 : 23)}
                width={r.position.length > 2 ? 40 : 34}
                height={17}
                rx={5}
                fill="#090d16"
                stroke="#334155"
                strokeWidth={1}
              />
              <text
                x={pos.x}
                y={pos.y + (isPrimary ? 38 : 35)}
                textAnchor="middle"
                fontSize="10"
                fontWeight="900"
                fill="#ffffff"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
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
