"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, ShieldCheck, Loader2, LogIn, BellRing, Sparkles, Smartphone } from "lucide-react";
import SettingsMenu from "@/components/SettingsMenu";

export default function Home() {
  const { locale, toggleLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [cookieConsent, setCookieConsent] = useState(true);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setCookieConsent(false);
    }
  }, []);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      setIsRedirecting(true);
      checkProfileAndRedirect(user.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const checkProfileAndRedirect = async (uid: string) => {
    try {
      const playerDoc = await getDoc(doc(db, "players", uid));
      if (playerDoc.exists()) {
        const data = playerDoc.data();
        if (data.defaultPage) {
          router.push(data.defaultPage);
        } else {
          router.push("/communities");
        }
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error checking player profile:", error);
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
    } catch (error) {
      console.error("Google login failed:", error);
      setLoginInProgress(false);
    }
  };

  const isAr = locale === "ar";

  const features = [
    {
      icon: <Users className="w-8 h-8 text-emerald-500" />,
      title: isAr ? "تنظيم اللاعبين" : "Player Management",
      desc: isAr ? "إدارة مجتمع اللاعبين بسهولة، وإنشاء بطاقات احترافية لكل لاعب تحتوي على مهاراته وإحصائياته." : "Easily manage your player community, and create professional cards for each player with their skills and stats."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-amber-500" />,
      title: isAr ? "تتبع الإحصائيات" : "Stat Tracking",
      desc: isAr ? "تتبع الأهداف والتمريرات الحاسمة والمباريات التي تم لعبها. كل لاعب يحصل على تقييم دقيق يتحدث باستمرار." : "Track goals, assists, and matches played. Every player gets an accurate rating that updates constantly."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
      title: isAr ? "موازنة الفرق" : "Team Balancing",
      desc: isAr ? "استخدام خوارزميات ذكية لتقسيم اللاعبين إلى فرق متوازنة بناءً على طاقاتهم ومراكزهم لضمان التنافسية." : "Use smart algorithms to divide players into balanced teams based on their stats and positions to ensure competitiveness."
    },
    {
      icon: <BellRing className="w-8 h-8 text-purple-500" />,
      title: isAr ? "نظام الإشعارات" : "Notification System",
      desc: isAr ? "تلقي تنبيهات وإشعارات ونصائح حول المباريات والنتائج وحالة مجتمعك بشكل فوري." : "Receive instant alerts, notifications, and advice about matches, results, and your community status."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-rose-500" />,
      title: isAr ? "إحصائيات متقدمة" : "Advanced Stats",
      desc: isAr ? "احصل على تقييمات مفصلة كالمحترفين تعتمد على الطول والوزن والأداء الحقيقي على أرض الملعب." : "Get detailed pro-level ratings based on height, weight, and real performance on the pitch."
    },
    {
      icon: <Smartphone className="w-8 h-8 text-indigo-500" />,
      title: isAr ? "تطبيق متكامل" : "Installable App",
      desc: isAr ? "ثبّت الموقع كتطبيق على هاتفك أو حاسوبك للحصول على تجربة أسرع وأكثر سلاسة." : "Install the site as an app on your phone or computer for a faster, smoother experience."
    }
  ];

  if (authLoading || isRedirecting) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="mt-4 font-bold text-slate-500 dark:text-slate-400 animate-pulse">
          {isAr ? "جاري تحميل 11Players..." : "Loading 11Players..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
      
      {/* Header Controls */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4 px-6 z-50 sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-transparent transition-all">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          ⚽ 11Players
        </h1>
        <div className="flex gap-2 items-center">
          <SettingsMenu />
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full flex-1 flex flex-col items-center justify-center text-center px-6 py-20 z-10 min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8 max-w-4xl"
        >
          <h2 className="text-5xl md:text-7xl font-black leading-tight bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-emerald-400 dark:to-teal-600 bg-clip-text text-transparent pb-2">
            {t("welcome")}
          </h2>
          
          <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            {t("tagline")}
          </p>
        </motion.div>
      </section>

      {/* Features / Explanation Section */}
      <section className="w-full max-w-6xl px-6 py-24 z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl md:text-5xl font-black mb-6">
            {isAr ? "لماذا تستخدم 11Players؟" : "Why use 11Players?"}
          </h3>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            {isAr 
              ? "نظامنا يوفر كل ما تحتاجه لتنظيم مبارياتك الأسبوعية، تتبع أداء اللاعبين، وضمان التنافسية العادلة في كل مباراة."
              : "Our system provides everything you need to organize your weekly matches, track player performance, and ensure fair competitiveness."}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h4 className="text-xl font-bold mb-3">{feat.title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="pt-16 pb-8 text-center flex justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={handleGoogleLogin}
              disabled={loginInProgress || authLoading}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-900/20 transition-all"
            >
              {loginInProgress || authLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <LogIn className="w-6 h-6" />
              )}
              <span>{t("cta_login")}</span>
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {!cookieConsent && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md bg-slate-900 text-white p-4 rounded-xl border border-slate-700 shadow-2xl z-50 flex flex-col gap-3"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
