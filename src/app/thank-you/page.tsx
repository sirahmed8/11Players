"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/components/ui/ThemeProvider";
import { CheckCircle2, Clock, ArrowRight, ArrowLeft, Home, Users, HelpCircle, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function ThankYouPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-16" dir={isAr ? "rtl" : "ltr"}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6 relative overflow-hidden"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-[100px]" />

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? "شكراً لتواصلك معنا!" : "Thank You for Reaching Out!"}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            {isAr
              ? "تم استلام رسالتك وتأكيد طلبك بنجاح. فريق الدعم الفني وإدارة المباريات جاهز لمساعدتك."
              : "Your request has been received and confirmed. Our sports management and support team is ready to assist you."}
          </p>
        </div>

        {/* Response Guarantee Box */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center gap-3 text-emerald-300 text-xs sm:text-sm font-bold">
          <Clock className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>
            {isAr
              ? "ضمان الاستجابة السريعة: نرد على استفسارك خلال ساعتين كحد أقصى."
              : "Fast Response Promise: We respond to your inquiry within 2 hours."}
          </span>
        </div>

        {/* Contact direct fallback */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <a href="mailto:support@11players.com" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>support@11players.com</span>
          </a>
          <a href="tel:+201011111111" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span dir="ltr">+20 10 1111 1111</span>
          </a>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>{isAr ? "العودة للرئيسية" : "Back to Home"}</span>
          </Link>
          <Link
            href="/communities"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-98"
          >
            <Users className="w-4 h-4" />
            <span>{isAr ? "تصفح المجتمعات" : "Explore Communities"}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
