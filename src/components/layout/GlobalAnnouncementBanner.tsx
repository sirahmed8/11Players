"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ui/ThemeProvider";
import { useCommunity } from "@/contexts/CommunityContext";
import Link from "next/link";
import { X, ArrowRight, Bell } from "lucide-react";

export default function GlobalAnnouncementBanner() {
  const { locale } = useLocale();
  const { activeCommunityId } = useCommunity();
  const isAr = locale === "ar";
  const [announcement, setAnnouncement] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

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
    });

    return () => unsub();
  }, [activeCommunityId]);

  const handleDismiss = () => {
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

  return (
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
            className={`w-full max-w-6xl mx-auto px-4 py-3.5 sm:py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isUrgent
                ? "bg-slate-900/95 text-slate-100 border-rose-500/40 shadow-rose-950/20"
                : "bg-slate-900/95 text-slate-100 border-emerald-500/30 shadow-emerald-950/20"
            }`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0 w-full">
              <span className="text-xl shrink-0 animate-pulse">{isUrgent ? '🚨' : '📢'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isUrgent 
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isAr ? "إعلان هام" : "ANNOUNCEMENT"}
                  </span>
                  <span className="font-bold text-sm text-slate-100 truncate">
                    {isAr ? announcement.titleAr : announcement.titleEn}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium line-clamp-2 sm:line-clamp-1">
                  {isAr ? announcement.bodyAr : announcement.bodyEn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {announcement.link && (
                <a
                  href={announcement.link}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <span>{isAr ? "عرض" : "View"}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                </a>
              )}
              <button
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
  );
}
