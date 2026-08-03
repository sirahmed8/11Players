"use client";

/**
 * ProGate — Premium Feature Gate
 * ────────────────────────────────
 * Wrap any JSX in <ProGate requiredPlan="pro_captain"> … </ProGate>.
 * • Owner and users with an active matching subscription: content shown.
 * • Everyone else: blurred content + glassy lock overlay + upgrade CTA.
 *
 * requiredPlan:
 *   "pro_captain"     → needs PRO Captain or Club Organizer
 *   "club_organizer"  → needs Club Organizer only
 */

import React from "react";
import Link from "next/link";
import { Crown, Lock, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useProSubscription } from "@/contexts/ProSubscriptionContext";
import { useLocale } from "@/components/ui/ThemeProvider";

interface ProGateProps {
  requiredPlan?: "pro_captain" | "club_organizer";
  children: React.ReactNode;
  /** Custom heading override */
  featureNameEn?: string;
  featureNameAr?: string;
  /** If true the children are still rendered (but blurred) instead of hidden */
  showBlurred?: boolean;
}

const PLAN_LABELS = {
  pro_captain: { en: "PRO Captain Pass", ar: "اشتراك PRO الكابتن" },
  club_organizer: { en: "Club & Turf Owner", ar: "منظم النادي" },
} as const;

export default function ProGate({
  requiredPlan = "pro_captain",
  children,
  featureNameEn = "Premium Feature",
  featureNameAr = "ميزة مميزة",
  showBlurred = true,
}: ProGateProps) {
  const { hasProAccess, hasClubOrganizerAccess, loading } = useProSubscription();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  // Determine access
  let hasAccess = false;
  if (requiredPlan === "pro_captain") hasAccess = hasProAccess;
  if (requiredPlan === "club_organizer") hasAccess = hasClubOrganizerAccess;

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20 text-slate-500 text-sm animate-pulse">
        {isAr ? "جاري التحقق من الاشتراك..." : "Checking subscription..."}
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  const planLabel = isAr
    ? PLAN_LABELS[requiredPlan].ar
    : PLAN_LABELS[requiredPlan].en;

  return (
    <div className="relative w-full">
      {/* Blurred background content */}
      {showBlurred && (
        <div
          className="pointer-events-none select-none"
          style={{ filter: "blur(6px)", opacity: 0.35 }}
          aria-hidden
        >
          {children}
        </div>
      )}

      {/* Lock overlay */}
      <div
        className={`${
          showBlurred ? "absolute inset-0" : "relative"
        } z-20 flex items-center justify-center p-4`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="w-full max-w-sm bg-slate-900/95 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-7 text-center shadow-2xl shadow-amber-900/20 space-y-5"
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 border border-amber-500/30 flex items-center justify-center shadow-inner">
                <Lock className="w-7 h-7 text-amber-400" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-md shadow-amber-500/40">
                <Crown className="w-3.5 h-3.5 text-slate-950" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
              {isAr ? "ميزة حصرية" : "PRO EXCLUSIVE"}
            </p>
            <h3 className="text-lg font-black text-white leading-tight">
              {isAr ? featureNameAr : featureNameEn}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {isAr
                ? `هذه الميزة متاحة فقط لمشتركي ${planLabel}. قم بالترقية للاستفادة منها.`
                : `This feature requires an active ${planLabel} subscription. Upgrade to unlock.`}
            </p>
          </div>

          {/* Feature bullets */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              isAr ? "🤖 تقارير الذكاء الاصطناعي" : "🤖 AI Scout Reports",
              isAr ? "🎨 مصمم الأطقم 3D" : "🎨 3D Kit Builder",
              isAr ? "👑 الشارة الذهبية" : "👑 Golden PRO Badge",
              isAr ? "📊 تصدير الإحصائيات" : "📊 Stats Exporter",
            ].map((ft, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300"
              >
                {ft}
              </span>
            ))}
          </div>

          {/* Upgrade CTA */}
          <Link
            href="/pro-pass"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? "ترقية إلى PRO الآن" : "Upgrade to PRO"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>

          <p className="text-[10px] text-slate-500 font-medium">
            {isAr
              ? "بوابة الدفع قريباً — تواصل مع المالك للتفعيل المبكر"
              : "Payment gateway coming soon — contact owner for early access"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
