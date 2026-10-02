"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Crown,
  CheckCircle2,
  Clock,
  Wallet,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { formatCurrencyEGP, formatCurrencyUSD } from "@/lib/proSubscription";

export interface PriorityAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlanId?: "match_pass" | "pro_captain" | "club_organizer";
}

const PLAN_DATA = {
  match_pass: {
    nameEn: "Match Day Pass",
    nameAr: "تذكرة المباراة الواحدة",
    priceEGP: 25,
    priceUSD: 0.99,
    badgeEn: "Single Match",
    badgeAr: "مباراة واحدة",
  },
  pro_captain: {
    nameEn: "PRO Captain Pass",
    nameAr: "اشتراك كابتن النخبة",
    priceEGP: 59,
    priceUSD: 1.49,
    badgeEn: "Most Popular",
    badgeAr: "الأكثر طلباً ⭐",
  },
  club_organizer: {
    nameEn: "Club & Turf Organizer",
    nameAr: "منظم الأندية والملاعب",
    priceEGP: 179,
    priceUSD: 3.99,
    badgeEn: "Turf Managers",
    badgeAr: "للمنظمين والملاعب 🏟️",
  },
} as const;

export default function PriorityAccessModal({
  isOpen,
  onClose,
  defaultPlanId = "pro_captain",
}: PriorityAccessModalProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [selectedPlan, setSelectedPlan] = useState<"match_pass" | "pro_captain" | "club_organizer">(defaultPlanId);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredMethod, setPreferredMethod] = useState<string>("instapay");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (defaultPlanId) {
      setSelectedPlan(defaultPlanId);
    }
  }, [defaultPlanId]);

  useEffect(() => {
    if (user) {
      setEmail((prev) => prev || user.email || "");
      setName((prev) => prev || user.displayName || "");
    }
  }, [user]);

  if (!isOpen) return null;

  const currentPlanMeta = PLAN_DATA[selectedPlan];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const leadData = {
        planId: selectedPlan,
        planName: currentPlanMeta.nameEn,
        email: email.trim().toLowerCase(),
        name: name.trim() || "Anonymous Player",
        phone: phone.trim() || null,
        preferredPaymentMethod: preferredMethod,
        userUid: user?.uid || null,
        createdAt: serverTimestamp(),
        clientTimestamp: new Date().toISOString(),
        earlyBirdDiscount: "20%",
        source: "pro_pass_priority_access",
      };

      // Real persistent save to Firestore collection
      await addDoc(collection(db, "subscription_leads"), leadData);

      // Save to localStorage for instant UI recognition
      try {
        localStorage.setItem(`11players_priority_${selectedPlan}`, JSON.stringify({
          planId: selectedPlan,
          email,
          registeredAt: new Date().toISOString(),
        }));
      } catch {}

      setSubmitted(true);
      toast.success(
        isAr
          ? "🎉 تم تسجيلك في قائمة الأولوية بنجاح! ستصلك رسالة فور الإطلاق بخصم 20%"
          : "🎉 You are on the priority list! You'll receive launch access with 20% off"
      );
    } catch (err: any) {
      console.warn("Could not save to Firestore directly, saving locally:", err);
      try {
        localStorage.setItem(`11players_priority_${selectedPlan}`, JSON.stringify({
          planId: selectedPlan,
          email,
          registeredAt: new Date().toISOString(),
          synced: false,
        }));
      } catch {}
      setSubmitted(true);
      toast.success(
        isAr
          ? "تم تسجيلك في قائمة الأولوية بنجاح!"
          : "Registered for Priority Access successfully!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/30 text-white my-8"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 end-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>

          {!submitted ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? "قائمة أولوية الاشتراك" : "VIP Priority Access"}</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {isAr ? "احصل على أولوية التفعيل وخصم 20%" : "Get Priority Activation & 20% Off"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {isAr
                    ? "بوابات الدفع الإلكتروني بالجنيه المصري (إنستاباي، فودافون كاش، فوري، فيزا) قيد الربط الفني النهائي. سجّل الآن لتحصل على تفعيل فوري مع خصم إضافي 20% عند الإطلاق."
                    : "Egyptian payment gateways (InstaPay, Vodafone Cash, Fawry, Visa) are in final integration. Join the priority list now for instant activation and a 20% early-bird discount."}
                </p>
              </div>

              {/* Plan Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                {(["match_pass", "pro_captain", "club_organizer"] as const).map((pid) => {
                  const meta = PLAN_DATA[pid];
                  const isActive = selectedPlan === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setSelectedPlan(pid)}
                      className={`p-2.5 rounded-xl text-center transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 font-black shadow-md"
                          : "text-slate-400 hover:text-slate-200 font-bold hover:bg-slate-850"
                      }`}
                    >
                      <p className="text-[11px] leading-tight truncate">{isAr ? meta.nameAr : meta.nameEn}</p>
                      <p className="text-xs font-mono font-black mt-1 text-white">
                        {formatCurrencyEGP(meta.priceEGP, isAr)}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? "البريد الإلكتروني *" : "Email Address *"}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? "الاسم / اسم البطاقة" : "Player / Card Name"}</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? "أحمد علاء" : "John Doe"}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? "رقم الهاتف / واتساب (اختياري)" : "Phone / WhatsApp (Optional)"}</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Preferred Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? "طريقة الدفع المفضلة لديك:" : "Preferred Payment Method:"}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "instapay", nameEn: "InstaPay", nameAr: "إنستاباي IPN" },
                      { id: "vodafone_cash", nameEn: "VF Cash / Wallet", nameAr: "فودافون كاش" },
                      { id: "fawry", nameEn: "Fawry Code", nameAr: "كود فوري" },
                      { id: "card", nameEn: "Bank Card", nameAr: "فيزا / كارت" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPreferredMethod(m.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                          preferredMethod === m.id
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {isAr ? m.nameAr : m.nameEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <span>{isAr ? "جاري التسجيل..." : "Registering..."}</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 rtl:-scale-x-100" />
                        <span>{isAr ? "تأكيد الانضمام لقائمة الأولوية (خصم 20%)" : "Join Priority Access (20% Off)"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {isAr
                    ? "لا توجد رسوم حالياً. ستصلك دعوة رسمية مع رابط الدفع عند فتح الاشتراكات."
                    : "No charges today. You'll receive a VIP invite with payment link at launch."}
                </span>
              </div>
            </div>
          ) : (
            /* Success confirmation */
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  {isAr ? "تم تسجيلك بنجاح في قائمة الأولوية! 🎉" : "You're on the VIP Priority List! 🎉"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {isAr
                    ? `شكراً لك! لقد حجزت أسبقية الاشتراك في ${currentPlanMeta.nameAr} بخصم 20% حصري. سنرسل لك إشعاراً فورياً على ${email} عند فتح بوابات الدفع الرسمية.`
                    : `Thank you! You reserved priority access for ${currentPlanMeta.nameEn} with an exclusive 20% discount. We will notify you at ${email} the moment payment goes live.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-amber-400">
                  {isAr ? "ملاحظة خاصة لأصحاب الملاعب والفرق:" : "Special Note for Turf Organizers & Teams:"}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isAr
                    ? "إذا كنت ترغب في تفعيل تجريبي فوري لملعبك أو مجتمعك الكروي، يمكنك التواصل مع مالك المنصة أو إدارة الدعم عبر لوحة التحكم."
                    : "For immediate sandbox testing on your pitch or community, request early access via Admin / Support Desk."}
                </p>
              </div>

              <button
                onClick={onClose}
                className="py-3 px-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                {isAr ? "حسناً، فهمت" : "Got it"}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
