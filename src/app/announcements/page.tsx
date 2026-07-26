"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, onSnapshot, serverTimestamp, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Bell, Send, Trash2, ShieldCheck, Globe, Users, Link as LinkIcon, Loader2, Sparkles, Megaphone, AlertCircle } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CustomDropdown from "@/components/ui/CustomDropdown";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";

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
    try {
      const saved = localStorage.getItem("announcement_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.titleEn) setTitleEn(draft.titleEn);
        if (draft.titleAr) setTitleAr(draft.titleAr);
        if (draft.bodyEn) setBodyEn(draft.bodyEn);
        if (draft.bodyAr) setBodyAr(draft.bodyAr);
        if (draft.link) setLink(draft.link);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      if (titleEn || titleAr || bodyEn || bodyAr || link) {
        localStorage.setItem("announcement_draft", JSON.stringify({ titleEn, titleAr, bodyEn, bodyAr, link }));
      }
    } catch (e) {}
  }, [titleEn, titleAr, bodyEn, bodyAr, link]);

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
      toast.error(isAr ? "يرجى اختيار مجتمع نشط أولاً قبل البث الخاص بالمجتمع" : "Please select an active community before broadcasting");
      return;
    }

    setBroadcasting(true);
    try {
      const annId = `ann_${Date.now()}`;
      const announcementData: any = {
        id: annId,
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        bodyEn: bodyEn.trim(),
        bodyAr: bodyAr.trim(),
        priority,
        targetScope,
        link: link.trim() || null,
        senderUid: user?.uid || "",
        senderName: user?.displayName || (isAr ? "المسؤول" : "Admin"),
        communityId: targetScope === 'active_community' ? activeCommunityId || "" : "global",
        createdAt: new Date().toISOString()
      };

      // 1. Save to global announcements collection
      await setDoc(doc(db, "announcements", annId), announcementData);

      // 2. Broadcast to community live chat
      if (targetScope === 'active_community' && activeCommunityId) {
        try {
          await addDoc(collection(db, "communities", activeCommunityId, "chat"), {
            senderId: "system",
            senderName: isAr ? "11AI إعلانات" : "11AI Announcement",
            senderPhoto: "",
            text: isAr
              ? `📢 [إعلان رسمي جديد]: ${titleAr.trim()}\n${bodyAr.trim()}`
              : `📢 [Official Announcement]: ${titleEn.trim()}\n${bodyEn.trim()}`,
            createdAt: serverTimestamp(),
            isSystem: true,
          });
        } catch (chatErr) {
          console.warn("Chat broadcast skipped:", chatErr);
        }
      }

      // 3. Deliver to users/{uid}/notifications in safe 400 chunks
      let targetUids: string[] = [];
      if (targetScope === 'active_community' && activeCommunityId) {
        const snap = await getDocs(collection(db, "communities", activeCommunityId, "players"));
        snap.forEach(d => targetUids.push(d.id));
      } else if (targetScope === 'global_all_users' && isOwner) {
        const snap = await getDocs(collection(db, "users"));
        snap.forEach(d => targetUids.push(d.id));
      }

      const chunkSize = 400;
      for (let i = 0; i < targetUids.length; i += chunkSize) {
        const chunk = targetUids.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (recipientUid) => {
          try {
            const notifId = `broadcast_${annId}`;
            const notifPayload: any = {
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
              link: link.trim() || null
            };
            await setDoc(doc(db, "users", recipientUid, "notifications", notifId), notifPayload, { merge: true });
          } catch (notifErr) {
            console.warn(`Failed notification for ${recipientUid}:`, notifErr);
          }
        }));
      }

      toast.success(isAr ? `تم بث الإعلان بنجاح إلى ${targetUids.length} مستخدم!` : `Successfully broadcasted to ${targetUids.length} users!`);
      setTitleEn("");
      setTitleAr("");
      setBodyEn("");
      setBodyAr("");
      setLink("");
      try { localStorage.removeItem("announcement_draft"); } catch (e) {}
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

  if (loadingHistory || authLoading) {
    return (
      <ProtectedRoute adminOnly>
        <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 max-w-5xl mx-auto">
          <SiteSkeletonLoader variant="list" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 transition-colors" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Banner — Solid Dark Slate */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Megaphone className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-950 text-amber-400 border border-slate-800 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isAr ? "مركز الإعلانات والبث الفوري" : "Push Broadcast Center"}</span>
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  {isAr ? "بث الإشعارات والإعلانات ثنائية اللغة" : "Bilingual Broadcast & Notifications"}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  {isAr ? "أرسل إشعارات فورية وإعلانات ثنائية اللغة لجميع اللاعبين في مجتمعك وبثها بالمحادثة." : "Deliver bilingual push notifications and feed banners instantly to your players."}
                </p>
              </div>
            </div>
          </div>

          {/* Broadcast Form — Solid Dark Slate */}
          <form
            onSubmit={handleBroadcast}
            className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6"
          >
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>{isAr ? "إنشاء إعلان أو إشعار جديد" : "Create New Broadcast Notification"}</span>
            </h2>

            {/* Scope & Priority Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-300 mb-2">
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
                <label className="block text-xs font-black text-slate-300 mb-2">
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
                <label className="block text-xs font-black text-slate-300">
                  🇺🇸 {isAr ? "عنوان الإشعار بالإنجليزية (English Title)" : "English Title"} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next Match Sign-Up Open!"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-500 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-300">
                  🇸🇦 {isAr ? "عنوان الإشعار بالعربية (Arabic Title)" : "Arabic Title"} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فتح باب التسجيل للمباراة القادمة!"
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-500 shadow-sm"
                />
              </div>
            </div>

            {/* Bodies Grid (English + Arabic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-300">
                  🇺🇸 {isAr ? "نص الرسالة بالإنجليزية (English Message Body)" : "English Message Body"} <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message description here in English..."
                  value={bodyEn}
                  onChange={e => setBodyEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-500 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-300">
                  🇸🇦 {isAr ? "نص الرسالة بالعربية (Arabic Message Body)" : "Arabic Message Body"} <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب تفاصيل ومحتوى الإعلان هنا باللغة العربية..."
                  value={bodyAr}
                  onChange={e => setBodyAr(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-500 shadow-sm"
                />
              </div>
            </div>

            {/* Optional Link / Target URL */}
            <div>
              <label className="block text-xs font-black text-slate-300 mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-amber-400" />
                <span>{isAr ? "رابط الانتقال عند الضغط (اختياري، مثلاً /match أو /stats)" : "Action Link / Route (Optional, e.g. /match or /stats)"}</span>
              </label>
              <input
                type="text"
                placeholder={isAr ? "مثال: /match" : "e.g. /match"}
                value={link}
                onChange={e => setLink(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-500 shadow-sm"
              />
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={broadcasting}
                className="px-6 py-3.5 rounded-2xl font-black text-xs shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 active:scale-95 flex items-center gap-2.5 disabled:opacity-50 shadow-emerald-600/30"
              >
                {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{broadcasting ? (isAr ? "جاري بث الإشعارات..." : "Broadcasting Now...") : (isAr ? "بث الإشعار الآن للجميع" : "Broadcast Notification Now")}</span>
              </button>
            </div>
          </form>

          {/* Past Broadcast History */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
            <h3 className="text-base font-black text-white flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span>📜</span>
                <span>{isAr ? "سجل البث والإعلانات السابقة" : "Recent Broadcast History"}</span>
              </div>
              <span className="text-xs font-mono text-slate-400 font-bold">{recentAnnouncements.length} {isAr ? "إعلانات" : "broadcasts"}</span>
            </h3>

            {loadingHistory ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-slate-800 rounded-2xl font-medium text-xs">
                {isAr ? "لم يتم إرسال أي إعلانات بعد." : "No broadcasts sent yet."}
              </div>
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.map(ann => (
                  <div
                    key={ann.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          ann.priority === 'urgent' ? 'bg-rose-950 border border-rose-500/40 text-rose-400' : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                        }`}>
                          {ann.priority === 'urgent' ? '🚨 URGENT' : 'ℹ️ NORMAL'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {ann.targetScope === 'global_all_users' ? (isAr ? '🌍 عام للكل' : '🌍 Global All') : (isAr ? '👥 للمجتمع' : '👥 Community')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(ann.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-white truncate">
                        {isAr ? ann.titleAr : ann.titleEn}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium line-clamp-2">
                        {isAr ? ann.bodyAr : ann.bodyEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-rose-400 hover:bg-rose-950/40 transition-colors shrink-0"
                      title={isAr ? "حذف الإعلان" : "Delete Announcement"}
                    >
                      <Trash2 className="w-4 h-4" />
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
