"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ShieldCheck, Activity, Users, Award, HelpCircle, Zap, Target, Crosshair, Dumbbell, Shield, Compass, Brain } from "lucide-react";
import { getTacticalSuggestions } from "@/lib/suggestionEngine";
import { PLAYER_STYLES } from "@/components/player/PlayerStylePicker";
import { useLocale } from "@/components/ui/ThemeProvider";
import { calculateFutAttributes } from "@/components/fut/Holographic3DFutCard";
import PlayerRadarChart from "@/components/player/PlayerRadarChart";

interface OvrExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: any;
  isOwnProfile?: boolean;
}

export default function OvrExplanationModal({ isOpen, onClose, player, isOwnProfile = true }: OvrExplanationModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  // Calculate dynamic personalized hints if player exists
  const suggestions = React.useMemo(() => {
    if (!player) return null;
    return getTacticalSuggestions(
      player.approvedAttributes || player.attributes,
      player.height,
      player.weight,
      player.preferredFoot
    );
  }, [player]);

  const renderPersonalizedPositionHint = () => {
    if (!suggestions || !player) {
      return isAr
        ? "تقييمك العام (OVR) يتأثر مباشرة بمركزك الأساسي. اختيار المركز الصحيح يعزز تقييمك."
        : "Your OVR is directly calculated based on your primary position weights. Choosing the right position maximizes your OVR.";
    }

    const currentPos = player.primaryPosition || 'CMF';
    const bestPos = suggestions.positions[0];

    const chosenStrEn = isOwnProfile ? "Your chosen position is" : "The player's chosen position is";
    const chosenStrAr = isOwnProfile ? "مركزك الأساسي المختار هو" : "مركز اللاعب المختار هو";

    const youdGetEn = isOwnProfile ? "you'd get" : "they'd get";
    const youdGetAr = isOwnProfile ? "ستحصل على" : "سيحصل على";

    if (currentPos !== bestPos.position) {
      return isAr
        ? `${chosenStrAr} (${currentPos})، لكن بناءً على الطاقات والبنية، يعتقد الذكاء الاصطناعي أن ${youdGetAr} تقييم وأداء أفضل بكثير في مركز (${bestPos.position}) بنسبة تطابق ${bestPos.matchPercentage}%!`
        : `${chosenStrEn} (${currentPos}), but based on stats and build, our AI believes ${youdGetEn} a much higher OVR and perform better at (${bestPos.position}) with a ${bestPos.matchPercentage}% match!`;
    }
    
    return isAr
      ? `رائع! المركز الحالي (${currentPos}) هو الأنسب تماماً بناءً على الطاقات بنسبة تطابق ${bestPos.matchPercentage}%.`
      : `Excellent! The current position (${currentPos}) perfectly matches the attributes with a ${bestPos.matchPercentage}% synergy.`;
  };

  const renderPersonalizedStyleHint = () => {
    if (!suggestions || !player) {
      return isAr
        ? "اختيار أسلوب لعب يناسب مراكزك مع تحديد مركز ثانٍ وثالث يعزز قوتك في التشكيلة."
        : "Selecting a Playstyle that synergizes with your role plus setting 2nd/3rd positions boosts your team impact.";
    }

    const currentStyleId = player.playStyle;
    const currentStyleObj = currentStyleId ? PLAYER_STYLES.find(s => s.id === currentStyleId) : null;
    const currentStyleNameAr = currentStyleObj?.ar || 'غير محدد';
    const currentStyleNameEn = currentStyleObj?.en || 'None';
    
    const bestStyle = suggestions.playStyles[0];

    const yourStyleEn = isOwnProfile ? "Your playstyle is" : "The player's playstyle is";
    const yourStyleAr = isOwnProfile ? "أسلوب لعبك هو" : "أسلوب لعب اللاعب هو";

    let styleAdvice = "";
    if (!currentStyleId) {
      styleAdvice = isAr
        ? `لم يتم اختيار أسلوب لعب بعد! نقترح بشدة اختيار (${bestStyle.styleAr}).`
        : `No Playstyle selected! We highly recommend choosing (${bestStyle.styleEn}).`;
    } else if (currentStyleId !== bestStyle.styleId) {
      styleAdvice = isAr
        ? `${yourStyleAr} (${currentStyleNameAr}). بينما نوصي بتجربة (${bestStyle.styleAr}) حيث يتطابق بنسبة ${bestStyle.matchPercentage}%.`
        : `${yourStyleEn} (${currentStyleNameEn}). However, the AI suggests trying (${bestStyle.styleEn}) which matches abilities by ${bestStyle.matchPercentage}%.`;
    } else {
      styleAdvice = isAr
        ? `الأسلوب (${currentStyleNameAr}) متناغم تماماً!`
        : `The playstyle (${currentStyleNameEn}) perfectly synergizes!`;
    }

    const hasSecondary = !!player.secondaryPosition;
    const hasTertiary = !!player.tertiaryPosition;
    
    if (!hasSecondary || !hasTertiary) {
      const posAdvice = isAr 
        ? " يرجى تحديد المراكز الإضافية لزيادة التناغم." 
        : " Set 2nd & 3rd positions to boost team synergy.";
      styleAdvice += posAdvice;
    }

    return styleAdvice;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
          dir={isAr ? "rtl" : "ltr"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto text-white"
          >
            {/* ── Modal Header ─────────────────────────────────────────────── */}
            <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-tight text-white">
                    {isAr ? "كيف يتم حساب التقييم الكلي (OVR) ومؤشرات البطاقة؟" : "How is Overall Rating (OVR) & Card Stats Calculated?"}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-semibold">
                    {isAr ? "نظام تقييم دقيق وواقعي يحاكي محاكاة ألعاب المحترفين العالمية" : "Realistic, position-based formula inspired by pro simulations"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 active:scale-95 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Body Content ─────────────────────────────────────────────── */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed custom-scrollbar flex-1">
              {/* Personalized AI Insight (if player data exists) */}
              {player && (
                <div className="bg-slate-950/90 p-5 rounded-3xl border border-emerald-500/30 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <span>{isAr ? "تحليل الذكاء الاصطناعي المخصص لملفك" : "Personalized AI Rating Analysis"}</span>
                  </div>
                  <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                    <p className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                      💡 {renderPersonalizedPositionHint()}
                    </p>
                    <p className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                      🎯 {renderPersonalizedStyleHint()}
                    </p>
                  </div>
                </div>
              )}

              {/* Player Radar Chart Visualization */}
              {player && (
                <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />
                  <div className="flex items-center gap-2 font-black text-emerald-400 text-base self-start z-10 w-full mb-2">
                    <Target className="w-5 h-5" />
                    <span>{isAr ? "رادار قدراتك الشامل" : "Comprehensive Abilities Radar"}</span>
                  </div>
                  
                  <div className="relative z-10">
                    {(() => {
                      const fut = calculateFutAttributes(player.approvedAttributes || player.attributes);
                      return (
                        <PlayerRadarChart 
                          stats={{
                            PAC: fut.pac,
                            SHO: fut.sho,
                            PAS: fut.pas,
                            DRI: fut.dri,
                            DEF: fut.def,
                            PHY: fut.phy,
                          }} 
                          size={300} 
                          color="#10b981" 
                        />
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Section 1: Card Profile Stats Breakdown */}
              <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 font-black text-amber-400 text-base">
                  <Compass className="w-5 h-5" />
                  <span>{isAr ? "شرح مؤشرات بطاقة اللاعب الستة (Card Profile Stats Breakdown)" : "Card Profile Stats Breakdown (PAC, SHO, PAS, DRI, DEF, PHY)"}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "الأرقام الستة الظاهرة على بطاقتك هي متوسطات دقيقة مجمعة من قدراتك الـ 22 الأساسية:"
                    : "The 6 headline ratings displayed on your physical player card are precise composites derived from your 22 core abilities:"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-amber-400 flex items-center gap-1.5"><Zap className="w-4 h-4" /> PAC ({isAr ? "السرعة" : "Pace"})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr ? "متوسط: السرعة القصوى (Speed) + التسارع والانطلاق (Acceleration)." : "Average of: Speed + Acceleration."}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-rose-400 flex items-center gap-1.5"><Target className="w-4 h-4" /> SHO ({isAr ? "التسديد" : "Shooting"})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr ? "متوسط: الإنهاء (Finishing) + قوة التسديد (Kicking Power) + الوعي الهجومي." : "Average of: Finishing + Kicking Power + Offensive Awareness."}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-blue-400 flex items-center gap-1.5"><Activity className="w-4 h-4" /> PAS ({isAr ? "التمرير" : "Passing"})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr ? "متوسط: التمرير القصير (Low Pass) + التمرير الطويل (Lofted Pass)." : "Average of: Low Pass + Lofted Pass."}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-teal-400 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> DRI ({isAr ? "المراوغة" : "Dribbling"})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr ? "متوسط: المراوغة (Dribbling) + التحكم بالكرة (Ball Control) + التوازن الجسدي." : "Average of: Dribbling + Ball Control + Balance."}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-purple-400 flex items-center gap-1.5"><Shield className="w-4 h-4" /> DEF ({isAr ? "الدفاع" : "Defense"})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr ? "متوسط: الوعي الدفاعي + افتكاك الكرة + الشراسة (Aggression)." : "Average of: Defensive Awareness + Ball Winning + Aggression."}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between font-black">
                      <span className="text-orange-400 flex items-center gap-1.5"><Dumbbell className="w-4 h-4" /> PHY ({isAr ? "البدنيات" : "Physicality"})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr ? "متوسط: الالتحام والقوة الجسدية + اللياقة والتحمل (Stamina) + القفز." : "Average of: Physical Contact + Stamina + Jump."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Position Weights */}
              <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 font-black text-emerald-400 text-base">
                  <Activity className="w-5 h-5" />
                  <span>{isAr ? "1. أوزان القدرات حسب المركز الأساسي" : "1. Position-Specific Attribute Weights"}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "لا يتم حساب التقييم كمتوسط بسيط لكل الـ 22 قدرة، بل يتم التركيز على القدرات الأكثر أهمية لمركزك في الملعب:"
                    : "OVR is not a simple average of all 22 abilities. Instead, heavily weighted attributes depend on your primary position:"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="font-black text-amber-400 block mb-1">CF / SS / RWF / LWF</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      {isAr ? "التركيز على: الوعي الهجومي، الإنهاء، السرعة، والتسارع." : "Heavily weights: Offensive Awareness, Finishing, Speed, & Acceleration."}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="font-black text-blue-400 block mb-1">AMF / CMF / RMF / LMF</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      {isAr ? "التركيز على: التمرير المنخفض والمرتفع، التحكم بالكرة، والمراوغة." : "Heavily weights: Low/Lofted Pass, Ball Control, & Dribbling."}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="font-black text-emerald-400 block mb-1">DMF / CB / LB / RB</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      {isAr ? "التركيز على: الوعي الدفاعي، قطع الكرة، والالتحام الجسدي." : "Heavily weights: Defensive Awareness, Ball Winning, & Physical Contact."}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="font-black text-purple-400 block mb-1">{isAr ? "GK (حراسة المرمى)" : "GK (Goalkeeping)"}</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      {isAr ? "التركيز على: وعي الحارس، رد فعل الحارس، الإمساك، الوصول، والتشتيت." : "Heavily weights: GK Reflexes, GK Reach, & GK Catching."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Physical & Age Modifiers */}
              <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 space-y-2 shadow-xl">
                <div className="flex items-center gap-2 font-black text-teal-400 text-base">
                  <Award className="w-5 h-5" />
                  <span>{isAr ? "2. العوامل البدنية والسن (Physical & Age Modifiers)" : "2. Physical & Age Modifiers"}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "يتم مراعاة الطول والوزن وتناسبهما (BMI). على سبيل المثال: قلب الدفاع أو حارس المرمى فارع الطول (أطول من 185 سم) أو ذو البنية القوية يحصل على نقطة إضافية في التنافس البدني، كما يتم تعديل السرعة والتحمل بشكل طفيف حسب السن واللياقة."
                    : "Height and Weight (BMI) adjust performance traits. For instance, tall CBs or GKs (185cm+) receive physical reach bonuses, while age and build slightly refine stamina and balance consistency."}
                </p>
              </div>

              {/* Section 4: Peer Ratings & Admin Consensus */}
              <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 space-y-2 shadow-xl">
                <div className="flex items-center gap-2 font-black text-purple-400 text-base">
                  <Users className="w-5 h-5" />
                  <span>{isAr ? "3. تقييمات الزملاء واعتماد المسؤول" : "3. Peer Ratings & Admin Consensus"}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? "يمكن لزملائك في المجتمع اقتراح تعديل على طاقاتك أو تقييمك بعد المباريات. يقوم المسؤول (Admin/Owner) بمراجعة واعتدال هذه التقييمات واعتماد المتوسط الواقعي لضمان العدالة وتوازن الفرق."
                    : "Peers can suggest ability updates and rate match performances. Community Admins review and approve these consensus averages to guarantee balanced squads during matchmaking."}
                </p>
              </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg transition-all active:scale-95"
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
