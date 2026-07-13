"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, writeBatch, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Info, Loader2, Trophy, ArrowRight, ChevronDown, Trash2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import toast from "react-hot-toast";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import ConfirmModal from "@/components/ConfirmModal";

type NotificationType = "system" | "match" | "hint" | "advices" | "admin" | "owner" | "updates" | "stats" | "trophies";

interface UserNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: any;
  type: NotificationType;
  link?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  
  const isAr = locale === "ar";

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
        notifs = notifs.filter(n => !deletedIds.includes(n.id));
      } catch (e) {}
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error loading notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.read) {
          batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
        }
      });
      await batch.commit();
      toast.success(isAr ? "تم تحديد الكل كمقروء" : "All marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
      notifications.forEach(n => {
        batch.delete(doc(db, "users", user.uid, "notifications", n.id));
        if (!deletedIds.includes(n.id)) deletedIds.push(n.id);
      });
      localStorage.setItem('11players_deleted_notifs', JSON.stringify(deletedIds));
      await batch.commit();
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
      case "match": return <Trophy className="w-5 h-5 text-amber-500" />;
      case "hint":
      case "advices": return <Info className="w-5 h-5 text-blue-500" />;
      case "admin":
      case "owner": return <CheckCircle2 className="w-5 h-5 text-indigo-500" />;
      case "updates": return <Bell className="w-5 h-5 text-emerald-500" />;
      case "stats": return <Info className="w-5 h-5 text-purple-500" />;
      case "trophies": return <Trophy className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-emerald-500" />;
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === "unread" && n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-8 px-4 sm:px-6 md:px-8">
        <main className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {isAr ? "الإشعارات" : "Notifications"}
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  {isAr ? "ابق على اطلاع بآخر التحديثات" : "Stay updated with the latest alerts"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={notifications.filter(n => !n.read).length === 0}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${notifications.filter(n => !n.read).length === 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed" : "bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
              </button>
              <button
                onClick={() => setConfirmDeleteAll(true)}
                disabled={notifications.length === 0}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${notifications.length === 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed" : "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300"}`}
              >
                <Trash2 className="w-4 h-4" />
                {isAr ? "حذف الكل" : "Delete All"}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "all" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              >
                {isAr ? "الكل" : "All"}
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "unread" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              >
                {isAr ? "غير مقروء" : "Unread"}
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="relative min-w-[200px] z-20">
              <button 
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl shadow-sm hover:border-emerald-500 transition-colors focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
              >
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {typeFilter === "all" ? (isAr ? "جميع الأنواع" : "All Types") :
                   typeFilter === "advices" ? (isAr ? "نصائح" : "Advices") :
                   typeFilter === "admin" ? (isAr ? "المسؤول" : "Admin") :
                   typeFilter === "owner" ? (isAr ? "المالك" : "Owner") :
                   typeFilter === "updates" ? (isAr ? "تحديثات" : "Updates") :
                   typeFilter === "stats" ? (isAr ? "طلبات تحديث القدرات" : "Stats Update Requests") :
                   typeFilter === "trophies" ? (isAr ? "ألقاب" : "Trophies") : ""}
                </span>
                <motion.div animate={{ rotate: isTypeDropdownOpen ? 180 : 0 }}>
                  <ChevronDown className="w-5 h-5 text-slate-500" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute z-30 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden ${isAr ? "right-0" : "left-0"}`}
                  >
                    {(["all", "advices", "admin", "owner", "updates", "stats", "trophies"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTypeFilter(t as NotificationType | "all"); setIsTypeDropdownOpen(false); }}
                        className={`block w-full text-start px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors ${typeFilter === t ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        {t === "all" ? (isAr ? "جميع الأنواع" : "All Types") :
                         t === "advices" ? (isAr ? "نصائح" : "Advices") :
                         t === "admin" ? (isAr ? "المسؤول" : "Admin") :
                         t === "owner" ? (isAr ? "المالك" : "Owner") :
                         t === "updates" ? (isAr ? "تحديثات" : "Updates") :
                         t === "stats" ? (isAr ? "طلبات تحديث القدرات" : "Stats Update Requests") :
                         t === "trophies" ? (isAr ? "ألقاب" : "Trophies") : ""}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            {loading ? (
              <SiteSkeletonLoader variant="list" />
            ) : filteredNotifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {isAr ? "لا توجد إشعارات" : "No notifications yet"}
                </h3>
                <p className="text-slate-500">
                  {isAr ? "سنقوم بإعلامك عند وجود تحديثات جديدة." : "We'll notify you when there's something new."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <AnimatePresence>
                  {filteredNotifs.map(notif => (
                    <motion.li
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -30, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 sm:p-6 transition-colors overflow-hidden ${!notif.read ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 w-10 h-10 flex items-center justify-center shrink-0 rounded-full aspect-square ${!notif.read ? "bg-white dark:bg-slate-800 shadow-sm" : "bg-slate-100 dark:bg-slate-800"}`}>
                          {getIconForType(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h4 className={`text-base font-bold truncate ${!notif.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                              {notif.title}
                            </h4>
                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                              {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className={`text-sm ${!notif.read ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                            {notif.body}
                          </p>
                          {notif.link && (
                            <Link
                              href={notif.link}
                              className={`inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-xl text-sm font-black transition-all shadow-sm ${
                                notif.link.includes('/support')
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                              }`}
                            >
                              {notif.link.includes('/support')
                                ? (isAr ? "⚖️ تقديم التماس في الدعم الفني" : "⚖️ Make an Appeal in Support")
                                : (isAr ? "عرض التفاصيل" : "View Details")}
                              <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                            </Link>
                          )}
                        </div>
                        {!notif.read && (
                          <div className="flex-shrink-0 self-center mr-3 rtl:mr-0 rtl:ml-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
                          </div>
                        )}
                        <div className="flex-shrink-0 self-center">
                          <button
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                            title={isAr ? "حذف الإشعار" : "Delete notification"}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
          <ConfirmModal
            isOpen={confirmDeleteAll}
            onClose={() => setConfirmDeleteAll(false)}
            onConfirm={deleteAllNotifications}
            title={isAr ? "حذف جميع الإشعارات" : "Delete All Notifications"}
            message={isAr ? "هل أنت متأكد من رغبتك في حذف جميع الإشعارات؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete all notifications? This action cannot be undone."}
            isDestructive={true}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}
