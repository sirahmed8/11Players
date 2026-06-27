"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import SettingsMenu from "@/components/SettingsMenu";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PlayerProfile } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function StatsPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "players"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlayers: PlayerProfile[] = [];
      snapshot.forEach((doc) => {
        fetchedPlayers.push({ uid: doc.id, ...doc.data() } as PlayerProfile);
      });
      setPlayers(fetchedPlayers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getOverall = (p: PlayerProfile) => {
    const attrs = Object.values(p.attributes);
    return Math.round(attrs.reduce((a, b) => a + b, 0) / attrs.length);
  };

  const topScorers = [...players].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0)).slice(0, 10);
  const topAssisters = [...players].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0)).slice(0, 10);
  const topMVPs = [...players].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0)).slice(0, 10);
  const highestRated = [...players].sort((a, b) => getOverall(b) - getOverall(a)).slice(0, 10);

  const StatTable = ({ title, data, statKey, isOverall = false }: { title: string, data: PlayerProfile[], statKey: string, isOverall?: boolean }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-black text-lg text-emerald-600 dark:text-emerald-400">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {data.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">No data yet</div>
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
        <header className="sticky top-0 z-50 w-full flex flex-col md:flex-row justify-between items-center p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/community" className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              📊 HALL OF FAME
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <SettingsMenu />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black mb-2">Global Leaderboards</h2>
            <p className="text-slate-500 dark:text-slate-400">The best of the best in 11Players.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatTable title="Top Scorers" data={topScorers} statKey="goals" />
              <StatTable title="Playmakers" data={topAssisters} statKey="assists" />
              <StatTable title="Most Valuable" data={topMVPs} statKey="mvp" />
              <StatTable title="Highest Rated" data={highestRated} statKey="overall" isOverall={true} />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
