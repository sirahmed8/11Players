"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useCommunity } from "@/contexts/CommunityContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminTable from "@/components/admin/AdminTable";
import { motion, AnimatePresence } from "framer-motion";
import { generateMasterBulkPDF } from "@/lib/pdf";
import { getTacticalSuggestions } from "@/lib/suggestionEngine";
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import { useLocale } from "@/components/ui/ThemeProvider";
import PendingRequests from "@/components/admin/PendingRequests";
import { doc, setDoc, getDoc, deleteDoc, updateDoc, collection, getDocs, getCountFromServer, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Target, Users, Sparkles, FileDown, UserX, ShieldCheck, Lock, CheckCircle2, RefreshCw, BarChart3, AlertCircle, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";

export default function AdminPage() {
  const { user, isOwner } = useAuth();
  const { players, loading, refreshPlayers } = usePlayers();
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "players" | "ai" | "pending">("ai");
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);

  // Auto-run daily peer rating aggregation on first admin visit each day
  useEffect(() => {
    if (!activeCommunityId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { runDailyRatingAggregation } = await import("@/lib/ratingAggregator");
        const result = await runDailyRatingAggregation(activeCommunityId);
        if (!cancelled && result.updatedCount > 0) {
          toast.success(isAr
            ? `تم تحديث تقييمات ${result.updatedCount} لاعب`
            : `Updated peer ratings for ${result.updatedCount} players`);
        }
      } catch (err) {
        console.warn("Daily aggregation skipped:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCommunityId, user, isAr]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const handleResetCaptainVotes = async () => {
    if (!activeCommunityId) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? "إعادة تعيين أصوات الكابتن" : "Reset Captain Votes",
      message: isAr ? "هل أنت متأكد من رغبتك في إعادة تعيين جميع أصوات الكابتن في هذا المجتمع؟" : "Are you sure you want to reset all captain votes in this community?",
      onConfirm: async () => {
        try {
          let count = 0;
          for (const p of players) {
            if (p.captainVotes && p.captainVotes.length > 0) {
              await updateDoc(doc(db, "players", p.uid), {
                captainVotes: []
              });
              count++;
            }
          }
          toast.success(isAr ? `تمت إعادة تعيين أصوات الكابتن لـ ${count} لاعبين بنجاح.` : `Successfully reset captain votes for ${count} players.`);
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "حدث خطأ أثناء إعادة تعيين الأصوات" : "Error resetting captain votes");
        }
      }
    });
  };

  const handleApplyAIToAll = async () => {
    if (!activeCommunityId) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تطبيق الذكاء الاصطناعي على الجميع' : 'Apply AI to All Players',
      message: isAr ? 'هل أنت متأكد من تطبيق أفضل المراكز والتقييم لجميع اللاعبين؟ سيتم تحديث مراكزهم وتقييماتهم بناءً على الإحصائيات.' : 'Are you sure you want to apply best AI positions and OVR for all players? This will update their positions and ratings.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const loadingToast = toast.loading(isAr ? 'جاري تطبيق الذكاء الاصطناعي...' : 'Applying AI to all...');
        try {
          const CHUNK_SIZE = 200;
          for (let i = 0; i < players.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = players.slice(i, i + CHUNK_SIZE);
            chunk.forEach(player => {
              const suggestions = getTacticalSuggestions(
                player.attributes || {},
                player.height || 175,
                player.weight || 70,
                player.preferredFoot || 'Right',
                player.calculatedAge || 25,
                player.peerRatingAvg,
                player.peerRatingCount
              );
              const [first, second, third] = suggestions.positions;
              const bestStyle = first?.bestPlayStyle || player.playStyle || '';
              const newPrimary = first?.position || player.primaryPosition;
              const newSecondary = second?.position || '';
              const newTertiary = third?.position || '';
              const newOverall = calculateRealisticOverall(
                player.attributes || {},
                newPrimary || 'CMF',
                bestStyle,
                player.height || 175,
                player.weight || 70,
                player.calculatedAge || 25,
                player.peerRatingAvg,
                player.peerRatingCount,
                player.preferredFoot || 'Right',
                player.specialSkills || [],
                player.stats
              );
              const updates = {
                primaryPosition: newPrimary,
                secondaryPosition: newSecondary,
                tertiaryPosition: newTertiary,
                playStyle: bestStyle,
                overallRating: newOverall
              };
              batch.set(doc(db, "players", player.uid), updates, { merge: true });
              batch.set(doc(db, "communities", activeCommunityId, "players", player.uid), updates, { merge: true });
            });
            await batch.commit();
          }
          toast.dismiss(loadingToast);
          toast.success(isAr ? "تم تطبيق أفضل مراكز لجميع اللاعبين بنجاح! ⚡" : "Successfully applied AI to all players! ⚡");
          if (refreshPlayers) refreshPlayers();
        } catch (err) {
          toast.dismiss(loadingToast);
          console.error(err);
          toast.error(isAr ? "حدث خطأ أثناء تطبيق الذكاء الاصطناعي." : "Error applying AI to players.");
        }
      }
    });
  };

  const handleLockAllToHomeCommunity = async () => {
    if (!activeCommunityId) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? 'تثبيت جميع اللاعبين لمجتمعي الرئيسي' : 'Lock All Players to Home Community',
      message: isAr
        ? `هل أنت متأكد من تعيين هذا المجتمع كمجتمع رئيسي لجميع اللاعبين (${players.length})؟`
        : `Are you sure you want to set your active community as the Home Community for all ${players.length} players?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const loadingToast = toast.loading(isAr ? 'جاري تثبيت جميع اللاعبين...' : 'Locking all players to home community...');
        try {
          const CHUNK_SIZE = 200;
          let count = 0;
          for (let i = 0; i < players.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = players.slice(i, i + CHUNK_SIZE);
            chunk.forEach(player => {
              const updates = {
                homeCommunityId: activeCommunityId,
                primaryCommunityId: activeCommunityId
              };
              batch.set(doc(db, "players", player.uid), updates, { merge: true });
              batch.set(doc(db, "communities", activeCommunityId, "players", player.uid), updates, { merge: true });
              count++;
            });
            await batch.commit();
          }
          toast.dismiss(loadingToast);
          toast.success(isAr ? `تم تثبيت جميع اللاعبين (${count}) بنجاح! 🔒` : `Successfully locked all ${count} players! 🔒`);
          if (refreshPlayers) refreshPlayers();
        } catch (err) {
          toast.dismiss(loadingToast);
          console.error(err);
          toast.error(isAr ? "حدث خطأ أثناء تثبيت اللاعبين." : "Error locking players to home community.");
        }
      }
    });
  };

  const handleBulkPdf = () => {
    generateMasterBulkPDF(players, isAr ? 'ar' : 'en');
  };

  const handleMakeMeAdmin = () => {
    if (!activeCommunityId || !user) return;
    const isAlreadyAdmin = players.some(p => p.uid === user.uid);

    if (isAlreadyAdmin) {
      setConfirmModal({
        isOpen: true,
        title: isAr ? "إزالة الصلاحية" : "Remove Admin Role",
        message: isAr ? "هل أنت متأكد أنك تريد إزالة نفسك كمسؤول؟" : "Are you sure you want to remove yourself as Admin?",
        onConfirm: async () => {
          try {
            await deleteDoc(doc(db, "communities", activeCommunityId, "players", user.uid));
            toast.success(isAr ? "تم إزالتك بنجاح" : "Successfully removed as Admin");
          } catch (err) {
            console.error(err);
            toast.error(isAr ? "فشل إزالة المشرف" : "Failed to remove admin");
          }
        }
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: isAr ? "إضافة كمسؤول" : "Add Admin Role",
        message: isAr ? "هل أنت متأكد أنك تريد إضافة نفسك كمسؤول؟" : "Are you sure you want to add yourself as Admin?",
        onConfirm: async () => {
          try {
            const pDoc = await getDoc(doc(db, "players", user.uid));
            const pData = pDoc.exists() ? pDoc.data() : {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || 'Owner',
              cardName: user.displayName || 'Owner',
            };
            await setDoc(doc(db, "communities", activeCommunityId, "players", user.uid), {
              ...pData,
              role: "admin",
              joinedAt: new Date().toISOString()
            }, { merge: true });
            toast.success(isAr ? "تم إضافتك كمسؤول بنجاح" : "Successfully added as Admin");
          } catch (err) {
            console.error(err);
            toast.error(isAr ? "فشل إضافة المشرف" : "Failed to add admin");
          }
        }
      });
    }
  };

  // Position Stats Calculation
  const positionCounts = React.useMemo(() => {
    const counts = { FW: 0, MID: 0, DEF: 0, GK: 0 };
    players.forEach(p => {
      const pos = p.primaryPosition || "CMF";
      if (["CF", "ST", "SS", "LWF", "RWF"].includes(pos)) counts.FW++;
      else if (["AMF", "CMF", "DMF", "LMF", "RMF"].includes(pos)) counts.MID++;
      else if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) counts.DEF++;
      else if (pos === "GK") counts.GK++;
      else counts.MID++;
    });
    return counts;
  }, [players]);

  const tabs = [
    { id: "overview", label: isAr ? "📊 نظرة عامة ومؤشرات" : "📊 Overview & Metrics" },
    { id: "players", label: isAr ? "👥 إدارة اللاعبين" : "👥 Player Management" },
    { id: "ai", label: isAr ? "⚡ عمليات الذكاء الاصطناعي" : "⚡ AI & Bulk Operations" },
    { id: "pending", label: isAr ? "📝 الطلبات المعلقة" : "📝 Pending Approvals" },
  ];

  if (loading) {
    return (
      <ProtectedRoute adminOnly requireCommunity={false}>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
          <div className="flex items-center gap-3 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 shadow-xl">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-300">Loading Command Center...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly requireCommunity={false}>
      <div className="min-h-screen bg-slate-950 text-white transition-colors pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {!activeCommunityId ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">
                {isAr ? "لا يوجد مجتمع محدد" : "No Community Selected"}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mb-6 font-medium">
                {isAr ? "يرجى تحديد مجتمع من قائمة المجتمعات للوصول إلى لوحة التحكم." : "Please select a community to access executive controls."}
              </p>
              <a href="/communities" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-600/30">
                {isAr ? "الذهاب للمجتمعات" : "Go to Communities"}
              </a>
            </div>
          ) : (
            <>
              {/* Header Title Banner */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                    <span>{isAr ? "لوحة أدوات التحكم وإدارة المنصة" : "Executive Control Center"}</span>
                    <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-black border border-emerald-500/30">
                      ADMIN
                    </span>
                  </h1>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {isAr ? "إدارة التشكيلات التنافسية بالذكاء الاصطناعي، وتحديث الصلاحيات، وتصدير التقارير الرسمية" : "AI match balancing, official roster exports, and platform management."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBulkPdf}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 font-black text-xs rounded-2xl transition-all flex items-center gap-2 shadow"
                >
                  <FileDown className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? "تصدير الكتيب الشامل PDF" : "Export Roster PDF"}</span>
                </button>
              </div>

              {/* Dropdown / List Select Navigation Menu */}
              <div className="relative z-30 max-w-md">
                <button
                  type="button"
                  onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
                  className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between gap-3 text-start hover:border-emerald-500/50 transition-all font-black text-xs text-white active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-emerald-600/30">
                      {tabs.findIndex(t => t.id === activeTab) + 1}
                    </span>
                    <span>{tabs.find(t => t.id === activeTab)?.label}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isNavDropdownOpen ? "rotate-180 text-emerald-400" : ""}`} />
                </button>

                <AnimatePresence>
                  {isNavDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full mt-2 inset-x-0 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden divide-y divide-slate-800/80 z-50"
                    >
                      {tabs.map((tab, idx) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setIsNavDropdownOpen(false);
                          }}
                          className={`w-full p-4 text-start font-black text-xs transition-colors flex items-center justify-between ${
                            activeTab === tab.id
                              ? "bg-emerald-600/10 text-emerald-400"
                              : "hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              activeTab === tab.id ? "bg-emerald-500 text-slate-950" : "bg-slate-950 border border-slate-800 text-slate-400"
                            }`}>
                              {idx + 1}
                            </span>
                            <span>{tab.label}</span>
                          </div>
                          {activeTab === tab.id && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TAB 1: OVERVIEW & METRICS */}
              {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-black">{isAr ? "إجمالي اللاعبين" : "Total Players"}</span>
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{players.length}</div>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "مسجلين في هذا المجتمع" : "Registered in active community"}</p>
                    </div>

                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-black">{isAr ? "المهاجمون (FW)" : "Forwards (FW)"}</span>
                        <Target className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400">{positionCounts.FW}</div>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "مهاجمين ورأس حربة" : "Strikers & Wingers"}</p>
                    </div>

                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-black">{isAr ? "خط الوسط (MID)" : "Midfielders (MID)"}</span>
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-cyan-400">{positionCounts.MID}</div>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "صناع لعب ووسط دفاعي" : "Central & Defensive MIDs"}</p>
                    </div>

                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-black">{isAr ? "المدافعون وحراس" : "Defenders & GK"}</span>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400">{positionCounts.DEF + positionCounts.GK}</div>
                      <p className="text-[10px] text-slate-500 font-semibold">{isAr ? "مدافعين وحراس مرمى" : "CB, LB, RB & Goalkeepers"}</p>
                    </div>
                  </div>

                  {/* Position Distribution Mapped Bar */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      {isAr ? "توزيع المراكز التكتيكية بالمجتمع" : "Tactical Position Distribution"}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                          <span>{isAr ? "المهاجمون (FW)" : "Forwards (FW)"}</span>
                          <span>{positionCounts.FW} ({players.length ? Math.round((positionCounts.FW / players.length) * 100) : 0}%)</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${players.length ? (positionCounts.FW / players.length) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                          <span>{isAr ? "لاعبو الوسط (MID)" : "Midfielders (MID)"}</span>
                          <span>{positionCounts.MID} ({players.length ? Math.round((positionCounts.MID / players.length) * 100) : 0}%)</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${players.length ? (positionCounts.MID / players.length) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                          <span>{isAr ? "المدافعون (DEF)" : "Defenders (DEF)"}</span>
                          <span>{positionCounts.DEF} ({players.length ? Math.round((positionCounts.DEF / players.length) * 100) : 0}%)</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${players.length ? (positionCounts.DEF / players.length) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                          <span>{isAr ? "حراس المرمى (GK)" : "Goalkeepers (GK)"}</span>
                          <span>{positionCounts.GK} ({players.length ? Math.round((positionCounts.GK / players.length) * 100) : 0}%)</span>
                        </div>
                        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${players.length ? (positionCounts.GK / players.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: PLAYERS TABLE */}
              {activeTab === "players" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {loading ? (
                    <SiteSkeletonLoader variant="table" />
                  ) : (
                    <AdminTable players={players} onRefresh={refreshPlayers || (() => {})} />
                  )}
                </motion.div>
              )}

              {/* TAB 3: AI & BULK OPERATIONS */}
              {activeTab === "ai" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Apply AI to All */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-base font-black text-white">
                        {isAr ? "تطبيق AI للجميع" : "Apply AI to All"}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {isAr ? "تحديث التقييم وتحديد المراكز الثلاثة المناسبة تلقائياً لكل لاعب." : "Auto-assign top 3 positions and OVR for all players using AI stats calculations."}
                      </p>
                    </div>

                    <button
                      onClick={handleApplyAIToAll}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? "تطبيق الذكاء الاصطناعي" : "Apply AI Engine"}</span>
                    </button>
                  </div>

                  {/* Card 2: Lock All to Home Community */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                        <Lock className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h3 className="text-base font-black text-white">
                        {isAr ? "تثبيت المجتمع الرئيسي" : "Lock Home Community"}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {isAr ? `تثبيت جميع اللاعبين (${players.length}) لمجتمعك كمرجع رئيسي لبطاقاتهم.` : `Set active community as home community for all ${players.length} registered players.`}
                      </p>
                    </div>

                    <button
                      onClick={handleLockAllToHomeCommunity}
                      className="w-full py-3 px-4 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span>{isAr ? "تثبيت الجميع" : "Lock All Players"}</span>
                    </button>
                  </div>

                  {/* Card 3: Admin & Voting Tools */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="text-base font-black text-white">
                        {isAr ? "الصلاحيات والتصويتات" : "Permissions & Voting"}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {isAr ? "إعادة تعيين اصوات الكابتن أو تحديث صلاحية المشرف لحسابك." : "Reset community captain votes or sync admin authorization."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {(isOwner || players.length === 0) && (
                        <button
                          onClick={handleMakeMeAdmin}
                          className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {user && players.some(p => p.uid === user.uid)
                              ? (isAr ? "إلغاء صلاحيتي كمسؤول" : "Remove me as Admin")
                              : (isAr ? "مزامنة صلاحيتي كمسؤول" : "Sync Admin Permissions")}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={handleResetCaptainVotes}
                        className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 text-rose-400 hover:border-rose-500/50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <UserX className="w-4 h-4 text-rose-400" />
                        <span>{isAr ? "إعادة تعيين الأصوات" : "Reset Captain Votes"}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: PENDING APPROVALS */}
              {activeTab === "pending" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <PendingRequests />
                </motion.div>
              )}
            </>
          )}
        </main>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
        />
      </div>
    </ProtectedRoute>
  );
}
