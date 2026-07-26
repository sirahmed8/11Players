"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import Image from "next/image";
import Link from "next/link";
import SettingsMenu from "@/components/layout/SettingsMenu";
import { useLocale } from "@/components/ui/ThemeProvider";

export default function OnboardingPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <ProtectedRoute>
      {/* Full-screen dark background matching the welcome page aesthetic */}
      <div
        className="min-h-screen flex flex-col bg-slate-950 text-white relative overflow-hidden"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-emerald-500/8 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-teal-500/6 blur-[80px]" />
          {/* Subtle pitch grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ob-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ob-grid)" />
          </svg>
        </div>

        {/* ── Sticky navbar ── */}
        <header className="sticky top-0 z-50 w-full">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.05]" />
          <div className="relative max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/30 shadow-md shadow-emerald-500/20">
                <Image src="/logo.jpg" alt="11Players Logo" fill className="object-cover" priority />
              </div>
              <span className="font-black text-lg bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent tracking-tight group-hover:opacity-80 transition-opacity">
                11Players
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-semibold text-slate-500 border border-slate-800 rounded-full px-3 py-1">
                {isAr ? "إعداد الملف الشخصي" : "Player Setup"}
              </span>
              <SettingsMenu direction="down" />
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-start py-10 px-4">
          {/* Page heading */}
          <div className="text-center mb-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              {isAr ? "خطوة واحدة فقط" : "Almost there"}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              {isAr ? "أنشئ ملفك الكروي" : "Build Your Player Profile"}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              {isAr
                ? "أكمل بياناتك في بضع خطوات وانضم إلى مجتمعك الكروي."
                : "Complete your details in a few steps and join your football community."}
            </p>
          </div>

          {/* Wizard card */}
          <div className="w-full max-w-4xl">
            <OnboardingWizard />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
