"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";
import { Crown, Sparkles, ShieldCheck, User } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";

interface HoloPlayerCardProps {
  player: PlayerProfile;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
}

export default function HoloPlayerCard({
  player,
  size = "md",
  interactive = true,
  className = "",
}: HoloPlayerCardProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [photoError, setPhotoError] = useState(false);

  const ovr = getPlayerOverall(player);

  // 3D Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXRaw = useTransform(y, [-100, 100], [12, -12]);
  const rotateYRaw = useTransform(x, [-100, 100], [-12, 12]);

  const rotateX = useSpring(rotateXRaw, { stiffness: 300, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Determine Tier Config
  const getTierConfig = (rating: number) => {
    if (rating >= 85) {
      return {
        name: "Gold Elite",
        border: "border-amber-400/80 dark:border-amber-400/90",
        bgGradient: "from-amber-950/90 via-slate-900/95 to-slate-950/95",
        glow: "shadow-[0_0_35px_rgba(245,158,11,0.4)]",
        badgeBg: "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black",
        icon: <Crown className="w-4 h-4 text-amber-400" />,
      };
    } else if (rating >= 75) {
      return {
        name: "Silver Star",
        border: "border-slate-300/80 dark:border-slate-400/80",
        bgGradient: "from-slate-800/90 via-slate-900/95 to-slate-950/95",
        glow: "shadow-[0_0_30px_rgba(203,213,225,0.3)]",
        badgeBg: "bg-slate-300 text-slate-950 font-black",
        icon: <Sparkles className="w-4 h-4 text-slate-300" />,
      };
    } else if (rating >= 65) {
      return {
        name: "Bronze Pro",
        border: "border-amber-700/80 dark:border-amber-600/80",
        bgGradient: "from-orange-950/80 via-slate-900/95 to-slate-950/95",
        glow: "shadow-[0_0_25px_rgba(217,119,6,0.3)]",
        badgeBg: "bg-amber-700 text-amber-100 font-black",
        icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
      };
    } else {
      return {
        name: "Rookie",
        border: "border-slate-700/80",
        bgGradient: "from-slate-900/90 via-slate-900/95 to-slate-950/95",
        glow: "shadow-[0_0_15px_rgba(51,65,85,0.2)]",
        badgeBg: "bg-slate-800 text-slate-400 font-bold",
        icon: null,
      };
    }
  };

  const tier = getTierConfig(ovr);
  const photo = player.photoUrl || player.googlePic || (player as any).photoURL || "";

  // Size Dimensions
  const sizeClasses = {
    sm: "w-44 h-64 text-xs",
    md: "w-60 h-96 text-sm",
    lg: "w-72 h-[440px] text-base",
  }[size];

  return (
    <motion.div
      style={{
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${sizeClasses} rounded-3xl p-5 border-2 ${tier.border} ${tier.glow} bg-gradient-to-b ${tier.bgGradient} flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-shadow duration-300 ${className}`}
    >
      {/* 3D Holographic Shimmer Layer */}
      <motion.div
        style={{ opacity: interactive ? 0.35 : 0 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
      />

      {/* Card Header: OVR + Position */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-black tracking-tight text-white leading-none">
            {ovr}
          </span>
          <span className="text-xs font-black uppercase text-emerald-400 mt-1 tracking-wider">
            {player.primaryPosition || "CM"}
          </span>
        </div>

        {/* Tier Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${tier.badgeBg} shadow-md`}>
          {tier.icon}
          <span>{tier.name}</span>
        </div>
      </div>

      {/* Center Image Frame */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-3">
        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-950/80 shadow-2xl flex items-center justify-center">
          {photo && !photoError ? (
            <Image
              src={photo}
              alt={player.cardName || player.fullName || "Player"}
              fill
              className="object-cover"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <User className="w-16 h-16 text-slate-600" />
          )}
        </div>
      </div>

      {/* Bottom Name & Stats */}
      <div className="relative z-10 text-center space-y-2">
        <h3 className="text-lg font-black text-white tracking-tight truncate">
          {player.cardName || player.fullName || "PLAYER"}
        </h3>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/10 text-slate-300 font-bold text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">{isAr ? "سرعة" : "PAC"}</span>
            <span>{player.attributes?.speed || 70}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">{isAr ? "تسديد" : "SHO"}</span>
            <span>{player.attributes?.finishing || 70}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">{isAr ? "تمرير" : "PAS"}</span>
            <span>{player.attributes?.lowPass || 70}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
