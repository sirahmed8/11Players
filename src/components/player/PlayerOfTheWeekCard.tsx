"use client";

import React from "react";
import Image from "next/image";
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
    <div className="bg-slate-900 rounded-3xl p-6 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-5 z-10">
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border-2 border-amber-400 shadow-xl overflow-hidden flex items-center justify-center text-3xl font-black text-amber-400">
            {photo ? (
              <Image src={photo} alt={player.fullName} className="w-full h-full object-cover" width={96} height={96} />
            ) : (
              player.fullName?.slice(0, 2).toUpperCase() || '👑'
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] shadow">
            {ovr} OVR
          </div>
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-950 text-amber-400 border border-amber-500/40">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>{isAr ? "لاعب الأسبوع (Player of the Week)" : "Player of the Week"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {player.cardName || player.fullName}
          </h3>
          <p className="text-xs font-semibold text-slate-400">
            {player.primaryPosition || "CMF"} • {player.playStyle ? player.playStyle.replace(/_/g, " ") : "Box-to-Box"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800 shrink-0 z-10">
        <div className="text-center">
          <span className="block text-[9px] font-black uppercase text-slate-400">{isAr ? "الأهداف" : "Goals"}</span>
          <span className="text-xl font-black font-mono text-emerald-400">{player.stats?.goals || 0}</span>
        </div>
        <div className="w-px h-6 bg-slate-800" />
        <div className="text-center">
          <span className="block text-[9px] font-black uppercase text-slate-400">{isAr ? "الصناعة" : "Assists"}</span>
          <span className="text-xl font-black font-mono text-cyan-400">{player.stats?.assists || 0}</span>
        </div>
        <div className="w-px h-6 bg-slate-800" />
        <div className="text-center">
          <span className="block text-[9px] font-black uppercase text-slate-400">{isAr ? "رجل المباراة" : "MOTMs"}</span>
          <span className="text-xl font-black font-mono text-amber-400">{player.stats?.mvp || 0}</span>
        </div>
      </div>

    </div>
  );
}
