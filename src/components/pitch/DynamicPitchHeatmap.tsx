'use client';

import React, { useRef, useEffect, useState, useId } from 'react';
import { motion } from 'framer-motion';
import { PESPosition, PlayerProfile } from '@/types';
import { Download, Sliders, Layers, User, Users, Flame } from 'lucide-react';

export type HeatmapMode = 'single' | 'group' | 'team';
export type PositionGroup = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';

export interface HeatmapPlayer {
  id: string;
  name: string;
  position: PESPosition;
  customCoordinates?: { x: number; y: number }[]; // 0..100 percentage values
}

export interface DynamicPitchHeatmapProps {
  players?: HeatmapPlayer[];
  initialMode?: HeatmapMode;
  initialGroup?: PositionGroup;
  initialIntensity?: number;
  width?: number;
  height?: number;
  showControls?: boolean;
}

/**
 * Standard 11v11 field coordinate mapping (0..100 scale).
 * X: 0 = Goal Line (left), 100 = Opponent Goal Line (right)
 * Y: 0 = Top Touchline, 100 = Bottom Touchline
 */
export const POSITION_PITCH_COORDINATES: Record<PESPosition, { x: number; y: number }> = {
  GK:  { x: 8,  y: 50 },
  CB:  { x: 24, y: 50 },
  LB:  { x: 30, y: 15 },
  RB:  { x: 30, y: 85 },
  DMF: { x: 42, y: 50 },
  CMF: { x: 54, y: 50 },
  LMF: { x: 56, y: 18 },
  RMF: { x: 56, y: 82 },
  AMF: { x: 68, y: 50 },
  LWF: { x: 78, y: 20 },
  RWF: { x: 78, y: 80 },
  SS:  { x: 82, y: 50 },
  CF:  { x: 88, y: 50 },
};

/**
 * Maps PES positions to position groups.
 */
export const POSITION_GROUP_MAP: Record<PESPosition, 'GK' | 'DEF' | 'MID' | 'ATT'> = {
  GK:  'GK',
  CB:  'DEF',
  LB:  'DEF',
  RB:  'DEF',
  DMF: 'MID',
  CMF: 'MID',
  LMF: 'MID',
  RMF: 'MID',
  AMF: 'MID',
  LWF: 'ATT',
  RWF: 'ATT',
  SS:  'ATT',
  CF:  'ATT',
};

/**
 * Exported coordinate lookup function for unit testing and canvas rendering.
 */
export function getPositionPitchCoordinates(position: PESPosition): { x: number; y: number } {
  return POSITION_PITCH_COORDINATES[position] || { x: 50, y: 50 };
}

/**
 * Helper to generate dense cluster points around a player's primary location.
 */
export function generateHeatmapClusterPoints(
  baseX: number,
  baseY: number,
  count: number = 35,
  spreadX: number = 8,
  spreadY: number = 10
): { x: number; y: number; weight: number }[] {
  const points: { x: number; y: number; weight: number }[] = [];
  // Seed point (hot spot center)
  points.push({ x: baseX, y: baseY, weight: 1.0 });

  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random using index to avoid SSR mismatch in tests/rendering
    const angle = (i / count) * 2 * Math.PI;
    const radiusNorm = (Math.sin(i * 999) + 1) / 2;
    const offsetX = Math.cos(angle) * spreadX * radiusNorm;
    const offsetY = Math.sin(angle) * spreadY * radiusNorm;

    const x = Math.max(2, Math.min(98, baseX + offsetX));
    const y = Math.max(2, Math.min(98, baseY + offsetY));
    const dist = Math.hypot(x - baseX, y - baseY);
    const weight = Math.max(0.2, 1.0 - dist / 25);

    points.push({ x, y, weight });
  }

  return points;
}

/**
 * Default sample 11v11 squad for heatmap demo.
 */
export const DEFAULT_HEATMAP_PLAYERS: HeatmapPlayer[] = [
  { id: '1', name: 'Yassine Bounou', position: 'GK' },
  { id: '2', name: 'Achraf Hakimi', position: 'RB' },
  { id: '3', name: 'Nayef Aguerd', position: 'CB' },
  { id: '4', name: 'Romain Saïss', position: 'CB' },
  { id: '5', name: 'Noussair Mazraoui', position: 'LB' },
  { id: '6', name: 'Sofyan Amrabat', position: 'DMF' },
  { id: '7', name: 'Azzedine Ounahi', position: 'CMF' },
  { id: '8', name: 'Hakim Ziyech', position: 'RWF' },
  { id: '9', name: 'Youssef En-Nesyri', position: 'CF' },
  { id: '10', name: 'Brahim Díaz', position: 'AMF' },
  { id: '11', name: 'Sofiane Boufal', position: 'LWF' },
];

export const DynamicPitchHeatmap: React.FC<DynamicPitchHeatmapProps> = ({
  players = DEFAULT_HEATMAP_PLAYERS,
  initialMode = 'team',
  initialGroup = 'ALL',
  initialIntensity = 1.5,
  width = 800,
  height = 520,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<HeatmapMode>(initialMode);
  const [selectedGroup, setSelectedGroup] = useState<PositionGroup>(initialGroup);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [intensity, setIntensity] = useState<number>(initialIntensity);

  // Generate unique HTML input IDs for accessibility
  const intensityInputId = useId();
  const modeSelectId = useId();
  const playerSelectId = useId();

  // Filter players based on mode and selection
  const activePlayers = React.useMemo(() => {
    if (mode === 'single') {
      return players.filter((p) => p.id === selectedPlayerId);
    }
    if (mode === 'group' && selectedGroup !== 'ALL') {
      return players.filter((p) => POSITION_GROUP_MAP[p.position] === selectedGroup);
    }
    return players;
  }, [players, mode, selectedGroup, selectedPlayerId]);

  // Main Canvas Render Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear pitch
    ctx.clearRect(0, 0, width, height);

    // 1. Draw PES Pitch Surface
    drawPitchBackground(ctx, width, height);

    // 2. Collect Heatmap Points
    const heatPoints: { x: number; y: number; weight: number }[] = [];
    activePlayers.forEach((p) => {
      if (p.customCoordinates && p.customCoordinates.length > 0) {
        p.customCoordinates.forEach((c) => {
          heatPoints.push({ x: c.x, y: c.y, weight: 1.0 });
        });
      } else {
        const coords = getPositionPitchCoordinates(p.position);
        const clusters = generateHeatmapClusterPoints(coords.x, coords.y, 40, 10, 12);
        heatPoints.push(...clusters);
      }
    });

    // 3. Render Radial Heat Gradients onto Canvas
    drawRadialHeatmap(ctx, heatPoints, width, height, intensity);

    // 4. Draw Player Position Badges & Labels
    drawPlayerOverlay(ctx, activePlayers, width, height);
  }, [activePlayers, width, height, intensity, mode]);

  // Draw Football Pitch Lines & Dark Emerald Turf
  const drawPitchBackground = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    // Dark Emerald Gradient Turf
    const turfGrad = ctx.createLinearGradient(0, 0, w, h);
    turfGrad.addColorStop(0, '#022c22'); // Deep Emerald Dark
    turfGrad.addColorStop(0.5, '#064e3b'); // Pitch Emerald
    turfGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = turfGrad;
    ctx.fillRect(0, 0, w, h);

    // Turf Pattern Stripes (Alternating Green Bars)
    const stripeCount = 12;
    const stripeWidth = w / stripeCount;
    for (let i = 0; i < stripeCount; i += 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, h);
    }

    // Pitch Boundary & Line Styling
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;

    const pad = 24;
    const fieldW = w - pad * 2;
    const fieldH = h - pad * 2;

    // Outer Pitch Boundary
    ctx.strokeRect(pad, pad, fieldW, fieldH);

    // Halfway Line
    const halfX = pad + fieldW / 2;
    ctx.beginPath();
    ctx.moveTo(halfX, pad);
    ctx.lineTo(halfX, pad + fieldH);
    ctx.stroke();

    // Center Circle
    const radiusCircle = fieldH * 0.18;
    ctx.beginPath();
    ctx.arc(halfX, pad + fieldH / 2, radiusCircle, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(halfX, pad + fieldH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Left Penalty Box (Team A)
    const boxW = fieldW * 0.18;
    const boxH = fieldH * 0.54;
    const boxY = pad + (fieldH - boxH) / 2;
    ctx.strokeRect(pad, boxY, boxW, boxH);

    // Left 6-Yard Box
    const box6W = fieldW * 0.06;
    const box6H = fieldH * 0.28;
    const box6Y = pad + (fieldH - box6H) / 2;
    ctx.strokeRect(pad, box6Y, box6W, box6H);

    // Left Goal
    ctx.strokeRect(pad - 8, pad + fieldH / 2 - 25, 8, 50);

    // Right Penalty Box (Team B)
    ctx.strokeRect(pad + fieldW - boxW, boxY, boxW, boxH);

    // Right 6-Yard Box
    ctx.strokeRect(pad + fieldW - box6W, box6Y, box6W, box6H);

    // Right Goal
    ctx.strokeRect(pad + fieldW, pad + fieldH / 2 - 25, 8, 50);

    // Corner Arcs
    const cornerR = 12;
    // Top Left
    ctx.beginPath();
    ctx.arc(pad, pad, cornerR, 0, Math.PI / 2);
    ctx.stroke();
    // Bottom Left
    ctx.beginPath();
    ctx.arc(pad, pad + fieldH, cornerR, -Math.PI / 2, 0);
    ctx.stroke();
    // Top Right
    ctx.beginPath();
    ctx.arc(pad + fieldW, pad, cornerR, Math.PI / 2, Math.PI);
    ctx.stroke();
    // Bottom Right
    ctx.beginPath();
    ctx.arc(pad + fieldW, pad + fieldH, cornerR, Math.PI, 3 * (Math.PI / 2));
    ctx.stroke();
  };

  // Render Multi-colored Radial Heat Gradients (Blue -> Green -> Yellow -> Red)
  const drawRadialHeatmap = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number; weight: number }[],
    w: number,
    h: number,
    intensityMult: number
  ) => {
    const pad = 24;
    const fieldW = w - pad * 2;
    const fieldH = h - pad * 2;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    points.forEach((pt) => {
      const px = pad + (pt.x / 100) * fieldW;
      const py = pad + (pt.y / 100) * fieldH;
      const radius = Math.max(25, 45 * (pt.weight || 0.8) * Math.sqrt(intensityMult));

      const radGrad = ctx.createRadialGradient(px, py, 0, px, py, radius);

      const alphaCore = 0.45 * intensityMult;
      const alphaMid = 0.3 * intensityMult;
      const alphaOuter = 0.15 * intensityMult;

      radGrad.addColorStop(0.0, `rgba(239, 68, 68, ${Math.min(0.85, alphaCore)})`); // Hot Red
      radGrad.addColorStop(0.3, `rgba(245, 158, 11, ${Math.min(0.7, alphaMid)})`); // Warm Yellow
      radGrad.addColorStop(0.65, `rgba(34, 197, 94, ${Math.min(0.5, alphaOuter)})`); // Green Transition
      radGrad.addColorStop(0.85, `rgba(59, 130, 246, ${Math.min(0.3, alphaOuter * 0.5)})`); // Cool Blue Edge
      radGrad.addColorStop(1.0, 'rgba(59, 130, 246, 0)'); // Transparent Fade

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  };

  // Draw Player Labels & Position Badges
  const drawPlayerOverlay = (
    ctx: CanvasRenderingContext2D,
    activeList: HeatmapPlayer[],
    w: number,
    h: number
  ) => {
    const pad = 24;
    const fieldW = w - pad * 2;
    const fieldH = h - pad * 2;

    activeList.forEach((p) => {
      const coords = getPositionPitchCoordinates(p.position);
      const px = pad + (coords.x / 100) * fieldW;
      const py = pad + (coords.y / 100) * fieldH;

      // Outer Glow Circle
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();

      // Inner Badge Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Position Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.position, px, py);

      // Player Name Label Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      const textWidth = ctx.measureText(p.name).width;
      const boxW = Math.max(48, textWidth + 12);
      ctx.fillRect(px - boxW / 2, py + 18, boxW, 16);

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - boxW / 2, py + 18, boxW, 16);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 9px sans-serif';
      ctx.fillText(p.name, px, py + 26);
    });
  };

  // Canvas Image Export Trigger
  const handleExportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `11Players-Heatmap-${mode}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.warn('Canvas export not available in headless environment:', e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-100">
      {/* Header & Controls Bar */}
      {showControls && (
        <div className="glass-card p-4 rounded-xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
          {/* Title & Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                PES Pitch Density Heatmap
              </h2>
              <p className="text-xs text-slate-400">11v11 Tactical Position Analysis</p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setMode('team')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'team'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Full Team
            </button>

            <button
              onClick={() => setMode('group')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'group'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Position Group
            </button>

            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'single'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Single Player
            </button>
          </div>

          {/* Sub-Filters based on Mode */}
          <div className="flex items-center gap-3">
            {mode === 'group' && (
              <div className="flex items-center gap-1">
                <label htmlFor={modeSelectId} className="sr-only">Position Group</label>
                <select
                  id={modeSelectId}
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value as PositionGroup)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="ALL">All Groups</option>
                  <option value="GK">Goalkeeper (GK)</option>
                  <option value="DEF">Defenders (DEF)</option>
                  <option value="MID">Midfielders (MID)</option>
                  <option value="ATT">Attackers (ATT)</option>
                </select>
              </div>
            )}

            {mode === 'single' && (
              <div className="flex items-center gap-1">
                <label htmlFor={playerSelectId} className="sr-only">Select Player</label>
                <select
                  id={playerSelectId}
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-semibold focus:ring-1 focus:ring-emerald-500 outline-none max-w-[160px] truncate"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Heat Intensity Slider */}
            <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <label htmlFor={intensityInputId} className="text-xs text-slate-400 font-semibold">Intensity:</label>
              <input
                id={intensityInputId}
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="w-20 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 w-6 text-right">
                {intensity.toFixed(1)}x
              </span>
            </div>

            {/* Export PNG Button */}
            <button
              onClick={handleExportCanvas}
              className="btn bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Export Heatmap Image PNG"
            >
              <Download className="w-3.5 h-3.5" /> Export PNG
            </button>
          </div>
        </div>
      )}

      {/* Main Pitch Canvas Display Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full max-w-full h-auto rounded-xl border border-emerald-900/40 shadow-inner"
        />

        {/* Legend Footbar */}
        <div className="w-full mt-3 px-4 py-2 bg-slate-900/90 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Density Legend:</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500/80 inline-block"></span> Low
              </span>
              <span className="text-slate-600">→</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span> Medium
              </span>
              <span className="text-slate-600">→</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span> High
              </span>
              <span className="text-slate-600">→</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span> Extreme
              </span>
            </div>
          </div>
          <div className="text-slate-500 font-mono text-[10px]">
            {activePlayers.length} Position{activePlayers.length !== 1 ? 's' : ''} Rendered
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPitchHeatmap;
