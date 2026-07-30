"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Palette, Shield, Shirt, Sparkles, RefreshCw, Copy, Check, ChevronDown } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CustomDropdown from "@/components/ui/CustomDropdown";

import ModernColorPicker from "@/components/ui/ModernColorPicker";

function ColorSwatchPicker({
  label, value, onChange
}: { label: string; value: string; onChange: (v: string) => void }) {
  return <ModernColorPicker label={label} value={value} onChange={onChange} />;
}

export type PatternType = "Stripes" | "Hoops" | "Gradient" | "Diagonal" | "Camouflage";
export type ShieldShape = "Classic Shield" | "Modern Circle" | "Diamond Badge" | "Heater Shield" | "French Crest";
export type EmblemIcon = "Crown" | "Falcon" | "Lion" | "Lightning" | "Football";

export interface KitConfig {
  kitName: string;
  pattern: PatternType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  squadNumber: number;
  sponsorText: string;
  shieldShape: ShieldShape;
  emblemIcon: EmblemIcon;
  communityText: string;
}

export const DEFAULT_KIT_CONFIG: KitConfig = {
  kitName: "Hagoozat Elite Home Kit",
  pattern: "Stripes",
  primaryColor: "#0f172a", // Dark Slate/Navy
  secondaryColor: "#f59e0b", // Gold Amber
  accentColor: "#ffffff", // White
  squadNumber: 10,
  sponsorText: "11PLAYERS ELITE",
  shieldShape: "Classic Shield",
  emblemIcon: "Crown",
  communityText: "AL-RIYADH DERBY",
};

/**
 * Generates raw pattern data structure for canvas or unit tests.
 */
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

/**
 * Computes SVG/Canvas SVGPath for various shield shapes.
 */
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
    case "Classic Shield":
    default:
      return `M ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy + h / 4} Q ${cx + w / 2} ${cy + h / 2} ${cx} ${cy + h / 2} Q ${cx - w / 2} ${cy + h / 2} ${cx - w / 2} ${cy + h / 4} Z`;
  }
}

/**
 * Serializes KitConfig to JSON string.
 */
export function exportKitConfigToJSON(config: KitConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Deserializes KitConfig from JSON string.
 */
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
  const [copiedJson, setCopiedJson] = useState(false);

  const jerseyCanvasRef = useRef<HTMLCanvasElement>(null);
  const crestCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render Jersey Canvas
  useEffect(() => {
    const canvas = jerseyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw background shadow grid
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, w, h);

    // Base Jersey Silhouette Clip Path
    ctx.save();
    ctx.beginPath();
    // Sleeves and main body outline
    ctx.moveTo(w * 0.25, h * 0.12);
    ctx.lineTo(w * 0.35, h * 0.12);
    ctx.lineTo(w * 0.45, h * 0.18);
    ctx.lineTo(w * 0.55, h * 0.18);
    ctx.lineTo(w * 0.65, h * 0.12);
    ctx.lineTo(w * 0.75, h * 0.12);
    ctx.lineTo(w * 0.9, h * 0.35);
    ctx.lineTo(w * 0.78, h * 0.42);
    ctx.lineTo(w * 0.74, h * 0.34);
    ctx.lineTo(w * 0.74, h * 0.88);
    ctx.lineTo(w * 0.26, h * 0.88);
    ctx.lineTo(w * 0.26, h * 0.34);
    ctx.lineTo(w * 0.22, h * 0.42);
    ctx.lineTo(w * 0.1, h * 0.35);
    ctx.closePath();

    ctx.clip();

    // Fill Primary Base Color
    ctx.fillStyle = config.primaryColor;
    ctx.fillRect(0, 0, w, h);

    // Draw Chosen Pattern
    ctx.fillStyle = config.secondaryColor;
    if (config.pattern === "Stripes") {
      const stripeW = w / 10;
      for (let i = 0; i < 10; i += 2) {
        ctx.fillRect(i * stripeW, 0, stripeW, h);
      }
    } else if (config.pattern === "Hoops") {
      const hoopH = h / 10;
      for (let i = 0; i < 10; i += 2) {
        ctx.fillRect(0, i * hoopH, w, hoopH);
      }
    } else if (config.pattern === "Gradient") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, config.primaryColor);
      grad.addColorStop(1, config.secondaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (config.pattern === "Diagonal") {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.lineTo(w, h * 0.7);
      ctx.lineTo(w, h * 0.85);
      ctx.lineTo(0, h * 0.35);
      ctx.fill();
    } else if (config.pattern === "Camouflage") {
      ctx.fillStyle = config.secondaryColor;
      for (let i = 0; i < 12; i++) {
        const cx = Math.sin(i * 99) * (w * 0.4) + w * 0.5;
        const cy = Math.cos(i * 33) * (h * 0.4) + h * 0.5;
        const rx = 30 + (i % 4) * 15;
        const ry = 20 + (i % 3) * 10;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, (i * Math.PI) / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Collar and Sleeve Accents
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 6;

    // Collar V-neck / Round
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.12);
    ctx.lineTo(w * 0.5, h * 0.24);
    ctx.lineTo(w * 0.65, h * 0.12);
    ctx.stroke();

    // Sleeve trims
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.35);
    ctx.lineTo(w * 0.22, h * 0.42);
    ctx.moveTo(w * 0.9, h * 0.35);
    ctx.lineTo(w * 0.78, h * 0.42);
    ctx.stroke();

    // Chest Sponsor Text
    ctx.fillStyle = config.accentColor;
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(config.sponsorText, w * 0.5, h * 0.52);

    // Big Squad Number
    ctx.font = "black 72px monospace";
    ctx.fillText(config.squadNumber.toString(), w * 0.5, h * 0.74);

    // Small Crest Outline on left chest
    ctx.fillStyle = config.accentColor;
    ctx.beginPath();
    ctx.arc(w * 0.38, h * 0.34, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = config.primaryColor;
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("11P", w * 0.38, h * 0.38);

    ctx.restore();
  }, [config]);

  // Render Crest Canvas
  useEffect(() => {
    const canvas = crestCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background fill
    ctx.fillStyle = "#0b1329";
    ctx.fillRect(0, 0, w, h);

    // Draw Shield Path
    ctx.save();
    const shieldSvgPath = getShieldPath(config.shieldShape, w, h);
    const path2D = new Path2D(shieldSvgPath);

    // Fill Shield Base Color
    ctx.fillStyle = config.primaryColor;
    ctx.fill(path2D);

    // Shield Border
    ctx.strokeStyle = config.secondaryColor;
    ctx.lineWidth = 10;
    ctx.stroke(path2D);

    // Inner Accent Ring/Border
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 4;
    ctx.stroke(path2D);

    // Clip to shield interior
    ctx.clip(path2D);

    // Inner pattern stripes or star
    ctx.fillStyle = config.secondaryColor + "40"; // 25% opacity
    for (let i = 0; i < w; i += 30) {
      ctx.fillRect(i, 0, 15, h);
    }

    // Emblem Icon Symbol Drawing
    ctx.fillStyle = config.accentColor;
    ctx.textAlign = "center";
    ctx.font = "bold 56px sans-serif";

    const symbolMap: Record<EmblemIcon, string> = {
      Crown: "👑",
      Falcon: "🦅",
      Lion: "🦁",
      Lightning: "⚡",
      Football: "⚽",
    };

    ctx.fillText(symbolMap[config.emblemIcon] || "👑", w / 2, h / 2 + 10);

    // Community Text Ribbon / Banner
    ctx.fillStyle = config.secondaryColor;
    ctx.fillRect(w * 0.1, h * 0.72, w * 0.8, 36);

    ctx.fillStyle = config.primaryColor;
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(config.communityText.toUpperCase(), w / 2, h * 0.72 + 23);

    ctx.restore();
  }, [config]);

  // Export PNG Function
  const exportCanvasAsPng = (canvasRef: React.RefObject<HTMLCanvasElement | null>, filename: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    toast.success(isAr ? "تم تحميل الصورة بنجاح!" : "PNG Asset exported successfully!");
  };

  const copyConfigJson = () => {
    navigator.clipboard.writeText(exportKitConfigToJSON(config));
    setCopiedJson(true);
    toast.success(isAr ? "تم نسخ الإعدادات!" : "Kit config copied to clipboard!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Shirt className="w-8 h-8 text-amber-400" />
            {isAr ? "مصمم الأطقم والشعارات" : "Kit & Badge Builder"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr
              ? "صمم طقم فريقك وشعار مجتمعك بخيارات وألوان وأنماط متقدمة مع إمكانية التصدير بلمسة واحدة."
              : "Customize jersey patterns, custom colors, shield shapes, and export PNG assets for your squad."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCanvasAsPng(jerseyCanvasRef, `${config.kitName.replace(/\s+/g, "_")}_Kit.png`)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            {isAr ? "تحميل الطقم PNG" : "Export Kit PNG"}
          </button>
          <button
            onClick={() => exportCanvasAsPng(crestCanvasRef, `${config.kitName.replace(/\s+/g, "_")}_Crest.png`)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center gap-2 border border-slate-700 transition-all"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            {isAr ? "تحميل الشعار PNG" : "Export Crest PNG"}
          </button>
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas Preview Display */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
          {/* Tab Switcher */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6 w-full max-w-sm">
            <button
              onClick={() => setActiveTab("jersey")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "jersey"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shirt className="w-4 h-4" />
              {isAr ? "معاينة القميص" : "Jersey View"}
            </button>
            <button
              onClick={() => setActiveTab("crest")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "crest"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              {isAr ? "معاينة الشعار" : "Crest View"}
            </button>
          </div>

          {/* Canvas Rendering Containers */}
          <div className="relative flex justify-center items-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-2xl w-full">
            <canvas
              ref={jerseyCanvasRef}
              width={380}
              height={440}
              className={`rounded-xl shadow-inner transition-all ${activeTab === "jersey" ? "block" : "hidden"}`}
            />
            <canvas
              ref={crestCanvasRef}
              width={380}
              height={440}
              className={`rounded-xl shadow-inner transition-all ${activeTab === "crest" ? "block" : "hidden"}`}
            />
          </div>

          {/* Share / Copy Config Bar */}
          <div className="flex justify-between items-center w-full mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <span>{config.kitName}</span>
            <button
              onClick={copyConfigJson}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedJson ? (isAr ? "تم النسخ" : "Copied") : isAr ? "نسخ JSON" : "Copy Config"}
            </button>
          </div>
        </div>

        {/* Right Column: Customization Controls Panel */}
        <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Palette className="w-5 h-5 text-amber-400" />
            {isAr ? "خصائص التصميم والأنماط" : "Customization Controls"}
          </h2>

          {/* 1. Kit Name & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "اسم الطقم / الفريق" : "Kit / Team Name"}
              </label>
              <input
                type="text"
                value={config.kitName}
                onChange={(e) => setConfig({ ...config, kitName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "اسم الراعي على الصدر" : "Chest Sponsor Text"}
              </label>
              <input
                type="text"
                value={config.sponsorText}
                onChange={(e) => setConfig({ ...config, sponsorText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* 2. Color Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              {isAr ? "لوحة الألوان" : "Color Palette"}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <ColorSwatchPicker
                label={isAr ? "اللون الأساسي" : "Primary"}
                value={config.primaryColor}
                onChange={(v) => setConfig({ ...config, primaryColor: v })}
              />
              <ColorSwatchPicker
                label={isAr ? "اللون الثانوي" : "Secondary"}
                value={config.secondaryColor}
                onChange={(v) => setConfig({ ...config, secondaryColor: v })}
              />
              <ColorSwatchPicker
                label={isAr ? "لون التفاصيل" : "Accent"}
                value={config.accentColor}
                onChange={(v) => setConfig({ ...config, accentColor: v })}
              />
            </div>
          </div>

          {/* 3. Jersey Pattern & Squad Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "نمط القميص" : "Jersey Pattern"}
              </label>
              <CustomDropdown
                value={config.pattern}
                onChange={(val) => setConfig({ ...config, pattern: val as PatternType })}
                isAr={isAr}
                options={[
                  { value: "Stripes", label: isAr ? "Stripes (خطوط طولية)" : "Stripes" },
                  { value: "Hoops", label: isAr ? "Hoops (خطوط عرضية)" : "Hoops" },
                  { value: "Gradient", label: isAr ? "Gradient (تدرج لوني)" : "Gradient" },
                  { value: "Diagonal", label: isAr ? "Diagonal (خط قطري)" : "Diagonal" },
                  { value: "Camouflage", label: isAr ? "Camouflage (تمويه مقتضب)" : "Camouflage" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "رقم القميص" : "Squad Number"}
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={config.squadNumber}
                onChange={(e) => setConfig({ ...config, squadNumber: parseInt(e.target.value) || 10 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 font-mono"
              />
            </div>
          </div>

          {/* 4. Crest Controls (Shield, Emblem, Banner Text) */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              {isAr ? "إعدادات شعار النادي" : "Crest & Emblem Settings"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "شكل الدرع" : "Shield Shape"}
                </label>
                <CustomDropdown
                  value={config.shieldShape}
                  onChange={(val) => setConfig({ ...config, shieldShape: val as ShieldShape })}
                  isAr={isAr}
                  options={[
                    { value: "Classic Shield", label: "Classic Shield" },
                    { value: "Modern Circle", label: "Modern Circle" },
                    { value: "Diamond Badge", label: "Diamond Badge" },
                    { value: "Heater Shield", label: "Heater Shield" },
                    { value: "French Crest", label: "French Crest" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? "رمز الشعار" : "Emblem Icon"}
                </label>
                <CustomDropdown
                  value={config.emblemIcon}
                  onChange={(val) => setConfig({ ...config, emblemIcon: val as EmblemIcon })}
                  isAr={isAr}
                  options={[
                    { value: "Crown", label: isAr ? "Crown (تاج الملك)" : "Crown" },
                    { value: "Falcon", label: isAr ? "Falcon (الصقر السريع)" : "Falcon" },
                    { value: "Lion", label: isAr ? "Lion (الأسد الشجاع)" : "Lion" },
                    { value: "Lightning", label: isAr ? "Lightning (الصاعقة)" : "Lightning" },
                    { value: "Football", label: isAr ? "Football (كرة القدم)" : "Football" },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "شريط النص السفلي للشعار" : "Crest Community Banner Text"}
              </label>
              <input
                type="text"
                value={config.communityText}
                onChange={(e) => setConfig({ ...config, communityText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
