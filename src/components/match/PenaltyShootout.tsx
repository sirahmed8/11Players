"use client";

import React, { useState } from "react";
import { Shield, Target, Check, X } from "lucide-react";
import toast from "react-hot-toast";

interface PenaltyShootoutProps {
  isAr: boolean;
  onSaveShootoutResult?: (result: any) => void;
}

export default function PenaltyShootout({ isAr, onSaveShootoutResult }: PenaltyShootoutProps) {
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [kicks, setKicks] = useState<Array<{ round: number; team: 'A' | 'B'; success: boolean }>>([]);

  const handleShoot = (team: 'A' | 'B', success: boolean) => {
    if (team === 'A' && success) setTeamAScore(prev => prev + 1);
    if (team === 'B' && success) setTeamBScore(prev => prev + 1);

    setKicks(prev => [...prev, { round: currentRound, team, success }]);
    if (team === 'B') setCurrentRound(prev => prev + 1);

    toast.success(success ? (isAr ? "⚽ هدف ترجيح ناجح!" : "⚽ Penalty Scored!") : (isAr ? "❌ ركلة ترجيح مهدورة!" : "❌ Penalty Missed!"));
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <h3 className="text-sm font-black text-white">
            {isAr ? "ركلات الترجيح الذكية (Penalty Shootout)" : "Penalty Shootout Controller"}
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400">
          {isAr ? `الجولة ${currentRound}` : `Round ${currentRound}`}
        </span>
      </div>

      {/* Live Shootout Score */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-between max-w-md mx-auto">
        <div className="text-center">
          <span className="block text-xs font-black text-cyan-400 mb-1">Team A</span>
          <span className="text-3xl font-black font-mono text-white">{teamAScore}</span>
        </div>
        <span className="text-xl font-black text-slate-600">:</span>
        <div className="text-center">
          <span className="block text-xs font-black text-rose-400 mb-1">Team B</span>
          <span className="text-3xl font-black font-mono text-white">{teamBScore}</span>
        </div>
      </div>

      {/* Controller Buttons */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="space-y-2 text-center">
          <span className="text-xs font-bold text-cyan-400 block">{isAr ? "تسديدة Team A" : "Team A Kick"}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleShoot('A', true)}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Goal
            </button>
            <button
              type="button"
              onClick={() => handleShoot('A', false)}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Miss
            </button>
          </div>
        </div>

        <div className="space-y-2 text-center">
          <span className="text-xs font-bold text-rose-400 block">{isAr ? "تسديدة Team B" : "Team B Kick"}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleShoot('B', true)}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Goal
            </button>
            <button
              type="button"
              onClick={() => handleShoot('B', false)}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Miss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
