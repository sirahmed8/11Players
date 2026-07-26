"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface OVRHistoryChartProps {
  currentOVR: number;
  initialOVR?: number;
  isAr: boolean;
}

export default function OVRHistoryChart({ currentOVR, initialOVR = 65, isAr }: OVRHistoryChartProps) {
  const p1 = Math.max(40, initialOVR);
  const p2 = Math.min(99, Math.round(initialOVR + (currentOVR - initialOVR) * 0.35));
  const p3 = Math.min(99, Math.round(initialOVR + (currentOVR - initialOVR) * 0.70));
  const p4 = currentOVR;

  const points = [
    { label: isAr ? "البداية" : "Initial", ovr: p1 },
    { label: isAr ? "الشهر 1" : "Month 1", ovr: p2 },
    { label: isAr ? "الشهر 2" : "Month 2", ovr: p3 },
    { label: isAr ? "الآن" : "Current", ovr: p4 },
  ];

  const gain = currentOVR - initialOVR;
  const values = points.map((p) => p.ovr);
  const minVal = Math.min(...values) - 2;
  const maxVal = Math.max(...values) + 2;
  const range = Math.max(1, maxVal - minVal);

  // Map 4 points to SVG coordinates (width=300, height=80)
  const coords = points.map((p, idx) => {
    const x = 30 + idx * 80;
    const y = 65 - ((p.ovr - minVal) / range) * 45;
    return { x, y, ovr: p.ovr, label: p.label };
  });

  // Construct smooth cubic bezier SVG path
  const pathD = `M ${coords[0].x} ${coords[0].y} ` +
    `C ${coords[0].x + 35} ${coords[0].y}, ${coords[1].x - 35} ${coords[1].y}, ${coords[1].x} ${coords[1].y} ` +
    `C ${coords[1].x + 35} ${coords[1].y}, ${coords[2].x - 35} ${coords[2].y}, ${coords[2].x} ${coords[2].y} ` +
    `C ${coords[2].x + 35} ${coords[2].y}, ${coords[3].x - 35} ${coords[3].y}, ${coords[3].x} ${coords[3].y}`;

  const areaD = `${pathD} L ${coords[3].x} 75 L ${coords[0].x} 75 Z`;

  return (
    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800/80 space-y-3 shadow-xl" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white leading-tight">
              {isAr ? "منحنى تطور التقييم الكلي" : "OVR Rating Growth Progression"}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold">
              {isAr ? "مخطط بياني لتدرج أداء اللاعب" : "Live overall growth trajectory"}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm ${
          gain >= 0 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
        }`}>
          {gain >= 0 ? `+${gain}` : gain} OVR
        </span>
      </div>

      {/* SVG Chart Area */}
      <div className="relative pt-2 pb-1 overflow-hidden">
        <svg viewBox="0 0 310 95" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="ovrAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="20" x2="290" y2="20" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="20" y1="45" x2="290" y2="45" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="20" y1="70" x2="290" y2="70" stroke="#1e293b" strokeWidth="1" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#ovrAreaGrad)" />

          {/* Line Stroke */}
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

          {/* Nodes and Labels */}
          {coords.map((c, i) => (
            <g key={i}>
              {/* Outer pulsing glow on current rating */}
              {i === 3 && (
                <circle cx={c.x} cy={c.y} r="7" fill="#10b981" opacity="0.3" className="animate-ping" />
              )}
              {/* Node Circle */}
              <circle cx={c.x} cy={c.y} r="4.5" fill="#020617" stroke="#10b981" strokeWidth="2.5" />
              {/* Value Badge above Node */}
              <text
                x={c.x}
                y={c.y - 8}
                textAnchor="middle"
                className="fill-emerald-400 font-mono font-black text-[10px]"
              >
                {c.ovr}
              </text>
              {/* Label below axis */}
              <text
                x={c.x}
                y="88"
                textAnchor="middle"
                className="fill-slate-400 font-bold text-[9px]"
              >
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
