"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ui/ThemeProvider";
import { useCommunity } from "@/contexts/CommunityContext";
import Link from "next/link";
import { X, ArrowRight, Bell } from "lucide-react";

import { stripMarkdownAsterisks } from "@/lib/aiService";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function GlobalAnnouncementBanner() {
  const { locale } = useLocale();
  const { activeCommunityId } = useCommunity();
  const isAr = locale === "ar";
  const [announcement, setAnnouncement] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSecondaryLang, setShowSecondaryLang] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      let found: any = null;
      const dismissedList: string[] = JSON.parse(localStorage.getItem('11players_dismissed_anns') || '[]');

      for (const d of snap.docs) {
        const data = d.data();
        if (dismissedList.includes(d.id)) continue;

        // Check target scope matching
        if (data.targetScope === 'global_all_users' || (data.targetScope === 'active_community' && data.communityId === activeCommunityId)) {
          found = { id: d.id, ...data };
          break;
        }
      }
      setAnnouncement(found);
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn("GlobalAnnouncementBanner error:", err);
      }
    });

    return () => unsub();
  }, [activeCommunityId]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      if (announcement?.id) {
        const list: string[] = JSON.parse(localStorage.getItem('11players_dismissed_anns') || '[]');
        if (!list.includes(announcement.id)) {
          list.push(announcement.id);
          localStorage.setItem('11players_dismissed_anns', JSON.stringify(list));
        }
      }
    } catch (e) {}
  };

  const isUrgent = announcement?.priority === 'urgent';
  const displayTitle = stripMarkdownAsterisks(isAr ? announcement?.titleAr : announcement?.titleEn);
  const displayBody = stripMarkdownAsterisks(isAr ? announcement?.bodyAr : announcement?.bodyEn);
  const secondaryBody = stripMarkdownAsterisks(isAr ? announcement?.bodyEn : announcement?.bodyAr);

  return (
    <>
      <AnimatePresence mode="wait">
        {announcement && !dismissed && (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full px-3 sm:px-4 pt-3 sm:pt-4 z-50 relative"
          >
            <div
              onClick={() => setShowModal(true)}
              className={`w-full max-w-6xl mx-auto px-4 py-3.5 sm:py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group ${
                isUrgent
                  ? "bg-slate-900/95 hover:bg-slate-900 text-slate-100 border-rose-500/40 shadow-rose-950/20 hover:border-rose-400/60"
                  : "bg-slate-900/95 hover:bg-slate-900 text-slate-100 border-emerald-500/30 shadow-emerald-950/20 hover:border-emerald-400/60"
              }`}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 w-full">
                <span className="text-xl shrink-0 animate-pulse">{isUrgent ? '🚨' : '📢'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isUrgent 
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isAr ? "إعلان هام" : "ANNOUNCEMENT"}
                    </span>
                    <span className="font-bold text-sm text-slate-100 truncate group-hover:text-emerald-400 transition-colors" dir="auto">
                      {displayTitle}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                      {isAr ? "(انقر لقراءة الإعلان كاملاً 📖)" : "(Click for full announcement 📖)"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium line-clamp-2 sm:line-clamp-1" dir="auto">
                    {displayBody}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {announcement.link && (
                  <a
                    href={announcement.link}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <span>{isAr ? "عرض" : "View"}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
                  title={isAr ? "إخفاء الإعلان" : "Dismiss"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Detail Modal Window */}
      <AnimatePresence>
        {showModal && announcement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden text-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                    isUrgent ? 'bg-rose-950 border border-rose-500/40 text-rose-400' : 'bg-slate-950 border border-emerald-500/40 text-emerald-400'
                  }`}>
                    {isUrgent ? '🚨' : '📢'}
                  </div>
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1 ${
                      isUrgent ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isUrgent ? (isAr ? "إشعار عاجل ومهم" : "Urgent Priority Alert") : (isAr ? "إعلان رسمي" : "Official Announcement")}
                    </span>
                    <h3 className="text-lg font-black text-white leading-tight" dir="auto">
                      {displayTitle}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Full Untruncated Body */}
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5 max-h-80 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-line" dir="auto">
                    {displayBody}
                  </p>
                </div>

                {/* Secondary translation if available — Smooth Spring Expand */}
                {secondaryBody && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowSecondaryLang(p => !p)}
                      className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors select-none cursor-pointer"
                    >
                      <span>{isAr ? "عرض النص باللغة الإنجليزية (English Version)" : "View Arabic Version (النص بالعربية)"}</span>
                      {showSecondaryLang ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {showSecondaryLang && (
                        <motion.div
                          key="secondary-lang"
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 whitespace-pre-line leading-relaxed" dir="auto">
                            {secondaryBody}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-4">
                {announcement.link && (
                  <Link
                    href={announcement.link}
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <span>{isAr ? "الانتقال للرابط 🔗" : "Open Target Link 🔗"}</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isAr ? "إغلاق" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
