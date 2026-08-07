"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { db } from "@/lib/firebase";
import { writeBatch, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Info, Trophy, ChevronDown, Trash2, ArrowRight, Brain, RefreshCw, Sparkles, Shield, AlertCircle, Volume2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import toast from "react-hot-toast";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useNotifications, NotificationType, UserNotification } from "@/hooks/useNotifications";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { getPlayerOverall } from "@/lib/playerUtils";
import FormattedText from "@/components/ui/FormattedText";
import { cleanSingleLanguageText } from "@/lib/aiService";

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

  // Browser Push Permission State
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");

  // Pagination & Older Collapse State
  const [currentPage, setCurrentPage] = useState(1);
  const [isOlderExpanded, setIsOlderExpanded] = useState(true);
  const PAGE_SIZE = 10;

  // 11AI Tactical Alert State
  const [aiAlertLoading, setAiAlertLoading] = useState(false);

  const isAr = locale === "ar";

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission("unsupported");
    }
  }, []);

  const requestPushPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error(isAr ? "متصفحك لا يدعم إشعارات سطح المكتب" : "Browser does not support desktop notifications");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === "granted") {
        toast.success(isAr ? "تم تفعيل إشعارات المتصفح بنجاح! 🔔" : "Browser notifications enabled successfully! 🔔");
        new Notification("11Players Elite", {
          body: isAr ? "أهلاً بك! ستتلقى تنبيهات تكتيكية واستدعاءات المباريات فوراً." : "Welcome! You will receive tactical alerts and match call-ups instantly.",
          icon: "/icon.jpg",
        });
      } else if (perm === "denied") {
        toast.error(isAr ? "تم رفض الإذن. يمكنك تفعيله من إعدادات المتصفح." : "Permission denied. Enable it in browser site settings.");
      }
    } catch (e) {
      console.error("Error requesting notification permission:", e);
    }
  };

  // Instant & Reliable Mark Single as Read
  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      // 1. Instant local state update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

      // 2. Persist in localStorage
      const readIds: string[] = JSON.parse(localStorage.getItem("11players_read_notifs") || "[]");
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem("11players_read_notifs", JSON.stringify(readIds));
      }

      // 3. Background Firestore update for personal items
      const notif = notifications.find(n => n.id === id);
      if (notif && !id.startsWith("ann_notif_") && !notif.isTopLevel && !notif.isPublicBroadcast) {
        updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true }).catch(() => {});
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Instant & Reliable Mark All as Read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      // 1. Instant local state update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      // 2. Persist in localStorage
      const readIds: string[] = JSON.parse(localStorage.getItem("11players_read_notifs") || "[]");
      notifications.forEach((n) => {
        if (!readIds.includes(n.id)) readIds.push(n.id);
      });
      localStorage.setItem("11players_read_notifs", JSON.stringify(readIds));

      // 3. Background Firestore updates for unread personal items
      const unreadPersonal = notifications.filter((n) => !n.read && !n.id.startsWith("ann_notif_") && !n.isTopLevel && !n.isPublicBroadcast);
      if (unreadPersonal.length > 0) {
        const chunkSize = 400;
        for (let i = 0; i < unreadPersonal.length; i += chunkSize) {
          const batch = writeBatch(db);
          const chunk = unreadPersonal.slice(i, i + chunkSize);
          chunk.forEach((n) => {
            batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
          });
          await batch.commit();
        }
      }
      toast.success(isAr ? "تم تحديد جميع الإشعارات كمقروءة 🟢" : "All notifications marked as read 🟢");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const deletedIds: string[] = JSON.parse(localStorage.getItem("11players_deleted_notifs") || "[]");
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("11players_deleted_notifs", JSON.stringify(deletedIds));
      }
      const notif = notifications.find(n => n.id === id);
      if (notif && !id.startsWith("ann_notif_") && !notif.isTopLevel && !notif.isPublicBroadcast) {
        deleteDoc(doc(db, "users", user.uid, "notifications", id)).catch(() => {});
      }
      toast.success(isAr ? "تم حذف الإشعار" : "Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error(isAr ? "فشل حذف الإشعار" : "Failed to delete notification");
    }
  };

  const deleteAllNotifications = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("11players_deleted_notifs") || "[]");
      notifications.forEach((n) => {
        if (!deletedIds.includes(n.id)) deletedIds.push(n.id);
      });
      localStorage.setItem("11players_deleted_notifs", JSON.stringify(deletedIds));

      // Batch delete from Firestore to fix ghost dot in Sidebar
      const personalNotifs = notifications.filter((n) => !n.id.startsWith("ann_notif_"));
      if (personalNotifs.length > 0) {
        const chunkSize = 400;
        for (let i = 0; i < personalNotifs.length; i += chunkSize) {
          const batch = writeBatch(db);
          const chunk = personalNotifs.slice(i, i + chunkSize);
          chunk.forEach((n) => {
            batch.delete(doc(db, "users", user.uid, "notifications", n.id));
          });
          await batch.commit();
        }
      }

      setNotifications((prev) => prev.filter((n) => n.isPublicBroadcast));
      setConfirmDeleteAll(false);
      toast.success(isAr ? "تم مسح جميع التنبيهات بنجاح 🔔" : "All notifications cleared 🔔");
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast.error(isAr ? "فشل حذف الإشعارات" : "Failed to delete notifications");
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "match":
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case "hint":
      case "advices":
        return <Info className="w-5 h-5 text-cyan-400" />;
      case "admin":
      case "owner":
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case "updates":
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case "stats":
        return <Info className="w-5 h-5 text-purple-400" />;
      case "trophies":
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-400" />;
    }
  };

  const filteredNotifs = notifications.filter((n) => {
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

  filteredNotifs.forEach((n) => {
    const time = n.createdAt?.toDate ? n.createdAt.toDate().getTime() : new Date(n.createdAt || 0).getTime();
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
      <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 md:px-8" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-4xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <Bell className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <span>{isAr ? "مركز الإشعارات والتنبيهات" : "Notifications Center"}</span>
                </h1>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {isAr ? "ابق على اطلاع دائم بأحدث تحليلات 11AI وإشعارات المباريات" : "Stay updated with latest alerts, match updates, and 11AI insights"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={notifications.filter((n) => !n.read).length === 0}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow ${
                  notifications.filter((n) => !n.read).length === 0
                    ? "bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? "تحديد الكل كمقروء" : "Mark all read"}</span>
              </button>
              <button
                onClick={() => setConfirmDeleteAll(true)}
                disabled={notifications.length === 0}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow ${
                  notifications.length === 0
                    ? "bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-rose-950/80 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 cursor-pointer"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? "حذف الكل" : "Delete All"}</span>
              </button>
            </div>
          </div>

          {/* Browser Native Push Notification Permission Banner */}
          {pushPermission === "default" && (
            <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isAr ? "تفعيل إشعارات المتصفح الفورية 🔔" : "Enable Browser Push Notifications 🔔"}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {isAr
                      ? "احصل على التنبيهات التكتيكية وتذكيرات المباريات واستدعاءات القادة فوراً على جهازك."
                      : "Receive real-time tactical alerts, match reminders, and captain call-ups directly on your device."}
                  </p>
                </div>
              </div>
              <button
                onClick={requestPushPermission}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {isAr ? "السماح بالإشعارات" : "Allow Notifications"}
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-1 relative shadow-inner">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative px-5 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-2 z-10 cursor-pointer ${
                    filter === f ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {filter === f && (
                    <motion.div
                      layoutId="notifFilterPill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md -z-10"
                    />
                  )}
                  <span>{f === "all" ? (isAr ? "الكل" : "All") : (isAr ? "غير مقروء" : "Unread")}</span>
                  {f === "unread" && notifications.filter((n) => !n.read).length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full font-black">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px] z-20">
              <button
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm hover:border-emerald-500 transition-colors text-xs font-black text-slate-200 cursor-pointer"
              >
                <span>
                  {typeFilter === "all"
                    ? isAr
                      ? "جميع الأنواع"
                      : "All Types"
                    : typeFilter === "advices"
                    ? isAr
                      ? "نصائح تكتيكية"
                      : "Tactical Advices"
                    : typeFilter === "admin"
                    ? isAr
                      ? "المسؤول"
                      : "Admin"
                    : typeFilter === "owner"
                    ? isAr
                      ? "المالك"
                      : "Owner"
                    : typeFilter === "updates"
                    ? isAr
                      ? "تحديثات"
                      : "Updates"
                    : typeFilter === "stats"
                    ? isAr
                      ? "طلب قدرات"
                      : "Stats Requests"
                    : typeFilter === "trophies"
                    ? isAr
                      ? "ألقاب وجوائز"
                      : "Trophies"
                    : ""}
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
                    className={`absolute z-30 top-full mt-2 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${
                      isAr ? "right-0" : "left-0"
                    }`}
                  >
                    {(["all", "advices", "admin", "owner", "updates", "stats", "trophies"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTypeFilter(t as NotificationType | "all");
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`block w-full text-start px-4 py-2.5 hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer ${
                          typeFilter === t ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300"
                        }`}
                      >
                        {t === "all"
                          ? isAr
                            ? "جميع الأنواع"
                            : "All Types"
                          : t === "advices"
                          ? isAr
                            ? "نصائح تكتيكية"
                            : "Tactical Advices"
                          : t === "admin"
                          ? isAr
                            ? "المسؤول"
                            : "Admin"
                          : t === "owner"
                          ? isAr
                            ? "المالك"
                            : "Owner"
                          : t === "updates"
                          ? isAr
                            ? "تحديثات"
                            : "Updates"
                          : t === "stats"
                          ? isAr
                            ? "طلب قدرات"
                            : "Stats Requests"
                          : t === "trophies"
                          ? isAr
                            ? "ألقاب وجوائز"
                            : "Trophies"
                          : ""}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Main List Container (Fixed Clean Flex Layout) */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl min-h-[300px] flex flex-col justify-start">
            {filteredNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4 my-auto">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500 shadow-inner">
                  <Bell className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-white mb-1">
                  {isAr ? "لا توجد إشعارات غير مقروءة" : "No unread notifications"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {isAr ? "جميع إشعاراتك مقروءة ومحدثة بالكامل." : "All your notifications are read and up to date."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col w-full divide-y divide-slate-800/80">
                {/* Section 1: Today */}
                {todayNotifs.length > 0 && (
                  <div className="w-full">
                    <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAr ? "اليوم" : "Today"}</span>
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
                        {todayNotifs.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-800/60 w-full">
                      {todayNotifs.map((notif) => renderNotifItem(notif))}
                    </ul>
                  </div>
                )}

                {/* Section 2: Yesterday */}
                {yesterdayNotifs.length > 0 && (
                  <div className="w-full">
                    <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? "أمس" : "Yesterday"}</span>
                      <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px]">
                        {yesterdayNotifs.length}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-800/60 w-full">
                      {yesterdayNotifs.map((notif) => renderNotifItem(notif))}
                    </ul>
                  </div>
                )}

                {/* Section 3: Older */}
                {olderNotifs.length > 0 && (
                  <div className="w-full">
                    <button
                      type="button"
                      onClick={() => setIsOlderExpanded(!isOlderExpanded)}
                      className="w-full px-6 py-2.5 bg-slate-950 hover:bg-slate-900 border-b border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isAr ? "إشعارات أقوم / قديمة" : "Older Notifications"}</span>
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                          {olderNotifs.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                        <span>{isOlderExpanded ? (isAr ? "طي الإشعارات" : "Collapse") : isAr ? "توسيع الإشعارات" : "Expand"}</span>
                        <motion.div animate={{ rotate: isOlderExpanded ? 180 : 0 }}>
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </button>

                    {isOlderExpanded && (
                      <ul className="divide-y divide-slate-800/60 w-full">
                        {olderNotifs.map((notif) => renderNotifItem(notif))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 10-Item Pagination Controls Bar */}
          {filteredNotifs.length > PAGE_SIZE && (
            <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer"
              >
                {isAr ? "← السابقة" : "← Previous"}
              </button>

              <span className="text-xs font-black text-slate-400">
                {isAr
                  ? `صفحة ${currentPage} من ${Math.ceil(filteredNotifs.length / PAGE_SIZE)}`
                  : `Page ${currentPage} of ${Math.ceil(filteredNotifs.length / PAGE_SIZE)}`}
              </span>

              <button
                type="button"
                disabled={currentPage >= Math.ceil(filteredNotifs.length / PAGE_SIZE)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer"
              >
                {isAr ? "التالية →" : "Next →"}
              </button>
            </div>
          )}

          {/* Confirm Delete All Modal */}
          <ConfirmModal
            isOpen={confirmDeleteAll}
            onClose={() => setConfirmDeleteAll(false)}
            onConfirm={deleteAllNotifications}
            title={isAr ? "حذف جميع الإشعارات" : "Delete All Notifications"}
            message={
              isAr
                ? "هل أنت متأكد من رغبتك في حذف جميع الإشعارات؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete all notifications? This action cannot be undone."
            }
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
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                  onClick={() => setSelectedNotif(null)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="relative bg-slate-900 p-6 md:p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-800 max-h-[90vh] flex flex-col z-10"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm text-2xl">
                      {getIconForType(selectedNotif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h2 className="text-lg font-black text-white leading-tight">
                        {cleanSingleLanguageText(
                          isAr ? selectedNotif.titleAr || selectedNotif.title : selectedNotif.titleEn || selectedNotif.title,
                          isAr ? "ar" : "en"
                        )}
                      </h2>
                      <div className="text-xs font-bold text-slate-400 mt-1">
                        {selectedNotif.createdAt?.toDate
                          ? new Date(selectedNotif.createdAt.toDate()).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                      <FormattedText
                        content={cleanSingleLanguageText(
                          isAr ? selectedNotif.bodyAr || selectedNotif.body : selectedNotif.bodyEn || selectedNotif.body,
                          isAr ? "ar" : "en"
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedNotif(null)}
                      className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                    >
                      {isAr ? "إغلاق" : "Close"}
                    </button>
                    {selectedNotif.link && (
                      <Link
                        href={selectedNotif.link}
                        onClick={() => setSelectedNotif(null)}
                        className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          selectedNotif.link.includes("/support")
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                        }`}
                      >
                        {selectedNotif.link.includes("/support")
                          ? isAr
                            ? "⚖️ فتح تذكرة التماس"
                            : "⚖️ Open Appeal Ticket"
                          : isAr
                          ? "عرض التفاصيل الكاملة"
                          : "View Full Details"}
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
      <li
        key={notif.id}
        className={`p-4 sm:p-5 transition-all duration-200 cursor-pointer w-full ${
          !notif.read ? "bg-emerald-950/20 border-s-4 border-emerald-500" : "hover:bg-slate-800/40"
        }`}
        onClick={() => {
          if (!notif.read) markAsRead(notif.id);
          setSelectedNotif(notif);
        }}
      >
        <div className="flex items-start gap-3.5 w-full">
          <div
            className={`mt-0.5 w-9 h-9 flex items-center justify-center shrink-0 rounded-2xl border ${
              !notif.read ? "bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-500/10" : "bg-slate-950 border-slate-800"
            }`}
          >
            {getIconForType(notif.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <h4 className={`text-xs sm:text-sm font-bold line-clamp-2 ${!notif.read ? "text-white" : "text-slate-300"}`}>
                {cleanSingleLanguageText(isAr ? notif.titleAr || notif.title : notif.titleEn || notif.title, isAr ? "ar" : "en")}
              </h4>
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap sm:mt-0.5">
                {notif.createdAt?.toDate
                  ? new Date(notif.createdAt.toDate()).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
            <div className={`text-xs line-clamp-2 ${!notif.read ? "text-slate-300 font-medium" : "text-slate-400"}`}>
              <FormattedText content={cleanSingleLanguageText(isAr ? notif.bodyAr || notif.body : notif.bodyEn || notif.body, isAr ? "ar" : "en")} />
            </div>
            {notif.link && (
              <Link
                href={notif.link}
                className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer ${
                  notif.link.includes("/support")
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                {notif.link.includes("/support")
                  ? isAr
                    ? "⚖️ تقديم التماس في الدعم الفني"
                    : "⚖️ Make an Appeal in Support"
                  : isAr
                  ? "عرض التفاصيل"
                  : "View Details"}
                <ArrowRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
              </Link>
            )}
          </div>
          {!notif.read && (
            <div className="flex-shrink-0 self-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
          <div className="flex-shrink-0 self-center">
            <button
              type="button"
              onClick={(e) => deleteNotification(notif.id, e)}
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title={isAr ? "حذف الإشعار" : "Delete notification"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </li>
    );
  }
}
