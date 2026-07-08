"use client";

import Link from 'next/link';
import { useLocale } from '@/components/ThemeProvider';

export default function Footer() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <footer className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-12 mt-auto rounded-t-3xl shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Brand / Connect */}
        <div className="flex flex-col gap-4 items-start">
          <div className="flex items-center gap-3">
             <img src="/logo.jpg" alt="11Players Logo" width={40} height={40} className="rounded-xl object-cover shadow-sm" />
             <span className="font-black text-emerald-600 dark:text-emerald-400 text-2xl tracking-tight">11Players</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAr ? "نظام إدارة لاعبين متكامل للمباريات الأسبوعية والمنافسات." : "Complete player management system for weekly matches and competitions."}
          </p>
          <a 
            href="https://linktr.ee/sir.ahmed" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-5 py-2 mt-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800/50 shadow-sm inline-block"
          >
            {isAr ? "تواصل مع المطور" : "Connect with the Developer"}
          </a>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-slate-900 dark:text-white">{isAr ? "قانوني" : "Legal"}</h4>
          <Link href="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
          <Link href="/tos" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "شروط الخدمة" : "Terms of Service"}</Link>
          <Link href="/cookie" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "سياسة ملفات الارتباط" : "Cookie Policy"}</Link>
        </div>

        {/* GitHub / Repo */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-slate-900 dark:text-white">{isAr ? "المشروع" : "Project"}</h4>
          <a href="https://github.com/sirahmed8/11Players/blob/main/README.md" target="_blank" rel="noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">README</a>
          <a href="https://github.com/sirahmed8/11Players/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">License</a>
          <a href="https://github.com/sirahmed8/11Players/security" target="_blank" rel="noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">Security</a>
        </div>

        {/* Guide */}
        <div className="flex flex-col gap-3">
          <h4 className="font-bold text-slate-900 dark:text-white">
            <Link href="/guide" className="hover:text-emerald-500 transition-colors">{isAr ? "دليل 11Players" : "11Players Guide"}</Link>
          </h4>
          <Link href="/guide#overview" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "نظرة عامة" : "Overview"}</Link>
          <Link href="/guide#positions" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "المراكز" : "Positions"}</Link>
          <Link href="/guide#play-styles" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "أساليب اللعب" : "Play Styles"}</Link>
          <Link href="/guide#special-skills" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "المهارات الخاصة" : "Special Skills"}</Link>
          <Link href="/guide#platform-features" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">{isAr ? "ميزات المنصة" : "Platform Features"}</Link>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
        <div className="text-xs text-slate-400" dir={isAr ? "rtl" : "ltr"}>
          {isAr ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} 11Players.` : `© ${new Date().getFullYear()} 11Players. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
