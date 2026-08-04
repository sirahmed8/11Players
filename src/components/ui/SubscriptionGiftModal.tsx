"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, CheckCircle2, ArrowRight, Zap, Shield, Bot, Shirt } from "lucide-react";
import Link from "next/link";
import { useProSubscription } from "@/contexts/ProSubscriptionContext";
import { useLocale } from "@/components/ui/ThemeProvider";

export default function SubscriptionGiftModal() {
  const { hasProAccess, plan, isOwner, loading } = useProSubscription();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading || !hasProAccess || isOwner) return;

    // Check if user has already acknowledged this subscription celebration modal
    const acknowledgedPlan = localStorage.getItem("11players_sub_gift_seen");
    if (acknowledgedPlan !== plan) {
      setIsOpen(true);
    }
  }, [loading, hasProAccess, plan, isOwner]);

  const handleClose = () => {
    localStorage.setItem("11players_sub_gift_seen", plan);
    setIsOpen(false);
  };

  const isClub = plan === "club_organizer";
  const title = isAr
    ? isClub
      ? "🎉 مبروك! تم منحك اشتراك منظم النادي 🏟️"
      : "🎉 مبروك! تم منحك اشتراك PRO الكابتن 👑"
    : isClub
    ? "🎉 Congratulations! You received Club Organizer Pass 🏟️"
    : "🎉 Congratulations! You received PRO Captain Pass 👑";

  const subtitle = isAr
    ? "قام مالك المنصة والآدمن بمنحك تفعيل اشتراك PRO الممتاز مجاناً! تم فتح جميع المميزات الحصرية لك الآن."
    : "You have been gifted full PRO membership by the Platform Owner! All premium features are now unlocked for you.";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20 overflow-hidden space-y-6"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Glowing Aura Background */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-b from-amber-500/30 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Animated Header Icon */}
          <div className="flex justify-center relative z-10">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: [0, 5, -5, 0], scale: 1 }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-xl shadow-amber-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <Crown className="w-10 h-10 text-amber-400 fill-amber-400/20" />
                </div>
              </div>
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                VIP GIFT
              </span>
            </motion.div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2 relative z-10">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Unlocked Perks List */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-right rtl:text-right ltr:text-left relative z-10">
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? "المميزات المفعلة لك الآن:" : "Unlocked Perks:"}</span>
            </div>

            {[
              { textEn: "AI Match Scout & Tactical Reports", textAr: "تقارير الذكاء الاصطناعي والتحليل التكتيكي", icon: <Bot className="w-4 h-4 text-cyan-400" /> },
              { textEn: "3D Custom Kit & Crest Studio", textAr: "استوديو مصمم الأطقم والشعارات 3D", icon: <Shirt className="w-4 h-4 text-purple-400" /> },
              { textEn: "Verified Golden Crown Badge", textAr: "شارة الكابتن الذهبية الموثقة 👑", icon: <Crown className="w-4 h-4 text-amber-400" /> },
              { textEn: "Unlimited Community Joins & Roster Slots", textAr: "مجتمعات غير محدودة والأولوية في المباريات", icon: <Zap className="w-4 h-4 text-emerald-400" /> },
            ].map((perk, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isAr ? perk.textAr : perk.textEn}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 relative z-10">
            <button
              onClick={handleClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{isAr ? "شكرًا! استكشف ميزات PRO" : "Awesome! Explore PRO Features"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
}
