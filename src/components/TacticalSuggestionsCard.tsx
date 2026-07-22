'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Shield, Zap, Target, ArrowRight } from 'lucide-react';
import { PESPosition, PlayerAttributes } from '@/types';
import { getTacticalSuggestions } from '@/lib/suggestionEngine';
import { useLocale } from '@/components/ThemeProvider';

interface TacticalSuggestionsCardProps {
  attributes?: Partial<PlayerAttributes> | null;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  onApplySuggestions?: (positions: { primary: PESPosition; secondary: PESPosition; tertiary: PESPosition }, playStyle: string) => void;
  compact?: boolean;
}

export default function TacticalSuggestionsCard({
  attributes,
  height = 175,
  weight = 70,
  preferredFoot = 'Right',
  onApplySuggestions,
  compact = false
}: TacticalSuggestionsCardProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const suggestions = useMemo(() => {
    return getTacticalSuggestions(attributes, height, weight, preferredFoot);
  }, [attributes, height, weight, preferredFoot]);

  const topPos = suggestions.positions.slice(0, 3);
  const topStyles = suggestions.playStyles.slice(0, 2);

  const handleApply = () => {
    if (!onApplySuggestions) return;
    const primary = topPos[0]?.position || 'CF';
    const secondary = topPos[1]?.position || 'SS';
    const tertiary = topPos[2]?.position || 'AMF';
    const playStyle = topStyles[0]?.styleId || 'goal_poacher';
    onApplySuggestions({ primary, secondary, tertiary }, playStyle);
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

        {onApplySuggestions && (
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? "تطبيق المراكز والأسلوب المقترح" : "Apply AI Recommendations"}</span>
          </button>
        )}
      </div>

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
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    {isAr ? item.rationaleAr : item.rationaleEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggested Play Styles */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? "أسلوب اللعب الأكثر تناسباً مع قدراتك" : "Ideal Play Styles For Your Build & Abilities"}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topStyles.map((style, idx) => (
              <div
                key={style.styleId}
                className={`p-3.5 rounded-2xl border ${
                  idx === 0
                    ? 'bg-amber-950/40 border-amber-500/50 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black text-white flex items-center gap-1.5">
                    {idx === 0 && <span className="text-amber-400">⚡</span>}
                    {isAr ? style.styleAr : style.styleEn}
                  </span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {style.matchPercentage}% {isAr ? 'تطابق' : 'Match'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  {isAr ? style.rationaleAr : style.rationaleEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
