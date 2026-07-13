"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/components/ThemeProvider";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import PlayerCardCompact from "@/components/PlayerCardCompact";

import { ChevronDown, Loader2 } from "lucide-react";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalLeaderboardPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [globalPlayers, setGlobalPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "goals" | "assists" | "mvp">("name");
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const fetchGlobalPlayers = async () => {
      try {
        const q = query(collection(db, "players"), orderBy("calculatedAge", "asc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as PlayerProfile));
        setGlobalPlayers(data);
      } catch (err) {
        console.error("Failed to fetch global players", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalPlayers();
  }, []);

  const sortedPlayers = [...globalPlayers].sort((a, b) => {
    if (sortBy === "name") {
      return (a.fullName || "").localeCompare(b.fullName || "");
    }
    return (b.stats?.[sortBy] || 0) - (a.stats?.[sortBy] || 0);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-start">
            <h1 className="text-3xl font-black text-amber-500 mb-2">
              {isAr ? "الترتيب العالمي" : "Global Leaderboard"}
            </h1>
            <p className="text-slate-500">
              {isAr ? "أفضل اللاعبين عبر جميع المجتمعات" : "Top players across all communities worldwide"}
            </p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm hover:border-emerald-500 transition-colors"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? "ترتيب حسب:" : "Sort by:"} {sortBy === "name" ? (isAr ? "الاسم" : "Name") : sortBy === "goals" ? (isAr ? "الأهداف" : "Goals") : sortBy === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
              </span>
              <motion.div animate={{ rotate: isSortOpen ? 180 : 0 }}>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isSortOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden"
                >
                  {(["name", "goals", "assists", "mvp"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSortBy(s); setIsSortOpen(false); }}
                      className={`block w-full text-start px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold ${sortBy === s ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      {s === "name" ? (isAr ? "الاسم" : "Name") : s === "goals" ? (isAr ? "الأهداف" : "Goals") : s === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {loading ? (
          <SiteSkeletonLoader variant="cards" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedPlayers.map((p) => (
              <PlayerCardCompact key={p.uid} player={p} />
            ))}
            {sortedPlayers.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                {isAr ? "لا يوجد لاعبين حتى الآن." : "No players yet."}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
