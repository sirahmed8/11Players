"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Palette, Shield, Shirt, Sparkles, RefreshCw, Copy, Check, ChevronDown, Eye, Layers, Zap, Award, Sparkle, Camera, Image as ImageIcon } from "lucide-react";
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
  const cy = height / 2 - 15;
  const w = width * 0.68;
  const h = height * 0.72;

  switch (shieldShape) {
    case "Modern Circle":
      return `M ${cx} ${cy - h / 2} A ${w / 2} ${h / 2} 0 1 1 ${cx - 0.1} ${cy - h / 2} Z`;
    case "Diamond Badge":
      return `M ${cx} ${cy - h / 2} L ${cx + w / 2} ${cy} L ${cx} ${cy + h / 2} L ${cx - w / 2} ${cy} Z`;
    case "Heater Shield":
      return `M ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy + 10} C ${cx + w / 2} ${cy + h / 2}, ${cx} ${cy + h / 2 + 15}, ${cx} ${cy + h / 2 + 25} C ${cx} ${cy + h / 2 + 15}, ${cx - w / 2} ${cy + h / 2}, ${cx - w / 2} ${cy + 10} Z`;
    case "French Crest":
      return `M ${cx - w / 2 + 15} ${cy - h / 2} L ${cx + w / 2 - 15} ${cy - h / 2} Q ${cx + w / 2} ${cy - h / 2} ${cx + w / 2} ${cy - h / 2 + 15} L ${cx + w / 2} ${cy + 10} C ${cx + w / 2} ${cy + h / 2}, ${cx} ${cy + h / 2 + 20}, ${cx} ${cy + h / 2 + 25} C ${cx} ${cy + h / 2 + 20}, ${cx - w / 2} ${cy + h / 2}, ${cx - w / 2} ${cy + 10} L ${cx - w / 2} ${cy - h / 2 + 15} Q ${cx - w / 2} ${cy - h / 2} ${cx - w / 2 + 15} ${cy - h / 2} Z`;
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

  // Render Photorealistic 3D Jersey Canvas
  useEffect(() => {
    const canvas = jerseyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Studio Lighting Radial Backdrop
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.75);
    bgGrad.addColorStop(0, "#1e293b");
    bgGrad.addColorStop(1, "#030712");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    // 2. High-Precision Athletic Jersey Path (Ergonomic 3D Contour)
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.12); // Left neck corner
    ctx.lineTo(w * 0.15, h * 0.18); // Left shoulder tip
    ctx.lineTo(w * 0.08, h * 0.36); // Left sleeve outer cuff
    ctx.lineTo(w * 0.20, h * 0.42); // Left sleeve inner cuff
    ctx.lineTo(w * 0.25, h * 0.34); // Left armpit
    ctx.lineTo(w * 0.24, h * 0.86); // Left waist
    ctx.quadraticCurveTo(w * 0.5, h * 0.89, w * 0.76, h * 0.86); // Bottom curved hem
    ctx.lineTo(w * 0.75, h * 0.34); // Right armpit
    ctx.lineTo(w * 0.80, h * 0.42); // Right sleeve inner cuff
    ctx.lineTo(w * 0.92, h * 0.36); // Right sleeve outer cuff
    ctx.lineTo(w * 0.85, h * 0.18); // Right shoulder tip
    ctx.lineTo(w * 0.68, h * 0.12); // Right neck corner
    ctx.quadraticCurveTo(w * 0.5, h * 0.20, w * 0.32, h * 0.12); // Collar curve
    ctx.closePath();

    // Clip to Jersey Contour
    ctx.clip();

    // 3. Fill Base Primary Color
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, w, h);

    // Micro Poly-Mesh Fabric Weave Simulation Lines
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 3) {
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
      const size = 32;
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
      ctx.moveTo(0, h * 0.25);
      ctx.lineTo(w / 2, h * 0.42);
      ctx.lineTo(w, h * 0.25);
      ctx.lineTo(w, h * 0.38);
      ctx.lineTo(w / 2, h * 0.55);
      ctx.lineTo(0, h * 0.38);
      ctx.fill();
    }

    // 5. 3D Body Lighting & Realistic Cloth Fold Shadow Gradient
    const bodyShadow = ctx.createLinearGradient(0, 0, w, 0);
    bodyShadow.addColorStop(0, "rgba(0,0,0,0.5)");
    bodyShadow.addColorStop(0.2, "rgba(255,255,255,0.15)");
    bodyShadow.addColorStop(0.5, "rgba(255,255,255,0.0)");
    bodyShadow.addColorStop(0.8, "rgba(0,0,0,0.2)");
    bodyShadow.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = bodyShadow;
    ctx.fillRect(0, 0, w, h);

    // 6. Collar Construction (Stays 100% inside neck seam!)
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 7;
    ctx.fillStyle = config.accentColor;

    if (config.collarStyle === "V-Neck") {
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.12);
      ctx.lineTo(w * 0.5, h * 0.24);
      ctx.lineTo(w * 0.66, h * 0.12);
      ctx.stroke();
    } else if (config.collarStyle === "Crew Neck") {
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.12, w * 0.14, 0, Math.PI);
      ctx.stroke();
    } else if (config.collarStyle === "Polo Collar") {
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.12);
      ctx.lineTo(w * 0.47, h * 0.22);
      ctx.lineTo(w * 0.53, h * 0.22);
      ctx.lineTo(w * 0.68, h * 0.12);
      ctx.stroke();
      ctx.fillRect(w * 0.47, h * 0.22, 12, 20);
    } else {
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.12);
      ctx.lineTo(w * 0.68, h * 0.12);
      ctx.stroke();
    }

    // 7. Sleeve Trims
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.36);
    ctx.lineTo(w * 0.20, h * 0.42);
    ctx.moveTo(w * 0.92, h * 0.36);
    ctx.lineTo(w * 0.80, h * 0.42);
    ctx.stroke();

    // 8. Front View vs Back View Layout Rendering
    if (viewMode === "front") {
      // Sleeve PRO League Gold Badge (Left Sleeve)
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(w * 0.14, h * 0.32, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PRO", w * 0.14, h * 0.35);

      // Left Chest (Viewer's Left): Metallic Shield Badge
      ctx.save();
      ctx.translate(w * 0.32, h * 0.28);
      ctx.scale(0.25, 0.25);
      const chestShieldPath = new Path2D(getShieldPath(config.shieldShape, 120, 140));
      ctx.fillStyle = config.primaryColor;
      ctx.fill(chestShieldPath);
      ctx.strokeStyle = config.accentColor;
      ctx.lineWidth = 6;
      ctx.stroke(chestShieldPath);
      ctx.fillStyle = config.accentColor;
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("👑", 60, 65);
      ctx.restore();

      // Right Chest (Viewer's Right): 11P Logo & Small Front Squad Number
      ctx.fillStyle = config.accentColor;
      ctx.font = "black 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(config.squadNumber.toString(), w * 0.68, h * 0.31);

      // CENTER CHEST SPONSOR LOGO (High Contrast Chest Level Y: h * 0.48 = 230px!)
      const sponsorStr = (config.sponsorText || "11PLAYERS PRO").toUpperCase();
      ctx.font = "black 20px sans-serif";
      ctx.textAlign = "center";

      // Shadow
      ctx.fillStyle = "#000000";
      ctx.fillText(sponsorStr, w * 0.5 + 2, h * 0.48 + 2);

      // High-Contrast Main Text Color (Accent or Bright White)
      ctx.fillStyle = config.accentColor || "#ffffff";
      ctx.fillText(sponsorStr, w * 0.5, h * 0.48);

    } else {
      // BACK VIEW - Player Name Curved & Massive Varsity Squad Number
      const nameStr = (config.playerName || "CAPTAIN 11").toUpperCase();
      ctx.font = "black 20px sans-serif";
      ctx.textAlign = "center";

      ctx.fillStyle = "#000000";
      ctx.fillText(nameStr, w * 0.5 + 2, h * 0.32 + 2);

      ctx.fillStyle = config.accentColor || "#ffffff";
      ctx.fillText(nameStr, w * 0.5, h * 0.32);

      // Massive Back Squad Number (High-Impact 3D Shadow)
      ctx.fillStyle = "#000000";
      ctx.font = "black 90px monospace";
      ctx.fillText(config.squadNumber.toString(), w * 0.5 + 4, h * 0.62 + 4);

      ctx.fillStyle = config.accentColor || "#ffffff";
      ctx.fillText(config.squadNumber.toString(), w * 0.5, h * 0.62);
    }

    ctx.restore();
  }, [config, viewMode]);

  // Render 3D Metallic Crest Badge Canvas (Auto-Fit Text!)
  useEffect(() => {
    const canvas = crestCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Studio Metallic Background Radial Glow
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.75);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#030712");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    // Shield Outline Path
    const shieldSvgPath = getShieldPath(config.shieldShape, w, h);
    const shieldPath = new Path2D(shieldSvgPath);

    // Fill Shield Base Color
    ctx.fillStyle = config.primaryColor;
    ctx.fill(shieldPath);

    // Metallic Border Styling
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
    ctx.lineWidth = 14;
    ctx.stroke(shieldPath);

    // Inner Accent Line
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 4;
    ctx.stroke(shieldPath);

    // Clip to Shield Interior
    ctx.clip(shieldPath);

    // Interior Decorative Stripes
    ctx.fillStyle = config.secondaryColor + "35";
    for (let i = 0; i < w; i += 24) {
      ctx.fillRect(i, 0, 12, h);
    }

    // Emblem Symbol Glyph Rendering
    const symbolMap: Record<EmblemIcon, string> = {
      Crown: "👑",
      Falcon: "🦅",
      Lion: "🦁",
      Lightning: "⚡",
      Football: "⚽",
      Trophy: "🏆",
      Swords: "⚔️",
    };

    // Icon Shadow
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.textAlign = "center";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText(symbolMap[config.emblemIcon] || "👑", w / 2 + 3, h / 2 - 20 + 3);

    ctx.fillStyle = config.accentColor;
    ctx.fillText(symbolMap[config.emblemIcon] || "👑", w / 2, h / 2 - 20);

    // Community Ribbon Banner Frame (Inside Lower Shield)
    const bannerY = h * 0.62;
    const bannerH = 34;
    const bannerW = w * 0.60; // 60% of canvas width to stay 100% inside shield!
    const bannerX = (w - bannerW) / 2;

    ctx.fillStyle = config.secondaryColor;
    ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

    // CRITICAL - DYNAMIC AUTO-FIT TEXT SCALING (Prevents ANY text overflow!)
    const rawText = (config.communityText || "HAGOOZAT ELITE").toUpperCase();
    let fontSize = 13;
    ctx.font = `black ${fontSize}px sans-serif`;

    // Loop until text fits safely inside banner padding
    while (ctx.measureText(rawText).width > bannerW - 12 && fontSize > 8) {
      fontSize -= 1;
      ctx.font = `black ${fontSize}px sans-serif`;
    }

    // Dynamic contrast text color
    ctx.fillStyle = config.primaryColor === "#ffffff" ? "#0f172a" : "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(rawText, w / 2, bannerY + bannerH / 2 + fontSize / 3.2);

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
      {/* Studio Header Banner - Solid Color Card */}
      <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col space-y-4 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PRO Captain Pass Feature 👑</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Shirt className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 shrink-0" />
            <span>{isAr ? "استوديو الأطقم والشعارات 3D" : "3D Kit & Crest Builder Studio"}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {isAr
              ? "استوديو الأطقم الاحترافي 3D المعتمد لمنصة 11Players! صمم طقم فريقك وشعار مجتمعك بألوان، خامات أنماط، وتشطيبات كروم احترافية."
              : "Design high-definition 3D squad jerseys and metallic crest badges with custom fabric patterns, realistic shaders, and 4K PNG exports."}
          </p>
        </div>

        {/* Studio Presets Bar - Dedicated Full Row (Never Clips!) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 mr-2">
              {isAr ? "🎨 القوالب الجاهزة:" : "🎨 Presets:"}
            </span>
            {PRESET_KITS.map((p) => (
              <button
                key={p.name}
                onClick={() => setConfig((prev) => ({ ...prev, ...p.config }))}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shrink-0 border border-slate-700/60 shadow-sm"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive 3D Canvas Preview */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
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
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
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
        <div className="lg:col-span-7 bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
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
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
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
