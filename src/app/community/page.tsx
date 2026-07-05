"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlayerCardCompact from "@/components/PlayerCardCompact";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { calculateRealisticOverall } from "@/lib/overallCalculator";


export default function CommunityPage() {
  const { user, isAdmin, isOwner } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const { players, loading } = usePlayers();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"overall" | "goals" | "assists" | "mvp">("overall");
  const [isSortOpen, setIsSortOpen] = useState(false);


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


  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12">
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2">Player Directory</h2>
              <p className="text-slate-600 dark:text-slate-400 text-start" dir="ltr">Live roster of all registered Elite players.</p>
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
      </div>
    </ProtectedRoute>
  );
}
