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

  // Simple algorithm to generate a realistic looking "market value"
  const calculateValue = () => {
    const ovr = getPlayerOverall(player);
    const matches = player.stats?.matchesPlayed || 0;
    const goals = player.stats?.goals || 0;
    const assists = player.stats?.assists || 0;
    const mvps = player.stats?.mvp || 0;
    
    // Base value from OVR (Exponential curve)
    // OVR 60 = ~1M, OVR 80 = ~25M, OVR 90 = ~70M
    let baseValue = Math.pow(Math.max(ovr - 50, 1), 2.5) * 15000;
    
    // Form modifier
    let formMultiplier = 1.0;
    if (player.form === "⬆️") formMultiplier = 1.15;
    else if (player.form === "↗️") formMultiplier = 1.05;
    else if (player.form === "↘️") formMultiplier = 0.95;
    else if (player.form === "⬇️") formMultiplier = 0.85;

    // Stats modifier
    const statsMultiplier = 1 + (matches * 0.005) + (goals * 0.01) + (assists * 0.008) + (mvps * 0.05);

    // Final calculation
    let finalValue = baseValue * formMultiplier * statsMultiplier;
    
    // Cap and format
    if (finalValue < 100000) finalValue = 100000;
    
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-xl"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <DollarSign className="w-24 h-24 text-emerald-500" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-4">
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

        <motion.div 
          animate={controls}
          className="flex items-end gap-2"
        >
          <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 drop-shadow-sm">
            {formatValue(value)}
          </span>
        </motion.div>

        <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-bold">{isAr ? "التأثير على السعر:" : "Value Factors:"}</span>
            <span className="text-slate-300 font-bold">OVR • Form • Stats</span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((getPlayerOverall(player) / 99) * 100, 100)}%` }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
              className={`h-full rounded-full ${isDown ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
