"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import SettingsMenu from "@/components/SettingsMenu";

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-12 transition-colors">
        <header className="w-full flex justify-between items-center p-6 mb-4 bg-white dark:bg-slate-800 shadow-sm">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            ⚽ 11Players
          </h1>
          <div className="flex items-center gap-2">
            <SettingsMenu />
          </div>
        </header>
        
        <div className="w-full max-w-4xl px-4">
          <OnboardingWizard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
