"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";

export type SkeletonVariant =
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
  | "inbox"
  | "draft-room"
  | "live-broadcaster"
  | "newspaper"
  | "split-bill"
  | "skill-tree"
  | "derby";

export function getSkeletonVariantForPath(pathname: string): SkeletonVariant {
  if (pathname.startsWith("/draft") || pathname.startsWith("/match/draft")) return "draft-room";
  if (pathname.startsWith("/live") || pathname.startsWith("/match/live")) return "live-broadcaster";
  if (pathname.startsWith("/newspaper") || pathname.startsWith("/match/newspaper")) return "newspaper";
  if (pathname.startsWith("/split-bill") || pathname.startsWith("/match/split-bill")) return "split-bill";
  if (pathname.startsWith("/skill-tree") || pathname.startsWith("/profile/skill-tree")) return "skill-tree";
  if (pathname.startsWith("/derby") || pathname.startsWith("/stats/derby")) return "derby";
  if (pathname.startsWith("/leaderboard") || pathname.startsWith("/stats")) return "stats";
  if (pathname.startsWith("/achievements")) return "achievements";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/announcements")) return "announcements";
  if (pathname.startsWith("/communities")) return "communities";
  if (pathname.startsWith("/chat") || pathname.startsWith("/community-chat")) return "inbox";
  if (pathname.startsWith("/settings") || pathname.startsWith("/community-settings")) return "community";
  if (pathname.startsWith("/kit-builder") || pathname.startsWith("/community/kit-builder")) return "community";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/global")) return "global";
  if (pathname.startsWith("/guide")) return "guide";
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/matches") || pathname.startsWith("/match")) return "match";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/onboarding")) return "onboarding";
  if (pathname.startsWith("/owner")) return "owner";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/season-ceremony")) return "ceremony";
  if (pathname.startsWith("/users")) return "users";
  return "page";
}

interface Props {
  variant?: SkeletonVariant;
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

  // 3. Communities Directory Page Skeleton — mirrors /communities: hero + CTA + search + community cards
  if (variant === "communities" || variant === "cards") {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Hero: Choose Your Community */}
          <div className="text-center space-y-3 pb-2">
            <div className="inline-flex items-center gap-2 px-4 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse" />
              <div className="w-32 h-3 bg-emerald-500/20 rounded" />
            </div>
            <div className="w-64 h-10 bg-slate-800 rounded-2xl mx-auto" />
            <div className="w-80 max-w-full h-4 bg-slate-800/50 rounded-lg mx-auto" />
          </div>

          {/* Create & Manage CTA card */}
          <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-lg shrink-0" />
              <div className="space-y-2">
                <div className="w-52 h-5 bg-slate-800 rounded-lg" />
                <div className="w-72 max-w-full h-3.5 bg-slate-800/60 rounded" />
                <div className="w-56 h-3 bg-slate-800/40 rounded" />
              </div>
            </div>
            <div className="w-44 h-11 bg-gradient-to-r from-emerald-600/40 to-teal-600/30 border border-emerald-500/40 rounded-2xl shrink-0" />
          </div>

          {/* Search + Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-700 rounded" />
              <div className="w-full h-11 bg-slate-900 border border-slate-800 rounded-2xl" />
            </div>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              {["All", "My Communities", "Public", "Private"].map((_, i) => (
                <div key={i} className={`h-8 rounded-xl px-4 ${
                  i === 0 ? 'w-10 bg-emerald-600/40 border border-emerald-500/30' : 'w-24 bg-slate-800/50'
                }`} />
              ))}
            </div>
          </div>

          {/* Community Cards — compact layout matching actual cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3.5 relative overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />

                {/* Header: name + share + player count badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="w-32 h-5 bg-slate-800 rounded-lg" />
                    <div className="flex items-center gap-1.5">
                      <div className={`w-14 h-5 rounded-full ${
                        i % 2 === 0
                          ? 'bg-emerald-500/15 border border-emerald-500/25'
                          : 'bg-amber-500/15 border border-amber-500/25'
                      }`} />
                      {i % 3 === 0 && <div className="w-20 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-full" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-xl shrink-0">
                    <div className="w-3.5 h-3.5 bg-emerald-400/40 rounded" />
                    <div className="w-5 h-3.5 bg-slate-700 rounded" />
                  </div>
                </div>

                {/* Description lines */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-slate-800/80 rounded" />
                  <div className="w-5/6 h-3 bg-slate-800/60 rounded" />
                  <div className="w-3/4 h-3 bg-slate-800/40 rounded" />
                </div>

                {/* Action button */}
                <div className="h-11 w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3b. Global Feed Page Skeleton
  if (variant === "global") {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 space-y-4" dir={isAr ? "rtl" : "ltr"}>
        {/* Feed header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-36 h-6 bg-slate-800 rounded-xl" />
          <div className="w-24 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-xl" />
        </div>
        {/* Feed posts */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-32 h-4 bg-slate-800 rounded" />
                <div className="w-20 h-3 bg-slate-800/60 rounded" />
              </div>
              <div className="w-16 h-6 bg-emerald-500/15 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-3.5 bg-slate-800/80 rounded" />
              <div className="w-4/5 h-3.5 bg-slate-800/60 rounded" />
              <div className="w-2/3 h-3 bg-slate-800/40 rounded" />
            </div>
            {i % 2 === 0 && <div className="w-full h-32 bg-slate-800/40 rounded-2xl" />}
            <div className="flex gap-3 pt-1">
              <div className="w-16 h-8 bg-slate-800/60 rounded-xl" />
              <div className="w-16 h-8 bg-slate-800/60 rounded-xl" />
            </div>
          </div>
        ))}
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

  // 6. Notifications, Announcements & List Skeleton (100% Mobile Responsive)
  if (variant === "notifications" || variant === "announcements" || variant === "list") {
    return (
      <div className="space-y-4 w-full max-w-4xl mx-auto p-3 sm:p-6 overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
        <div className="h-20 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center justify-between relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="w-36 sm:w-48 h-6 bg-slate-800 rounded-xl" />
          <div className="w-20 sm:w-28 h-8 sm:h-9 bg-emerald-600/30 rounded-xl shrink-0" />
        </div>

        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 shrink-0" />
              <div className="space-y-2 min-w-0 flex-1">
                <div className="w-32 sm:w-48 h-4 bg-slate-800 rounded-md" />
                <div className="w-full max-w-[220px] h-3 bg-slate-800/60 rounded-md" />
              </div>
            </div>
            <div className="w-12 sm:w-16 h-5 sm:h-6 bg-slate-800 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  // 7. Users Directory & Table Skeleton
  if (variant === "users" || variant === "table") {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Page Title Row */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="w-52 h-7 bg-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/60 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            </div>
            <div className="w-80 h-4 bg-slate-800/60 rounded-lg" />
          </div>
          <div className="w-36 h-9 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl" />
        </div>

        {/* Main Card — mirrors GlobalUsersTable outer container */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Header & Controls */}
          <div className="p-6 border-b border-slate-800 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-950">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800" />
              <div className="space-y-1.5">
                <div className="w-56 h-5 bg-slate-800 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                </div>
                <div className="w-72 h-3.5 bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex-1 lg:w-72 h-10 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              </div>
              <div className="w-24 h-10 bg-slate-800 rounded-2xl" />
              <div className="w-24 h-10 bg-slate-800 rounded-2xl" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800">
                  <th className="px-4 py-4 w-14">
                    <div className="w-5 h-5 rounded-lg bg-slate-800 mx-auto" />
                  </th>
                  {["220px", "200px", "180px", "190px"].map((w, i) => (
                    <th key={i} className="px-6 py-4" style={{ minWidth: w }}>
                      <div className="w-24 h-3.5 bg-slate-800 rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              {/* Shimmer Rows */}
              <tbody className="divide-y divide-slate-800/80">
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse bg-slate-900/40">
                    <td className="px-4 py-4 text-center">
                      <div className="w-5 h-5 rounded-lg bg-slate-800 mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-800 shrink-0" />
                        <div className="space-y-1.5 min-w-0">
                          <div className={`h-4 bg-slate-800 rounded ${i % 3 === 0 ? 'w-32' : i % 3 === 1 ? 'w-40' : 'w-28'}`} />
                          <div className="w-24 h-3 bg-slate-800/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="w-28 h-4 bg-slate-800 rounded" />
                        <div className="w-20 h-3 bg-slate-800/60 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="w-24 h-4 bg-slate-800 rounded" />
                        <div className="w-16 h-3 bg-slate-800/60 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-8 bg-slate-800 rounded-xl" />
                        <div className="w-8 h-8 bg-slate-800 rounded-xl" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="w-32 h-4 bg-slate-800/60 rounded" />
            <div className="flex items-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-xl ${i === 1 ? 'bg-emerald-600/30 border border-emerald-500/30' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>
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

  // 9. Achievements Skeleton — mirrors actual layout: header banner + stat tiles + filter tabs + achievement cards
  if (variant === "achievements") {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header Banner with progress ring */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/8 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="space-y-2">
            <div className="w-48 h-8 bg-slate-800 rounded-xl" />
            <div className="w-64 h-4 bg-slate-800/60 rounded-md" />
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-3 bg-slate-800 rounded" />
              <div className="w-16 h-3 bg-amber-500/30 rounded" />
            </div>
          </div>
          {/* Progress ring placeholder */}
          <div className="w-20 h-20 rounded-full border-8 border-amber-500/30 border-t-amber-500/60 relative shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-5 bg-slate-800 rounded" />
            </div>
          </div>
        </div>

        {/* Stat tiles row: 4 tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {["amber", "emerald", "blue", "rose"].map((color, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl relative overflow-hidden space-y-3">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-2xl bg-${color}-500/20 border border-${color}-500/30`} />
                <div className="w-12 h-8 bg-slate-800 rounded-lg" />
              </div>
              <div className="w-20 h-3 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>

        {/* Filter tab bar */}
        <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800 flex gap-2 flex-wrap">
          {["All", "Earned", "In Progress", "Locked"].map((_, i) => (
            <div key={i} className={`h-8 rounded-xl flex-1 min-w-[60px] ${i === 0 ? 'bg-emerald-600/30 border border-emerald-500/30' : 'bg-slate-800/50'}`} />
          ))}
        </div>

        {/* Achievement cards grid — faithful: icon, name, progress bar, status badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={`bg-slate-900 border rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-xl ${
              i % 3 === 0 ? 'border-amber-500/30' : i % 3 === 1 ? 'border-slate-700/60' : 'border-orange-500/30'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl border flex-shrink-0 ${
                    i % 3 === 0 ? 'bg-amber-500/20 border-amber-500/40' :
                    i % 3 === 1 ? 'bg-slate-800 border-slate-700' :
                    'bg-orange-500/20 border-orange-500/40'
                  }`} />
                  <div className="space-y-1.5">
                    <div className="w-28 h-4 bg-slate-800 rounded" />
                    <div className="w-20 h-3 bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className={`w-14 h-5 rounded-full flex-shrink-0 ${
                  i % 3 === 0 ? 'bg-amber-500/30' : i % 3 === 1 ? 'bg-slate-700' : 'bg-orange-500/20'
                }`} />
              </div>
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <div className="w-16 h-2.5 bg-slate-800/60 rounded" />
                  <div className="w-10 h-2.5 bg-slate-800/60 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full rounded-full ${
                    i % 3 === 0 ? 'bg-amber-500/60' : i % 3 === 1 ? 'bg-slate-600' : 'bg-orange-500/50'
                  }`} style={{ width: `${90 - i * 8}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 10. Owner Control Skeleton
  // 10. Owner Control Page Skeleton — mirrors /owner: header banner + model selector + community management grid
  if (variant === "owner") {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header banner */}
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30" />
              <div className="w-56 h-7 bg-slate-800 rounded-lg" />
            </div>
            <div className="w-80 max-w-full h-4 bg-slate-800/60 rounded" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-44 h-10 bg-slate-950 border border-slate-800 rounded-xl" />
            <div className="w-36 h-10 bg-gradient-to-r from-emerald-600/40 to-teal-600/40 border border-emerald-500/30 rounded-xl" />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="w-40 h-5 bg-slate-800 rounded-md" />
          <div className="flex gap-2">
            <div className="w-32 h-9 bg-slate-800 rounded-xl" />
            <div className="w-32 h-9 bg-rose-500/20 border border-rose-500/30 rounded-xl" />
          </div>
        </div>

        {/* Communities Admin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="w-40 h-5 bg-slate-800 rounded-md" />
                  <div className="w-28 h-3.5 bg-slate-800/60 rounded" />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800" />
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                <div className="h-12 bg-slate-950 rounded-xl border border-slate-800" />
                <div className="h-12 bg-slate-950 rounded-xl border border-slate-800" />
                <div className="h-12 bg-slate-950 rounded-xl border border-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11. Guide Page Skeleton — mirrors /guide: sidebar nav tabs + tab content cards
  if (variant === "guide") {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-6 max-w-6xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Guide Sidebar Navigation Menu */}
          <div className="w-full lg:w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <div className="w-5 h-5 rounded bg-amber-500/30" />
              <div className="w-32 h-5 bg-amber-500/20 rounded" />
            </div>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-10 rounded-2xl px-4 flex items-center gap-2.5 shrink-0 ${
                  i === 0 ? 'w-full bg-emerald-600/40 border border-emerald-500/30' : 'w-36 lg:w-full bg-slate-950 border border-slate-800'
                }`}>
                  <div className="w-4 h-4 rounded bg-slate-700 shrink-0" />
                  <div className="w-24 h-3.5 bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Main Guide Content Panel */}
          <div className="flex-1 w-full space-y-5">
            {/* Guide Hero Card */}
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/8 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="w-48 h-7 bg-slate-800 rounded-lg" />
              <div className="w-full max-w-lg h-4 bg-slate-800/60 rounded" />
              <div className="w-3/4 h-4 bg-slate-800/40 rounded" />
            </div>

            {/* Guide Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 shrink-0" />
                    <div className="w-36 h-5 bg-slate-800 rounded-md" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-3.5 bg-slate-800/80 rounded" />
                    <div className="w-4/5 h-3 bg-slate-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
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

  // 13. Match Page Skeleton — faithful layout with header, tabs, pitch preview, sign-up list
  if (variant === "match") {
    return (
      <div className="space-y-5 w-full max-w-6xl mx-auto p-4" dir={isAr ? "rtl" : "ltr"}>
        {/* Match Header Card */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-5 md:p-7 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/8 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="w-32 h-4 bg-slate-800 rounded-lg" />
              </div>
              <div className="w-52 h-7 bg-slate-800 rounded-xl" />
              <div className="w-40 h-3.5 bg-slate-800/60 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="w-28 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl" />
              <div className="w-10 h-10 bg-slate-800 rounded-2xl" />
            </div>
          </div>
          {/* Match info pills row */}
          <div className="flex flex-wrap gap-2">
            {["w-24", "w-32", "w-20", "w-28"].map((w, i) => (
              <div key={i} className={`${w} h-7 bg-slate-800/70 rounded-full`} />
            ))}
          </div>
        </div>

        {/* Tabs bar */}
        <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800 flex gap-2">
          <div className="flex-1 h-10 bg-gradient-to-r from-emerald-600/30 to-teal-600/20 border border-emerald-500/30 rounded-xl" />
          <div className="flex-1 h-10 bg-slate-800/50 rounded-xl" />
        </div>

        {/* Main 2-col content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* Pitch + Teams column */}
          <div className="space-y-5">
            {/* Pitch display */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="w-40 h-5 bg-slate-800 rounded-md mb-4" />
              <div className="w-full aspect-[4/3] bg-emerald-950/40 border-2 border-emerald-500/20 rounded-2xl relative overflow-hidden">
                {/* pitch lines */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/20" />
                {/* player dots grid Team A */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-2 p-6">
                  {[...Array(11)].map((_, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-emerald-500/40 border-2 border-emerald-400/60 shadow-md shadow-emerald-500/30 mx-auto" />
                  ))}
                </div>
              </div>
            </div>

            {/* Team A vs B cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["emerald", "blue"].map((color, t) => (
                <div key={t} className={`bg-slate-900 border border-${color}-500/20 rounded-3xl p-4 shadow-xl relative overflow-hidden space-y-3`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl bg-${color}-500/20 border border-${color}-500/30`} />
                    <div className="w-24 h-5 bg-slate-800 rounded-md" />
                    <div className={`w-12 h-7 bg-${color}-500/20 rounded-xl`} />
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 shrink-0" />
                      <div className="w-24 h-4 bg-slate-800 rounded" />
                      <div className="ml-auto w-8 h-4 bg-slate-800/60 rounded" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar: sign-up list */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-3">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center justify-between">
                <div className="w-36 h-5 bg-slate-800 rounded-md" />
                <div className="w-12 h-6 bg-emerald-500/20 rounded-full" />
              </div>
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="w-28 h-3.5 bg-slate-800 rounded" />
                    <div className="w-16 h-3 bg-slate-800/60 rounded" />
                  </div>
                  <div className="w-10 h-5 bg-emerald-500/20 rounded-full shrink-0" />
                </div>
              ))}
            </div>
            {/* Prediction widget skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl relative overflow-hidden space-y-3">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="w-32 h-4 bg-slate-800 rounded-md" />
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-emerald-500/20 rounded-xl" />
                <div className="flex-1 h-10 bg-slate-800 rounded-xl" />
                <div className="flex-1 h-10 bg-blue-500/20 rounded-xl" />
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex gap-0.5">
                <div className="h-full bg-emerald-500/50 rounded-full" style={{width:'55%'}} />
                <div className="h-full bg-blue-500/50 rounded-full flex-1" />
              </div>
            </div>
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

  // 15. Captain Draft Room Skeleton
  if (variant === "draft-room") {
    return (
      <div className="space-y-8 w-full max-w-7xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header & Controls Bar */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="space-y-3 min-w-0 w-full md:w-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-56 h-8 bg-slate-800 rounded-xl" />
              <div className="w-28 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full" />
            </div>
            <div className="w-80 max-w-full h-4 bg-slate-800/60 rounded-md" />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div className="w-28 h-4 bg-emerald-500/20 rounded" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-amber-500/20" />
              </div>
            </div>
            <div className="w-36 h-10 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Team A vs Team B OVR Gauges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A Gauge Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40" />
                <div>
                  <div className="w-32 h-5 bg-slate-800 rounded-md" />
                  <div className="w-20 h-3 bg-slate-800/60 rounded mt-1" />
                </div>
              </div>
              <div className="w-16 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex flex-col items-center justify-center">
                <div className="w-10 h-6 bg-emerald-500/30 rounded" />
              </div>
            </div>
            {/* OVR & PSI Progress Bars */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <div className="w-24 h-3 bg-slate-800 rounded" />
                <div className="w-12 h-3 bg-slate-800 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div className="h-full w-4/5 bg-emerald-500/40 rounded-full" />
              </div>
            </div>
            {/* Positional Coverage Badges */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {['GK', 'DEF', 'MID', 'ATT'].map((pos) => (
                <div key={pos} className="h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-1.5">
                  <div className="w-6 h-3 bg-slate-800 rounded" />
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Team B Gauge Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40" />
                <div>
                  <div className="w-32 h-5 bg-slate-800 rounded-md" />
                  <div className="w-20 h-3 bg-slate-800/60 rounded mt-1" />
                </div>
              </div>
              <div className="w-16 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex flex-col items-center justify-center">
                <div className="w-10 h-6 bg-blue-500/30 rounded" />
              </div>
            </div>
            {/* OVR & PSI Progress Bars */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <div className="w-24 h-3 bg-slate-800 rounded" />
                <div className="w-12 h-3 bg-slate-800 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div className="h-full w-3/4 bg-blue-500/40 rounded-full" />
              </div>
            </div>
            {/* Positional Coverage Badges */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {['GK', 'DEF', 'MID', 'ATT'].map((pos) => (
                <div key={pos} className="h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-1.5">
                  <div className="w-6 h-3 bg-slate-800 rounded" />
                  <div className="w-4 h-4 rounded-full bg-blue-500/20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Draft Pool Filter & Player Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map((filter, i) => (
                <div key={i} className={`w-16 h-8 rounded-xl ${i === 0 ? 'bg-emerald-600/30 border border-emerald-500/40' : 'bg-slate-800'}`} />
              ))}
            </div>
            <div className="w-44 h-8 bg-slate-800 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="w-24 h-4 bg-slate-800 rounded" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-3.5 bg-emerald-500/20 rounded" />
                      <div className="w-10 h-3.5 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                </div>
                <div className="h-9 w-full bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <div className="w-20 h-4 bg-emerald-500/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 16. Live Spectator Broadcaster Skeleton
  if (variant === "live-broadcaster") {
    return (
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Scoreboard Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <div className="w-24 h-4 bg-rose-500/20 rounded" />
            </div>
            <div className="w-32 h-6 bg-slate-800 rounded-xl" />
          </div>

          <div className="grid grid-cols-3 items-center text-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40" />
              <div className="w-28 h-5 bg-slate-800 rounded-md" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
                <div className="w-16 h-7 bg-emerald-500/30 rounded-lg" />
              </div>
              <div className="w-16 h-4 bg-amber-500/20 rounded" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40" />
              <div className="w-28 h-5 bg-slate-800 rounded-md" />
            </div>
          </div>
        </div>

        {/* Pressure Momentum Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="flex justify-between items-center text-xs">
            <div className="w-36 h-4 bg-emerald-500/20 rounded" />
            <div className="w-24 h-4 bg-slate-800 rounded" />
            <div className="w-36 h-4 bg-blue-500/20 rounded text-right" />
          </div>
          <div className="h-4 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative flex">
            <div className="h-full bg-emerald-500/50" style={{ width: '58%' }} />
            <div className="w-1 h-full bg-amber-400 z-10 shadow-[0_0_10px_#f59e0b]" />
            <div className="h-full bg-blue-500/50 flex-1" />
          </div>
        </div>

        {/* Main Content Grid: 2D Radar Pitch + Live Commentary Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 2D Radar Pitch */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex justify-between items-center">
              <div className="w-40 h-5 bg-slate-800 rounded-md" />
              <div className="w-20 h-7 bg-emerald-500/20 rounded-lg" />
            </div>
            {/* Tactical Pitch Box */}
            <div className="w-full aspect-[16/10] bg-emerald-950/40 border-2 border-emerald-500/30 rounded-2xl relative p-4 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-emerald-500/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-emerald-500/20" />
              {/* Pitch Player Dot Markers */}
              <div className="grid grid-cols-4 gap-8 h-full items-center relative z-10 p-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 rounded-full bg-emerald-300 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Commentary Feed */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4 flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className="flex items-center justify-between">
              <div className="w-44 h-5 bg-slate-800 rounded-md" />
              <div className="w-8 h-8 rounded-full bg-slate-800" />
            </div>

            <div className="space-y-3 flex-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-5 bg-amber-500/20 border border-amber-500/30 rounded-md" />
                      <div className="w-20 h-4 bg-emerald-500/20 rounded" />
                    </div>
                    <div className="w-12 h-3 bg-slate-800 rounded" />
                  </div>
                  <div className="w-full h-4 bg-slate-800/70 rounded" />
                  <div className="w-3/4 h-3 bg-slate-800/40 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 17. Retro Sports Newspaper Skeleton
  if (variant === "newspaper") {
    return (
      <div className="space-y-8 w-full max-w-5xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Vintage Header Controls Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          <div className="text-center space-y-2">
            <div className="w-36 h-6 bg-amber-500/20 rounded-full mx-auto" />
            <div className="w-64 h-8 bg-slate-800 rounded-xl mx-auto" />
            <div className="w-96 max-w-full h-4 bg-slate-800/60 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-950 border border-slate-800 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Newspaper Cover Frame */}
        <div className="bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          {/* Newspaper Masthead */}
          <div className="border-b-4 border-slate-800 pb-4 text-center space-y-3">
            <div className="w-80 max-w-full h-12 bg-amber-500/20 rounded-2xl mx-auto" />
            <div className="flex justify-between items-center text-xs px-4">
              <div className="w-24 h-3 bg-slate-800 rounded" />
              <div className="w-32 h-3 bg-slate-800 rounded" />
              <div className="w-20 h-3 bg-slate-800 rounded" />
            </div>
          </div>

          {/* Headline & MOTM Spotlight Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* MOTM Spotlight Card */}
            <div className="md:col-span-5 bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="w-32 h-6 bg-amber-500/20 rounded-lg mx-auto" />
              <div className="w-32 h-32 rounded-2xl bg-slate-800 mx-auto border-2 border-slate-700" />
              <div className="space-y-2 text-center">
                <div className="w-36 h-5 bg-slate-800 rounded mx-auto" />
                <div className="w-20 h-7 bg-amber-500/30 rounded-xl mx-auto" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-slate-900 p-2 rounded-lg text-center space-y-1">
                    <div className="w-8 h-4 bg-slate-800 rounded mx-auto" />
                    <div className="w-10 h-3 bg-slate-800/60 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Match Analysis & Headline */}
            <div className="md:col-span-7 space-y-4">
              <div className="w-full h-10 bg-slate-800 rounded-xl" />
              <div className="w-3/4 h-6 bg-amber-500/20 rounded-lg" />
              <div className="space-y-2 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-3.5 bg-slate-800/60 rounded" />
                ))}
              </div>

              {/* Tactical Lineup Highlights */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-emerald-500/20 rounded" />
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-28 h-3 bg-slate-800/60 rounded" />
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-blue-500/20 rounded" />
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-28 h-3 bg-slate-800/60 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 18. Pitch Split Bill Calculator Skeleton
  if (variant === "split-bill") {
    return (
      <div className="space-y-8 w-full max-w-4xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Total Rent Collection Meter Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="w-48 h-7 bg-slate-800 rounded-xl" />
              <div className="w-64 h-4 bg-slate-800/60 rounded-md" />
            </div>
            <div className="w-36 h-10 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl shrink-0" />
          </div>

          {/* Collection Gauge Meter */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-32 h-4 bg-slate-800 rounded" />
              <div className="w-24 h-6 bg-emerald-500/20 rounded-lg" />
            </div>
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
            </div>
            <div className="flex justify-between text-xs">
              <div className="w-28 h-3 bg-slate-800/60 rounded" />
              <div className="w-28 h-3 bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>

        {/* Per-Player Payment Status Rows */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="w-40 h-5 bg-slate-800 rounded-md" />
            <div className="w-28 h-8 bg-slate-800 rounded-xl" />
          </div>

          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="w-32 h-4 bg-slate-800 rounded" />
                  <div className="w-20 h-3 bg-slate-800/60 rounded" />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-16 h-6 bg-slate-800 rounded-lg" />
                <div className={`w-24 h-9 rounded-xl ${i % 2 === 0 ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-amber-500/20 border border-amber-500/40'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 19. Playstyle Skill Tree Skeleton
  if (variant === "skill-tree") {
    return (
      <div className="space-y-8 w-full max-w-5xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* XP Level Badge Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center shrink-0">
              <div className="w-10 h-10 rounded-full bg-amber-500/30" />
            </div>
            <div className="space-y-2">
              <div className="w-48 h-7 bg-slate-800 rounded-xl" />
              <div className="w-64 h-4 bg-slate-800/60 rounded-md" />
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs">
              <div className="w-16 h-3 bg-slate-800 rounded" />
              <div className="w-12 h-3 bg-amber-500/30 rounded" />
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full w-2/3 bg-amber-500/50 rounded-full" />
            </div>
          </div>
        </div>

        {/* 6 Skill Node Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30" />
                <div className="w-16 h-6 bg-slate-800 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="w-36 h-5 bg-slate-800 rounded" />
                <div className="w-full h-3.5 bg-slate-800/60 rounded" />
                <div className="w-4/5 h-3 bg-slate-800/40 rounded" />
              </div>
              <div className="h-10 w-full bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center">
                <div className="w-24 h-4 bg-amber-500/30 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Attribute Progress Meters Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="w-48 h-5 bg-slate-800 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="w-20 h-3 bg-slate-800 rounded" />
                  <div className="w-10 h-3 bg-slate-800 rounded" />
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500/40 rounded-full" style={{ width: `${85 - i * 12}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 20. Derby Rivalries H2H Skeleton
  if (variant === "derby") {
    return (
      <div className="space-y-8 w-full max-w-6xl mx-auto p-4 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Derby Header & Rival Badges */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          <div className="w-48 h-6 bg-rose-500/20 rounded-full mx-auto" />
          <div className="w-72 max-w-full h-8 bg-slate-800 rounded-xl mx-auto" />

          {/* Captain H2H Badges */}
          <div className="flex items-center justify-center gap-8 py-2">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/40" />
              <div className="w-24 h-4 bg-slate-800 rounded" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-rose-500">
              VS
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/40" />
              <div className="w-24 h-4 bg-slate-800 rounded" />
            </div>
          </div>
        </div>

        {/* Head-to-Head Comparison Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          <div className="w-44 h-5 bg-slate-800 rounded-md" />

          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="w-10 h-3 bg-rose-500/30 rounded" />
                  <div className="w-24 h-3 bg-slate-800 rounded" />
                  <div className="w-10 h-3 bg-blue-500/30 rounded" />
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex">
                  <div className="h-full bg-rose-500/50" style={{ width: `${55 - i * 5}%` }} />
                  <div className="h-full bg-blue-500/50 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historic Derby Match Log Cards */}
        <div className="space-y-4">
          <div className="w-44 h-5 bg-slate-800 rounded-md" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="space-y-1">
                    <div className="w-36 h-4 bg-slate-800 rounded" />
                    <div className="w-24 h-3 bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className="w-20 h-7 bg-emerald-500/20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default / Home Page Skeleton — faithful layout: hero stat cards + community cards + feature CTAs
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 max-w-7xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"} suppressHydrationWarning>
      {/* Hero header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/8 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-amber-500/5" />
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-400/30 animate-pulse" />
            <div className="w-28 h-4 bg-slate-800 rounded-full" />
          </div>
          <div className="w-72 h-10 bg-slate-800 rounded-2xl" />
          <div className="w-56 h-10 bg-slate-800/70 rounded-2xl" />
          <div className="space-y-2">
            <div className="w-full max-w-sm h-3.5 bg-slate-800/60 rounded" />
            <div className="w-4/5 max-w-xs h-3 bg-slate-800/40 rounded" />
          </div>
          <div className="flex gap-3 mt-2">
            <div className="w-36 h-11 bg-emerald-600/30 border border-emerald-500/30 rounded-2xl" />
            <div className="w-28 h-11 bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Stat counter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {["emerald", "amber", "blue", "rose"].map((color, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/30 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className={`w-9 h-9 rounded-2xl bg-${color}-500/20 border border-${color}-500/30 mb-3`} />
            <div className="w-14 h-7 bg-slate-800 rounded-xl mb-1" />
            <div className="w-20 h-3 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Community cards grid */}
      <div className="space-y-3">
        <div className="w-40 h-5 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 shrink-0" />
                <div className="space-y-2">
                  <div className="w-32 h-5 bg-slate-800 rounded-md" />
                  <div className="flex gap-1">
                    <div className="w-10 h-4 bg-emerald-500/20 rounded-md" />
                    <div className="w-10 h-4 bg-slate-800 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="w-36 h-3 bg-slate-800/70 rounded" />
                <div className="w-24 h-3 bg-slate-800/50 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-9 bg-emerald-600/20 border border-emerald-500/30 rounded-xl" />
                <div className="flex-1 h-9 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature CTA banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[["emerald", "amber"], ["blue", "rose"]].map(([c1, c2], i) => (
          <div key={i} className={`bg-gradient-to-br from-${c1}-950/60 to-slate-900 border border-${c1}-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
            <div className={`w-10 h-10 rounded-2xl bg-${c1}-500/20 border border-${c1}-500/30`} />
            <div className="w-36 h-5 bg-slate-800 rounded-lg" />
            <div className="w-full h-3.5 bg-slate-800/60 rounded" />
            <div className="w-4/5 h-3 bg-slate-800/40 rounded" />
            <div className={`w-28 h-9 bg-${c1}-600/20 border border-${c1}-500/30 rounded-xl`} />
          </div>
        ))}
      </div>
    </div>
  );
}
