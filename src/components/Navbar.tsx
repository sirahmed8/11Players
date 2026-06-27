"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import SettingsMenu from "@/components/SettingsMenu";
import { ShieldAlert } from "lucide-react";

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { locale } = useLocale();
  const pathname = usePathname();

  const isAr = locale === "ar";

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col md:flex-row justify-between items-center p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <Link href="/community" className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          ⚽ 11Players
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <nav className="flex items-center gap-4 text-sm font-semibold mr-4">
          <Link
            href="/community"
            className={`${
              pathname === "/community"
                ? "text-emerald-500 dark:text-emerald-400 font-bold"
                : "hover:text-emerald-500 transition-colors"
            }`}
          >
            {isAr ? "المجتمع" : "Community"}
          </Link>
          <Link
            href="/stats"
            className={`${
              pathname === "/stats"
                ? "text-emerald-500 dark:text-emerald-400 font-bold"
                : "hover:text-emerald-500 transition-colors"
            }`}
          >
            {isAr ? "الإحصائيات" : "Stats"}
          </Link>
          {user && (
            <Link
              href={`/profile?uid=${user.uid}`}
              className={`${
                pathname === "/profile"
                  ? "text-emerald-500 dark:text-emerald-400 font-bold"
                  : "hover:text-emerald-500 transition-colors"
              }`}
            >
              {isAr ? "ملفي الشخصي" : "My Profile"}
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1 ${
                pathname === "/admin"
                  ? "text-amber-500 dark:text-amber-400 font-bold"
                  : "text-amber-500 hover:text-amber-600 transition-colors"
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> {isAr ? "لوحة التحكم" : "Admin"}
            </Link>
          )}
        </nav>
        <div className="flex gap-2 items-center pl-2 md:pl-4 border-l border-slate-200 dark:border-slate-800">
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
