"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import SettingsMenu from "@/components/layout/SettingsMenu";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingPage() {
  const { isOwner } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-12 transition-colors">
        <div className="w-full mb-4">
                  </div>
        
        <div className="w-full max-w-4xl px-4">
          <OnboardingWizard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
