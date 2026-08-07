"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";

interface TransferValueWidgetProps {
  player: PlayerProfile;
  isAr: boolean;
}

export default function TransferValueWidget({ player, isAr }: TransferValueWidgetProps) {
  const [value, setValue] = useState(0);
  const controls = useAnimation();

  // Advanced algorithm for realistic "Market Value"
  const calculateValue = () => {
    const ovr = getPlayerOverall(player);
    const matches = player.stats?.matchesPlayed || 0;
    const goals = player.stats?.goals || 0;
    const assists = player.stats?.assists || 0;
    const mvps = player.stats?.mvp || 0;
    
    // 1. Base Value: Real-world exponential curve for OVR
    // OVR 50 = ~100k, OVR 60 = ~800k, OVR 70 = ~5M, OVR 80 = ~25M, OVR 90 = ~90M
    let baseValue = 0;
    if (ovr < 55) {
      baseValue = Math.pow(Math.max(ovr - 40, 1), 2) * 5000;
    } else if (ovr < 75) {
      baseValue = Math.pow(Math.max(ovr - 45, 1), 2.5) * 8000;
    } else {
      baseValue = Math.pow(Math.max(ovr - 50, 1), 3.2) * 12000;
    }

    // 2. Age Factor (Wonderkids are expensive, older players depreciate)
    const age = player.calculatedAge || 25;
    let ageMultiplier = 1.0;
    if (age <= 18) ageMultiplier = 2.5;
    else if (age <= 21) ageMultiplier = 1.8;
    else if (age <= 24) ageMultiplier = 1.3;
    else if (age <= 28) ageMultiplier = 1.0;
    else if (age <= 31) ageMultiplier = 0.7;
    else if (age <= 34) ageMultiplier = 0.4;
    else ageMultiplier = 0.15;

    // 3. Stats & Output Factor (Based on position)
    let statsMultiplier = 1.0;
    if (matches > 0) {
      const gpa = goals / matches;
      const apa = assists / matches;
      const pos = player.primaryPosition || "CMF";
      
      if (["CF", "SS", "LWF", "RWF"].includes(pos)) {
        statsMultiplier += (gpa * 1.5) + (apa * 0.5);
      } else if (["AMF", "CMF", "LMF", "RMF"].includes(pos)) {
        statsMultiplier += (gpa * 0.8) + (apa * 1.2);
      } else {
        // Defenders/GKs get value mostly from consistent appearances and MVPs
        statsMultiplier += (matches > 10 ? 0.2 : 0) + (mvps * 0.1);
      }
    }
    
    // Add minor boost for raw MVPs
    statsMultiplier += (mvps * 0.05);

    // 4. Form Factor (Current Momentum)
    let formMultiplier = 1.0;
    if (player.form === "⬆️") formMultiplier = 1.2;
    else if (player.form === "↗️") formMultiplier = 1.08;
    else if (player.form === "↘️") formMultiplier = 0.92;
    else if (player.form === "⬇️") formMultiplier = 0.8;

    // Combine all factors
    let finalValue = baseValue * ageMultiplier * statsMultiplier * formMultiplier;
    
    // Minimum market value floor
    if (finalValue < 150000) finalValue = 150000 + (Math.random() * 50000);
    
    return finalValue;
  };

  useEffect(() => {
    const targetValue = calculateValue();
    let startValue = targetValue * 0.5;
    setValue(startValue);

    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    const diff = targetValue - startValue;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(startValue + (diff * ease));

      if (currentStep >= steps) {
        clearInterval(interval);
        setValue(targetValue);
      }
    }, stepTime);

    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, ease: "easeOut" }
    });

    return () => clearInterval(interval);
  }, [player, controls]);

  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `€${(val / 1000000).toFixed(1)}M`;
    }
    return `€${(val / 1000).toFixed(0)}K`;
  };

  const isUp = player.form === "⬆️" || player.form === "↗️" || player.form === "➡️" || !player.form;
  const isDown = player.form === "⬇️" || player.form === "↘️";

  const ovr = getPlayerOverall(player);
  const age = player.calculatedAge || 25;

  // Age label
  const ageLabel = age <= 18 ? "Wonderkid 🌟" : age <= 21 ? "Young Talent" : age <= 24 ? "Rising Star" : age <= 28 ? "Prime Age" : age <= 31 ? "Experienced" : age <= 34 ? "Veteran" : "Retired Age";

  // OVR % bar
  const ovrBarWidth = Math.min(((ovr - 50) / 49) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-xl"
    >
      {/* Background icon */}
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <DollarSign className="w-28 h-28 text-emerald-500" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            {isAr ? "القيمة السوقية (تقديرية)" : "Est. Market Value"}
          </h3>
          {isUp ? (
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-wider">UP</span>
            </div>
          ) : isDown ? (
            <div className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
              <TrendingDown className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-wider">DOWN</span>
            </div>
          ) : null}
        </div>

        {/* Main value display */}
        <motion.div animate={controls} className="flex items-end gap-2">
          <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 drop-shadow-sm">
            {formatValue(value)}
          </span>
          <span className="text-slate-500 text-sm font-bold mb-1 pb-1">EUR</span>
        </motion.div>

        {/* Factor Breakdown */}
        <div className="border-t border-slate-800/60 pt-4 space-y-3">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            {isAr ? "عوامل التقييم" : "Valuation Factors"}
          </p>

          {/* OVR Bar */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-slate-400 w-10 shrink-0">OVR</span>
            <div className="flex-1 bg-slate-800/50 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${ovrBarWidth}%` }}
                transition={{ duration: 1.5, delay: 0.1, ease: "easeOut" }}
                className={`h-full rounded-full ${isDown ? "bg-red-500" : "bg-emerald-500"} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
              />
            </div>
            <span className="text-[11px] font-black text-emerald-400 w-8 text-right">{ovr}</span>
          </div>

          {/* Metadata Pills row */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Age Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <span className="text-[10px] font-black text-amber-400">{isAr ? "العمر:" : "Age:"}</span>
              <span className="text-[10px] font-bold text-amber-300">{age}y · {ageLabel}</span>
            </div>

            {/* Position Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-[10px] font-black text-blue-400">{isAr ? "المركز:" : "Pos:"}</span>
              <span className="text-[10px] font-bold text-blue-300">{player.primaryPosition || "—"}</span>
            </div>

            {/* Form Pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isDown ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
              <span className={`text-[10px] font-black ${isDown ? "text-red-400" : "text-emerald-400"}`}>{isAr ? "الفورم:" : "Form:"}</span>
              <span className="text-[10px] font-bold text-slate-300">{player.form || "➡️"}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-600 font-semibold">
          {isAr ? "* تقدير افتراضي بناءً على بيانات 11Players." : "* Simulated estimate based on 11Players data & real-world algorithms."}
        </p>
      </div>
    </motion.div>
  );
}
