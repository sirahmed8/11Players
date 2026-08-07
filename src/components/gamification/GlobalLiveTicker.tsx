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
    <div className="w-full bg-slate-950/60 backdrop-blur-xl border-b border-white/5 overflow-hidden relative h-10 flex items-center shadow-2xl z-20">
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
      
      <div className="flex items-center px-4 w-full max-w-7xl mx-auto gap-4">
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]" />
          {isAr ? "مباشر" : "LIVE"}
        </div>
        
        <div className="flex-1 relative h-full flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute w-full flex items-center gap-2 text-xs font-bold text-slate-300"
            >
              {messages[currentIndex].icon}
              <span className="truncate">{messages[currentIndex].text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
