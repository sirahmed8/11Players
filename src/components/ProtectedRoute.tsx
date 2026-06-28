"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import { toast } from "react-hot-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  requireCommunity?: boolean;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
  ownerOnly = false,
  requireCommunity = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isOwner } = useAuth();
  const { activeCommunityId, loadingCommunity } = useCommunity();
  const router = useRouter();
  const { t } = useLocale();

  const isFullyLoaded = !loading && !loadingCommunity;

  useEffect(() => {
    if (!isFullyLoaded) return;
    
    if (!user) {
      router.replace("/");
      return;
    }
    if (ownerOnly && !isOwner) {
      router.replace("/communities");
      return;
    }
    if (adminOnly && !isAdmin) {
      toast.error(t("adminOnly") || "You do not have admin access for this community.");
      router.replace("/communities");
      return;
    }
    if (requireCommunity && !activeCommunityId && !isOwner) {
      toast.error(t("requireCommunity") || "Please select a community first.");
      router.replace("/communities");
      return;
    }
  }, [user, isFullyLoaded, isAdmin, isOwner, adminOnly, ownerOnly, requireCommunity, activeCommunityId, router, t]);

  // Loading spinner
  if (!isFullyLoaded) {
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

  // Owner-only route but user is not owner
  if (ownerOnly && !isOwner) {
    return null;
  }

  // Community required but not selected
  if (requireCommunity && !activeCommunityId) {
    return null;
  }

  return <>{children}</>;
}
