"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminTable from "@/components/AdminTable";
import MatchmakingModal from "@/components/MatchmakingModal";
import { AnimatePresence } from "framer-motion";
import { generateMasterBulkPDF } from "@/lib/pdf";
import { balanceTeams } from "@/lib/matchmaker";
import Navbar from "@/components/Navbar";
import { useLocale } from "@/components/ThemeProvider";
import PendingEdits from "@/components/PendingEdits";

export default function AdminPage() {
  const { players, loading } = usePlayers();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  // Matchmaking State
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [matchmakingResult, setMatchmakingResult] = useState<any>(null);
  const [matchmakingError, setMatchmakingError] = useState("");

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
        formation: result.formation,
        tipsAndTactics: result.tipsAndTactics,
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
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">{isAr ? "أدوات التحكم" : "Platform Controls"}</h2>
              <p className="text-slate-500 dark:text-slate-400" dir={isAr ? "rtl" : "ltr"}>{isAr ? "إدارة اللاعبين، تحديث الإحصائيات، وتشكيل الفرق." : "Manage players, update stats, and run matchmaking."}</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={handleBulkPdf}
                className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold rounded-lg shadow-sm whitespace-nowrap"
              >
                {isAr ? "تصدير بطاقات الجميع PDF" : "Export Bulk PDF"}
              </button>
              <button
                onClick={handleMatchmaking}
                disabled={matchmakingLoading}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 whitespace-nowrap"
              >
                {matchmakingLoading ? (isAr ? "جارٍ الإنشاء..." : "Generating...") : (isAr ? "تشكيل الفرق" : "Run Matchmaking")}
              </button>
            </div>
          </div>

          {matchmakingError && (
            <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-xl font-medium">
              {matchmakingError}
            </div>
          )}

          <PendingEdits />

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <AdminTable players={players} onRefresh={() => {}} />
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
