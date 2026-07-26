"use client";

import React from "react";
import { TrendingUp, Award, Zap } from "lucide-react";

interface OVRHistoryChartProps {
  currentOVR: number;
  initialOVR?: number;
  isAr: boolean;
}

export default function OVRHistoryChart({ currentOVR, initialOVR = 65, isAr }: OVRHistoryChartProps) {
  const points = [
    { label: isAr ? "البداية" : "Initial", ovr: Math.max(50, initialOVR) },
    { label: isAr ? "الشهر 1" : "Month 1", ovr: Math.min(99, Math.round(initialOVR + (currentOVR - initialOVR) * 0.35)) },
    { label: isAr ? "الشهر 2" : "Month 2", ovr: Math.min(99, Math.round(initialOVR + (currentOVR - initialOVR) * 0.70)) },
    { label: isAr ? "الآن" : "Current", ovr: currentOVR },
  ];

  const gain = currentOVR - initialOVR;

  return (
    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-black text-white">
            {isAr ? "مسار تطور التقييم الكلي (OVR Growth History)" : "OVR Rating Growth Progression"}
          </h4>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
          gain >= 0 ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-rose-950 text-rose-400 border-rose-500/40'
        }`}>
          {gain >= 0 ? `+${gain}` : gain} OVR
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2">
        {points.map((p, idx) => (
          <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="block text-[9px] font-bold text-slate-400">{p.label}</span>
            <span className="text-sm font-black font-mono text-emerald-400">{p.ovr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
