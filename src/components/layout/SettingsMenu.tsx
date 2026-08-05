"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Globe, Sun, Moon, LogOut, User } from "lucide-react";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useRouter } from "next/navigation";

interface SettingsMenuProps {
  direction?: "up" | "down";
}

export default function SettingsMenu({ direction = "down" }: SettingsMenuProps) {
  const [isOpen, setIsOpen]   = useState(false);
  const { locale, toggleLocale, isRTL, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { user, logout }       = useAuth();
  const { userProfile }        = useAuthProfile(user);
  const router                 = useRouter();
  const menuRef                = useRef<HTMLDivElement>(null);
  
  const myProfileUrl = userProfile?.username ? `/profile?username=${userProfile.username}` : "/profile";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuOrigin = direction === "up"
    ? (isRTL ? "bottom-left" : "bottom-right")
    : (isRTL ? "top-left"    : "top-right");

  const menuPosition = direction === "up"
    ? "bottom-full mb-2"
    : "top-full mt-2";

  const menuAlign = isRTL ? "left-0" : "right-0";

  return (
    <div className="relative z-[60]" ref={menuRef}>
      {/* Trigger button */}
      <motion.button
        onClick={() => setIsOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="
          p-2 rounded-xl
          bg-white/80 dark:bg-slate-800/80
          hover:bg-white dark:hover:bg-slate-700
          border border-slate-200 dark:border-slate-700
          shadow-sm hover:shadow-md
          transition-all duration-200
          flex items-center justify-center
          backdrop-blur-sm
        "
        title={t("settings")}
        aria-label={t("settings")}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <Settings className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300" />
        </motion.div>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: direction === "up" ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: direction === "up" ? 8 : -8 }}
            transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.8 }}
            style={{ transformOrigin: menuOrigin }}
            className={`
              absolute ${menuPosition} ${menuAlign}
              w-64
              bg-white dark:bg-slate-900
              rounded-2xl
              shadow-[0_8px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]
              border border-slate-200 dark:border-slate-700/80
              overflow-hidden
            `}
            role="menu"
          >
            {/* User info section */}
            {user && (
              <>
                <Link
                  href={myProfileUrl}
                  onClick={() => setIsOpen(false)}
                  className="
                    flex items-center gap-3 px-4 py-3.5
                    hover:bg-slate-50 dark:hover:bg-slate-800/60
                    transition-colors duration-150
                    group
                  "
                  role="menuitem"
                >
                  {user.photoURL ? (
                    <div className="relative w-9 h-9 shrink-0">
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        fill
                        sizes="36px"
                        className="rounded-full object-cover ring-2 ring-emerald-500/30"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/30">
                      <User className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {user.displayName || "Player"}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {user.email}
                    </span>
                  </div>
                </Link>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
              </>
            )}

            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="
                w-full px-4 py-3 flex items-center gap-3
                hover:bg-slate-50 dark:hover:bg-slate-800/60
                transition-colors duration-150
                text-start group
              "
              role="menuitem"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <Globe className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("language")}
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="
                w-full px-4 py-3 flex items-center gap-3
                hover:bg-slate-50 dark:hover:bg-slate-800/60
                transition-colors duration-150
                text-start group
              "
              role="menuitem"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                {theme === "dark" ? (
                  <Sun  className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {theme === "dark" ? t("light_mode") : t("dark_mode")}
              </span>
            </button>

            {/* Logout */}
            {user && (
              <>
                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" />
                <button
                  onClick={handleLogout}
                  className="
                    w-full px-4 py-3 flex items-center gap-3
                    hover:bg-red-50 dark:hover:bg-red-500/10
                    transition-colors duration-150
                    text-start group
                    mb-1
                  "
                  role="menuitem"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <LogOut className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {t("logout")}
                  </span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
