"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, LogIn, Loader2 } from "lucide-react";

export default function Home() {
  const { locale, toggleLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [cookieConsent, setCookieConsent] = useState(true);
  const [loginInProgress, setLoginInProgress] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setCookieConsent(false);
    }
  }, []);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      checkProfileAndRedirect(user.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const checkProfileAndRedirect = async (uid: string) => {
    try {
      const playerDoc = await getDoc(doc(db, "players", uid));
      if (playerDoc.exists()) {
        router.push("/community");
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error checking player profile:", error);
      // Default to onboarding if Firestore check fails
      router.push("/onboarding");
    }
  };

  const handleAcceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setCookieConsent(true);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginInProgress(true);
      await login();
      // Redirect is handled by the useEffect that watches user state
    } catch (error) {
      console.error("Google login failed:", error);
      setLoginInProgress(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between items-center p-6 relative overflow-hidden bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header Controls */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4 z-10">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          ⚽ 11Players
        </h1>
        <div className="flex gap-2 items-center">
          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title={locale === "ar" ? "Switch to English" : "تغيير إلى العربية"}
          >
            <Globe className="w-5 h-5" />
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Landing Info */}
      <section className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {t("onboarding")}
          </span>
          <h2 className="text-4xl md:text-6xl font-black leading-tight">
            {t("welcome")}
          </h2>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t("tagline")}
          </p>

          <div className="pt-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loginInProgress || authLoading}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              {loginInProgress || authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              <span>{t("cta_login")}</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer / Links */}
      <footer className="w-full max-w-6xl text-center py-6 text-xs text-slate-500 dark:text-slate-400 z-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4">
            <a href="#tos" className="hover:underline">{t("tos")}</a>
            <a href="#privacy" className="hover:underline">{t("privacy")}</a>
          </div>
          <p>© {new Date().getFullYear()} 11Players. All rights reserved.</p>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {!cookieConsent && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md bg-slate-900 text-white p-4 rounded-xl border border-slate-700 shadow-2xl z-50 flex flex-col gap-3">
          <p className="text-sm">
            {t("privacy_banner")}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleAcceptCookies}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg text-xs transition-colors"
            >
              {t("accept")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

