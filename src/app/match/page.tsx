"use client";

import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
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

    return () => unsub();
  }, [isAr, activeCommunityId]);

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12">
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent mb-4">
              {isAr ? "المباراة القادمة" : "Next Match"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-6">
              {isAr 
                ? "تشكيلات الفرق والتكتيكات الموصى بها للمباراة القادمة. يتم تحديثها تلقائياً عند قيام الإدارة بتشكيل الفرق."
                : "Team lineups and recommended tactics for the upcoming match. Updates automatically when admins generate teams."}
            </p>

            {matchData?.config && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-3xl mx-auto shadow-sm flex flex-wrap justify-center gap-6">
                {matchData.config.date && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "التاريخ" : "Date"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{matchData.config.date}</p>
                    </div>
                  </div>
                )}
                {matchData.config.time && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "الوقت" : "Time"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{matchData.config.time}</p>
                    </div>
                  </div>
                )}
                {matchData.config.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏟️</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "الملعب" : "Location"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{matchData.config.location}</p>
                    </div>
                  </div>
                )}
                {matchData.config.cost && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{isAr ? "التكلفة" : "Cost"}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{matchData.config.cost}</p>
                    </div>
                  </div>
                )}
                {matchData.config.notes && (
                  <div className="w-full mt-2 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">📝 {isAr ? "ملاحظة:" : "Note:"} </span>
                      {matchData.config.notes}
                    </p>
                  </div>
                )}
                
                {isAdmin && (
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

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900">
              <p className="text-red-500 dark:text-red-400 font-bold">{error}</p>
            </div>
          ) : !matchData ? (
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
              className="grid xl:grid-cols-2 gap-10"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Team A */}
              <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-6">
                    <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">Team A</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl font-bold border border-blue-200 dark:border-blue-800/50">
                        {matchData.formation?.teamA || "Formation"}
                      </span>
                      <span className="font-mono bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
                        OVR: {matchData.metrics?.teamAOverall?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  {matchData.tipsAndTactics?.teamA && (
                    <div className="mb-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                      <p className="text-blue-900 dark:text-blue-200 font-medium leading-relaxed">
                        <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">💡 {isAr ? 'التكتيك:' : 'Tactics:'}</span> 
                        {matchData.tipsAndTactics.teamA}
                      </p>
                    </div>
                  )}
                  
                  {/* Player Grid -> Pitch Display */}
                  <MatchPitchDisplay 
                    team={matchData.teamA || []} 
                    teamName="Team A" 
                    color="blue" 
                    onPlayerClick={(p) => setSelectedPlayer(p as unknown as PlayerProfile)} 
                  />
                  
                  {/* Bench A Section */}
                  {!loading && !error && matchData?.benchA && matchData.benchA.length > 0 && (
                    <div className="mt-8 border-t border-slate-100 dark:border-slate-700/50 pt-6">
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                        {isAr ? 'دكة البدلاء' : 'Substitutes / Bench'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {matchData.benchA.map((b: any) => (
                          <div key={b.player.uid} className="relative group">
                            <PlayerCardCompact player={b.player} />
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
                        {matchData.formation?.teamB || "Formation"}
                      </span>
                      <span className="font-mono bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
                        OVR: {matchData.metrics?.teamBOverall?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  {matchData.tipsAndTactics?.teamB && (
                    <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl">
                      <p className="text-red-900 dark:text-red-200 font-medium leading-relaxed">
                        <span className="font-bold text-red-600 dark:text-red-400 mr-2">💡 {isAr ? 'التكتيك:' : 'Tactics:'}</span> 
                        {matchData.tipsAndTactics.teamB}
                      </p>
                    </div>
                  )}
                  
                  {/* Player Grid -> Pitch Display */}
                  <MatchPitchDisplay 
                    team={matchData.teamB || []} 
                    teamName="Team B" 
                    color="red" 
                    isReversed={true}
                    onPlayerClick={(p) => setSelectedPlayer(p as unknown as PlayerProfile)} 
                  />

                  {/* Bench B Section */}
                  {!loading && !error && matchData?.benchB && matchData.benchB.length > 0 && (
                    <div className="mt-8 border-t border-slate-100 dark:border-slate-700/50 pt-6">
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                        {isAr ? 'دكة البدلاء' : 'Substitutes / Bench'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {matchData.benchB.map((b: any) => (
                          <div key={b.player.uid} className="relative group">
                            <PlayerCardCompact player={b.player} />
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
            </motion.div>
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
    </ProtectedRoute>
  );
}
