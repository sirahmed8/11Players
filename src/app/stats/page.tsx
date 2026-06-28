"use client";

import React from "react";
import Image from "next/image";
import { usePlayers } from "@/contexts/PlayersContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ThemeProvider";
import { User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { calculateRealisticOverall } from "@/lib/overallCalculator";

export default function StatsPage() {
  const { players, loading } = usePlayers();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const getOverall = (p: PlayerProfile) => {
    return calculateRealisticOverall(p.attributes, p.primaryPosition, p.playStyle || "");
  };

  const topScorers = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0)).slice(0, 10);
  }, [players]);

  const topAssisters = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0)).slice(0, 10);
  }, [players]);

  const topGA = React.useMemo(() => {
    return [...players].sort((a, b) => ((b.stats?.goals || 0) + (b.stats?.assists || 0)) - ((a.stats?.goals || 0) + (a.stats?.assists || 0))).slice(0, 10);
  }, [players]);

  const topMVPs = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0)).slice(0, 10);
  }, [players]);

  const ballonDOr = React.useMemo(() => {
    return [...players].sort((a, b) => {
      // Ballon d'Or formula: (Goals * 2) + (Assists * 1) + (MVPs * 5)
      const aScore = ((a.stats?.goals || 0) * 2) + ((a.stats?.assists || 0) * 1) + ((a.stats?.mvp || 0) * 5);
      const bScore = ((b.stats?.goals || 0) * 2) + ((b.stats?.assists || 0) * 1) + ((b.stats?.mvp || 0) * 5);
      return bScore - aScore;
    }).slice(0, 10);
  }, [players]);

  const highestRated = React.useMemo(() => {
    return [...players].sort((a, b) => getOverall(b) - getOverall(a)).slice(0, 10);
  }, [players]);

  const StatTable = ({ title, data, statKey, isOverall = false, isGA = false, isBallon = false }: { title: string, data: PlayerProfile[], statKey: string, isOverall?: boolean, isGA?: boolean, isBallon?: boolean }) => {
    const [expanded, setExpanded] = React.useState(false);
    const displayData = expanded ? data : data.slice(0, 3);
    
    // Check if the actual stats being displayed are greater than 0
    const hasAnyStats = data.some((p) => {
      if (isOverall) return getOverall(p) > 0;
      if (isGA) return ((p.stats?.goals || 0) + (p.stats?.assists || 0)) > 0;
      if (isBallon) return (((p.stats?.goals || 0) * 2) + ((p.stats?.assists || 0) * 1) + ((p.stats?.mvp || 0) * 5)) > 0;
      return ((p.stats as any)?.[statKey] || 0) > 0;
    });

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
        <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-black text-lg text-emerald-600 dark:text-emerald-400">{title}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1">
          {data.length === 0 || !hasAnyStats ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-3 opacity-50">🫙</span>
              <p className="text-slate-500 font-semibold">{isAr ? "لا توجد إحصائيات بعد" : "No stats yet"}</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {displayData.map((p, i) => (
                // Only show players with > 0 stats if it's not the highest rated category
                ((isOverall) || (isGA && ((p.stats?.goals || 0) + (p.stats?.assists || 0)) > 0) || (isBallon && (((p.stats?.goals || 0) * 2) + ((p.stats?.assists || 0) * 1) + ((p.stats?.mvp || 0) * 5)) > 0) || (!isOverall && !isGA && !isBallon && ((p.stats as any)?.[statKey] || 0) > 0)) && (
                  <motion.div 
                    key={p.uid}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-black w-4 text-center ${i === 0 ? 'text-amber-500 text-lg' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-500 text-sm'}`}>{i + 1}</span>
                      <Link href={`/profile?uid=${p.uid}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0">
                          {p.photoUrl ? (
                            <Image src={p.photoUrl} alt={p.cardName} className="w-full h-full object-cover" width={40} height={40} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400">
                              <User className="w-5 h-5" />
                            </div>
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
                      {isOverall 
                        ? getOverall(p) 
                        : isGA 
                          ? (p.stats?.goals || 0) + (p.stats?.assists || 0)
                          : isBallon
                            ? ((p.stats?.goals || 0) * 2) + ((p.stats?.assists || 0) * 1) + ((p.stats?.mvp || 0) * 5)
                            : (p.stats as any)?.[statKey] || 0}
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          )}
        </div>
        {data.length > 3 && hasAnyStats && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold transition-colors border-t border-slate-200 dark:border-slate-700"
          >
            {expanded 
              ? (isAr ? "إخفاء" : "Show Less") 
              : (isAr ? `عرض المزيد (${data.filter(p => isOverall || (isGA && ((p.stats?.goals || 0) + (p.stats?.assists || 0)) > 0) || (isBallon && (((p.stats?.goals || 0) * 2) + ((p.stats?.assists || 0) * 1) + ((p.stats?.mvp || 0) * 5)) > 0) || (!isOverall && !isGA && !isBallon && ((p.stats as any)?.[statKey] || 0) > 0)).length - 3})` : `Show More (${data.filter(p => isOverall || (isGA && ((p.stats?.goals || 0) + (p.stats?.assists || 0)) > 0) || (isBallon && (((p.stats?.goals || 0) * 2) + ((p.stats?.assists || 0) * 1) + ((p.stats?.mvp || 0) * 5)) > 0) || (!isOverall && !isGA && !isBallon && ((p.stats as any)?.[statKey] || 0) > 0)).length - 3})`)}
          </button>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12" dir={isAr ? 'rtl' : 'ltr'}>
        
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="md:col-span-2 lg:col-span-3 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatTable title={isAr ? "🏆 ترتيب الكرة الذهبية" : "🏆 Ballon d'Or Ranking"} data={ballonDOr} statKey="ballon" isBallon={true} />
                  <StatTable title={isAr ? "🌟 أعلى اللاعبين تقييماً" : "🌟 Highest Rated (OVR)"} data={highestRated} statKey="overall" isOverall={true} />
                </div>
              </div>
              <StatTable title={isAr ? "🎯 الهدافين" : "🎯 Top Scorers"} data={topScorers} statKey="goals" />
              <StatTable title={isAr ? "👟 صناع اللعب" : "👟 Top Assisters"} data={topAssisters} statKey="assists" />
              <StatTable title={isAr ? "🔥 المساهمات (أهداف + تمريرات)" : "🔥 Top G/A"} data={topGA} statKey="ga" isGA={true} />
              <StatTable title={isAr ? "🏅 رجل المباراة (MVP)" : "🏅 Most MVPs"} data={topMVPs} statKey="mvp" />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
