"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ShieldCheck, Activity, Users, Award, HelpCircle } from "lucide-react";
import { useLocale } from "@/components/ThemeProvider";

interface OvrExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OvrExplanationModal({ isOpen, onClose }: OvrExplanationModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isAr ? "rtl" : "ltr"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">
                  {isAr ? "كيف يتم حساب التقييم الكلي (OVR)؟" : "How is Overall Rating (OVR) Calculated?"}
                </h3>
                <p className="text-emerald-100 text-xs">
                  {isAr ? "نظام تقييم دقيق وواقعي يحاكي ألعاب كرة القدم العالمية" : "Realistic, position-based formula inspired by pro simulations"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            {/* Section 1: Position Weights */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 text-base">
                <Activity className="w-5 h-5" />
                <span>{isAr ? "1. أوزان القدرات حسب المركز الأساسي" : "1. Position-Specific Attribute Weights"}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? "لا يتم حساب التقييم كمتوسط بسيط لكل الـ 21 قدرة، بل يتم التركيز على القدرات الأكثر أهمية لمركزك في الملعب:"
                  : "OVR is not a simple average of all 21 abilities. Instead, heavily weighted attributes depend on your primary position:"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-medium">
                  <span className="font-bold text-amber-500 block mb-0.5">CF / SS / RWF / LWF</span>
                  {isAr ? "التركيز على: الوعي الهجومي، الإنهاء، السرعة، والتسارع." : "Heavily weights: Offensive Awareness, Finishing, Speed, & Acceleration."}
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-medium">
                  <span className="font-bold text-blue-500 block mb-0.5">AMF / CMF / RMF / LMF</span>
                  {isAr ? "التركيز على: التمرير المنخفض والمرتفع، التحكم بالكرة، والمراوغة." : "Heavily weights: Low/Lofted Pass, Ball Control, & Dribbling."}
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-medium">
                  <span className="font-bold text-emerald-500 block mb-0.5">DMF / CB / LB / RB</span>
                  {isAr ? "التركيز على: الوعي الدفاعي، قطع الكرة، الالتحام الجسدي، والرأسيات." : "Heavily weights: Defensive Awareness, Ball Winning, & Physical Contact."}
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-medium">
                  <span className="font-bold text-purple-500 block mb-0.5">GK (حارس المرمى)</span>
                  {isAr ? "التركيز حصرياً على: وعي الحارس، رد الفعل، الإمساك، التشتيت، والوصول." : "Exclusive focus on: GK Awareness, Reflexes, Catching, Clearing, & Reach."}
                </div>
              </div>
            </div>

            {/* Section 2: Play Style Bonuses */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-500 text-base">
                <Sparkles className="w-5 h-5" />
                <span>{isAr ? "2. حافز أسلوب اللعب (Play Style Bonus)" : "2. Play Style Bonus (+1 to +2 OVR)"}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? "اختيار أسلوب اللعب الذي يطابق مركزك وأسلوبك (مثل Box-to-Box أو Goal Poacher أو The Destroyer) يمنحك مكافأة إضافية (+1 أو +2) على تقييمك الكلي."
                  : "Selecting an active Play Style fitting your role (e.g., Box-to-Box, Goal Poacher, The Destroyer) grants a direct +1 or +2 bonus to your final OVR."}
              </p>
            </div>

            {/* Section 3: Physical & Age Modifiers */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 font-black text-teal-500 text-base">
                <Award className="w-5 h-5" />
                <span>{isAr ? "3. العوامل البدنية والسن (Physical & Age Modifiers)" : "3. Physical & Age Modifiers"}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? "يتم مراعاة الطول والوزن وتناسبهما (BMI). على سبيل المثال: قلب الدفاع أو حارس المرمى فارع الطول (أطول من 185 سم) أو ذو البنية القوية يحصل على نقطة إضافية في التنافس البدني، كما يتم تعديل السرعة والتحمل بشكل طفيف حسب السن واللياقة."
                  : "Height and Weight (BMI) adjust performance traits. For instance, tall CBs or GKs (185cm+) receive physical reach bonuses, while age and build slightly refine stamina and balance consistency."}
              </p>
            </div>

            {/* Section 4: Peer Ratings & Consensus */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 font-black text-purple-500 text-base">
                <Users className="w-5 h-5" />
                <span>{isAr ? "4. تقييمات الزملاء واعتماد المسؤول" : "4. Peer Ratings & Admin Consensus"}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? "يمكن لزملائك في المجتمع اقتراح تعديل على طاقاتك أو تقييمك بعد المباريات. يقوم المسؤول (Admin/Owner) بمراجعة واعتدال هذه التقييمات واعتماد المتوسط الواقعي لضمان العدالة وتوازن الفرق."
                  : "Peers can suggest ability updates and rate match performances. Community Admins review and approve these consensus averages to guarantee balanced squads during matchmaking."}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
            >
              {isAr ? "فهمت، إغلاق" : "Got it, Close"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
