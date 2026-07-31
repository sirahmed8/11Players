"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePlayers } from "@/contexts/PlayersContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SeasonCeremonyModal from "@/components/match/SeasonCeremonyModal";
import { getPlayerOverall } from "@/lib/playerUtils";
import { Trophy, Crown, Sparkles, Medal, History, Send, FileDown, Trash2, Calendar, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { collection, getDocs, query, orderBy, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import Image from "next/image";
import { generateMasterBulkPDF } from "@/lib/pdf";

interface SeasonHistoryDoc {
  id: string;
  seasonYear: number;
  closedAt?: any;
  totalPlayers?: number;
  winners?: {
    ballonDor?: { uid: string; name: string; score?: number } | null;
    topScorer?: { uid: string; name: string; goals?: number } | null;
    topAssister?: { uid: string; name: string; assists?: number } | null;
    topMVP?: { uid: string; name: string; mvp?: number } | null;
  };
}

export default function SeasonCeremonyPage() {
  const { players, loading, refreshPlayers } = usePlayers();
  const { activeCommunityId, activeCommunity, loadingCommunity } = useCommunity();
  const { user, isAdmin, isOwner } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [showWizardModal, setShowWizardModal] = useState(false);
  const [history, setHistory] = useState<SeasonHistoryDoc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!activeCommunityId) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const q = query(
          collection(db, `communities/${activeCommunityId}/seasonHistory`),
          orderBy("seasonYear", "desc")
        );
        const snap = await getDocs(q);
        const docs: SeasonHistoryDoc[] = [];
        snap.forEach(d => {
          docs.push({ id: d.id, ...d.data() } as SeasonHistoryDoc);
        });
        setHistory(docs);
      } catch (err) {
        console.warn("Failed to load season history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [activeCommunityId]);

  const handleDeleteSeason = async (seasonId: string) => {
    if (!activeCommunityId) return;
    if (!window.confirm(isAr ? "هل أنت متأكد من حذف أرشيف هذا الموسم بالكامل؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to completely delete this season's archive? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, `communities/${activeCommunityId}/seasonHistory`, seasonId));
      setHistory(prev => prev.filter(h => h.id !== seasonId));
      toast.success(isAr ? "تم حذف أرشيف الموسم بنجاح" : "Season archive deleted successfully");
    } catch (err) {
      console.error("Error deleting season:", err);
      toast.error(isAr ? "فشل الحذف" : "Failed to delete season");
    }
  };

  const winners = useMemo(() => {
    if (!players || players.length === 0) return null;

    const topScorer = [...players].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))[0];
    const topAssister = [...players].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))[0];
    const topMVP = [...players].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0))[0];

    const ballonDor = [...players].sort((a, b) => {
      const aScore = ((a.stats?.goals || 0) * 2) + ((a.stats?.assists || 0) * 1) + ((a.stats?.mvp || 0) * 5);
      const bScore = ((b.stats?.goals || 0) * 2) + ((b.stats?.assists || 0) * 1) + ((b.stats?.mvp || 0) * 5);
      return bScore - aScore;
    })[0];

    const defensivePositions = ['CB', 'LB', 'RB', 'DMF', 'GK'];
    const topDefender = [...players]
      .filter(p => p.primaryPosition && defensivePositions.includes(p.primaryPosition))
      .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))[0] || null;

    return {
      ballonDor: (ballonDor && ((ballonDor.stats?.goals || 0) + (ballonDor.stats?.assists || 0) + (ballonDor.stats?.mvp || 0) > 0)) ? ballonDor : null,
      topScorer: (topScorer && (topScorer.stats?.goals || 0) > 0) ? topScorer : null,
      topAssister: (topAssister && (topAssister.stats?.assists || 0) > 0) ? topAssister : null,
      topMVP: (topMVP && (topMVP.stats?.mvp || 0) > 0) ? topMVP : null,
      topDefender: topDefender || null
    };
  }, [players]);

  // Broadcast Winners to Community Chat
  const handleBroadcastWinners = async () => {
    if (!activeCommunityId || !user || !winners) return;
    setBroadcasting(true);
    try {
      const bDorName = winners.ballonDor ? (winners.ballonDor.cardName || winners.ballonDor.fullName) : "N/A";
      const scorerName = winners.topScorer ? `${winners.topScorer.cardName || winners.topScorer.fullName} (${winners.topScorer.stats?.goals || 0} أهداف)` : "N/A";
      const assisterName = winners.topAssister ? `${winners.topAssister.cardName || winners.topAssister.fullName} (${winners.topAssister.stats?.assists || 0} صناعة)` : "N/A";
      const mvpName = winners.topMVP ? `${winners.topMVP.cardName || winners.topMVP.fullName} (${winners.topMVP.stats?.mvp || 0} ⭐)` : "N/A";

      const announcementText = isAr
        ? `🏆 [إعلان رسمي من إدارة المنصة]: تم إعلان أبطال موسم ${currentYear}!\n👑 الكرة الذهبية: ${bDorName}\n⚽ الحذاء الذهبي: ${scorerName}\n🎯 صانع الألعاب: ${assisterName}\n⭐ رجل الموسم: ${mvpName}\nمبروك لجميع الفرسان! 🎉`
        : `🏆 [Official Ceremony Broadcast]: Champions of Season ${currentYear} Announced!\n👑 Ballon d'Or: ${bDorName}\n⚽ Golden Boot: ${scorerName}\n🎯 Playmaker: ${assisterName}\n⭐ Season MVP: ${mvpName}\nCongratulations to all! 🎉`;

      await addDoc(collection(db, "communities", activeCommunityId, "chat"), {
        senderId: user.uid,
        senderName: user.displayName || "Admin",
        senderPhoto: user.photoURL || "",
        text: announcementText,
        createdAt: serverTimestamp(),
        isSystem: true,
      });

      toast.success(isAr ? "تم إرسال بث التتويج إلى المحادثة بنجاح! 📢" : "Broadcasted winners to community chat! 📢");
    } catch (err) {
      console.error("Broadcast failed:", err);
      toast.error(isAr ? "فشل إرسال البث" : "Failed to broadcast");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleExportPDF = () => {
    generateMasterBulkPDF(players, locale);
  };

  if (loading || loadingCommunity) {
    return (
      <ProtectedRoute requireCommunity>
        <SiteSkeletonLoader variant="ceremony" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen pb-24 bg-slate-950 text-white transition-colors duration-300" dir={isAr ? "rtl" : "ltr"}>
        {/* Hero Section — Solid Dark Slate Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Crown className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
                  <span>{isAr ? "حفل ختام الموسم والتتويج الرسمي" : "Official Season Closing Ceremony"}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
                  <span>{isAr ? `منصة أبطال المجتمع (${activeCommunity?.name || ""})` : `Community Champions (${activeCommunity?.name || ""})`}</span>
                  <Sparkles className="w-7 h-7 text-amber-400 shrink-0" />
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  {isAr
                    ? `احتفل بفرسان وأبطال الموسم في مجتمعك واستعرض متصدرين الإحصائيات والألقاب الذهبية للكرة الذهبية والحذاء الذهبي.`
                    : `Celebrate the top players of ${activeCommunity?.name || "your community"} across Ballon d'Or, Golden Boot, and MOTM awards.`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                {winners && (
                  <button
                    type="button"
                    onClick={handleBroadcastWinners}
                    disabled={broadcasting}
                    className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 font-black text-xs transition-all flex items-center justify-center gap-2 shadow"
                  >
                    <Send className={`w-4 h-4 ${broadcasting ? "animate-spin" : ""}`} />
                    <span>{isAr ? "بث الأبطال بالمحادثة 📢" : "Broadcast Winners 📢"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-400 font-black text-xs transition-all flex items-center justify-center gap-2 shadow"
                >
                  <FileDown className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? "تصدير التقرير PDF" : "Export PDF"}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setShowWizardModal(true)}
                    className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 fill-slate-950" />
                    <span>{isAr ? "تصفير الموسم وحفظ الأرشيف 🚀" : "Archive & Reset Season 🚀"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-10 space-y-12">
          {/* Current Season Leaders / Podium */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <span>{isAr ? `متصدرين الموسم الحالي (${currentYear})` : `Current Season Leaders (${currentYear})`}</span>
              </h2>
            </div>

            {!winners || (!winners.ballonDor && !winners.topScorer && !winners.topAssister && !winners.topMVP) ? (
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-xl">
                <Medal className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-black text-white">
                  {isAr ? "لم يتم تسجيل إحصائيات كافية بعد" : "No Qualifying Stats Yet"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-medium">
                  {isAr
                    ? "ستظهر منصة التتويج والكرة الذهبية تلقائياً بمجرد تسجيل الأهداف والتمريرات الحاسمة في مباريات الموسم الحالي."
                    : "The podium and Ballon d'Or candidates will appear automatically once goals and assists are recorded."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Ballon d'Or Card — Solid Dark Slate Accent */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden md:col-span-2 lg:col-span-1"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                        <span>👑</span>
                        <span>{isAr ? "الكرة الذهبية (Ballon d'Or)" : "Ballon d'Or"}</span>
                      </span>
                    </div>

                    {winners.ballonDor ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                          {winners.ballonDor.photoUrl ? (
                            <Image
                              src={winners.ballonDor.photoUrl}
                              alt={winners.ballonDor.cardName || winners.ballonDor.fullName}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Crown className="w-8 h-8 text-amber-400" />
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <h3 className="text-lg font-black text-white truncate">
                            {winners.ballonDor.cardName || winners.ballonDor.fullName}
                          </h3>
                          <p className="text-xs text-amber-400 font-semibold mt-0.5">
                            {winners.ballonDor.primaryPosition || "Player"} • {getPlayerOverall(winners.ballonDor)} OVR
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد لاعب مؤهل" : "No eligible candidate yet"}
                      </p>
                    )}
                  </div>

                  {winners.ballonDor && (
                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-black text-amber-400">
                      <span className="flex items-center gap-1">⚽ {winners.ballonDor.stats?.goals || 0} {isAr ? "أهداف" : "Goals"}</span>
                      <span className="flex items-center gap-1">👟 {winners.ballonDor.stats?.assists || 0} {isAr ? "صناعة" : "Assists"}</span>
                      <span className="flex items-center gap-1">⭐ {winners.ballonDor.stats?.mvp || 0} {isAr ? "نجم" : "MOTM"}</span>
                    </div>
                  )}
                </motion.div>

                {/* Golden Boot Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-slate-950 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-slate-800">
                        <span>⚽</span>
                        <span>{isAr ? "الحذاء الذهبي (الهداف)" : "Golden Boot"}</span>
                      </span>
                    </div>

                    {winners.topScorer ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {winners.topScorer.photoUrl ? (
                            <Image
                              src={winners.topScorer.photoUrl}
                              alt={winners.topScorer.cardName || winners.topScorer.fullName}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">⚽</span>
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <h3 className="text-base font-black text-white truncate">
                            {winners.topScorer.cardName || winners.topScorer.fullName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {winners.topScorer.primaryPosition || "Player"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد أهداف مسجلة" : "No goals recorded yet"}
                      </p>
                    )}
                  </div>

                  {winners.topScorer && (
                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-black text-emerald-400">
                      <span>{isAr ? "إجمالي الأهداف" : "Total Goals"}</span>
                      <span className="text-sm font-black">{winners.topScorer.stats?.goals || 0}</span>
                    </div>
                  )}
                </motion.div>

                {/* Top Playmaker Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-slate-950 text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-slate-800">
                        <span>🎯</span>
                        <span>{isAr ? "أفضل صانع ألعاب" : "Top Playmaker"}</span>
                      </span>
                    </div>

                    {winners.topAssister ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {winners.topAssister.photoUrl ? (
                            <Image
                              src={winners.topAssister.photoUrl}
                              alt={winners.topAssister.cardName || winners.topAssister.fullName}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">🎯</span>
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <h3 className="text-base font-black text-white truncate">
                            {winners.topAssister.cardName || winners.topAssister.fullName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {winners.topAssister.primaryPosition || "Player"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد تمريرات مسجلة" : "No assists recorded yet"}
                      </p>
                    )}
                  </div>

                  {winners.topAssister && (
                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-black text-cyan-400">
                      <span>{isAr ? "التمريرات الحاسمة" : "Total Assists"}</span>
                      <span className="text-sm font-black">{winners.topAssister.stats?.assists || 0}</span>
                    </div>
                  )}
                </motion.div>

                {/* Season MVP Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-slate-950 text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-slate-800">
                        <span>⭐</span>
                        <span>{isAr ? "رجل الموسم (MVP)" : "Season MVP"}</span>
                      </span>
                    </div>

                    {winners.topMVP ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {winners.topMVP.photoUrl ? (
                            <Image
                              src={winners.topMVP.photoUrl}
                              alt={winners.topMVP.cardName || winners.topMVP.fullName}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">⭐</span>
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <h3 className="text-base font-black text-white truncate">
                            {winners.topMVP.cardName || winners.topMVP.fullName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {winners.topMVP.primaryPosition || "Player"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد جوائز رجل مباراة" : "No MOTM awards recorded"}
                      </p>
                    )}
                  </div>

                  {winners.topMVP && (
                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-black text-purple-400">
                      <span>{isAr ? "جوائز رجل المباراة" : "MOTM Awards"}</span>
                      <span className="text-sm font-black">{winners.topMVP.stats?.mvp || 0}</span>
                    </div>
                  )}
                </motion.div>

                {/* Golden Shield Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-slate-950 text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-slate-800">
                        <span>🛡️</span>
                        <span>{isAr ? "الدرع الذهبي (أفضل مدافع)" : "Golden Shield"}</span>
                      </span>
                    </div>

                    {winners.topDefender ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {winners.topDefender.photoUrl ? (
                            <Image
                              src={winners.topDefender.photoUrl}
                              alt={winners.topDefender.cardName || winners.topDefender.fullName}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">🛡️</span>
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <h3 className="text-base font-black text-white truncate">
                            {winners.topDefender.cardName || winners.topDefender.fullName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {winners.topDefender.primaryPosition} • {getPlayerOverall(winners.topDefender)} OVR
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد مدافع مؤهل" : "No qualifying defender"}
                      </p>
                    )}
                  </div>

                  {winners.topDefender && (
                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-black text-blue-400">
                      <span>{isAr ? "التقييم العام" : "Overall Rating"}</span>
                      <span className="text-sm font-black">{getPlayerOverall(winners.topDefender)} OVR</span>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </section>

          {/* Past Seasons History Section */}
          <section className="space-y-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-slate-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? "أرشيف المواسم السابقة وخزانة الأبطال" : "Past Seasons Archive & Hall of Champions"}
              </h2>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs">
                {isAr ? "جارٍ تحميل سجل المواسم..." : "Loading seasons archive..."}
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-xl">
                <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-black text-white">
                  {isAr ? "لا يوجد سجل مواسم سابقة بعد" : "No Past Seasons Archive"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-medium">
                  {isAr
                    ? "عندما يقوم مسؤول المجتمع بختام الموسم وتصفير العدادات عبر معالج حفل التتويج، سيتم حفظ أبطال الموسم في هذا الأرشيف التاريخي للأبد."
                    : "When the community admin executes the season ceremony wizard, champions of each year are archived here permanently."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.map(docItem => (
                  <div
                    key={docItem.id}
                    className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <span className="text-base font-black text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span>{isAr ? `موسم ${docItem.seasonYear}` : `Season ${docItem.seasonYear}`}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                          {docItem.totalPlayers || 0} {isAr ? "لاعب" : "Players"}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteSeason(docItem.id)}
                            className="p-1.5 rounded-full hover:bg-rose-950/40 text-rose-400 transition-colors"
                            title={isAr ? "حذف الموسم" : "Delete Season"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-xs">
                      {docItem.winners?.ballonDor && (
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="font-bold flex items-center gap-2">
                            <span>👑</span>
                            <span>{isAr ? "الكرة الذهبية" : "Ballon d'Or"}:</span>
                          </span>
                          <span className="font-black text-amber-400">{docItem.winners.ballonDor.name}</span>
                        </div>
                      )}
                      {docItem.winners?.topScorer && (
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="font-bold flex items-center gap-2">
                            <span>⚽</span>
                            <span>{isAr ? "الحذاء الذهبي" : "Golden Boot"}:</span>
                          </span>
                          <span className="font-black text-emerald-400">{docItem.winners.topScorer.name} ({docItem.winners.topScorer.goals})</span>
                        </div>
                      )}
                      {docItem.winners?.topAssister && (
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="font-bold flex items-center gap-2">
                            <span>🎯</span>
                            <span>{isAr ? "صانع الألعاب" : "Playmaker"}:</span>
                          </span>
                          <span className="font-black text-cyan-400">{docItem.winners.topAssister.name} ({docItem.winners.topAssister.assists})</span>
                        </div>
                      )}
                      {docItem.winners?.topMVP && (
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="font-bold flex items-center gap-2">
                            <span>⭐</span>
                            <span>{isAr ? "رجل الموسم" : "Season MVP"}:</span>
                          </span>
                          <span className="font-black text-purple-400">{docItem.winners.topMVP.name} ({docItem.winners.topMVP.mvp})</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Wizard Modal for Admin Ceremony Execution */}
        <SeasonCeremonyModal
          isOpen={showWizardModal}
          onClose={() => setShowWizardModal(false)}
          players={players}
          activeCommunityId={activeCommunityId || ""}
          locale={locale}
          onRefresh={refreshPlayers}
        />
      </div>
    </ProtectedRoute>
  );
}
