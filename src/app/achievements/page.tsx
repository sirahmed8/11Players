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
  CheckCircle2, BarChart3, TrendingUp, Award, Medal, Crown, Filter, ChevronRight, Share2
} from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
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
  gold:   { bg: "bg-slate-900", border: "border-amber-500/60", badge: "bg-amber-500 text-slate-950 font-black", label: "Gold Tier", icon: "🥇", bar: "bg-amber-500" },
  silver: { bg: "bg-slate-900", border: "border-slate-600/70",  badge: "bg-slate-400 text-slate-950 font-black", label: "Silver Tier", icon: "🥈", bar: "bg-slate-400" },
  bronze: { bg: "bg-slate-900", border: "border-orange-500/60", badge: "bg-orange-500 text-white font-black",    label: "Bronze Tier", icon: "🥉", bar: "bg-orange-500" },
  locked: { bg: "bg-slate-950/80", border: "border-slate-800", badge: "bg-slate-800 text-slate-400 font-bold",  label: "Locked", icon: "🔒", bar: "bg-slate-800" },
};

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-3xl border border-slate-800 p-5 bg-slate-900 shadow-xl flex flex-col justify-between"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
          {icon}
        </div>
        <span className="text-3xl font-black text-white tabular-nums shrink-0">{value}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider truncate">{label}</p>
        {sub && <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function ProgressRing({ earned, total, size = 80 }: { earned: number; total: number; size?: number }) {
  const pct = total > 0 ? earned / total : 0;
  const strokeWidth = 7;
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-800/80" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#10b981" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-base font-black text-white leading-none">{earned}</span>
        <span className="text-[10px] font-bold text-slate-400 leading-none mt-0.5">/{total}</span>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, isAr, player }: { achievement: any; isAr: boolean; player?: PlayerProfile | null }) {
  const pct = achievement.target > 0 ? Math.min(100, Math.round((achievement.current / achievement.target) * 100)) : 0;
  const isEarned = achievement.earned;
  const isAllCompleted = achievement.isAllCompleted;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl border ${
        isAllCompleted
          ? "border-amber-500/80 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 shadow-amber-500/10"
          : isEarned
          ? "border-emerald-500/60 bg-slate-900 shadow-emerald-500/10"
          : "border-slate-800 bg-slate-900/90"
      } p-5 overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between`}
    >
      {/* Tier Badge & Status */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl text-[11px] font-black text-amber-400">
          <span>🏆</span>
          <span>
            {isAr
              ? `المستوى ${achievement.currentTierLevel} من ${achievement.maxTierLevel}`
              : `Tier ${achievement.currentTierLevel} of ${achievement.maxTierLevel}`}
          </span>
        </div>

        {isAllCompleted ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-xl">
            <Crown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            {isAr ? "مكتمل بالكامل 👑" : "FULLY COMPLETED 👑"}
          </span>
        ) : isEarned ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-xl">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {isAr ? "مكتمل" : "UNLOCKED"}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl">
            {pct}%
          </span>
        )}
      </div>

      {/* Main icon & text */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
          {achievement.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-base text-white leading-tight">
            {isAr ? achievement.nameAr : achievement.nameEn}
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed font-medium">
            {isAr ? achievement.descriptionAr : achievement.descriptionEn}
          </p>
        </div>
      </div>

      {/* Tier Steps Dots Bar */}
      {Array.isArray(achievement.tiers) && achievement.tiers.length > 0 && (
        <div className="mb-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-slate-400">
            <span>{isAr ? "سلسلة الإنجاز" : "Tier Sequence"}</span>
            <span className="text-emerald-400 font-black">{achievement.completedTiersCount}/{achievement.maxTierLevel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {achievement.tiers.map((t: any, idx: number) => {
              const isTierDone = achievement.current >= t.target;
              const isCurrentTier = idx + 1 === achievement.currentTierLevel;
              return (
                <div
                  key={idx}
                  title={`${isAr ? t.nameAr : t.nameEn}: ${t.target}`}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    isTierDone
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                      : isCurrentTier
                      ? "bg-amber-500 animate-pulse"
                      : "bg-slate-800"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Progress track */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
          <span>{isAr ? "التقدم الحالي" : "Current Progress"}</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-black">{isAr ? achievement.progressAr : achievement.progressEn}</span>
            <button
              type="button"
              onClick={async () => {
                try {
                  try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } }); } catch (e) {}
                  
                  const title = isAr ? achievement.nameAr : achievement.nameEn;
                  const desc = isAr ? achievement.descriptionAr : achievement.descriptionEn;
                  
                  const canvas = document.createElement("canvas");
                  canvas.width = 600;
                  canvas.height = 600;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;

                  // Dark Background Gradient
                  const bgGradient = ctx.createLinearGradient(0, 0, 600, 600);
                  bgGradient.addColorStop(0, "#0b1322");
                  bgGradient.addColorStop(0.5, "#070b14");
                  bgGradient.addColorStop(1, "#04060a");
                  ctx.fillStyle = bgGradient;
                  ctx.fillRect(0, 0, 600, 600);

                  // Glowing Border Frame
                  ctx.strokeStyle = "#10b981";
                  ctx.lineWidth = 6;
                  ctx.beginPath();
                  ctx.roundRect(15, 15, 570, 570, 32);
                  ctx.stroke();

                  // 11PLAYERS Watermark Header
                  ctx.fillStyle = "#10b981";
                  ctx.font = "900 24px system-ui, sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText("11PLAYERS ELITE", 300, 60);

                  // Subtitle
                  ctx.fillStyle = "#94a3b8";
                  ctx.font = "700 14px system-ui, sans-serif";
                  ctx.fillText("OFFICIAL ACHIEVEMENT UNLOCKED 🏆", 300, 85);

                  // Draw Large Achievement Icon
                  ctx.fillStyle = "#0f172a";
                  ctx.strokeStyle = "rgba(16,185,129,0.4)";
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.arc(300, 170, 55, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.stroke();

                  ctx.font = "50px system-ui, sans-serif";
                  ctx.fillText(achievement.icon || "🏆", 300, 186);

                  // Achievement Title & Description
                  ctx.fillStyle = "#ffffff";
                  ctx.font = "900 24px system-ui, sans-serif";
                  ctx.fillText(title, 300, 260);

                  ctx.fillStyle = "#cbd5e1";
                  ctx.font = "600 15px system-ui, sans-serif";
                  ctx.fillText(desc, 300, 292);

                  // Player Profile Section Card Box
                  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
                  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.roundRect(60, 335, 480, 160, 24);
                  ctx.fill();
                  ctx.stroke();

                  // Player Info
                  const pName = player?.cardName || player?.fullName || "Captain Ahmed";
                  const pOvr = player ? getPlayerOverall(player) : 72;
                  const pPos = player?.primaryPosition || "DMF";

                  ctx.fillStyle = "#fbbf24";
                  ctx.font = "900 36px system-ui, sans-serif";
                  ctx.fillText(`${pOvr} OVR`, 300, 390);

                  ctx.fillStyle = "#ffffff";
                  ctx.font = "900 22px system-ui, sans-serif";
                  ctx.fillText(`${pName} • ${pPos}`, 300, 430);

                  ctx.fillStyle = "#94a3b8";
                  ctx.font = "700 13px system-ui, sans-serif";
                  ctx.fillText(`Unlocked on 11Players Platform`, 300, 460);

                  // Bottom Footer URL
                  ctx.fillStyle = "#10b981";
                  ctx.font = "800 14px system-ui, sans-serif";
                  ctx.fillText("https://an-11-players.web.app", 300, 545);

                  canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const file = new File([blob], `${title.replace(/\s+/g, "_")}_achievement.png`, { type: "image/png" });
                    
                    const isMobile = typeof window !== "undefined" && (
                      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && !window.matchMedia('(pointer: fine)').matches)
                    );

                    let sharedViaNative = false;

                    if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                      try {
                        await navigator.share({
                          files: [file],
                          title: `🏆 11Players Achievement: ${title}`,
                          text: `I just unlocked "${title}" on 11Players! ⚽`
                        });
                        sharedViaNative = true;
                        toast.success(isAr ? "تم مشاركة صورة الإنجاز بنجاح! 🏆" : "Achievement card shared! 🏆");
                      } catch (e: any) {
                        if (e?.name === 'AbortError') return;
                      }
                    }

                    if (!sharedViaNative) {
                      // Desktop PC Fallback: Download image card + copy text to clipboard
                      const link = document.createElement("a");
                      link.download = `${title.replace(/\s+/g, "_")}_achievement.png`;
                      link.href = canvas.toDataURL("image/png");
                      link.click();

                      try {
                        const shareText = `🏆 I just unlocked "${title}" on 11Players! ⚽\nhttps://an-11-players.web.app`;
                        await navigator.clipboard.writeText(shareText);
                        toast.success(isAr ? "تم تحميل صورة الإنجاز ونسخ النص للحافظة! 📸📋" : "Achievement card downloaded & text copied to clipboard! 📸📋");
                      } catch (clipErr) {
                        toast.success(isAr ? "تم تحميل صورة الإنجاز! 📸" : "Achievement card image downloaded! 📸");
                      }
                    }
                  }, "image/png");
                } catch (err) {
                  console.error("Share error:", err);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
              title={isAr ? "مشاركة كصورة إنجاز" : "Share Achievement Card"}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
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

  // XP level calculations (100 XP per earned achievement)
  const xpEarned = earned.length * 100;
  const userLevel = Math.floor(xpEarned / 300) + 1;
  const xpInCurrentLevel = xpEarned % 300;
  const xpLevelPct = Math.min(100, Math.round((xpInCurrentLevel / 300) * 100));

  const filteredAchievements = useMemo(() => {
    if (filter === "earned") return earned;
    if (filter === "inProgress") return inProgress;
    if (filter === "locked") return locked;
    return allAchievements;
  }, [filter, allAchievements, earned, inProgress, locked]);

  const filterTabs: { id: FilterTab; label: string; labelAr: string; count: number }[] = [
    { id: "all",        label: "All",         labelAr: "الكل",       count: allAchievements.length },
    { id: "earned",     label: "Earned",      labelAr: "مكتسبة",     count: earned.length },
    { id: "inProgress", label: "In Progress", labelAr: "جارٍ",       count: inProgress.length },
    { id: "locked",     label: "Locked",      labelAr: "مقفلة",      count: locked.length },
  ];

  if (!user) return null;
  if (loading) return <SiteSkeletonLoader variant="profile" />;

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-black">{isAr ? "ملف اللاعب غير متوفر" : "Player Profile Not Found"}</h1>
        <p className="mt-2 text-slate-400 text-sm text-center max-w-xl">
          {isAr ? "يجب أن تنشئ ملف لاعب أولاً حتى تتمكن من عرض إنجازاتك." : "You need to create your player profile first to view achievements."}
        </p>
        <Link href="/onboarding" className="mt-6 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 transition-all shadow-xl">
          {isAr ? "إنشاء ملف اللاعب" : "Create Player Profile"}
        </Link>
      </div>
    );
  }

  const photo = player?.photoUrl || player?.googlePic || (player as any)?.photoURL || "";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-white transition-colors duration-300 pb-16" dir={isAr ? "rtl" : "ltr"}>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

          {/* ── Trophy Room Hall of Fame Hero Banner ────────────────────────── */}
          <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              
              {/* Player Identity */}
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-start rtl:sm:text-right w-full lg:w-auto">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 flex items-center justify-center">
                    {photo ? (
                      <Image src={photo} alt={player.fullName} width={112} height={112} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-black text-4xl">
                        {player.cardName?.charAt(0) || player.fullName?.charAt(0) || "P"}
                      </div>
                    )}
                  </div>
                  {/* OVR Badge */}
                  <div className="absolute -bottom-2 -right-2 rtl:-bottom-2 rtl:-left-2 rtl:right-auto px-3 py-1 rounded-xl bg-emerald-600 border border-emerald-500 text-white flex items-center gap-1 shadow-xl">
                    <span className="text-[10px] font-black opacity-80">OVR</span>
                    <span className="text-base font-black leading-none">{ovr}</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-center sm:justify-start rtl:sm:justify-end gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 border border-emerald-800 text-emerald-400 uppercase tracking-widest">
                      {isAr ? `المستوى ${userLevel}` : `Level ${userLevel}`}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {isAr ? "خزانة الإنجازات" : "Hall of Achievements"}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white truncate">
                    {player.cardName || player.fullName}
                  </h1>
                  <p className="text-sm font-semibold text-slate-400 mt-1">
                    {player.primaryPosition} {player.playStyle ? `• ${player.playStyle.replace(/_/g, " ")}` : ""}
                  </p>

                  {/* Medal Counters Pill */}
                  <div className="flex flex-wrap justify-center sm:justify-start rtl:sm:justify-end gap-4 mt-4">
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-sm font-black text-amber-400">
                      <span>🥇</span><span>{goldCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-sm font-black text-slate-300">
                      <span>🥈</span><span>{silverCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-sm font-black text-orange-400">
                      <span>🥉</span><span>{bronzeCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-sm font-black text-emerald-400">
                      <Trophy className="w-4 h-4 text-emerald-400" /><span>{trophyCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collector XP & Radial Progress */}
              <div className="flex flex-row items-center gap-6 bg-slate-950/90 border border-slate-800 rounded-3xl p-5 w-full lg:w-auto shrink-0 justify-between shadow-xl">
                <div className="space-y-2 flex-1 sm:flex-initial">
                  <div className="flex items-center justify-between text-xs font-black text-slate-300 gap-4">
                    <span>{isAr ? "نقاط الإنجاز XP" : "Achievement XP"}</span>
                    <span className="text-emerald-400 font-extrabold">{xpEarned} XP</span>
                  </div>
                  <div className="w-full sm:w-44 h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${xpLevelPct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {isAr ? `${300 - xpInCurrentLevel} XP للمستوى التالي` : `${300 - xpInCurrentLevel} XP to Level ${userLevel + 1}`}
                  </p>
                </div>

                <div className="h-10 w-[1px] bg-slate-800/80 shrink-0" />

                <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                  <ProgressRing earned={earned.length} total={allAchievements.length} size={76} />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                    {isAr ? "الإنجازات" : "Unlocked"}
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* ── Quick Stats Row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile icon={<Target className="w-5 h-5 text-emerald-400" />} label={isAr ? "الأهداف" : "Goals"} value={player.stats?.goals || 0} sub={isAr ? "إجمالي الأهداف" : "Total Career Goals"} />
            <StatTile icon={<Handshake className="w-5 h-5 text-cyan-400" />} label={isAr ? "التمريرات" : "Assists"} value={player.stats?.assists || 0} sub={isAr ? "إجمالي التمريرات" : "Total Career Assists"} />
            <StatTile icon={<Star className="w-5 h-5 text-amber-400" />} label={isAr ? "MVP" : "MVPs"} value={player.stats?.mvp || 0} sub={isAr ? "أفضل لاعب بالمباراة" : "Man of the Match"} />
            <StatTile icon={<Sparkles className="w-5 h-5 text-blue-400" />} label={isAr ? "المباريات" : "Matches"} value={matchesPlayed} sub={isAr ? "مباريات ملعوبة" : "Matches Played"} />
          </div>

          {/* ── Main Content Grid ────────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

            {/* Left: Achievement List */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {isAr ? "قائمة الإنجازات" : "Achievement List"}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {isAr ? `تم تحقيق ${earned.length} من أصل ${allAchievements.length} إنجاز` : `Completed ${earned.length} of ${allAchievements.length} achievements`}
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-900 rounded-2xl border border-slate-800 p-1.5 flex-wrap shadow-lg">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        filter === tab.id
                          ? "bg-emerald-600 text-white font-black shadow-md"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{isAr ? tab.labelAr : tab.label}</span>
                      <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center text-[10px] font-black rounded-full leading-none ${filter === tab.id ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
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
                  className="grid gap-4 sm:grid-cols-2"
                >
                  {filteredAchievements.length === 0 ? (
                    <div className="col-span-2 text-center py-16 text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                      <p className="text-sm font-bold text-white">
                        {isAr ? "لا توجد إنجازات في هذه الفئة بعد" : "No achievements in this category yet"}
                      </p>
                    </div>
                  ) : (
                    filteredAchievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} isAr={isAr} player={player} />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Sidebar */}
            <aside className="space-y-6">
              {/* Trophy Cabinet */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shadow-inner">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">{isAr ? "خزانة الكؤوس والجوائز" : "Trophy Cabinet"}</h3>
                    <p className="text-xs text-slate-400 font-medium">{isAr ? `${trophyCount} ألقاب مكتسبة` : `${trophyCount} trophies won`}</p>
                  </div>
                </div>

                {trophyCount === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center bg-slate-950/60">
                    <span className="text-4xl block mb-2 opacity-50">🏆</span>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {isAr ? "لم تحصل على كؤوس موسمية بعد. شارك في المباريات وحقق الألقاب!" : "No season trophies yet. Participate in matches to win titles!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
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
                          className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800"
                        >
                          <span className="text-2xl">{emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate">{trophy.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{trophy.season || (isAr ? "موسم عام" : "General Season")}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Extended Career Metrics */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-3">
                <h3 className="font-black text-base text-white mb-4">{isAr ? "معدلات الأداء" : "Career Efficiency"}</h3>
                {[
                  { icon: <Target className="w-4 h-4 text-emerald-400" />, label: isAr ? "أهداف / مباراة" : "Goals / Match", value: matchesPlayed > 0 ? ((player.stats?.goals || 0) / matchesPlayed).toFixed(2) : "0.00" },
                  { icon: <Handshake className="w-4 h-4 text-cyan-400" />, label: isAr ? "تمريرات / مباراة" : "Assists / Match", value: matchesPlayed > 0 ? ((player.stats?.assists || 0) / matchesPlayed).toFixed(2) : "0.00" },
                  { icon: <span className="text-yellow-400 text-sm">🟨</span>, label: isAr ? "الكروت الصفراء" : "Yellow Cards", value: player.stats?.yellowCards || 0 },
                  { icon: <span className="text-red-400 text-sm">🟥</span>, label: isAr ? "الكروت الحمراء" : "Red Cards", value: player.stats?.redCards || 0 },
                ].map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl bg-slate-900 p-2 border border-slate-800">{stat.icon}</div>
                      <span className="text-xs font-bold text-slate-300">{stat.label}</span>
                    </div>
                    <span className="text-sm font-black text-white tabular-nums">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* How to Earn Banner */}
              <div className="rounded-3xl bg-slate-900 p-6 border border-slate-800 text-slate-300 text-sm shadow-xl">
                <p className="font-black mb-3 flex items-center gap-2 text-white text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isAr ? "كيفية كسب الإنجازات والـ XP" : "How to Earn XP & Badges"}
                </p>
                <ul className="list-disc list-inside space-y-2 text-xs leading-5 text-slate-400 font-medium">
                  <li>{isAr ? "سجل أهدافاً وتمريرات حاسمة لفتح شارات الهداف." : "Score goals & assists in matches to unlock scorer badges."}</li>
                  <li>{isAr ? "احصل على لقب رجل المباراة لمضاعفة نقاط الـ XP." : "Earn Man of the Match awards to double XP gain."}</li>
                  <li>{isAr ? "حافظ على تكرار مشاركاتك لزيادة مستوى حسابك." : "Play consistently to increase your player collector level."}</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
