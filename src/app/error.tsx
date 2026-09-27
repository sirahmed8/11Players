"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/ui/ThemeProvider";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home, LifeBuoy } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  useEffect(() => {
    // Log unexpected errors for client observability
    console.error("[11Players Error Boundary Captured]:", error);
  }, [error]);

  return (
    <div
      className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-slate-950 text-white relative overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      <main className="max-w-xl w-full mx-auto relative z-10 text-center space-y-8">
        {/* Visual Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{isAr ? "خطأ تقني في النظام — استئناف اللعب" : "System Error — Tactical Halt"}</span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {isAr ? "حدث خطأ غير متوقع" : "Something Went Wrong"}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            {isAr
              ? "واجه النظام عائقاً مؤقتاً أثناء معالجة بياناتك. يمكنك إعادة المحاولة الآن أو الرجوع إلى الملعب الرئيسي."
              : "The tactical engine encountered an unexpected interruption. You can retry immediately or return to the pitch home."}
          </p>
        </motion.div>

        {/* Error Details (Safe Digest display) */}
        {error?.digest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 max-w-sm mx-auto"
          >
            <span>{isAr ? "رمز المرجع: " : "Ref Code: "}</span>
            <span className="text-slate-300 font-bold select-all">{error.digest}</span>
          </motion.div>
        )}

        {/* Action Controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          {/* Retry CTA (Doherty Threshold compliance) */}
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/40 active:scale-[0.98] min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isAr ? "إعادة المحاولة فوراً" : "Retry Operation"}</span>
          </button>

          {/* Fallback to Pitch Home */}
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm rounded-xl transition-all active:scale-[0.98] min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>{isAr ? "العودة للملعب الرئيسي" : "Pitch Home"}</span>
          </Link>
        </motion.div>

        {/* Tactical Support Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="pt-6"
        >
          <Link
            href="/guide"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>{isAr ? "تصفح الدليل والأسئلة الشائعة" : "Read Tactical Guide & FAQs"}</span>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
