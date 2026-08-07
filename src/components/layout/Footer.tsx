"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/ui/ThemeProvider';
import { ShieldCheck, FileText, Lock, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted ? locale === "ar" : true;

  const handleOpenAiChat = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-11ai-chat', { detail: { tab: 'ai' } }));
    }
  };

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl pt-12 pb-24 md:pb-12 mt-auto shrink-0 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Intro */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-start gap-4">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="11Players" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-xl tracking-tight">11Players</span>
            </Link>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {isAr ? "المنصة الأولى لإدارة مباريات كرة القدم وحجز الملاعب، وتقييم اللاعبين الحقيقي." : "The ultimate platform for football match management, turf booking, and real-life player ratings."}
            </p>
          </div>

          {/* Primary Top Pages */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{isAr ? "الأقسام الرئيسية" : "Main Navigation"}</h4>
            <Link href="/communities" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">{isAr ? "المجتمعات" : "Communities"}</Link>
            <Link href="/matches" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">{isAr ? "المباريات والحجز" : "Matches & Hagaz"}</Link>
            <Link href="/live" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">{isAr ? "البث المباشر" : "Live Broadcaster"}</Link>
            <Link href="/newspaper" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">{isAr ? "جريدة بعد المباراة" : "Post-Match Newspaper"}</Link>
          </div>

          {/* Global & Achievements */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{isAr ? "التصنيفات والدعم" : "Leaderboards & Support"}</h4>
            <Link href="/leaderboard" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">{isAr ? "لوحة الجوائز والمكافآت" : "Leaderboard & Awards"}</Link>
            <Link href="/guide" className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">{isAr ? "الدليل والقوانين" : "Guides & Rules"}</Link>
            <button 
              onClick={handleOpenAiChat}
              className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors text-start flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-500 inline" />
              <span>{isAr ? "مركز المساعدة الذكي (11AI)" : "Smart Help Center (11AI)"}</span>
            </button>
          </div>

          {/* Developer Connect */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{isAr ? "المطور" : "Developer"}</h4>
            <motion.a 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href="https://linktr.ee/sir.ahmed" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2.5 w-max bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold rounded-xl transition-all border border-emerald-500/30 flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span suppressHydrationWarning>{isAr ? "كابتن أحمد علاء" : "Ahmed Alaa"}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
            </motion.a>
          </div>
        </div>

        {/* Bottom Bar: Legal & Copyright */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">
              <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span suppressHydrationWarning>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span>
            </Link>
            <Link href="/tos" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">
              <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span suppressHydrationWarning>{isAr ? "شروط الخدمة" : "Terms of Service"}</span>
            </Link>
            <Link href="/cookie" className="hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">
              <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span suppressHydrationWarning>{isAr ? "سياسة ملفات الارتباط" : "Cookie Policy"}</span>
            </Link>
          </div>

          <div className="text-xs text-slate-400 font-bold" dir={isAr ? "rtl" : "ltr"} suppressHydrationWarning>
            {isAr ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} 11Players.` : `© ${new Date().getFullYear()} 11Players. All rights reserved.`}
          </div>
        </div>
      </div>
    </footer>
  );
}


