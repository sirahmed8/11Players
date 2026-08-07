"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { PlayerAttributes, PlayerProfile } from "@/types";
import { Crown, Sparkles, ShieldCheck, Star, Zap, User, Award, Flame } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";

export type FutCardTier = "Gold" | "Pitch Emerald" | "Icon" | "Elite Diamond" | "Retro Legend";
export type CardBorderStyle = "gold_neon" | "emerald_sparkle" | "diamond_prism" | "obsidian_edge" | "retro_gold";

export interface FutAttributes {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

/**
 * Calculates 6 FUT card attributes from granular player attributes.
 */
export function calculateFutAttributes(attributes?: Partial<PlayerAttributes>): FutAttributes {
  if (!attributes) {
    return { pac: 75, sho: 70, pas: 72, dri: 74, def: 68, phy: 71 };
  }

  const speed = attributes.speed ?? 75;
  const accel = attributes.acceleration ?? 75;
  const finishing = attributes.finishing ?? 70;
  const kickPower = attributes.kickingPower ?? 70;
  const lowPass = attributes.lowPass ?? 72;
  const loftedPass = attributes.loftedPass ?? 72;
  const dribbling = attributes.dribbling ?? 74;
  const ballControl = attributes.ballControl ?? 74;
  const defAware = attributes.defensiveAwareness ?? 68;
  const ballWin = attributes.ballWinning ?? 68;
  const stamina = attributes.stamina ?? 71;
  const physContact = attributes.physicalContact ?? 71;

  return {
    pac: Math.round((speed + accel) / 2),
    sho: Math.round((finishing + kickPower) / 2),
    pas: Math.round((lowPass + loftedPass) / 2),
    dri: Math.round((dribbling + ballControl) / 2),
    def: Math.round((defAware + ballWin) / 2),
    phy: Math.round((stamina + physContact) / 2),
  };
}

/**
 * Calculates weighted FUT overall rating.
 */
export function calculateFutOvr(attributes?: Partial<PlayerAttributes>): number {
  const fut = calculateFutAttributes(attributes);
  const avg = (fut.pac + fut.sho + fut.pas + fut.dri + fut.def + fut.phy) / 6;
  return Math.min(99, Math.max(40, Math.round(avg)));
}

/**
 * Returns tier-specific visual styling properties.
 */
export function getFutTierConfig(tier: FutCardTier = "Gold", rating: number = 85) {
  switch (tier) {
    case "Pitch Emerald":
      return {
        name: "Pitch Emerald",
        bgGradient: "bg-gradient-to-b from-emerald-950 via-teal-900 to-slate-950",
        borderDefault: "border-emerald-400/80 shadow-emerald-500/30",
        headerBg: "bg-emerald-800/80 text-emerald-200",
        statBg: "bg-emerald-950/60 border-emerald-500/30 text-emerald-100",
        glowColor: "rgba(16, 185, 129, 0.4)",
        foilClass: "from-emerald-400/20 via-teal-300/10 to-transparent",
        badgeIcon: Sparkles,
        accentColor: "#10b981",
      };
    case "Icon":
      return {
        name: "Icon",
        bgGradient: "bg-gradient-to-b from-amber-100/90 via-slate-900 to-amber-950",
        borderDefault: "border-amber-300/90 shadow-amber-300/40",
        headerBg: "bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 text-slate-950 font-bold",
        statBg: "bg-slate-900/80 border-amber-400/40 text-amber-100",
        glowColor: "rgba(252, 211, 77, 0.5)",
        foilClass: "from-amber-200/30 via-white/20 to-transparent",
        badgeIcon: Crown,
        accentColor: "#fcd34d",
      };
    case "Elite Diamond":
      return {
        name: "Elite Diamond",
        bgGradient: "bg-gradient-to-b from-cyan-950 via-indigo-950 to-slate-950",
        borderDefault: "border-cyan-400/90 shadow-cyan-400/40",
        headerBg: "bg-cyan-900/90 text-cyan-200",
        statBg: "bg-slate-900/80 border-cyan-500/40 text-cyan-100",
        glowColor: "rgba(34, 211, 238, 0.45)",
        foilClass: "from-cyan-300/25 via-blue-300/15 to-purple-300/20",
        badgeIcon: Zap,
        accentColor: "#22d3ee",
      };
    case "Retro Legend":
      return {
        name: "Retro Legend",
        bgGradient: "bg-gradient-to-b from-stone-900 via-amber-950 to-slate-950",
        borderDefault: "border-amber-600/80 shadow-amber-700/30",
        headerBg: "bg-amber-900/90 text-amber-200",
        statBg: "bg-stone-900/80 border-amber-600/30 text-amber-100",
        glowColor: "rgba(217, 119, 6, 0.4)",
        foilClass: "from-amber-500/20 via-orange-400/10 to-transparent",
        badgeIcon: Award,
        accentColor: "#d97706",
      };
    case "Gold":
    default:
      return {
        name: "Gold Elite",
        bgGradient: "bg-gradient-to-b from-amber-950 via-amber-900/90 to-slate-950",
        borderDefault: "border-amber-400/80 shadow-amber-500/30",
        headerBg: "bg-amber-800/80 text-amber-100",
        statBg: "bg-slate-950/70 border-amber-400/30 text-amber-100",
        glowColor: "rgba(245, 158, 11, 0.4)",
        foilClass: "from-amber-300/20 via-yellow-200/10 to-transparent",
        badgeIcon: ShieldCheck,
        accentColor: "#f59e0b",
      };
  }
}

export interface Holographic3DFutCardProps {
  player?: Partial<PlayerProfile>;
  tier?: FutCardTier;
  borderStyle?: CardBorderStyle;
  showParticles?: boolean;
  interactive?: boolean;
  className?: string;
  customStats?: Partial<FutAttributes>;
  customOvr?: number;
  customName?: string;
  customPosition?: string;
  customNation?: string;
  customClub?: string;
}

export default function Holographic3DFutCard({
  player,
  tier = "Gold",
  borderStyle = "gold_neon",
  showParticles = true,
  interactive = true,
  className = "",
  customStats,
  customOvr,
  customName,
  customPosition,
  customNation = "🇸🇦",
  customClub = "11Players",
}: Holographic3DFutCardProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const cardRef = useRef<HTMLDivElement>(null);
  const [photoError, setPhotoError] = useState(false);

  // Computed Card Values
  const computedOvr = customOvr ?? (player ? calculateFutOvr(player.attributes) : 88);
  const futStats: FutAttributes = {
    ...calculateFutAttributes(player?.attributes),
    ...customStats,
  };
  const playerName = customName || player?.cardName || player?.fullName || "KAPTEN ELITE";
  const position = customPosition || player?.primaryPosition || "CAM";
  const photoUrl = player?.photoUrl || player?.googlePic;

  const tierConfig = getFutTierConfig(tier, computedOvr);
  const TierBadgeIcon = tierConfig.badgeIcon;

  // 3D Motion Perspective
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXRaw = useTransform(y, [-150, 150], [18, -18]);
  const rotateYRaw = useTransform(x, [-150, 150], [-18, 18]);
  const sheenXRaw = useTransform(x, [-150, 150], ["0%", "100%"]);
  const sheenYRaw = useTransform(y, [-150, 150], ["0%", "100%"]);

  const rotateX = useSpring(rotateXRaw, { stiffness: 350, damping: 25 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 350, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Border Style CSS Mapping
  const getBorderStyleCss = (style: CardBorderStyle) => {
    switch (style) {
      case "emerald_sparkle":
        return "ring-2 ring-emerald-400/90 shadow-[0_0_25px_rgba(16,185,129,0.5)] border-emerald-400";
      case "diamond_prism":
        return "ring-2 ring-cyan-300/90 shadow-[0_0_30px_rgba(34,211,238,0.6)] border-cyan-300";
      case "obsidian_edge":
        return "ring-2 ring-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.5)] border-purple-500";
      case "retro_gold":
        return "ring-2 ring-amber-600/90 shadow-[0_0_25px_rgba(217,119,6,0.5)] border-amber-600";
      case "gold_neon":
      default:
        return "ring-2 ring-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.6)] border-amber-400";
    }
  };

  return (
    <div
      className={`perspective-1000 flex items-center justify-center p-2 select-none ${className}`}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={interactive ? { scale: 1.03 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative w-72 h-[420px] rounded-3xl p-4 flex flex-col justify-between overflow-hidden cursor-pointer transition-shadow duration-300 border-2 ${tierConfig.bgGradient} ${getBorderStyleCss(borderStyle)}`}
      >
        {/* Animated Gold Foil & Holographic Sheen Overlay */}
        <motion.div
          style={{
            background: `radial-gradient(circle at ${sheenXRaw} ${sheenYRaw}, ${tierConfig.glowColor}, transparent 70%)`,
          }}
          className="absolute inset-0 pointer-events-none z-10 opacity-70 transition-opacity"
        />

        {/* Shimmer Sheen Light Bar */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${tierConfig.foilClass} opacity-40 pointer-events-none z-10`} />
        {/* Holographic Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10" />

        {/* Floating Particles Animation */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * 260 - 130,
                  y: 400,
                  opacity: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: [-20, -50],
                  x: `calc(${(i % 2 === 0 ? 1 : -1) * 30}px + ${Math.random() * 40 - 20}px)`,
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut",
                }}
                className="absolute w-2 h-2 rounded-full bg-amber-200 blur-[1px] shadow-[0_0_8px_#fde047]"
                style={{
                  left: `${(i + 1) * 11}%`,
                  bottom: "0px",
                }}
              />
            ))}
          </div>
        )}

        {/* Top Header: OVR Rating, Position, Badge */}
        <div className="relative z-20 flex justify-between items-start pt-1 px-1">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-mono">
              {computedOvr}
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-amber-200 bg-black/40 px-2 py-0.5 rounded-md border border-amber-400/30 backdrop-blur-md">
              {position}
            </span>
            <span className="text-lg mt-1" title="Nation">
              {customNation}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-inner bg-black/40 border border-white/20 text-white backdrop-blur-sm">
              <TierBadgeIcon className="w-3 h-3 text-amber-300" />
              {tierConfig.name}
            </span>
            <span className="text-[10px] text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">
              {customClub}
            </span>
          </div>
        </div>

        {/* Center: Player Portrait & Holographic Ring */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-1">
          <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-amber-400/80 via-yellow-200/40 to-amber-600/80 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
            <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-900/90 flex items-center justify-center border border-white/20">
              {photoUrl && !photoError ? (
                <Image
                  src={photoUrl}
                  alt={playerName}
                  fill
                  className="object-cover object-top"
                  onError={() => setPhotoError(true)}
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <User className="w-14 h-14 text-amber-200/70" />
                </div>
              )}
            </div>
          </div>

          {/* Player Name Banner */}
          <h3 className="mt-3 text-lg font-black tracking-wide uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate max-w-[220px] text-center">
            {playerName}
          </h3>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-0.5" />
        </div>

        {/* Bottom Section: 6 PAC/SHO/PAS/DRI/DEF/PHY Attributes Grid */}
        <div className={`relative z-20 grid grid-cols-6 gap-1 p-2 rounded-2xl border backdrop-blur-md ${tierConfig.statBg}`}>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase">PAC</span>
            <span className="text-sm font-extrabold text-white font-mono">{futStats.pac}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase">SHO</span>
            <span className="text-sm font-extrabold text-white font-mono">{futStats.sho}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase">PAS</span>
            <span className="text-sm font-extrabold text-white font-mono">{futStats.pas}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase">DRI</span>
            <span className="text-sm font-extrabold text-white font-mono">{futStats.dri}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase">DEF</span>
            <span className="text-sm font-extrabold text-white font-mono">{futStats.def}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase">PHY</span>
            <span className="text-sm font-extrabold text-white font-mono">{futStats.phy}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
