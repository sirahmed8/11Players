"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Trophy, Activity, Flame, Sparkles } from "lucide-react";

const TICKER_MESSAGES_EN = [
  { icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, text: "AHMED reached 72 OVR and claimed the Gold Badge!" },
  { icon: <Flame className="w-3.5 h-3.5 text-rose-500" />, text: "El-Ahly just won a massive 5-0 derby against Zamalek." },
  { icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />, text: "New 3D Kit Builder Studio is now live for Pro Pass users." },
  { icon: <Activity className="w-3.5 h-3.5 text-blue-400" />, text: "Over 1,200 matches played this week across all communities." },
];

const TICKER_MESSAGES_AR = [
  { icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, text: "AHMED وصل إلى تقييم 72 OVR وحصل على الشارة الذهبية!" },
  { icon: <Flame className="w-3.5 h-3.5 text-rose-500" />, text: "الأهلي فاز في ديربي قوي بنتيجة 5-0 ضد الزمالك." },
  { icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />, text: "استوديو تصميم الأطقم 3D متاح الآن لمشتركي برو باس." },
  { icon: <Activity className="w-3.5 h-3.5 text-blue-400" />, text: "أكثر من 1,200 مباراة لُعبت هذا الأسبوع في جميع المجتمعات." },
];

export default function GlobalLiveTicker() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const messages = isAr ? TICKER_MESSAGES_AR : TICKER_MESSAGES_EN;
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 overflow-hidden relative h-10 flex items-center shadow-inner">
      <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
      
      <div className="flex items-center px-4 w-full max-w-7xl mx-auto gap-4">
        <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
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
