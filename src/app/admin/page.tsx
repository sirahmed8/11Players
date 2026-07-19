"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useCommunity } from "@/contexts/CommunityContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminTable from "@/components/AdminTable";
import { AnimatePresence, motion } from "framer-motion";
import { generateMasterBulkPDF } from "@/lib/pdf";
import { balanceTeams } from "@/lib/matchmaker";
import { generateTurfMatch } from "@/lib/turfMatchmaker";
import { generateDummyPlayersForCommunity } from "@/lib/dummyData";
import { useLocale } from "@/components/ThemeProvider";
import PendingRequests from "@/components/PendingRequests";
import MatchConfigModal, { MatchConfig } from "@/components/MatchConfigModal";
import { doc, setDoc, getDoc, deleteDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Target, AlertTriangle, Swords, FileDown, UserCheck, UserX, Sparkles, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";

export default function AdminPage() {
  const { user, isOwner } = useAuth();
  const { players, loading, refreshPlayers } = usePlayers();
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  // Auto-run daily peer rating aggregation on first admin visit each day
  useEffect(() => {
    if (!activeCommunityId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { runDailyRatingAggregation } = await import("@/lib/ratingAggregator");
        const result = await runDailyRatingAggregation(activeCommunityId);
        if (!cancelled && result.updatedCount > 0) {
          toast.success(isAr
            ? `تم تحديث تقييمات ${result.updatedCount} لاعب`
            : `Updated peer ratings for ${result.updatedCount} players`);
        }
      } catch (err) {
        // Silent fail — aggregation is best-effort background work
        console.warn("Daily aggregation skipped:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCommunityId, user, isAr]);

  // Matchmaking State
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [matchmakingError, setMatchmakingError] = useState("");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false);
  const [showDummyConfirm, setShowDummyConfirm] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const executeGenerateDummyPlayers = async () => {
    if (!activeCommunityId) return;
    setShowDummyConfirm(false);
    setIsGeneratingDummy(true);
    try {
      await generateDummyPlayersForCommunity(activeCommunityId);
      toast.success(isAr ? "تم إنشاء 32 لاعب بنجاح!" : "Successfully generated 32 players!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل الإنشاء" : "Failed to generate players.");
    } finally {
      setIsGeneratingDummy(false);
    }
  };

  const handleGenerateDummyPlayers = () => {
    setShowDummyConfirm(true);
  };

  const handleResetCaptainVotes = async () => {
    if (!activeCommunityId) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? "إعادة تعيين أصوات الكابتن" : "Reset Captain Votes",
      message: isAr ? "هل أنت متأكد من رغبتك في إعادة تعيين جميع أصوات الكابتن في هذا المجتمع؟" : "Are you sure you want to reset all captain votes in this community?",
      onConfirm: async () => {
        try {
          let count = 0;
          for (const p of players) {
            if (p.captainVotes && p.captainVotes.length > 0) {
              await updateDoc(doc(db, "players", p.uid), {
                captainVotes: []
              });
              count++;
            }
          }
          toast.success(isAr ? `تمت إعادة تعيين أصوات الكابتن لـ ${count} لاعبين بنجاح.` : `Successfully reset captain votes for ${count} players.`);
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "حدث خطأ أثناء إعادة تعيين الأصوات" : "Error resetting captain votes");
        }
      }
    });
  };

  const handleMatchmaking = async (config: MatchConfig) => {
    try {
      if (!activeCommunityId) throw new Error("No active community selected");
      setMatchmakingLoading(true);
      setMatchmakingError("");
      
      // Filter by excluded + by explicit selection from MatchConfigModal
      let availablePlayers = players.filter((p) => !p.isExcludedFromMatchmaking);
      if (config.selectedPlayerUids && config.selectedPlayerUids.length > 0) {
        const selectedSet = new Set(config.selectedPlayerUids);
        availablePlayers = availablePlayers.filter(p => selectedSet.has(p.uid));
      }
      const playerIds = availablePlayers.map((p) => p.uid);

      if (!config.isOpenRegistration && playerIds.length < 4) {
        setMatchmakingError(isAr ? `توزيع الفرق يتطلب 4 لاعبين على الأقل. يوجد حالياً ${playerIds.length}.` : `Matchmaking requires at least 4 players. Currently have ${playerIds.length}.`);
        setMatchmakingLoading(false);
        return;
      }

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      const matchId = `match_${Date.now()}`;
      let matchData: object;

      if (config.isOpenRegistration) {
        // ── Open Registration / Booking Mode ──
        matchData = {
          id: matchId,
          success: true,
          status: 'registering',
          matchMode: config.matchMode || 'turf',
          maxPlayers: (config.playersPerTeam || 6) * (config.numTeams || 2),
          signedUpPlayerUids: [],
          config,
          generatedAt: new Date().toISOString(),
        };
      } else if (config.matchMode === 'turf') {
        // ── Turf / Casual Mode ──
        const turfConfig = {
          numTeams: config.numTeams || 2,
          playersPerTeam: config.playersPerTeam || 6,
          gkMode: (config.gkMode || 'rotating') as 'fixed' | 'rotating',
          fixedGkTeamA: config.fixedGkTeamA,
          fixedGkTeamB: config.fixedGkTeamB,
          gkRotationInterval: (config.gkRotationInterval || 'per_match') as 'per_goal' | 'per_time',
          gkRotationMinutes: config.gkRotationMinutes,
          matchType: (config.matchType === 'winner_stays' ? 'winner_stays' : config.matchType || 'league') as 'league' | 'knockout' | 'winner_stays',
          matchDurationMins: config.matchDurationMins || 20,
          endCondition: config.endCondition || 'time',
          targetGoals: config.targetGoals || 3,
        };
        const turfResult = generateTurfMatch(availablePlayers, turfConfig);
        matchData = {
          id: matchId,
          success: true,
          status: 'active',
          matchMode: 'turf',
          turfResult,
          config,
          generatedAt: new Date().toISOString(),
        };
      } else {
        // ── Standard 11v11 Mode ──
        const result = balanceTeams(availablePlayers);
        matchData = {
          id: matchId,
          success: true,
          status: 'active',
          matchMode: 'standard',
          teamA: result.teamA,
          teamB: result.teamB,
          bench: [...(result.benchA || []), ...(result.benchB || [])],
          metrics: result.metrics,
          formation: result.formation,
          tipsAndTactics: result.tipsAndTactics,
          config,
          generatedAt: new Date().toISOString(),
        };
      }

      // Save to Firestore
      try {
        await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), matchData);
        // Also save a historical record
        await setDoc(doc(db, "communities", activeCommunityId, "matches", matchId), matchData);
        
        toast.success(isAr ? "تم إنشاء المباراة ونقلها لصفحة التشكيلة بنجاح!" : "Match generated successfully! Redirecting to match page...");
        setIsConfigModalOpen(false);
        router.push("/match");
      } catch (err) {
        console.error("Failed to save match to database:", err);
        toast.error(isAr ? "فشل حفظ المباراة" : "Failed to save match");
      }
    } catch (error: any) {
      setMatchmakingError(error.message || "Matchmaking failed.");
    } finally {
      setMatchmakingLoading(false);
    }
  };

  const handleBulkPdf = () => {
    generateMasterBulkPDF(players, isAr ? 'ar' : 'en');
  };

  const handleMakeMeAdmin = () => {
    if (!activeCommunityId || !user) return;
    const isAlreadyAdmin = players.some(p => p.uid === user.uid);

    if (isAlreadyAdmin) {
      setConfirmModal({
        isOpen: true,
        title: isAr ? "إزالة الصلاحية" : "Remove Admin Role",
        message: isAr ? "هل أنت متأكد أنك تريد إزالة نفسك كمسؤول؟" : "Are you sure you want to remove yourself as Admin?",
        onConfirm: async () => {
          try {
            await deleteDoc(doc(db, "communities", activeCommunityId, "players", user.uid));
            toast.success(isAr ? "تم إزالتك بنجاح" : "Successfully removed as Admin");
          } catch (err) {
            console.error(err);
            toast.error("Failed to remove admin");
          }
        }
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: isAr ? "إضافة كمسؤول" : "Add Admin Role",
        message: isAr ? "هل أنت متأكد أنك تريد إضافة نفسك كمسؤول؟" : "Are you sure you want to add yourself as Admin?",
        onConfirm: async () => {
          try {
            const pDoc = await getDoc(doc(db, "players", user.uid));
            const pData = pDoc.exists() ? pDoc.data() : {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || 'Owner',
              cardName: user.displayName || 'Owner',
            };
            await setDoc(doc(db, "communities", activeCommunityId, "players", user.uid), {
              ...pData,
              role: "admin",
              joinedAt: new Date().toISOString()
            }, { merge: true });
            toast.success(isAr ? "تم إضافتك كمسؤول بنجاح" : "Successfully added as Admin");
          } catch (err) {
            console.error(err);
            toast.error("Failed to add admin");
          }
        }
      });
    }
  };


  return (
    <ProtectedRoute adminOnly requireCommunity={false}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12">
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {!activeCommunityId ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isAr ? "لا يوجد مجتمع محدد" : "No Community Selected"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                {isAr ? "يرجى تحديد مجتمع من قائمة المجتمعات للوصول إلى أدوات التحكم." : "Please select a community from the communities list to access admin controls."}
              </p>
              <a href="/communities" className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                {isAr ? "الذهاب للمجتمعات" : "Go to Communities"}
              </a>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-3">
                  <div>
                    <h2 className="text-3xl font-black mb-1.5 text-slate-900 dark:text-white flex items-center gap-2.5">
                      <span>{isAr ? "أدوات التحكم وإدارة المنصة" : "Platform Control Center"}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        {isAr ? "الإدارة الشاملة" : "EXECUTIVE"}
                      </span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium" dir={isAr ? "rtl" : "ltr"}>
                      {isAr
                        ? "تنظيم البطولات وتشكيل الفرق بالذكاء الاصطناعي وتصدير التقارير الرسمية وإدارة الصلاحيات."
                        : "AI Matchmaking, official roster exports, squad synchronization, and platform permissions."}
                    </p>
                  </div>
                </div>

                {/* Organized Luxury Control Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Card 1: Matchmaking Engine (Primary CTA) */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-900/90 dark:to-teal-950 text-white p-6 shadow-xl flex flex-col justify-between border border-emerald-400/30">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                          <Swords className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/20">
                          {isAr ? "محرك الفرق AI" : "AI ENGINE"}
                        </span>
                      </div>
                      <h3 className="text-xl font-black mb-1">{isAr ? "تشكيل وتوزيع الفرق" : "Squad Matchmaking"}</h3>
                      <p className="text-emerald-100 text-xs leading-relaxed mb-6">
                        {isAr
                          ? "توزيع متوازن عادل للفرق بناءً على التقييم الواقعي (OVR) ومراكز اللعب والتناغم."
                          : "Balanced AI team generation based on realistic OVR ratings, positions, and chemistry."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={() => setIsConfigModalOpen(true)}
                        disabled={matchmakingLoading}
                        className="w-full py-3.5 px-5 bg-white text-emerald-950 hover:bg-emerald-50 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                      >
                        <Swords className="w-5 h-5 text-emerald-600" />
                        <span>{matchmakingLoading ? (isAr ? "جارٍ التشكيل..." : "Generating Squads...") : (isAr ? "بدء تشكيل الفرق الآن" : "Run AI Matchmaking")}</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (!user || !activeCommunityId) return;
                          const isExcluded = players.find(p => p.uid === user.uid)?.isExcludedFromMatchmaking;
                          const docRef = doc(db, 'communities', activeCommunityId, 'players', user.uid);
                          await setDoc(docRef, { isExcludedFromMatchmaking: !isExcluded }, { merge: true });
                          const globalDocRef = doc(db, 'players', user.uid);
                          await setDoc(globalDocRef, { isExcludedFromMatchmaking: !isExcluded }, { merge: true });
                          toast.success(isExcluded ? (isAr ? "تم إضافتك للتشكيل" : "Included in matchmaking") : (isAr ? "تم استبعادك" : "Excluded from matchmaking"));
                        }}
                        className="w-full py-2.5 px-4 bg-black/20 hover:bg-black/30 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {players.find(p => p.uid === user?.uid)?.isExcludedFromMatchmaking ? (
                          <>
                            <UserCheck className="w-4 h-4 text-emerald-300" />
                            <span>{isAr ? "تضمين حسابي في التشكيل القادم" : "Include me in next match"}</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 text-amber-300" />
                            <span>{isAr ? "استبعاد حسابي مؤقتاً من التشكيل" : "Exclude me from next match"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Official Reports & Bulk PDF */}
                  <div className="rounded-3xl bg-white dark:bg-slate-800/90 p-6 shadow-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <FileDown className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {isAr ? "تصدير رسمي" : "REPORTS"}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                        {isAr ? "بطاقات وقوائم جميع اللاعبين" : "Master Roster PDF"}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6">
                        {isAr
                          ? "تصدير كتيب احترافي يشمل جميع بطاقات اللاعبين مع الإحصائيات والتقييمات بجودة عالية للطباعة."
                          : "Export a high-definition official PDF catalogue containing all player cards and stats."}
                      </p>
                    </div>

                    <button
                      onClick={handleBulkPdf}
                      className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5"
                    >
                      <FileDown className="w-5 h-5 text-amber-400" />
                      <span>{isAr ? "تصدير الكتيب الشامل PDF" : "Export Master Roster PDF"}</span>
                    </button>
                  </div>

                  {/* Card 3: System Testing & Admin Actions */}
                  <div className="rounded-3xl bg-white dark:bg-slate-800/90 p-6 shadow-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {isAr ? "أدوات المحاكاة" : "TOOLS"}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                        {isAr ? "المحاكاة والصلاحيات" : "Simulation & Roles"}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6">
                        {isAr
                          ? "إنشاء لاعبين وهميين لاختبار تشكيل الفرق أو تعديل صلاحيات المسؤول في المجتمع."
                          : "Generate dummy players to test match balancing or toggle your admin sync status."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={handleGenerateDummyPlayers}
                        disabled={isGeneratingDummy}
                        className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50 border border-indigo-200/60 dark:border-indigo-500/20"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isGeneratingDummy ? (isAr ? "جارٍ الإنشاء..." : "Generating...") : (isAr ? "إنشاء 32 لاعب وهمي للتجربة" : "Generate 32 Dummy Players")}</span>
                      </button>

                      {(isOwner || players.length === 0) && (
                        <button
                          onClick={handleMakeMeAdmin}
                          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <span>
                            {user && players.some(p => p.uid === user.uid)
                              ? (isAr ? "إلغاء صلاحية المسؤول لحسابي" : "Remove me as Admin")
                              : (isAr ? "مزامنة صلاحية المسؤول لحسابي" : "Sync Admin Permissions")}
                          </span>
                        </button>
                      )}
                      
                      <button
                        onClick={handleResetCaptainVotes}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <UserX className="w-4 h-4 text-red-500" />
                        <span>{isAr ? "إعادة تعيين تصويتات الكابتن" : "Reset Captain Votes"}</span>
                      </button>

                    </div>
                  </div>
                </div>
              </div>

              {matchmakingError && (
                <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-xl font-medium">
                  {matchmakingError}
                </div>
              )}

              <PendingRequests />

              {loading ? (
                <SiteSkeletonLoader variant="cards" />
              ) : (
                <AdminTable players={players} onRefresh={refreshPlayers || (() => {})} />
              )}
            </>
          )}
        </main>

        <MatchConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onGenerate={handleMatchmaking}
          communityPlayers={players}
        />

        {/* Dummy Generation Confirm Modal */}
        <AnimatePresence>
          {showDummyConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full relative"
                dir={isAr ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
                  <AlertTriangle className="w-8 h-8" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {isAr ? "تأكيد الإنشاء" : "Confirm Generation"}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  {isAr 
                    ? "هل أنت متأكد من رغبتك في إنشاء 32 لاعب وهمي؟ سيتم إضافتهم إلى مجتمعك الحالي لغرض التجربة." 
                    : "Are you sure you want to generate 32 dummy players? They will be added to your active community for testing purposes."}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDummyConfirm(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={executeGenerateDummyPlayers}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transition-colors"
                  >
                    {isAr ? "تأكيد وإنشاء" : "Confirm & Generate"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
        />
      </div>
    </ProtectedRoute>
  );
}
