"use client";

import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import PlayerCard from "@/components/player/PlayerCard";
import FormIcon from "@/components/ui/FormIcon";
import { generateProfilePDF } from "@/lib/pdf";
import EditProfileModal from "@/components/player/EditProfileModal";
import SVGPitchDisplay from "@/components/match/SVGPitchDisplay";
import { getPlayerPositionRatings } from "@/lib/overallCalculator";
import { motion } from "framer-motion";
import Link from "next/link";
import { SKILLS } from "@/components/player/SkillsChecklist";
import { useSearchParams, useRouter } from "next/navigation";
import { Target, Handshake, Trophy, Swords, HelpCircle, Sparkles, FileText, Edit, ShieldAlert, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import OvrExplanationModal from "@/components/player/OvrExplanationModal";
import SuggestPeerRatingModal from "@/components/player/SuggestPeerRatingModal";
import PlayerComparisonModal from "@/components/player/PlayerComparisonModal";
import TacticalSuggestionsCard from "@/components/match/TacticalSuggestionsCard";
import AttributesBreakdown from "@/components/player/AttributesBreakdown";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useCommunity } from "@/contexts/CommunityContext";
import ScrollableTabContainer from "@/components/ui/ScrollableTabContainer";

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

export function PlayerProfileContent({ directUsername }: { directUsername?: string }) {
  const router = useRouter();
  const { activeCommunityId } = useCommunity();
  const pathUsername = typeof window !== "undefined"
    ? decodeURIComponent(window.location.pathname.replace(/^\/+/, "").split("/")[0]).replace(/^@+/, "")
    : "";
  const validPathUsername = (pathUsername && pathUsername !== "profile" && pathUsername !== "demo" && pathUsername !== "404" && pathUsername !== "index.html") ? pathUsername : undefined;
  const rawUid = directUsername || searchParams.get("username") || searchParams.get("uid") || validPathUsername;
  const uid = (rawUid && rawUid !== "undefined" && rawUid !== "null") ? rawUid : null;
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const effectiveUid = rawUid ? uid : user?.uid;
  const isViewingOwnProfile = Boolean(user?.uid && effectiveUid && user.uid === effectiveUid);

  const { players } = usePlayers();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOvrInfoOpen, setIsOvrInfoOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const { player, loading, setLoading } = usePlayerProfile(effectiveUid, user, isViewingOwnProfile, rawUid, activeCommunityId);

  useEffect(() => {
    if (player?.username && !directUsername && (searchParams.get("uid") || searchParams.get("username") || (!rawUid && isViewingOwnProfile))) {
      router.replace(`/${player.username}`);
    }
  }, [player?.username, directUsername, searchParams, rawUid, isViewingOwnProfile, router]);

  useEffect(() => {
    if (!effectiveUid && !authLoading) setLoading(false);
  }, [effectiveUid, authLoading, setLoading]);

  const canExport = user?.uid === effectiveUid || isAdmin;

  if (loading) {
    return null;
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-6 px-4">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl shadow-inner">
          🔍
        </div>
        <h2 className="text-2xl font-black text-white">
          {isAr ? "اللاعب غير موجود" : "Player Not Found"}
        </h2>
        {isViewingOwnProfile ? (
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl text-white font-bold transition-all shadow-lg shadow-emerald-950/40"
          >
            {isAr ? "إنشاء ملف اللاعب" : "Create Player Profile"}
          </Link>
        ) : (
          <Link
            href="/community"
            className="px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl text-white font-bold transition-all"
          >
            {isAr ? "العودة إلى المجتمع" : "Back to Community"}
          </Link>
        )}
      </div>
    );
  }

  const statCards = [
    {
      icon: <Target className="w-5 h-5 text-emerald-400" />,
      label: isAr ? "الأهداف" : "Goals",
      value: player.stats?.goals || 0,
    },
    {
      icon: <Handshake className="w-5 h-5 text-teal-400" />,
      label: isAr ? "التمريرات الحاسمة" : "Assists",
      value: player.stats?.assists || 0,
    },
    {
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      label: isAr ? "أفضل لاعب" : "MVP",
      value: player.stats?.mvp || 0,
    },
    {
      icon: <Swords className="w-5 h-5 text-blue-400" />,
      label: isAr ? "المباريات" : "Matches",
      value: player.stats?.matchesPlayed || 0,
    },
    {
      icon: <span className="text-lg">🟨</span>,
      label: isAr ? "الإنذارات (صفراء)" : "Yellow Cards",
      value: player.stats?.yellowCards || 0,
    },
    {
      icon: <span className="text-lg">🟥</span>,
      label: isAr ? "الكروت الحمراء" : "Red Cards",
      value: player.stats?.redCards || 0,
    },
    ...(player.matchStarRatingAvg
      ? [{
          icon: <span className="text-amber-400 text-lg">⭐</span>,
          label: isAr ? "تقييم الأداء" : "Match Perf.",
          value: `${player.matchStarRatingAvg.toFixed(1)}/5${player.matchStarRatingCount ? ` (${player.matchStarRatingCount})` : ''}`,
        }]
      : []),
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 text-white pt-20 pb-16 transition-colors"
      dir={isAr ? "rtl" : "ltr"}
    >
      <main className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Profile Ecosystem Quick Navigation Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 backdrop-blur-xl shadow-xl">
          <ScrollableTabContainer>
            <div className="flex items-center gap-2 min-w-max w-full">
              <Link
                href="/profile/skill-tree"
                className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? "شجرة المهارات XP" : "XP Skill Tree"}</span>
              </Link>

              <Link
                href="/achievements"
                className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 flex items-center justify-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-all hover:scale-[1.02]"
              >
                <Trophy className="w-4 h-4" />
                <span>{isAr ? "خزانة الكؤوس" : "Trophy Cabinet"}</span>
              </Link>

              <Link
                href="/stats"
                className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/60 flex items-center justify-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-all hover:scale-[1.02]"
              >
                <Target className="w-4 h-4" />
                <span>{isAr ? "قائمة اللاعبين الإجمالية" : "Player Roster"}</span>
              </Link>

              <Link
                href="/community/kit-builder"
                className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/60 flex items-center justify-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-all hover:scale-[1.02]"
              >
                <Swords className="w-4 h-4" />
                <span>{isAr ? "استوديو الأطقم" : "Kit Studio"}</span>
              </Link>
            </div>
          </ScrollableTabContainer>
        </div>

        {/* Top Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />

          {/* Full Name & OVR Info Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                {player.fullName}
              </h1>
              {player.username && (
                <span className="px-3.5 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-extrabold text-sm sm:text-base rounded-2xl shadow-sm" dir="ltr">
                  @{player.username}
                </span>
              )}
              <button
                onClick={() => setIsOvrInfoOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                title={isAr ? "كيف يتم حساب التقييم الكلي؟" : "How is OVR Calculated?"}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{isAr ? "كيف يحسب التقييم؟" : "OVR Formula"}</span>
              </button>
            </div>
          </div>

          {/* Suspension Banner */}
          {player.stats?.isSuspended && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-950/40 border border-red-500/60 rounded-2xl flex items-center gap-3.5 text-red-300 shadow-lg relative z-10"
            >
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/30 text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">
                  {isAr ? "اللاعب موقوف حالياً عن المشاركة (كرت أحمر)" : "Player Currently Suspended (Red Card)"}
                </h4>
                <p className="text-xs text-red-300/80 mt-0.5 leading-relaxed">
                  {isAr
                    ? "حصل هذا اللاعب على كرت أحمر في مباراته السابقة، ولن يتمكن من المشاركة في المباراة القادمة حتى انتهاء مدة الإيقاف."
                    : "This player received a red card in their previous match and cannot play in the next match session."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Split Column: Card + Match Form + Pitch */}
          <div className="flex flex-col lg:flex-row gap-8 w-full justify-between items-center lg:items-start pt-2 relative z-10">
            {/* Left Column: Player Card & Form Selector */}
            <div className="flex flex-col items-center gap-6 w-full lg:w-auto">
              {isViewingOwnProfile && (
                <div className="flex items-center gap-3 bg-slate-950/80 px-5 py-3 rounded-2xl border border-slate-800 w-full max-w-[340px] justify-between shadow-inner">
                  <span className="text-xs text-slate-300 font-bold">
                    {isAr ? "فورمة اللاعب (قبل المباراة):" : "Match Form:"}
                  </span>
                  <div className="flex gap-1.5">
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
                        className={`p-1.5 hover:scale-125 transition-transform rounded-xl ${
                          player.form === arrow
                            ? 'bg-slate-800 border border-slate-700 shadow-md scale-110'
                            : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                        }`}
                        title={isAr ? `تحديث الحالة` : `Update form`}
                      >
                        <FormIcon form={arrow} className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <PlayerCard 
                player={player} 
                onCompare={() => setIsCompareModalOpen(true)}
              />
            </div>

            {/* Right Column: Interactive Pitch */}
            <div className="flex flex-col items-center w-full max-w-[400px]">
              <h3 className="text-sm font-black text-emerald-400 mb-3.5 self-center lg:self-start bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
                {isAr ? "⚽ مراكز اللعب والتقييم" : "⚽ Positions & Ratings"}
              </h3>
              <div className="w-full">
                <SVGPitchDisplay ratings={getPlayerPositionRatings(player)} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Tactical Analysis Section */}
        {(isViewingOwnProfile || isAdmin || isOwner) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TacticalSuggestionsCard
              attributes={player.approvedAttributes || player.attributes}
              height={player.height}
              weight={player.weight}
              preferredFoot={player.preferredFoot}
              playerProfile={player}
              isOwnProfile={isViewingOwnProfile}
            />
          </motion.section>
        )}

        {/* Match Statistics Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-black text-emerald-400 flex items-center gap-2">
            📊 {isAr ? "إحصائيات المباريات" : "Match Statistics"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 shadow-xl rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="text-2xl mb-2 flex justify-center">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-black text-white">
                  {typeof stat.value === 'number'
                    ? <AnimatedCounter value={stat.value} />
                    : <span>{stat.value}</span>
                  }
                </div>
                <div className="text-xs text-slate-400 mt-1.5 font-bold">
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
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
              🏆 {isAr ? "خزانة البطولات والجوائز" : "Trophy Cabinet"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {player.trophies.map((trophy, i) => {
                const tName = trophy?.name || (isAr ? 'جائزة الموسم' : 'Season Trophy');
                const tIcon = (trophy as any)?.icon || (
                  tName.includes("Ballon") ? "👑" :
                  tName.includes("Boot") || tName.includes("الهداف") ? "⚽" :
                  tName.includes("Playmaker") || tName.includes("صانع") ? "🎯" :
                  tName.includes("MVP") || tName.includes("رجل الموسم") ? "⭐" :
                  tName.includes("Shield") || tName.includes("المدافع") ? "🛡️" : "🏆"
                );
                return (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 text-center hover:scale-105 transition-transform shadow-xl flex flex-col items-center justify-center"
                  >
                    <div className="text-3xl mb-2 animate-bounce">{tIcon}</div>
                    <div className="font-black text-amber-400 text-xs sm:text-sm">{tName}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 mt-1 font-semibold">{trophy?.season || ''}</div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Attributes Breakdown Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <AttributesBreakdown attributes={player.approvedAttributes || player.attributes} />
        </motion.section>

        {/* Special Skills Section */}
        {player.specialSkills && player.specialSkills.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-black text-emerald-400 flex items-center gap-2">
              ⭐ {isAr ? "المهارات الخاصة" : "Special Skills"}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {player.specialSkills.map((skillId, i) => {
                const sId = skillId || '';
                let label = sId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const skillInfo = SKILLS.find(s => s.id === sId);
                if (skillInfo) {
                  label = isAr ? skillInfo.labelAr : skillInfo.label;
                }
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + i * 0.04 }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-black shadow-md flex items-center gap-1.5"
                  >
                    <span>⭐</span>
                    <span>{label}</span>
                  </motion.span>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Action Bar: Export PDF, Edit Profile, Suggest Rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          {user?.uid === effectiveUid && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-7 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-base transition-all active:scale-95 flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <Edit className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "تعديل الملف الشخصي" : "Edit Profile"}</span>
            </button>
          )}

          {user?.uid && user.uid !== effectiveUid && (
            <button
              onClick={() => (isAdmin || isOwner) ? setIsEditModalOpen(true) : setIsSuggestModalOpen(true)}
              className={`px-7 py-3.5 rounded-2xl text-white font-black text-base transition-all active:scale-95 flex items-center gap-2.5 cursor-pointer ${
                isAdmin || isOwner 
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50"
                  : "bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/40"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>
                {isAdmin || isOwner 
                  ? (isAr ? "تعديل التقييم والطاقات" : "Edit Rating & Abilities") 
                  : (isAr ? "اقترح تعديل طاقات وتصنيف اللاعب" : "Suggest Rating & Abilities")}
              </span>
            </button>
          )}

          <button
            onClick={() => {
              const url = `${window.location.origin}/${player.username || player.uid}`;
              navigator.clipboard.writeText(url);
              toast.success(isAr ? "تم نسخ رابط الملف الشخصي!" : "Profile link copied to clipboard!");
            }}
            className="px-7 py-3.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl text-emerald-400 font-black text-base transition-all shadow-xl active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-emerald-400" />
            <span>{isAr ? "مشاركة الرابط" : "Share Profile Link"}</span>
          </button>

          {canExport && (
            <button
              onClick={() => generateProfilePDF(player, isAr ? 'ar' : 'en')}
              className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white font-black text-base transition-all shadow-lg shadow-emerald-950/40 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>{isAr ? "تصدير ملف PDF" : "Export PDF"}</span>
            </button>
          )}
        </motion.div>
      </main>

      {/* Modals */}
      <EditProfileModal
        player={player}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onRefresh={() => {}}
      />

      <SuggestPeerRatingModal
        player={player}
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />

      <OvrExplanationModal
        isOpen={isOvrInfoOpen}
        onClose={() => setIsOvrInfoOpen(false)}
        player={player}
        isOwnProfile={isViewingOwnProfile}
      />

      <PlayerComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        initialPlayerA={player}
        allPlayers={players}
      />
    </div>
  );
}
