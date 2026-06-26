"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminTable from "@/components/AdminTable";
import MatchmakingModal from "@/components/MatchmakingModal";
import { PlayerProfile } from "@/types";
import { Globe, Sun, Moon, LogOut, ArrowLeft } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { generateMasterBulkPDF } from "@/lib/pdf";
import { balanceTeams } from "@/lib/matchmaker";

export default function AdminPage() {
  const { user, isAdmin, logout } = useAuth();
  const { toggleLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Matchmaking State
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [matchmakingResult, setMatchmakingResult] = useState<any>(null);
  const [matchmakingError, setMatchmakingError] = useState("");

  const loadPlayers = () => {
    const q = query(collection(db, "players"), orderBy("calculatedAge", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlayers: PlayerProfile[] = [];
      snapshot.forEach((doc) => {
        fetchedPlayers.push({ uid: doc.id, ...doc.data() } as PlayerProfile);
      });
      setPlayers(fetchedPlayers);
      setLoading(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = loadPlayers();
    return () => unsubscribe();
  }, []);

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

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = balanceTeams(players);

      setMatchmakingResult({
        success: true,
        teamA: result.teamA,
        teamB: result.teamB,
        metrics: result.metrics,
      });
    } catch (error: any) {
      setMatchmakingError(error.message || "Matchmaking failed.");
    } finally {
      setMatchmakingLoading(false);
    }
  };

  const handleBulkPdf = () => {
    generateMasterBulkPDF(players);
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors pb-12">
        <header className="sticky top-0 z-50 w-full flex flex-col md:flex-row justify-between items-center p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/community" className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500">
              🛡️ ADMIN DASHBOARD
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-4">
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
              <h2 className="text-3xl font-black mb-2">Platform Controls</h2>
              <p className="text-slate-500 dark:text-slate-400">Manage players, update stats, and run matchmaking.</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={handleBulkPdf}
                className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold rounded-lg shadow-sm whitespace-nowrap"
              >
                Export Bulk PDF
              </button>
              <button
                onClick={handleMatchmaking}
                disabled={matchmakingLoading}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 whitespace-nowrap"
              >
                {matchmakingLoading ? "Generating..." : "Run Matchmaking"}
              </button>
            </div>
          </div>

          {matchmakingError && (
            <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-xl font-medium">
              {matchmakingError}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <AdminTable players={players} onRefresh={loadPlayers} />
          )}
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
