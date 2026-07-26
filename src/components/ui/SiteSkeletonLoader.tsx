"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";

interface Props {
  variant?: "page" | "cards" | "profile" | "table" | "list" | "match" | "stats" | "pulse" | "chat" | "admin";
}

export default function SiteSkeletonLoader({ variant = "page" }: Props) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  if (variant === "admin") {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header Banner Skeleton */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-56 h-8 bg-slate-800 rounded-xl" />
              <div className="w-16 h-6 bg-emerald-500/20 rounded-full" />
            </div>
            <div className="w-80 h-4 bg-slate-800/60 rounded-lg" />
          </div>
          <div className="w-44 h-11 bg-slate-800 rounded-2xl shrink-0" />
        </div>

        {/* Tab Dropdown Pill Skeleton */}
        <div className="w-64 h-12 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center px-4 justify-between shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20" />
            <div className="w-32 h-4 bg-slate-800 rounded-lg" />
          </div>
          <div className="w-4 h-4 rounded bg-slate-800" />
        </div>

        {/* 4 Metric Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center justify-between">
                <div className="w-28 h-4 bg-slate-800 rounded-md" />
                <div className="w-8 h-8 rounded-xl bg-slate-800" />
              </div>
              <div className="w-16 h-8 bg-slate-800 rounded-lg" />
              <div className="w-36 h-3 bg-slate-800/60 rounded-md" />
            </div>
          ))}
        </div>

        {/* Tactical Position Distribution Box Skeleton (Image 4 exact mirror) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-56 h-4 bg-emerald-500/20 rounded-md mb-2" />
          
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="w-32 h-3.5 bg-slate-800 rounded-md" />
                <div className="w-16 h-3.5 bg-slate-800/80 rounded-md" />
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full bg-emerald-500/30`}
                  style={{ width: `${80 - i * 20}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* User Roster Table Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between shadow-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800" />
                <div className="w-40 h-5 bg-slate-800 rounded-lg" />
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-16 h-7 bg-emerald-500/20 rounded-xl" />
                <div className="w-16 h-7 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "match") {
    return (
      <div className="space-y-6 w-full" dir="ltr">
        {/* Upcoming match card skeleton */}
        <div className="relative rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 md:p-8 overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/40 via-teal-400/40 to-emerald-500/40 rounded-t-3xl" />
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <div className="w-36 h-5 bg-slate-800 rounded-xl" />
              <div className="w-56 h-7 bg-slate-800 rounded-xl" />
            </div>
            <div className="w-36 h-12 bg-emerald-500/20 rounded-2xl" />
          </div>
          {/* Progress bar */}
          <div className="h-3 w-full bg-slate-800 rounded-full mb-6">
            <div className="h-full w-1/3 bg-emerald-500/30 rounded-full" />
          </div>
          {/* Player roster skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2 px-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-full h-3 bg-slate-700 rounded" />
                  <div className="w-8 h-2.5 bg-emerald-500/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match info banner skeleton */}
        <div className="relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="flex flex-wrap justify-center gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="w-12 h-2.5 bg-slate-800 rounded" />
                  <div className="w-20 h-4 bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "stats") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 space-y-8">
        {/* Hero card skeleton */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="relative bg-slate-800 dark:bg-slate-900 rounded-2xl overflow-hidden p-6 md:px-8 md:py-8 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            {/* Title row */}
            <div className="flex justify-between items-start mb-7">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500/30" />
                  <div className="w-48 h-8 bg-slate-700 rounded-xl" />
                  <div className="w-14 h-5 bg-emerald-500/20 rounded-full" />
                </div>
                <div className="w-80 h-4 bg-slate-700/60 rounded-lg" />
              </div>
              <div className="w-32 h-9 bg-slate-700 rounded-xl" />
            </div>
            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5">
                  <div className="w-4 h-4 rounded-full bg-slate-600" />
                  <div className="space-y-1">
                    <div className="w-8 h-4 bg-slate-600 rounded" />
                    <div className="w-16 h-2.5 bg-slate-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 space-y-8">
          {/* Position tabs skeleton */}
          <div className="flex gap-2 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`h-9 rounded-xl flex-shrink-0 bg-slate-200 dark:bg-slate-800 relative overflow-hidden ${i === 0 ? 'w-20' : 'w-24'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/30 dark:via-slate-700/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              </div>
            ))}
          </div>

          {/* Ballon d'Or section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500/30" />
              <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="w-64 h-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
            </div>
            {/* Podium card */}
            <div className="bg-slate-800 dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-700/40 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto items-end">
                {/* 2nd place */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-700" />
                  <div className="w-20 h-4 bg-slate-700 rounded" />
                  <div className="w-full h-24 bg-slate-700/60 rounded-t-xl" />
                </div>
                {/* 1st place */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-5 h-5 bg-amber-500/30 rounded-full" />
                  <div className="w-18 h-18 rounded-full bg-slate-600 w-[72px] h-[72px]" />
                  <div className="w-24 h-4 bg-slate-600 rounded" />
                  <div className="w-full h-32 bg-gradient-to-b from-amber-500/20 to-amber-600/10 rounded-t-xl" />
                </div>
                {/* 3rd place */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-700" />
                  <div className="w-20 h-4 bg-slate-700 rounded" />
                  <div className="w-full h-20 bg-slate-700/60 rounded-t-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Awards shelf skeleton */}
          <div className="space-y-4">
            <div className="w-40 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700" />
                    <div className="w-16 h-3 bg-slate-100 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-20 h-3 bg-slate-100 dark:bg-slate-700 rounded" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-1 flex-1">
                        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="w-8 h-2.5 bg-slate-100 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full rankings tables skeleton */}
          <div className="space-y-4 pb-12">
            <div className="w-40 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-md">
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div className="w-36 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex items-center justify-between px-4 py-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="space-y-1">
                            <div className="w-28 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="w-14 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                          </div>
                        </div>
                        <div className="w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-md">
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div className="w-28 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex items-center justify-between px-4 py-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="space-y-1">
                            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="w-12 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                          </div>
                        </div>
                        <div className="w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
        {/* 4 Summary Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between h-32"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center justify-between">
                <div className="w-24 h-3.5 bg-slate-800 rounded-md" />
                <div className="w-9 h-9 rounded-2xl bg-slate-800" />
              </div>
              <div className="w-16 h-8 bg-slate-800 rounded-lg" />
              <div className="w-32 h-3 bg-slate-800/60 rounded-md" />
            </div>
          ))}
        </div>

        {/* Recent Activity Feed Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-slate-800 rounded-lg" />
              <div className="w-64 h-3.5 bg-slate-800/60 rounded-md" />
            </div>
          </div>

          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800" />
            <div className="w-48 h-4 bg-slate-800 rounded-md" />
            <div className="w-64 h-3 bg-slate-800/60 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "chat") {
    return (
      <div className="flex-1 flex flex-col justify-end gap-4 p-2 relative" dir={isAr ? "rtl" : "ltr"}>
        {/* Left message skeleton */}
        <div className="flex items-end gap-2.5 max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs p-3 space-y-2 w-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="w-24 h-3 bg-slate-800 rounded" />
            <div className="w-36 h-3 bg-slate-800/60 rounded" />
          </div>
        </div>

        {/* Right message skeleton (User) */}
        <div className="flex items-end gap-2.5 max-w-[70%] self-end">
          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl rounded-br-xs p-3 space-y-2 w-56 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="w-40 h-3 bg-emerald-500/20 rounded" />
            <div className="w-28 h-3 bg-emerald-500/15 rounded" />
          </div>
        </div>

        {/* Left message with image skeleton */}
        <div className="flex items-end gap-2.5 max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs p-3 space-y-2 w-64 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="w-full h-32 bg-slate-800/80 rounded-xl" />
            <div className="w-32 h-3 bg-slate-800 rounded" />
          </div>
        </div>

        {/* Right message short skeleton */}
        <div className="flex items-end gap-2.5 max-w-[70%] self-end">
          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl rounded-br-xs p-3 w-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="w-20 h-3 bg-emerald-500/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Default Luxury Page Skeleton
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 transition-colors" dir={isAr ? "rtl" : "ltr"} suppressHydrationWarning>
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
            {mounted && isAr ? "جارٍ تحميل المنصة وأحدث البيانات..." : "LOADING 11PLAYERS ENGINE..."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
