"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";

interface Top3PodiumProps {
  players: PlayerProfile[];
  isAr: boolean;
  onSelectPlayer?: (player: PlayerProfile) => void;
}

export default function Top3Podium({ players, isAr, onSelectPlayer }: Top3PodiumProps) {
  if (!players || players.length === 0) return null;

  // Top 3 players sorted by OVR
  const sorted = [...players].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  const renderPodiumCard = (
    player: PlayerProfile | undefined,
    rank: 1 | 2 | 3,
    delay: number
  ) => {
    if (!player) return null;
    const ovr = getPlayerOverall(player);

    const config = {
      1: {
        height: "h-52 md:h-60",
        border: "border-amber-500/80 shadow-amber-500/20",
        badgeBg: "bg-amber-500 text-slate-950 font-black",
        ring: "ring-4 ring-amber-400 shadow-amber-500/50",
        crown: <Crown className="w-7 h-7 text-amber-400 animate-bounce" />,
        label: isAr ? "المركز الأول" : "1st Place",
        accent: "bg-amber-400",
        order: "order-1 md:order-2",
        scale: "scale-105 z-10",
      },
      2: {
        height: "h-44 md:h-52",
        border: "border-slate-600 shadow-slate-400/10",
        badgeBg: "bg-slate-400 text-slate-950 font-black",
        ring: "ring-4 ring-slate-400 shadow-slate-400/40",
        crown: <Medal className="w-6 h-6 text-slate-300" />,
        label: isAr ? "المركز الثاني" : "2nd Place",
        accent: "bg-slate-300",
        order: "order-2 md:order-1",
        scale: "scale-100",
      },
      3: {
        height: "h-40 md:h-48",
        border: "border-orange-500/70 shadow-orange-500/10",
        badgeBg: "bg-orange-500 text-white font-black",
        ring: "ring-4 ring-orange-500 shadow-orange-600/40",
        crown: <Trophy className="w-5 h-5 text-orange-400" />,
        label: isAr ? "المركز الثالث" : "3rd Place",
        accent: "bg-orange-500",
        order: "order-3 md:order-3",
        scale: "scale-95",
      },
    }[rank];

    return (
      <motion.div
        key={player.uid || rank}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => onSelectPlayer?.(player)}
        className={`relative flex flex-col items-center cursor-pointer group ${config.order} ${config.scale} flex-1 max-w-[260px]`}
      >
        {/* Crown / Trophy icon floating above */}
        <div className="mb-2">{config.crown}</div>

        {/* Player Avatar with Rank Ring */}
        <div className="relative mb-3">
          <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ${config.ring} transition-transform group-hover:scale-105 bg-slate-950`}>
            {player.photoUrl || player.googlePic ? (
              <Image
                src={(player.photoUrl || player.googlePic)!}
                alt={player.cardName || player.fullName}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-300">
                {(player.cardName || player.fullName || "?").charAt(0)}
              </div>
            )}
          </div>

          {/* OVR Badge floating on avatar */}
          <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 font-black text-xs shadow-lg">
            {ovr}
          </div>
        </div>

        {/* Player Info Box */}
        <div className="text-center mb-3">
          <h3 className="font-black text-sm md:text-base text-white group-hover:text-amber-400 transition-colors truncate max-w-[180px]">
            {player.cardName || player.fullName}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {player.primaryPosition}
          </p>
        </div>

        {/* Podium Base */}
        <div className={`w-full ${config.height} rounded-t-3xl bg-slate-900 border ${config.border} p-4 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden`}>
          <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full ${config.badgeBg} shadow-md`}>
            {config.label}
          </span>

          <div className="text-center space-y-1">
            <span className="text-3xl font-black text-white leading-none block">
              #{rank}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {isAr ? "الترتيب الكلي" : "Global Rank"}
            </span>
          </div>

          <div className="w-full text-center py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-emerald-400">
            {ovr} OVR
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-center gap-2 mb-6 text-center">
        <Trophy className="w-6 h-6 text-amber-400" />
        <h2 className="text-2xl font-black text-white">
          {isAr ? "منصة أساطير النخبة" : "Global Top 3 Podium"}
        </h2>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 max-w-4xl mx-auto px-4 pt-4">
        {renderPodiumCard(second, 2, 0.1)}
        {renderPodiumCard(first, 1, 0.2)}
        {renderPodiumCard(third, 3, 0.3)}
      </div>
    </section>
  );
}
