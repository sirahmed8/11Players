"use client";

import Link from 'next/link';
import { useLocale } from '@/components/ui/ThemeProvider';
import { ShieldCheck, FileText, Lock, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <footer className="bg-slate-900/90 border border-slate-800 py-8 mb-6 md:mb-8 mx-4 md:mx-8 mt-auto rounded-3xl shadow-xl backdrop-blur-xl shrink-0">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-5">
        
        {/* Main Legal Links */}
        <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-black text-slate-400">
          <Link href="/privacy" prefetch={false} className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span>
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/tos" prefetch={false} className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? "شروط الخدمة" : "Terms of Service"}</span>
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/cookie" prefetch={false} className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? "سياسة ملفات الارتباط" : "Cookie Policy"}</span>
          </Link>
        </div>

        {/* GitHub Documentation Links */}
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
          <a
            href="https://github.com/sirahmed8/11Players#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>README</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <span className="text-slate-800">•</span>
          <a
            href="https://github.com/sirahmed8/11Players/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>License</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <span className="text-slate-800">•</span>
          <a
            href="https://github.com/sirahmed8/11Players/security"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Security</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>

        {/* Developer Contact Badge */}
        <a 
          href="https://linktr.ee/sir.ahmed" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-black rounded-full transition-all border border-emerald-500/30 shadow-md flex items-center gap-2"
        >
          <span>{isAr ? "⚽ تواصل مع المطور — كابتن أحمد علاء" : "⚽ Connect with Developer — Ahmed Alaa"}</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
        </a>

        {/* Copyright notice */}
        <div className="text-xs text-slate-500 font-bold" dir={isAr ? "rtl" : "ltr"}>
          {isAr ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} منصة 11Players.` : `© ${new Date().getFullYear()} 11Players. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
