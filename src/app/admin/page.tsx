"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useCommunity } from "@/contexts/CommunityContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminTable from "@/components/AdminTable";
import MatchmakingModal from "@/components/MatchmakingModal";
import { AnimatePresence, motion } from "framer-motion";
import { generateMasterBulkPDF } from "@/lib/pdf";
import { balanceTeams } from "@/lib/matchmaker";
import { generateDummyPlayersForCommunity } from "@/lib/dummyData";
import { useLocale } from "@/components/ThemeProvider";
import PendingEdits from "@/components/PendingEdits";
import PendingRequests from "@/components/PendingRequests";
import MatchConfigModal, { MatchConfig } from "@/components/MatchConfigModal";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Target, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPage() {
  const { players, loading } = usePlayers();
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  // Matchmaking State
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [matchmakingResult, setMatchmakingResult] = useState<any>(null);
  const [matchmakingError, setMatchmakingError] = useState("");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false);
  const [showDummyConfirm, setShowDummyConfirm] = useState(false);

  const executeGenerateDummyPlayers = async () => {
    if (!activeCommunityId) return;
    setShowDummyConfirm(false);
    setIsGeneratingDummy(true);
    try {
      await generateDummyPlayersForCommunity(activeCommunityId);
      toast.success(isAr ? "تم إنشاء 32 لاعب بنجاح!" : "Successfully generated 32 players!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل الإنشاء" : "Failed to generate players.");
    } finally {
      setIsGeneratingDummy(false);
    }
  };

  const handleGenerateDummyPlayers = () => {
    setShowDummyConfirm(true);
  };

  const handleMatchmaking = async (config: MatchConfig) => {
    try {
      if (!activeCommunityId) throw new Error("No active community selected");
      setMatchmakingLoading(true);
      setMatchmakingError("");
      
      const playerIds = players.map((p) => p.uid);

      if (playerIds.length < 22) {
        setMatchmakingError(`Matchmaking requires at least 22 players. Currently have ${playerIds.length}.`);
        setMatchmakingLoading(false);
        return;
      }

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = balanceTeams(players);

      const matchData = {
        success: true,
        teamA: result.teamA,
        teamB: result.teamB,
        metrics: result.metrics,
        formation: result.formation,
        tipsAndTactics: result.tipsAndTactics,
        config, // Save the match config!
        generatedAt: new Date().toISOString(),
      };

      setMatchmakingResult(matchData);

      // Save to Firestore
      try {
        await setDoc(doc(db, "communities", activeCommunityId, "system", "latestMatch"), matchData);
      } catch (err) {
        console.error("Failed to save match to database:", err);
      }
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
    <ProtectedRoute adminOnly requireCommunity={false}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12">
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {!activeCommunityId ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isAr ? "لا يوجد مجتمع محدد" : "No Community Selected"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                {isAr ? "يرجى تحديد مجتمع من قائمة المجتمعات للوصول إلى أدوات التحكم." : "Please select a community from the communities list to access admin controls."}
              </p>
              <a href="/communities" className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                {isAr ? "الذهاب للمجتمعات" : "Go to Communities"}
              </a>
            </div>
          ) : (
            <>
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
                onClick={handleGenerateDummyPlayers}
                disabled={isGeneratingDummy}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 whitespace-nowrap"
              >
                {isGeneratingDummy ? (isAr ? "جارٍ الإنشاء..." : "Generating...") : (isAr ? "إنشاء 32 لاعب وهمي" : "Generate 32 Players")}
              </button>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                disabled={matchmakingLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 whitespace-nowrap"
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

          <PendingRequests />
          <PendingEdits />

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <AdminTable players={players} onRefresh={() => {}} />
          )}
          </>
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

        <MatchConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onGenerate={handleMatchmaking}
        />

        {/* Dummy Generation Confirm Modal */}
        <AnimatePresence>
          {showDummyConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full relative"
                dir={isAr ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
                  <AlertTriangle className="w-8 h-8" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {isAr ? "تأكيد الإنشاء" : "Confirm Generation"}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  {isAr 
                    ? "هل أنت متأكد من رغبتك في إنشاء 32 لاعب وهمي؟ سيتم إضافتهم إلى مجتمعك الحالي لغرض التجربة." 
                    : "Are you sure you want to generate 32 dummy players? They will be added to your active community for testing purposes."}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDummyConfirm(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={executeGenerateDummyPlayers}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transition-colors"
                  >
                    {isAr ? "تأكيد وإنشاء" : "Confirm & Generate"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
