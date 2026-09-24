"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, Loader2, BellRing, Sparkles,
  Smartphone, Trophy, Medal, Star, MessageSquare, Repeat,
  Goal, Timer, ArrowRight, CheckCircle2, Zap,
  TrendingUp, BarChart3
} from "lucide-react";
import SettingsMenu from "@/components/layout/SettingsMenu";


// ── Stat Card (Clean Authentic Metrics) ───────────────────────────────────────
function StatCard({
  value, label, icon, color, delay, suffix = ""
}: {
  value: number; label: string; icon: React.ReactNode;
  color: string; delay: number; suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: delay / 1000 }}
      className="relative group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center gap-3 shadow-sm hover:border-emerald-500/40 transition-colors duration-200">
        <div className={`absolute top-0 left-0 right-0 h-1 ${color}`} />
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-md`}>
          {icon}
        </div>
        <div className="stat-value text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
          {value > 0 ? `${value}${suffix}` : "0"}
        </div>
        <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 text-center leading-snug">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature Card Colors (Brand Harmonized, Zero Purple) ──────────────────────
const FEATURE_COLORS = [
  "bg-emerald-600",
  "bg-teal-600",
  "bg-slate-700",
  "bg-blue-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-emerald-700",
  "bg-teal-700",
  "bg-slate-800",
  "bg-blue-700",
  "bg-emerald-600",
  "bg-teal-600",
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

  const [loginInProgress, setLoginInProgress] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [publicStats, setPublicStats] = useState({ players: 0, communities: 0, avgRating: 71, matches: 0 });
  const [mounted, setMounted] = useState(false);

  // ── Ensure SSR/client hydration consistency ───────────────────────────
  useEffect(() => { setMounted(true); }, []);

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


  // ── Redirect if already logged in ──────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user) { setIsRedirecting(true); checkProfileAndRedirect(user.uid); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const checkProfileAndRedirect = async (uid: string) => {
    try {
      const playerDoc = await getDoc(doc(db, "players", uid));
      if (playerDoc.exists()) {
        router.push(playerDoc.data().defaultPage || "/community");
      } else if (user?.email) {
        const q = query(collection(db, "players"), where("email", "==", user.email));
        const qs = await getDocs(q);
        if (!qs.empty) {
          const existing = qs.docs[0].data();
          await setDoc(doc(db, "players", uid), { ...existing, uid, email: user.email, googlePic: user.photoURL || existing.googlePic || "", googleName: user.displayName || existing.googleName || "" }, { merge: true });
          router.push(existing.defaultPage || "/community");
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
    { num: "01", icon: <Users className="w-7 h-7" />, color: "from-emerald-600 to-teal-600", title: isAr ? "انضم" : "Join", desc: isAr ? "أنشئ حسابك بجوجل وأكمل ملفك الكروي في دقيقتين." : "Create your account with Google and complete your player profile in 2 minutes." },
    { num: "02", icon: <Star className="w-7 h-7" />, color: "from-amber-600 to-orange-600", title: isAr ? "قيّم" : "Rate", desc: isAr ? "بعد كل مباراة، قيّم زملاءك لضمان دقة الإحصاءات والموازنة." : "After every match, rate teammates to keep stats accurate and fair for everyone." },
    { num: "03", icon: <Trophy className="w-7 h-7" />, color: "from-blue-600 to-cyan-600", title: isAr ? "تنافس" : "Compete", desc: isAr ? "تسلق الترتيب، احصد الجوائز، وسيطر على الموسم." : "Climb the leaderboard, win awards, and dominate your community season." },
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
      <section className="relative min-h-[92svh] flex flex-col items-center justify-center text-center px-5 overflow-hidden">
        {/* Pitch grid lines SVG background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <circle cx="50%" cy="50%" r="120" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="50%" cy="50%" r="4" fill="currentColor" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-7 pt-12 pb-20">

          {/* Logo */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-500/30 bg-slate-100 dark:bg-slate-950">
            <Image src="/logo.jpg" alt="11Players Logo" fill className="object-contain" priority />
          </div>

          {/* Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isAr ? "منصة إدارة كرة القدم وموازنة الفرق" : "Football Matchmaking & Community Platform"}</span>
            </span>
          </div>

          {/* Main heading */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
              <span className="text-slate-900 dark:text-white">
                {isAr ? "مرحباً في" : "Welcome to"}
              </span>{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                11Players
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {t("tagline")}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loginInProgress}
                className="inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-950/20 transition-colors disabled:opacity-60 cursor-pointer min-h-[44px]"
                aria-label={t("cta_login")}
              >
                {loginInProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                <span>{t("cta_login")}</span>
                {!loginInProgress && <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              </button>

              <Link
                href="/guide"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-base transition-colors hover:border-emerald-500/50 min-h-[44px]"
              >
                <span>{isAr ? "تعرّف على المنصة" : "Learn more"}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>

            {/* Legal Agreement Disclaimer */}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-2 max-w-md">
              {isAr ? (
                <>
                  بالمتابعة، فإنك توافق على{" "}
                  <Link href="/tos" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                    شروط الخدمة
                  </Link>{" "}
                  و{" "}
                  <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                    سياسة الخصوصية
                  </Link>{" "}
                  لمنصة 11Players.
                </>
              ) : (
                <>
                  By continuing, you agree to 11Players Platform{" "}
                  <Link href="/tos" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
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
            <span className="inline-block px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
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
            <StatCard value={publicStats.matches}     label={t("matches_recorded")}   icon={<BarChart3 className="w-5 h-5" />}   color="bg-slate-700"   delay={240} suffix="+" />
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
            <span className="inline-block px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
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
                <div className={`relative w-14 h-14 rounded-2xl ${step.color.includes('emerald') ? 'bg-emerald-600' : step.color.includes('amber') ? 'bg-amber-600' : 'bg-blue-600'} flex items-center justify-center shadow-xl text-white flex-shrink-0`}>
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-300">
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
            <span className="inline-block px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
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
    </main>
  );
}

