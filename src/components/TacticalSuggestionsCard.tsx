'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Shield, Zap, Target, ArrowRight } from 'lucide-react';
import { PESPosition, PlayerAttributes } from '@/types';
import { getTacticalSuggestions } from '@/lib/suggestionEngine';
import { useLocale } from '@/components/ThemeProvider';
import { PLAYER_STYLES } from '@/components/PlayerStylePicker';
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
}

export default function TacticalSuggestionsCard({
  attributes,
  height = 175,
  weight = 70,
  preferredFoot = 'Right',
  onApplySuggestions,
  compact = false,
  playerProfile,
  isOwnProfile = true
}: TacticalSuggestionsCardProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

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
    const bestPos = suggestions.positions[0];

    const chosenStrEn = isOwnProfile ? "Your chosen position is" : "The player's chosen position is";
    const chosenStrAr = isOwnProfile ? "مركزك المختار هو" : "المركز المختار للاعب هو";

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
    if (!playerProfile) return null;

    const currentStyleId = playerProfile.playStyle;
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
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border border-emerald-500/40 shadow-2xl p-5 sm:p-6 text-white relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background glow around badge */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              {isAr ? "المستشار التكتيكي بالذكاء الاصطناعي (AI Advisor)" : "AI Tactical Advisor"}
            </h3>
            <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">
              {isAr
                ? "تم التحليل الدقيق بناءً على طاقاتك الـ 22 والطول والوزن والقدم المفضلة"
                : "Deep analysis based on your 22 attributes, height, weight, and preferred foot"}
            </p>
          </div>
        </div>
      </div>

      {/* AI Advice Banner */}
      {playerProfile && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-4 rounded-2xl border border-amber-500/40 shadow-sm mb-5 space-y-3">
          <div className="flex items-center gap-2.5 font-black text-amber-500 text-sm">
            <Sparkles className="w-5 h-5 shrink-0 animate-bounce" />
            <span>
              {isAr 
                ? isOwnProfile ? "💡 نصيحة مخصصة لك" : "💡 تحليل مخصص للاعب"
                : isOwnProfile ? "💡 Personalized AI Advice for Your Profile" : "💡 Personalized AI Advice for this Player"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-amber-500/20">
              <span className="font-bold text-amber-400 block mb-1">
                {isAr ? "🎯 المركز الأساسي" : "🎯 Primary Position"}
              </span>
              {renderPersonalizedPositionHint()}
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-emerald-500/20">
              <span className="font-bold text-emerald-400 block mb-1">
                {isAr ? "⚽ التناغم والأسلوب" : "⚽ Synergy & Versatility"}
              </span>
              {renderPersonalizedStyleHint()}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Recommended Positions */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>{isAr ? "أفضل المراكز المقترحة لك (الأساسي وثاني وثالث مركز)" : "Top Suggested Positions (1st, 2nd, 3rd)"}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topPos.map((item, idx) => {
              const medals = ['🥇', '🥈', '🥉'];
              const labelsAr = ['المركز الأساسي (1st)', 'المركز الثاني (2nd)', 'المركز الثالث (3rd)'];
              const labelsEn = ['Primary Position (1st)', 'Secondary Position (2nd)', 'Tertiary Position (3rd)'];
              return (
                <div
                  key={item.position}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    idx === 0
                      ? 'bg-emerald-950/60 border-emerald-500/60 shadow-md shadow-emerald-900/20'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {medals[idx]} {isAr ? labelsAr[idx] : labelsEn[idx]}
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                      idx === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {item.matchPercentage}% {isAr ? 'تطابق' : 'Match'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-black text-white bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">{item.position}</span>
                    {playerProfile && (
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                        {isAr ? "متوقع:" : "Expected OVR:"} {getPlayerOverall({ ...playerProfile, primaryPosition: item.position, playStyle: item.bestPlayStyle })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium mb-2">
                    {isAr ? item.rationaleAr : item.rationaleEn}
                  </p>
                  
                  {item.bestPlayStyle && (
                    <div className="mb-3 px-2 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-bold text-amber-400">
                        {isAr ? "أسلوب اللعب المقترح:" : "Best Play Style:"} {PLAYER_STYLES.find(s => s.id === item.bestPlayStyle)?.[isAr ? 'ar' : 'en'] || item.bestPlayStyle}
                      </span>
                    </div>
                  )}
                  
                  {onApplySuggestions && isOwnProfile && (
                    <button
                      onClick={() => handleApply(idx)}
                      className={`w-full py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        idx === 0 
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? "تطبيق هذا المركز" : "Apply this Setup"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
