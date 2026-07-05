"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useLocale } from "@/components/ThemeProvider";
import PlayerCard from "@/components/PlayerCard";
import FormIcon from "@/components/FormIcon";
import { PlayerProfile } from "@/types";
import { generateProfilePDF } from "@/lib/pdf";
import EditProfileModal from "@/components/EditProfileModal";
import SVGPitchDisplay from "@/components/SVGPitchDisplay";
import { getPlayerPositionRatings } from "@/lib/overallCalculator";
import { motion } from "framer-motion";
import Link from "next/link";
import { SKILLS } from "@/components/SkillsChecklist";
import { useSearchParams, useRouter } from "next/navigation";
import { Target, Handshake, Trophy, Swords } from "lucide-react";

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
      <span className="w-32 text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wider truncate">
        {label}
      </span>
      <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="w-8 text-right text-sm font-bold text-slate-800 dark:text-white">{value}</span>
    </div>
  );
}

export default function PlayerProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">Loading...</div>}>
      <PlayerProfileContent />
    </Suspense>
  );
}

function PlayerProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const { players } = usePlayers();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const effectiveUid = uid || user?.uid;
  const isViewingOwnProfile = user?.uid === effectiveUid;

  const [player, setPlayer] = useState<PlayerProfile | null>(() => {
    if (!effectiveUid) return null;
    return players.find(p => p.uid === effectiveUid) || null;
  });
  const [loading, setLoading] = useState(!player);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!effectiveUid) {
      if (!authLoading) setLoading(false);
      return;
    }

    if (!player) {
      setLoading(true);
    }
    
    const unsub = onSnapshot(
      doc(db, "players", effectiveUid),
      async (snap) => {
        if (snap.exists()) {
          setPlayer({ uid: snap.id, ...snap.data() } as PlayerProfile);
          setLoading(false);
        } else if (user?.email && user?.uid === effectiveUid) {
          try {
            const q = query(collection(db, "players"), where("email", "==", user.email));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const existingData = querySnap.docs[0].data();
              await setDoc(doc(db, "players", effectiveUid), { ...existingData, uid: effectiveUid }, { merge: true });
              setPlayer({ uid: effectiveUid, ...existingData } as PlayerProfile);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Profile sync by email error:", e);
          }
          setPlayer(null);
          setLoading(false);
          router.push("/onboarding");
        } else {
          setPlayer(null);
          setLoading(false);
          if (user?.uid === effectiveUid) {
            router.push("/onboarding");
          }
        }
      },
      (err) => {
        console.error("Profile onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUid, authLoading, user?.uid, router]);

  const canExport = user?.uid === effectiveUid || isAdmin;

  const attrMap = [
    { key: "offensiveAwareness", label: isAr ? "الوعي الهجومي" : "Offensive Awareness" },
    { key: "ballControl", label: isAr ? "التحكم بالكرة" : "Ball Control" },
    { key: "dribbling", label: isAr ? "المراوغة" : "Dribbling" },
    { key: "lowPass", label: isAr ? "التمرير القصير" : "Low Pass" },
    { key: "loftedPass", label: isAr ? "التمرير الطويل" : "Lofted Pass" },
    { key: "finishing", label: isAr ? "الإنهاء" : "Finishing" },
    { key: "heading", label: isAr ? "الرأسيات" : "Heading" },
    { key: "speed", label: isAr ? "السرعة" : "Speed" },
    { key: "acceleration", label: isAr ? "التسارع" : "Acceleration" },
    { key: "kickingPower", label: isAr ? "قوة التسديد" : "Kicking Power" },
    { key: "jump", label: isAr ? "القفز" : "Jump" },
    { key: "physicalContact", label: isAr ? "القوة البدنية" : "Physical Contact" },
    { key: "balance", label: isAr ? "التوازن" : "Balance" },
    { key: "stamina", label: isAr ? "اللياقة البدنية" : "Stamina" },
    { key: "defensiveAwareness", label: isAr ? "الوعي الدفاعي" : "Defensive Awareness" },
    { key: "ballWinning", label: isAr ? "افتكاك الكرة" : "Ball Winning" },
    { key: "goalkeeping", label: isAr ? "حراسة المرمى" : "Goalkeeping" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 gap-6">
        <div className="text-6xl">🔍</div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
          {isAr ? "اللاعب غير موجود" : "Player Not Found"}
        </h2>
        {isViewingOwnProfile ? (
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors"
          >
            {isAr ? "إنشاء ملف اللاعب" : "Create Player Profile"}
          </Link>
        ) : (
          <Link
            href="/community"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors"
          >
            {isAr ? "العودة إلى المجتمع" : "Back to Community"}
          </Link>
        )}
      </div>
    );
  }



  const statCards = [
    {
      icon: <Target className="w-5 h-5 text-emerald-500" />,
      label: isAr ? "الأهداف" : "Goals",
      value: player.stats?.goals || 0,
    },
    {
      icon: <Handshake className="w-5 h-5 text-emerald-500" />,
      label: isAr ? "التمريرات الحاسمة" : "Assists",
      value: player.stats?.assists || 0,
    },
    {
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      label: isAr ? "أفضل لاعب" : "MVP",
      value: player.stats?.mvp || 0,
    },
    {
      icon: <Swords className="w-5 h-5 text-blue-500" />,
      label: isAr ? "المباريات" : "Matches",
      value: player.stats?.matchesPlayed || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Top Section: Card + Physical Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Full Name & Form */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-amber-500 dark:text-amber-400">
                  {player.fullName}
                </h2>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 w-full justify-center lg:justify-between items-center lg:items-start bg-white dark:bg-slate-800/30 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none">
              {/* Left Column: Card & Form */}
              <div className="flex flex-col items-center gap-6 w-full lg:w-auto">
                {isViewingOwnProfile && (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 w-full max-w-[340px] justify-between shadow-sm dark:shadow-lg">
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">{isAr ? "فورمة اللاعب (قبل المباراة):" : "Match Form:"}</span>
                    <div className="flex gap-2">
                      {['⬆️', '↗️', '➡️', '↘️', '⬇️'].map((arrow) => (
                        <button
                          key={arrow}
                          onClick={async () => {
                            try {
                              const ref = doc(db, "players", player.uid);
                              await updateDoc(ref, { form: arrow });
                            } catch (e) {
                              console.error("Failed to update form", e);
                            }
                          }}
                          className={`p-1.5 hover:scale-125 transition-transform ${player.form === arrow ? 'bg-slate-200 dark:bg-slate-700 rounded-full border border-slate-300 dark:border-slate-600 shadow-[0_0_10px_rgba(0,0,0,0.1)]' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}
                          title={isAr ? `تحديث الحالة` : `Update form`}
                        >
                          <FormIcon form={arrow} className="w-6 h-6" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <PlayerCard player={player} />
              </div>

              {/* Right Column: SVG Pitch */}
              <div className="flex flex-col items-center w-full max-w-[400px]">
                <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-4 self-center lg:self-start bg-emerald-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  {isAr ? "مراكز اللعب والتقييم" : "Positions & Ratings"}
                </h3>
                <div className="w-full">
                  <SVGPitchDisplay ratings={getPlayerPositionRatings(player)} />
                </div>
              </div>
            </div>

        </motion.div>

        {/* Match Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
            {isAr ? "إحصائيات المباريات" : "Match Statistics"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none rounded-2xl p-6 text-center"
              >
                <div className="text-3xl mb-2 flex justify-center">{stat.icon}</div>
                <div className="text-3xl font-black text-slate-800 dark:text-white">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Trophies Section */}
        {player.trophies && player.trophies.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-500 mb-4 flex items-center gap-2">
              🏆 {isAr ? "خزانة البطولات والجوائز" : "Trophy Cabinet"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {player.trophies.map((trophy, i) => (
                <div key={i} className="bg-gradient-to-br from-amber-50 dark:from-amber-500/10 to-amber-100/50 dark:to-amber-600/5 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 text-center hover:scale-105 transition-transform shadow-sm dark:shadow-none">
                  <div className="text-3xl mb-2">{trophy.name.split(' ')[1] || '🏆'}</div>
                  <div className="font-black text-amber-600 dark:text-amber-500 text-sm">{trophy.name.split(' ')[0]}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{trophy.season}</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Attributes Breakdown */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
            {isAr ? "تفصيل القدرات" : "Attributes Breakdown"}
          </h3>
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none rounded-2xl p-6 space-y-3">
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
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
              {isAr ? "المهارات الخاصة" : "Special Skills"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {player.specialSkills.map((skillId, i) => {
                // Find skill label or default to formatted ID
                let label = skillId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const skillInfo = SKILLS.find(s => s.id === skillId);
                if (skillInfo) {
                  label = isAr ? skillInfo.labelAr : skillInfo.label;
                }
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-100 dark:from-emerald-900/60 to-teal-100 dark:to-teal-900/60 border border-emerald-300 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-300 shadow-sm dark:shadow-none rounded-full text-sm font-bold"
                  >
                    ⭐ {label}
                  </motion.span>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Export PDF & Edit Profile */}
        {(canExport || user?.uid === effectiveUid) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {user?.uid === effectiveUid && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm dark:shadow-none rounded-2xl text-slate-800 dark:text-white font-black text-lg transition-all active:scale-95"
              >
                ✏️ {isAr ? "تعديل الملف الشخصي" : "Edit Profile"}
              </button>
            )}
            {canExport && (
              <button
                onClick={() => generateProfilePDF(player)}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white font-black text-lg transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/50 active:scale-95"
              >
                📄 {isAr ? "تصدير ملف PDF" : "Export PDF"}
              </button>
            )}
          </motion.div>
        )}
      </main>

      <EditProfileModal
        player={player}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onRefresh={() => {}} // Data updates automatically via onSnapshot
      />
    </div>
  );
}
