"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlayerCard from "@/components/PlayerCard";
import MatchmakingModal from "@/components/MatchmakingModal";
import VirtualChat from "@/components/VirtualChat";
import { PlayerProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Sun, Moon, LogOut, ShieldAlert, Search } from "lucide-react";
import Link from "next/link";

export default function CommunityPage() {
  const { user, isAdmin, logout } = useAuth();
  const { locale, toggleLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Matchmaking State
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [matchmakingResult, setMatchmakingResult] = useState<any>(null);
  const [matchmakingError, setMatchmakingError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("calculatedAge", "asc"));
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

  const filteredPlayers = players.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(query) ||
      p.cardName.toLowerCase().includes(query) ||
      p.primaryPosition.toLowerCase().includes(query)
    );
  });

  const handleMatchmaking = async () => {
    try {
      setMatchmakingLoading(true);
      setMatchmakingError("");
      
      const playerIds = players.map((p) => p.uid);

      if (playerIds.length !== 22) {
        setMatchmakingError(`Matchmaking requires exactly 22 players. Currently have ${playerIds.length}.`);
        setMatchmakingLoading(false);
        return;
      }

      const response = await fetch("/api/matchmaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds }),
      });

      const data = await response.json();

      if (data.success) {
        setMatchmakingResult(data);
      } else {
        setMatchmakingError(data.error || "Matchmaking failed.");
      }
    } catch (error: any) {
      setMatchmakingError(error.message || "Matchmaking failed.");
    } finally {
      setMatchmakingLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors pb-12">
        <header className="sticky top-0 z-50 w-full flex flex-col md:flex-row justify-between items-center p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              ⚽ 11Players
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-4 text-sm font-semibold mr-4">
              <Link href="/community" className="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300">
                Community
              </Link>
              <Link href="/stats" className="hover:text-emerald-500 transition-colors">
                Stats
              </Link>
              {user && (
                <Link href={`/profile?uid=${user.uid}`} className="hover:text-emerald-500 transition-colors">
                  My Profile
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors">
                  <ShieldAlert className="w-4 h-4" /> Admin
                </Link>
              )}
            </nav>
            <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-600 pl-4">
              <button onClick={toggleLocale} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Globe className="w-4 h-4" />
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={logout} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2">Player Directory</h2>
              <p className="text-slate-500 dark:text-slate-400">Live roster of all registered Elite players.</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              {isAdmin && (
                <button
                  onClick={handleMatchmaking}
                  disabled={matchmakingLoading}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 whitespace-nowrap"
                >
                  {matchmakingLoading ? "Generating..." : "Matchmake (Admin)"}
                </button>
              )}
            </div>
          </div>

          {matchmakingError && (
            <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-xl font-medium">
              {matchmakingError}
            </div>
          )}

          {/* Directory Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">No players found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredPlayers.map((player, index) => (
                  <motion.div
                    key={player.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <PlayerCard player={player} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Group Chat Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Community Hub Lounge</h3>
            <div className="flex justify-center">
              {user && <VirtualChat currentUser={user} />}
            </div>
          </div>
        </main>
        
        {/* Matchmaking Results Modal */}
        <AnimatePresence>
          {matchmakingResult && (
            <MatchmakingModal 
              result={matchmakingResult} 
              onClose={() => setMatchmakingResult(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
