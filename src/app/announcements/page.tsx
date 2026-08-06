"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, onSnapshot, serverTimestamp, addDoc, query } from "firebase/firestore";
import toast from "react-hot-toast";
import { Bell, Send, Trash2, ShieldCheck, Globe, Users, Link as LinkIcon, Loader2, Sparkles, Megaphone, AlertCircle, Eye, Smartphone, Search, RefreshCw, Trophy, Zap, Award, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MessageSquare, RotateCcw, Edit3 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CustomDropdown from "@/components/ui/CustomDropdown";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import { enhanceAnnouncementWithAI, stripMarkdownAsterisks, cleanSingleLanguageText } from "@/lib/aiService";
import FormattedText from "@/components/ui/FormattedText";

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
  const [targetScope, setTargetScope] = useState<'active_community' | 'global_all_users'>("global_all_users");
  const [link, setLink] = useState("");

  const [broadcasting, setBroadcasting] = useState(false);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [readMoreAnn, setReadMoreAnn] = useState<Announcement | null>(null);

  // Editing state
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  // Preset topics & AI Polish Undo history
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [previousDraft, setPreviousDraft] = useState<{ titleEn: string; titleAr: string; bodyEn: string; bodyAr: string } | null>(null);

  // Accordion preview tab state: 'mobile' or 'chat'
  const [previewTab, setPreviewTab] = useState<'mobile' | 'chat'>('mobile');
  const [chatBodyExpanded, setChatBodyExpanded] = useState(false);

  // History search, priority filter, & pagination
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "urgent" | "normal">("all");
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const q = query(collection(db, "announcements"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Announcement[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRecentAnnouncements(list);
      setLoadingHistory(false);
    }, (err) => {
      console.error("Announcements query error:", err);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, []);

  const [customTone, setCustomTone] = useState("");

  // 🤖 11AI One-Click Enhancer & Preset Generator
  const handleAiEnhance = async (overrideTone?: string) => {
    setAiEnhancing(true);
    try {
      setPreviousDraft({ titleEn, titleAr, bodyEn, bodyAr });
      const toneToUse = overrideTone || customTone;

      const enhanced = await enhanceAnnouncementWithAI({
        titleEn,
        titleAr,
        bodyEn,
        bodyAr,
        customToneInstruction: toneToUse,
        communityName: activeCommunity?.name || "11Players",
      });

      setTitleEn(stripMarkdownAsterisks(cleanSingleLanguageText(enhanced.titleEn, 'en')));
      setTitleAr(stripMarkdownAsterisks(cleanSingleLanguageText(enhanced.titleAr, 'ar')));
      setBodyEn(stripMarkdownAsterisks(cleanSingleLanguageText(enhanced.bodyEn, 'en')));
      setBodyAr(stripMarkdownAsterisks(cleanSingleLanguageText(enhanced.bodyAr, 'ar')));

      toast.success(isAr ? "✨ 11AI قام بصياغة الإعلان بالأسلوب المحدد!" : "✨ 11AI polished your announcement in requested style!");
    } catch (err) {
      toast.error(isAr ? "فشل توليد الذكاء الاصطناعي" : "AI generation failed");
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setTitleEn(stripMarkdownAsterisks(cleanSingleLanguageText(ann.titleEn, 'en')));
    setTitleAr(stripMarkdownAsterisks(cleanSingleLanguageText(ann.titleAr, 'ar')));
    setBodyEn(stripMarkdownAsterisks(cleanSingleLanguageText(ann.bodyEn, 'en')));
    setBodyAr(stripMarkdownAsterisks(cleanSingleLanguageText(ann.bodyAr, 'ar')));
    setPriority(ann.priority || "normal");
    setTargetScope(ann.targetScope || "global_all_users");
    setLink(ann.link || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(isAr ? "تم تحميل بيانات الإعلان للتعديل ✏️" : "Announcement loaded for editing ✏️");
  };

  const handleCancelEditing = () => {
    setEditingAnnId(null);
    setTitleEn("");
    setTitleAr("");
    setBodyEn("");
    setBodyAr("");
    setLink("");
  };

  const handleUndoAi = () => {
    if (previousDraft) {
      setTitleEn(previousDraft.titleEn);
      setTitleAr(previousDraft.titleAr);
      setBodyEn(previousDraft.bodyEn);
      setBodyAr(previousDraft.bodyAr);
      setPreviousDraft(null);
      toast.success(isAr ? "تم التراجع عن تحسين الذكاء الاصطناعي ↩️" : "Restored previous draft ↩️");
    }
  };

  const handleBroadcast = async (e: React.FormEvent, mode: 'push' | 'chat' | 'both' = 'both') => {
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
      const annId = editingAnnId || `ann_${Date.now()}`;
      const announcementData: any = {
        id: annId,
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        bodyEn: bodyEn.trim(),
        bodyAr: bodyAr.trim(),
        priority,
        targetScope,
        broadcastMode: mode,
        link: link.trim() || null,
        senderUid: user?.uid || "",
        senderName: user?.displayName || (isAr ? "المسؤول" : "Admin"),
        communityId: targetScope === 'active_community' ? activeCommunityId || "" : "global",
        createdAt: new Date().toISOString()
      };

      // 1. Save to global announcements collection
      await setDoc(doc(db, "announcements", annId), announcementData, { merge: true });

      // 2. Sync to notifications collection under category broadcasts for /notifications page
      try {
        const notifId = `notif_broadcast_${annId}`;
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          announcementId: annId,
          category: "broadcasts",
          type: priority === "urgent" ? "urgent_broadcast" : "announcement",
          titleEn: titleEn.trim(),
          titleAr: titleAr.trim(),
          messageEn: bodyEn.trim(),
          messageAr: bodyAr.trim(),
          bodyEn: bodyEn.trim(),
          bodyAr: bodyAr.trim(),
          priority,
          link: link.trim() || "/notifications?category=broadcasts",
          communityId: targetScope === 'active_community' ? activeCommunityId || "" : "global",
          createdAt: new Date().toISOString(),
          isPublicBroadcast: true,
        }, { merge: true });
      } catch (syncErr) {
        console.warn("Global broadcast notification sync skipped:", syncErr);
      }

      // 3. Broadcast to community live chat (if mode is 'chat' or 'both')
      if ((mode === 'chat' || mode === 'both') && targetScope === 'active_community' && activeCommunityId) {
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

      // 4. Deliver to users/{uid}/notifications in safe 400 chunks (if mode is 'push' or 'both')
      if (mode === 'push' || mode === 'both') {
        try {
          let targetUids: string[] = [];
          if (targetScope === 'active_community' && activeCommunityId) {
            const snap = await getDocs(collection(db, "communities", activeCommunityId, "players"));
            snap.forEach(d => targetUids.push(d.id));
          } else if (targetScope === 'global_all_users') {
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
        } catch (pushErr) {
          console.warn("User inbox push skipped:", pushErr);
        }
      }

      const modeMsg = mode === 'both' 
        ? (isAr ? "بالإشعار الفوري ومحادثة المجتمع" : "Push Notif & Chat Banner")
        : mode === 'push'
          ? (isAr ? "بالإشعار الفوري" : "Push Notification")
          : (isAr ? "بمحادثة المجتمع" : "Chat Banner");

      toast.success(isAr ? `تم البث بنجاح (${modeMsg})!` : `Broadcasted successfully via ${modeMsg}!`);
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

  // Filtered History List
  const filteredHistory = recentAnnouncements.filter(ann => {
    const matchesSearch = (ann.titleEn + ann.titleAr + ann.bodyEn + ann.bodyAr)
      .toLowerCase()
      .includes(historySearch.toLowerCase());
    const matchesFilter = historyFilter === "all" ? true : ann.priority === historyFilter;
    return matchesSearch && matchesFilter;
  });

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
          
          {/* Header Banner - Solid Color Card */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
                <Megaphone className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800 mb-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? "مركز بث الإشعارات المدعوم بالذكاء الاصطناعي" : "AI-Powered Push Broadcast Center"}</span>
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  {isAr ? "بث الإشعارات والإعلانات" : "Broadcast & Notifications"}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  {isAr ? "أرسل إشعارات فورية وإعلانات لجميع اللاعبين في مجتمعك وبثها بالمحادثة." : "Deliver push notifications and feed banners instantly to your players."}
                </p>
              </div>
            </div>
          </div>

          {/* 🤖 11AI Polish & Custom Tone Studio */}
          <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                  ✨
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isAr ? "استوديو ضبط وتحسين الإعلانات بالذكاء الاصطناعي (11AI Polish Studio)" : "11AI Announcement Polish & Custom Tone Studio"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isAr ? "اكتب توجيهات الصياغة أو اختر الأسلوب المناسب لضبط النص وترجمته فوراً" : "Set custom writing tone or pick a preset style to polish your draft instantly."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAiEnhance()}
                disabled={aiEnhancing}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {aiEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isAr ? "صياغة المسودة بـ 11AI ⚡" : "Polish Draft with 11AI ⚡"}</span>
              </button>
            </div>

            {/* Custom Tone Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-300">
                🎯 {isAr ? "توجيهات وأسلوب الذكاء الاصطناعي المخصص (Custom AI Tone & Style Instructions)" : "Custom AI Writing Tone & Directives"}
              </label>
              <input
                type="text"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: اجعل الأسلوب حماسياً بأسلوب الكرات الذهبية، أو اكتب بالعامية المصرية، أو اختصر في جملتين فقط..."
                    : "e.g. Make it super hyped with football emojis, write in UEFA formal style, or keep it short in 2 sentences..."
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none placeholder-slate-500"
              />
            </div>

            {/* Style Preset Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400">
                {isAr ? "أو اختر أسلوباً جاهزاً للذكاء الاصطناعي:" : "Or select an AI Style Preset:"}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { tone: "Make it super hyped, energetic, and full of exciting football emojis!", labelAr: "🔥 حماسي ومشعل", labelEn: "🔥 Hype & Energetic" },
                  { tone: "Write in an official, formal, executive tone like FIFA or UEFA press releases.", labelAr: "⚽ رسمي ومهني", labelEn: "⚽ Official UEFA" },
                  { tone: "Write with tactical analysis terminology e.g. pressing, formations, positioning.", labelAr: "📋 تحليلي وتكتيكي", labelEn: "📋 Tactical Insight" },
                  { tone: "Keep it concise, high impact, under 20 words total.", labelAr: "⚡ قصير ومباشر", labelEn: "⚡ Short & Direct" },
                  { tone: "Write the Arabic version in friendly, warm Egyptian football slang!", labelAr: "🇪🇬 عامية مصرية كروية", labelEn: "🇪🇬 Egyptian Slang" },
                ].map((chip) => (
                  <button
                    key={chip.labelEn}
                    type="button"
                    onClick={() => {
                      setCustomTone(chip.tone);
                      handleAiEnhance(chip.tone);
                    }}
                    disabled={aiEnhancing}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-bold text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>{isAr ? chip.labelAr : chip.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid: Broadcast Form + Live Smartphone Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Column 1: Broadcast Form (7 cols) */}
            <form
              onSubmit={handleBroadcast}
              className="lg:col-span-7 bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6"
            >
              <h2 className="text-lg font-black text-white flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? "إنشاء إعلان أو إشعار جديد" : "Create New Broadcast Notification"}</span>
                </div>
                {(titleEn || titleAr || bodyEn || bodyAr) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleEn(""); setTitleAr(""); setBodyEn(""); setBodyAr(""); setLink("");
                      try { localStorage.removeItem("announcement_draft"); } catch (e) {}
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    {isAr ? "مسح المسودة" : "Clear Draft"}
                  </button>
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-300">
                    🇺🇸 {isAr ? "العنوان بالإنجليزية" : "English Title"} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="auto"
                    placeholder="e.g. Next Match Sign-Up Open!"
                    value={titleEn}
                    onChange={e => setTitleEn(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 outline-none placeholder-slate-500 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-300">
                    🇸🇦 {isAr ? "العنوان بالعربية" : "Arabic Title"} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="auto"
                    placeholder="مثال: فتح باب التسجيل للمباراة القادمة!"
                    value={titleAr}
                    onChange={e => setTitleAr(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 outline-none placeholder-slate-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Bodies Grid (English + Arabic) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-300">
                    🇺🇸 {isAr ? "نص الرسالة بالإنجليزية" : "English Message Body"} <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    dir="auto"
                    placeholder="Type your message description here in English..."
                    value={bodyEn}
                    onChange={e => setBodyEn(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 outline-none placeholder-slate-500 shadow-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-300">
                    🇸🇦 {isAr ? "نص الرسالة بالعربية" : "Arabic Message Body"} <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    dir="auto"
                    placeholder="اكتب تفاصيل ومحتوى الإعلان هنا باللغة العربية..."
                    value={bodyAr}
                    onChange={e => setBodyAr(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 outline-none placeholder-slate-500 shadow-sm leading-relaxed"
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
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 outline-none placeholder-slate-500 shadow-sm"
                />
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* AI Polish */}
                  <button
                    type="button"
                    onClick={() => handleAiEnhance()}
                    disabled={aiEnhancing}
                    className="px-4 py-3 rounded-2xl font-bold text-xs bg-slate-950 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/30 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 active:scale-95"
                  >
                    {aiEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
                    <span>{aiEnhancing ? (isAr ? "جاري التحسين..." : "Enhancing...") : (isAr ? "تحسين بالنص" : "AI Polish")}</span>
                  </button>

                  {/* Undo AI Polish Button */}
                  {previousDraft && (
                    <button
                      type="button"
                      onClick={handleUndoAi}
                      className="px-3.5 py-3 rounded-2xl font-bold text-xs bg-slate-950 border border-amber-500/40 text-amber-300 hover:bg-amber-950/30 transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm"
                      title={isAr ? "التراجع عن التعديل الأخير بالذكاء الاصطناعي" : "Restore draft before AI polish"}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? "تراجع عن التحسين" : "Undo AI"}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Push Notif Button */}
                  <motion.button
                    type="button"
                    disabled={broadcasting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { setPreviewTab('mobile'); handleBroadcast(e, 'push'); }}
                    className="px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {broadcasting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                    <span>{isAr ? "إشعار فقط" : "Push Notif"}</span>
                  </motion.button>

                  {/* Chat Banner Button */}
                  <motion.button
                    type="button"
                    disabled={broadcasting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { setPreviewTab('chat'); handleBroadcast(e, 'chat'); }}
                    className="px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-500/40 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {broadcasting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    <span>{isAr ? "محادثة فقط" : "Chat Banner"}</span>
                  </motion.button>

                  {/* BOTH BUTTON (Push & Chat at once!) */}
                  <motion.button
                    type="button"
                    disabled={broadcasting}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => handleBroadcast(e, 'both')}
                    className="px-5 py-3 rounded-2xl font-black text-xs shadow-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white transition-all duration-200 active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-emerald-600/30 shrink-0"
                  >
                    {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                    <span>{broadcasting ? (isAr ? "جاري البث..." : "Broadcasting...") : (isAr ? "🚀 بث الكلية (إشعار + محادثة)" : "📢 Broadcast Both (Push & Chat)")}</span>
                  </motion.button>
                </div>
              </div>
            </form>

            {/* Column 2: Real-time Live Smartphone Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white">{isAr ? "معاينة الإشعار الفوري (Live Preview)" : "Live Push & Chat Preview"}</span>
                  </div>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('mobile')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                        previewTab === 'mobile' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isAr ? "إشعار الهاتف" : "Push Notif"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPreviewTab('chat'); setChatBodyExpanded(false); }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                        previewTab === 'chat' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isAr ? "شريط المحادثة" : "Chat Banner"}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {previewTab === 'mobile' ? (
                    /* Smartphone Lockscreen Notification Card */
                    <motion.div
                      key="push"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner space-y-3"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-[9px] text-white">11</div>
                          <span className="font-bold text-slate-200">11PLAYERS</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Now</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {priority === 'urgent' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                          <h4 className="font-black text-xs text-white" dir="auto">
                            {stripMarkdownAsterisks(isAr ? titleAr : titleEn) || (isAr ? "عنوان الإشعار يظهر هنا..." : "Notification title preview...")}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-2" dir="auto">
                          {stripMarkdownAsterisks(isAr ? bodyAr : bodyEn) || (isAr ? "تفاصيل ومحتوى الرسالة يظهر هنا على شاشة قفل الهاتف..." : "Message body content preview as displayed on player's device...")}
                        </p>
                      </div>

                      {link && (
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                          <span>Tap to open: {link}</span>
                          <LinkIcon className="w-3 h-3" />
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    /* Community Live Chat Announcement Banner — Title + Ultra-Smooth 60 FPS Read More */
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-inner overflow-hidden flex flex-col justify-start"
                    >
                      <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-black mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{isAr ? "📢 [إعلان رسمي جديد في القناة العامة]" : "📢 [Official Community Broadcast]"}</span>
                      </div>
                      <h4 className="font-black text-xs text-white leading-snug" dir="auto">
                        {stripMarkdownAsterisks(isAr ? titleAr : titleEn) || "Title preview..."}
                      </h4>
                      <AnimatePresence initial={false}>
                        {chatBodyExpanded && (
                          <motion.div
                            key="chat-body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              height: { duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] },
                              opacity: { duration: 0.25, ease: "linear" }
                            }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2">
                              <p className="text-[11px] text-slate-300 leading-relaxed font-medium whitespace-pre-line" dir="auto">
                                {stripMarkdownAsterisks(isAr ? bodyAr : bodyEn) || "Body text preview..."}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={() => setChatBodyExpanded(p => !p)}
                        className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors pt-2 self-start cursor-pointer select-none"
                      >
                        <span>
                          {chatBodyExpanded
                            ? (isAr ? "طي" : "Show less")
                            : (isAr ? "اقرأ المزيد" : "Read more")}
                        </span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${chatBodyExpanded ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {targetScope === 'active_community'
                      ? (isAr ? `سيتم تسليم الإشعار لجميع أعضاء مجتمع (${activeCommunity?.name || 'النشط'}).` : `Delivering to all active members of (${activeCommunity?.name || 'Active'}).`)
                      : (isAr ? "سيتم البث لجميع مستخدمي منصة 11Players بدون استثناء!" : "Global broadcast to all platform users!")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Past Broadcast History */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>📜</span>
                  <span>{isAr ? "سجل البث والإعلانات السابقة" : "Recent Broadcast History"}</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800 font-bold">{filteredHistory.length}</span>
                </h3>
                {/* Collapse / Expand Toggle Button */}
                <button
                  type="button"
                  onClick={() => setHistoryCollapsed(p => !p)}
                  className="p-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
                  title={historyCollapsed ? (isAr ? "توسيع السجل" : "Expand History") : (isAr ? "طي السجل" : "Collapse History")}
                >
                  <span className="text-[11px] font-medium hidden sm:inline">{historyCollapsed ? (isAr ? "توسيع" : "Expand") : (isAr ? "طي" : "Collapse")}</span>
                  {historyCollapsed ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              {/* Search & Filter Inputs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute top-3 left-3 rtl:left-auto rtl:right-3 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder={isAr ? "بحث في الإعلانات..." : "Search broadcasts..."}
                    className="w-full bg-slate-950 border border-slate-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 rounded-xl pl-9 rtl:pl-3 rtl:pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all duration-300"
                  />
                </div>

                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs justify-center">
                  {(["all", "urgent", "normal"] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setHistoryFilter(f)}
                      className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg font-bold transition-all text-xs ${
                        historyFilter === f ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f === "all" ? (isAr ? "الكل" : "All") : f === "urgent" ? (isAr ? "عاجل" : "Urgent") : (isAr ? "عادي" : "Normal")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {!historyCollapsed && (
                <motion.div
                  key="history-list-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden space-y-4"
                >
                  {loadingHistory ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border border-slate-800 rounded-2xl font-medium text-xs">
                      {isAr ? "لم يتم العثور على أي إعلانات تطابق البحث." : "No broadcasts match your search."}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {filteredHistory
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map(ann => (
                            <motion.div
                              key={ann.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                            >
                              {/* Top row: badges + title + actions */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                      ann.priority === 'urgent' ? 'bg-rose-950 border border-rose-500/40 text-rose-400' : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                                    }`}>
                                      {ann.priority === 'urgent' ? '🚨 URGENT' : 'ℹ️ NORMAL'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                      {ann.targetScope === 'global_all_users' ? (isAr ? '🌍 عام للكل' : '🌍 Global All') : (isAr ? '👥 للمجتمع' : '👥 Community')}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium font-mono">
                                      {new Date(ann.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <h4 className="font-black text-sm text-white" dir="auto">{stripMarkdownAsterisks(isAr ? ann.titleAr : ann.titleEn)}</h4>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Edit button */}
                                  <button
                                    type="button"
                                    onClick={() => handleEditAnnouncement(ann)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-amber-300 text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    {isAr ? "تعديل ✏️" : "Edit ✏️"}
                                  </button>
                                  {/* Read More button */}
                                  <button
                                    type="button"
                                    onClick={() => setReadMoreAnn(ann)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold transition-colors flex items-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    {isAr ? "اقرأ المزيد" : "Read More"}
                                  </button>
                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAnnouncement(ann.id)}
                                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-rose-400 hover:bg-rose-950/40 transition-colors"
                                    title={isAr ? "حذف الإعلان" : "Delete Announcement"}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>

                      {/* Pagination Bar (If items > 10) */}
                      {Math.ceil(filteredHistory.length / itemsPerPage) > 1 && (
                        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                          <span className="text-slate-400 font-medium">
                            {isAr
                              ? `عرض ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, filteredHistory.length)} من أصل ${filteredHistory.length} إشعار`
                              : `Showing ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, filteredHistory.length)} of ${filteredHistory.length} broadcasts`}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:border-slate-800 transition-all font-bold flex items-center gap-1.5"
                            >
                              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                              <span>{isAr ? "السابق" : "Prev"}</span>
                            </button>

                            <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-emerald-400 text-xs">
                              {currentPage} / {Math.ceil(filteredHistory.length / itemsPerPage)}
                            </span>

                            <button
                              type="button"
                              disabled={currentPage === Math.ceil(filteredHistory.length / itemsPerPage)}
                              onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredHistory.length / itemsPerPage), p + 1))}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:border-slate-800 transition-all font-bold flex items-center gap-1.5"
                            >
                              <span>{isAr ? "التالي" : "Next"}</span>
                              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Read More Modal */}
      <AnimatePresence>
        {readMoreAnn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={() => setReadMoreAnn(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className={`p-5 border-b border-slate-800 flex items-start justify-between gap-4 ${
                readMoreAnn.priority === 'urgent' ? 'bg-rose-950/30' : 'bg-emerald-950/20'
              }`}>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      readMoreAnn.priority === 'urgent'
                        ? 'bg-rose-950 border border-rose-500/40 text-rose-400'
                        : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                    }`}>
                      {readMoreAnn.priority === 'urgent' ? '🚨 URGENT' : 'ℹ️ NORMAL'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(readMoreAnn.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-white leading-snug" dir="auto">
                    {stripMarkdownAsterisks(isAr ? readMoreAnn.titleAr : readMoreAnn.titleEn)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setReadMoreAnn(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap" dir="auto">
                  {stripMarkdownAsterisks(isAr ? readMoreAnn.bodyAr : readMoreAnn.bodyEn)}
                </p>

                {/* Show both languages */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">🇺🇸 English</span>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1 whitespace-pre-wrap">{readMoreAnn.bodyEn}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">🇸🇦 عربي</span>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1 whitespace-pre-wrap" dir="rtl">{readMoreAnn.bodyAr}</p>
                  </div>
                </div>

                {readMoreAnn.link && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{readMoreAnn.link}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReadMoreAnn(null)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  {isAr ? "إغلاق" : "Close"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
}
