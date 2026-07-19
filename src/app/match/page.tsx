"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { doc, onSnapshot, collection, updateDoc, arrayUnion, arrayRemove, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlayerCard from "@/components/PlayerCard";
import { PlayerProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import MatchPitchDisplay from "@/components/MatchPitchDisplay";
import PlayerCardCompact from "@/components/PlayerCardCompact";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useRouter, useSearchParams } from "next/navigation";
import RecordStatsModal from "@/components/RecordStatsModal";
import PlayerRatingModal from "@/components/PlayerRatingModal";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import TurfMatchDisplay from "@/components/TurfMatchDisplay";
import MatchConfigModal, { MatchConfig } from "@/components/MatchConfigModal";
import { generateTurfMatch } from "@/lib/turfMatchmaker";
import { balanceTeams } from "@/lib/matchmaker";
import toast from "react-hot-toast";

export default function MatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const { user, isAdmin } = useAuth();
  const { activeCommunityId } = useCommunity();
  const { players } = usePlayers();
  
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Match History state — respect ?tab=history from query string (e.g. rate-match toast)
  const [activeTab, setActiveTab] = useState<'current' | 'history'>(() => {
    return searchParams.get('tab') === 'history' ? 'history' : 'current';
  });
  const [historyMatches, setHistoryMatches] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState<any>(null);

  useEffect(() => {
    if (!activeCommunityId) return;
    const unsub = onSnapshot(doc(db, "communities", activeCommunityId, "matches", "latest"), (docSnap) => {
      if (docSnap.exists()) {
        setMatchData(docSnap.data());
      } else {
        setMatchData(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError(isAr ? "فشل في جلب تفاصيل المباراة." : "Failed to load match details.");
      setLoading(false);
    });

    setHistoryLoading(true);
    const unsubHistory = onSnapshot(collection(db, "communities", activeCommunityId, "matches"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== "latest") {
          list.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
      list.sort((a, b) => {
        const timeA = a.finishedAt || a.generatedAt || "";
        const timeB = b.finishedAt || b.generatedAt || "";
        return timeB.localeCompare(timeA);
      });
      setHistoryMatches(list);
      setHistoryLoading(false);
    }, (err) => {
      console.error("Failed to load match history:", err);
      setHistoryLoading(false);
    });

    return () => {
      unsub();
      unsubHistory();
    };
  }, [isAr, activeCommunityId]);

  const handleToggleSignInToBooking = async () => {
    if (!activeCommunityId || !user || !matchData || isSubmittingBooking) return;
    setIsSubmittingBooking(true);
    try {
      const isSignedUp = (matchData.signedUpPlayerUids || []).includes(user.uid);
      const latestRef = doc(db, "communities", activeCommunityId, "matches", "latest");
      const matchRef = doc(db, "communities", activeCommunityId, "matches", matchData.id);

      if (isSignedUp) {
        await updateDoc(latestRef, { signedUpPlayerUids: arrayRemove(user.uid) });
        await updateDoc(matchRef, { signedUpPlayerUids: arrayRemove(user.uid) }).catch(() => {});
        toast.success(isAr ? "تم إلغاء تسجيل حضورك" : "You have signed out from this match");
      } else {
        const currentCount = (matchData.signedUpPlayerUids || []).length;
        if (matchData.maxPlayers && currentCount >= matchData.maxPlayers) {
          toast.error(isAr ? "عذراً، اكتمل العدد المطلوب للحجز" : "Sorry, booking capacity reached");
        } else {
          await updateDoc(latestRef, { signedUpPlayerUids: arrayUnion(user.uid) });
          await updateDoc(matchRef, { signedUpPlayerUids: arrayUnion(user.uid) }).catch(() => {});
          toast.success(isAr ? "تم تسجيل حضورك للمباراة بنجاح! ⚽" : "Successfully signed in for the match! ⚽");
        }
      }
    } catch (err: any) {
      console.error("Sign in/out error:", err);
      toast.error(isAr ? "حدث خطأ أثناء التسجيل" : "Failed to update attendance");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleGenerateFromBooking = async () => {
    if (!activeCommunityId || !matchData || matchData.status !== 'registering') return;
    const signedUpUids = matchData.signedUpPlayerUids || [];
    if (signedUpUids.length < 4) {
      toast.error(isAr ? "يتطلب تكوين الفرق 4 لاعبين مسجلين على الأقل" : "Generating teams requires at least 4 checked-in players");
      return;
    }
    try {
      const signedUpPlayers = players.filter(p => signedUpUids.includes(p.uid));
      const config = matchData.config || {};
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
      const turfResult = generateTurfMatch(signedUpPlayers, turfConfig);
      const updatedData = {
        ...matchData,
        status: 'active',
        turfResult,
        generatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), updatedData);
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchData.id), updatedData);
      toast.success(isAr ? "تم تكوين الفرق بنجاح وبدء المباراة!" : "Teams generated and match active!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل تكوين الفرق" : "Failed to generate teams");
    }
  };

  const handleRemakeTeams = async () => {
    if (!activeCommunityId || !matchData || !matchData.turfResult) return;
    try {
      const activePlayers = matchData.turfResult.teams.flatMap((t: any) => t.players);
      const config = matchData.config || {};
      const turfConfig = {
        numTeams: config.numTeams || matchData.turfResult.numTeams || 2,
        playersPerTeam: config.playersPerTeam || matchData.turfResult.playersPerTeam || 6,
        gkMode: (config.gkMode || matchData.turfResult.gkMode || 'rotating') as 'fixed' | 'rotating',
        fixedGkTeamA: config.fixedGkTeamA,
        fixedGkTeamB: config.fixedGkTeamB,
        gkRotationInterval: (config.gkRotationInterval || matchData.turfResult.gkRotationInterval || 'per_match') as 'per_goal' | 'per_time',
        gkRotationMinutes: config.gkRotationMinutes,
        matchType: (config.matchType === 'winner_stays' ? 'winner_stays' : config.matchType || matchData.turfResult.matchType || 'league') as 'league' | 'knockout' | 'winner_stays',
        matchDurationMins: config.matchDurationMins || matchData.turfResult.matchDurationMins || 20,
        endCondition: config.endCondition || matchData.turfResult.endCondition || 'time',
        targetGoals: config.targetGoals || matchData.turfResult.targetGoals || 3,
      };
      const turfResult = generateTurfMatch(activePlayers, turfConfig);
      const updatedData = {
        ...matchData,
        turfResult,
        generatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), updatedData);
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchData.id), updatedData);
      toast.success(isAr ? "تم إعادة توزيع الفرق بخلط جديد!" : "Teams remade successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إعادة التوزيع" : "Failed to remake teams");
    }
  };

  const handleEndBooking = async () => {
    if (!activeCommunityId || !matchData) return;
    if (!window.confirm(isAr ? "هل أنت متأكد من رغبتك في إنهاء الحجز بالكامل؟ سيتم نقل المباراة للأرشيف." : "Are you sure you want to end this booking completely?")) return;
    try {
      let bestMotmPlayer: any = null;
      let highestMotmScore = -999;
      const allMatchPlayers = [
        ...(matchData.teamA || []),
        ...(matchData.teamB || []),
        ...(matchData.bench || []).map((b: any) => b.player || b),
        ...(matchData.turfResult?.teams || []).flatMap((t: any) => t.players || []),
        ...(matchData.signedUpPlayerUids ? players.filter(p => matchData.signedUpPlayerUids.includes(p.uid)) : [])
      ];
      const uniquePlayers = Array.from(new Map(allMatchPlayers.filter(p => p && p.uid).map(p => [p.uid, p])).values());
      uniquePlayers.forEach((p: any) => {
        const ovr = Number(p.overallRating || p.attributes?.pace || 70);
        const goals = Number(matchData.recordedStats?.[p.uid]?.goals || p.stats?.goals || 0);
        const assists = Number(matchData.recordedStats?.[p.uid]?.assists || p.stats?.assists || 0);
        const mvp = Boolean(matchData.recordedStats?.[p.uid]?.mvp || false);
        const score = (goals * 4) + (assists * 2.5) + (mvp ? 6 : 0) + (ovr * 0.15);
        if (score > highestMotmScore) {
          highestMotmScore = score;
          bestMotmPlayer = p;
        }
      });
      const aiMotm = matchData.aiMotm || (bestMotmPlayer ? {
        uid: bestMotmPlayer.uid,
        name: bestMotmPlayer.cardName || bestMotmPlayer.fullName || "Player",
        photoUrl: bestMotmPlayer.photoUrl || null,
        score: Math.round(highestMotmScore * 10) / 10,
        goals: matchData.recordedStats?.[bestMotmPlayer.uid]?.goals || 0,
        assists: matchData.recordedStats?.[bestMotmPlayer.uid]?.assists || 0,
        reasonEn: `AI Algorithmic selection based on match rating (${bestMotmPlayer.overallRating || 75} OVR) and match impact.`,
        reasonAr: `اختيار الذكاء الاصطناعي بناءً على التقييم العام (${bestMotmPlayer.overallRating || 75} OVR) وتأثير اللاعب في المباراة.`
      } : null);

      const finishedData = { ...matchData, status: 'finished', finishedAt: new Date().toISOString(), aiMotm };
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchData.id), finishedData);
      await deleteDoc(doc(db, "communities", activeCommunityId, "matches", "latest"));
      toast.success(isAr ? "تم إنهاء الحجز واختيار نجم المباراة بالأرشيف بنجاح!" : "Booking ended & AI Man of the Match selected successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء إنهاء الحجز" : "Failed to end booking");
    }
  };

  const handleCreateMatchFromPage = async (config: MatchConfig) => {
    if (!activeCommunityId) return;
    try {
      let availablePlayers = players.filter((p) => !p.isExcludedFromMatchmaking);
      if (config.selectedPlayerUids && config.selectedPlayerUids.length > 0) {
        const selectedSet = new Set(config.selectedPlayerUids);
        availablePlayers = availablePlayers.filter(p => selectedSet.has(p.uid));
      }
      const playerIds = availablePlayers.map((p) => p.uid);

      if (!config.isOpenRegistration && playerIds.length < 4) {
        toast.error(isAr ? `توزيع الفرق يتطلب 4 لاعبين على الأقل. يوجد حالياً ${playerIds.length}.` : `Matchmaking requires at least 4 players. Currently have ${playerIds.length}.`);
        return;
      }

      const matchId = `match_${Date.now()}`;
      let newMatchData: any;

      if (config.isOpenRegistration) {
        newMatchData = {
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
        newMatchData = {
          id: matchId,
          success: true,
          status: 'active',
          matchMode: 'turf',
          turfResult,
          config,
          generatedAt: new Date().toISOString(),
        };
      } else {
        const result = balanceTeams(availablePlayers);
        newMatchData = {
          id: matchId,
          success: true,
          status: 'active',
          matchMode: 'standard',
          teamA: result.teamA,
          teamB: result.teamB,
          config,
          generatedAt: new Date().toISOString(),
        };
      }

      await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), newMatchData);
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchId), newMatchData);
      setIsConfigModalOpen(false);
      toast.success(isAr ? "تم إنشاء المباراة / الحجز بنجاح!" : "Match / Booking created successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل في إنشاء المباراة أو الحجز" : "Failed to create match or booking");
    }
  };

  const displayMatch = activeTab === "history" ? selectedHistoryMatch : matchData;
  const isViewingHistory = activeTab === "history" && Boolean(selectedHistoryMatch);

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12">
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent mb-4">
              {isAr ? "المباريات والتشكيلات" : "Matches & Lineups"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-6">
              {isAr 
                ? "تابع التشكيلات والتكتيكات للمباراة القادمة، أو استعرض سجل المباريات السابقة والإحصائيات المسجلة."
                : "View upcoming match lineups and tactics, or explore historical matches and recorded statistics."}
            </p>

            {/* Admin Make a Match / Open Booking Action Button */}
            {isAdmin && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all duration-200 flex items-center gap-2.5 active:scale-95 border border-emerald-400/30"
                >
                  <span className="text-xl">⚡</span>
                  <span>{isAr ? "إنشاء مباراة جديدة أو فتح حجز (Hagaz)" : "Make a Match / Open Booking (Hagaz)"}</span>
                </button>
              </div>
            )}

            {/* Tab Switcher */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-2">
                <button
                  onClick={() => { setActiveTab('current'); setSelectedHistoryMatch(null); }}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'current'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>⚡</span>
                  <span>{isAr ? "المباراة القادمة" : "Upcoming Match"}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('history'); setSelectedHistoryMatch(null); }}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'history'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>📜</span>
                  <span>{isAr ? "سجل المباريات السابقة" : "Match History"}</span>
                </button>
              </div>
            </div>

            {/* Config banner for displayed match */}
            {displayMatch?.config && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-3xl mx-auto shadow-sm flex flex-wrap justify-center gap-6 mb-8">
                {displayMatch.config.date && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "التاريخ" : "Date"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{displayMatch.config.date}</p>
                    </div>
                  </div>
                )}
                {displayMatch.config.time && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "الوقت" : "Time"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{displayMatch.config.time}</p>
                    </div>
                  </div>
                )}
                {displayMatch.config.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏟️</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "الملعب" : "Location"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{displayMatch.config.location}</p>
                    </div>
                  </div>
                )}
                {displayMatch.config.cost && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "التكلفة" : "Cost"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{displayMatch.config.cost}</p>
                    </div>
                  </div>
                )}
                {displayMatch.config.notes && (
                  <div className="w-full mt-2 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">📝 {isAr ? "ملاحظة:" : "Note:"} </span>
                      {displayMatch.config.notes}
                    </p>
                  </div>
                )}
                
                {isAdmin && !isViewingHistory && (
                  <div className="w-full mt-4 flex justify-center">
                    <button 
                      onClick={() => setIsRecordModalOpen(true)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-transform active:scale-95"
                    >
                      {isAr ? "إنهاء المباراة وتسجيل الإحصائيات" : "End Match & Record Stats"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeTab === 'history' && !selectedHistoryMatch ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {historyLoading ? (
                <SiteSkeletonLoader variant="match" />
              ) : historyMatches.length === 0 ? (
                <div className="text-center py-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center gap-4">
                  <span className="text-6xl mb-2">📜</span>
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "لا توجد مباريات مسجلة في السجل بعد" : "No Match History Found"}
                  </h3>
                  <p className="text-slate-500 max-w-md">
                    {isAr ? "ستظهر هنا جميع المباريات السابقة وإحصائياتها بمجرد إنشاء وإنهاء المباريات." : "All past matches and recorded statistics will appear here once matches are generated and finished."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyMatches.map((m) => {
                    const isFinished = m.status === 'finished' || m.recordedStats;
                    const scoreA = m.recordedStats?.teamAScore;
                    const scoreB = m.recordedStats?.teamBScore;
                    const hasScore = typeof scoreA === 'number' && typeof scoreB === 'number';

                    return (
                      <motion.div
                        key={m.id}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between relative overflow-hidden group"
                      >

                        
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <span>📅</span>
                              <span>{m.config?.date || new Date(m.finishedAt || m.generatedAt || Date.now()).toLocaleDateString()}</span>
                            </span>
                            <span className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 ${
                              isFinished 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                            }`}>
                              <span>{isFinished ? '✅' : '⏳'}</span>
                              <span>{isFinished ? (isAr ? 'مكتملة' : 'Finished') : (isAr ? 'مسجلة' : 'Recorded')}</span>
                            </span>
                          </div>

                          {m.config?.location && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1 font-medium">
                              <span>🏟️</span>
                              <span>{m.config.location}</span>
                            </p>
                          )}

                          {/* Matchup Score Card */}
                          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 my-4 flex items-center justify-between">
                            <div className="text-center flex-1">
                              <p className="text-sm font-black text-blue-600 dark:text-blue-400 mb-1">Team A</p>
                              <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                                {m.formation?.teamA || '4-3-3'}
                              </span>
                            </div>

                            <div className="px-3 flex flex-col items-center justify-center">
                              {hasScore ? (
                                <div className="flex items-center gap-2 bg-amber-500 text-white font-black text-lg px-4 py-1.5 rounded-xl shadow-md">
                                  <span>{scoreA}</span>
                                  <span>-</span>
                                  <span>{scoreB}</span>
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-500">
                                  VS
                                </div>
                              )}
                            </div>

                            <div className="text-center flex-1">
                              <p className="text-sm font-black text-red-600 dark:text-red-400 mb-1">Team B</p>
                              <span className="text-[10px] font-mono bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 px-2 py-0.5 rounded font-bold">
                                {m.formation?.teamB || '4-4-2'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedHistoryMatch(m)}
                          className="w-full mt-2 py-3 bg-slate-800 hover:bg-amber-500 dark:bg-slate-700 dark:hover:bg-amber-500 text-white font-bold rounded-xl shadow transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <span>👁️</span>
                          <span>{isAr ? "عرض التفاصيل والتشكيلة" : "View Full Match details"}</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(isAr ? 'هل تريد حذف هذه المباراة نهائياً؟ سيتم حذف جميع الإحصائيات والتقييمات.' : 'Delete this match permanently? All stats and ratings will be removed.')) return;
                              try {
                                const { doc: fbDoc, deleteDoc, getDoc, updateDoc, increment, collection: coll, getDocs } = await import('firebase/firestore');
                                if (m.recordedStats) {
                                  const allPlayers = [...(m.teamA || []), ...(m.teamB || [])];
                                  for (const p of allPlayers) {
                                    const pStats = m.recordedStats[p.uid];
                                    if (pStats) {
                                      try {
                                        const pRef = fbDoc(db, 'players', p.uid);
                                        const pSnap = await getDoc(pRef);
                                        if (pSnap.exists()) {
                                          await updateDoc(pRef, {
                                            'stats.goals': increment(-(Number(pStats.goals) || 0)),
                                            'stats.assists': increment(-(Number(pStats.assists) || 0)),
                                            'stats.yellowCards': increment(-(Number(pStats.yellowCards) || 0)),
                                            'stats.redCards': increment(-(Number(pStats.redCards) || 0)),
                                            'stats.mvp': increment(pStats.mvp ? -1 : 0),
                                            'stats.matchesPlayed': increment(-1),
                                          });
                                        }
                                      } catch (err) { console.error('Failed to revert stats for', p.uid, err); }
                                    }
                                  }
                                }
                                await deleteDoc(fbDoc(db, 'communities', activeCommunityId!, 'matches', m.id));
                                try {
                                  const ratingsSnap = await getDocs(coll(db, 'communities', activeCommunityId!, 'matches', m.id, 'ratings'));
                                  for (const rDoc of ratingsSnap.docs) { await deleteDoc(rDoc.ref); }
                                } catch (_) {}
                              } catch (err) {
                                console.error('Failed to delete match:', err);
                                alert(isAr ? 'فشل في حذف المباراة' : 'Failed to delete match');
                              }
                            }}
                            className="w-full mt-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-1.5"
                          >
                            <span>🗑️</span>
                            <span>{isAr ? 'حذف المباراة من السجل' : 'Delete Match'}</span>
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {isViewingHistory && (
                <div className="mb-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-2xl shadow-md">
                      📜
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {isAr ? "سجل مباراة سابقة" : "Historical Match Record"}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {isAr ? "تاريخ المباراة:" : "Match Date:"} {displayMatch.config?.date || new Date(displayMatch.finishedAt || displayMatch.generatedAt || Date.now()).toLocaleDateString()}
                        {displayMatch.config?.location ? ` • 🏟️ ${displayMatch.config.location}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHistoryMatch(null)}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-xl shadow transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>{isAr ? "➡️" : "⬅️"}</span>
                    <span>{isAr ? "العودة لقائمة سجل المباريات" : "Back to Match History"}</span>
                  </button>
                </div>
              )}

              {loading && !isViewingHistory ? (
                <SiteSkeletonLoader variant="match" />
              ) : error && !isViewingHistory ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900">
                  <p className="text-red-500 dark:text-red-400 font-bold">{error}</p>
                </div>
              ) : !displayMatch ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-4">
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "لا توجد مباراة مبرمجة حالياً" : "No Match Scheduled"}
                  </h3>
                  <p className="text-slate-500 max-w-md">
                    {isAr ? "يرجى الانتظار حتى تقوم الإدارة بتشكيل الفرق." : "Please wait for admins to generate the next match."}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setIsConfigModalOpen(true)}
                      className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                    >
                      <span>⚽</span>
                      <span>{isAr ? "إنشاء مباراة أو فتح حجز جديد" : "Make a Match / Open Booking"}</span>
                    </button>
                  )}
                </div>
              ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Open Registration / Booking View */}
              {displayMatch.status === 'registering' && (
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/80 rounded-3xl p-6 md:p-10 text-white shadow-2xl border border-amber-500/30 relative overflow-hidden space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3 animate-pulse">
                        🔥 {isAr ? "حجز مفتوح للتسجيل" : "Open Booking / Registration"}
                      </span>
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                        {isAr ? "تسجيل الحضور للمباراة القادمة" : "Sign Up for Next Match"}
                      </h2>
                      <p className="text-sm text-slate-300 mt-1">
                        {isAr ? "سجل حضورك ليتم إدراج اسمك في التشكيل وسحب الفرق عند اكتمال العدد" : "Check in to enter the draft and generate balanced teams once capacity is reached."}
                      </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2 bg-black/30 p-4 rounded-2xl border border-white/10 w-full md:w-auto">
                      <div className="text-sm font-bold text-amber-300">
                        {isAr ? "المقاعد المحجوزة" : "Checked In Players"}
                      </div>
                      <div className="text-3xl font-black font-mono text-white">
                        {(displayMatch.signedUpPlayerUids || []).length} / {displayMatch.maxPlayers || ((displayMatch.config?.playersPerTeam || 6) * (displayMatch.config?.numTeams || 2))}
                      </div>
                    </div>
                  </div>

                  {/* Registered Players Grid */}
                  <div>
                    <h3 className="text-lg font-bold text-amber-200 mb-4 flex items-center gap-2">
                      <span>👥</span>
                      <span>{isAr ? "اللاعبون المسجلون حالياً" : "Currently Registered Players"}</span>
                    </h3>
                    {(displayMatch.signedUpPlayerUids || []).length === 0 ? (
                      <div className="bg-white/5 rounded-2xl p-8 text-center border border-dashed border-white/10 text-slate-400">
                        {isAr ? "لم يسجل أي لاعب بعد. كن أول المسجلين!" : "No players have signed up yet. Be the first to join!"}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {(displayMatch.signedUpPlayerUids || []).map((uid: string) => {
                          const p = players.find(player => player.uid === uid);
                          return (
                            <div key={uid} className="bg-white/10 hover:bg-white/15 transition-all p-3 rounded-2xl flex items-center gap-3 border border-white/10">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center font-bold text-lg">
                                {p?.photoUrl ? (
                                  <Image src={p.photoUrl} alt={p?.fullName || uid} width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span>{(p?.cardName || p?.fullName || '?').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm truncate text-white">
                                  {p ? (p.cardName || p.fullName) : isAr ? 'لاعب' : 'Player'}
                                </p>
                                {(p?.preferredPosition || p?.primaryPosition) && (
                                  <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    {p?.preferredPosition || p?.primaryPosition}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <div className="flex flex-wrap gap-3">
                      {user && (
                        <button
                          onClick={handleToggleSignInToBooking}
                          disabled={isSubmittingBooking}
                          className={`px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all duration-200 active:scale-95 flex items-center gap-3 ${
                            (displayMatch.signedUpPlayerUids || []).includes(user.uid)
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-orange-900/40'
                          }`}
                        >
                          <span>{(displayMatch.signedUpPlayerUids || []).includes(user.uid) ? '🚫' : '✅'}</span>
                          <span>
                            {isSubmittingBooking
                              ? (isAr ? 'جاري المعالجة...' : 'Processing...')
                              : (displayMatch.signedUpPlayerUids || []).includes(user.uid)
                                ? (isAr ? 'إلغاء تسجيل الحضور' : 'Sign Out from Booking')
                                : (isAr ? 'تسجيل الحضور والمشاركة' : 'Check In / Sign Up Now')}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={handleGenerateFromBooking}
                          className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-sm"
                        >
                          <span>⚡</span>
                          <span>{isAr ? "تشكيل الفرق وبدء المباراة" : "Generate Teams from Checked In"}</span>
                        </button>
                        <button
                          onClick={handleEndBooking}
                          className="px-5 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl shadow transition-colors text-sm"
                        >
                          {isAr ? "إلغاء/إنهاء الحجز" : "Cancel Booking"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Admin Control Panel (When Active) */}
              {displayMatch.status !== 'registering' && isAdmin && !isViewingHistory && (
                <div className="bg-slate-900 dark:bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-white shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-black text-sm text-amber-400">
                      {isAr ? "لوحة تحكم الإدارة الحية" : "Live Admin Match Control Panel"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleRemakeTeams}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <span>🔄</span>
                      <span>{isAr ? "إعادة خلط وتوزيع الفرق" : "Remake Teams"}</span>
                    </button>
                    <button
                      onClick={handleEndBooking}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center gap-1.5"
                    >
                      <span>🏁</span>
                      <span>{isAr ? "إنهاء الحجز بالكامل وأرشفته" : "End & Archive Booking"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AI Man of the Match (MOTM) Banner */}
              {(displayMatch.aiMotm || (displayMatch.status === 'finished' && displayMatch.recordedStats)) && (() => {
                const motm = displayMatch.aiMotm || (() => {
                  let best: any = null;
                  let max = -999;
                  const all = [
                    ...(displayMatch.teamA || []),
                    ...(displayMatch.teamB || []),
                    ...(displayMatch.turfResult?.teams || []).flatMap((t: any) => t.players || [])
                  ];
                  all.forEach((p: any) => {
                    if (!p || !p.uid) return;
                    const st = displayMatch.recordedStats?.[p.uid] || { goals: 0, assists: 0, mvp: false };
                    const sc = (Number(st.goals || 0) * 4) + (Number(st.assists || 0) * 2.5) + (st.mvp ? 6 : 0) + ((Number(p.overallRating) || 70) * 0.15);
                    if (sc > max) { max = sc; best = { uid: p.uid, name: p.cardName || p.fullName, photoUrl: p.photoUrl, score: Math.round(sc * 10) / 10, goals: st.goals || 0, assists: st.assists || 0, reasonEn: `AI selection based on match rating (${p.overallRating || 75} OVR) & performance.`, reasonAr: `اختيار الذكاء الاصطناعي بناءً على التقييم العام (${p.overallRating || 75} OVR) والإحصائيات.` }; }
                  });
                  return best;
                })();
                if (!motm) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-6 md:p-8 text-slate-950 shadow-2xl border-2 border-yellow-200 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                  >
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-5 z-10">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-amber-300 shadow-xl overflow-hidden flex items-center justify-center shrink-0 text-3xl font-black text-amber-400">
                          {motm.photoUrl ? (
                            <img src={motm.photoUrl} alt={motm.name} className="w-full h-full object-cover" />
                          ) : (
                            motm.name?.slice(0, 2).toUpperCase() || '🌟'
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-400 shadow">
                          MOTM
                        </div>
                      </div>
                      <div className="space-y-1 text-center sm:text-start">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-950 text-amber-300 shadow-sm">
                          🤖 {isAr ? "نجم المباراة المختار بالذكاء الاصطناعي (AI MOTM)" : "AI Man of the Match (MOTM)"}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                          {motm.name}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-slate-900/90 max-w-xl">
                          {isAr ? motm.reasonAr : motm.reasonEn}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-950/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-black/10 shrink-0 z-10">
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-slate-800">{isAr ? "نقاط الذكاء الاصطناعي" : "AI Score"}</span>
                        <span className="text-2xl font-black font-mono text-slate-950">{motm.score || '9.5'}</span>
                      </div>
                      {motm.goals !== undefined && (
                        <>
                          <div className="w-px h-8 bg-black/10" />
                          <div className="text-center">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-800">{isAr ? "أهداف" : "Goals"}</span>
                            <span className="text-xl font-black font-mono text-slate-950">{motm.goals}</span>
                          </div>
                        </>
                      )}
                      {motm.assists !== undefined && (
                        <>
                          <div className="w-px h-8 bg-black/10" />
                          <div className="text-center">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-800">{isAr ? "صناعة" : "Assists"}</span>
                            <span className="text-xl font-black font-mono text-slate-950">{motm.assists}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })()}

              {/* Turf / Casual Match Display */}
              {displayMatch.status !== 'registering' && displayMatch.matchMode === 'turf' && displayMatch.turfResult && (
                <TurfMatchDisplay turfResult={displayMatch.turfResult} isAr={isAr} />
              )}

              {/* Inter-Community Challenge Match Display & Access Enforcement */}
              {displayMatch.status !== 'registering' && displayMatch.matchMode === 'inter_community' && (
                (() => {
                  const hasSquadAccess = isAdmin || (displayMatch.challengerSquadUids || []).includes(user?.uid) || (displayMatch.targetSquadUids || []).includes(user?.uid);
                  if (!hasSquadAccess) {
                    return (
                      <div className="bg-red-500/10 border border-red-500/40 rounded-3xl p-8 md:p-12 text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
                          🚫
                        </div>
                        <h3 className="text-2xl font-black text-red-500 dark:text-red-400">
                          {isAr ? "عذراً، لم يتم اختيارك ضمن قائمة الفريق لهذه المباراة" : "Unfortunately, you are not selected in the squad for this match"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          {isAr ? "هذه مباراة تحدي خاصة بين المجتمعات وتقتصر على التشكيلة المغلقة المعتمدة من مسؤول المجتمع." : "This is an inter-community challenge match restricted to the locked squad confirmed by the community admin."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/80 rounded-3xl p-6 md:p-10 text-white shadow-2xl border border-amber-500/30 space-y-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-2">
                            ⚔️ {isAr ? "مباراة تحدي مجتمعات رسمية" : "Official Inter-Community Challenge"}
                          </span>
                          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                            {displayMatch.challengerCommunityName} vs {displayMatch.targetCommunityName}
                          </h2>
                          {displayMatch.challengeDetails && (
                            <p className="text-sm text-slate-300 mt-2 flex flex-wrap gap-4 font-semibold">
                              {displayMatch.challengeDetails.date && <span>📅 {displayMatch.challengeDetails.date}</span>}
                              {displayMatch.challengeDetails.time && <span>⏰ {displayMatch.challengeDetails.time}</span>}
                              {displayMatch.challengeDetails.location && <span>🏟️ {displayMatch.challengeDetails.location}</span>}
                            </p>
                          )}
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>{isAr ? "القائمة مغلقة ومعتمدة" : "Locked & Approved Squads"}</span>
                        </div>
                      </div>

                      {/* Squads Comparison Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10">
                          <h4 className="font-black text-amber-400 mb-4 flex items-center gap-2">
                            <span>🛡️</span>
                            <span>{displayMatch.challengerCommunityName} {isAr ? "(التشكيلة المعتمدة)" : "(Challenger Squad)"}</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {(displayMatch.challengerSquadUids || []).map((uid: string) => {
                              const p = players.find(player => player.uid === uid);
                              return (
                                <div key={uid} className="bg-white/5 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                  <span className="truncate">{p?.cardName || p?.fullName || uid}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10">
                          <h4 className="font-black text-blue-400 mb-4 flex items-center gap-2">
                            <span>🛡️</span>
                            <span>{displayMatch.targetCommunityName} {isAr ? "(التشكيلة المعتمدة)" : "(Target Squad)"}</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {(displayMatch.targetSquadUids || []).map((uid: string) => {
                              const p = players.find(player => player.uid === uid);
                              return (
                                <div key={uid} className="bg-white/5 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                  <span className="truncate">{p?.cardName || p?.fullName || uid}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {displayMatch.status !== 'registering' && displayMatch.matchMode !== 'turf' && displayMatch.matchMode !== 'inter_community' && (
              <React.Fragment>
              {/* Scoreboard Banner if match has recorded stats */}
              {displayMatch.recordedStats && (
                <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-slate-700">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Team A Score */}
                  <div className="flex flex-col items-center md:items-start flex-1 z-10">
                    <span className="text-sm font-black tracking-widest text-blue-400 uppercase mb-1">HOME TEAM</span>
                    <h3 className="text-2xl md:text-3xl font-black mb-2">Team A</h3>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30 font-mono">
                      {displayMatch.formation?.teamA || '4-3-3'}
                    </span>
                  </div>

                  {/* Center Scoreboard */}
                  <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-inner z-10">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase mb-1">
                      {isAr ? "النتيجة النهائية" : "FINAL SCORE"}
                    </span>
                    <div className="flex items-center gap-6 text-5xl md:text-6xl font-black font-mono tracking-tight text-white">
                      <span className="text-blue-400">
                        {displayMatch.recordedStats?.teamAScore ?? (displayMatch.teamA?.reduce((sum: number, p: any) => sum + (Number(displayMatch.recordedStats?.[p.uid]?.goals) || 0), 0) || 0)}
                      </span>
                      <span className="text-slate-500 text-3xl">:</span>
                      <span className="text-red-400">
                        {displayMatch.recordedStats?.teamBScore ?? (displayMatch.teamB?.reduce((sum: number, p: any) => sum + (Number(displayMatch.recordedStats?.[p.uid]?.goals) || 0), 0) || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Team B Score */}
                  <div className="flex flex-col items-center md:items-end flex-1 z-10">
                    <span className="text-sm font-black tracking-widest text-red-400 uppercase mb-1">AWAY TEAM</span>
                    <h3 className="text-2xl md:text-3xl font-black mb-2">Team B</h3>
                    <span className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-400/30 font-mono">
                      {displayMatch.formation?.teamB || '4-4-2'}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid xl:grid-cols-2 gap-10">
                {/* Team A */}
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                  <div className="relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-6">
                      <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">Team A</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl font-bold border border-blue-200 dark:border-blue-800/50">
                          {displayMatch.formation?.teamA || "Formation"}
                        </span>
                        <span className="font-mono bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
                          OVR: {displayMatch.metrics?.teamAOverall?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    {displayMatch.tipsAndTactics?.teamA && (
                      <div className="mb-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                        <p className="text-blue-900 dark:text-blue-200 font-medium leading-relaxed">
                          <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">💡 {isAr ? 'التكتيك:' : 'Tactics:'}</span> 
                          {isAr ? ((displayMatch.tipsAndTactics as any).teamA_Ar || "👔 ملخص تعليمات المدرب: الحفاظ على الانضباط التكتيكي والتقارب بين الخطوط والاعتماد على اللعب الجماعي وسرعة التحول الهجومي واستغلال المساحات لحسم نتيجة اللقاء.") : displayMatch.tipsAndTactics.teamA}
                        </p>
                      </div>
                    )}
                    
                    {/* Player Grid -> Pitch Display */}
                    <MatchPitchDisplay 
                      team={displayMatch.teamA || []} 
                      teamName="Team A" 
                      color="blue" 
                      onPlayerClick={(p) => setSelectedPlayer(p as unknown as PlayerProfile)} 
                      recordedStats={displayMatch.recordedStats}
                    />
                    
                    {/* Bench A Section */}
                    {!loading && !error && displayMatch?.benchA && displayMatch.benchA.length > 0 && (
                      <div className="mt-8 border-t border-slate-100 dark:border-slate-700/50 pt-6">
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                          {isAr ? 'دكة البدلاء' : 'Substitutes / Bench'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {displayMatch.benchA.map((b: any) => (
                            <div key={b.player.uid} className="relative group">
                              <PlayerCardCompact player={b.player} recordedStats={displayMatch.recordedStats} />
                              <div className="absolute top-0 right-0 -translate-y-full translate-x-4 w-48 bg-black/90 backdrop-blur text-white text-xs p-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-white/10 shadow-xl mb-2">
                                <span className="font-bold text-blue-400">{isAr ? "التقييم:" : "Rating:"}</span><br />
                                {b.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team B */}
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                  <div className="relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-6">
                      <h3 className="text-3xl font-black text-red-600 dark:text-red-400">Team B</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-4 py-2 rounded-xl font-bold border border-red-200 dark:border-red-800/50">
                          {displayMatch.formation?.teamB || "Formation"}
                        </span>
                        <span className="font-mono bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
                          OVR: {displayMatch.metrics?.teamBOverall?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    {displayMatch.tipsAndTactics?.teamB && (
                      <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl">
                        <p className="text-red-900 dark:text-red-200 font-medium leading-relaxed">
                          <span className="font-bold text-red-600 dark:text-red-400 mr-2">💡 {isAr ? 'التكتيك:' : 'Tactics:'}</span> 
                          {isAr ? ((displayMatch.tipsAndTactics as any).teamB_Ar || "👔 ملخص تعليمات المدرب: الحفاظ على الانضباط التكتيكي والتقارب بين الخطوط والاعتماد على اللعب الجماعي وسرعة التحول الهجومي واستغلال المساحات لحسم نتيجة اللقاء.") : displayMatch.tipsAndTactics.teamB}
                        </p>
                      </div>
                    )}
                    
                    {/* Player Grid -> Pitch Display */}
                    <MatchPitchDisplay 
                      team={displayMatch.teamB || []} 
                      teamName="Team B" 
                      color="red" 
                      isReversed={false}
                      onPlayerClick={(p) => setSelectedPlayer(p as unknown as PlayerProfile)} 
                      recordedStats={displayMatch.recordedStats}
                    />

                    {/* Bench B Section */}
                    {!loading && !error && displayMatch?.benchB && displayMatch.benchB.length > 0 && (
                      <div className="mt-8 border-t border-slate-100 dark:border-slate-700/50 pt-6">
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                          {isAr ? 'دكة البدلاء' : 'Substitutes / Bench'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {displayMatch.benchB.map((b: any) => (
                            <div key={b.player.uid} className="relative group">
                              <PlayerCardCompact player={b.player} recordedStats={displayMatch.recordedStats} />
                              <div className="absolute top-0 right-0 -translate-y-full translate-x-4 w-48 bg-black/90 backdrop-blur text-white text-xs p-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-white/10 shadow-xl mb-2">
                                <span className="font-bold text-red-400">{isAr ? "التقييم:" : "Rating:"}</span><br />
                                {b.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Individual Player Stats */}
              {displayMatch.recordedStats && (
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span>📊</span>
                    <span>{isAr ? 'إحصائيات اللاعبين' : 'Player Statistics'}</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                          <th className="text-start py-3 px-3 font-black text-slate-600 dark:text-slate-300">{isAr ? 'اللاعب' : 'Player'}</th>
                          <th className="text-center py-3 px-2 font-black text-slate-600 dark:text-slate-300">{isAr ? 'الفريق' : 'Team'}</th>
                          <th className="text-center py-3 px-2 font-black text-amber-600 dark:text-amber-400">⚽</th>
                          <th className="text-center py-3 px-2 font-black text-emerald-600 dark:text-emerald-400">🅰️</th>
                          <th className="text-center py-3 px-2 font-black text-yellow-500">🟨</th>
                          <th className="text-center py-3 px-2 font-black text-red-500">🟥</th>
                          <th className="text-center py-3 px-2 font-black text-purple-500">⭐</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {[...(displayMatch.teamA || []), ...(displayMatch.teamB || [])].map((p: any) => {
                          const stats = displayMatch.recordedStats?.[p.uid];
                          if (!stats) return null;
                          const isTeamA = (displayMatch.teamA || []).some((t: any) => t.uid === p.uid);
                          return (
                            <tr key={p.uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {(p.photoUrl || p.googlePic) ? (
                                      <div className="relative w-full h-full">
                                        <Image src={p.photoUrl || p.googlePic} alt="" fill sizes="32px" className="object-cover" />
                                      </div>
                                    ) : (
                                      <span className="text-xs font-bold text-slate-500">{(p.cardName || p.fullName || '?').charAt(0)}</span>
                                    )}
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">{p.cardName || p.fullName}</span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isTeamA ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                  {isTeamA ? 'A' : 'B'}
                                </span>
                              </td>
                              <td className="text-center py-3 px-2 font-black text-slate-800 dark:text-slate-200">{stats.goals || 0}</td>
                              <td className="text-center py-3 px-2 font-black text-slate-800 dark:text-slate-200">{stats.assists || 0}</td>
                              <td className="text-center py-3 px-2 font-black text-slate-800 dark:text-slate-200">{stats.yellowCards || 0}</td>
                              <td className="text-center py-3 px-2 font-black text-slate-800 dark:text-slate-200">{stats.redCards || 0}</td>
                              <td className="text-center py-3 px-2">{stats.mvp ? <span className="text-amber-500 font-black">MVP</span> : <span className="text-slate-400">-</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rate Players Button */}
              {displayMatch.recordedStats && isViewingHistory && selectedHistoryMatch?.id && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg transition-all duration-300 active:scale-95 flex items-center gap-2"
                  >
                    <span>⭐</span>
                    <span>{isAr ? 'قيّم أداء اللاعبين' : 'Rate Players Performance'}</span>
                  </button>
                </div>
              )}
              </React.Fragment>
              )}
            </motion.div>
          )}
            </>
          )}



        </main>
      </div>

      {/* Player Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlayer(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-3xl shadow-2xl"
            >
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-700 z-10 hover:scale-110 transition-transform text-slate-900 dark:text-white"
              >
                ✕
              </button>
              <PlayerCard player={selectedPlayer} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Config / Booking Creation Modal */}
      <MatchConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onGenerate={handleCreateMatchFromPage}
        communityPlayers={players}
      />

      {/* Admin Record Stats Modal */}
      <RecordStatsModal 
        isOpen={isRecordModalOpen} 
        onClose={() => setIsRecordModalOpen(false)} 
        matchData={matchData} 
      />

      {/* Player Rating Modal */}
      <PlayerRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        matchId={selectedHistoryMatch?.id || ''}
        players={[...(displayMatch?.teamA || []), ...(displayMatch?.teamB || [])]}
        isAr={isAr}
      />
    </ProtectedRoute>
  );
}
