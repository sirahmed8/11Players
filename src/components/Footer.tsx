'use client';

import React from 'react';
import { useLocale } from './ThemeProvider';
import Link from 'next/link';

export default function Footer() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center py-6 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-bg-light dark:bg-bg-dark transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-4">
          <Link href="#privacy" className="hover:text-emerald-500 transition-colors">{t('privacy')}</Link>
          <span>&bull;</span>
          <Link href="#tos" className="hover:text-emerald-500 transition-colors">{t('tos')}</Link>
          <span>&bull;</span>
          <Link href="#cookie" className="hover:text-emerald-500 transition-colors">{t('cookiePolicy')}</Link>
        </div>
        <p>&copy; {currentYear} 11Players. All rights reserved.</p>
      </div>
    </footer>
  );
}
