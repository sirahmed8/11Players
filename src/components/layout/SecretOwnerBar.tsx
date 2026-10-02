"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription, SimulatedRole } from "@/contexts/ProSubscriptionContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import {
  Crown,
  Shield,
  BarChart3,
  Eye,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SecretOwnerBar() {
  const { isOwner, user } = useAuth();
  const { simulatedRole, setSimulatedRole } = useProSubscription();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [isExpanded, setIsExpanded] = useState(false);

  // Strictly invisible if not verified platform owner
  if (!isOwner) return null;

  const handleRoleChange = (role: SimulatedRole) => {
    setSimulatedRole(role);
    const roleLabels: Record<SimulatedRole, { en: string; ar: string }> = {
      none: { en: "Platform Owner (Full Access 👑)", ar: "مالك المنصة (صلاحية كاملة 👑)" },
      free: { en: "Simulating: Free Player", ar: "محاكاة: لاعب مجاني" },
      pro_captain: { en: "Simulating: PRO Captain", ar: "محاكاة: كابتن النخبة PRO" },
      club_organizer: { en: "Simulating: Club Organizer", ar: "محاكاة: منظم الملاعب" },
    };
    toast.success(isAr ? roleLabels[role].ar : roleLabels[role].en, {
      icon: "⚡",
      style: { background: "#0f172a", color: "#f59e0b", border: "1px solid #f59e0b" },
    });
  };

  const handleResetAiQuota = () => {
    try {
      localStorage.removeItem("11players_ai_chat_quota");
      window.dispatchEvent(new Event("11players_ai_quota_reset"));
      toast.success(isAr ? "تم إعادة ضبط حصة الذكاء الاصطناعي بنجاح ⚡" : "AI Quota reset to 0! ⚡");
    } catch {}
  };

  return (
    <div
      className="fixed bottom-4 start-4 z-40 select-none print:hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-slate-950/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl shadow-amber-950/50 text-white w-80 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-sm">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-400 tracking-wider uppercase">
                    OP Mode Active
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    {user?.email}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isAr ? "تصغير" : "Minimize"}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Paywall Simulator */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? "محاكي بوابات الاشتراك (Paywall Simulator):" : "Paywall Simulator:"}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                {[
                  { id: "none" as const, labelEn: "Owner (All)", labelAr: "المالك (شامل)" },
                  { id: "free" as const, labelEn: "Free Player", labelAr: "لاعب مجاني" },
                  { id: "pro_captain" as const, labelEn: "PRO Captain", labelAr: "كابتن PRO" },
                  { id: "club_organizer" as const, labelEn: "Club Org", labelAr: "منظم ملاعب" },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id)}
                    className={`py-1.5 px-2 rounded-lg border transition-all text-center ${
                      simulatedRole === role.id
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 font-black shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {isAr ? role.labelAr : role.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
              <Link
                href="/admin"
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin</span>
              </Link>

              <Link
                href="/owner"
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Venture</span>
              </Link>

              <button
                onClick={handleResetAiQuota}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-amber-400 transition-colors"
                title={isAr ? "إعادة ضبط حصة الذكاء الاصطناعي" : "Reset AI Quota"}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/50 shadow-xl shadow-amber-950/40 text-amber-400 hover:text-white text-xs font-black hover:border-amber-400 transition-all hover:scale-105 active:scale-95"
            title="OP Mode Command Pill"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>OP Mode</span>
            {simulatedRole !== "none" && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black">
                {simulatedRole}
              </span>
            )}
            <ChevronUp className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
