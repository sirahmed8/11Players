"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePlayers } from "@/contexts/PlayersContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import SeasonCeremonyModal from "@/components/SeasonCeremonyModal";
import { getPlayerOverall } from "@/lib/playerUtils";
import { Trophy, Crown, Sparkles, Award, Medal, Shield, Star, Calendar, ArrowRight, History } from "lucide-react";
import { motion } from "framer-motion";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import Image from "next/image";

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
  const { isAdmin } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [showWizardModal, setShowWizardModal] = useState(false);
  const [history, setHistory] = useState<SeasonHistoryDoc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  if (loading || loadingCommunity) {
    return (
      <ProtectedRoute requireCommunity>
        <SiteSkeletonLoader />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Hero Section - Professional Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-3xl shadow-2xl shadow-amber-500/30 border-2 border-amber-400/30 p-8 sm:p-12 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-start space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold uppercase tracking-wider">
                  <Crown className="w-4 h-4 animate-bounce" />
                  <span>{isAr ? "حفل ختام الموسم والتتويج" : "Season Ceremony & Hall of Fame"}</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                  <span>{isAr ? `منصة أبطال الموسم` : `Season Champions Podium`}</span>
                  <Sparkles className="w-8 h-8 text-yellow-300 shrink-0" />
                </h1>
                <p className="text-sm sm:text-base text-amber-50 font-medium leading-relaxed">
                  {isAr
                    ? `احتفل بفرسان وأبطال الموسم في مجتمع ${activeCommunity?.name || ""} واستعرض متصدرين الإحصائيات والألقاب الذهبية.`
                    : `Celebrate the champions of ${activeCommunity?.name || "your community"} and explore top leaders across goals, assists, and MOTM awards.`}
                </p>
              </div>

              {isAdmin && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="shrink-0"
                >
                  <button
                    onClick={() => setShowWizardModal(true)}
                    className="px-8 py-4 rounded-2xl bg-white hover:bg-amber-50 text-amber-700 font-black text-sm sm:text-base shadow-xl shadow-black/20 flex items-center gap-3 transition-all border-2 border-amber-300"
                  >
                    <Crown className="w-5 h-5 fill-amber-700" />
                    <span>{isAr ? "بدء معالج حفل التتويج وتصفير الموسم 🚀" : "Launch Ceremony & Reset Wizard 🚀"}</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-10 space-y-12">
          {/* Current Season Leaders / Podium */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Trophy className="w-7 h-7 text-amber-500" />
                <span>{isAr ? `متصدرين الموسم الحالي (${currentYear})` : `Current Season Leaders (${currentYear})`}</span>
              </h2>
            </div>

            {!winners || (!winners.ballonDor && !winners.topScorer && !winners.topAssister && !winners.topMVP) ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
                <Medal className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? "لم يتم تسجيل إحصائيات كافية بعد" : "No Qualifying Stats Yet"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {isAr
                    ? "ستظهر منصة التتويج والكرة الذهبية تلقائياً بمجرد تسجيل الأهداف والتمريرات الحاسمة في مباريات الموسم الحالي."
                    : "The podium and Ballon d'Or candidates will appear automatically once goals and assists are recorded in matches."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Ballon d'Or Card (Featured Big) */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-gradient-to-br from-amber-500/20 via-slate-900 to-yellow-600/10 border-2 border-amber-500/60 rounded-3xl shadow-xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden md:col-span-2 lg:col-span-1"
                >
                  <div className="absolute -top-6 -right-6 text-8xl opacity-10 select-none pointer-events-none">👑</div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                        <span>👑</span>
                        <span>{isAr ? "الكرة الذهبية (Ballon d'Or)" : "Ballon d'Or"}</span>
                      </span>
                    </div>

                    {winners.ballonDor ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/30 border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                          {winners.ballonDor.photoUrl ? (
                            <Image
                              src={winners.ballonDor.photoUrl}
                              alt={winners.ballonDor.cardName || winners.ballonDor.fullName}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Crown className="w-8 h-8 text-amber-300" />
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <h3 className="text-xl font-black text-white truncate">
                            {winners.ballonDor.cardName || winners.ballonDor.fullName}
                          </h3>
                          <p className="text-xs text-amber-300/80 font-semibold mt-0.5">
                            {winners.ballonDor.primaryPosition || "Player"} • {getPlayerOverall(winners.ballonDor)} OVR
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد لاعب مؤهل" : "No eligible candidate yet"}
                      </p>
                    )}
                  </div>

                  {winners.ballonDor && (
                    <div className="mt-6 pt-4 border-t border-amber-500/30 flex items-center justify-between text-xs font-black text-amber-300">
                      <span className="flex items-center gap-1">⚽ {winners.ballonDor.stats?.goals || 0} {isAr ? "أهداف" : "Goals"}</span>
                      <span className="flex items-center gap-1">👟 {winners.ballonDor.stats?.assists || 0} {isAr ? "صناعة" : "Assists"}</span>
                      <span className="flex items-center gap-1">⭐ {winners.ballonDor.stats?.mvp || 0} {isAr ? "نجم" : "MOTM"}</span>
                    </div>
                  )}
                </motion.div>

                {/* Golden Boot Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30">
                        <span>⚽</span>
                        <span>{isAr ? "الحذاء الذهبي (الهداف)" : "Golden Boot"}</span>
                      </span>
                    </div>

                    {winners.topScorer ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 overflow-hidden shrink-0 flex items-center justify-center">
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
                          <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                            {winners.topScorer.cardName || winners.topScorer.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {winners.topScorer.primaryPosition || "Player"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد أهداف مسجلة" : "No goals recorded yet"}
                      </p>
                    )}
                  </div>

                  {winners.topScorer && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      <span>{isAr ? "إجمالي الأهداف" : "Total Goals"}</span>
                      <span className="text-base font-black">{winners.topScorer.stats?.goals || 0}</span>
                    </div>
                  )}
                </motion.div>

                {/* Top Playmaker Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-cyan-500/30">
                        <span>🎯</span>
                        <span>{isAr ? "أفضل صانع ألعاب" : "Top Playmaker"}</span>
                      </span>
                    </div>

                    {winners.topAssister ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 overflow-hidden shrink-0 flex items-center justify-center">
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
                          <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                            {winners.topAssister.cardName || winners.topAssister.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {winners.topAssister.primaryPosition || "Player"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد تمريرات مسجلة" : "No assists recorded yet"}
                      </p>
                    )}
                  </div>

                  {winners.topAssister && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-cyan-600 dark:text-cyan-400">
                      <span>{isAr ? "التمريرات الحاسمة" : "Total Assists"}</span>
                      <span className="text-base font-black">{winners.topAssister.stats?.assists || 0}</span>
                    </div>
                  )}
                </motion.div>

                {/* Season MVP Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-purple-500/30">
                        <span>⭐</span>
                        <span>{isAr ? "رجل الموسم (MVP)" : "Season MVP"}</span>
                      </span>
                    </div>

                    {winners.topMVP ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 overflow-hidden shrink-0 flex items-center justify-center">
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
                          <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                            {winners.topMVP.cardName || winners.topMVP.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {winners.topMVP.primaryPosition || "Player"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد جوائز رجل مباراة" : "No MOTM awards recorded"}
                      </p>
                    )}
                  </div>

                  {winners.topMVP && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-purple-600 dark:text-purple-400">
                      <span>{isAr ? "جوائز رجل المباراة" : "MOTM Awards"}</span>
                      <span className="text-base font-black">{winners.topMVP.stats?.mvp || 0}</span>
                    </div>
                  )}
                </motion.div>

                {/* Golden Shield Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-blue-500/30">
                        <span>🛡️</span>
                        <span>{isAr ? "الدرع الذهبي (أفضل مدافع)" : "Golden Shield"}</span>
                      </span>
                    </div>

                    {winners.topDefender ? (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 overflow-hidden shrink-0 flex items-center justify-center">
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
                          <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                            {winners.topDefender.cardName || winners.topDefender.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {winners.topDefender.primaryPosition} • {getPlayerOverall(winners.topDefender)} OVR
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-400 mt-4">
                        {isAr ? "لا يوجد مدافع مؤهل" : "No qualifying defender"}
                      </p>
                    )}
                  </div>

                  {winners.topDefender && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      <span>{isAr ? "التقييم العام" : "Overall Rating"}</span>
                      <span className="text-base font-black">{getPlayerOverall(winners.topDefender)} OVR</span>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </section>

          {/* Past Seasons History Section */}
          <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <History className="w-7 h-7 text-slate-500" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {isAr ? "أرشيف المواسم السابقة وخزانة الأبطال" : "Past Seasons Archive & Hall of Champions"}
              </h2>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-slate-400 font-semibold">
                {isAr ? "جارٍ تحميل سجل المواسم..." : "Loading seasons archive..."}
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? "لا يوجد سجل مواسم سابقة بعد" : "No Past Seasons Archive"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {isAr
                    ? "عندما يقوم مسؤول المجتمع بختام الموسم وتصفير العدادات عبر معالج حفل التتويج، سيتم حفظ أبطال الموسم في هذا الأرشيف التاريخي للأبد."
                    : "When the community admin executes the season ceremony wizard, champions of each year are archived here permanently."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.map(doc => (
                  <div
                    key={doc.id}
                    className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span>{isAr ? `موسم ${doc.seasonYear}` : `Season ${doc.seasonYear}`}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {doc.totalPlayers || 0} {isAr ? "لاعب" : "Players"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      {doc.winners?.ballonDor && (
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-bold flex items-center gap-2">
                            <span>👑</span>
                            <span>{isAr ? "الكرة الذهبية" : "Ballon d'Or"}:</span>
                          </span>
                          <span className="font-black text-amber-500 dark:text-amber-400">{doc.winners.ballonDor.name}</span>
                        </div>
                      )}
                      {doc.winners?.topScorer && (
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-bold flex items-center gap-2">
                            <span>⚽</span>
                            <span>{isAr ? "الحذاء الذهبي" : "Golden Boot"}:</span>
                          </span>
                          <span className="font-black text-emerald-500 dark:text-emerald-400">{doc.winners.topScorer.name} ({doc.winners.topScorer.goals})</span>
                        </div>
                      )}
                      {doc.winners?.topAssister && (
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-bold flex items-center gap-2">
                            <span>🎯</span>
                            <span>{isAr ? "صانع الألعاب" : "Playmaker"}:</span>
                          </span>
                          <span className="font-black text-cyan-500 dark:text-cyan-400">{doc.winners.topAssister.name} ({doc.winners.topAssister.assists})</span>
                        </div>
                      )}
                      {doc.winners?.topMVP && (
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="font-bold flex items-center gap-2">
                            <span>⭐</span>
                            <span>{isAr ? "رجل الموسم" : "Season MVP"}:</span>
                          </span>
                          <span className="font-black text-purple-500 dark:text-purple-400">{doc.winners.topMVP.name} ({doc.winners.topMVP.mvp})</span>
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
