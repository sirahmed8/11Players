"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import PlayerCardCompact from "@/components/player/PlayerCardCompact";
import Top3Podium from "@/components/player/Top3Podium";
import PlayerComparisonModal from "@/components/player/PlayerComparisonModal";
import { getPlayerOverall } from "@/lib/playerUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ChevronDown, Trophy, ArrowRightLeft, SlidersHorizontal, Sparkles } from "lucide-react";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalLeaderboardPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isAr = locale === "ar";

  const [globalPlayers, setGlobalPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>("ALL");
  const [minOvrFilter, setMinOvrFilter] = useState<number>(40);
  const [sortBy, setSortBy] = useState<"overall" | "name" | "goals" | "assists" | "mvp">("overall");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [comparingPlayer, setComparingPlayer] = useState<PlayerProfile | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    const fetchGlobalPlayers = async () => {
      try {
        // Fix Bug #19: Fetch all player profiles directly without meaningless orderBy("calculatedAge")
        const snap = await getDocs(collection(db, "players"));
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

  const handleOpenCompare = (player?: PlayerProfile) => {
    setComparingPlayer(player || null);
    setIsCompareModalOpen(true);
  };

  const filteredPlayers = useMemo(() => {
    const queryStr = searchQuery.toLowerCase().trim();
    let result = [...globalPlayers];

    if (selectedPosFilter !== "ALL") {
      result = result.filter(p =>
        p.primaryPosition === selectedPosFilter ||
        p.secondaryPosition === selectedPosFilter ||
        p.tertiaryPosition === selectedPosFilter ||
        p.preferredPosition === selectedPosFilter
      );
    }

    if (minOvrFilter > 40) {
      result = result.filter(p => getPlayerOverall(p) >= minOvrFilter);
    }

    if (queryStr) {
      result = result.filter(p =>
        (p.fullName || "").toLowerCase().includes(queryStr) ||
        (p.cardName || "").toLowerCase().includes(queryStr) ||
        (p.primaryPosition || "").toLowerCase().includes(queryStr)
      );
    }

    return result.sort((a, b) => {
      if (sortBy === "overall") {
        return getPlayerOverall(b) - getPlayerOverall(a);
      }
      if (sortBy === "name") {
        return (a.fullName || "").localeCompare(b.fullName || "");
      }
      return (b.stats?.[sortBy] || 0) - (a.stats?.[sortBy] || 0);
    });
  }, [globalPlayers, searchQuery, selectedPosFilter, minOvrFilter, sortBy]);

  if (loading) {
    return <SiteSkeletonLoader variant="global" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white transition-colors pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[400px] rounded-full bg-emerald-500/4 blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold tracking-wide uppercase mb-4">
            <Trophy className="w-3.5 h-3.5" />
            {isAr ? "سجل النخبة العالمي" : "Global Hall of Fame"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            {isAr ? "الترتيب العام للاعبين" : "Global Player Registry"}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm font-medium">
            {isAr
              ? "تصنيف شامل لجميع اللاعبين المسجلين عبر منصة 11Players."
              : "Comprehensive ranking of all registered players across all communities."}
          </p>
        </motion.div>

        {/* Top 3 Podium Showcase */}
        {!loading && globalPlayers.length >= 3 && (
          <Top3Podium
            players={globalPlayers}
            isAr={isAr}
            onSelectPlayer={(p) => handleOpenCompare(p)}
          />
        )}

        {/* Controls & Filter Bar */}
        <div className="relative z-10 bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isAr ? "ابحث بالاسم أو المركز..." : "Search player or position..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 rounded-xl outline-none transition-all duration-300 text-sm font-bold text-white placeholder-slate-500 shadow-inner"
            />
          </div>

          {/* Action buttons & Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Compare Button */}
            <button
              onClick={() => handleOpenCompare()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 shadow-md active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isAr ? "مقارنة اللاعبين" : "Compare Players"}</span>
            </button>

            {/* Position Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <button 
                onClick={() => setIsPosOpen(!isPosOpen)}
                className="w-full flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl hover:border-slate-700 transition-colors text-xs font-semibold text-white"
              >
                <span className="text-slate-400 truncate">
                  {isAr ? "المركز:" : "Pos:"}{" "}
                  <span className="text-emerald-400 font-bold">
                    {selectedPosFilter === "ALL" ? (isAr ? "الكل" : "All") : selectedPosFilter}
                  </span>
                </span>
                <motion.div animate={{ rotate: isPosOpen ? 180 : 0 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isPosOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 top-full mt-2 w-52 max-h-72 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl ltr:left-0 rtl:right-0 py-1"
                  >
                    {(["ALL", "CF", "SS", "LWF", "RWF", "AMF", "CMF", "DMF", "CB", "RB", "LB", "GK"] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => { setSelectedPosFilter(pos); setIsPosOpen(false); }}
                        className={`flex items-center justify-between w-full text-start px-4 py-2.5 hover:bg-slate-800/60 font-semibold transition-colors text-xs ${
                          selectedPosFilter === pos ? "text-emerald-400 bg-emerald-950/40" : "text-slate-300"
                        }`}
                      >
                        <span>{pos === "ALL" ? (isAr ? "كل المراكز" : "All Positions") : pos}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Selector */}
            <div className="relative flex-1 sm:flex-initial">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl hover:border-slate-700 transition-colors text-xs font-semibold text-white"
              >
                <span className="text-slate-400 truncate">
                  {isAr ? "ترتيب:" : "Sort:"}{" "}
                  <span className="text-emerald-400 font-bold">
                    {sortBy === "overall" ? "Overall" : sortBy === "name" ? (isAr ? "الاسم" : "Name") : sortBy === "goals" ? (isAr ? "الأهداف" : "Goals") : sortBy === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
                  </span>
                </span>
                <motion.div animate={{ rotate: isSortOpen ? 180 : 0 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 top-full mt-2 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ltr:right-0 rtl:left-0 py-1"
                  >
                    {(["overall", "name", "goals", "assists", "mvp"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSortBy(s); setIsSortOpen(false); }}
                        className={`block w-full text-start px-4 py-2.5 hover:bg-slate-800/60 font-semibold text-xs ${sortBy === s ? "text-emerald-400 bg-emerald-950/40" : "text-slate-300"}`}
                      >
                        {s === "overall" ? (isAr ? "التقييم العام" : "Overall") : s === "name" ? (isAr ? "الاسم" : "Name") : s === "goals" ? (isAr ? "الأهداف" : "Goals") : s === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Player Cards Grid */}
        {loading ? (
          <SiteSkeletonLoader variant="cards" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPlayers.map((p, index) => (
              <motion.div
                key={p.uid}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3 }}
              >
                <PlayerCardCompact player={p} currentUserId={user?.uid} onCompare={handleOpenCompare} />
              </motion.div>
            ))}
            {filteredPlayers.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-slate-400 font-bold">
                {isAr ? "لا يوجد لاعبون مطابقون للبحث." : "No players match your search criteria."}
              </div>
            )}
          </div>
        )}

        {/* Comparison Modal */}
        <PlayerComparisonModal
          isOpen={isCompareModalOpen}
          onClose={() => { setIsCompareModalOpen(false); setComparingPlayer(null); }}
          initialPlayerA={comparingPlayer || (user ? globalPlayers.find(p => p.uid === user.uid) : null)}
          allPlayers={globalPlayers}
        />
      </main>
    </div>
  );
}
