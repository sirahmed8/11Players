"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Move, RefreshCw, Layers, CheckCircle, Flame } from "lucide-react";

export interface TacticalPlayer {
  id: string;
  name: string;
  position: string;
  ovr: number;
  x: number; // percentage 0-100 across pitch
  y: number; // percentage 0-100 across pitch
}

export interface InteractivePitchSimulatorProps {
  initialFormation?: "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1";
  players?: TacticalPlayer[];
  onFormationChange?: (formation: string) => void;
}

const DEFAULT_PLAYERS: TacticalPlayer[] = [
  { id: "p1", name: "K. El-Sayed", position: "GK", ovr: 84, x: 50, y: 88 },
  { id: "p2", name: "A. Hakimi", position: "RB", ovr: 86, x: 82, y: 70 },
  { id: "p3", name: "M. Abdelmonem", position: "CB", ovr: 82, x: 62, y: 76 },
  { id: "p4", name: "K. Koulibaly", position: "CB", ovr: 85, x: 38, y: 76 },
  { id: "p5", name: "A. Davies", position: "LB", ovr: 85, x: 18, y: 70 },
  { id: "p6", name: "N. Kanté", position: "DMF", ovr: 87, x: 50, y: 56 },
  { id: "p7", name: "K. De Bruyne", position: "CMF", ovr: 91, x: 32, y: 44 },
  { id: "p8", name: "L. Modrić", position: "CMF", ovr: 89, x: 68, y: 44 },
  { id: "p9", name: "M. Salah", position: "RWF", ovr: 92, x: 82, y: 22 },
  { id: "p10", name: "O. Marmoush", position: "CF", ovr: 88, x: 50, y: 16 },
  { id: "p11", name: "S. Mané", position: "LWF", ovr: 86, x: 18, y: 22 },
];

export const InteractivePitchSimulator: React.FC<InteractivePitchSimulatorProps> = ({
  initialFormation = "4-3-3",
  players: customPlayers,
  onFormationChange,
}) => {
  const [formation, setFormation] = useState<string>(initialFormation);
  const [playersList, setPlayersList] = useState<TacticalPlayer[]>(customPlayers || DEFAULT_PLAYERS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pressingIntensity, setPressingIntensity] = useState<number>(75);
  const [tacticalWidth, setTacticalWidth] = useState<number>(65);

  // Calculate Team Chemistry & Strength Index
  const chemistryStats = useMemo(() => {
    const totalOvr = playersList.reduce((acc, p) => acc + p.ovr, 0);
    const avgOvr = Math.round(totalOvr / (playersList.length || 1));
    const chemScore = Math.min(100, Math.round(avgOvr * 0.9 + (pressingIntensity + tacticalWidth) * 0.1));
    return { avgOvr, chemScore };
  }, [playersList, pressingIntensity, tacticalWidth]);

  // Handle position click-swap or drag selection
  const handlePlayerClick = (p: TacticalPlayer) => {
    if (!selectedPlayerId) {
      setSelectedPlayerId(p.id);
    } else if (selectedPlayerId === p.id) {
      setSelectedPlayerId(null);
    } else {
      // Swap coordinates of selected and clicked player
      setPlayersList((prev) => {
        const next = [...prev];
        const idx1 = next.findIndex((item) => item.id === selectedPlayerId);
        const idx2 = next.findIndex((item) => item.id === p.id);
        if (idx1 !== -1 && idx2 !== -1) {
          const tempX = next[idx1].x;
          const tempY = next[idx1].y;
          next[idx1] = { ...next[idx1], x: next[idx2].x, y: next[idx2].y };
          next[idx2] = { ...next[idx2], x: tempX, y: tempY };
        }
        return next;
      });
      setSelectedPlayerId(null);
    }
  };

  const handleFormationSelect = (fmt: string) => {
    setFormation(fmt);
    if (onFormationChange) onFormationChange(fmt);
  };

  return (
    <div className="w-full glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              Tactical Pitch Simulator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO 11
              </span>
            </h3>
            <p className="text-slate-400 text-xs">Interactive drag & click position swap board</p>
          </div>
        </div>

        <div className="flex items-center gap-3">

          {/* Formations */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleFormationSelect(fmt)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  formation === fmt
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 font-black"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Pitch Simulator Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Pitch Canvas */}
        <div className="lg:col-span-8 relative aspect-[4/3] w-full rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-950 via-slate-950 to-emerald-950 shadow-inner flex flex-col justify-between p-4 select-none">
          {/* Pitch Markings SVG Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="2" y="2" width="96" height="96" fill="none" stroke="#10b981" strokeWidth="0.8" />
            <line x1="2" y1="50" x2="98" y2="50" stroke="#10b981" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="#10b981" strokeWidth="0.8" />
            <rect x="25" y="2" width="50" height="16" fill="none" stroke="#10b981" strokeWidth="0.8" />
            <rect x="25" y="82" width="50" height="16" fill="none" stroke="#10b981" strokeWidth="0.8" />
          </svg>

          {/* Interactive Player Pins */}
          {playersList.map((player) => {
            const isSelected = selectedPlayerId === player.id;
            return (
              <motion.button
                key={player.id}
                onClick={() => handlePlayerClick(player)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                style={{ top: `${player.y}%`, left: `${player.x}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-10 transition-shadow ${
                  isSelected ? "z-30" : ""
                }`}
              >
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-lg transition-all ${
                    isSelected
                      ? "bg-amber-500 border-white text-slate-950 ring-4 ring-amber-400/50 animate-bounce"
                      : player.ovr >= 85
                      ? "bg-gradient-to-tr from-amber-600 to-yellow-400 border-amber-300 text-slate-950"
                      : "bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300 text-white"
                  }`}
                >
                  {player.ovr}
                </div>
                <span
                  className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shadow-md ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-amber-300 font-extrabold"
                      : "bg-slate-900/90 text-slate-200 border-slate-700/80"
                  }`}
                >
                  {player.position} • {player.name}
                </span>
              </motion.button>
            );
          })}

          {selectedPlayerId && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/90 backdrop-blur-md text-slate-950 font-black text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
              <Move className="w-4 h-4" />
              Click another player to swap positions
            </div>
          )}
        </div>

        {/* Tactical Parameters & Team Strength Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Squad Performance
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block font-medium">Avg OVR</span>
                <span className="text-2xl font-black text-amber-400">{chemistryStats.avgOvr}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block font-medium">Tactical Sync</span>
                <span className="text-2xl font-black text-emerald-400">{chemistryStats.chemScore}%</span>
              </div>
            </div>
          </div>

          {/* Tactical Sliders */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" /> Tactical Parameters
            </h4>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Pressing Intensity</span>
                <span className="text-emerald-400">{pressingIntensity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={pressingIntensity}
                onChange={(e) => setPressingIntensity(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Tactical Width</span>
                <span className="text-emerald-400">{tacticalWidth}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={tacticalWidth}
                onChange={(e) => setTacticalWidth(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setPlayersList(DEFAULT_PLAYERS);
              setSelectedPlayerId(null);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Formation
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractivePitchSimulator;
