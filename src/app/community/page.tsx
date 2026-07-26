"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PlayerCardCompact from "@/components/player/PlayerCardCompact";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PlayerComparisonModal from "@/components/player/PlayerComparisonModal";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, LogOut, Users, Activity, HelpCircle, ArrowRightLeft, Shield, SlidersHorizontal, Sparkles } from "lucide-react";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import CommunityPulseFeed from "@/components/community/CommunityPulseFeed";
import { getPlayerOverall } from "@/lib/playerUtils";
import OvrExplanationModal from "@/components/player/OvrExplanationModal";
import { arrayRemove, arrayUnion, deleteDoc, doc, updateDoc, getDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CommunityPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const { activeCommunityId, setActiveCommunityId, activeCommunity } = useCommunity();

  const { players, loading } = usePlayers();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"overall" | "position" | "goals" | "assists" | "mvp">("overall");
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>("ALL");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isOvrInfoOpen, setIsOvrInfoOpen] = useState(false);
  const [comparingPlayer, setComparingPlayer] = useState<any | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "pulse">("directory");
  const [visibleCount, setVisibleCount] = useState(20);

  const handleOpenCompare = (player?: any) => {
    setComparingPlayer(player || null);
    setIsCompareModalOpen(true);
  };

  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, selectedPosFilter, sortBy]);

  const filteredPlayers = useMemo(() => {
    const queryStr = searchQuery.toLowerCase().trim();
    let result = [...players];

    if (selectedPosFilter !== "ALL") {
      result = result.filter(p =>
        p.primaryPosition === selectedPosFilter ||
        p.secondaryPosition === selectedPosFilter ||
        p.tertiaryPosition === selectedPosFilter ||
        p.preferredPosition === selectedPosFilter
      );
    }

    if (queryStr) {
      result = result.filter((p) => {
        return (
          p.fullName?.toLowerCase().includes(queryStr) ||
          p.cardName?.toLowerCase().includes(queryStr) ||
          p.primaryPosition?.toLowerCase().includes(queryStr)
        );
      });
    }

    return result.sort((a, b) => {
      if (sortBy === "overall") {
        return getPlayerOverall(b) - getPlayerOverall(a);
      }
      if (sortBy === "position") {
        return a.primaryPosition.localeCompare(b.primaryPosition) || getPlayerOverall(b) - getPlayerOverall(a);
      }
      return (b.stats?.[sortBy] || 0) - (a.stats?.[sortBy] || 0);
    });
  }, [players, searchQuery, sortBy, selectedPosFilter]);

  const handleVoteCaptain = async (playerId: string) => {
    if (!user || !activeCommunityId) return;
    if (playerId === user.uid) {
      toast.error(isAr ? "لا يمكنك التصويت لنفسك لتكون كابتن!" : "You cannot vote for yourself as captain!");
      return;
    }
    try {
      const targetPlayer = players.find(p => p.uid === playerId);
      if (!targetPlayer) return;
      
      const currentVotes = targetPlayer.captainVotes || [];
      const hasVoted = currentVotes.includes(user.uid);
      const communityPlayerRef = doc(db, "communities", activeCommunityId, "players", playerId);

      await updateDoc(communityPlayerRef, {
        captainVotes: hasVoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      
      if (!hasVoted) {
        try {
          await setDoc(doc(collection(db, `users/${playerId}/notifications`), `captain_vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
            type: 'social',
            title: isAr ? '👑 صوت كابتن جديد!' : '👑 New Captain Vote!',
            body: isAr ? `قام أحد زملائك في المجتمع بالتصويت لك لتكون كابتن الفريق! مجموع أصواتك الآن: ${currentVotes.length + 1}.` : `A community teammate voted for you to be team captain! Your total votes: ${currentVotes.length + 1}.`,
            read: false,
            createdAt: serverTimestamp(),
            link: '/community'
          });
        } catch (e) {
          console.warn("Could not send captain vote notification:", e);
        }
      }
      
      toast.success(hasVoted ? (isAr ? "تم إلغاء التصويت" : "Vote removed") : (isAr ? "تم التصويت كابتن! (+1)" : "Voted for captain! (+1)"));
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء التصويت" : "Error casting vote");
    }
  };

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

  if (loading) {
    return (
      <ProtectedRoute requireCommunity>
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <SiteSkeletonLoader variant="community" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-950 text-white transition-colors pb-16" dir={isAr ? 'rtl' : 'ltr'}>
        
        {/* Background glow effects */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[400px] rounded-full bg-teal-500/4 blur-[100px]" />
        </div>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {activeCommunity?.name || (isAr ? "الرئيسية / اللاعبين" : "Home / Players")}
                </h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {players.length} {isAr ? "لاعب" : "Players"}
                </span>
              </div>
              <p className="text-slate-400 text-sm font-medium">
                {isAr ? "قائمة لاعبي المجتمع النشط والتصويت والتحليلات المباشرة." : "Live roster of all registered community players."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
              {/* Copy Invite Link */}
              <button
                onClick={() => {
                  if (activeCommunityId) {
                    const link = `${window.location.origin}/communities?join=${activeCommunityId}`;
                    navigator.clipboard.writeText(link);
                    toast.success(isAr ? "تم نسخ رابط دعوة المجتمع!" : "Community invite link copied!");
                  }
                }}
                className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? "دعوة لاعبين" : "Invite Players"}</span>
              </button>

              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isAr ? "ابحث بالاسم أو المركز..." : "Search name or position..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-bold text-white placeholder-slate-500 shadow-sm"
                />
              </div>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isAr ? "مغادرة المجتمع" : "Leave Community"}</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 space-y-4 mb-8">
            {/* Top Tab Bar: Directory vs Pulse */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80 shadow-sm">
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                <button
                  onClick={() => setActiveTab("directory")}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                    activeTab === "directory"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isAr ? "قائمة اللاعبين" : "Player Directory"}</span>
                </button>

                <button
                  onClick={() => setActiveTab("pulse")}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                    activeTab === "pulse"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isAr ? "نبض المجتمع" : "Community Pulse"}</span>
                </button>
              </div>
            </div>

            {/* Directory Action Tools & Filters Bar */}
            {activeTab === "directory" && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80 shadow-sm">
                {/* Quick Action Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenCompare()}
                    className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                    <span>{isAr ? "مقارنة اللاعبين" : "Compare Players"}</span>
                  </button>

                  <button
                    onClick={() => setIsOvrInfoOpen(true)}
                    className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                    title={isAr ? "كيف يتم حساب التقييم الكلي؟" : "How is OVR Calculated?"}
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{isAr ? "حساب OVR" : "OVR Formula"}</span>
                  </button>
                </div>

                {/* Filter & Sort Dropdowns */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {/* Position Filter */}
                  <div className="relative flex-1 sm:flex-initial">
                    <button 
                      onClick={() => {
                        setIsPosOpen(prev => !prev);
                        setIsSortOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl hover:border-slate-700 transition-colors text-xs font-semibold text-white"
                    >
                      <span className="text-slate-400 truncate">
                        {isAr ? "المركز:" : "Position:"}{" "}
                        <span className="text-emerald-400 font-bold">
                          {selectedPosFilter === "ALL" ? (isAr ? "الكل" : "All") : selectedPosFilter}
                        </span>
                      </span>
                      <motion.div animate={{ rotate: isPosOpen ? 180 : 0 }}>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isPosOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 top-full mt-2 w-full sm:w-64 max-h-72 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl ltr:left-0 rtl:right-0"
                        >
                          {(["ALL", "CF", "SS", "LWF", "RWF", "AMF", "CMF", "DMF", "CB", "RB", "LB", "GK"] as const).map((pos) => {
                            const count = pos === "ALL"
                              ? players.length
                              : players.filter(p =>
                                  p.primaryPosition === pos ||
                                  p.secondaryPosition === pos ||
                                  p.tertiaryPosition === pos ||
                                  p.preferredPosition === pos
                                ).length;
                            const isActive = selectedPosFilter === pos;
                            return (
                              <button
                                key={pos}
                                onClick={() => { setSelectedPosFilter(pos); setIsPosOpen(false); }}
                                className={`flex items-center justify-between w-full text-start px-4 py-2.5 hover:bg-slate-800/60 font-semibold transition-colors text-xs ${
                                  isActive ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300"
                                }`}
                              >
                                <span>{pos === "ALL" ? (isAr ? "كل المراكز" : "All Positions") : pos}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                                }`}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Sort By */}
                  <div className="relative flex-1 sm:flex-initial">
                    <button 
                      onClick={() => {
                        setIsSortOpen(prev => !prev);
                        setIsPosOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl hover:border-slate-700 transition-colors text-xs font-semibold text-white"
                    >
                      <span className="text-slate-400 truncate">
                        {isAr ? "ترتيب:" : "Sort:"}{" "}
                        <span className="text-emerald-400 font-bold">
                          {sortBy === "overall" ? "Overall" : sortBy === "position" ? (isAr ? "المركز" : "Position") : sortBy === "goals" ? (isAr ? "الأهداف" : "Goals") : sortBy === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
                        </span>
                      </span>
                      <motion.div animate={{ rotate: isSortOpen ? 180 : 0 }}>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isSortOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden ltr:right-0 rtl:left-0"
                        >
                          {(["overall", "position", "goals", "assists", "mvp"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => { setSortBy(s); setIsSortOpen(false); }}
                              className={`block w-full text-start px-4 py-2.5 hover:bg-slate-800/60 font-semibold text-xs ${sortBy === s ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300"}`}
                            >
                              {s === "overall" ? "Overall" : s === "position" ? (isAr ? "المركز" : "Position") : s === "goals" ? (isAr ? "الأهداف" : "Goals") : s === "assists" ? (isAr ? "الصناعة" : "Assists") : "MVP"}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Directory Grid or Pulse Feed */}
          {activeTab === "pulse" ? (
            <CommunityPulseFeed />
          ) : loading ? (
            <SiteSkeletonLoader variant="cards" />
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-400 font-bold">{isAr ? "لا يوجد لاعبون بهذا الوصف أو المركز." : "No players found matching your criteria."}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPlayers.slice(0, visibleCount).map((player, index) => (
                  <motion.div
                    key={player.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                  >
                    <PlayerCardCompact 
                      player={player} 
                      onVoteCaptain={handleVoteCaptain}
                      onCompare={handleOpenCompare}
                      currentUserId={user?.uid}
                    />
                  </motion.div>
                ))}
              </div>
              
              {visibleCount < filteredPlayers.length && (
                <div className="flex justify-center pt-4 pb-8">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl transition-all text-sm"
                  >
                    {isAr ? "عرض المزيد" : "Load More"}
                  </button>
                </div>
              )}
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

        <OvrExplanationModal
          isOpen={isOvrInfoOpen}
          onClose={() => setIsOvrInfoOpen(false)}
          player={user ? players.find(p => p.uid === user.uid) : null}
        />

        <PlayerComparisonModal
          isOpen={isCompareModalOpen}
          onClose={() => { setIsCompareModalOpen(false); setComparingPlayer(null); }}
          initialPlayerA={comparingPlayer || (user ? players.find(p => p.uid === user.uid) : null)}
          allPlayers={players}
        />
      </div>
    </ProtectedRoute>
  );
}
