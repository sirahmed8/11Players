"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";

import SiteSkeletonLoader, { getSkeletonVariantForPath } from "@/components/ui/SiteSkeletonLoader";

const PUBLIC_ROUTES = ["/", "/guide", "/privacy", "/tos", "/cookie"];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    // Check if the route is public
    const isPublic = PUBLIC_ROUTES.includes(pathname);

    // If user is NOT logged in and trying to access a private route, kick them
    if (!user && !isPublic) {
      router.replace("/");
    }
  }, [user, loading, pathname, router, mounted]);

  // Handle server-side render or loading states
  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // If we are fully loaded, user is NOT logged in, and this is a private route,
  // we render nothing because the useEffect will redirect them.
  if (!loading && !user && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300" />
    );
  }

  return <>{children}</>;
}
