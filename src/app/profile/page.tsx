"use client";

import React, { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import PlayerCard from "@/components/PlayerCard";
import { PlayerProfile } from "@/types";
import { generateProfilePDF } from "@/lib/pdf";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";

/* ── Animated Counter ── */
function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{display}</span>;
}

/* ── Attribute Progress Bar ── */
function AttributeBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(Math.max(value, 0), 99);
  const color =
    pct >= 80
      ? "from-emerald-400 to-emerald-600"
      : pct >= 60
      ? "from-teal-400 to-teal-600"
      : pct >= 40
      ? "from-amber-400 to-amber-600"
      : "from-red-400 to-red-600";

  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs font-bold text-slate-300 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="w-8 text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}

export default function PlayerProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950">Loading...</div>}>
      <PlayerProfileContent />
    </Suspense>
  );
}

function PlayerProfileContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const effectiveUid = uid || user?.uid;

  useEffect(() => {
    if (!effectiveUid) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "players", effectiveUid),
      (snap) => {
        if (snap.exists()) {
          setPlayer({ uid: snap.id, ...snap.data() } as PlayerProfile);
        } else {
          setPlayer(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Profile onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [effectiveUid, authLoading]);

  const canExport = user?.uid === effectiveUid || isAdmin;

  const attrMap = [
    { key: "attackingProwess", label: "ATT" },
    { key: "defensiveProwess", label: "DEF" },
    { key: "speed", label: "SPD" },
    { key: "acceleration", label: "ACC" },
    { key: "stamina", label: "STA" },
    { key: "dribbling", label: "DRI" },
    { key: "passing", label: "PAS" },
    { key: "physicalContact", label: "PHY" },
    { key: "shotPower", label: "SHT" },
    { key: "goalkeeping", label: "GKP" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
        />
        <p className="text-sm text-slate-400">
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-6">
        <div className="text-6xl">🔍</div>
        <h2 className="text-2xl font-bold text-white">
          {isAr ? "اللاعب غير موجود" : "Player Not Found"}
        </h2>
        <Link
          href="/community"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors"
        >
          {isAr ? "العودة إلى المجتمع" : "Back to Community"}
        </Link>
      </div>
    );
  }

  const footLabel =
    player.preferredFoot === "Right"
      ? isAr
        ? "🦶 يمنى"
        : "🦶 Right"
      : player.preferredFoot === "Left"
      ? isAr
        ? "🦶 يسرى"
        : "🦶 Left"
      : isAr
      ? "🦶 كلتا القدمين"
      : "🦶 Ambidextrous";

  const statCards = [
    {
      icon: "⚽",
      label: isAr ? "الأهداف" : "Goals",
      value: player.stats?.goals || 0,
    },
    {
      icon: "🅰️",
      label: isAr ? "التمريرات الحاسمة" : "Assists",
      value: player.stats?.assists || 0,
    },
    {
      icon: "🏆",
      label: isAr ? "أفضل لاعب" : "MVP",
      value: player.stats?.mvp || 0,
    },
    {
      icon: "🏟️",
      label: isAr ? "المباريات" : "Matches",
      value: player.stats?.matchesPlayed || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Top Section: Card + Physical Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row gap-8 items-start"
        >
          {/* Player Card */}
          <div className="flex-shrink-0 mx-auto lg:mx-0">
            <PlayerCard player={player} />
          </div>

          {/* Info Panel */}
          <div className="flex-1 space-y-6 w-full">
            {/* Full Name */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {player.fullName}
              </h2>
              <p className="text-slate-400 mt-1 text-sm">
                {isAr ? "الاسم المختصر:" : "Card Name:"}{" "}
                <span className="text-white font-bold">{player.cardName}</span>
              </p>
            </div>

            {/* Physical Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: "📏",
                  label: isAr ? "الطول" : "Height",
                  value: `${player.height} cm`,
                },
                {
                  icon: "⚖️",
                  label: isAr ? "الوزن" : "Weight",
                  value: `${player.weight} kg`,
                },
                {
                  icon: "🎂",
                  label: isAr ? "العمر" : "Age",
                  value: `${player.calculatedAge}`,
                },
                {
                  icon: "🦶",
                  label: isAr ? "القدم المفضلة" : "Foot",
                  value: player.preferredFoot,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center"
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                  <div className="text-lg font-bold text-white">{item.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Position Info */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-4 py-2 bg-amber-600 text-white rounded-xl font-black text-lg">
                {player.primaryPosition}
              </span>
              <span className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg font-bold text-sm">
                {player.secondaryPosition}
              </span>
              <span className="px-3 py-1.5 bg-slate-700/60 text-slate-300 rounded-lg font-bold text-sm">
                {player.tertiaryPosition}
              </span>
              <span className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm">
                {footLabel}
              </span>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {player.isVerifiedByAdmin && (
                <span className="px-3 py-1 bg-emerald-900/60 text-emerald-300 rounded-full text-xs font-bold border border-emerald-700/50">
                  ✅ {isAr ? "معتمد" : "Verified"}
                </span>
              )}
              {player.hasWarning && (
                <span className="px-3 py-1 bg-amber-900/60 text-amber-300 rounded-full text-xs font-bold border border-amber-700/50">
                  ⚠️ {isAr ? "إنذار" : "Warning"}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Match Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-black text-emerald-400 mb-4">
            {isAr ? "إحصائيات المباريات" : "Match Statistics"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 text-center"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-black text-white">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-xs text-slate-400 mt-1 font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Attributes Breakdown */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-black text-emerald-400 mb-4">
            {isAr ? "تفصيل القدرات" : "Attributes Breakdown"}
          </h3>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
            {attrMap.map((attr) => (
              <AttributeBar
                key={attr.key}
                label={attr.label}
                value={
                  player.attributes[
                    attr.key as keyof typeof player.attributes
                  ] || 0
                }
              />
            ))}
          </div>
        </motion.section>

        {/* Special Skills */}
        {player.specialSkills && player.specialSkills.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-black text-emerald-400 mb-4">
              {isAr ? "المهارات الخاصة" : "Special Skills"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {player.specialSkills.map((skill, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-700/40 text-emerald-300 rounded-full text-sm font-bold"
                >
                  ⭐ {skill}
                </motion.span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Export PDF */}
        {canExport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center"
          >
            <button
              onClick={() => generateProfilePDF(player)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white font-black text-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/50 active:scale-95"
            >
              📄 {isAr ? "تصدير ملف PDF" : "Export PDF"}
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
