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
        height: "h-64 md:h-72",
        border: "border-amber-500/60",
        badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black",
        ring: "ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.8)]",
        crown: <Crown className="w-8 h-8 text-amber-400 animate-bounce" />,
        label: isAr ? "المركز الأول" : "1st Place",
        accent: "bg-amber-400",
        order: "order-1 md:order-2",
        scale: "scale-105 md:scale-110 z-30",
        glow: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0) 70%)",
        podiumGradient: "from-amber-900/40 via-amber-900/10 to-slate-900/80",
        boxShadow: "inset 0 4px 20px rgba(251,191,36,0.3), 0 -10px 40px rgba(251,191,36,0.2)",
      },
      2: {
        height: "h-52 md:h-60",
        border: "border-slate-400/60",
        badgeBg: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black",
        ring: "ring-4 ring-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.6)]",
        crown: <Medal className="w-7 h-7 text-slate-300" />,
        label: isAr ? "المركز الثاني" : "2nd Place",
        accent: "bg-slate-300",
        order: "order-2 md:order-1",
        scale: "scale-100 z-20",
        glow: "radial-gradient(circle, rgba(148,163,184,0.3) 0%, rgba(148,163,184,0) 70%)",
        podiumGradient: "from-slate-700/40 via-slate-700/10 to-slate-900/80",
        boxShadow: "inset 0 4px 20px rgba(148,163,184,0.2), 0 -10px 30px rgba(148,163,184,0.1)",
      },
      3: {
        height: "h-44 md:h-48",
        border: "border-orange-700/60",
        badgeBg: "bg-gradient-to-r from-orange-600 to-orange-700 text-white font-black",
        ring: "ring-4 ring-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.6)]",
        crown: <Medal className="w-6 h-6 text-orange-600" />,
        label: isAr ? "المركز الثالث" : "3rd Place",
        accent: "bg-orange-600",
        order: "order-3 md:order-3",
        scale: "scale-95 z-10",
        glow: "radial-gradient(circle, rgba(234,88,12,0.3) 0%, rgba(234,88,12,0) 70%)",
        podiumGradient: "from-orange-900/40 via-orange-900/10 to-slate-900/80",
        boxShadow: "inset 0 4px 20px rgba(234,88,12,0.2), 0 -10px 30px rgba(234,88,12,0.1)",
      },
    }[rank];

    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
        onClick={() => onSelectPlayer && onSelectPlayer(player)}
        className={`relative flex flex-col items-center cursor-pointer group ${config.order} ${config.scale} w-full max-w-[140px] md:max-w-[180px]`}
      >
        {/* Animated Glowing Background Aura */}
        <motion.div 
          className="absolute -inset-10 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: config.glow }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Crown / Star icon */}
        <div className="absolute -top-10 flex flex-col items-center">
          {config.crown}
          {rank === 1 && (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -z-10 opacity-30"
            >
              <Star className="w-16 h-16 text-amber-500 blur-md" />
            </motion.div>
          )}
        </div>

        {/* Avatar */}
        <div className="relative mb-3 group-hover:-translate-y-2 transition-transform duration-300">
          <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full ${config.ring} overflow-hidden bg-slate-900 mx-auto transition-shadow duration-300`}>
            <Image
              src={player.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + player.uid}
              alt={player.cardName || player.fullName}
              fill
              sizes="(max-width: 768px) 80px, 112px"
              className="object-cover"
            />
          </div>

          {/* OVR Badge floating on avatar */}
          <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-emerald-400 font-black text-sm md:text-base shadow-2xl z-10 group-hover:scale-110 transition-transform">
            {ovr}
          </div>
        </div>

        {/* Player Info Box */}
        <div className="text-center mb-3 relative z-20">
          <h3 className="font-black text-sm md:text-lg text-white group-hover:text-amber-400 transition-colors truncate max-w-[130px] md:max-w-[180px] drop-shadow-md">
            {player.cardName || player.fullName}
          </h3>
          <p className="text-[11px] md:text-xs font-bold text-slate-300 uppercase tracking-wider drop-shadow-md">
            {player.primaryPosition}
          </p>
        </div>

        {/* 3D Premium Podium Base */}
        <div
          className={`w-full ${config.height} mt-2 rounded-t-2xl border-t-2 border-x border-slate-700 bg-gradient-to-b ${config.podiumGradient} relative overflow-hidden flex flex-col items-center pt-5 transition-all duration-300 group-hover:brightness-110 backdrop-blur-xl`}
          style={{ boxShadow: config.boxShadow }}
        >
          {/* 3D Glossy Top Edge Highlight */}
          <div className="absolute top-0 inset-x-0 h-1 bg-white/20" />
          <div className="absolute top-1 inset-x-0 h-8 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* Colored Accent Line */}
          <div className={`absolute top-0 w-full h-px ${config.accent} opacity-80`} />
          
          <span className={`text-[10px] md:text-xs uppercase tracking-widest font-black px-4 py-1.5 rounded-full ${config.badgeBg} shadow-xl transform group-hover:scale-105 transition-transform`}>
            {config.label}
          </span>
          <div className="flex-1" />

          {/* Rank Number */}
          <div className="text-center space-y-1 pb-4">
            <span className="text-4xl md:text-5xl font-black text-white/90 leading-none block drop-shadow-2xl">
              #{rank}
            </span>
            <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest block">
              {isAr ? "الترتيب الكلي" : "Global Rank"}
            </span>
          </div>

          <div className="w-full text-center py-2.5 bg-slate-950/80 border-t border-slate-800 text-xs md:text-sm font-black text-emerald-400 shadow-inner backdrop-blur-md">
            {ovr} OVR
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="mb-16 relative">
      <div className="flex items-center justify-center gap-3 mb-8 text-center relative z-20">
        <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-3xl font-black text-white drop-shadow-lg">
          {isAr ? "منصة أساطير النخبة" : "Global Top 3 Podium"}
        </h2>
      </div>

      <div className="flex flex-row items-end justify-center gap-2 md:gap-6 max-w-5xl mx-auto px-2 pt-12">
        {renderPodiumCard(second, 2, 0.1)}
        {renderPodiumCard(first, 1, 0.2)}
        {renderPodiumCard(third, 3, 0.3)}
      </div>
    </section>
  );
}
