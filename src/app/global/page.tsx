"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useLocale } from "@/components/ThemeProvider";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import PlayerCardCompact from "@/components/PlayerCardCompact";

export default function GlobalLeaderboardPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [globalPlayers, setGlobalPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalPlayers = async () => {
      try {
        const q = query(collection(db, "players"), orderBy("calculatedAge", "asc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as PlayerProfile));
        // Sort by global goals for leaderboard demo
        data.sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0));
        setGlobalPlayers(data);
      } catch (err) {
        console.error("Failed to fetch global players", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalPlayers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-amber-500 mb-2">
            {isAr ? "الترتيب العالمي" : "Global Leaderboard"}
          </h1>
          <p className="text-slate-500">
            {isAr ? "أفضل اللاعبين عبر جميع المجتمعات" : "Top players across all communities worldwide"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center"><div className="animate-spin text-3xl">⚽</div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {globalPlayers.map((p) => (
              <PlayerCardCompact key={p.uid} player={p} />
            ))}
            {globalPlayers.length === 0 && (
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
