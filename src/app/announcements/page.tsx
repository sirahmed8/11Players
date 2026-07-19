"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { Bell, Send, Trash2, AlertTriangle, ShieldCheck, Globe, Users, Link as LinkIcon, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CustomDropdown from "@/components/CustomDropdown";

export interface Announcement {
  id: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  priority: 'normal' | 'urgent';
  targetScope: 'active_community' | 'global_all_users';
  link?: string;
  senderUid: string;
  senderName: string;
  communityId?: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [priority, setPriority] = useState<'normal' | 'urgent'>("normal");
  const [targetScope, setTargetScope] = useState<'active_community' | 'global_all_users'>("active_community");
  const [link, setLink] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const q = collection(db, "announcements");
    const unsub = onSnapshot(q, (snap) => {
      const list: Announcement[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Announcement));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRecentAnnouncements(list);
      setLoadingHistory(false);
    }, (err) => {
      console.error("Announcements query error:", err);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !titleAr.trim() || !bodyEn.trim() || !bodyAr.trim()) {
      toast.error(isAr ? "يرجى تعبئة جميع الحقول باللغتين العربية والإنجليزية" : "Please fill in all title and body fields in both languages");
      return;
    }
    if (targetScope === 'active_community' && !activeCommunityId) {
      toast.error(isAr ? "يرجى اختيار مجتمع نشط أولاً قبل البث الخاص بالمجتمع" : "Please select an active community before broadcasting to a community");
      return;
    }

    setBroadcasting(true);
    try {
      const annId = `ann_${Date.now()}`;
      const announcementData: Announcement = {
        id: annId,
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        bodyEn: bodyEn.trim(),
        bodyAr: bodyAr.trim(),
        priority,
        targetScope,
        link: link.trim() || undefined,
        senderUid: user?.uid || "",
        senderName: user?.displayName || (isAr ? "المسؤول" : "Admin"),
        communityId: targetScope === 'active_community' ? activeCommunityId || "" : "global",
        createdAt: new Date().toISOString()
      };

      // 1. Save to global announcements collection
      await setDoc(doc(db, "announcements", annId), announcementData);

      // 2. Deliver to users/{uid}/notifications
      let targetUids: string[] = [];
      if (targetScope === 'active_community' && activeCommunityId) {
        const snap = await getDocs(collection(db, "communities", activeCommunityId, "players"));
        snap.forEach(d => targetUids.push(d.id));
      } else if (targetScope === 'global_all_users' && isOwner) {
        const snap = await getDocs(collection(db, "users"));
        snap.forEach(d => targetUids.push(d.id));
      }

      // Batch send notifications (up to 500 per batch in firestore, chunking if needed)
      const chunkSize = 400;
      for (let i = 0; i < targetUids.length; i += chunkSize) {
        const chunk = targetUids.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (recipientUid) => {
          const notifId = `broadcast_${annId}`;
          const notifPayload = {
            id: notifId,
            type: priority === 'urgent' ? 'admin' : 'updates',
            title: titleEn.trim(),
            titleAr: titleAr.trim(),
            titleEn: titleEn.trim(),
            body: bodyEn.trim(),
            bodyAr: bodyAr.trim(),
            bodyEn: bodyEn.trim(),
            read: false,
            createdAt: serverTimestamp(),
            link: link.trim() || undefined
          };
          return setDoc(doc(db, "users", recipientUid, "notifications", notifId), notifPayload, { merge: true });
        }));
      }

      toast.success(isAr ? `تم بث الإعلان بنجاح إلى ${targetUids.length} مستخدم!` : `Successfully broadcasted to ${targetUids.length} users!`);
      setTitleEn("");
      setTitleAr("");
      setBodyEn("");
      setBodyAr("");
      setLink("");
    } catch (err) {
      console.error("Failed broadcasting:", err);
      toast.error(isAr ? "فشل بث الإشعار" : "Failed to broadcast notification");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success(isAr ? "تم حذف الإعلان" : "Announcement deleted");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل الحذف" : "Delete failed");
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 transition-colors" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/80 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">
                📢
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-2">
                  ⚡ {isAr ? "مركز البث المباشر والإعلانات" : "Bilingual Push Broadcast Center"}
                </span>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {isAr ? "بث الإشعارات والإعلانات المزدوجة" : "Broadcast Push Notifications & Announcements"}
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  {isAr ? "أرسل إشعارات فورية وإعلانات ثنائية اللغة لجميع اللاعبين في مجتمعك أو لكامل التطبيق" : "Deliver bilingual real-time push notifications and feed banners instantly to your community players."}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Broadcast Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleBroadcast}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6"
          >
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Bell className="w-6 h-6 text-amber-500" />
              <span>{isAr ? "إنشاء إعلان أو إشعار جديد" : "Create New Broadcast Notification"}</span>
            </h2>

            {/* Scope & Priority Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                  {isAr ? "نطاق المستهدفين بالبث (Target Scope)" : "Target Audience Scope"}
                </label>
                <CustomDropdown
                  value={targetScope}
                  onChange={(val) => setTargetScope(val as any)}
                  isAr={isAr}
                  options={[
                    {
                      value: "active_community",
                      label: isAr ? `👥 لاعبو المجتمع الحالي (${activeCommunity?.name || 'النشط'})` : `👥 Active Community Players (${activeCommunity?.name || 'Active'})`
                    },
                    ...(isOwner ? [{
                      value: "global_all_users",
                      label: isAr ? "🌍 جميع مستخدمي المنصة (Global Broadcast - Owner Only)" : "🌍 Global Platform Users (All Members)"
                    }] : [])
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                  {isAr ? "أولوية الإشعار (Priority Level)" : "Notification Priority"}
                </label>
                <CustomDropdown
                  value={priority}
                  onChange={(val) => setPriority(val as any)}
                  isAr={isAr}
                  options={[
                    { value: "normal", label: isAr ? "ℹ️ إشعار عادي (Normal Update)" : "ℹ️ Normal Update" },
                    { value: "urgent", label: isAr ? "🚨 إشعار عاجل ومهم (Urgent Priority)" : "🚨 Urgent Priority Alert" }
                  ]}
                />
              </div>
            </div>

            {/* Titles Grid (English + Arabic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  🇺🇸 {isAr ? "عنوان الإشعار بالإنجليزية (English Title)" : "English Title"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next Match Sign-Up Open!"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  🇸🇦 {isAr ? "عنوان الإشعار بالعربية (Arabic Title)" : "Arabic Title"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فتح باب التسجيل للمباراة القادمة!"
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
              </div>
            </div>

            {/* Bodies Grid (English + Arabic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  🇺🇸 {isAr ? "نص الرسالة بالإنجليزية (English Message Body)" : "English Message Body"} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message description here in English..."
                  value={bodyEn}
                  onChange={e => setBodyEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  🇸🇦 {isAr ? "نص الرسالة بالعربية (Arabic Message Body)" : "Arabic Message Body"} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب تفاصيل ومحتوى الإعلان هنا باللغة العربية..."
                  value={bodyAr}
                  onChange={e => setBodyAr(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
              </div>
            </div>

            {/* Optional Link / Target URL */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-amber-500" />
                <span>{isAr ? "رابط الانتقال عند الضغط (اختياري، مثلاً /match أو /stats)" : "Action Link / Route (Optional, e.g. /match or /stats)"}</span>
              </label>
              <input
                type="text"
                placeholder={isAr ? "مثال: /match" : "e.g. /match"}
                value={link}
                onChange={e => setLink(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
              />
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={broadcasting}
                className="px-8 py-4 rounded-2xl font-black text-base shadow-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-orange-900/30 transition-all duration-200 active:scale-95 flex items-center gap-3 disabled:opacity-50"
              >
                {broadcasting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>{broadcasting ? (isAr ? "جاري بث الإشعارات..." : "Broadcasting Now...") : (isAr ? "بث الإشعار الآن للجميع" : "Broadcast Push Notification Now")}</span>
              </button>
            </div>
          </motion.form>

          {/* Past Broadcast History */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span>📜</span>
                <span>{isAr ? "سجل البث والإعلانات السابقة" : "Recent Broadcast History"}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{recentAnnouncements.length} {isAr ? "إعلانات" : "broadcasts"}</span>
            </h3>

            {loadingHistory ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                {isAr ? "لم يتم إرسال أي إعلانات بعد." : "No broadcasts sent yet."}
              </div>
            ) : (
              <div className="space-y-4">
                {recentAnnouncements.map(ann => (
                  <div
                    key={ann.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          ann.priority === 'urgent' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        }`}>
                          {ann.priority === 'urgent' ? '🚨 URGENT' : 'ℹ️ NORMAL'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {ann.targetScope === 'global_all_users' ? (isAr ? '🌍 عام للكل' : '🌍 Global All') : (isAr ? '👥 للمجتمع' : '👥 Community')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(ann.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {isAr ? ann.titleAr : ann.titleEn}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                        {isAr ? ann.bodyAr : ann.bodyEn}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors shrink-0"
                      title={isAr ? "حذف الإعلان" : "Delete Announcement"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
