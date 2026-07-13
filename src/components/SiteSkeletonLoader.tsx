"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ThemeProvider";

interface Props {
  variant?: "page" | "cards" | "profile" | "table";
}

export default function SiteSkeletonLoader({ variant = "page" }: Props) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  if (variant === "profile") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 flex flex-col items-center justify-center animate-pulse" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Card outline skeleton */}
          <div className="w-full max-w-[320px] mx-auto aspect-[3/4.2] rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border border-amber-500/20 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="w-12 h-10 bg-amber-500/20 rounded-lg" />
                <div className="w-10 h-5 bg-slate-400/20 rounded" />
              </div>
              <div className="w-16 h-16 rounded-full bg-slate-400/20" />
            </div>
            <div className="space-y-3 mt-auto">
              <div className="w-3/4 h-6 bg-slate-400/20 rounded" />
              <div className="w-1/2 h-4 bg-slate-400/20 rounded" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="space-y-4 w-full">
            <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800/80 rounded-xl w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 flex flex-col justify-between relative overflow-hidden shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <div className="flex justify-between">
              <div className="w-10 h-8 bg-amber-500/20 rounded-md" />
              <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
            <div className="space-y-2">
              <div className="w-2/3 h-5 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="w-1/3 h-4 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default Luxury Page Skeleton
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 transition-colors" dir={isAr ? "rtl" : "ltr"}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0.8 }}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center gap-5"
      >
        {/* Glowing Shield & Pitch Shimmer Icon */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600/20 via-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500/60 flex items-center justify-center">
            <span className="text-2xl">⚽</span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
          <p className="text-xs font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">
            {isAr ? "جارٍ تحميل المنصة وأحدث البيانات..." : "LOADING 11PLAYERS ENGINE..."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
