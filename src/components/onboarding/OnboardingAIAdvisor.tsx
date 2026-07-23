import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, CheckCircle2 } from 'lucide-react';
import { WizardState } from './types';
import type { PESPosition, PlayerAttributes } from '@/types';

interface OnboardingAIAdvisorProps {
  state: WizardState;
  locale: 'en' | 'ar';
  onApply: (updates: Partial<WizardState>) => void;
}

export default function OnboardingAIAdvisor({ state, locale, onApply }: OnboardingAIAdvisorProps) {
  const isAr = locale === 'ar';
  
  const [suggestion, setSuggestion] = useState<{
    playStyle: string;
    specialSkills: string[];
    primaryPosition?: PESPosition;
    rationale: string;
  } | null>(null);

  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    // Deterministic rule-based engine to evaluate the player's optimal setup
    const attrs = state.attributes;
    const pos = state.primaryPosition || 'CMF';

    // Calculate highest attributes
    const stats = [
      { name: 'Pace', val: attrs.speed },
      { name: 'Shooting', val: attrs.finishing },
      { name: 'Passing', val: attrs.lowPass },
      { name: 'Dribbling', val: attrs.dribbling },
      { name: 'Defending', val: attrs.defensiveAwareness },
      { name: 'Physical', val: attrs.physicalContact },
    ].sort((a, b) => b.val - a.val);

    const top1 = stats[0].name;
    const top2 = stats[1].name;
    
    let suggestedPlayStyle = state.playStyle || 'Box-to-Box';
    let suggestedSkills: string[] = [...(state.specialSkills || [])];
    let suggestedPos: PESPosition | undefined = undefined;
    let rationale = '';

    // Winger logic
    if (top1 === 'Pace' && (top2 === 'Dribbling' || top2 === 'Shooting' || top2 === 'Passing')) {
      if (!['LWF', 'RWF', 'LMF', 'RMF'].includes(pos)) {
        suggestedPos = 'LWF';
      }
      suggestedPlayStyle = 'Prolific Winger';
      suggestedSkills = ['Double Touch', 'Pinpoint Crossing', 'Sprint Speed'];
      rationale = isAr 
        ? `بناءً على سرعتك (${attrs.speed}) ومهارتك العالية (${stats[1].val})، مركز الجناح وأسلوب 'الجناح الهداف' هما الأفضل لك.`
        : `Based on your incredible Pace (${attrs.speed}) and ${top2} (${stats[1].val}), playing out wide as a 'Prolific Winger' is optimal.`;
    } 
    // Striker logic
    else if (top1 === 'Shooting' && (top2 === 'Physical' || top2 === 'Pace' || top2 === 'Dribbling')) {
      if (!['CF', 'SS'].includes(pos)) suggestedPos = 'CF';
      suggestedPlayStyle = 'Goal Poacher';
      suggestedSkills = ['First-time Shot', 'Acrobatic Finishing', 'Heading'];
      rationale = isAr 
        ? `بناءً على قوة تسديدك (${attrs.finishing})، مركز المهاجم الصريح (CF) وأسلوب 'الهداف' هما الأفضل لك.`
        : `Your finishing abilities (${attrs.finishing}) make you a natural 'Goal Poacher'.`;
    }
    // Midfielder logic
    else if (top1 === 'Passing' && (top2 === 'Dribbling' || top2 === 'Pace' || top2 === 'Shooting')) {
      if (!['AMF', 'CMF'].includes(pos)) suggestedPos = 'AMF';
      suggestedPlayStyle = 'Creative Playmaker';
      suggestedSkills = ['One-touch Pass', 'Through Passing', 'Weighted Pass'];
      rationale = isAr 
        ? `تمريراتك الساحرة (${attrs.lowPass}) تجعلك 'صانع ألعاب مبدع' مثالي في خط الوسط.`
        : `Your exceptional Passing (${attrs.lowPass}) makes you a perfect 'Creative Playmaker' in midfield.`;
    }
    // Defender logic
    else if (top1 === 'Defending' || top1 === 'Physical') {
      if (!['CB', 'DMF'].includes(pos)) suggestedPos = 'CB';
      suggestedPlayStyle = 'Build Up';
      suggestedSkills = ['Man Marking', 'Interception', 'Aerial Superiority'];
      rationale = isAr
        ? `بنيتك الجسدية ودفاعك (${attrs.defensiveAwareness}) يجعلانك قلب دفاع صلب وأسلوب 'بناء اللعب' مثالي لك.`
        : `Your strong Defending (${attrs.defensiveAwareness}) makes you an excellent 'Build Up' defender.`;
    } 
    // Balanced
    else {
      suggestedPlayStyle = 'Box-to-Box';
      suggestedSkills = ['Track Back', 'Fighting Spirit', 'Interception'];
      rationale = isAr
        ? `أرقامك متوازنة جداً، أسلوب 'من الصندوق للصندوق' هو الأنسب لجهدك في الملعب.`
        : `Your well-rounded stats make you a fantastic 'Box-to-Box' engine.`;
    }

    setSuggestion({
      playStyle: suggestedPlayStyle,
      specialSkills: suggestedSkills.slice(0, 3), // max 3
      primaryPosition: suggestedPos,
      rationale,
    });
    setHasApplied(false);
  }, [state.attributes, state.primaryPosition, state.height, state.weight, isAr]);

  if (!suggestion) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 text-indigo-500/5 dark:text-indigo-400/5">
        <Brain size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
            {isAr ? 'المستشار الذكي (AI Advisor)' : 'AI Advisor Recommendations'}
          </h3>
        </div>

        <p className="text-slate-700 dark:text-slate-300 mb-4 text-sm leading-relaxed">
          {suggestion.rationale}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {suggestion.primaryPosition && (
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-indigo-50 dark:border-indigo-500/10">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'المركز الأفضل' : 'Best Position'}</div>
              <div className="font-bold text-indigo-700 dark:text-indigo-400">{suggestion.primaryPosition}</div>
            </div>
          )}
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-indigo-50 dark:border-indigo-500/10">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'أسلوب اللعب' : 'Play Style'}</div>
            <div className="font-bold text-indigo-700 dark:text-indigo-400">{suggestion.playStyle}</div>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-indigo-50 dark:border-indigo-500/10">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{isAr ? 'المهارات المقترحة' : 'Suggested Skills'}</div>
            <div className="font-bold text-indigo-700 dark:text-indigo-400 text-sm truncate">
              {suggestion.specialSkills.join(', ')}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const updates: Partial<WizardState> = {
              playStyle: suggestion.playStyle,
              specialSkills: suggestion.specialSkills,
            };
            if (suggestion.primaryPosition) updates.primaryPosition = suggestion.primaryPosition;
            onApply(updates);
            setHasApplied(true);
          }}
          disabled={hasApplied}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            hasApplied 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95'
          }`}
        >
          {hasApplied ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {isAr ? 'تم تطبيق الاقتراحات!' : 'Suggestions Applied!'}
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              {isAr ? 'تطبيق اقتراحات الذكاء الاصطناعي' : 'Apply AI Suggestions'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
