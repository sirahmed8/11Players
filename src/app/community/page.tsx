"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlayerCard from "@/components/PlayerCard";
import MatchmakingModal from "@/components/MatchmakingModal";
import { PlayerProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { balanceTeams } from "@/lib/matchmaker";
import dynamic from "next/dynamic";

const VirtualChat = dynamic(() => import("@/components/VirtualChat"), {
  ssr: false,
  loading: () => <div className="text-slate-500 py-8">Loading Chat...</div>
});

export default function CommunityPage() {
  const { user, isAdmin, isOwner } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const { players, loading } = usePlayers();
  const [searchQuery, setSearchQuery] = useState("");

  // Matchmaking State
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [matchmakingResult, setMatchmakingResult] = useState<any>(null);
  const [matchmakingError, setMatchmakingError] = useState("");

  const filteredPlayers = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return players;
    return players.filter((p) => {
      return (
        p.fullName.toLowerCase().includes(query) ||
        p.cardName.toLowerCase().includes(query) ||
        p.primaryPosition.toLowerCase().includes(query)
      );
    });
  }, [players, searchQuery]);

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

      // Small delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = balanceTeams(players);

      setMatchmakingResult({
        success: true,
        teamA: result.teamA,
        teamB: result.teamB,
        metrics: result.metrics,
        formation: result.formation,
        tipsAndTactics: result.tipsAndTactics,
      });
    } catch (error: any) {
      setMatchmakingError(error.message || "Matchmaking failed.");
    } finally {
      setMatchmakingLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors pb-12">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2">Player Directory</h2>
              <p className="text-slate-500 dark:text-slate-400 text-start" dir="ltr">Live roster of all registered Elite players.</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64 flex items-center bg-white dark:bg-slate-800/60 border-2 rounded-xl transition-all duration-300 border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-500">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                />
              </div>
              
              {isOwner && (
                <button
                  onClick={handleMatchmaking}
                  disabled={matchmakingLoading || players.length < 22}
                  className={`px-4 py-2 text-white font-bold rounded-lg shadow-lg whitespace-nowrap transition-all ${
                    players.length < 22
                      ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                  }`}
                  title={players.length < 22 ? (isAr ? "يتطلب 22 لاعبًا" : "Requires 22 players") : ""}
                >
                  {matchmakingLoading ? (isAr ? "جارٍ الإنشاء..." : "Generating...") : (isAr ? "تشكيل الفرق" : "Matchmake")}
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
            <h3 className="text-2xl font-bold mb-6 text-center">{isAr ? "صالة المجتمع" : "Community Hub Lounge"}</h3>
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
