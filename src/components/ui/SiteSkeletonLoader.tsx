"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";

interface Props {
  variant?:
    | "page"
    | "cards"
    | "profile"
    | "table"
    | "list"
    | "match"
    | "stats"
    | "pulse"
    | "chat"
    | "admin"
    | "onboarding"
    | "communities"
    | "community"
    | "global"
    | "notifications"
    | "ceremony"
    | "achievements"
    | "owner"
    | "announcements"
    | "users"
    | "guide"
    | "inbox";
}

export default function SiteSkeletonLoader({ variant = "page" }: Props) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Profile Page Skeleton
  if (variant === "profile") {
    return (
      <div className="min-h-screen bg-slate-950 p-6 md:p-12 flex flex-col items-center justify-center" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-6xl w-full space-y-8">
          {/* Header Banner Skeleton */}
          <div className="h-32 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex justify-between items-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="space-y-3">
              <div className="w-56 h-8 bg-slate-800 rounded-xl" />
              <div className="w-40 h-4 bg-slate-800/60 rounded-md" />
            </div>
            <div className="w-32 h-10 bg-slate-800 rounded-xl" />
          </div>

          {/* FUT Card & Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
            <div className="w-full max-w-[320px] mx-auto aspect-[3/4.2] rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="w-14 h-10 bg-emerald-500/20 rounded-xl" />
                  <div className="w-12 h-5 bg-slate-800 rounded-md" />
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-800" />
              </div>
              <div className="w-28 h-28 mx-auto rounded-2xl bg-slate-800" />
              <div className="space-y-2 text-center">
                <div className="w-36 h-6 mx-auto bg-slate-800 rounded-lg" />
                <div className="w-24 h-4 mx-auto bg-slate-800/60 rounded-md" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-44 bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                <div className="w-48 h-5 bg-slate-800 rounded-md mb-4" />
                <div className="h-24 bg-slate-950 rounded-2xl border border-slate-800" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                    <div className="w-16 h-3 bg-slate-800 rounded" />
                    <div className="w-12 h-7 bg-slate-800 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Onboarding Page Skeleton
  if (variant === "onboarding") {
    return (
      <div className="min-h-screen bg-slate-950 p-6 md:p-12 max-w-5xl mx-auto space-y-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="text-center space-y-3">
          <div className="w-64 h-8 bg-slate-900 rounded-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          </div>
          <div className="w-96 h-4 bg-slate-900/60 rounded-lg mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="w-full max-w-[300px] mx-auto aspect-[3/4.2] rounded-3xl bg-slate-900 border border-slate-800 p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="w-32 h-4 bg-slate-800 rounded-md" />
                <div className="w-full h-10 bg-slate-950 rounded-xl border border-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Communities & Global Page Skeleton
  if (variant === "communities" || variant === "global" || variant === "cards") {
    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-6" dir={isAr ? "rtl" : "ltr"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              
              {/* Avatar left + Name & Rating right */}
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <div className="w-28 h-5 bg-slate-800 rounded-md" />
                    <div className="flex gap-1">
                      <div className="w-8 h-4 bg-emerald-500/20 rounded-md" />
                      <div className="w-8 h-4 bg-slate-800 rounded-md" />
                      <div className="w-8 h-4 bg-slate-800 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="w-14 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-xl shrink-0" />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-36 h-3.5 bg-slate-800/80 rounded" />
                <div className="w-28 h-3 bg-slate-800/50 rounded" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div className="h-10 bg-emerald-600/30 border border-emerald-500/30 rounded-xl" />
                <div className="h-10 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Community Page Skeleton (Home / Players) — Mirrors Real Page 1-to-1
  if (variant === "community") {
    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header section skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-44 sm:w-56 h-9 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              </div>
              <div className="w-24 h-7 bg-emerald-500/15 border border-emerald-500/30 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              </div>
            </div>
            <div className="w-64 max-w-full h-4 bg-slate-900/60 rounded-md" />
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
            <div className="w-32 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
            <div className="flex-1 md:w-64 h-10 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
            <div className="w-36 h-10 bg-red-500/10 border border-red-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
          </div>
        </div>

        {/* Top Tab Bar Skeleton (Player Directory / Community Pulse) */}
        <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <div className="w-36 sm:w-44 h-10 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
            <div className="w-36 sm:w-44 h-10 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
          </div>
        </div>

        {/* Action Tools & Filters Bar Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36 h-9 bg-amber-500/10 border border-amber-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
            <div className="w-28 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="w-32 flex-1 sm:flex-initial h-9 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
            <div className="w-28 flex-1 sm:flex-initial h-9 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
          </div>
        </div>

        {/* PES-Style Player Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              
              {/* Card Header: Avatar left + Name & Rating right */}
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <div className="w-28 h-5 bg-slate-800 rounded-md" />
                    <div className="flex gap-1">
                      <div className="w-8 h-4 bg-emerald-500/20 rounded-md" />
                      <div className="w-8 h-4 bg-slate-800 rounded-md" />
                      <div className="w-8 h-4 bg-slate-800 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="w-14 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-xl shrink-0" />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-36 h-3.5 bg-slate-800/80 rounded" />
                <div className="w-28 h-3 bg-slate-800/50 rounded" />
              </div>

              {/* Bottom Actions: Vote Captain & Compare */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div className="h-10 bg-emerald-600/30 border border-emerald-500/30 rounded-xl" />
                <div className="h-10 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. Admin Dashboard Skeleton
  if (variant === "admin") {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
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

        <div className="w-64 h-12 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center px-4 justify-between shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20" />
            <div className="w-32 h-4 bg-slate-800 rounded-lg" />
          </div>
          <div className="w-4 h-4 rounded bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-3">
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
                <div className="h-full rounded-full bg-emerald-500/30" style={{ width: `${80 - i * 20}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. Notifications, Announcements & List Skeleton
  if (variant === "notifications" || variant === "announcements" || variant === "list") {
    return (
      <div className="space-y-4 w-full max-w-4xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        <div className="h-20 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-48 h-6 bg-slate-800 rounded-xl" />
          <div className="w-28 h-9 bg-emerald-600/30 rounded-xl" />
        </div>

        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-3xl bg-slate-900 border border-slate-800 p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-800" />
              <div className="space-y-2">
                <div className="w-48 h-4 bg-slate-800 rounded-md" />
                <div className="w-64 h-3 bg-slate-800/60 rounded-md" />
              </div>
            </div>
            <div className="w-16 h-6 bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  // 7. Users Directory & Table Skeleton
  if (variant === "users" || variant === "table") {
    return (
      <div className="space-y-4 w-full max-w-7xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        <div className="h-14 w-full bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center px-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="h-6 w-48 bg-slate-800 rounded-lg" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800" />
              <div className="w-40 h-5 bg-slate-800 rounded-lg" />
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-16 h-7 bg-emerald-500/20 rounded-xl" />
              <div className="w-16 h-7 bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 8. Season Ceremony Skeleton
  if (variant === "ceremony") {
    return (
      <div className="min-h-screen bg-slate-950 p-6 max-w-5xl mx-auto space-y-8 flex flex-col items-center justify-center" dir={isAr ? "rtl" : "ltr"}>
        <div className="w-72 h-10 bg-slate-900 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        </div>
        <div className="grid grid-cols-3 gap-6 w-full max-w-3xl items-end">
          <div className="h-48 bg-slate-900 border border-slate-800 rounded-3xl" />
          <div className="h-64 bg-slate-900 border border-amber-500/40 rounded-3xl" />
          <div className="h-40 bg-slate-900 border border-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  // 9. Achievements Skeleton
  if (variant === "achievements") {
    return (
      <div className="min-h-screen bg-slate-950 p-6 max-w-6xl mx-auto space-y-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="h-32 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-48 h-8 bg-slate-800 rounded-xl" />
          <div className="w-20 h-20 rounded-full bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 10. Owner Control Skeleton
  if (variant === "owner") {
    return (
      <div className="min-h-screen bg-slate-950 p-6 max-w-6xl mx-auto space-y-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="h-28 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-56 h-8 bg-slate-800 rounded-xl" />
          <div className="w-32 h-10 bg-rose-950/80 border border-rose-500/40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden" />
          ))}
        </div>
      </div>
    );
  }

  // 11. Guide Page Skeleton
  if (variant === "guide") {
    return (
      <div className="min-h-screen bg-slate-950 p-6 max-w-6xl mx-auto space-y-8" dir={isAr ? "rtl" : "ltr"}>
        <div className="h-32 bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-64 h-8 bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl p-4" />
          ))}
        </div>
      </div>
    );
  }

  // 12. Inbox & Chat Skeleton
  if (variant === "inbox" || variant === "chat") {
    return (
      <div className="flex-1 flex flex-col justify-end gap-4 p-4 max-w-4xl mx-auto w-full relative" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex items-end gap-2.5 max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 w-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="w-24 h-3 bg-slate-800 rounded" />
          </div>
        </div>
        <div className="flex items-end gap-2.5 max-w-[70%] self-end">
          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-3 space-y-2 w-56 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="w-40 h-3 bg-emerald-500/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // 13. Match Page Skeleton
  if (variant === "match") {
    return (
      <div className="space-y-6 w-full max-w-6xl mx-auto p-4" dir="ltr">
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <div className="w-36 h-5 bg-slate-800 rounded-xl" />
              <div className="w-56 h-7 bg-slate-800 rounded-xl" />
            </div>
            <div className="w-36 h-12 bg-emerald-500/20 rounded-2xl" />
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full mb-6">
            <div className="h-full w-1/3 bg-emerald-500/30 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // 14. Stats / Leaderboard Page Skeleton
  if (variant === "stats") {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header Banner Skeleton */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-56 h-8 bg-slate-800 rounded-xl" />
          <div className="w-80 max-w-full h-4 bg-slate-800/60 rounded-md" />
        </div>

        {/* Podium Top 3 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-lg flex flex-col items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700" />
              <div className="w-32 h-5 bg-slate-800 rounded-md" />
              <div className="w-20 h-6 bg-emerald-500/20 rounded-xl" />
            </div>
          ))}
        </div>

        {/* Tab Filter Bar Skeleton */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-24 h-9 bg-slate-800 rounded-xl" />
            ))}
          </div>
          <div className="w-48 h-9 bg-slate-800 rounded-xl" />
        </div>

        {/* Leaderboard Table Rows Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-slate-800 rounded-md" />
                <div className="w-10 h-10 rounded-full bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="w-32 h-4 bg-slate-800 rounded-md" />
                  <div className="w-20 h-3 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-6 bg-emerald-500/20 rounded-lg" />
                <div className="w-16 h-6 bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default Luxury Page Skeleton
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 bg-slate-950 transition-colors" dir={isAr ? "rtl" : "ltr"} suppressHydrationWarning>
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
          <div className="h-4 w-48 bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
          <p className="text-xs font-black tracking-widest uppercase text-slate-400">
            {mounted && isAr ? "جارٍ تحميل المنصة وأحدث البيانات..." : "LOADING 11PLAYERS ENGINE..."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
