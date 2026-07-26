"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, Sparkles, Shield, Dumbbell, Award, Grid, Layers } from "lucide-react";
import { PlayerAttributes } from "@/types";
import { useLocale } from "@/components/ui/ThemeProvider";

interface AttributesBreakdownProps {
  attributes?: Partial<PlayerAttributes> | null;
}

function getRatingBadgeColor(val: number) {
  if (val >= 90) return { bg: "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30", border: "border-emerald-400", text: "text-emerald-400", bar: "from-emerald-500 to-teal-400" };
  if (val >= 80) return { bg: "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30", border: "border-amber-400", text: "text-amber-400", bar: "from-amber-400 to-yellow-300" };
  if (val >= 70) return { bg: "bg-slate-200 text-slate-950 font-black shadow-md shadow-slate-300/30", border: "border-slate-300", text: "text-slate-200", bar: "from-slate-300 to-slate-400" };
  if (val >= 60) return { bg: "bg-orange-500 text-white font-black shadow-md shadow-orange-500/30", border: "border-orange-400", text: "text-orange-400", bar: "from-orange-500 to-amber-600" };
  return { bg: "bg-rose-500 text-white font-black shadow-md shadow-rose-500/30", border: "border-rose-500", text: "text-rose-400", bar: "from-rose-500 to-red-600" };
}

interface CategoryGroup {
  id: string;
  nameEn: string;
  nameAr: string;
  shortCode: string;
  icon: React.ReactNode;
  accent: string;
  items: { key: keyof PlayerAttributes; labelEn: string; labelAr: string }[];
}

const ATTRIBUTE_CATEGORIES: CategoryGroup[] = [
  {
    id: "pace",
    nameEn: "Pace & Dribbling",
    nameAr: "السرعة والمراوغة",
    shortCode: "PAC / DRI",
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    accent: "border-emerald-500/30 bg-emerald-950/10",
    items: [
      { key: "speed", labelEn: "Speed", labelAr: "السرعة القصوى" },
      { key: "acceleration", labelEn: "Acceleration", labelAr: "التسارع" },
      { key: "dribbling", labelEn: "Dribbling", labelAr: "المراوغة" },
      { key: "ballControl", labelEn: "Ball Control", labelAr: "التحكم بالكرة" },
    ],
  },
  {
    id: "shooting",
    nameEn: "Shooting & Finishing",
    nameAr: "التسديد والإنهاء",
    shortCode: "SHO",
    icon: <Target className="w-4 h-4 text-amber-400" />,
    accent: "border-amber-500/30 bg-amber-950/10",
    items: [
      { key: "finishing", labelEn: "Finishing", labelAr: "الإنهاء أمام المرمى" },
      { key: "kickingPower", labelEn: "Kicking Power", labelAr: "قوة التسديد" },
      { key: "offensiveAwareness", labelEn: "Offensive Awareness", labelAr: "الوعي الهجومي" },
      { key: "heading", labelEn: "Heading", labelAr: "ضربات الرأس" },
    ],
  },
  {
    id: "passing",
    nameEn: "Passing & Vision",
    nameAr: "التمرير والرؤية",
    shortCode: "PAS",
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    accent: "border-cyan-500/30 bg-cyan-950/10",
    items: [
      { key: "lowPass", labelEn: "Short / Low Pass", labelAr: "التمريرات القصيرة الأرضية" },
      { key: "loftedPass", labelEn: "Long / Lofted Pass", labelAr: "التمريرات الطويلة العالية" },
    ],
  },
  {
    id: "defense",
    nameEn: "Defending & Tackling",
    nameAr: "الدفاع وافتراس الكرات",
    shortCode: "DEF",
    icon: <Shield className="w-4 h-4 text-purple-400" />,
    accent: "border-purple-500/30 bg-purple-950/10",
    items: [
      { key: "defensiveAwareness", labelEn: "Defensive Engagement", labelAr: "الوعي والتمركز الدفاعي" },
      { key: "ballWinning", labelEn: "Ball Winning", labelAr: "افتراس واستخلاص الكرات" },
      { key: "aggression", labelEn: "Aggression & Pressure", labelAr: "القتالية والضغط العالي" },
    ],
  },
  {
    id: "physical",
    nameEn: "Physicality & Stamina",
    nameAr: "البنية والتحمل",
    shortCode: "PHY",
    icon: <Dumbbell className="w-4 h-4 text-orange-400" />,
    accent: "border-orange-500/30 bg-orange-950/10",
    items: [
      { key: "stamina", labelEn: "Stamina", labelAr: "اللياقة والتحمل البدني" },
      { key: "physicalContact", labelEn: "Physical Contact", labelAr: "الالتحام والقوة البدنية" },
      { key: "jump", labelEn: "Jumping & Aerial", labelAr: "الارتقاء البدني" },
      { key: "balance", labelEn: "Balance & Agility", labelAr: "التوازن والثبات" },
    ],
  },
  {
    id: "gk",
    nameEn: "Goalkeeping",
    nameAr: "حراسة المرمى",
    shortCode: "GK",
    icon: <Award className="w-4 h-4 text-teal-400" />,
    accent: "border-teal-500/30 bg-teal-950/10",
    items: [
      { key: "gkAwareness", labelEn: "GK Awareness", labelAr: "وعي وتمركز الحارس" },
      { key: "gkCatching", labelEn: "GK Catching", labelAr: "الإمساك بالكرة" },
      { key: "gkClearing", labelEn: "GK Clearing", labelAr: "تشتيت الكرة" },
      { key: "gkReflexes", labelEn: "GK Reflexes", labelAr: "رد فعل الحارس" },
      { key: "gkReach", labelEn: "GK Reach", labelAr: "مدى التغطية" },
    ],
  },
];

export default function AttributesBreakdown({ attributes }: AttributesBreakdownProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [viewMode, setViewMode] = useState<"categories" | "grid">("categories");

  if (!attributes) return null;

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      {/* Header Bar with Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>{isAr ? "تفصيل القدرات والمهارات الفنية" : "Attributes & Technical Breakdown"}</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {isAr ? "تحليل شامل لجميع القدرات الفنية والبدنية للاعب" : "Comprehensive stats breakdown categorized by FUT style metrics"}
            </p>
          </div>
        </div>

        {/* View Switcher Buttons */}
        <div className="p-1 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-1 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode("categories")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === "categories" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? "حسب الفئات" : "Categorized"}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === "grid" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{isAr ? "شبكة شاملة" : "Full Grid"}</span>
          </button>
        </div>
      </div>

      {/* CATEGORIZED VIEW */}
      {viewMode === "categories" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ATTRIBUTE_CATEGORIES.map((cat) => {
            // Compute average value for category
            const vals = cat.items.map((item) => (attributes[item.key] as number) || 50);
            const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
            const avgBadge = getRatingBadgeColor(avg);

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl border ${cat.accent} bg-slate-900/90 p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4`}
              >
                {/* Category Card Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-white truncate">
                        {isAr ? cat.nameAr : cat.nameEn}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        {cat.shortCode}
                      </span>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${avgBadge.bg}`}>
                    <span>{avg}</span>
                  </div>
                </div>

                {/* Attribute Bars inside Category */}
                <div className="space-y-3 pt-1">
                  {cat.items.map((item) => {
                    const val = (attributes[item.key] as number) || 50;
                    const badge = getRatingBadgeColor(val);

                    return (
                      <div key={item.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-300 truncate max-w-[70%]">
                            {isAr ? item.labelAr : item.labelEn}
                          </span>
                          <span className={`font-black tabular-nums text-xs ${badge.text}`}>
                            {val}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-950 border border-slate-800/90 overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(val, 99)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${badge.bar}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* COMPACT FULL GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ATTRIBUTE_CATEGORIES.flatMap((cat) => cat.items).map((item) => {
            const val = (attributes[item.key] as number) || 50;
            const badge = getRatingBadgeColor(val);

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl space-y-2 shadow-lg transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-300 truncate max-w-[75%]">
                    {isAr ? item.labelAr : item.labelEn}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${badge.bg}`}>
                    {val}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(val, 99)}%` }}
                    transition={{ duration: 0.7 }}
                    className={`h-full rounded-full bg-gradient-to-r ${badge.bar}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
