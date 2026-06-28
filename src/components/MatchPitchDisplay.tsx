'use client';

import React from 'react';
import { PESPosition } from '@/types';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

interface AssignedPlayer {
  uid: string;
  cardName: string;
  photoUrl?: string;
  primaryPosition: PESPosition;
  attributes: any;
  playStyle?: string;
  assignedPosition: PESPosition;
  psi: number;
}

interface MatchPitchDisplayProps {
  team: AssignedPlayer[];
  teamName: string;
  color: 'blue' | 'red';
  isReversed?: boolean; // If true, rendering for the opposing team (flipped layout)
  onPlayerClick?: (player: AssignedPlayer) => void;
}

const POSITIONS: Record<PESPosition, { x: number; y: number }> = {
  GK: { x: 50, y: 90 },
  CB: { x: 50, y: 75 },
  LB: { x: 15, y: 70 },
  RB: { x: 85, y: 70 },
  DMF: { x: 50, y: 60 },
  CMF: { x: 50, y: 45 },
  LMF: { x: 15, y: 45 },
  RMF: { x: 85, y: 45 },
  AMF: { x: 50, y: 30 },
  LWF: { x: 20, y: 20 },
  RWF: { x: 80, y: 20 },
  SS: { x: 50, y: 18 },
  CF: { x: 50, y: 10 },
};

export default function MatchPitchDisplay({ team, teamName, color, isReversed, onPlayerClick }: MatchPitchDisplayProps) {
  const theme = color === 'blue' ? 'from-blue-600 to-cyan-600 border-blue-400' : 'from-red-600 to-orange-600 border-red-400';
  
  // Group players by assigned position to handle overlaps
  const byPos: Record<string, AssignedPlayer[]> = {};
  team.forEach((p) => {
    if (!byPos[p.assignedPosition]) byPos[p.assignedPosition] = [];
    byPos[p.assignedPosition].push(p);
  });

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[2/3] bg-emerald-800 rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-inner">
      {/* Pitch Lines */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 w-full h-1/2 border-b-2 border-white/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/50" />
        {/* Penalty Areas */}
        <div className={`absolute left-1/2 -translate-x-1/2 w-1/2 h-[15%] border-x-2 border-white/50 ${isReversed ? 'bottom-0 border-t-2' : 'top-0 border-b-2'}`} />
        <div className={`absolute left-1/2 -translate-x-1/2 w-1/4 h-[5%] border-x-2 border-white/50 ${isReversed ? 'bottom-0 border-t-2' : 'top-0 border-b-2'}`} />
        {/* Goal Areas */}
        <div className={`absolute left-1/2 -translate-x-1/2 w-1/5 h-2 bg-white/30 ${isReversed ? 'bottom-0' : 'top-0'}`} />
      </div>

      {/* Players */}
      {team.map((p) => {
        const basePos = POSITIONS[p.assignedPosition];
        if (!basePos) return null;
        
        const group = byPos[p.assignedPosition];
        const count = group.length;
        const index = group.indexOf(p);
        
        let actualX = basePos.x;
        if (count > 1) {
          const spread = 20; // 20% gap between players sharing the same position role
          const totalWidth = spread * (count - 1);
          const startX = basePos.x - totalWidth / 2;
          actualX = startX + index * spread;
        }

        // Adjust Y based on reversed
        const top = isReversed ? 100 - basePos.y : basePos.y;
        
        const overall = calculateRealisticOverall(p.attributes, p.primaryPosition, p.playStyle || '');

        return (
          <button
            key={p.uid}
            onClick={() => onPlayerClick?.(p)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-transform hover:scale-110 z-10"
            style={{ left: `${actualX}%`, top: `${top}%` }}
          >
            {/* Player Avatar */}
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 overflow-hidden flex items-center justify-center bg-gradient-to-br shadow-lg ${theme}`}>
              {p.photoUrl ? (
                <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-white text-sm">{overall}</span>
              )}
            </div>
            {/* Label */}
            <div className="mt-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] md:text-xs text-white font-bold whitespace-nowrap border border-white/10 shadow-sm">
              {p.cardName}
            </div>
            {/* Position Badge */}
            <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[9px] font-black px-1 rounded border border-slate-700 shadow-sm">
              {p.assignedPosition}
            </div>
          </button>
        );
      })}
    </div>
  );
}
