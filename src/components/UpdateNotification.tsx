"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { useLocale } from "@/components/ThemeProvider";

export default function UpdateNotification() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const checkShouldShow = () => {
      const dismissed = localStorage.getItem("11players_last_update_dismissed");
      if (dismissed) {
        const timeSince = Date.now() - parseInt(dismissed, 10);
        // If dismissed or refreshed in the last 6 hours, do not show again
        if (timeSince < 6 * 60 * 60 * 1000) return false;
      }
      return true;
    };

    // 1. Listen for Service Worker updates
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting && checkShouldShow()) {
        setShowUpdate(true);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller && checkShouldShow()) {
            setShowUpdate(true);
          }
        });
      });
    });

    // 2. Catch dynamic import / chunk load errors after deploy
    const handleWindowError = (event: ErrorEvent) => {
      if (
        event.message &&
        (event.message.includes("Loading chunk") ||
          event.message.includes("ChunkLoadError") ||
          event.message.includes("Failed to fetch dynamically imported module"))
      ) {
        if (checkShouldShow()) setShowUpdate(true);
      }
    };

    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("11players_last_update_dismissed", Date.now().toString());
    setShowUpdate(false);
  };

  const handleRefresh = () => {
    localStorage.setItem("11players_last_update_dismissed", Date.now().toString());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
      });
    }
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 z-[100] max-w-sm w-auto"
          dir={isAr ? "rtl" : "ltr"}
        >
          <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-500/40 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {isAr ? "يتوفر تحديث جديد للموقع!" : "New Update Available!"}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {isAr
                      ? "تم تحديث الموقع وإضافة تحسينات ومميزات جديدة. اضغط لتحديث الصفحة."
                      : "We've released new improvements and fixes. Refresh to get the latest version."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                {isAr ? "لاحقاً" : "Later"}
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? "تحديث الآن" : "Refresh Now"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
