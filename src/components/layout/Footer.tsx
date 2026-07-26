"use client";

import Link from 'next/link';
import { useLocale } from '@/components/ui/ThemeProvider';
import { ShieldCheck, FileText, Lock, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <footer className="bg-slate-900/90 border border-slate-800 py-6 mb-6 md:mb-8 mx-4 md:mx-8 mt-auto rounded-3xl shadow-xl backdrop-blur-xl shrink-0">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
        
        {/* Main Legal Links */}
        <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-black text-slate-400">
          <Link href="/privacy" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span>
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/tos" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? "شروط الخدمة" : "Terms of Service"}</span>
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/cookie" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? "سياسة ملفات الارتباط" : "Cookie Policy"}</span>
          </Link>
        </div>

        {/* Compact Developer Contact Badge */}
        <a 
          href="https://linktr.ee/sir.ahmed" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold rounded-full transition-all border border-emerald-500/30 shadow-md flex items-center gap-1.5"
        >
          <span>{isAr ? "⚽ تواصل مع المطور — كابتن أحمد علاء" : "⚽ Connect with Developer — Ahmed Alaa"}</span>
          <ExternalLink className="w-3 h-3 text-emerald-400" />
        </a>

        {/* Copyright notice */}
        <div className="text-[11px] text-slate-500 font-bold" dir={isAr ? "rtl" : "ltr"}>
          {isAr ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} منصة 11Players.` : `© ${new Date().getFullYear()} 11Players. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
