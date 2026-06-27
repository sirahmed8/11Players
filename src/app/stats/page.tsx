"use client";

import React from "react";
import { usePlayers } from "@/contexts/PlayersContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ThemeProvider";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function StatsPage() {
  const { players, loading } = usePlayers();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const getOverall = (p: PlayerProfile) => {
    const attrs = Object.values(p.attributes);
    return Math.round(attrs.reduce((a, b) => a + b, 0) / attrs.length);
  };

  const topScorers = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0)).slice(0, 10);
  }, [players]);

  const topAssisters = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0)).slice(0, 10);
  }, [players]);

  const topMVPs = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0)).slice(0, 10);
  }, [players]);

  const highestRated = React.useMemo(() => {
    return [...players].sort((a, b) => getOverall(b) - getOverall(a)).slice(0, 10);
  }, [players]);

  const StatTable = ({ title, data, statKey, isOverall = false }: { title: string, data: PlayerProfile[], statKey: string, isOverall?: boolean }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-black text-lg text-emerald-600 dark:text-emerald-400">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {data.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">{isAr ? "لا توجد بيانات بعد" : "No data yet"}</div>
        ) : (
          data.map((p, i) => (
            <motion.div 
              key={p.uid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-black text-slate-400 w-4">{i + 1}</span>
                <Link href={`/profile?uid=${p.uid}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.cardName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">⚽</div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold group-hover:text-emerald-500 transition-colors">{p.cardName}</div>
                    <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 rounded inline-block">
                      {p.primaryPosition}
                    </div>
                  </div>
                </Link>
              </div>
              <div className="font-black text-xl text-slate-700 dark:text-slate-200">
                {isOverall ? getOverall(p) : (p.stats as any)?.[statKey] || 0}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors pb-12">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black mb-2">{isAr ? "قائمة المتصدرين العالمية" : "Global Leaderboards"}</h2>
            <p className="text-slate-500 dark:text-slate-400" dir={isAr ? "rtl" : "ltr"}>{isAr ? "الأفضل بين الأفضل في 11Players." : "The best of the best in 11Players."}</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatTable title={isAr ? "الهدافين" : "Top Scorers"} data={topScorers} statKey="goals" />
              <StatTable title={isAr ? "صُناع اللعب" : "Playmakers"} data={topAssisters} statKey="assists" />
              <StatTable title={isAr ? "أفضل اللاعبين" : "Most Valuable"} data={topMVPs} statKey="mvp" />
              <StatTable title={isAr ? "الأعلى تقييماً" : "Highest Rated"} data={highestRated} statKey="overall" isOverall={true} />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
