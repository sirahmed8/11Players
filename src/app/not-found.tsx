"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/components/ui/ThemeProvider";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, ArrowRight, Home, Users, Trophy, Compass } from "lucide-react";

export default function NotFound() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const navigationSuggestions = [
    {
      href: "/communities",
      label: isAr ? "المجتمعات الكروية" : "Communities",
      desc: isAr ? "استكشف وانضم للملاعب النشطة" : "Explore and join active pitches",
      icon: Users,
    },
    {
      href: "/matches",
      label: isAr ? "سجل المباريات" : "Match Roster",
      desc: isAr ? "جدول المباريات والتشكيلات" : "Upcoming matches & squads",
      icon: Trophy,
    },
    {
      href: "/guide",
      label: isAr ? "الدليل التكتيكي" : "Tactical Guide",
      desc: isAr ? "مؤشر PSI ونظام الطاقات" : "PSI index & player ratings",
      icon: Compass,
    },
  ];

  return (
    <div
      className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-slate-950 text-white relative overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      <main className="max-w-xl w-full mx-auto relative z-10 text-center space-y-8">
        {/* Visual Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider"
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? "خطأ 404: خارج خطوط الملعب" : "Error 404: Offside / Out of Bounds"}</span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            {isAr
              ? "يبدو أنك مررت الكرة إلى مساحة فارغة! الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله."
              : "Looks like you passed into empty space! The page you are looking for has been moved or doesn't exist."}
          </p>
        </motion.div>

        {/* Primary Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/40 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>{isAr ? "العودة إلى الملعب الرئيسي" : "Return to Pitch Home"}</span>
            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Link>
        </motion.div>

        {/* Structured Quick Nav Links */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="pt-4"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            {isAr ? "أو انتقل مباشرة إلى أحد الأقسام التالية:" : "Or jump directly to key sections:"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-start">
            {navigationSuggestions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2 group active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">
                      {item.label}
                    </h2>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
