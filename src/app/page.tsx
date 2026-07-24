"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, ShieldCheck, Loader2, LogIn, BellRing, Sparkles, Smartphone, Trophy, Medal, Star, MessageSquare, Repeat, Goal, Languages, Timer } from "lucide-react";
import SettingsMenu from "@/components/layout/SettingsMenu";

export default function Home() {
  const { locale, toggleLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [cookieConsent, setCookieConsent] = useState(true);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [publicStats, setPublicStats] = useState({
    players: "40+",
    communities: "3+",
    avgRating: "7.8",
    matches: "100+"
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsDoc = await getDoc(doc(db, "system", "public_stats"));
        if (statsDoc.exists()) {
          const data = statsDoc.data();
          setPublicStats({
            players: data.totalPlayers ? `${data.totalPlayers}+` : "40+",
            communities: data.totalCommunities ? `${data.totalCommunities}+` : "3+",
            avgRating: data.avgRating ? data.avgRating.toFixed(1) : "7.8",
            matches: data.totalMatches ? `${data.totalMatches}+` : "100+"
          });
        }
      } catch (err) {
        console.error("Error fetching public stats:", err);
      }
    };
    fetchStats();
  }, []);

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
      } else if (user?.email) {
        const q = query(collection(db, "players"), where("email", "==", user.email));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const existingData = querySnap.docs[0].data();
          await setDoc(doc(db, "players", uid), {
            ...existingData,
            uid: uid,
            email: user.email,
            googlePic: user.photoURL || existingData.googlePic || '',
            googleName: user.displayName || existingData.googleName || ''
          }, { merge: true });
          if (existingData.defaultPage) {
            router.push(existingData.defaultPage);
          } else {
            router.push("/communities");
          }
        } else {
          router.push("/onboarding");
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
      title: isAr ? "المجتمعات المتعددة" : "Multiple Communities",
      desc: isAr ? "أنشئ أو انضم لعدة مجتمعات (مثل حجز الإثنين، حجز الجمعة). إحصائياتك منفصلة لكل مجتمع لضمان التنافس العادل!" : "Create or join multiple communities. Your stats are separated per community for fair competition!"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
      title: isAr ? "صناعة المباريات الذكية" : "Smart Matchmaking",
      desc: isAr ? "استخدم الموقع لتقسيم اللاعبين وتشكيل الفرق بشكل عادل بناءً على الطاقات والمراكز." : "Use the platform to divide players into fair teams based on their stats and positions."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-rose-500" />,
      title: isAr ? "نظام تقييم الأقران" : "Peer Rating System",
      desc: isAr ? "نظام تقييم متبادل بين اللاعبين بعد المباريات لضمان دقة طاقات اللاعبين من آراء زملائهم." : "A mutual rating system between players after matches to ensure accurate stats."
    },
    {
      icon: <Trophy className="w-8 h-8 text-amber-500" />,
      title: isAr ? "نظام البطولات والمواسم" : "Tournaments & Seasons",
      desc: isAr ? "نظام دوري مستمر مع أي فكرة تخطر ببالك. كل شيء متاح على الموقع للجميع." : "A continuous league system with customizable ideas. Everything is visible to everyone."
    },
    {
      icon: <Medal className="w-8 h-8 text-yellow-500" />,
      title: isAr ? "الإنجازات" : "Achievements",
      desc: isAr ? "تابع إنجازاتك، الجوائز الموسمية، ومتوسطاتك في لوحة إنجازات تعرض تقدمك وجوائزك." : "Track your achievements, seasonal awards, and averages in your personal trophy dashboard."
    },
    {
      icon: <BellRing className="w-8 h-8 text-purple-500" />,
      title: isAr ? "النصائح الذكية" : "Smart Advice",
      desc: isAr ? "تلقي نصائح بشكل دوري لمساعدتك في تحسين أدائك ومستواك في الملعب." : "Receive periodic advice to help you improve your performance on the pitch."
    },
    {
      icon: <Star className="w-8 h-8 text-orange-500" />,
      title: isAr ? "رجل المباراة MOTM" : "Man of the Match",
      desc: isAr ? "نظام لاختيار أفضل لاعب في كل مباراة وتوثيق إنجازه." : "A system to select and document the best player in each match."
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-cyan-500" />,
      title: isAr ? "شات المجتمع" : "Community Chat",
      desc: isAr ? "تواصل مع لاعبي مجتمعك ونظم مباريات وتحديات بين المجتمعات الأخرى." : "Chat with your community players and organize matches and cross-community challenges."
    },
    {
      icon: <Repeat className="w-8 h-8 text-teal-500" />,
      title: isAr ? "تعديل التشكيلة ديناميكي" : "Dynamic Lineups",
      desc: isAr ? "تغيير التشكيلة داخل المباراة أو قبلها، مع تنبيهات إذا كان اللاعب ضعيفاً في مركزه." : "Change lineups dynamically with alerts if a player is weak in their assigned position."
    },
    {
      icon: <Goal className="w-8 h-8 text-red-500" />,
      title: isAr ? "ركلات الترجيح الذكية" : "Smart Penalties",
      desc: isAr ? "نظام ركلات الترجيح الذي يختار أفضل اللاعبين للتسديد بناءً على طاقاتهم." : "A penalty shootout system that selects the best penalty takers based on stats."
    },
    {
      icon: <Timer className="w-8 h-8 text-pink-500" />,
      title: isAr ? "كروت ووقت ضائع" : "Cards & Stoppage",
      desc: isAr ? "إدارة احترافية للمباريات عبر تسجيل الكروت الملونة وحساب الوقت بدل الضائع." : "Professional match management tracking cards and stoppage time."
    },
    {
      icon: <Smartphone className="w-8 h-8 text-indigo-500" />,
      title: isAr ? "تطبيق متكامل وتعدد لغات" : "App & Localization",
      desc: isAr ? "ثبّت الموقع كتطبيق على هاتفك، مع دعم كامل للغتين العربية والإنجليزية." : "Install the site as an app on your phone, with full Arabic & English support."
    }
  ];

  const statsList = [
    { value: publicStats.players, label: isAr ? "لاعب مسجل" : "Registered Players" },
    { value: publicStats.communities, label: isAr ? "مجتمعات نشطة" : "Active Communities" },
    { value: publicStats.avgRating, label: isAr ? "متوسط التقييم" : "Avg Rating" },
    { value: publicStats.matches, label: isAr ? "مباراة ملعوبة" : "Matches Played" },
  ];


  if (authLoading || isRedirecting) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <p className="mt-4 font-bold text-slate-500 dark:text-slate-400 animate-pulse">
          {isAr ? "جاري تحميل 11Players...\u200F" : "Loading 11Players..."}
        </p>
      </main>
    );
  }


  return (
    <main className="min-h-screen flex flex-col items-center relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
      


      {/* Hero Section */}
      <section className="w-full flex-1 flex flex-col items-center justify-center text-center px-6 py-20 z-10 min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8 max-w-4xl flex flex-col items-center"
        >
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 shadow-emerald-500/20 mb-2 animate-bounce-subtle">
            <Image src="/logo.jpg" alt="11Players Logo" fill className="object-cover" priority />
          </div>
          <h2 className="text-5xl md:text-7xl font-black leading-tight bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-emerald-400 dark:to-teal-600 bg-clip-text text-transparent pb-2">
            {t("welcome")}
          </h2>
          
          <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            {t("tagline")}
          </p>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-5xl px-6 py-12 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {statsList.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl md:text-5xl font-black bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-emerald-400 dark:to-teal-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
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
            className={`fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md p-5 rounded-2xl border shadow-2xl z-50 flex flex-col gap-3.5 transition-colors duration-300 ${
              theme === "light"
                ? "bg-white text-slate-900 border-slate-300 shadow-slate-200/60"
                : "bg-slate-900 text-white border-slate-800 shadow-black/60"
            }`}
          >
            <motion.div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-emerald-500" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
              <p className="text-sm font-medium leading-relaxed">
              {t("privacy_banner")}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleAcceptCookies}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
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




