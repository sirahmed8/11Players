"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Zap, Users, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StickyMobileCTA() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [show, setShow] = useState(false);

  // Show only on public landing or match pages
  const isEligiblePage = pathname === "/" || pathname === "/matches" || pathname === "/pro-pass";

  useEffect(() => {
    if (!isEligiblePage) {
      setShow(false);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isEligiblePage]);

  if (!isEligiblePage) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3"
          dir={isAr ? "rtl" : "ltr"}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-black text-white truncate">
                {isAr ? "احجز مباراتك الآن" : "Book Match Now"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {isAr ? "موازنة فورية وتقييم ذكي" : "Balanced squads & ratings"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/matches"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {isAr ? "حجز ملعب" : "Book Turf"}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
