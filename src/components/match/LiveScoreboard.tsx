"use client";

import React, { useEffect } from "react";
import { Crown, Sparkles, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { soundFx } from "@/lib/soundEffects";

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

  const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "DRAW";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-slate-900/90 rounded-3xl p-6 lg:p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 backdrop-blur-xl relative overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Team A Header */}
      <div className="flex flex-col items-center md:items-start flex-1 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">
            {isAr ? "الفريق الأول" : "HOME TEAM"}
          </span>
          {winner === "A" && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Crown className="w-3 h-3 text-amber-400" />
              {isAr ? "الفائز" : "WINNER"}
            </span>
          )}
        </div>
        <h3 className="text-2xl font-black text-white flex items-center gap-2">
          Team A
        </h3>
        <span className="text-xs bg-slate-950/80 text-cyan-300 px-3 py-1 rounded-full border border-slate-800 font-mono mt-1">
          {formation?.teamA || '4-3-3'}
        </span>
      </div>

      {/* Scoreboard Center Badge */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        onClick={() => soundFx.playGoal()}
        className="flex flex-col items-center justify-center bg-slate-950/90 px-8 py-4 rounded-2xl border border-slate-800 shadow-inner relative z-10 cursor-pointer group"
      >
        <span className="text-[10px] font-black text-amber-400 uppercase mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {isAr ? "النتيجة النهائية" : "MATCH SCORE"}
        </span>
        <div className="flex items-center gap-6 text-4xl font-black font-mono text-white">
          <span className="text-cyan-400 group-hover:scale-110 transition-transform">{scoreA}</span>
          <span className="text-slate-600 text-2xl">:</span>
          <span className="text-rose-400 group-hover:scale-110 transition-transform">{scoreB}</span>
        </div>
      </motion.div>

      {/* Team B Header */}
      <div className="flex flex-col items-center md:items-end flex-1 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          {winner === "B" && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Crown className="w-3 h-3 text-amber-400" />
              {isAr ? "الفائز" : "WINNER"}
            </span>
          )}
          <span className="text-xs font-black tracking-widest text-rose-400 uppercase">
            {isAr ? "الفريق الثاني" : "AWAY TEAM"}
          </span>
        </div>
        <h3 className="text-2xl font-black text-white flex items-center gap-2">
          Team B
        </h3>
        <span className="text-xs bg-slate-950/80 text-rose-300 px-3 py-1 rounded-full border border-slate-800 font-mono mt-1">
          {formation?.teamB || '4-4-2'}
        </span>
      </div>
    </motion.div>
  );
}
