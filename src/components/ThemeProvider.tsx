"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Types
export type Theme = "light" | "dark";
export type Locale = "en" | "ar";
export type Direction = "ltr" | "rtl";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

interface LocaleContextProps {
  locale: Locale;
  direction: Direction;
  isRTL: boolean;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    welcome: "Welcome to 11Players",
    tagline: "Gamified Football Matchmaking & Community Management",
    cta_login: "Login with Google",
    privacy_banner: "We use cookies to enhance your matchmaking balance accuracy.",
    accept: "Accept",
    profile: "Player Profile",
    admin: "Admin Console",
    tos: "Terms of Service",
    privacy: "Privacy Policy",
    cookiePolicy: "Cookie Policy",
    requireCommunity: "Please select a community first.",
    adminOnly: "You do not have admin access for this community.",
  },
  ar: {
    welcome: "مرحباً بك في 11Players",
    tagline: "تنظيم مجتمعي متكامل وتشكيل متوازن ومحسّن لفرق كرة القدم",
    cta_login: "تسجيل الدخول بواسطة جوجل",
    privacy_banner: "نحن نستخدم ملفات تعريف الارتباط لتحسين دقة موازنة تشكيل الفرق.",
    accept: "موافق",
    profile: "ملف اللاعب",
    admin: "لوحة التحكم للمشرفين",
    tos: "شروط الخدمة",
    privacy: "سياسة الخصوصية",
    cookiePolicy: "سياسة ملفات تعريف الارتباط",
    requireCommunity: "يرجى اختيار مجتمع أولاً.",
    adminOnly: "ليس لديك صلاحيات إدارية لهذا المجتمع.",
  },
};

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);
const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    }
    return "dark";
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Locale Provider Component
export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>("ar"); // Default is Arabic (RTL)
  const [direction, setDirection] = useState<Direction>("rtl");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale) {
      setLocale(savedLocale);
      setDirection(savedLocale === "ar" ? "rtl" : "ltr");
      document.documentElement.lang = savedLocale;
      document.documentElement.dir = savedLocale === "ar" ? "rtl" : "ltr";
    }
    setMounted(true);
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    const nextDir = nextLocale === "ar" ? "rtl" : "ltr";
    setLocale(nextLocale);
    setDirection(nextDir);
    localStorage.setItem("locale", nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextDir;
  };

  const t = (key: string) => {
    return translations[locale][key] || key;
  };

  if (!mounted) return null;

  return (
    <LocaleContext.Provider value={{ locale, direction, isRTL: direction === "rtl", toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

// Hooks
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
};
