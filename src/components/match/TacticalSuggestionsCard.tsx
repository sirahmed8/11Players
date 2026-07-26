'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Shield, Zap, Target, ArrowRight, Brain } from 'lucide-react';
import { PESPosition, PlayerAttributes } from '@/types';
import { getTacticalSuggestions } from '@/lib/suggestionEngine';
import { useLocale } from '@/components/ui/ThemeProvider';
import { PLAYER_STYLES } from '@/components/player/PlayerStylePicker';
import { getPlayerOverall } from '@/lib/playerUtils';

interface TacticalSuggestionsCardProps {
  attributes?: Partial<PlayerAttributes> | null;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  onApplySuggestions?: (positions: { primary: PESPosition; secondary: PESPosition; tertiary: PESPosition }, playStyle: string) => void;
  compact?: boolean;
  playerProfile?: any;
  isOwnProfile?: boolean;
  currentPrimaryPosition?: string;
  currentPlayStyle?: string;
}

export default function TacticalSuggestionsCard({
  attributes,
  height = 175,
  weight = 70,
  preferredFoot = 'Right',
  onApplySuggestions,
  compact = false,
  playerProfile,
  isOwnProfile = true,
  currentPrimaryPosition,
  currentPlayStyle
}: TacticalSuggestionsCardProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [realAiAdvice, setRealAiAdvice] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);

  const todayKey = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  const storageKey = `11players_ai_advice_${todayKey}_${playerProfile?.uid || 'guest'}`;
  const [remainingUses, setRemainingUses] = React.useState<number>(3);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const used = parseInt(localStorage.getItem(storageKey) || "0", 10);
    setRemainingUses(Math.max(0, 3 - used));
  }, [storageKey]);

  const handleFetchAiAdvice = async () => {
    if (!playerProfile || remainingUses <= 0 || aiLoading) return;
    setAiLoading(true);

    try {
      const playerName = playerProfile.fullName || playerProfile.displayName || "Player";
      const playerOvr = getPlayerOverall(playerProfile);
      const playerPos = playerProfile.primaryPosition || "MID";

      const prompt = isAr
        ? `أنا كابتن ${playerName} لمركز ${playerPos} بتقييم ${playerOvr}. أعطني نصيحة تكتيكية مخصصة وموجزة جداً من 11AI في جملتين لرفع التقييم وتطوير الأداء.`
        : `I am Captain ${playerName}, playing ${playerPos} with ${playerOvr} OVR. Give me a concise 2-sentence 11AI tactical coaching tip to boost my performance.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          playerContext: {
            fullName: playerName,
            overall: playerOvr,
            primaryPosition: playerPos,
          },
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setRealAiAdvice(data.reply);
        const used = parseInt(localStorage.getItem(storageKey) || "0", 10) + 1;
        localStorage.setItem(storageKey, used.toString());
        setRemainingUses(Math.max(0, 3 - used));
      }
    } catch (err) {
      console.warn("AI Tactical Advisor fetch error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const suggestions = useMemo(() => {
    return getTacticalSuggestions(
      attributes, 
      height, 
      weight, 
      preferredFoot, 
      playerProfile?.calculatedAge, 
      playerProfile?.peerRatingAvg, 
      playerProfile?.peerRatingCount
    );
  }, [attributes, height, weight, preferredFoot, playerProfile]);

  const topPos = suggestions.positions.slice(0, 3);

  const handleApply = (positionIndex: number) => {
    if (!onApplySuggestions) return;
    
    const primary = topPos[positionIndex]?.position || 'CF';
    const remaining = topPos.filter((_, i) => i !== positionIndex);
    const secondary = remaining[0]?.position || 'SS';
    const tertiary = remaining[1]?.position || 'AMF';

    const playStyle = topPos[positionIndex]?.bestPlayStyle || 'goal_poacher';
    onApplySuggestions({ primary, secondary, tertiary }, playStyle);
  };

  const renderPersonalizedPositionHint = () => {
    if (!playerProfile) return null;

    const currentPos = playerProfile.primaryPosition || 'CMF';
    const currentStyle = playerProfile.playStyle || '';
    const bestPos = suggestions.positions[0];

    const chosenStrEn = isOwnProfile ? "Your chosen position is" : "His chosen position is";
    const chosenStrAr = isOwnProfile ? "مركزك المختار هو" : "مركزه المختار هو";

    const youdGetEn = isOwnProfile ? "you'd get" : "he'd get";
    const youdGetAr = isOwnProfile ? "ستحصل على" : "سيحصل على";

    const alreadyBest = currentPos === bestPos.position && (!bestPos.bestPlayStyle || currentStyle === bestPos.bestPlayStyle);

    if (alreadyBest) {
      return isAr
        ? `🏆 ممتاز! ${isOwnProfile ? 'أنت' : 'اللاعب'} بالفعل في أفضل مركز ممكن (${currentPos}) وأسلوب لعب مثالي! استمر بالتطوير والتحسّن في طاقاتك لرفع التقييم!`
        : `🏆 Perfect! ${isOwnProfile ? 'You are' : 'He is'} already in the best possible position (${currentPos}) with an ideal play style! Focus on improving attributes to push the OVR even higher.`;
    }

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
    if (!playerProfile) return null;

    const currentStyleId = playerProfile.playStyle;
    const currentStyleObj = currentStyleId ? PLAYER_STYLES.find(s => s.id === currentStyleId) : null;
    const currentStyleNameAr = currentStyleObj?.ar || 'غير محدد';
    const currentStyleNameEn = currentStyleObj?.en || 'None';
    
    const bestStyle = suggestions.playStyles[0];
    const bestPos = suggestions.positions[0];
    const alreadyBestStyle = currentStyleId === bestStyle.styleId || currentStyleId === bestPos.bestPlayStyle;

    const yourStyleEn = isOwnProfile ? "Your playstyle is" : "His playstyle is";
    const yourStyleAr = isOwnProfile ? "أسلوب لعبك هو" : "أسلوب لعبه هو";

    let styleAdvice = "";
    if (!currentStyleId) {
      styleAdvice = isAr
        ? `لم يتم اختيار أسلوب لعب بعد! نقترح بشدة اختيار (${bestStyle.styleAr}).`
        : `No Playstyle selected! We highly recommend choosing (${bestStyle.styleEn}).`;
    } else if (alreadyBestStyle) {
      styleAdvice = isAr
        ? `🏆 مثالي! أسلوب اللعب (${currentStyleNameAr}) هو الأمثل لبنيتك وقدراتك!`
        : `🏆 Ideal! The playstyle (${currentStyleNameEn}) is the perfect match for this build and abilities!`;
    } else if (currentStyleId !== bestStyle.styleId) {
      styleAdvice = isAr
        ? `${yourStyleAr} (${currentStyleNameAr}). بينما نوصي بتجريب (${bestStyle.styleAr}) حيث يتطابق بنسبة ${bestStyle.matchPercentage}%.`
        : `${yourStyleEn} (${currentStyleNameEn}). However, the AI suggests trying (${bestStyle.styleEn}) which matches abilities by ${bestStyle.matchPercentage}%.`;
    } else {
      styleAdvice = isAr
        ? `الأسلوب (${currentStyleNameAr}) متناغم تماماً!`
        : `The playstyle (${currentStyleNameEn}) perfectly synergizes!`;
    }

    const hasSecondary = !!playerProfile.secondaryPosition;
    const hasTertiary = !!playerProfile.tertiaryPosition;
    
    if (!hasSecondary || !hasTertiary) {
      const posAdvice = isAr 
        ? " يرجى تحديد المراكز الإضافية لزيادة التناغم." 
        : " Set 2nd & 3rd positions to boost team synergy.";
      styleAdvice += posAdvice;
    }

    return styleAdvice;
  };

  return (
    <div
      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-white relative overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px]" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
            <Brain className="w-6 h-6 animate-pulse text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
              {isAr ? "المستشار التكتيكي بالذكاء الاصطناعي (AI Advisor)" : "AI Tactical Advisor"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-semibold">
              {isAr
                ? "تم التحليل الدقيق بناءً على طاقاتك الـ 22 والطول والوزن والقدم المفضلة"
                : "Deep analysis based on your 22 attributes, height, weight, and preferred foot"}
            </p>
          </div>
        </div>
      </div>

      {/* Personalized AI Advice Banner */}
      {playerProfile && (
        <div className="bg-slate-950/80 p-5 rounded-3xl border border-amber-500/30 space-y-3.5 shadow-xl mb-6 relative overflow-hidden z-10">
          <div className="flex items-center gap-2.5 font-black text-amber-400 text-sm">
            <Sparkles className="w-5 h-5 shrink-0 animate-bounce text-amber-400" />
            <span>
              {isAr 
                ? isOwnProfile ? "💡 نصيحة مخصصة لملفك الشخصي" : "💡 تحليل تكتيكي مخصص للاعب"
                : isOwnProfile ? "💡 Personalized AI Advice for Your Profile" : "💡 Personalized AI Advice for this Player"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-300">
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/20 shadow-sm leading-relaxed">
              <span className="font-black text-amber-400 block mb-1.5 text-xs">
                {isAr ? "🎯 المركز الأساسي" : "🎯 Primary Position"}
              </span>
              {renderPersonalizedPositionHint()}
            </div>
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/20 shadow-sm leading-relaxed">
              <span className="font-black text-emerald-400 block mb-1.5 text-xs">
                {isAr ? "⚽ التناغم والأسلوب" : "⚽ Synergy & Versatility"}
              </span>
              {renderPersonalizedStyleHint()}
            </div>
          </div>

          {/* Explicit 11AI Advice Button + 3 Daily Uses Limit */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleFetchAiAdvice}
              disabled={remainingUses <= 0 || aiLoading}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${
                remainingUses > 0
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <Brain className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
              <span>
                {aiLoading
                  ? (isAr ? "جاري استخراج النصيحة..." : "Fetching 11AI Advice...")
                  : remainingUses > 0
                  ? (isAr ? `💡 احصل على نصيحة 11AI التكتيكية (متبقي ${remainingUses}/3 اليوم)` : `💡 Get 11AI Tactical Advice (${remainingUses}/3 left today)`)
                  : (isAr ? "🔒 استنفذت محاولاتك اليومية الثلاث (عد غداً)" : "🔒 Daily 3/3 Limit Reached (Return Tomorrow)")}
              </span>
            </button>

            <span className="text-[10px] text-slate-400 font-bold self-center">
              {isAr ? `المتبقي لك اليوم: ${remainingUses} من 3` : `Daily Uses Left: ${remainingUses} of 3`}
            </span>
          </div>

          {/* Real 11AI Live Gemini Coaching Advice */}
          {realAiAdvice && (
            <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/40 shadow-md leading-relaxed text-xs text-emerald-200">
              <span className="font-black text-emerald-400 block mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{isAr ? "⚡ نصيحة 11AI التكتيكية اليومية" : "⚡ 11AI Daily Tactical Advice"}</span>
              </span>
              <p className="text-slate-200 font-medium">{realAiAdvice}</p>
            </div>
          )}
        </div>
      )}

      {/* Grid of Recommended Positions */}
      <div className="space-y-4 relative z-10">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? "أفضل المراكز المقترحة لك (الأساسي وثاني وثالث مركز)" : "TOP SUGGESTED POSITIONS (1ST, 2ND, 3RD)"}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topPos.map((item, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            const labelsAr = ['المركز الأساسي (1st)', 'المركز الثاني (2nd)', 'المركز الثالث (3rd)'];
            const labelsEn = ['PRIMARY POSITION (1ST)', 'SECONDARY POSITION (2ND)', 'TERTIARY POSITION (3RD)'];
            
            const isPrimary = idx === 0;

            return (
              <div
                key={item.position}
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                  isPrimary
                    ? 'bg-slate-950/80 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/30'
                    : 'bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-xl'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {medals[idx]} {isAr ? labelsAr[idx] : labelsEn[idx]}
                    </span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${
                      isPrimary 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md' 
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {item.matchPercentage}% {isAr ? 'تطابق' : 'Match'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base sm:text-lg tracking-wider shadow-md shrink-0 ${
                      isPrimary
                        ? 'bg-slate-950 text-emerald-400 border-2 border-emerald-400/80'
                        : 'bg-slate-900 text-white border border-slate-700'
                    }`}>
                      {item.position}
                    </span>
                    {playerProfile && (
                      <span className="text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-sm">
                        {isAr ? "متوقع:" : "Expected OVR:"} {getPlayerOverall({ 
                          ...playerProfile, 
                          primaryPosition: item.position, 
                          playStyle: item.bestPlayStyle || playerProfile.playStyle,
                          approvedAttributes: playerProfile.approvedAttributes || playerProfile.attributes,
                          attributes: playerProfile.approvedAttributes || playerProfile.attributes,
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-semibold mb-3">
                    {isAr ? item.rationaleAr : item.rationaleEn}
                  </p>

                  {item.bestPlayStyle && (
                    <div className="px-3 py-2 bg-slate-950/80 rounded-xl border border-amber-500/30 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-black text-amber-400">
                        {isAr ? "أسلوب اللعب المقترح:" : "Best Play Style:"} {PLAYER_STYLES.find(s => s.id === item.bestPlayStyle)?.[isAr ? 'ar' : 'en'] || item.bestPlayStyle}
                      </span>
                    </div>
                  )}
                </div>

                {onApplySuggestions && isOwnProfile && (() => {
                  const actualPos = currentPrimaryPosition || playerProfile?.primaryPosition;
                  const actualStyle = currentPlayStyle || playerProfile?.playStyle;
                  const isAlreadyApplied = actualPos === item.position && 
                    (!item.bestPlayStyle || actualStyle === item.bestPlayStyle);
                  
                  return (
                    <button
                      onClick={() => !isAlreadyApplied && handleApply(idx)}
                      disabled={isAlreadyApplied}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        isAlreadyApplied
                          ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                          : isPrimary
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50 active:scale-95' 
                            : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95 border border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isAlreadyApplied 
                        ? (isAr ? "مُطبق بالفعل" : "Applied") 
                        : (isAr ? "تطبيق هذا المركز" : "Apply this Setup")}
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
