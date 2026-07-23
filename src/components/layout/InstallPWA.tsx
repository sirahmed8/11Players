"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useLocale } from '@/components/ui/ThemeProvider';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { locale } = useLocale();
  const isAr = locale === "ar";

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt so it can only be used once.
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 inset-x-2 z-[100] max-w-md mx-auto min-w-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 overflow-hidden"
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl flex-shrink-0">
            <Download className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">
              {isAr ? "تثبيت التطبيق" : "Install App"}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {isAr ? "احصل على تجربة أسرع وأفضل!" : "Get a faster, better experience!"}
            </p>
          </div>

          <div className="flex w-full items-center justify-between gap-2 flex-shrink-0 sm:w-auto">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-colors whitespace-nowrap"
            >
              {isAr ? "تثبيت" : "Install"}
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
