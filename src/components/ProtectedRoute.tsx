"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
    if (!loading && user && adminOnly && !isAdmin) {
      router.replace("/community");
    }
  }, [user, loading, isAdmin, adminOnly, router]);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
        />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {t("loading") || "Loading... / جارٍ التحميل..."}
        </p>
      </div>
    );
  }

  // Not authenticated — redirect is handled in useEffect, render nothing while redirecting
  if (!user) {
    return null;
  }

  // Admin-only route but user is not admin
  if (adminOnly && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
