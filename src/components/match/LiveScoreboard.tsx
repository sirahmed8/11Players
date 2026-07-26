"use client";

import React from "react";
import { Trophy } from "lucide-react";

interface LiveScoreboardProps {
  recordedStats: any;
  formation: any;
  teamA: any[];
  teamB: any[];
  isAr: boolean;
}

export default function LiveScoreboard({
  recordedStats,
  formation,
  teamA,
  teamB,
  isAr,
}: LiveScoreboardProps) {
  if (!recordedStats) return null;

  const scoreA = recordedStats?.teamAScore ?? (teamA?.reduce((sum: number, p: any) => sum + (Number(recordedStats?.[p.uid]?.goals) || 0), 0) || 0);
  const scoreB = recordedStats?.teamBScore ?? (teamB?.reduce((sum: number, p: any) => sum + (Number(recordedStats?.[p.uid]?.goals) || 0), 0) || 0);

  return (
    <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
      <div className="flex flex-col items-center md:items-start flex-1">
        <span className="text-xs font-black tracking-widest text-cyan-400 uppercase mb-1">HOME TEAM</span>
        <h3 className="text-xl font-black mb-2 text-white">Team A</h3>
        <span className="text-xs bg-slate-950 text-cyan-300 px-3 py-1 rounded-full border border-slate-800 font-mono">
          {formation?.teamA || '4-3-3'}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center bg-slate-950 px-8 py-4 rounded-2xl border border-slate-800 shadow-inner">
        <span className="text-[10px] font-black text-amber-400 uppercase mb-1">
          {isAr ? "النتيجة النهائية" : "FINAL SCORE"}
        </span>
        <div className="flex items-center gap-6 text-4xl font-black font-mono text-white">
          <span className="text-cyan-400">{scoreA}</span>
          <span className="text-slate-600 text-2xl">:</span>
          <span className="text-rose-400">{scoreB}</span>
        </div>
      </div>

      <div className="flex flex-col items-center md:items-end flex-1">
        <span className="text-xs font-black tracking-widest text-rose-400 uppercase mb-1">AWAY TEAM</span>
        <h3 className="text-xl font-black mb-2 text-white">Team B</h3>
        <span className="text-xs bg-slate-950 text-rose-300 px-3 py-1 rounded-full border border-slate-800 font-mono">
          {formation?.teamB || '4-4-2'}
        </span>
      </div>
    </div>
  );
}
