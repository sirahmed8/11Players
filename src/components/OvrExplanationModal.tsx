"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ShieldCheck, Activity, Users, Award, HelpCircle, Zap, Target, Crosshair, Dumbbell, Shield, Lightbulb, Compass } from "lucide-react";
import { useLocale } from "@/components/ThemeProvider";

interface OvrExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OvrExplanationModal({ isOpen, onClose }: OvrExplanationModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                  <HelpCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    {isAr ? "كيف يتم حساب التقييم الكلي (OVR) ومؤشرات البطاقة؟" : "How is Overall Rating (OVR) & Card Stats Calculated?"}
                  </h3>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    {isAr ? "نظام تقييم دقيق وواقعي يحاكي ألعاب كرة القدم العالمية ويأخذ بالاعتبار المركز وأسلوب اللعب" : "Realistic, position-based formula inspired by pro simulations"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed custom-scrollbar flex-1">
              {/* Pro Hints & Advice Banner */}
              <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-5 rounded-3xl border border-amber-500/40 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 font-black text-amber-600 dark:text-amber-400 text-base">
                  <Lightbulb className="w-6 h-6 shrink-0 animate-bounce" />
                  <span>{isAr ? "💡 نصائح وإرشادات هامة: تأثير المركز وأسلوب اللعب على تقييمك (Hints & Advices)" : "💡 Pro Advice & Hints: How Position & Playstyle Affect OVR"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-amber-500/20 shadow-2xs">
                    <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                      {isAr ? "🎯 اختيار المركز الأساسي (Primary Position)" : "🎯 Primary Position Accuracy"}
                    </span>
                    {isAr
                      ? "تقييمك العام (OVR) يتأثر مباشرة بمركزك الأساسي. إذا كانت قدراتك الدفاعية مرتفعة جداً واخترت مركز المهاجم (CF)، سيكون تقييمك العام منخفضاً لأن معادلة المهاجم تعتمد على الوعي الهجومي والإنهاء وليس الدفاع."
                      : "Your OVR directly depends on your primary position. If your defensive stats are 90+ but your primary position is set to CF (Forward), your calculated OVR will be lower because CF weights focus on Shooting and Pace!"}
                  </div>
                  <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-amber-500/20 shadow-2xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                      {isAr ? "⚽ أسلوب اللعب والمراكز الثانوية (Play Style & 2nd/3rd Pos)" : "⚽ Play Style & Secondary/Tertiary Positions"}
                    </span>
                    {isAr
                      ? "تحديد مركز ثانٍ وثالث واختيار أسلوب اللعب المناسب (مثل Box-to-Box أو Goal Poacher) يساعد الذكاء الاصطناعي على توزيعك بمرونة في التشكيلة المثالية دون تقليل كفاءة الفريق أو التوازن."
                      : "Selecting secondary and tertiary positions alongside a synergy Play Style (like Box-to-Box or Anchor Man) enables the AI matchmaker to flexibly slot you into optimal formations without positional penalties."}
                  </div>
                </div>
              </div>

              {/* Section 1: Card Profile Stats Explained (PAC, SHO, PAS, DRI, DEF, PHY) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-base">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>{isAr ? "شرح مؤشرات بطاقة اللاعب الستة (Card Profile Stats Breakdown)" : "Card Profile Stats Explained (PAC, SHO, PAS, DRI, DEF, PHY)"}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr
                    ? "الارقام الستة الظاهرة على بطاقتك الشخصية هي متوسطات دقيقة مجمعة من قدراتك الـ 22 الأساسية:"
                    : "The 6 headline ratings displayed on your physical player card are precise composites derived from your 22 core abilities:"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-amber-500 flex items-center gap-1.5"><Zap className="w-4 h-4" /> PAC ({isAr ? "السرعة" : "Pace"})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {isAr ? "متوسط: السرعة القصوى (Speed) + التسارع والانطلاق (Acceleration)." : "Average of: Speed + Acceleration."}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-red-500 flex items-center gap-1.5"><Target className="w-4 h-4" /> SHO ({isAr ? "التسديد" : "Shooting"})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {isAr ? "متوسط: الإنهاء والتسديد (Finishing) + قوة التسديد (Kicking Power) + الوعي الهجومي (Offensive Awareness)." : "Average of: Finishing + Kicking Power + Offensive Awareness."}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-blue-500 flex items-center gap-1.5"><Activity className="w-4 h-4" /> PAS ({isAr ? "التمرير" : "Passing"})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {isAr ? "متوسط: التمرير القصير المنخفض (Low Pass) + التمرير الطويل المرتفع (Lofted Pass)." : "Average of: Low Pass + Lofted Pass."}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-teal-500 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> DRI ({isAr ? "المراوغة" : "Dribbling"})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {isAr ? "متوسط: المراوغة (Dribbling) + التحكم بالكرة (Ball Control) + التوازن الجسدي (Balance)." : "Average of: Dribbling + Ball Control + Balance."}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-purple-500 flex items-center gap-1.5"><Shield className="w-4 h-4" /> DEF ({isAr ? "الدفاع" : "Defense"})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {isAr ? "متوسط: الوعي الدفاعي (Defensive Awareness) + افتكاك الكرة (Ball Winning) + الشراسة (Aggression)." : "Average of: Defensive Awareness + Ball Winning + Aggression."}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-orange-500 flex items-center gap-1.5"><Dumbbell className="w-4 h-4" /> PHY ({isAr ? "القدرة البدنية" : "Physicality"})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {isAr ? "متوسط: الالتحام والقوة الجسدية (Physical Contact) + اللياقة والتحمل (Stamina) + القفز (Jump)." : "Average of: Physical Contact + Stamina + Jump."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Position Weights */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 text-base">
                  <Activity className="w-5 h-5" />
                  <span>{isAr ? "1. أوزان القدرات حسب المركز الأساسي" : "1. Position-Specific Attribute Weights"}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr
                    ? "لا يتم حساب التقييم كمتوسط بسيط لكل الـ 21 قدرة، بل يتم التركيز على القدرات الأكثر أهمية لمركزك في الملعب:"
                    : "OVR is not a simple average of all 21 abilities. Instead, heavily weighted attributes depend on your primary position:"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-medium">
                    <span className="font-bold text-amber-500 block mb-1">CF / SS / RWF / LWF</span>
                    {isAr ? "التركيز على: الوعي الهجومي، الإنهاء، السرعة، والتسارع." : "Heavily weights: Offensive Awareness, Finishing, Speed, & Acceleration."}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-medium">
                    <span className="font-bold text-blue-500 block mb-1">AMF / CMF / RMF / LMF</span>
                    {isAr ? "التركيز على: التمرير المنخفض والمرتفع، التحكم بالكرة، والمراوغة." : "Heavily weights: Low/Lofted Pass, Ball Control, & Dribbling."}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-medium">
                    <span className="font-bold text-emerald-500 block mb-1">DMF / CB / LB / RB</span>
                    {isAr ? "التركيز على: الوعي الدفاعي، قطع الكرة، الالتحام الجسدي، والرأسيات." : "Heavily weights: Defensive Awareness, Ball Winning, & Physical Contact."}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-medium">
                    <span className="font-bold text-purple-500 block mb-1">{isAr ? "GK (حارس المرمى)" : "GK (Goalkeeper)"}</span>
                    {isAr ? "التركيز حصرياً على: وعي الحارس، رد الفعل، الإمساك، التشتيت، والوصول." : "Exclusive focus on: GK Awareness, Reflexes, Catching, Clearing, & Reach."}
                  </div>
                </div>
              </div>

              {/* Section 3: Physical & Age Modifiers */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-black text-teal-500 text-base">
                  <Award className="w-5 h-5" />
                  <span>{isAr ? "2. العوامل البدنية والسن (Physical & Age Modifiers)" : "2. Physical & Age Modifiers"}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr
                    ? "يتم مراعاة الطول والوزن وتناسبهما (BMI). على سبيل المثال: قلب الدفاع أو حارس المرمى فارع الطول (أطول من 185 سم) أو ذو البنية القوية يحصل على نقطة إضافية في التنافس البدني، كما يتم تعديل السرعة والتحمل بشكل طفيف حسب السن واللياقة."
                    : "Height and Weight (BMI) adjust performance traits. For instance, tall CBs or GKs (185cm+) receive physical reach bonuses, while age and build slightly refine stamina and balance consistency."}
                </p>
              </div>

              {/* Section 4: Peer Ratings & Consensus */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-black text-purple-500 text-base">
                  <Users className="w-5 h-5" />
                  <span>{isAr ? "3. تقييمات الزملاء واعتماد المسؤول" : "3. Peer Ratings & Admin Consensus"}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr
                    ? "يمكن لزملائك في المجتمع اقتراح تعديل على طاقاتك أو تقييمك بعد المباريات. يقوم المسؤول (Admin/Owner) بمراجعة واعتدال هذه التقييمات واعتماد المتوسط الواقعي لضمان العدالة وتوازن الفرق."
                    : "Peers can suggest ability updates and rate match performances. Community Admins review and approve these consensus averages to guarantee balanced squads during matchmaking."}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
              >
                {isAr ? "فهمت، إغلاق" : "Got it, Close"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
