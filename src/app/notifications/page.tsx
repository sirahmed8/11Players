"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { db } from "@/lib/firebase";
import { writeBatch, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Info, Trophy, ChevronDown, Trash2, ArrowRight, Brain, RefreshCw, Sparkles, Shield, AlertCircle } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import toast from "react-hot-toast";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useNotifications, NotificationType, UserNotification } from "@/hooks/useNotifications";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { getPlayerOverall } from "@/lib/playerUtils";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { userProfile: profile } = useAuthProfile(user);
  const { locale } = useLocale();
  const { notifications, setNotifications, loading } = useNotifications(user);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<UserNotification | null>(null);

  // 11AI Tactical Alert State
  const [aiAlert, setAiAlert] = useState<{ title: string; message: string } | null>(null);
  const [aiAlertLoading, setAiAlertLoading] = useState(false);

  const isAr = locale === "ar";

  const todayKey = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  const alertStorageKey = `11players_ai_notif_alert_${todayKey}_${user?.uid || 'guest'}`;
  const [remainingAlertUses, setRemainingAlertUses] = useState<number>(3);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const used = parseInt(localStorage.getItem(alertStorageKey) || "0", 10);
    setRemainingAlertUses(Math.max(0, 3 - used));
  }, [alertStorageKey]);

  // Fetch 11AI Tactical Alert
  const fetchAiAlert = async (isManual = false) => {
    if (isManual && remainingAlertUses <= 0) {
      toast.error(isAr ? "🔒 استنفذت محاولات التحديث اليومية الثلاث (عد غداً)" : "🔒 Daily 3/3 refresh limit reached (Return tomorrow)");
      return;
    }
    setAiAlertLoading(true);
    try {
      const playerContext = {
        fullName: profile?.fullName || user?.displayName || "Player",
        overall: profile ? getPlayerOverall(profile) : 72,
        primaryPosition: profile?.primaryPosition || "Midfielder",
        goals: profile?.stats?.goals || 0,
        playStyle: profile?.playStyle || "Standard",
      };

      const res = await fetch("/api/ai/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerContext }),
      });

      const data = await res.json();
      if (data.message) {
        setAiAlert({ title: data.title, message: data.message });
        if (isManual) {
          const used = parseInt(localStorage.getItem(alertStorageKey) || "0", 10) + 1;
          localStorage.setItem(alertStorageKey, used.toString());
          setRemainingAlertUses(Math.max(0, 3 - used));
        }
      }
    } catch (err) {
      console.warn("11AI notification error:", err);
    } finally {
      setAiAlertLoading(false);
    }
  };

  useEffect(() => {
    fetchAiAlert(false);
  }, [profile]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('11players_deleted_notifs', JSON.stringify(deletedIds));
      }
      await deleteDoc(doc(db, "users", user.uid, "notifications", id));
      toast.success(isAr ? "تم حذف الإشعار" : "Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error(isAr ? "فشل حذف الإشعار" : "Failed to delete notification");
    }
  };

  // Chunked batch operation to prevent 500-document batch limits crash (Bug #20 fix)
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const unreadList = notifications.filter(n => !n.read);
      const chunkSize = 450;
      for (let i = 0; i < unreadList.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = unreadList.slice(i, i + chunkSize);
        chunk.forEach(n => {
          batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
        });
        await batch.commit();
      }
      toast.success(isAr ? "تم تحديد الكل كمقروء" : "All marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const chunkSize = 450;
      const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
      for (let i = 0; i < notifications.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = notifications.slice(i, i + chunkSize);
        chunk.forEach(n => {
          batch.delete(doc(db, "users", user.uid, "notifications", n.id));
          if (!deletedIds.includes(n.id)) deletedIds.push(n.id);
        });
        await batch.commit();
      }
      localStorage.setItem('11players_deleted_notifs', JSON.stringify(deletedIds));
      setNotifications([]);
      setConfirmDeleteAll(false);
      toast.success(isAr ? "تم حذف جميع الإشعارات بنجاح" : "All notifications deleted");
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      toast.error(isAr ? "فشل حذف الإشعارات" : "Failed to delete notifications");
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "match": return <Trophy className="w-5 h-5 text-amber-400" />;
      case "hint":
      case "advices": return <Info className="w-5 h-5 text-cyan-400" />;
      case "admin":
      case "owner": return <Shield className="w-5 h-5 text-emerald-400" />;
      case "updates": return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case "stats": return <Info className="w-5 h-5 text-purple-400" />;
      case "trophies": return <Trophy className="w-5 h-5 text-yellow-400" />;
      default: return <Bell className="w-5 h-5 text-emerald-400" />;
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === "unread" && n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  // Date Grouping logic
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const todayNotifs: UserNotification[] = [];
  const yesterdayNotifs: UserNotification[] = [];
  const olderNotifs: UserNotification[] = [];

  filteredNotifs.forEach(n => {
    const time = n.createdAt?.toDate ? n.createdAt.toDate().getTime() : Date.now();
    if (time >= todayStart) {
      todayNotifs.push(n);
    } else if (time >= yesterdayStart) {
      yesterdayNotifs.push(n);
    } else {
      olderNotifs.push(n);
    }
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
          <SiteSkeletonLoader variant="list" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-white transition-colors duration-300 py-8 px-4 sm:px-6 md:px-8" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-4xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <Bell className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <span>{isAr ? "مركز الإشعارات والتنبيهات" : "Notifications Center"}</span>
                </h1>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {isAr ? "ابق على اطلاع دائم بأحدث التحليلات الإشعارات والمباريات" : "Stay updated with latest alerts, match updates, and 11AI insights"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={notifications.filter(n => !n.read).length === 0}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow ${notifications.filter(n => !n.read).length === 0 ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? "تحديد الكل كمقروء" : "Mark all read"}</span>
              </button>
              <button
                onClick={() => setConfirmDeleteAll(true)}
                disabled={notifications.length === 0}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow ${notifications.length === 0 ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed" : "bg-rose-950/80 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60"}`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? "حذف الكل" : "Delete All"}</span>
              </button>
            </div>
          </div>

          {/* 11AI Smart Tactical Notification Hero Card — Solid Dark Slate */}
          {aiAlert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
            >
              <div className="flex items-start gap-3.5 relative z-10 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{aiAlert.title}</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      {isAr ? `متبقي ${remainingAlertUses}/3 اليوم` : `${remainingAlertUses}/3 left today`}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-relaxed">
                    {aiAlert.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchAiAlert(true)}
                disabled={remainingAlertUses <= 0 || aiAlertLoading}
                className={`p-2.5 rounded-2xl border transition-all shrink-0 self-end sm:self-center flex items-center gap-1.5 font-bold text-xs ${
                  remainingAlertUses > 0
                    ? "bg-slate-950 border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed"
                }`}
                title={isAr ? `تحديث التنبيه التكتيكي (متبقي ${remainingAlertUses}/3 اليوم)` : `Refresh Alert (${remainingAlertUses}/3 left today)`}
              >
                <RefreshCw className={`w-4 h-4 ${aiAlertLoading ? "animate-spin text-emerald-400" : ""}`} />
                <span className="text-[10px] font-black">{remainingAlertUses}/3</span>
              </button>
            </motion.div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${filter === "all" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"}`}
              >
                {isAr ? "الكل" : "All"}
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${filter === "unread" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"}`}
              >
                <span>{isAr ? "غير مقروء" : "Unread"}</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full font-black">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>

            <div className="relative min-w-[200px] z-20">
              <button
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm hover:border-emerald-500 transition-colors text-xs font-black text-slate-200"
              >
                <span>
                  {typeFilter === "all" ? (isAr ? "جميع الأنواع" : "All Types") :
                   typeFilter === "advices" ? (isAr ? "نصائح تكتيكية" : "Tactical Advices") :
                   typeFilter === "admin" ? (isAr ? "المسؤول" : "Admin") :
                   typeFilter === "owner" ? (isAr ? "المالك" : "Owner") :
                   typeFilter === "updates" ? (isAr ? "تحديثات" : "Updates") :
                   typeFilter === "stats" ? (isAr ? "طلبات القدرات" : "Stats Requests") :
                   typeFilter === "trophies" ? (isAr ? "ألقاب وجوائز" : "Trophies") : ""}
                </span>
                <motion.div animate={{ rotate: isTypeDropdownOpen ? 180 : 0 }}>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute z-30 top-full mt-2 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${isAr ? "right-0" : "left-0"}`}
                  >
                    {(["all", "advices", "admin", "owner", "updates", "stats", "trophies"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTypeFilter(t as NotificationType | "all"); setIsTypeDropdownOpen(false); }}
                        className={`block w-full text-start px-4 py-2.5 hover:bg-slate-800 font-bold text-xs transition-colors ${typeFilter === t ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300"}`}
                      >
                        {t === "all" ? (isAr ? "جميع الأنواع" : "All Types") :
                         t === "advices" ? (isAr ? "نصائح تكتيكية" : "Tactical Advices") :
                         t === "admin" ? (isAr ? "المسؤول" : "Admin") :
                         t === "owner" ? (isAr ? "المالك" : "Owner") :
                         t === "updates" ? (isAr ? "تحديثات" : "Updates") :
                         t === "stats" ? (isAr ? "طلبات القدرات" : "Stats Requests") :
                         t === "trophies" ? (isAr ? "ألقاب وجوائز" : "Trophies") : ""}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Main List Container */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            {loading ? (
              <SiteSkeletonLoader variant="list" />
            ) : filteredNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500 shadow-inner">
                  <Bell className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-white mb-1">
                  {isAr ? "لا توجد إشعارات حالياً" : "No notifications yet"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {isAr ? "سنقوم بإعلامك فور وصول تحديثات جديدة." : "We'll notify you when there's something new."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {/* Section 1: Today */}
                {todayNotifs.length > 0 && (
                  <div>
                    <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAr ? "اليوم" : "Today"}</span>
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
                        {todayNotifs.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-800/60">
                      <AnimatePresence>
                        {todayNotifs.map(notif => renderNotifItem(notif))}
                      </AnimatePresence>
                    </ul>
                  </div>
                )}

                {/* Section 2: Yesterday */}
                {yesterdayNotifs.length > 0 && (
                  <div>
                    <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? "أمس" : "Yesterday"}</span>
                      <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px]">
                        {yesterdayNotifs.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-800/60">
                      <AnimatePresence>
                        {yesterdayNotifs.map(notif => renderNotifItem(notif))}
                      </AnimatePresence>
                    </ul>
                  </div>
                )}

                {/* Section 3: Older */}
                {olderNotifs.length > 0 && (
                  <div>
                    <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? "سابقاً" : "Older"}</span>
                      <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                        {olderNotifs.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-800/60">
                      <AnimatePresence>
                        {olderNotifs.map(notif => renderNotifItem(notif))}
                      </AnimatePresence>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Delete All Modal */}
          <ConfirmModal
            isOpen={confirmDeleteAll}
            onClose={() => setConfirmDeleteAll(false)}
            onConfirm={deleteAllNotifications}
            title={isAr ? "حذف جميع الإشعارات" : "Delete All Notifications"}
            message={isAr ? "هل أنت متأكد من رغبتك في حذف جميع الإشعارات؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete all notifications? This action cannot be undone."}
            isDestructive={true}
          />

          {/* Notification Details Modal */}
          <AnimatePresence>
            {selectedNotif && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                  onClick={() => setSelectedNotif(null)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="relative bg-slate-900 p-6 md:p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-800 max-h-[90vh] flex flex-col z-10"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm text-2xl">
                      {getIconForType(selectedNotif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h2 className="text-lg font-black text-white leading-tight">
                        {isAr ? (selectedNotif.titleAr || selectedNotif.title) : (selectedNotif.titleEn || selectedNotif.title)}
                      </h2>
                      <div className="text-xs font-bold text-slate-400 mt-1">
                        {selectedNotif.createdAt?.toDate ? new Date(selectedNotif.createdAt.toDate()).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                    <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                        {isAr ? (selectedNotif.bodyAr || selectedNotif.body) : (selectedNotif.bodyEn || selectedNotif.body)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedNotif(null)}
                      className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
                    >
                      {isAr ? "إغلاق" : "Close"}
                    </button>
                    {selectedNotif.link && (
                      <Link
                        href={selectedNotif.link}
                        onClick={() => setSelectedNotif(null)}
                        className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs text-center transition-all flex items-center justify-center gap-2 ${
                          selectedNotif.link.includes('/support')
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        }`}
                      >
                        {selectedNotif.link.includes('/support')
                          ? (isAr ? "⚖️ فتح تذكرة التماس" : "⚖️ Open Appeal Ticket")
                          : (isAr ? "عرض التفاصيل الكاملة" : "View Full Details")}
                        <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                      </Link>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ProtectedRoute>
  );

  function renderNotifItem(notif: UserNotification) {
    return (
      <motion.li
        key={notif.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -30, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`p-4 sm:p-5 transition-colors cursor-pointer ${!notif.read ? "bg-emerald-950/20" : "hover:bg-slate-800/40"}`}
        onClick={() => {
          if (!notif.read) markAsRead(notif.id);
          setSelectedNotif(notif);
        }}
      >
        <div className="flex items-start gap-3.5">
          <div className={`mt-0.5 w-9 h-9 flex items-center justify-center shrink-0 rounded-2xl border ${!notif.read ? "bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-500/10" : "bg-slate-950 border-slate-800"}`}>
            {getIconForType(notif.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <h4 className={`text-xs sm:text-sm font-bold line-clamp-2 ${!notif.read ? "text-white" : "text-slate-300"}`}>
                {isAr ? (notif.titleAr || notif.title) : (notif.titleEn || notif.title)}
              </h4>
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap sm:mt-0.5">
                {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            <p className={`text-xs line-clamp-2 ${!notif.read ? "text-slate-300 font-medium" : "text-slate-400"}`}>
              {isAr ? (notif.bodyAr || notif.body) : (notif.bodyEn || notif.body)}
            </p>
            {notif.link && (
              <Link
                href={notif.link}
                className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-xl text-xs font-black transition-all shadow-sm ${
                  notif.link.includes('/support')
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                {notif.link.includes('/support')
                  ? (isAr ? "⚖️ تقديم التماس في الدعم الفني" : "⚖️ Make an Appeal in Support")
                  : (isAr ? "عرض التفاصيل" : "View Details")}
                <ArrowRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
              </Link>
            )}
          </div>
          {!notif.read && (
            <div className="flex-shrink-0 self-center">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50 animate-pulse" />
            </div>
          )}
          <div className="flex-shrink-0 self-center">
            <button
              type="button"
              onClick={(e) => deleteNotification(notif.id, e)}
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
              title={isAr ? "حذف الإشعار" : "Delete notification"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.li>
    );
  }
}
