"use client";

import React from "react";
import { motion } from "framer-motion";
import { PlayerAttributes } from "@/types";
import { useLocale } from "@/components/ui/ThemeProvider";

interface AttributeRadarChartProps {
  attributes: PlayerAttributes;
  size?: number;
  className?: string;
}

export default function AttributeRadarChart({
  attributes,
  size = 280,
  className = "",
}: AttributeRadarChartProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  // Calculate 6 core stats (scale 0 to 99)
  const pac = Math.round(((attributes.speed || 50) + (attributes.acceleration || 50)) / 2);
  const sho = Math.round(((attributes.finishing || 50) + (attributes.kickingPower || 50)) / 2);
  const pas = Math.round(((attributes.lowPass || 50) + (attributes.loftedPass || 50)) / 2);
  const dri = Math.round(((attributes.ballControl || 50) + (attributes.dribbling || 50)) / 2);
  const def = Math.round(((attributes.defensiveAwareness || 50) + (attributes.ballWinning || 50)) / 2);
  const phy = Math.round(((attributes.physicalContact || 50) + (attributes.stamina || 50)) / 2);

  const stats = [
    { label: isAr ? "سرعة" : "PAC", value: pac, angle: 0 },
    { label: isAr ? "تسديد" : "SHO", value: sho, angle: 60 },
    { label: isAr ? "تمرير" : "PAS", value: pas, angle: 120 },
    { label: isAr ? "مراوغة" : "DRI", value: dri, angle: 180 },
    { label: isAr ? "دفاع" : "DEF", value: def, angle: 240 },
    { label: isAr ? "بدني" : "PHY", value: phy, angle: 300 },
  ];

  const radius = size / 2 - 35;
  const center = size / 2;

  // Convert (value, angle) to (x, y)
  const getCoordinates = (value: number, angleDeg: number) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const r = (value / 99) * radius;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  };

  const points = stats.map((s) => {
    const { x, y } = getCoordinates(s.value, s.angle);
    return `${x},${y}`;
  }).join(" ");

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Rings */}
        {levels.map((lvl, idx) => {
          const gridPoints = stats.map((s) => {
            const { x, y } = getCoordinates(99 * lvl, s.angle);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polygon
              key={idx}
              points={gridPoints}
              className="fill-none stroke-slate-300/30 dark:stroke-slate-700/50"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis Lines */}
        {stats.map((s, idx) => {
          const { x, y } = getCoordinates(99, s.angle);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              className="stroke-slate-300/40 dark:stroke-slate-700/60"
              strokeWidth="1"
            />
          );
        })}

        {/* Player Stats Polygon Shape */}
        <motion.polygon
          initial={{ points: `${center},${center} `.repeat(6).trim() }}
          animate={{ points }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fill-emerald-500/25 stroke-emerald-500"
          strokeWidth="2.5"
        />

        {/* Outer Value Markers & Labels */}
        {stats.map((s, idx) => {
          const { x, y } = getCoordinates(115, s.angle);
          return (
            <g key={idx}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-slate-700 dark:fill-slate-300 font-bold text-xs"
              >
                {s.label} <tspan className="fill-emerald-500 font-black">{s.value}</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
