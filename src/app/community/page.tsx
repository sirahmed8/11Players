"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlayerCardCompact from "@/components/PlayerCardCompact";
import ConfirmModal from "@/components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, LogOut } from "lucide-react";
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import { deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CommunityPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const { activeCommunityId, setActiveCommunityId } = useCommunity();

  const { players, loading } = usePlayers();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"overall" | "goals" | "assists" | "mvp">("overall");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const filteredPlayers = React.useMemo(() => {
    const getOvr = (p: any) => calculateRealisticOverall(p.approvedAttributes || p.attributes || {}, p.primaryPosition || 'CMF', p.playStyle || "");
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [...players].sort((a, b) => {
      if (sortBy === "overall") {
        return getOvr(b) - getOvr(a);
      }
      return (b.stats?.[sortBy] || 0) - (a.stats?.[sortBy] || 0);
    });
    return players.filter((p) => {
      return (
        p.fullName.toLowerCase().includes(query) ||
        p.cardName.toLowerCase().includes(query) ||
        p.primaryPosition.toLowerCase().includes(query)
      );
    }).sort((a, b) => {
      if (sortBy === "overall") {
        return getOvr(b) - getOvr(a);
      }
      return (b.stats?.[sortBy] || 0) - (a.stats?.[sortBy] || 0);
    });
  }, [players, searchQuery, sortBy]);

  const handleLeaveCommunity = async () => {
    if (!user || !activeCommunityId) return;
    try {
      await deleteDoc(doc(db, `communities/${activeCommunityId}/players`, user.uid));
      const playerSnap = await getDoc(doc(db, "players", user.uid));
      if (playerSnap.exists()) {
        const pData = playerSnap.data();
        const existingComms = Array.isArray(pData.communities) ? pData.communities : [];
        const nextComms = existingComms.filter((id: string) => id !== activeCommunityId);
        await updateDoc(doc(db, "players", user.uid), {
          communities: nextComms,
          activeCommunityId: nextComms.length > 0 ? nextComms[0] : null
        });
        setActiveCommunityId(nextComms.length > 0 ? nextComms[0] : null);
      }
      toast.success(isAr ? "تمت مغادرة المجتمع بنجاح" : "Left community successfully");
      router.push("/communities");
    } catch (err) {
      console.error("Error leaving community:", err);
      toast.error(isAr ? "حدث خطأ أثناء مغادرة المجتمع" : "Error leaving community");
    }
  };

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12">
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2">Player Directory</h2>
              <p className="text-slate-600 dark:text-slate-400 text-start" dir="ltr">Live roster of all registered Elite players.</p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
              <div className="relative flex-1 md:w-64 flex items-center bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all duration-300 focus-within:border-emerald-500 shadow-sm">
                <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isAr ? "ابحث بالاسم أو المركز..." : "Search by name or position..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 rounded-2xl pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-sm shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>{isAr ? "مغادرة المجتمع" : "Leave Community"}</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-end mb-6">
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm hover:border-emerald-500 transition-colors"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "ترتيب حسب:" : "Sort by:"} {sortBy === "overall" ? "Overall" : sortBy === "goals" ? (isAr ? "الأهداف" : "Goals") : sortBy === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
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
                    className="absolute z-10 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden right-0"
                  >
                    {(["overall", "goals", "assists", "mvp"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSortBy(s); setIsSortOpen(false); }}
                        className={`block w-full text-start px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold ${sortBy === s ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        {s === "overall" ? "Overall" : s === "goals" ? (isAr ? "الأهداف" : "Goals") : s === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400">No players found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredPlayers.map((player, index) => (
                  <motion.div
                    key={player.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    layout
                  >
                    <PlayerCardCompact player={player} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        <ConfirmModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onConfirm={handleLeaveCommunity}
          title={isAr ? "مغادرة المجتمع" : "Leave Community"}
          message={isAr ? "هل أنت متأكد من رغبتك في مغادرة هذا المجتمع؟ سيتم إزالتك من قائمة لاعبي هذا المجتمع." : "Are you sure you want to leave this community? You will be removed from this community roster."}
        />
      </div>
    </ProtectedRoute>
  );
}
