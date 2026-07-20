"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ThemeProvider";

interface Props {
  variant?: "page" | "cards" | "profile" | "table" | "list" | "match";
}

export default function SiteSkeletonLoader({ variant = "page" }: Props) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  if (variant === "profile") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 flex flex-col items-center justify-center transition-colors duration-300" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Card outline skeleton */}
          <div className="w-full max-w-[320px] mx-auto aspect-[3/4.2] rounded-3xl bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 border border-amber-500/30 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 dark:via-amber-400/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="w-14 h-10 bg-amber-500/20 rounded-xl" />
                <div className="w-12 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-amber-500/20" />
            </div>
            <div className="space-y-3 mt-auto">
              <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="space-y-4 w-full">
            <div className="w-48 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full relative overflow-hidden shadow-sm flex items-center justify-between px-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-12 h-6 bg-emerald-500/20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-4" dir="ltr">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-md relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-400/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            
            {/* Top Section - Photo and Info */}
            <div className="flex items-start gap-3 sm:gap-4 mb-3">
              {/* Photo skeleton */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-200 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex-shrink-0" />
              
              {/* Player info skeleton */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex gap-1.5 flex-wrap">
                  <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
                  <div className="w-10 h-4 bg-slate-100 dark:bg-slate-800 rounded-md" />
                </div>
              </div>
              
              {/* Overall rating skeleton */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            </div>

            {/* Bottom Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
              {/* Physical info skeleton */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                <div className="w-10 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-10 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-8 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              
              {/* Captain vote button skeleton */}
              <div className="flex justify-end">
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-4 w-full p-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-400/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2">
                <div className="w-40 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="w-64 h-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
              </div>
            </div>
            <div className="w-24 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-4 w-full p-4">
        <div className="h-14 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden flex items-center px-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-400/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="w-36 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-16 h-7 bg-emerald-500/20 rounded-xl" />
              <div className="w-16 h-7 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "match") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full p-4">
        {[0, 1].map((teamIdx) => (
          <div
            key={teamIdx}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-400/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-40 h-7 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="w-20 h-8 bg-amber-500/20 rounded-xl" />
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                  <div className="w-14 h-7 bg-emerald-500/20 rounded-xl" />
                </div>
              ))}
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
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center gap-5"
      >
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600/20 via-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500/60 flex items-center justify-center">
            <span className="text-2xl">⚽</span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
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
