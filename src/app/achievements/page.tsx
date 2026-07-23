"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { getPlayerAchievements } from "@/lib/achievements";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Target, Handshake, Star, Sparkles, Zap, Shield, Lock,
  CheckCircle2, BarChart3, TrendingUp, Award, Medal, Crown, Filter
} from "lucide-react";
import { getPlayerOverall } from "@/lib/playerUtils";

type FilterTab = "all" | "earned" | "inProgress" | "locked";

function getAchievementRarity(achievement: any): "gold" | "silver" | "bronze" | "locked" {
  if (!achievement.earned) return "locked";
  const pct = achievement.target > 0 ? achievement.current / achievement.target : 0;
  if (pct >= 1 && achievement.target >= 10) return "gold";
  if (pct >= 0.8) return "silver";
  return "bronze";
}

const RARITY_CONFIG = {
  gold:   { bg: "from-yellow-500/20 to-amber-500/10",   border: "border-yellow-400/50",  badge: "bg-yellow-500 text-white", label: "Gold",   icon: "🥇" },
  silver: { bg: "from-slate-400/15 to-slate-300/5",      border: "border-slate-400/40",   badge: "bg-slate-400 text-white",  label: "Silver", icon: "🥈" },
  bronze: { bg: "from-orange-500/15 to-amber-600/5",     border: "border-orange-400/40",  badge: "bg-orange-500 text-white", label: "Bronze", icon: "🥉" },
  locked: { bg: "from-slate-800/20 to-slate-900/10",     border: "border-slate-600/30",   badge: "bg-slate-700 text-slate-300", label: "Locked", icon: "🔒" },
};

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border p-4 bg-white dark:bg-slate-900 ${color} shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2">{icon}</div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
            {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>}
          </div>
        </div>
        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
      </div>
    </motion.div>
  );
}

function ProgressRing({ earned, total, size = 80 }: { earned: number; total: number; size?: number }) {
  const pct = total > 0 ? earned / total : 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-slate-200 dark:text-slate-700" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="url(#progGrad)" strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="progGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{earned}</span>
        <span className="text-[10px] text-slate-400 leading-none">/{total}</span>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, isAr }: { achievement: any; isAr: boolean }) {
  const rarity = getAchievementRarity(achievement);
  const cfg = RARITY_CONFIG[rarity];
  const pct = achievement.target > 0 ? Math.min(100, Math.round((achievement.current / achievement.target) * 100)) : 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border bg-gradient-to-br ${cfg.bg} ${cfg.border} p-4 overflow-hidden transition-all duration-200`}
    >
      {/* Rarity badge */}
      <div className={`absolute top-3 ${isAr ? 'left-3' : 'right-3'} text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.badge} flex items-center gap-1`}>
        <span>{cfg.icon}</span>
        <span>{isAr ? (rarity === 'gold' ? 'ذهبي' : rarity === 'silver' ? 'فضي' : rarity === 'bronze' ? 'برونزي' : 'مقفل') : cfg.label}</span>
      </div>

      {/* Locked overlay */}
      {rarity === "locked" && (
        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10 pointer-events-none">
          <Lock className="w-5 h-5 text-slate-400 opacity-60" />
        </div>
      )}

      <div className="flex items-start gap-3 mb-4 pr-16 rtl:pr-0 rtl:pl-16">
        <span className="text-2xl shrink-0">{achievement.icon}</span>
        <div className="min-w-0">
          <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">
            {isAr ? achievement.nameAr : achievement.nameEn}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-tight">
            {isAr ? achievement.descriptionAr : achievement.descriptionEn}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
          <span>{isAr ? "التقدم" : "Progress"}</span>
          <span>{isAr ? achievement.progressAr : achievement.progressEn} ({pct}%)</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${rarity === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : rarity === 'silver' ? 'bg-gradient-to-r from-slate-400 to-slate-300' : rarity === 'locked' ? 'bg-slate-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const ref = doc(db, "players", user.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setPlayer(null); setLoading(false); return; }
      const data = snap.data();
      setPlayer({ uid: snap.id, ...data, attributes: data.attributes || {}, stats: data.stats || {} } as PlayerProfile);
      setLoading(false);
    }, async () => {
      setLoading(false);
      try {
        const fallbackSnap = await getDoc(ref);
        if (fallbackSnap.exists()) {
          const data = fallbackSnap.data();
          setPlayer({ uid: fallbackSnap.id, ...data, attributes: data.attributes || {}, stats: data.stats || {} } as PlayerProfile);
        }
      } catch (error) { console.error(error); }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const rawAchievements = player ? getPlayerAchievements(player, isAr ? "ar" : "en") : [];
  const achievementsMap: Record<string, any> = {};
  rawAchievements.forEach((a) => { achievementsMap[a.id] = a; });
  const allAchievements = Object.values(achievementsMap);

  const earned = allAchievements.filter((a) => a.earned);
  const inProgress = allAchievements.filter((a) => !a.earned && a.current > 0);
  const locked = allAchievements.filter((a) => !a.earned && a.current === 0);

  const goldCount = earned.filter((a) => getAchievementRarity(a) === "gold").length;
  const silverCount = earned.filter((a) => getAchievementRarity(a) === "silver").length;
  const bronzeCount = earned.filter((a) => getAchievementRarity(a) === "bronze").length;

  const trophyCount = player?.trophies?.length || 0;
  const matchesPlayed = player?.stats?.matchesPlayed || 0;
  const ovr = player ? getPlayerOverall(player) : 0;

  const filteredAchievements = useMemo(() => {
    if (filter === "earned") return earned;
    if (filter === "inProgress") return inProgress;
    if (filter === "locked") return locked;
    return allAchievements;
  }, [filter, allAchievements, earned, inProgress, locked]);

  const filterTabs: { id: FilterTab; label: string; labelAr: string; count: number; color: string }[] = [
    { id: "all",        label: "All",         labelAr: "الكل",       count: allAchievements.length, color: "text-slate-700 dark:text-slate-200" },
    { id: "earned",     label: "Earned",      labelAr: "مكتسبة",     count: earned.length,          color: "text-emerald-600 dark:text-emerald-400" },
    { id: "inProgress", label: "In Progress", labelAr: "جارٍ",       count: inProgress.length,      color: "text-amber-600 dark:text-amber-400" },
    { id: "locked",     label: "Locked",      labelAr: "مقفلة",      count: locked.length,          color: "text-slate-500 dark:text-slate-500" },
  ];

  if (!user) return null;
  if (loading) return <SiteSkeletonLoader variant="profile" />;

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-3xl font-black">{isAr ? "ملف اللاعب غير متوفر" : "Player profile not found"}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm text-center max-w-xl">
          {isAr ? "يجب أن تنشئ ملف لاعب أولاً حتى تتمكن من عرض إنجازاتك." : "You need to create your player profile first to view achievements."}
        </p>
        <Link href="/onboarding" className="mt-6 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 transition-all">
          {isAr ? "إنشاء ملف اللاعب" : "Create Player Profile"}
        </Link>
      </div>
    );
  }

  const photo = player?.photoUrl || player?.googlePic || (player as any)?.photoURL || "";


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

          {/* ── Hero Header ─────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border border-slate-700 shadow-2xl p-6 sm:p-8">
            {/* Ambient glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Player Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20">
                  {photo ? (
                    <Image src={photo} alt={player.fullName} width={96} height={96} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-3xl">
                      {player.cardName?.charAt(0) || player.fullName?.charAt(0) || "P"}
                    </div>
                  )}
                </div>
                {/* OVR badge */}
                <div className="absolute -bottom-2 -right-2 rtl:-bottom-2 rtl:-left-2 rtl:right-auto w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-[9px] font-bold leading-none opacity-80">OVR</span>
                  <span className="text-sm font-black leading-none">{ovr}</span>
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 text-center sm:text-start rtl:sm:text-right min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400 mb-1">
                  {isAr ? "سجل الإنجازات" : "Achievements & Records"}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
                  {player.cardName || player.fullName}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {player.primaryPosition} {player.playStyle ? `• ${player.playStyle.replace(/_/g, " ")}` : ""}
                </p>

                {/* Rarity breakdown */}
                <div className="flex flex-wrap justify-center sm:justify-start rtl:sm:justify-end gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-400">
                    <span>🥇</span><span>{goldCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-300">
                    <span>🥈</span><span>{silverCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-orange-400">
                    <span>🥉</span><span>{bronzeCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-400">
                    <Trophy className="w-4 h-4" /><span>{trophyCount}</span>
                  </div>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <ProgressRing earned={earned.length} total={allAchievements.length} size={88} />
                <p className="text-xs text-slate-400 font-bold">
                  {isAr ? "الإنجازات" : "Achievements"}
                </p>
              </div>
            </div>
          </section>

          {/* ── Quick Stats Row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<Target className="w-4 h-4 text-emerald-500" />} label={isAr ? "الأهداف" : "Goals"} value={player.stats?.goals || 0} sub={isAr ? "إجمالي" : "Total"} color="border-emerald-200 dark:border-emerald-700/40" />
            <StatCard icon={<Handshake className="w-4 h-4 text-cyan-500" />} label={isAr ? "التمريرات" : "Assists"} value={player.stats?.assists || 0} sub={isAr ? "إجمالي" : "Total"} color="border-cyan-200 dark:border-cyan-700/40" />
            <StatCard icon={<Star className="w-4 h-4 text-amber-500" />} label={isAr ? "MVP" : "MVPs"} value={player.stats?.mvp || 0} sub={isAr ? "أفضل لاعب" : "Best Player"} color="border-amber-200 dark:border-amber-700/40" />
            <StatCard icon={<Sparkles className="w-4 h-4 text-blue-500" />} label={isAr ? "المباريات" : "Matches"} value={matchesPlayed} sub={isAr ? "مُلعبت" : "Played"} color="border-blue-200 dark:border-blue-700/40" />
          </div>

          {/* ── Main Content Grid ────────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

            {/* Left: Achievement List */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {isAr ? "قائمة الإنجازات" : "Achievement List"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? `${earned.length} من ${allAchievements.length} مكتسبة` : `${earned.length} of ${allAchievements.length} earned`}
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 flex-wrap">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        filter === tab.id
                          ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {isAr ? tab.labelAr : tab.label}
                      <span className={`text-[10px] font-black ${filter === tab.id ? tab.color : ""}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={filter}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {filteredAchievements.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-600">
                      <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-bold">
                        {isAr ? "لا توجد إنجازات في هذه الفئة بعد" : "No achievements in this category yet"}
                      </p>
                    </div>
                  ) : (
                    filteredAchievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} isAr={isAr} />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Sidebar */}
            <aside className="space-y-5">
              {/* Trophy Cabinet */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">{isAr ? "خزانة الجوائز" : "Trophy Cabinet"}</p>
                    <p className="text-[10px] text-slate-400">{isAr ? `${trophyCount} ألقاب` : `${trophyCount} trophies`}</p>
                  </div>
                </div>

                {trophyCount === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-5 text-center">
                    <span className="text-3xl">🏆</span>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                      {isAr ? "لم تحصل على ألقاب بعد. سجل أهدافاً ومباريات أكثر." : "No trophies yet. Score more goals and matches."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {player.trophies?.map((trophy, idx) => {
                      const emoji = trophy.name.includes("Golden Boot") || trophy.name.includes("Boot") ? "⚽" :
                                    trophy.name.includes("Ballon") ? "👑" :
                                    trophy.name.includes("Playmaker") ? "🎯" :
                                    trophy.name.includes("MVP") ? "⭐" :
                                    trophy.name.includes("Shield") ? "🛡️" : "🏆";
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                        >
                          <span className="text-xl">{emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{trophy.name}</p>
                            <p className="text-[10px] text-slate-400">{trophy.season || (isAr ? "بدون موسم" : "No season")}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Extended Stats */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                <p className="font-black text-sm text-slate-900 dark:text-white mb-3">{isAr ? "إحصائيات متقدمة" : "Extended Stats"}</p>
                {[
                  { icon: <Target className="w-4 h-4 text-emerald-500" />, label: isAr ? "أهداف/مباراة" : "Goals/Match", value: matchesPlayed > 0 ? ((player.stats?.goals || 0) / matchesPlayed).toFixed(2) : "0.00" },
                  { icon: <Handshake className="w-4 h-4 text-cyan-500" />, label: isAr ? "تمريرات/مباراة" : "Assists/Match", value: matchesPlayed > 0 ? ((player.stats?.assists || 0) / matchesPlayed).toFixed(2) : "0.00" },
                  { icon: <span className="text-yellow-500 text-sm">🟨</span>, label: isAr ? "الكروت الصفراء" : "Yellow Cards", value: player.stats?.yellowCards || 0 },
                  { icon: <span className="text-red-500 text-sm">🟥</span>, label: isAr ? "الكروت الحمراء" : "Red Cards", value: player.stats?.redCards || 0 },
                ].map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-white dark:bg-slate-800 p-1.5 border border-slate-100 dark:border-slate-700">{stat.icon}</div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stat.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* How to earn */}
              <div className="rounded-2xl bg-slate-100 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                <p className="font-black mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  {isAr ? "كيفية كسب الجوائز" : "How to Earn Awards"}
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <li>{isAr ? "سجل أهدافاً وتمريرات في المباريات لجوائز الهداف." : "Score goals & assists in matches for scorer awards."}</li>
                  <li>{isAr ? "احصل على تقييم أفضل لاعب للحصول على جوائز MVP." : "Earn MVP ratings for outstanding match performances."}</li>
                  <li>{isAr ? "أكمل مزيداً من المباريات لإنجازات المشاركة." : "Complete more matches to unlock participation achievements."}</li>
                  <li>{isAr ? "اجمع ألقاب الموسم خلال حفل التتويج." : "Collect season trophies during the ceremony."}</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
