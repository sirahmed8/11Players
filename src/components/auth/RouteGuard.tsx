"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";

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
  if (!mounted || loading) {
    // Only block rendering completely for private routes to prevent flashing content
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
          />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {locale === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        </div>
      );
    }
    // For public routes, let them render normally (or the children handles its own loading state)
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
