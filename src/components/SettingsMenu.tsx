"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Globe, Sun, Moon, LogOut, User, Home, ChevronDown } from "lucide-react";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SettingsMenu({ direction = "down" }: { direction?: "up" | "down" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mainPageDropdownOpen, setMainPageDropdownOpen] = useState(false);
  const { locale, toggleLocale, isRTL, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [defaultPage, setDefaultPage] = useState("/communities");

  useEffect(() => {
    if (user) {
      getDoc(doc(db, "players", user.uid)).then(snap => {
        if (snap.exists() && snap.data().defaultPage) {
          setDefaultPage(snap.data().defaultPage);
        }
      });
    }
  }, [user]);

  const handleDefaultPageChange = async (page: string) => {
    setDefaultPage(page);
    setMainPageDropdownOpen(false);
    if (user) {
      try {
        await updateDoc(doc(db, "players", user.uid), { defaultPage: page });
      } catch (err) {
        console.error("Failed to save default page", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAr = locale === "ar";

  const popupVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0 }
  };

  const getTransformOrigin = () => {
    if (direction === "up") {
      return isRTL ? "bottom left" : "bottom right";
    }
    return isRTL ? "top left" : "top right";
  };

  return (
    <div className="relative z-[60]" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm"
        title={isAr ? "الإعدادات" : "Settings"}
      >
        <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`absolute ${direction === "up" ? "bottom-full mb-3" : "top-full mt-3"} w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-700 ${
              isRTL ? "left-0" : "right-0"
            }`}
          >
            <div className="py-2 flex flex-col">
              {user && (
                <>
                  <div className="px-4 py-3 flex items-center gap-3">
                    {user.photoURL ? (
                      <div className="relative w-10 h-10 shrink-0">
                        <Image src={user.photoURL} alt="Profile" fill sizes="40px" className="rounded-full object-cover border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.displayName || 'Player'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-1" />
                </>
              )}
              <button
                onClick={toggleLocale}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isAr ? "English" : "العربية"}
                </span>
              </button>

              <button
                onClick={toggleTheme}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isAr
                    ? theme === "dark"
                      ? "الوضع الفاتح"
                      : "الوضع الداكن"
                    : theme === "dark"
                    ? "Light Mode"
                    : "Dark Mode"}
                </span>
              </button>

              {user && (
                <>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left group"
                  >
                    <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {isAr ? "تسجيل الخروج" : "Logout"}
                    </span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
