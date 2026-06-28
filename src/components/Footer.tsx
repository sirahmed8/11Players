'use client';

import React from 'react';
import { useLocale } from './ThemeProvider';
import Link from 'next/link';

export default function Footer() {
  const { t, locale } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center py-8 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center items-center gap-4">
          <Link href="/privacy" className="hover:text-emerald-500 transition-colors">{t('privacy')}</Link>
          <span className="opacity-50">&bull;</span>
          <Link href="/tos" className="hover:text-emerald-500 transition-colors">{t('tos')}</Link>
          <span className="opacity-50">&bull;</span>
          <Link href="/cookie" className="hover:text-emerald-500 transition-colors">{t('cookiePolicy')}</Link>
        </div>
        
        <a 
          href="https://linktr.ee/sir.ahmed" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-2.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 rounded-full font-semibold transition-all border border-emerald-200 dark:border-emerald-800"
        >
          {locale === 'ar' ? 'تواصل مع المطور' : 'Connect with the Developer'}
        </a>

        <p dir="ltr" className="text-xs opacity-70 mt-2">&copy; {currentYear} 11Players. All rights reserved.</p>
      </div>
    </footer>
  );
}
