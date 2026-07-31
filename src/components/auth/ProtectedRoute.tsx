"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { toast } from "react-hot-toast";
import AdviceNotification from "@/components/match/AdviceNotification";
import GlobalAnnouncementBanner from "@/components/layout/GlobalAnnouncementBanner";

import { useAuthProfile } from "@/hooks/useAuthProfile";

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
  const { userProfile } = useAuthProfile(user);
  const { activeCommunityId, loadingCommunity } = useCommunity();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAr = locale === "ar";
  const isFullyLoaded = !loading && !loadingCommunity;

  useEffect(() => {
    // If auth is loaded and there is no user, kick immediately
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    if (!isFullyLoaded) return;

    // Check if player profile is incomplete or missing registration details
    if (userProfile && (userProfile.onboardingCompleted === false || !userProfile.cardName || !userProfile.position)) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/onboarding")) {
        toast(isAr ? "يرجى استكمال بيانات تسجيل حسابك أولاً ⚽" : "Please complete your player profile onboarding first ⚽", { icon: "📝" });
        router.replace("/onboarding");
        return;
      }
    }
    
    if (ownerOnly && !isOwner) {
      router.replace("/community");
      return;
    }
    if (adminOnly && !isAdmin) {
      toast.error(t("adminOnly") || "You do not have admin access for this community.");
      router.replace("/community");
      return;
    }
    if (requireCommunity && !activeCommunityId) {
      toast.error(t("requireCommunity") || "Please select a community first.");
      router.replace("/communities");
      return;
    }
  }, [user, userProfile, loading, isFullyLoaded, isAdmin, isOwner, adminOnly, ownerOnly, requireCommunity, activeCommunityId, router, t, isAr]);

  // Not authenticated — redirect is handled in useEffect, render nothing while redirecting
  if (!loading && !user) {
    return null;
  }

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
          {mounted && isAr ? "جارٍ التحميل..." : "Loading..."}
        </p>
      </div>
    );
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

  return (
    <>
      <AdviceNotification />
      {children}
    </>
  );
}
