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

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const list: string[] = JSON.parse(localStorage.getItem('11players_dismissed_anns') || '[]');
      if (!list.includes(announcement.id)) {
        list.push(announcement.id);
        localStorage.setItem('11players_dismissed_anns', JSON.stringify(list));
      }
    } catch (e) {}
  };

  const isUrgent = announcement.priority === 'urgent';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className={`w-full px-4 py-3 border-b shadow-lg transition-colors z-50 relative ${
          isUrgent
            ? "bg-gradient-to-r from-red-600/90 via-amber-600/90 to-red-600/90 text-white border-red-500/50"
            : "bg-gradient-to-r from-slate-900 via-amber-950/90 to-slate-900 text-white border-amber-500/40"
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0 animate-bounce">{isUrgent ? '🚨' : '📢'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isUrgent ? 'bg-white text-red-600' : 'bg-amber-400 text-slate-950'
                }`}>
                  {isAr ? "إعلان هام" : "ANNOUNCEMENT"}
                </span>
                <span className="font-bold text-sm truncate">
                  {isAr ? announcement.titleAr : announcement.titleEn}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 font-medium line-clamp-1">
                {isAr ? announcement.bodyAr : announcement.bodyEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {announcement.link && (
              <Link
                href={announcement.link}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all"
              >
                <span>{isAr ? "عرض" : "View"}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            )}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
              title={isAr ? "إخفاء الإعلان" : "Dismiss"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
