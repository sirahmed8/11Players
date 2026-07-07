"use client";

import React, { useEffect, useState } from "react";
import { doc, onSnapshot, collection } from "firebase/firestore";
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
import { useRouter } from "next/navigation";
import RecordStatsModal from "@/components/RecordStatsModal";
import PlayerRatingModal from "@/components/PlayerRatingModal";

export default function MatchPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const { isAdmin } = useAuth();
  const { activeCommunityId } = useCommunity();
  
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Match History state
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
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

            {/* Tab Switcher */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex gap-2">
                <button
                  onClick={() => { setActiveTab('current'); setSelectedHistoryMatch(null); }}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'current'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
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
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
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
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                </div>
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
                                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg px-4 py-1.5 rounded-xl shadow-md">
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
                                        const pRef = fbDoc(db, 'communities', activeCommunityId!, 'players', p.uid);
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
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl shadow-md">
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
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                </div>
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
                      onClick={() => router.push("/admin")}
                      className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                    >
                      <span>⚽</span>
                      <span>{isAr ? "الذهاب لتشكيل المباراة القادمة" : "Generate Next Match"}</span>
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
              {/* Scoreboard Banner if match has recorded stats */}
              {displayMatch.recordedStats && (
                <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-red-900 rounded-3xl p-6 lg:p-8 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
                  
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
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
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
                  <div className="absolute top-0 left-0 w-64 h-64 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
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
                                      <img src={p.photoUrl || p.googlePic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                    className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all duration-300 active:scale-95 flex items-center gap-2"
                  >
                    <span>⭐</span>
                    <span>{isAr ? 'قيّم أداء اللاعبين' : 'Rate Players Performance'}</span>
                  </button>
                </div>
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
        matchData={displayMatch}
        matchId={selectedHistoryMatch?.id || ''}
      />
    </ProtectedRoute>
  );
}
