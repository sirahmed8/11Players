"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/ui/ThemeProvider';
import { ShieldCheck, FileText, Lock, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = mounted ? locale === "ar" : true;

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl py-6 pb-20 md:pb-6 mt-auto shrink-0 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        
        {/* Main Legal & Sitemap Links */}
        <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 font-bold text-slate-600 dark:text-slate-400">
          <Link href="/privacy" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
            <Lock className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span suppressHydrationWarning>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-800">•</span>
          <Link href="/tos" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
            <FileText className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span suppressHydrationWarning>{isAr ? "شروط الخدمة" : "Terms of Service"}</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-800">•</span>
          <Link href="/cookie" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 group">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span suppressHydrationWarning>{isAr ? "سياسة ملفات الارتباط" : "Cookie Policy"}</span>
          </Link>
        </div>

        {/* Right / Center: Developer & Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <motion.a 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            href="https://linktr.ee/sir.ahmed" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold rounded-full transition-all border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span suppressHydrationWarning>{isAr ? "⚽ تواصل مع المطور — كابتن أحمد علاء" : "⚽ Connect with Developer — Ahmed Alaa"}</span>
            <ExternalLink className="w-3 h-3 text-emerald-500" />
          </motion.a>

          <div className="text-[11px] text-slate-500 font-bold" dir={isAr ? "rtl" : "ltr"} suppressHydrationWarning>
            {isAr ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} 11Players.` : `© ${new Date().getFullYear()} 11Players. All rights reserved.`}
          </div>
        </div>

      </div>
    </footer>
  );
}

