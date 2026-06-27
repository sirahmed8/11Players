"use client";

import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import PlayerCard from "@/components/PlayerCard";
import { PlayerProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function MatchPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "latestMatch"), (docSnap) => {
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
  }, [isAr]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors pb-12">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent mb-4">
              {isAr ? "المباراة القادمة" : "Next Match"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              {isAr 
                ? "تشكيلات الفرق والتكتيكات الموصى بها للمباراة القادمة. يتم تحديثها تلقائياً عند قيام الإدارة بتشكيل الفرق."
                : "Team lineups and recommended tactics for the upcoming match. Updates automatically when admins generate teams."}
            </p>
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
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-2xl font-bold mb-2 text-slate-700 dark:text-slate-300">
                {isAr ? "لا توجد مباراة مبرمجة حالياً" : "No Match Scheduled"}
              </h3>
              <p className="text-slate-500">
                {isAr ? "يرجى الانتظار حتى تقوم الإدارة بتشكيل الفرق." : "Please wait for admins to generate the next match."}
              </p>
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
                  
                  {/* Player Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {matchData.teamA?.map((p: any) => (
                      <div key={p.uid} className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                        <div className="relative transform transition-transform duration-300 group-hover:scale-[1.02]">
                          <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-xl">
                            <span className="font-black text-white text-sm">{p.assignedPosition}</span>
                          </div>
                          <PlayerCard player={p as PlayerProfile} />
                        </div>
                      </div>
                    ))}
                  </div>
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
                  
                  {/* Player Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {matchData.teamB?.map((p: any) => (
                      <div key={p.uid} className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                        <div className="relative transform transition-transform duration-300 group-hover:scale-[1.02]">
                          <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-xl">
                            <span className="font-black text-white text-sm">{p.assignedPosition}</span>
                          </div>
                          <PlayerCard player={p as PlayerProfile} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
