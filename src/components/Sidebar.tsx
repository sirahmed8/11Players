"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import SettingsMenu from "@/components/SettingsMenu";
import { ShieldAlert, Menu, X, Users, Globe, User, BookOpen, BarChart3, Swords, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useCommunity } from "@/contexts/CommunityContext";

export default function Sidebar() {
  const { user, isAdmin, isOwner } = useAuth();
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const pathname = usePathname();
  const isAr = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const links = [
    { href: "/communities", labelEn: "Communities", labelAr: "المجتمعات", icon: <Home className="w-5 h-5" /> },
    { href: "/global", labelEn: "Global", labelAr: "عالمي", icon: <Globe className="w-5 h-5" /> },
    ...(activeCommunityId ? [
      { href: "/community", labelEn: "My Community", labelAr: "مجتمعي", icon: <Users className="w-5 h-5" /> },
      { href: "/stats", labelEn: "Stats", labelAr: "الإحصائيات", icon: <BarChart3 className="w-5 h-5" /> },
      { href: "/match", labelEn: "Next Match", labelAr: "المباراة", icon: <Swords className="w-5 h-5" /> },
    ] : []),
    ...(user ? [{ href: `/profile?uid=${user.uid}`, labelEn: "My Profile", labelAr: "ملفي الشخصي", icon: <User className="w-5 h-5" /> }] : []),
    { href: "/guide", labelEn: "Guide", labelAr: "الدليل", icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/communities" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="11Players" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-xl tracking-tight">11Players</span>
          </Link>
        </div>
        <SettingsMenu direction="down" />
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden rounded-tr-3xl rounded-br-3xl md:rounded-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isAr ? "right-0 left-auto border-r-0 border-l rounded-tl-3xl rounded-bl-3xl rounded-tr-none rounded-br-none md:rounded-none" : ""}`}
      >
        <div className="flex-shrink-0 z-10 flex items-center justify-between p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50" style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
          <Link href="/communities" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="11Players Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-2xl tracking-tight">11Players</span>
          </Link>
          <button onClick={toggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-2 mx-2 flex flex-col gap-2 custom-scrollbar">
          {links.map((link) => {
            const baseHref = link.href.split("?")[0];
            const cleanPathname = pathname.replace(/\/$/, '');
            const isActive = cleanPathname === baseHref || (baseHref !== "/community" && cleanPathname.startsWith(baseHref + "/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                {link.icon}
                <span>{isAr ? link.labelAr : link.labelEn}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold mt-4 ${
                pathname.startsWith("/admin")
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span>{isAr ? "إدارة المجتمع" : "Admin"}</span>
            </Link>
          )}

          {isOwner && (
            <Link
              href="/owner"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                pathname.startsWith("/owner")
                  ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                  : "text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span>{isAr ? "المالك" : "Owner"}</span>
            </Link>
          )}
        </div>

        <div className="mt-auto flex-shrink-0 p-4 border-t border-slate-200/50 dark:border-slate-800/50 hidden md:block">
          <SettingsMenu direction="up" />
        </div>
      </div>
    </>
  );
}
