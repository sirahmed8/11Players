"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsentBanner() {
  const { locale, t } = useLocale();
  const isAr = locale === "ar";
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) {
        setShowBanner(true);
      }
    } catch {
      // Ignore storage errors in private browsing
    }

    const handleOpenBanner = () => setShowBanner(true);
    window.addEventListener("open-cookie-banner", handleOpenBanner);
    return () => window.removeEventListener("open-cookie-banner", handleOpenBanner);
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("cookieConsent", "all");
    } catch {}
    setShowBanner(false);
  };

  const handleAcceptEssentialOnly = () => {
    try {
      localStorage.setItem("cookieConsent", "essential");
    } catch {}
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.aside
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[200]"
          role="region"
          aria-label={isAr ? "إشعار ملفات الارتباط" : "Cookie and Privacy Consent"}
          dir={isAr ? "rtl" : "ltr"}
        >
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 backdrop-blur-xl">
            {/* Top green accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                <Cookie className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span>{isAr ? "إدارة الخصوصية وملفات الارتباط" : "Privacy & Cookie Preferences"}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? "نستخدم ملفات الارتباط الضرورية لجلسة المصادقة الآمنة وحفظ تفضيلاتك الرياضية. نحن لا نبيع بياناتك ولا نستخدم أي كوكيز إعلانية خارجية."
                    : "We use strictly necessary cookies for secure session authentication and saving preferences. We never sell data or use third-party advertising cookies."}
                </p>
              </div>
              <button
                onClick={handleAcceptEssentialOnly}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                aria-label={isAr ? "إغلاق وقبول الضروري فقط" : "Close and accept essential only"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-98 text-center"
              >
                {isAr ? "قبول الكل" : "Accept All"}
              </button>
              <button
                onClick={handleAcceptEssentialOnly}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all text-center"
              >
                {isAr ? "الضرورية فقط" : "Essential Only"}
              </button>
              <Link
                href="/cookie"
                className="py-2 px-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-xs rounded-xl transition-all text-center"
              >
                {isAr ? "السياسة" : "Policy"}
              </Link>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
