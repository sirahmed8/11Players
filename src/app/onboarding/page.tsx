"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import SettingsMenu from "@/components/SettingsMenu";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingPage() {
  const { isOwner } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-12 transition-colors">
        <div className="w-full mb-4">
          <Navbar />
        </div>
        
        <div className="w-full max-w-4xl px-4">
          <OnboardingWizard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
