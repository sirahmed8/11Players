"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Trophy, Activity, Flame, Sparkles } from "lucide-react";

import { collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const STATIC_ANNOUNCEMENTS_EN = [
  { icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, text: "11Players Global Leaderboard: Live OVR & Attribute Ranking Active." },
  { icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />, text: "11AI Tactical Assistant is ready to optimize player positions and playstyles." },
  { icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />, text: "Positional Suitability Index & XP Skill Tree system active across all communities." },
];

const STATIC_ANNOUNCEMENTS_AR = [
  { icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, text: "سجل النخبة العالمي: تصنيف الطاقات وتقييم OVR مباشر ومُحدث." },
  { icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />, text: "المستشار التكتيكي 11AI جاهز لاقتراح أفضل المراكز وأساليب اللعب." },
  { icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />, text: "خوارزمية ملاءمة المراكز وشجرة مهارات XP مفعّلة في جميع المجتمعات." },
];

export default function GlobalLiveTicker() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [liveMessages, setLiveMessages] = useState<{ icon: React.ReactNode; text: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadRealTickerData = async () => {
      try {
        const snap = await getDocs(collection(db, "players"));
        const realPlayers = snap.docs.map(d => d.data());
        
        const topPlayer = realPlayers.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))[0];
        
        const dynamicList = [...(isAr ? STATIC_ANNOUNCEMENTS_AR : STATIC_ANNOUNCEMENTS_EN)];
        
        if (topPlayer && topPlayer.cardName) {
          dynamicList.unshift({
            icon: <Flame className="w-3.5 h-3.5 text-rose-500" />,
            text: isAr 
              ? `اللاعب الأبرز حالياً: ${topPlayer.cardName} بمركز (${topPlayer.primaryPosition || 'CMF'}) وتقييم ${topPlayer.overallRating || 70} OVR!`
              : `Current Top Player: ${topPlayer.cardName} (${topPlayer.primaryPosition || 'CMF'}) with ${topPlayer.overallRating || 70} OVR!`
          });
        }
        setLiveMessages(dynamicList);
      } catch (err) {
        setLiveMessages(isAr ? STATIC_ANNOUNCEMENTS_AR : STATIC_ANNOUNCEMENTS_EN);
      }
    };
    loadRealTickerData();
  }, [isAr]);

  const messages = liveMessages.length > 0 ? liveMessages : (isAr ? STATIC_ANNOUNCEMENTS_AR : STATIC_ANNOUNCEMENTS_EN);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden relative h-11 flex items-center shadow-sm z-20">
      <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
      
      <div className="flex items-center px-4 w-full max-w-7xl mx-auto gap-3">
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          {isAr ? "مباشر" : "LIVE"}
        </div>
        
        <div className="flex-1 relative h-full flex items-center min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute w-full flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 truncate"
            >
              <span className="shrink-0">{messages[currentIndex].icon}</span>
              <span className="truncate">{messages[currentIndex].text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
