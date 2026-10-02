"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/contexts/ProSubscriptionContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import {
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Bot,
  Shirt,
  Receipt,
  Building2,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Clock,
  Wallet,
  Lock,
  Globe,
  Send,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrencyEGP, formatCurrencyUSD } from "@/lib/proSubscription";
import PriorityAccessModal from "@/components/subscription/PriorityAccessModal";

interface PlanTier {
  id: string;
  nameEn: string;
  nameAr: string;
  badgeEn?: string;
  badgeAr?: string;
  popular?: boolean;
  priceMonthlyEGP: number;
  priceAnnualEGP?: number;
  priceMonthlyUSD: number;
  priceAnnualUSD?: number;
  isOneTime?: boolean;
  descEn: string;
  descAr: string;
  featuresEn: string[];
  featuresAr: string[];
  gradient: string;
  borderColor: string;
  glowColor: string;
}

export default function ProPassPage() {
  const { user, isOwner, isAdmin } = useAuth();
  const { hasProAccess, hasClubOrganizerAccess, plan: currentPlan, expiresAt } = useProSubscription();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<"EGP" | "USD">("EGP");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [selectedWaitlistPlan, setSelectedWaitlistPlan] = useState<"match_pass" | "pro_captain" | "club_organizer">("pro_captain");
  const [registeredPlans, setRegisteredPlans] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const registered: Record<string, boolean> = {};
    (["match_pass", "pro_captain", "club_organizer"] as const).forEach((p) => {
      try {
        if (localStorage.getItem(`11players_priority_${p}`)) {
          registered[p] = true;
        }
      } catch {}
    });
    setRegisteredPlans(registered);
  }, [isWaitlistOpen]);

  const plans: PlanTier[] = [
    {
      id: "free",
      nameEn: "Grassroots (Free)",
      nameAr: "الهواة (مجاني)",
      priceMonthlyEGP: 0,
      priceMonthlyUSD: 0,
      descEn: "Essential tools for casual weekly pickup games and friendly squad matches.",
      descAr: "الأدوات الأساسية لمباريات كرة القدم الودية الأسبوعية والمجموعات المحلية.",
      featuresEn: [
        "Up to 2 active communities",
        "Standard Player Card & OVR rating",
        "PES 13-position squad balancer",
        "Community chat & match history",
        "Teammate peer rating reviews",
        "Public leaderboard rankings",
      ],
      featuresAr: [
        "الانضمام إلى مجتمعين نشطين",
        "بطاقة لاعب قياسية وتقييم طاقات OVR",
        "موازن التشكيلة الذكي بـ 13 مركزاً PES",
        "محادثة المجتمع وسجل المباريات",
        "التقييم المتبادل بين الزملاء",
        "تصفح قوائم صدارة اللاعبين",
      ],
      gradient: "from-slate-900 to-slate-950",
      borderColor: "border-slate-800",
      glowColor: "shadow-slate-900/50",
    },
    {
      id: "match_pass",
      nameEn: "Match Day Pass",
      nameAr: "تذكرة المباراة الواحدة",
      badgeEn: "QUICK PASS",
      badgeAr: "تذكرة سريعة",
      isOneTime: true,
      priceMonthlyEGP: 25,
      priceMonthlyUSD: 0.99,
      descEn: "Single-match tournament boost for tactical scouting and post-match media.",
      descAr: "تذكرة سريعة لمباراة واحدة تشمل الاستكشاف التكتيكي وتصدير ميديا المباراة.",
      featuresEn: [
        "1-Match 11AI Tactical Scouting Report",
        "1-Time 3D Kit & Crest HD PNG Export",
        "Post-Match Newspaper Front Page Download",
        "Valid for 24 hours on any single match",
      ],
      featuresAr: [
        "تقرير استكشاف تكتيكي 11AI لمباراة واحدة",
        "تصدير شعار وطقم 3D عالي الدقة لمرة واحدة",
        "تحميل صفحة جريدة المباراة الأولى بدقة HD",
        "صلاحية كاملة لمدة 24 ساعة لأي مباراة",
      ],
      gradient: "from-slate-900 via-slate-900 to-slate-950",
      borderColor: "border-slate-700/80",
      glowColor: "shadow-slate-800/40",
    },
    {
      id: "pro_captain",
      nameEn: "PRO Captain Pass",
      nameAr: "اشتراك كابتن النخبة",
      badgeEn: "MOST POPULAR",
      badgeAr: "الأكثر طلباً ⭐",
      popular: true,
      priceMonthlyEGP: 59,
      priceAnnualEGP: 49,
      priceMonthlyUSD: 1.49,
      priceAnnualUSD: 0.99,
      descEn: "Full tactical analytics, 3D kit studio, golden verified badge & unlimited communities.",
      descAr: "تحليلات تكتيكية كاملة، استوديو أطقم 3D، شارة الكابتن الذهبية، ومجتمعات مفتوحة.",
      featuresEn: [
        "Unlimited 11AI Pre-Match Scouting Reports",
        "Full 3D Custom Kit & Crest Builder Studio",
        "Retro Sports Newspaper Generator ('HAGOOZAT DAILY')",
        "Golden Verified PRO Badge on Card & Chat",
        "Priority Match Captain Draft Slotting",
        "PDF & Excel Season Stats Exporter",
        "Join Unlimited Communities across Egypt",
      ],
      featuresAr: [
        "تقارير استكشاف تكتيكي 11AI غير محدودة",
        "استوديو مصمم الأطقم والشعارات 3D وتصدير مفتوح",
        "مولد جريدة المباراة الكلاسيكية ('HAGOOZAT DAILY')",
        "شارة PRO الذهبية الموثقة على البطاقة والمحادثات",
        "الأولوية في مسودة اختيارات الكباتن للمباريات",
        "تصدير إحصائيات الموسم إلى PDF و Excel",
        "الانضمام إلى مجتمعات وملاعب غير محدودة",
      ],
      gradient: "from-amber-500/10 via-slate-900 to-slate-950",
      borderColor: "border-amber-500/40",
      glowColor: "shadow-amber-500/20",
    },
    {
      id: "club_organizer",
      nameEn: "Club & Turf Organizer",
      nameAr: "منظم الأندية والملاعب",
      badgeEn: "ORGANIZER",
      badgeAr: "للمنظمين والملاعب 🏟️",
      priceMonthlyEGP: 179,
      priceAnnualEGP: 149,
      priceMonthlyUSD: 3.99,
      priceAnnualUSD: 2.99,
      descEn: "Complete manager portal for turf rent collection, live 2D pitch broadcast & derbies.",
      descAr: "بوابة متكاملة لإدارة حجز الملعب، تقاسم الحساب، البث المباشر، والديربيات.",
      featuresEn: [
        "All PRO Captain features included",
        "Turf Rent Split-Bill Calculator & WhatsApp Links",
        "Live Spectator Broadcaster (2D pitch & voice commentary)",
        "Derby & H2H Captain Rivalry Engine",
        "Community Broadcast Announcements with 11AI Enhancer",
        "Pitch Booking & Slot Schedule Manager",
        "Dedicated 24/7 Organizer Support Desk",
      ],
      featuresAr: [
        "يشمل جميع مميزات اشتراك كابتن النخبة",
        "حاسبة تقاسم حجز الملعب وتذكيرات الدفع بالواتساب",
        "البث المباشر للمباراة مع التعليق الصوتي ومؤشر الزخم",
        "محرك الديربيات والمواجهات التاريخية المباشرة (H2H)",
        "بث إعلانات المجتمع مع محسّن النصوص بالذكاء الاصطناعي",
        "مدير مواعيد وحجوزات ملاعب النجيل",
        "مكتب دعم فني ذو أولوية للمنظمين 24/7",
      ],
      gradient: "from-emerald-500/10 via-slate-900 to-slate-950",
      borderColor: "border-emerald-500/40",
      glowColor: "shadow-emerald-500/20",
    },
  ];

  const faqs = [
    {
      qEn: "What currency are the plans billed in?",
      qAr: "بأي عملة يتم احتساب الاشتراكات؟",
      aEn: "All plans are billed in Egyptian Pounds (EGP). We tailored the pricing specifically to be affordable for amateur football players and community organizers across Egypt.",
      aAr: "جميع الاشتراكات تُحسب بالجنيه المصري (EGP). تم تسعير الباقات بعناية لتكون مناسبة وفي متناول جميع لاعبي ومحبي كرة القدم ومنظمي الملاعب في مصر.",
    },
    {
      qEn: "Which Egyptian payment methods will be available?",
      qAr: "ما هي وسائل الدفع المصرية التي ستتوفر؟",
      aEn: "We are currently completing the integration for InstaPay (IPN), Vodafone Cash / Mobile Wallets (Orange, Etisalat, WE), Fawry pay codes, and Visa / Mastercard debit & credit cards.",
      aAr: "نقوم حالياً باستكمال الربط التقني لتوفير الدفع عبر إنستاباي (InstaPay IPN)، محافظ فودافون كاش والمحافظ الإلكترونية (أورنج، اتصالات، وي)، كود فوري، وبطاقات الفيزا والماستركارد البنكية.",
    },
    {
      qEn: "Can admins or the owner grant subscriptions directly?",
      qAr: "هل يمكن للآدمن أو مالك المنصة تفعيل الاشتراك للاعبين مباشرة؟",
      aEn: "Yes! The platform owner and verified administrators have administrative authority in the Admin Panel to grant free PRO Captain or Club Organizer access to any player instantly.",
      aAr: "نعم! يمتلك مالك المنصة والمسؤولون صلاحية إدارية في لوحة التحكم لتفعيل اشتراك كابتن النخبة أو منظم الملاعب لأي لاعب مباشرة وبشكل فوري.",
    },
    {
      qEn: "Can I cancel or switch billing cycles anytime?",
      qAr: "هل يمكنني التبديل بين الدفع الشهري والسنوي؟",
      aEn: "Yes! You can switch from monthly to annual billing to enjoy a 25% discount, and subscriptions comply with Egyptian Consumer Protection Law (Law 181/2018).",
      aAr: "نعم! يمكنك التبديل إلى الاشتراك السنوي للاستفادة من خصم يصل إلى 25%، مع خضوع الاشتراكات لقانون حماية المستهلك المصري رقم 181 لسنة 2018.",
    },
  ];

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Background Ambience */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-amber-500/5 to-transparent blur-3xl opacity-50" />
          <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase shadow-lg shadow-emerald-950/40"
            >
              <Crown className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? "باقات اشتراك 11Players PRO Pass" : "11Players PRO Pass Memberships"}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white"
            >
              {isAr ? (
                <>
                  اختر الباقة المناسبة{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    لطموحك الكروي
                  </span>
                </>
              ) : (
                <>
                  Choose the Plan Built for{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Your Football Ambition
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed"
            >
              {isAr
                ? "باقات مميزة بالجنيه المصري (EGP) صُممت لخدمة اللاعبين التنافسيين، الكباتن، ومديري الملاعب، مع الحفاظ على متعة اللعب الأساسي مجاناً للجميع."
                : "Tailored memberships priced in Egyptian Pounds (EGP) for competitive players, captains, and turf managers, while preserving core matchmaking free for all."}
            </motion.p>

            {/* Currency & Billing Cycle Toggles */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            >
              {/* Monthly / Annual Billing Toggle */}
              <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    !isAnnual ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isAr ? "دفع شهري" : "Monthly Billing"}
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAnnual
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{isAr ? "دفع سنوي" : "Annual Billing"}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-extrabold border border-emerald-500/30">
                    {isAr ? "خصم 25% (شهران مجاناً)" : "2 Months Free (-25%)"}
                  </span>
                </button>
              </div>

              {/* Currency Selector (EGP / USD) */}
              <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
                <button
                  onClick={() => setCurrency("EGP")}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                    currency === "EGP"
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{isAr ? "ج.م (EGP)" : "EGP (ج.م)"}</span>
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                    currency === "USD"
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>USD ($)</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Pricing Cards Grid (4 Tiers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto">
            {plans.map((plan, idx) => {
              const priceEgp = plan.isOneTime
                ? plan.priceMonthlyEGP
                : isAnnual && plan.priceAnnualEGP
                ? plan.priceAnnualEGP
                : plan.priceMonthlyEGP;

              const priceUsd = plan.isOneTime
                ? plan.priceMonthlyUSD
                : isAnnual && plan.priceAnnualUSD
                ? plan.priceAnnualUSD
                : plan.priceMonthlyUSD;

              const displayPrice = currency === "EGP"
                ? formatCurrencyEGP(priceEgp, isAr)
                : formatCurrencyUSD(priceUsd, isAr);

              const isUserOwner = isOwner;
              const isCurrent =
                (plan.id === "club_organizer" && (isUserOwner || hasClubOrganizerAccess)) ||
                (plan.id === "pro_captain" && !isUserOwner && !hasClubOrganizerAccess && hasProAccess) ||
                (plan.id === "free" && !hasProAccess && !hasClubOrganizerAccess && !isUserOwner);

              const isRegistered = !!registeredPlans[plan.id];

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * idx, duration: 0.4 }}
                  className={`relative p-6 sm:p-7 rounded-3xl border bg-slate-900/90 flex flex-col justify-between shadow-2xl transition-all overflow-hidden ${
                    isCurrent
                      ? "border-emerald-500/90 ring-2 ring-emerald-500/30"
                      : plan.popular
                      ? "border-amber-400/80 ring-2 ring-amber-400/20"
                      : plan.borderColor
                  }`}
                >
                  {/* Badge */}
                  {isCurrent ? (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-xl bg-emerald-500 text-slate-950 font-black text-[11px] tracking-wider uppercase shadow-lg shadow-emerald-500/20 whitespace-nowrap z-10">
                      {isAr ? "خطتك الحالية (مفعّلة 👑)" : "ACTIVE PLAN (GRANTED 👑)"}
                    </div>
                  ) : isRegistered ? (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[11px] tracking-wider uppercase shadow-md shadow-emerald-500/20 whitespace-nowrap z-10">
                      {isAr ? "قائمة الأولوية ✨" : "PRIORITY LIST ✨"}
                    </div>
                  ) : plan.badgeEn ? (
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-xl font-black text-[11px] tracking-wider uppercase whitespace-nowrap z-10 ${
                        plan.popular
                          ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                          : "bg-slate-800 text-slate-300 border-x border-b border-slate-700"
                      }`}
                    >
                      {isAr ? plan.badgeAr : plan.badgeEn}
                    </div>
                  ) : null}

                  <div className="space-y-6 pt-3">
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {isAr ? plan.nameAr : plan.nameEn}
                      </h3>
                      <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed min-h-[36px]">
                        {isAr ? plan.descAr : plan.descEn}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="py-4 border-y border-slate-800/80">
                      {plan.id === "free" ? (
                        <div className="text-3xl font-black text-white font-mono">
                          {currency === "EGP" ? (isAr ? "0 ج.م" : "0 EGP") : "$0"}
                          <span className="text-xs text-slate-400 font-sans font-bold ms-2">
                            {isAr ? "/ مجاناً دائماً" : "/ Free forever"}
                          </span>
                        </div>
                      ) : plan.isOneTime ? (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-3xl font-black font-mono text-white tracking-tight">
                            {displayPrice}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            / {isAr ? "مباراة واحدة" : "single match"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-3xl font-black font-mono text-white tracking-tight">
                            {displayPrice}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            / {isAr ? (isAnnual ? "شهر (يُدفع سنوياً)" : "شهر") : isAnnual ? "mo (billed yearly)" : "month"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        {isAr ? "المميزات المتضمنة:" : "INCLUDED FEATURES:"}
                      </p>
                      <ul className="space-y-2">
                        {(isAr ? plan.featuresAr : plan.featuresEn).map((ft, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300 font-medium leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{ft}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button: Current, Free, or Clickable Priority Access */}
                  <div className="pt-6">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-black text-xs bg-emerald-600/90 text-white cursor-default shadow-md shadow-emerald-600/20"
                      >
                        {isAr ? "خطتك الحالية (مفعّلة 👑)" : "Current Active Plan"}
                      </button>
                    ) : plan.id === "free" ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 text-slate-400 cursor-default border border-slate-700/60"
                      >
                        {isAr ? "الخطة القياسية متضمنة" : "Default Included Plan"}
                      </button>
                    ) : isRegistered ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWaitlistPlan(plan.id as any);
                          setIsWaitlistOpen(true);
                        }}
                        className="w-full py-3 px-4 rounded-xl font-black text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isAr ? "أنت في قائمة الأولوية ✨ (20% خصم)" : "On Priority List ✨ (20% Off)"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWaitlistPlan(plan.id as any);
                          setIsWaitlistOpen(true);
                        }}
                        className="w-full py-3 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? "انضم لقائمة الأولوية (خصم 20%)" : "Join Priority Access (20% Off)"}</span>
                        <Send className="w-3 h-3 rtl:-scale-x-100" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Official Egyptian Gateway Status Notice */}
          <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {isAr
                    ? "بوابات الدفع الإلكتروني بالجنيه المصري قيد الربط الفني"
                    : "Egyptian Payment Gateways Under Technical Integration"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "جاري ربط وسائل الدفع الإلكترونية الرسمية (إنستاباي InstaPay، فودافون كاش، فوري، وبطاقات فيزا وماستركارد)."
                    : "Connecting official payment gateways (InstaPay, Vodafone Cash, Fawry, Visa & Mastercard)."}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 font-medium">
                {isAr
                  ? "💡 يمكن لمالك المنصة ومسؤولي النظام تفعيل اشتراك PRO مباشرة لأي لاعب أو صديق عبر لوحة التحكم."
                  : "💡 Platform Owner & Admins can grant free PRO access to any player directly from the Admin Panel."}
              </span>
              {isOwner || isAdmin ? (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
                >
                  {isAr ? "لوحة الإدارة" : "Admin Panel"}
                </Link>
              ) : null}
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="space-y-6 pt-6 max-w-6xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? "لماذا يختار اللاعبون باقات PRO Pass؟" : "Why Players Choose PRO Pass?"}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                {isAr
                  ? "أدوات احترافية صُممت لرفع جودة المباريات والتنظيم لجميع لاعبي كرة القدم التنافسية"
                  : "Professional tools engineered to elevate match quality and organization"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <Bot className="w-5 h-5 text-emerald-400" />,
                  titleEn: "11AI Tactical Scout",
                  titleAr: "استكشاف تكتيكي بالذكاء الاصطناعي",
                  descEn: "Pre-match opposition threat index, key danger players, and recommended counter-tactics.",
                  descAr: "مؤشر خطورة الخصم، أخطر اللاعبين، والتكتيكات الدفاعية والهجومية المضادة المقترحة.",
                },
                {
                  icon: <Shirt className="w-5 h-5 text-amber-400" />,
                  titleEn: "3D Kit & Crest Studio",
                  titleAr: "استوديو الأطقم والشعارات 3D",
                  descEn: "Design custom jersey patterns, metallic emblems, and download high-resolution PNG assets.",
                  descAr: "صمّم قمصان فريقك وشعارات الملاعب بجودة عالية مع تصدير صور PNG بدقة فائقة.",
                },
                {
                  icon: <Crown className="w-5 h-5 text-yellow-400" />,
                  titleEn: "Golden PRO Badge",
                  titleAr: "شارة PRO الذهبية",
                  descEn: "Verified glowing golden badge across all community lineups, leaderboards, and chats.",
                  descAr: "شارة ذهبية موثقة تبرز في تشكيلات المباريات، قوائم الصدارة، وغرف المحادثة.",
                },
                {
                  icon: <Receipt className="w-5 h-5 text-teal-400" />,
                  titleEn: "Turf Split-Bill Calculator",
                  titleAr: "تقاسم حجز الملعب والمصروفات",
                  descEn: "Calculate rental shares per player, generate WhatsApp payment reminder links, and track collection.",
                  descAr: "احسب نصيب كل لاعب في حجز الملعب تلقائياً، مع روابط تذكير واتساب ومتابعة الدفع.",
                },
              ].map((ft, i) => (
                <div
                  key={i}
                  className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2.5"
                >
                  <div className="p-2.5 bg-slate-950 rounded-xl w-fit border border-slate-800">{ft.icon}</div>
                  <h4 className="font-black text-sm text-white">{isAr ? ft.titleAr : ft.titleEn}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{isAr ? ft.descAr : ft.descEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Full Feature Comparison Matrix */}
          <div className="space-y-6 pt-8 max-w-5xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? "جدول المقارنة الشامل بين الباقات" : "Full Feature Comparison Matrix"}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                {isAr ? "تعرف بالتفصيل على ما تقدمه كل باقة لاحتياجاتك الكروية والتنظيمية" : "Detailed breakdown of capabilities across all membership tiers"}
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-300">
                    <th className="py-4 px-5 text-start font-black">{isAr ? "الميزة / القدرة" : "Feature / Capability"}</th>
                    <th className="py-4 px-3 text-center font-bold text-slate-400">{isAr ? "الهواة (مجاني)" : "Free"}</th>
                    <th className="py-4 px-3 text-center font-bold text-slate-300">{isAr ? "تذكرة المباراة" : "Match Pass"}</th>
                    <th className="py-4 px-3 text-center font-black text-amber-400">{isAr ? "كابتن PRO" : "PRO Captain"}</th>
                    <th className="py-4 px-3 text-center font-black text-emerald-400">{isAr ? "منظم الملاعب" : "Club Org"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                  {[
                    { nameEn: "13-Position PES Squad Balancer", nameAr: "موازن الفرق الذكي بـ 13 مركزاً", free: "✓", match: "✓", pro: "✓", club: "✓" },
                    { nameEn: "Player Card & OVR History", nameAr: "بطاقة اللاعب وتاريخ طاقات OVR", free: "✓", match: "✓", pro: "✓", club: "✓" },
                    { nameEn: "Community Chat & Matches", nameAr: "محادثة المجتمع وسجل المباريات", free: "✓", match: "✓", pro: "✓", club: "✓" },
                    { nameEn: "Max Active Communities", nameAr: "الحد الأقصى للمجتمعات", free: isAr ? "2 مجتمع" : "2", match: isAr ? "2 مجتمع" : "2", pro: isAr ? "غير محدود" : "Unlimited", club: isAr ? "غير محدود" : "Unlimited" },
                    { nameEn: "11AI Tactical Pre-Match Scout", nameAr: "تقارير استكشاف 11AI التكتيكية", free: "—", match: isAr ? "1 مباراة" : "1 Match", pro: isAr ? "غير محدود" : "Unlimited", club: isAr ? "غير محدود" : "Unlimited" },
                    { nameEn: "3D Kit & Crest Builder Studio", nameAr: "استوديو الأطقم والشعارات 3D", free: "—", match: isAr ? "تصدير 1" : "1 Export", pro: isAr ? "تصدير مفتوح" : "Unlimited", club: isAr ? "تصدير مفتوح" : "Unlimited" },
                    { nameEn: "Match Newspaper ('HAGOOZAT DAILY')", nameAr: "جريدة المباراة التاريخية", free: "—", match: isAr ? "1 جريدة" : "1 Edition", pro: isAr ? "غير محدود" : "Unlimited", club: isAr ? "غير محدود" : "Unlimited" },
                    { nameEn: "Golden Verified Badge", nameAr: "شارة PRO الذهبية الموثقة", free: "—", match: "—", pro: "✓", club: "✓" },
                    { nameEn: "Turf Split-Bill Calculator & WhatsApp", nameAr: "حاسبة تقاسم الحجز وروابط واتساب", free: "—", match: "—", pro: "—", club: "✓" },
                    { nameEn: "Live 2D Pitch Broadcaster", nameAr: "بث المباريات المباشر 2D مع تعليق", free: "—", match: "—", pro: "—", club: "✓" },
                    { nameEn: "Derby & H2H Captain Rivalry Engine", nameAr: "محرك الديربيات والمواجهات المباشرة", free: "—", match: "—", pro: "—", club: "✓" },
                    { nameEn: "Priority 24/7 Organizer Support", nameAr: "دعم فني ذو أولوية 24/7", free: "—", match: "—", pro: "—", club: "✓" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-white text-xs">{isAr ? row.nameAr : row.nameEn}</td>
                      <td className="py-3.5 px-3 text-center text-slate-400">{row.free}</td>
                      <td className="py-3.5 px-3 text-center text-slate-300">{row.match}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-amber-300">{row.pro}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-300">{row.club}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="max-w-3xl mx-auto space-y-6 pt-6">
            <div className="flex items-center gap-2 justify-center">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="text-2xl font-black text-white">
                {isAr ? "الأسئلة الشائعة حول الاشتراكات" : "Frequently Asked Questions"}
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <span className="rtl:text-right ltr:text-left">{isAr ? faq.qAr : faq.qEn}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${
                          isOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                              height: { duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] },
                              opacity: { duration: 0.25, delay: 0.05 },
                            },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                              opacity: { duration: 0.15 },
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 rtl:text-right ltr:text-left">
                            {isAr ? faq.aAr : faq.aEn}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Priority Access Modal */}
        <PriorityAccessModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          defaultPlanId={selectedWaitlistPlan}
        />
      </div>
    </ProtectedRoute>
  );
}
