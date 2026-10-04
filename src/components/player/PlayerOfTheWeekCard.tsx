"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Star } from "lucide-react";
import { PlayerProfile } from "@/types";

interface PlayerOfTheWeekCardProps {
  player: PlayerProfile | null;
  isAr: boolean;
}

export default function PlayerOfTheWeekCard({ player, isAr }: PlayerOfTheWeekCardProps) {
  if (!player) return null;

  const photo = player.photoUrl || player.googlePic || "";
  const ovr = player.overallRating || 85;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border-2 border-amber-500/40 dark:border-amber-500/50 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-5 z-10 w-full md:w-auto">
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-50 dark:bg-slate-950 border-2 border-amber-400 shadow-lg overflow-hidden flex items-center justify-center text-3xl font-black text-amber-500 dark:text-amber-400">
            {photo ? (
              <Image src={photo} alt={player.fullName} className="w-full h-full object-cover" width={96} height={96} />
            ) : (
              player.fullName?.slice(0, 2).toUpperCase() || '👑'
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[11px] shadow-md">
            {ovr} OVR
          </div>
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 dark:bg-slate-950 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>{isAr ? "لاعب الأسبوع (Player of the Week)" : "Player of the Week"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
            {player.cardName || player.fullName}
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {player.primaryPosition || "CMF"} • {player.playStyle ? player.playStyle.replace(/_/g, " ") : "Box-to-Box"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 z-10 w-full sm:w-auto justify-around sm:justify-start">
        <div className="text-center">
          <span className="block text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{isAr ? "الأهداف" : "Goals"}</span>
          <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{player.stats?.goals || 0}</span>
        </div>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
        <div className="text-center">
          <span className="block text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{isAr ? "الصناعة" : "Assists"}</span>
          <span className="text-xl font-black font-mono text-cyan-600 dark:text-cyan-400">{player.stats?.assists || 0}</span>
        </div>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
        <div className="text-center">
          <span className="block text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{isAr ? "رجل المباراة" : "MOTMs"}</span>
          <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{player.stats?.mvp || 0}</span>
        </div>
      </div>

    </motion.div>
  );
}
