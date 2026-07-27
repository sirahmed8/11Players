"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Users, ShieldCheck, Loader2, BellRing, Sparkles,
  Smartphone, Trophy, Medal, Star, MessageSquare, Repeat,
  Goal, Timer, ArrowRight, CheckCircle2, Zap, Cookie, X,
  TrendingUp, BarChart3
} from "lucide-react";
import SettingsMenu from "@/components/layout/SettingsMenu";

// ── Animated Counter Hook ─────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1400, delay = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const start = useCallback(() => {
    if (started || target === 0) return;
    setStarted(true);
    const step = (ts: number) => {
      if (!startTime.current) startTime.current = ts + delay;
      const elapsed = ts - startTime.current;
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(step); return; }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else setCount(target);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [target, duration, delay, started]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  return { count, start };
}

// ── Stat Card with animated counter ────────────────────────────────────────────────
// color = a solid Tailwind bg class e.g. "bg-emerald-500"
function StatCard({
  value, label, icon, color, delay, suffix = ""
}: {
  value: number; label: string; icon: React.ReactNode;
  color: string; delay: number; suffix?: string;
}) {
  const { count, start } = useAnimatedCounter(value, 700, delay);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onViewportEnter={start}
      className="relative group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] p-6 flex flex-col items-center gap-3 shadow-sm transition-all duration-300">
        {/* Solid color top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${color} opacity-90`} />
        {/* Subtle glow on hover */}
        <div className={`absolute inset-0 ${color} opacity-[0.03] group-hover:opacity-[0.10] transition-opacity duration-500`} />
        <div className={`w-13 h-13 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div className="stat-value text-3xl md:text-4xl text-slate-900 dark:text-white">
          {count > 0 ? `${count}${suffix}` : "—"}
        </div>
        <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 text-center leading-snug">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
const FEATURE_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function FeatureCard({
  icon, title, desc, gradient, index
}: { icon: React.ReactNode; title: string; desc: string; gradient: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.96 }}
      className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Solid accent top */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${gradient}`} />

      <div className={`relative w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center mb-4 shadow-md`}>
        <div className="text-white [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
      </div>
      <h3 className="relative text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">{title}</h3>
      <p className="relative text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Google G SVG ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { locale, t } = useLocale();
  const { theme } = useTheme();
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const isAr = locale === "ar";

  const [cookieConsent, setCookieConsent] = useState(true);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [publicStats, setPublicStats] = useState({ players: 0, communities: 0, avgRating: 71, matches: 0 });
  const [mounted, setMounted] = useState(false);

  // ── Ensure SSR/client hydration consistency ───────────────────────────
  useEffect(() => { setMounted(true); }, []);

  // ── Parallax scroll ─────────────────────────────────────────────────────────
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // ── Stats fetch — cached doc first, then live ───────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      let p = 0, c = 0, m = 0, r = 71;
      // 1. Cached doc first (fastest, unauthenticated-safe)
      try {
        const snap = await getDoc(doc(db, "system", "public_stats"));
        if (snap.exists()) {
          const d = snap.data();
          if (d.totalPlayers)     p = d.totalPlayers;
          if (d.totalCommunities) c = d.totalCommunities;
          if (d.totalMatches)     m = d.totalMatches;
          if (d.avgRating > 0)    r = d.avgRating <= 10 ? Math.round(d.avgRating * 10) : Math.round(d.avgRating);
          if (mounted) { setPublicStats({ players: p, communities: c, avgRating: r, matches: m }); setStatsLoaded(true); }
        }
      } catch (_) {}

      // 2. Live fallback if cache gave zeros
      if (p === 0) {
        try {
          const ps = await getDocs(collection(db, "players"));
          p = ps.size;
          let sum = 0, cnt = 0;
          ps.forEach(d => {
            const raw = d.data().overallRating || d.data().stats?.overallRating || 70;
            if (typeof raw === "number" && raw > 0) { sum += raw <= 10 ? raw * 10 : raw; cnt++; }
          });
          if (cnt > 0) r = Math.round(sum / cnt);
        } catch (_) {}
      }
      if (c === 0) {
        try {
          const cs = await getDocs(collection(db, "communities"));
          c = cs.size;
          let tot = 0;
          await Promise.all(cs.docs.map(async cd => {
            try {
              const ms = await getDocs(collection(db, "communities", cd.id, "matches"));
              ms.forEach(md => { if (md.id !== "latest") tot++; });
            } catch (_) {}
          }));
          m = tot;
        } catch (_) {}
      }
      if (mounted) { setPublicStats({ players: p, communities: c, avgRating: r, matches: m }); setStatsLoaded(true); }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Cookie consent ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("cookieConsent")) setCookieConsent(false);
  }, []);

  // ── Redirect if already logged in ──────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user) { setIsRedirecting(true); checkProfileAndRedirect(user.uid); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const checkProfileAndRedirect = async (uid: string) => {
    try {
      const playerDoc = await getDoc(doc(db, "players", uid));
      if (playerDoc.exists()) {
        router.push(playerDoc.data().defaultPage || "/communities");
      } else if (user?.email) {
        const q = query(collection(db, "players"), where("email", "==", user.email));
        const qs = await getDocs(q);
        if (!qs.empty) {
          const existing = qs.docs[0].data();
          await setDoc(doc(db, "players", uid), { ...existing, uid, email: user.email, googlePic: user.photoURL || existing.googlePic || "", googleName: user.displayName || existing.googleName || "" }, { merge: true });
          router.push(existing.defaultPage || "/communities");
        } else { router.push("/onboarding"); }
      } else { router.push("/onboarding"); }
    } catch { router.push("/onboarding"); }
  };

  const handleGoogleLogin = async () => {
    try { setLoginInProgress(true); await login(); }
    catch { setLoginInProgress(false); }
  };

  // ── Features data ───────────────────────────────────────────────────────────
  const features = [
    { icon: <Users />, title: isAr ? "المجتمعات المتعددة" : "Multiple Communities", desc: isAr ? "أنشئ أو انضم لعدة مجتمعات. إحصائياتك منفصلة لكل مجتمع لضمان التنافس العادل!" : "Create or join multiple communities. Stats are separated per community for fair competition!" },
    { icon: <ShieldCheck />, title: isAr ? "صناعة المباريات الذكية" : "Smart Matchmaking", desc: isAr ? "قسّم اللاعبين وشكّل الفرق بشكل عادل بناءً على الطاقات والمراكز." : "Divide players into fair teams based on their stats and positions automatically." },
    { icon: <Sparkles />, title: isAr ? "نظام تقييم الأقران" : "Peer Rating System", desc: isAr ? "تقييم متبادل بين اللاعبين بعد المباريات لضمان دقة طاقات اللاعبين." : "Players rate each other after every match to keep stats accurate and fair." },
    { icon: <Trophy />, title: isAr ? "البطولات والمواسم" : "Tournaments & Seasons", desc: isAr ? "نظام دوري مستمر مع أي فكرة تخطر ببالك. كل شيء مرئي للجميع." : "Continuous league seasons with leaderboards, awards, and ceremonies." },
    { icon: <Medal />, title: isAr ? "الإنجازات" : "Achievements", desc: isAr ? "تابع إنجازاتك والجوائز الموسمية في لوحة إنجازات تعرض تقدمك." : "Track achievements, seasonal awards, and your personal trophy cabinet." },
    { icon: <BellRing />, title: isAr ? "النصائح الذكية" : "Smart Advice", desc: isAr ? "تلقّ نصائح دورية لمساعدتك في تحسين أدائك ومستواك." : "Get periodic AI-powered advice to level up your performance on the pitch." },
    { icon: <Star />, title: isAr ? "رجل المباراة MOTM" : "Man of the Match", desc: isAr ? "اختر أفضل لاعب في كل مباراة ووثّق إنجازه." : "Select and document the best player in every match with shareable MOTM cards." },
    { icon: <MessageSquare />, title: isAr ? "شات المجتمع" : "Community Chat", desc: isAr ? "تواصل مع لاعبي مجتمعك ونظّم تحديات بين المجتمعات." : "Chat, organize matches, and issue challenges to other communities in real time." },
    { icon: <Repeat />, title: isAr ? "تشكيلة ديناميكية" : "Dynamic Lineups", desc: isAr ? "غيّر التشكيلة قبل وأثناء المباراة مع تحذيرات للمراكز الضعيفة." : "Adjust lineups live with alerts when players are weak in their assigned positions." },
    { icon: <Goal />, title: isAr ? "ركلات الترجيح الذكية" : "Smart Penalties", desc: isAr ? "نظام يختار أفضل اللاعبين للتسديد بناءً على طاقاتهم." : "Penalty shootout system that picks the best takers based on player stats." },
    { icon: <Timer />, title: isAr ? "كروت ووقت ضائع" : "Cards & Stoppage", desc: isAr ? "إدارة احترافية للمباريات: كروت ملونة وحساب الوقت الإضافي." : "Professional match management with colored cards and stoppage time tracking." },
    { icon: <Smartphone />, title: isAr ? "تطبيق وتعدد لغات" : "App & Localization", desc: isAr ? "ثبّت الموقع كتطبيق على هاتفك مع دعم كامل للعربية والإنجليزية." : "Install as a PWA app on your phone with full Arabic & English support." },
  ];

  // ── How it works steps ──────────────────────────────────────────────────────
  const steps = [
    { num: "01", icon: <Users className="w-7 h-7" />, color: "from-emerald-500 to-teal-500", title: isAr ? "انضم" : "Join", desc: isAr ? "أنشئ حسابك بجوجل وأكمل ملفك الكروي في دقيقتين." : "Create your account with Google and complete your player profile in 2 minutes." },
    { num: "02", icon: <Star className="w-7 h-7" />, color: "from-amber-500 to-orange-500", title: isAr ? "قيّم" : "Rate", desc: isAr ? "بعد كل مباراة، قيّم زملاءك لضمان دقة الإحصاءات والموازنة." : "After every match, rate teammates to keep stats accurate and fair for everyone." },
    { num: "03", icon: <Trophy className="w-7 h-7" />, color: "from-purple-500 to-violet-500", title: isAr ? "تنافس" : "Compete", desc: isAr ? "تسلق الترتيب، احصد الجوائز، وسيطر على الموسم." : "Climb the leaderboard, win awards, and dominate your community season." },
  ];

  // ── Loading state ───────────────────────────────────────────────────────────
  if (authLoading || isRedirecting) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/30 border-2 border-emerald-500/30">
            <Image src="/logo.jpg" alt="11Players" fill className="object-cover" priority />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="absolute -inset-3 rounded-3xl border-2 border-dashed border-emerald-500/40"
          />
        </div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="mt-6 font-bold text-emerald-400 text-sm tracking-wide"
        >
          {mounted && isAr ? "جاري تحميل 11Players…" : "Loading 11Players…"}
        </motion.p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" dir={isAr ? "rtl" : "ltr"}>

      {/* ── NAVBAR ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full">
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06]" />
        <div className="relative max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md border border-emerald-500/30 shadow-emerald-500/20 bg-slate-100 dark:bg-slate-950">
              <Image src="/logo.jpg" alt="11Players Logo" fill className="object-contain" priority />
            </div>
            <span className="font-black text-lg text-emerald-400 tracking-tight">
              11Players
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SettingsMenu direction="down" />
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-5 overflow-hidden">

        {/* Background: animated pitch gradient */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Deep bg */}
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" />

          {/* Pitch grid lines SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Center circle */}
            <circle cx="50%" cy="50%" r="120" fill="none" stroke="white" strokeWidth="0.8" />
            <circle cx="50%" cy="50%" r="5" fill="white" />
            {/* Center line */}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="0.5" />
          </svg>

          {/* Floating orbs */}
          <motion.div animate={{ y: [-12, 12, -12], x: [8, -8, 8] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-[10%] w-3 h-3 rounded-full bg-emerald-400/40 blur-sm" />
          <motion.div animate={{ y: [10, -10, 10], x: [-6, 6, -6] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[30%] right-[12%] w-2 h-2 rounded-full bg-teal-400/50 blur-sm" />
          <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[25%] left-[15%] w-4 h-4 rounded-full bg-emerald-500/25 blur-md" />
          <motion.div animate={{ y: [6, -14, 6] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-[30%] right-[10%] w-2.5 h-2.5 rounded-full bg-cyan-400/40 blur-sm" />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8 pb-24">

          {/* Logo with glow rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Outer pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-14px] rounded-[28px] border-2 border-emerald-500/40"
            />
            {/* Middle ring */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute inset-[-7px] rounded-[24px] border border-emerald-500/30"
            />
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-[20px] md:rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/30 border-2 border-emerald-500/40 bg-slate-100 dark:bg-slate-950">
              <Image src="/logo.jpg" alt="11Players Logo" fill className="object-contain" priority />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              {isAr ? "منصة كرة القدم الأولى في مجتمعك" : "Your Community Football Platform"}
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tight leading-[1.05]">
              <span className="text-slate-900 dark:text-white">
                {isAr ? "مرحباً في" : "Welcome to"}
              </span>
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">
                11Players
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {t("tagline")}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <motion.button
              onClick={handleGoogleLogin}
              disabled={loginInProgress}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative group inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-950/40 transition-all duration-200 disabled:opacity-60 overflow-hidden cursor-pointer"
            >
              {loginInProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              <span className="relative">{t("cta_login")}</span>
              {!loginInProgress && <ArrowRight className="relative w-4 h-4 group-hover:translate-x-0.5 rtl:rotate-180 transition-transform" />}
            </motion.button>

            <Link href="/guide" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-base transition-all hover:border-emerald-500/50 group">
              {isAr ? "تعرّف على المنصة" : "Learn more"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 rtl:rotate-180 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-slate-700 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-slate-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS SECTION ─────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-5 bg-slate-100/60 dark:bg-slate-950">
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
              {isAr ? "بالأرقام" : "By the Numbers"}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              {isAr ? "منصة حقيقية، أرقام حقيقية" : "Real Platform, Real Numbers"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard value={publicStats.players}     label={t("registered_players")} icon={<Users className="w-5 h-5" />}      color="bg-emerald-600" delay={0}   suffix="+" />
            <StatCard value={publicStats.communities} label={t("active_communities")} icon={<Zap className="w-5 h-5" />}         color="bg-blue-600"    delay={80}  suffix="" />
            <StatCard value={publicStats.avgRating}   label={t("platform_ovr_avg")}   icon={<TrendingUp className="w-5 h-5" />}  color="bg-amber-600"   delay={160} />
            <StatCard value={publicStats.matches}     label={t("matches_recorded")}   icon={<BarChart3 className="w-5 h-5" />}   color="bg-violet-600"  delay={240} suffix="+" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
              {isAr ? "كيف تبدأ" : "How It Works"}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{t("how_it_works")}</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 max-w-xl mx-auto">{isAr ? "ثلاث خطوات لتحويل ملاعبك إلى تجربة احترافية." : "Three steps to turn your local pitch into a professional football experience."}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className={`hidden md:block absolute top-14 ${isAr ? "right-[16.66%] left-[16.66%]" : "left-[16.66%] right-[16.66%]"} h-px bg-slate-300 dark:bg-slate-800`} />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center text-center gap-5 p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
              >
                <div className={`relative w-14 h-14 rounded-2xl ${step.color.includes('emerald') ? 'bg-emerald-600' : step.color.includes('blue') ? 'bg-blue-600' : 'bg-purple-600'} flex items-center justify-center shadow-xl text-white flex-shrink-0`}>
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-300">
                    {step.num}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────────────── */}
      <section className="relative py-24 px-5 bg-slate-100/60 dark:bg-slate-950">
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
              {isAr ? "المميزات" : "Features"}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">{t("why_use_us")}</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">{t("why_use_us_desc")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} gradient={FEATURE_COLORS[i % FEATURE_COLORS.length]} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────── */}
      <section className="relative py-28 px-5 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-8"
        >
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              {isAr ? "جاهز للعب؟" : "Ready to join?"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              {isAr
                ? "سجّل بحسابك وانضم إلى مجتمعك في دقيقتين."
                : "Create your account and join your community in under 2 minutes."}
            </p>
          </div>

          {/* Login button */}
          <motion.button
            onClick={handleGoogleLogin}
            disabled={loginInProgress}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative group inline-flex items-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-950/60 transition-all duration-200 disabled:opacity-60 overflow-hidden"
          >
            {loginInProgress ? <Loader2 className="w-6 h-6 animate-spin" /> : <GoogleIcon />}
            <span className="relative">{t("cta_login")}</span>
            {!loginInProgress && <ArrowRight className="relative w-5 h-5 group-hover:translate-x-0.5 rtl:rotate-180 transition-transform" />}
          </motion.button>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: isAr ? "مجاني بالكامل" : "Completely free" },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: isAr ? "إعداد سريع في دقيقتين" : "Quick 2-minute setup" },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: isAr ? "يعمل كتطبيق" : "Works as an app" },
            ].map((b, i) => (
              <span key={i} className="flex items-center gap-2 font-semibold">{b.icon}{b.label}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── COOKIE CONSENT BANNER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!cookieConsent && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[200]"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-black/20 dark:shadow-black/60 backdrop-blur-xl p-5">
              {/* Solid accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />

              <div className="flex gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Cookie className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{isAr ? "ملفات تعريف الارتباط" : "Cookie Notice"}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t("privacy_banner")}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { localStorage.setItem("cookieConsent", "true"); setCookieConsent(true); }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95"
                >
                  {t("accept")}
                </button>
                <Link
                  href="/cookie"
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 font-semibold text-sm transition-all whitespace-nowrap"
                >
                  {isAr ? "تفاصيل" : "Details"}
                </Link>
                <button
                  onClick={() => setCookieConsent(true)}
                  className="w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
