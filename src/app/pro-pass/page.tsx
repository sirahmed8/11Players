"use client";

import React, { useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import {
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Shield,
  Bot,
  Shirt,
  BarChart3,
  Receipt,
  Users,
  CreditCard,
  Building,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Star,
  Flame,
  Award,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface PlanTier {
  id: string;
  nameEn: string;
  nameAr: string;
  badgeEn?: string;
  badgeAr?: string;
  popular?: boolean;
  priceMonthlyUSD: number;
  priceAnnualUSD: number;
  priceMonthlyEGP: number;
  priceAnnualEGP: number;
  descEn: string;
  descAr: string;
  featuresEn: string[];
  featuresAr: string[];
  buttonTextEn: string;
  buttonTextAr: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
}

export default function ProPassPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<"EGP" | "USD">("EGP");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "fawry" | "vodafone" | "paypal">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const plans: PlanTier[] = [
    {
      id: "free",
      nameEn: "Grassroots (Free)",
      nameAr: "الهواة (مجاني)",
      priceMonthlyUSD: 0,
      priceAnnualUSD: 0,
      priceMonthlyEGP: 0,
      priceAnnualEGP: 0,
      descEn: "Essential tools for casual local football matches and friendly squad games.",
      descAr: "الأدوات الأساسية لمباريات كرة القدم الودية والمجموعات المحلية.",
      featuresEn: [
        "1 Active Community limit",
        "Standard Player Card & OVR rating",
        "Basic Match Generator & Lineup Picker",
        "Community Chat & Match History",
        "Peer Rating System",
      ],
      featuresAr: [
        "حد مجتمع نشط واحد",
        "بطاقة لاعب قياسية وتقييم طاقات OVR",
        "مولد المباريات وتشكيل الفرق الأساسي",
        "محادثة المجتمع وسجل المباريات",
        "نظام التقييم المتبادل بين اللاعبين",
      ],
      buttonTextEn: "Current Plan",
      buttonTextAr: "خطة حالية",
      gradient: "from-slate-800 to-slate-900",
      borderColor: "border-slate-800",
      glowColor: "shadow-slate-900/50",
    },
    {
      id: "pro_captain",
      nameEn: "PRO Captain Pass",
      nameAr: "اشتراك PRO الكابتن",
      badgeEn: "MOST POPULAR ⭐",
      badgeAr: "الأكثر طلباً ⭐",
      popular: true,
      priceMonthlyUSD: 4.99,
      priceAnnualUSD: 3.99,
      priceMonthlyEGP: 149,
      priceAnnualEGP: 119,
      descEn: "Unlock AI Match Analytics, 3D Kit Builder, Unlimited Communities & Golden Card Badge.",
      descAr: "افتح تحليلات الذكاء الاصطناعي، مصمم الأطقم 3D، المجتمعات المفتوحة، وشارة الكابتن الذهبية.",
      featuresEn: [
        "⭐ Unlimited Communities & Roster Joins",
        "🤖 AI Match Scout & Tactical Analyst Reports",
        "🎨 3D Custom Kit & Crest Builder Studio",
        "👑 Verified Golden PRO Badge on Card & Chat",
        "📊 PDF & Excel Season Stats Exporter",
        "⚡ Priority Match Draft & Captain Slotting",
        "🎥 Post-Match Newspaper & Summary Exporter",
      ],
      featuresAr: [
        "⭐ مجتمعات غير محدودة والانضمام للفرق",
        "🤖 تقارير الذكاء الاصطناعي للتحليل التكتيكي للمباريات",
        "🎨 استوديو مصمم الأطقم للشعار والملابس 3D",
        "👑 شارة PRO الذهبية الموثقة على البطاقة والمحادثة",
        "📊 تصدير إحصائيات الموسم إلى PDF و Excel",
        "⚡ الأولوية في مسودة خيارات المباريات والكباتن",
        "🎥 تصدير جريدة وملخصات المباريات الممتازة",
      ],
      buttonTextEn: "Upgrade to PRO Captain",
      buttonTextAr: "الترقية إلى PRO الكابتن",
      gradient: "from-amber-600 via-amber-500 to-yellow-400 text-slate-950",
      borderColor: "border-amber-400",
      glowColor: "shadow-amber-500/25",
    },
    {
      id: "club_organizer",
      nameEn: "Club & Turf Owner",
      nameAr: "منظم النادي وصاحب الملعب",
      badgeEn: "ENTERPRISE",
      badgeAr: "للمنظمين والملاعب",
      priceMonthlyUSD: 14.99,
      priceAnnualUSD: 11.99,
      priceMonthlyEGP: 449,
      priceAnnualEGP: 359,
      descEn: "Complete manager portal for turf field booking, automated split-bill & revenue reports.",
      descAr: "بوابة شاملة لإدارة حجز الملعب، التقاسم التلقائي للمصروفات، وتقارير الإيرادات.",
      featuresEn: [
        "All PRO Captain features included",
        "🏟️ Turf Pitch Booking & Slot Schedule Manager",
        "💸 Automated Split-Bill & WhatsApp Payment Triggers",
        "📈 Revenue, Attendance & Financial Analytics",
        "📢 Broadcast Announcements & Sponsored Banners",
        "🛡️ Dedicated 24/7 Priority Support Desk",
      ],
      featuresAr: [
        "يشمل جميع مميزات PRO الكابتن",
        "🏟️ مدير حجز ملاعب النجيل وجدول المواعيد",
        "💸 الحساب التلقائي لتقاسم الحجز وتذكيرات الواتساب",
        "📈 تحليلات الإيرادات ونسب حضور اللاعبين",
        "📢 بث الإعلانات والبنرات الرعاية للمجتمع",
        "🛡️ مكتب دعم فني مخصص على مدار 24/7",
      ],
      buttonTextEn: "Get Club Organizer Pass",
      buttonTextAr: "احصل على اشتراك المنظم",
      gradient: "from-purple-600 via-violet-500 to-indigo-500",
      borderColor: "border-purple-400",
      glowColor: "shadow-purple-500/25",
    },
  ];

  const faqs = [
    {
      qEn: "How does the PRO Pass upgrade work?",
      qAr: "كيف يعمل اشتراك PRO Pass؟",
      aEn: "Upon activating your PRO Pass, all premium features—including AI Match Scout reports, 3D Kit Builder customization, and the Golden Card Badge—are instantly unlocked across your profile and all your joined communities.",
      aAr: "بمجرد تفعيل اشتراك PRO Pass، سيتم فتح جميع الميزات الممتازة فوراً — بما في ذلك تقارير الذكاء الاصطناعي، مصمم الأطقم 3D، والشارة الذهبية عبر ملفك الشخصي وجميع مجتمعاتك.",
    },
    {
      qEn: "Which payment methods are supported?",
      qAr: "ما هي وسائل الدفع المدعومة؟",
      aEn: "We support Visa & Mastercard credit/debit cards, PayPal, Fawry pay codes, Vodafone Cash, and InstaPay wallet transfers. Payment API gateway keys can be configured seamlessly.",
      aAr: "ندعم بطاقات الفيزا والماستركارد، PayPal، كود فوري، فودافون كاش، وتحويلات إنستاباي. يتم ربط بوابات الدفع الإلكتروني بشكل مباشر.",
    },
    {
      qEn: "Can I switch between monthly and annual billing?",
      qAr: "هل يمكنني التبديل بين الدفع الشهري والسنوي؟",
      aEn: "Yes! You can upgrade to annual billing anytime to lock in a 25% discount, or manage your subscription directly from your account settings.",
      aAr: "نعم! يمكنك الترقية إلى الاشتراك السنوي في أي وقت للاستفادة من خصم 25%، أو إدارة اشتراكك مباشرة من إعدادات حسابك.",
    },
    {
      qEn: "What happens if I manage a turf field or organize multiple leagues?",
      qAr: "ماذا لو كنت أدير ملعباً أو أنظم عدة دوريات؟",
      aEn: "The Club & Turf Owner plan provides full access to pitch reservation slots, automatic split-bill calculators, and financial revenue dashboards tailored for organizers.",
      aAr: "تمنحك خطة منظم النادي وصاحب الملعب تحكماً كاملاً في مواعيد حجز الملعب، حاسبة تقاسم الحجز، وتقارير الإيرادات المالية المخصصة للمنظمين.",
    },
  ];

  const handleSelectPlan = (plan: PlanTier) => {
    if (plan.id === "free") {
      toast.success(isAr ? "أنت حالياً على الخطة المجانية" : "You are currently on the Free plan");
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaymentModalOpen(false);
      toast.custom(
        (t) => (
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/50 shadow-2xl rounded-2xl p-4 flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shrink-0">
              👑
            </div>
            <div>
              <p className="font-black text-sm text-amber-300">
                {isAr ? "تم تفعيل اشتراك PRO Pass بنجاح! 🎉" : "PRO Pass Activated Successfully! 🎉"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? `أهلاً بك في فئة ${selectedPlan?.nameAr}. استمتع بجميع الميزات الممتازة!`
                  : `Welcome to ${selectedPlan?.nameEn}. Enjoy all premium features!`}
              </p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    }, 1500);
  };

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ── Background Aura ───────────────────────────────────────────────── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent blur-3xl opacity-60" />
          <div className="absolute top-1/3 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10 space-y-16">
          {/* ── Hero Header ───────────────────────────────────────────────────── */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase shadow-lg shadow-amber-500/10"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              {isAr ? "عضوية 11Players PRO Pass الممتازة" : "11Players PRO Pass Membership"}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black tracking-tight leading-tight"
            >
              {isAr ? (
                <>
                  ارتقِ بتجربتك الكروية إلى{" "}
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                    مستوى المحترفين 👑
                  </span>
                </>
              ) : (
                <>
                  Elevate Your Football Experience to{" "}
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                    Pro Level 👑
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-base md:text-lg font-medium"
            >
              {isAr
                ? "احصل على تحليلات الذكاء الاصطناعي للمباريات، تصميم الأطقم 3D، الشارة الذهبية، والمجتمعات المفتوحة."
                : "Unlock AI match scout reports, 3D kit builder customization, golden verified badge, and unlimited community access."}
            </motion.p>

            {/* Billing Switcher & Currency Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Annual / Monthly Toggle */}
              <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    !isAnnual ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isAr ? "اشتراك شهري" : "Monthly Billing"}
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    isAnnual
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{isAr ? "اشتراك سنوي" : "Annual Billing"}</span>
                  <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-extrabold border border-amber-500/30">
                    -25%
                  </span>
                </button>
              </div>

              {/* Currency Toggle */}
              <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs font-black">
                <button
                  onClick={() => setCurrency("EGP")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    currency === "EGP" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  EGP (جنيه)
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    currency === "USD" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </motion.div>
          </div>

          {/* ── Pricing Cards Grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, idx) => {
              const price = isAnnual
                ? currency === "EGP"
                  ? plan.priceAnnualEGP
                  : plan.priceAnnualUSD
                : currency === "EGP"
                ? plan.priceMonthlyEGP
                : plan.priceMonthlyUSD;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * idx, duration: 0.5 }}
                  className={`relative glass-card p-8 rounded-3xl border bg-slate-900/90 flex flex-col justify-between shadow-2xl transition-all hover:border-slate-600 ${
                    plan.popular ? "border-amber-400/80 ring-2 ring-amber-400/30" : plan.borderColor
                  }`}
                >
                  {/* Badge banner for popular */}
                  {plan.badgeEn && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20">
                      {isAr ? plan.badgeAr : plan.badgeEn}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <h3 className="text-2xl font-black text-white">{isAr ? plan.nameAr : plan.nameEn}</h3>
                      <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
                        {isAr ? plan.descAr : plan.descEn}
                      </p>
                    </div>

                    {/* Price tag */}
                    <div className="py-3 border-y border-slate-800/80">
                      {price === 0 ? (
                        <div className="text-4xl font-black text-white font-mono">
                          {isAr ? "مجاناً" : "Free"}
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-black font-mono text-white">
                            {currency === "USD" ? `$${price}` : `${price} EGP`}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            / {isAr ? (isAnnual ? "شهر (يُدفع سنوياً)" : "شهر") : (isAnnual ? "mo (billed yearly)" : "month")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        {isAr ? "المميزات المتضمنة:" : "INCLUDED FEATURES:"}
                      </p>
                      <ul className="space-y-2.5">
                        {(isAr ? plan.featuresAr : plan.featuresEn).map((ft, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{ft}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA button */}
                  <div className="pt-8">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20"
                          : plan.id === "free"
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20"
                      }`}
                    >
                      <span>{isAr ? plan.buttonTextAr : plan.buttonTextEn}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Feature Highlights Grid ────────────────────────────────────────── */}
          <div className="space-y-8 pt-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-white">
                {isAr ? "لماذا تختار عضوية PRO Pass؟" : "Why Upgrade to PRO Pass?"}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm font-medium">
                {isAr
                  ? "أقوى حزمة مميزات مصممة للاعبي كرة القدم التنافسية ومنظمي الملاقات"
                  : "Powerful features built specifically for competitive players and match managers"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Bot className="w-6 h-6 text-amber-400" />,
                  titleEn: "AI Match Analyst",
                  titleAr: "محلل الذكاء الاصطناعي",
                  descEn: "Get post-match tactical breakdown, player heatmaps, and OVR growth tips.",
                  descAr: "احصل على تحليل تكتيكي بعد المباراة، خرائط الحرارة، ونصائح تحسين الطاقات.",
                },
                {
                  icon: <Shirt className="w-6 h-6 text-emerald-400" />,
                  titleEn: "3D Kit & Crest Designer",
                  titleAr: "مصمم الأطقم 3D",
                  descEn: "Design custom jersey patterns, metallic badges, and squad colorways.",
                  descAr: "صمّم أطقم ومجسمات قمصان وشعارات مخصصة بألوان فريقك.",
                },
                {
                  icon: <Crown className="w-6 h-6 text-yellow-400" />,
                  titleEn: "Golden PRO Card Badge",
                  titleAr: "الشارة الذهبية الموثقة",
                  descEn: "Stand out with a glowing golden badge on leaderboards, lineups, and chat.",
                  descAr: "تميز بشارة ذهبية متوهجة على بطاقة اللاعب وقوائم المتصدرين والمحادثات.",
                },
                {
                  icon: <Receipt className="w-6 h-6 text-purple-400" />,
                  titleEn: "Automated Split-Bill",
                  titleAr: "تقاسم الحجز الأوتوماتيكي",
                  descEn: "Instantly split field rental costs per player with WhatsApp reminders.",
                  descAr: "احسب تكلفة حجز الملعب وقسمها بين اللاعبين تلقائياً مع تذكيرات الواتساب.",
                },
              ].map((ft, i) => (
                <div
                  key={i}
                  className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-3"
                >
                  <div className="p-3 bg-slate-950 rounded-2xl w-fit border border-slate-800">{ft.icon}</div>
                  <h4 className="font-extrabold text-base text-white">{isAr ? ft.titleAr : ft.titleEn}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{isAr ? ft.descAr : ft.descEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ Accordion Section ─────────────────────────────────────────── */}
          <div className="max-w-3xl mx-auto space-y-6 pt-6">
            <div className="flex items-center gap-2 justify-center">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-2xl font-black text-white">
                {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white hover:text-amber-300 transition-colors"
                    >
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-amber-400" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3"
                        >
                          {isAr ? faq.aAr : faq.aEn}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Payment Gateway Modal ─────────────────────────────────────────── */}
        <AnimatePresence>
          {isPaymentModalOpen && selectedPlan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-lg glass-card p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                      👑
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {isAr ? `ترقية إلى ${selectedPlan.nameAr}` : `Upgrade to ${selectedPlan.nameEn}`}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">
                        {isAnnual ? (isAr ? "اشتراك سنوي (خصم 25%)" : "Annual Pass (25% OFF)") : (isAr ? "اشتراك شهري" : "Monthly Pass")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
                  >
                    ✕
                  </button>
                </div>

                {/* Amount summary */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{isAr ? "المبلغ الإجمالي:" : "Total Amount:"}</span>
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {currency === "USD"
                      ? `$${isAnnual ? selectedPlan.priceAnnualUSD : selectedPlan.priceMonthlyUSD}`
                      : `${isAnnual ? selectedPlan.priceAnnualEGP : selectedPlan.priceMonthlyEGP} EGP`}
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 block">
                    {isAr ? "اختر طريقة الدفع:" : "Select Payment Method:"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "card", labelEn: "Credit / Debit Card", labelAr: "بطاقة ائتمان / فيزا", icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
                      { id: "vodafone", labelEn: "Vodafone Cash / Wallet", labelAr: "فودافون كاش / محفظة", icon: <Zap className="w-4 h-4 text-red-400" /> },
                      { id: "fawry", labelEn: "Fawry Pay Code", labelAr: "كود دَفع فوري", icon: <Award className="w-4 h-4 text-amber-400" /> },
                      { id: "paypal", labelEn: "PayPal Express", labelAr: "حساب PayPal", icon: <Globe className="w-4 h-4 text-cyan-400" /> },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all text-xs font-bold ${
                          paymentMethod === pm.id
                            ? "bg-slate-800 border-amber-400 text-white shadow-md shadow-amber-500/10"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {pm.icon}
                        <span>{isAr ? pm.labelAr : pm.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Sandbox note */}
                <p className="text-[11px] text-slate-400 font-medium bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  ℹ️ {isAr ? "بوابة الدفع جاهزة للربط فور إدخال المفاتيح الخاصة بك. انقر لتأكيد تفعيل الاشتراك التجريبي." : "Payment Gateway API Sandbox is ready. Click below to activate your PRO Pass subscription."}
                </p>

                {/* Confirm button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <span>{isAr ? "جاري المعالجة..." : "Processing..."}</span>
                    ) : (
                      <span>{isAr ? "تأكيد الدفع والتفعيل" : "Confirm & Activate Pass"}</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
