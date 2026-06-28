"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, writeBatch, doc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Info, Loader2, Trophy, ArrowRight } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import toast from "react-hot-toast";

type NotificationType = "system" | "match" | "hint";

interface UserNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: any;
  link?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  
  const isAr = locale === "ar";

  useEffect(() => {
    if (!user) return;
    
    // Request notification permission for Web Notifications API
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
      
      // Check for new unread notifications and trigger Web Notification API
      if (snapshot.docChanges().length > 0) {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (!data.read && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(data.title, {
                body: data.body,
                icon: '/logo.jpg',
              });
            }
          }
        });
      }

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
      console.error("Error marking as read:", error);
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

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "match": return <Trophy className="w-5 h-5 text-amber-500" />;
      case "hint": return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-emerald-500" />;
    }
  };

  const filteredNotifs = filter === "all" ? notifications : notifications.filter(n => !n.read);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300 py-8 px-4 sm:px-6 md:px-8">
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
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
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

          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="mt-4 text-slate-500 font-medium">{isAr ? "جاري تحميل الإشعارات..." : "Loading notifications..."}</p>
              </div>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 sm:p-6 transition-colors ${!notif.read ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${!notif.read ? "bg-white dark:bg-slate-800 shadow-sm" : "bg-slate-100 dark:bg-slate-800"}`}>
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
                            <Link href={notif.link} className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                              {isAr ? "عرض التفاصيل" : "View Details"}
                              <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                            </Link>
                          )}
                        </div>
                        {!notif.read && (
                          <div className="flex-shrink-0 self-center">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
                          </div>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
