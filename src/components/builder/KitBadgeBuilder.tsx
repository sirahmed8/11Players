"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Palette, Shield, Shirt, Sparkles, RefreshCw, Copy, Check, ChevronDown, Eye, Layers, Zap, Award, Sparkle } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CustomDropdown from "@/components/ui/CustomDropdown";
import ModernColorPicker from "@/components/ui/ModernColorPicker";

export type PatternType = "Stripes" | "Hoops" | "Gradient" | "Diagonal" | "Camouflage" | "Diamonds" | "Chevron";
export type ShieldShape = "Classic Shield" | "Modern Circle" | "Diamond Badge" | "Heater Shield" | "French Crest" | "Apex Hexagon";
export type EmblemIcon = "Crown" | "Falcon" | "Lion" | "Lightning" | "Football" | "Trophy" | "Swords";
export type CollarStyle = "V-Neck" | "Crew Neck" | "Polo Collar" | "Athletic Ribbed";
export type KitViewMode = "front" | "back";

export interface KitConfig {
  kitName: string;
  pattern: PatternType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  squadNumber: number;
  playerName: string;
  sponsorText: string;
  shieldShape: ShieldShape;
  emblemIcon: EmblemIcon;
  communityText: string;
  collarStyle: CollarStyle;
  badgeFinish: "Gold Chrome" | "Platinum Silver" | "Matte Carbon" | "Neon Glow";
}

export const DEFAULT_KIT_CONFIG: KitConfig = {
  kitName: "11Players PRO Elite Kit",
  pattern: "Stripes",
  primaryColor: "#0f172a", // Deep Midnight Navy
  secondaryColor: "#10b981", // Emerald Gold Accent
  accentColor: "#ffffff", // Pure White Trim
  squadNumber: 10,
  playerName: "CAPTAIN 11",
  sponsorText: "11PLAYERS PRO",
  shieldShape: "Classic Shield",
  emblemIcon: "Crown",
  communityText: "HAGOOZAT ELITE",
  collarStyle: "V-Neck",
  badgeFinish: "Gold Chrome",
};

export const PRESET_KITS: { name: string; config: Partial<KitConfig> }[] = [
  {
    name: "Royal Emerald 👑",
    config: {
      primaryColor: "#064e3b",
      secondaryColor: "#10b981",
      accentColor: "#fbbf24",
      pattern: "Stripes",
      collarStyle: "V-Neck",
      sponsorText: "EMERALD PRO",
    },
  },
  {
    name: "Cyber Gold ⚡",
    config: {
      primaryColor: "#090d16",
      secondaryColor: "#f59e0b",
      accentColor: "#ffffff",
      pattern: "Gradient",
      collarStyle: "Athletic Ribbed",
      sponsorText: "11PLAYERS VIP",
    },
  },
  {
    name: "Blaugrana Passion 🔴🔵",
    config: {
      primaryColor: "#1e3a8a",
      secondaryColor: "#991b1b",
      accentColor: "#f59e0b",
      pattern: "Stripes",
      collarStyle: "Polo Collar",
      sponsorText: "CATALUNYA 11",
    },
  },
  {
    name: "White Knights ⚔️",
    config: {
      primaryColor: "#ffffff",
      secondaryColor: "#0284c7",
      accentColor: "#0f172a",
      pattern: "Diagonal",
      collarStyle: "Crew Neck",
      sponsorText: "ELITE SQUAD",
    },
  },
  {
    name: "Neon Stealth 🕶️",
    config: {
      primaryColor: "#18181b",
      secondaryColor: "#22c55e",
      accentColor: "#a855f7",
      pattern: "Camouflage",
      collarStyle: "V-Neck",
      sponsorText: "SHADOW OPS",
    },
  },
];

export function generateKitPatternData(
  pattern: PatternType,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  canvasWidth: number = 400,
  canvasHeight: number = 480
) {
  return {
    pattern,
    primaryColor,
    secondaryColor,
    accentColor,
    dimensions: { width: canvasWidth, height: canvasHeight },
    patternLines: pattern === "Stripes" ? 6 : pattern === "Hoops" ? 8 : 4,
  };
}

export function getShieldPath(shieldShape: ShieldShape, width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const w = width * 0.8;
  const h = height * 0.85;

  switch (shieldShape) {
    case "Modern Circle":
      return `M ${cx} ${cy - h / 2} A ${w / 2} ${h / 2} 0 1 1 ${cx - 0.1} ${cy - h / 2} Z`;
    case "Diamond Badge":
      return `M ${cx} ${cy - h / 2} L ${cx + w / 2} ${cy} L ${cx} ${cy + h / 2} L ${cx - w / 2} ${cy} Z`;
    case "Heater Shield":
      return `M ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy} C ${cx + w / 2} ${cy + h / 2}, ${cx} ${cy + h / 2 + 20}, ${cx} ${cy + h / 2 + 30} C ${cx} ${cy + h / 2 + 20}, ${cx - w / 2} ${cy + h / 2}, ${cx - w / 2} ${cy} Z`;
    case "French Crest":
      return `M ${cx - w / 2 + 10} ${cy - h / 2} L ${cx + w / 2 - 10} ${cy - h / 2} Q ${cx + w / 2} ${cy - h / 2} ${cx + w / 2} ${cy - h / 2 + 10} L ${cx + w / 2} ${cy + 10} C ${cx + w / 2} ${cy + h / 2}, ${cx} ${cy + h / 2 + 20}, ${cx} ${cy + h / 2 + 25} C ${cx} ${cy + h / 2 + 20}, ${cx - w / 2} ${cy + h / 2}, ${cx - w / 2} ${cy + 10} L ${cx - w / 2} ${cy - h / 2 + 10} Q ${cx - w / 2} ${cy - h / 2} ${cx - w / 2 + 10} ${cy - h / 2} Z`;
    case "Apex Hexagon":
      return `M ${cx} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 4} L ${cx + w / 2} ${cy + h / 4} L ${cx} ${cy + h / 2} L ${cx - w / 2} ${cy + h / 4} L ${cx - w / 2} ${cy - h / 4} Z`;
    case "Classic Shield":
    default:
      return `M ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy + h / 4} Q ${cx + w / 2} ${cy + h / 2} ${cx} ${cy + h / 2} Q ${cx - w / 2} ${cy + h / 2} ${cx - w / 2} ${cy + h / 4} Z`;
  }
}

export function exportKitConfigToJSON(config: KitConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importKitConfigFromJSON(jsonString: string): KitConfig {
  try {
    const parsed = JSON.parse(jsonString);
    return { ...DEFAULT_KIT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_KIT_CONFIG;
  }
}

export default function KitBadgeBuilder() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [config, setConfig] = useState<KitConfig>(DEFAULT_KIT_CONFIG);
  const [activeTab, setActiveTab] = useState<"jersey" | "crest">("jersey");
  const [viewMode, setViewMode] = useState<KitViewMode>("front");
  const [copiedJson, setCopiedJson] = useState(false);

  const jerseyCanvasRef = useRef<HTMLCanvasElement>(null);
  const crestCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render 3D High-Detail Jersey Canvas
  useEffect(() => {
    const canvas = jerseyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Studio Lighting Background Shadow
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, "#1e293b");
    bgGrad.addColorStop(1, "#090d16");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Base 3D Jersey Path
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.28, h * 0.12);
    ctx.lineTo(w * 0.38, h * 0.12);
    ctx.quadraticCurveTo(w * 0.5, h * 0.18, w * 0.62, h * 0.12);
    ctx.lineTo(w * 0.72, h * 0.12);
    ctx.lineTo(w * 0.92, h * 0.32);
    ctx.lineTo(w * 0.8, h * 0.42);
    ctx.lineTo(w * 0.73, h * 0.36);
    ctx.lineTo(w * 0.73, h * 0.88);
    ctx.quadraticCurveTo(w * 0.5, h * 0.91, w * 0.27, h * 0.88);
    ctx.lineTo(w * 0.27, h * 0.36);
    ctx.lineTo(w * 0.2, h * 0.42);
    ctx.lineTo(w * 0.08, h * 0.32);
    ctx.closePath();

    // Clip to Jersey Shape
    ctx.clip();

    // 3. Primary Color Base & Fabric Micro-Mesh Shading
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle Fabric Micro Mesh Texture Lines
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 4. Pattern Engine Rendering
    ctx.fillStyle = config.secondaryColor;
    if (config.pattern === "Stripes") {
      const stripeW = w / 10;
      for (let i = 0; i < 10; i += 2) {
        ctx.fillRect(i * stripeW, 0, stripeW, h);
      }
    } else if (config.pattern === "Hoops") {
      const hoopH = h / 12;
      for (let i = 0; i < 12; i += 2) {
        ctx.fillRect(0, i * hoopH, w, hoopH);
      }
    } else if (config.pattern === "Gradient") {
      const grad = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.9);
      grad.addColorStop(0, config.primaryColor);
      grad.addColorStop(1, config.secondaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (config.pattern === "Diagonal") {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.15);
      ctx.lineTo(w, h * 0.65);
      ctx.lineTo(w, h * 0.85);
      ctx.lineTo(0, h * 0.35);
      ctx.fill();
    } else if (config.pattern === "Camouflage") {
      ctx.fillStyle = config.secondaryColor;
      for (let i = 0; i < 14; i++) {
        const cx = Math.sin(i * 77) * (w * 0.35) + w * 0.5;
        const cy = Math.cos(i * 44) * (h * 0.35) + h * 0.5;
        const rx = 35 + (i % 4) * 12;
        const ry = 22 + (i % 3) * 10;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, (i * Math.PI) / 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (config.pattern === "Diamonds") {
      ctx.fillStyle = config.secondaryColor;
      const size = 30;
      for (let x = 0; x < w + size; x += size * 2) {
        for (let y = 0; y < h + size; y += size) {
          ctx.beginPath();
          ctx.moveTo(x, y - size / 2);
          ctx.lineTo(x + size / 2, y);
          ctx.lineTo(x, y + size / 2);
          ctx.lineTo(x - size / 2, y);
          ctx.fill();
        }
      }
    } else if (config.pattern === "Chevron") {
      ctx.fillStyle = config.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.3);
      ctx.lineTo(w / 2, h * 0.45);
      ctx.lineTo(w, h * 0.3);
      ctx.lineTo(w, h * 0.42);
      ctx.lineTo(w / 2, h * 0.57);
      ctx.lineTo(0, h * 0.42);
      ctx.fill();
    }

    // 5. 3D Body Lighting & Contour Shadows Overlays
    const bodyShadow = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
    bodyShadow.addColorStop(0, "rgba(0,0,0,0.45)");
    bodyShadow.addColorStop(0.15, "rgba(255,255,255,0.12)");
    bodyShadow.addColorStop(0.5, "rgba(255,255,255,0.0)");
    bodyShadow.addColorStop(0.85, "rgba(0,0,0,0.2)");
    bodyShadow.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = bodyShadow;
    ctx.fillRect(0, 0, w, h);

    // 6. Collar Styling
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 8;
    ctx.fillStyle = config.accentColor;

    if (config.collarStyle === "V-Neck") {
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.12);
      ctx.lineTo(w * 0.5, h * 0.25);
      ctx.lineTo(w * 0.62, h * 0.12);
      ctx.stroke();
    } else if (config.collarStyle === "Crew Neck") {
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.12, w * 0.12, 0, Math.PI);
      ctx.stroke();
    } else if (config.collarStyle === "Polo Collar") {
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.12);
      ctx.lineTo(w * 0.48, h * 0.24);
      ctx.lineTo(w * 0.52, h * 0.24);
      ctx.lineTo(w * 0.64, h * 0.12);
      ctx.stroke();
      ctx.fillRect(w * 0.48, h * 0.24, 8, 20);
    } else {
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.12);
      ctx.lineTo(w * 0.65, h * 0.12);
      ctx.stroke();
    }

    // 7. Sleeve Trims & PRO League Badges
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.32);
    ctx.lineTo(w * 0.2, h * 0.42);
    ctx.moveTo(w * 0.92, h * 0.32);
    ctx.lineTo(w * 0.8, h * 0.42);
    ctx.stroke();

    // 8. Front View vs Back View Elements
    if (viewMode === "front") {
      // PRO Badge on Sleeve
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(w * 0.15, h * 0.33, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PRO", w * 0.15, h * 0.36);

      // Chest Sponsor Text (3D Shadow effect)
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "black 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.sponsorText, w * 0.5 + 2, h * 0.54 + 2);

      ctx.fillStyle = config.accentColor;
      ctx.fillText(config.sponsorText, w * 0.5, h * 0.54);

      // Small Chest Crest Emblem (Right Chest)
      ctx.save();
      ctx.translate(w * 0.36, h * 0.32);
      ctx.scale(0.3, 0.3);
      const miniShield = new Path2D(getShieldPath(config.shieldShape, 100, 120));
      ctx.fillStyle = config.primaryColor;
      ctx.fill(miniShield);
      ctx.strokeStyle = config.accentColor;
      ctx.lineWidth = 6;
      ctx.stroke(miniShield);
      ctx.restore();

      // Front Squad Number
      ctx.fillStyle = config.accentColor;
      ctx.font = "black 28px monospace";
      ctx.fillText(config.squadNumber.toString(), w * 0.64, h * 0.35);

    } else {
      // BACK VIEW - Player Name Curved & Massive Squad Number
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.font = "black 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.playerName.toUpperCase(), w * 0.5 + 2, h * 0.35 + 2);

      ctx.fillStyle = config.accentColor;
      ctx.fillText(config.playerName.toUpperCase(), w * 0.5, h * 0.35);

      // Massive Back Squad Number (3D Shadow)
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.font = "black 88px monospace";
      ctx.fillText(config.squadNumber.toString(), w * 0.5 + 4, h * 0.65 + 4);

      ctx.fillStyle = config.accentColor;
      ctx.fillText(config.squadNumber.toString(), w * 0.5, h * 0.65);
    }

    ctx.restore();
  }, [config, viewMode]);

  // Render 3D Metallic Crest Canvas
  useEffect(() => {
    const canvas = crestCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Studio Metallic Backdrop Glow
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#030712");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    // 2. Outer 3D Shield Outline
    const shieldSvgPath = getShieldPath(config.shieldShape, w, h);
    const shieldPath = new Path2D(shieldSvgPath);

    // Fill Base Color
    ctx.fillStyle = config.primaryColor;
    ctx.fill(shieldPath);

    // 3. Metallic Border Finish Styling
    let strokeGrad = ctx.createLinearGradient(0, 0, w, h);
    if (config.badgeFinish === "Gold Chrome") {
      strokeGrad.addColorStop(0, "#f59e0b");
      strokeGrad.addColorStop(0.5, "#fef08a");
      strokeGrad.addColorStop(1, "#b45309");
    } else if (config.badgeFinish === "Platinum Silver") {
      strokeGrad.addColorStop(0, "#94a3b8");
      strokeGrad.addColorStop(0.5, "#ffffff");
      strokeGrad.addColorStop(1, "#334155");
    } else if (config.badgeFinish === "Neon Glow") {
      strokeGrad.addColorStop(0, "#10b981");
      strokeGrad.addColorStop(0.5, "#a855f7");
      strokeGrad.addColorStop(1, "#06b6d4");
    } else {
      strokeGrad.addColorStop(0, "#475569");
      strokeGrad.addColorStop(1, "#0f172a");
    }

    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 12;
    ctx.stroke(shieldPath);

    // Inner Accent Line
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 4;
    ctx.stroke(shieldPath);

    // Clip to Shield Interior
    ctx.clip(shieldPath);

    // 4. Interior Starburst Pattern Lines
    ctx.fillStyle = config.secondaryColor + "30";
    for (let i = 0; i < w; i += 24) {
      ctx.fillRect(i, 0, 12, h);
    }

    // 5. High-Res Emblem Icon Symbol Rendering
    const symbolMap: Record<EmblemIcon, string> = {
      Crown: "👑",
      Falcon: "🦅",
      Lion: "🦁",
      Lightning: "⚡",
      Football: "⚽",
      Trophy: "🏆",
      Swords: "⚔️",
    };

    // Symbol Shadow
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.textAlign = "center";
    ctx.font = "bold 64px sans-serif";
    ctx.fillText(symbolMap[config.emblemIcon] || "👑", w / 2 + 3, h / 2 + 13);

    ctx.fillStyle = config.accentColor;
    ctx.fillText(symbolMap[config.emblemIcon] || "👑", w / 2, h / 2 + 10);

    // 6. Community Text Curved Banner Frame
    ctx.fillStyle = config.secondaryColor;
    ctx.fillRect(w * 0.1, h * 0.72, w * 0.8, 38);

    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.1, h * 0.72, w * 0.8, 38);

    ctx.fillStyle = config.primaryColor;
    ctx.font = "black 14px sans-serif";
    ctx.fillText(config.communityText.toUpperCase(), w / 2, h * 0.72 + 24);

    ctx.restore();
  }, [config]);

  // Export PNG Helper
  const exportCanvasAsPng = (canvasRef: React.RefObject<HTMLCanvasElement | null>, filename: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    toast.success(isAr ? "تم تحميل الأصل بنجاح!" : "High-Res PNG Asset exported successfully!");
  };

  const copyConfigJson = () => {
    navigator.clipboard.writeText(exportKitConfigToJSON(config));
    setCopiedJson(true);
    toast.success(isAr ? "تم نسخ إعدادات الطقم!" : "Kit config copied to clipboard!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Studio Header Banner */}
      <div className="bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PRO Captain Pass Feature 👑</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Shirt className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            <span>{isAr ? "استوديو الأطقم والشعارات 3D" : "3D Kit & Crest Builder Studio"}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {isAr
              ? "استوديو الأطقم الاحترافي 3D المعتمد لمنصة 11Players! صمم طقم فريقك وشعار مجتمعك بألوان، خامات أنماط، وتشطيبات كروم احترافية."
              : "Design high-definition 3D squad jerseys and metallic crest badges with custom fabric patterns, realistic shaders, and 4K PNG exports."}
          </p>
        </div>

        {/* Quick Presets Dropdown */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 px-2">{isAr ? "القوالب:" : "Presets:"}</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_KITS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setConfig((prev) => ({ ...prev, ...p.config }))}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive 3D Canvas Preview */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
          {/* Studio Tab Switcher */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full">
            <button
              onClick={() => setActiveTab("jersey")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "jersey"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>{isAr ? "معاينة القميص 3D" : "3D Jersey View"}</span>
            </button>
            <button
              onClick={() => setActiveTab("crest")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "crest"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{isAr ? "معاينة الشعار 3D" : "3D Crest View"}</span>
            </button>
          </div>

          {/* Jersey View Mode Toggle (Front / Back) */}
          {activeTab === "jersey" && (
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="font-bold">{isAr ? "منظور الرؤية:" : "Perspective:"}</span>
              <button
                onClick={() => setViewMode("front")}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  viewMode === "front" ? "bg-slate-800 text-emerald-400 border border-emerald-500/30" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {isAr ? "الواجهة الأمامية" : "Front View"}
              </button>
              <button
                onClick={() => setViewMode("back")}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  viewMode === "back" ? "bg-slate-800 text-emerald-400 border border-emerald-500/30" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {isAr ? "الظهر (الاسم والرقم)" : "Back View (Name & No)"}
              </button>
            </div>
          )}

          {/* 3D Canvas Box */}
          <div className="relative flex justify-center items-center p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner w-full overflow-hidden min-h-[420px]">
            <canvas
              ref={jerseyCanvasRef}
              width={380}
              height={440}
              className={`rounded-xl shadow-2xl transition-all max-w-full h-auto object-contain ${activeTab === "jersey" ? "block" : "hidden"}`}
            />
            <canvas
              ref={crestCanvasRef}
              width={380}
              height={440}
              className={`rounded-xl shadow-2xl transition-all max-w-full h-auto object-contain ${activeTab === "crest" ? "block" : "hidden"}`}
            />
          </div>

          {/* Download & Export Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <button
              onClick={() => exportCanvasAsPng(jerseyCanvasRef, `${config.kitName.replace(/\s+/g, "_")}_Kit.png`)}
              className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{isAr ? "تحميل القميص PNG" : "Export Kit PNG"}</span>
            </button>
            <button
              onClick={() => exportCanvasAsPng(crestCanvasRef, `${config.kitName.replace(/\s+/g, "_")}_Crest.png`)}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isAr ? "تحميل الشعار PNG" : "Export Crest PNG"}</span>
            </button>
          </div>

          {/* Config Copy Bar */}
          <div className="flex justify-between items-center w-full pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
            <span>{config.kitName}</span>
            <button
              onClick={copyConfigJson}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ JSON" : "Copy JSON"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Customization Controls Panel */}
        <div className="lg:col-span-7 bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-slate-800 backdrop-blur-xl space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "أدوات التخصيص والألوان" : "Customization Engine"}</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">100% Real-Time Render</span>
          </div>

          {/* 1. Basic Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "اسم الطقم / الفريق" : "Kit / Team Name"}
              </label>
              <input
                type="text"
                value={config.kitName}
                onChange={(e) => setConfig({ ...config, kitName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "اسم الراعي على الصدر" : "Chest Sponsor Text"}
              </label>
              <input
                type="text"
                value={config.sponsorText}
                onChange={(e) => setConfig({ ...config, sponsorText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* 2. Player Name & Squad Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "اسم اللاعب على الظهر" : "Back Player Name"}
              </label>
              <input
                type="text"
                value={config.playerName}
                onChange={(e) => setConfig({ ...config, playerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "رقم القميص" : "Squad Number"}
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={config.squadNumber}
                onChange={(e) => setConfig({ ...config, squadNumber: parseInt(e.target.value, 10) || 10 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* 3. Color Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {isAr ? "لوحة ألوان القميص والشعار" : "Color Palette Tokens"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ModernColorPicker
                label={isAr ? "اللون الأساسي" : "Primary Base"}
                value={config.primaryColor}
                onChange={(v) => setConfig({ ...config, primaryColor: v })}
              />
              <ModernColorPicker
                label={isAr ? "اللون الثانوي (النمط)" : "Secondary Pattern"}
                value={config.secondaryColor}
                onChange={(v) => setConfig({ ...config, secondaryColor: v })}
              />
              <ModernColorPicker
                label={isAr ? "لون الحواشي والتفاصيل" : "Accent Trim"}
                value={config.accentColor}
                onChange={(v) => setConfig({ ...config, accentColor: v })}
              />
            </div>
          </div>

          {/* 4. Pattern & Collar Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "نمط تصميم القميص" : "Jersey Fabric Pattern"}
              </label>
              <CustomDropdown
                value={config.pattern}
                options={[
                  { value: "Stripes", label: "Stripes (خطوط طولية)" },
                  { value: "Hoops", label: "Hoops (خطوط عرضية)" },
                  { value: "Gradient", label: "Gradient (تدرج لوني)" },
                  { value: "Diagonal", label: "Diagonal (خط مائل)" },
                  { value: "Camouflage", label: "Camouflage (تمويه مائل)" },
                  { value: "Diamonds", label: "Diamonds (معينات هندسية)" },
                  { value: "Chevron", label: "Chevron (أجنحة النصر)" },
                ]}
                onChange={(p) => setConfig({ ...config, pattern: p as PatternType })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "تصميم الياقة (Collar)" : "Collar Style"}
              </label>
              <CustomDropdown
                value={config.collarStyle}
                options={[
                  { value: "V-Neck", label: "V-Neck (ياقة 7)" },
                  { value: "Crew Neck", label: "Crew Neck (ياقة دائرية)" },
                  { value: "Polo Collar", label: "Polo Collar (ياقة بولو بأزرار)" },
                  { value: "Athletic Ribbed", label: "Athletic Ribbed (ياقة رياضية)" },
                ]}
                onChange={(c) => setConfig({ ...config, collarStyle: c as CollarStyle })}
              />
            </div>
          </div>

          {/* 5. Shield Shape & Emblem Symbol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "شكل درع الشعار" : "Shield Shape"}
              </label>
              <CustomDropdown
                value={config.shieldShape}
                options={[
                  { value: "Classic Shield", label: "Classic Shield (درع كلاسيكي)" },
                  { value: "Modern Circle", label: "Modern Circle (دائري حديث)" },
                  { value: "Diamond Badge", label: "Diamond Badge (ماسـي)" },
                  { value: "Heater Shield", label: "Heater Shield (درع القرون الوسطى)" },
                  { value: "French Crest", label: "French Crest (شعار ملكي)" },
                  { value: "Apex Hexagon", label: "Apex Hexagon (سداسي سايبر)" },
                ]}
                onChange={(s) => setConfig({ ...config, shieldShape: s as ShieldShape })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "أيقونة الشعار" : "Crest Icon Symbol"}
              </label>
              <CustomDropdown
                value={config.emblemIcon}
                options={[
                  { value: "Crown", label: "👑 Crown (التاج الملكي)" },
                  { value: "Falcon", label: "🦅 Falcon (الصقر الذهبى)" },
                  { value: "Lion", label: "🦁 Lion (الأسد الشجاع)" },
                  { value: "Lightning", label: "⚡ Lightning (البرق السريع)" },
                  { value: "Football", label: "⚽ Football (كرة البطولة)" },
                  { value: "Trophy", label: "🏆 Trophy (كأس المجد)" },
                  { value: "Swords", label: "⚔️ Swords (السيفان المتقاطعان)" },
                ]}
                onChange={(e) => setConfig({ ...config, emblemIcon: e as EmblemIcon })}
              />
            </div>
          </div>

          {/* 6. Badge Finish & Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "تشطيب معدن الشعار" : "Crest Metallic Finish"}
              </label>
              <CustomDropdown
                value={config.badgeFinish}
                options={[
                  { value: "Gold Chrome", label: "🌟 Gold Chrome (ذهب لمعة)" },
                  { value: "Platinum Silver", label: "🛡️ Platinum Silver (فضة بلا Go)" },
                  { value: "Matte Carbon", label: "🕶️ Matte Carbon (كاربون مطفي)" },
                  { value: "Neon Glow", label: "⚡ Neon Glow (نيون متألق)" },
                ]}
                onChange={(f) => setConfig({ ...config, badgeFinish: f as any })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? "نص درع المجتمع" : "Crest Ribbon Text"}
              </label>
              <input
                type="text"
                value={config.communityText}
                onChange={(e) => setConfig({ ...config, communityText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
