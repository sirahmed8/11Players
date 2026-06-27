'use client';

import React from 'react';
import { motion } from 'framer-motion';

import type { PESPosition } from '@/types';

export const PLAYER_STYLES = [
  { id: 'goal_poacher', en: 'Goal Poacher', ar: 'مهاجم قناص', descEn: 'Always looking to run off the last defender.', descAr: 'يسعى دائماً للهروب من آخر مدافع.', positions: ['CF', 'SS'] },
  { id: 'fox_in_the_box', en: 'Fox in the Box', ar: 'ثعلب المربع', descEn: 'Lurks in the box waiting for the ball.', descAr: 'يتربص داخل منطقة الجزاء في انتظار الكرة.', positions: ['CF'] },
  { id: 'target_man', en: 'Target Man', ar: 'محطة لعب', descEn: 'Holds up the ball to bring others into play.', descAr: 'يستلم الكرة ويهيئها لزملائه.', positions: ['CF'] },
  { id: 'creative_playmaker', en: 'Creative Playmaker', ar: 'صانع لعب مبدع', descEn: 'Takes advantage of any opening in the defense.', descAr: 'يستغل أي ثغرة في الدفاع.', positions: ['SS', 'AMF', 'LWF', 'RWF'] },
  { id: 'hole_player', en: 'Hole Player', ar: 'لاعب ثغرات', descEn: 'Makes late runs into the box to score.', descAr: 'يقوم بانطلاقات متأخرة لمنطقة الجزاء للتسجيل.', positions: ['SS', 'AMF', 'RMF', 'LMF', 'CMF'] },
  { id: 'classic_no_10', en: 'Classic No. 10', ar: 'رقم 10 كلاسيكي', descEn: 'An old-style static playmaker.', descAr: 'صانع ألعاب كلاسيكي يركز على التمرير.', positions: ['AMF', 'CMF'] },
  { id: 'prolific_winger', en: 'Prolific Winger', ar: 'جناح هداف', descEn: 'Positions himself on the wing to cut inside.', descAr: 'يتمركز على الجناح ليخترق للداخل.', positions: ['LWF', 'RWF'] },
  { id: 'orchestrator', en: 'Orchestrator', ar: 'مايسترو', descEn: 'Dictates the play from deep positions.', descAr: 'يتحكم في إيقاع اللعب من مناطق متأخرة.', positions: ['CMF', 'DMF'] },
  { id: 'box_to_box', en: 'Box-to-Box', ar: 'من الصندوق للصندوق', descEn: 'Tirelessly covers the whole pitch.', descAr: 'يغطي الملعب بالكامل بلا كلل.', positions: ['CMF', 'DMF', 'RMF', 'LMF'] },
  { id: 'the_destroyer', en: 'The Destroyer', ar: 'المدمر', descEn: 'A tenacious tackler who stops attacks.', descAr: 'مدافع شرس يوقف هجمات الخصم.', positions: ['DMF', 'CB'] },
  { id: 'anchor_man', en: 'Anchor Man', ar: 'ارتكاز دفاعي', descEn: 'Protects the backline defensively.', descAr: 'يحمي خط الدفاع بشكل أساسي.', positions: ['DMF'] },
  { id: 'build_up', en: 'Build Up', ar: 'بناء اللعب', descEn: 'Drops back to receive the ball and trigger attacks.', descAr: 'يتراجع لاستلام الكرة وبدء الهجمات.', positions: ['CB'] },
  { id: 'offensive_fullback', en: 'Offensive Full-back', ar: 'ظهير هجومي', descEn: 'Constantly runs up the wing to attack.', descAr: 'يتقدم باستمرار على الجناح للهجوم.', positions: ['LB', 'RB'] },
  { id: 'defensive_fullback', en: 'Defensive Full-back', ar: 'ظهير دفاعي', descEn: 'Prefers to stay back and fulfill defensive duties.', descAr: 'يفضل البقاء في الخلف للقيام بالمهام الدفاعية.', positions: ['LB', 'RB'] },
  { id: 'offensive_gk', en: 'Offensive Goalkeeper', ar: 'حارس هجومي', descEn: 'Often comes out of the goal area.', descAr: 'غالباً ما يخرج من منطقة المرمى.', positions: ['GK'] },
  { id: 'defensive_gk', en: 'Defensive Goalkeeper', ar: 'حارس دفاعي', descEn: 'Prefers to stay on the goal line.', descAr: 'يفضل البقاء على خط المرمى.', positions: ['GK'] }
];

interface PlayerStylePickerProps {
  selectedStyle: string;
  onStyleSelect: (styleId: string) => void;
  locale: 'en' | 'ar';
  primaryPosition?: PESPosition | null;
}

export default function PlayerStylePicker({ selectedStyle, onStyleSelect, locale, primaryPosition }: PlayerStylePickerProps) {
  const isAr = locale === 'ar';
  
  const filteredStyles = primaryPosition
    ? PLAYER_STYLES.filter(s => s.positions.includes(primaryPosition))
    : PLAYER_STYLES;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto overflow-x-hidden p-3 -mx-3 custom-scrollbar">
        {filteredStyles.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <motion.button
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStyleSelect(style.id)}
              className={`
                flex flex-col items-start p-3 rounded-xl border text-left transition-all h-full
                ${isSelected
                  ? 'bg-emerald-600/20 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                  : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600 hover:bg-slate-800/60'
                }
              `}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <span className={`font-bold text-sm mb-1 ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                {isAr ? style.ar : style.en}
              </span>
              <span className={`text-xs leading-relaxed ${isSelected ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                {isAr ? style.descAr : style.descEn}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
