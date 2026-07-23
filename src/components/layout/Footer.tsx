"use client";

import Link from 'next/link';
import { useLocale } from '@/components/ui/ThemeProvider';

export default function Footer() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <footer className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-6 mb-6 md:mb-8 mx-4 md:mx-8 mt-auto rounded-3xl shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
        
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/privacy" className="hover:text-emerald-500 transition-colors">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link href="/tos" className="hover:text-emerald-500 transition-colors">{isAr ? "شروط الخدمة" : "Terms of Service"}</Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link href="/cookie" className="hover:text-emerald-500 transition-colors">{isAr ? "سياسة ملفات الارتباط" : "Cookie Policy"}</Link>
        </div>

        <a 
          href="https://linktr.ee/sir.ahmed" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800/50 shadow-sm"
        >
          {isAr ? "تواصل مع المطور" : "Connect with the Developer"}
        </a>

        <div className="text-xs text-slate-400 mt-2" dir={isAr ? "rtl" : "ltr"}>
          {isAr ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} 11Players.` : `© ${new Date().getFullYear()} 11Players. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
