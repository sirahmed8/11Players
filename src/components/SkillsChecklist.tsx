'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ──────────────────────────────────────────────
   Translations
   ────────────────────────────────────────────── */
const translations = {
  en: {
    title: 'Special Skills',
    subtitle: 'Select the skills that describe your playing style',
    selected: 'selected',
    clearAll: 'Clear All',
  },
  ar: {
    title: 'المهارات الخاصة',
    subtitle: 'اختر المهارات التي تصف أسلوب لعبك',
    selected: 'مختارة',
    clearAll: 'مسح الكل',
  },
} as const;

/* ──────────────────────────────────────────────
   Skill Data
   ────────────────────────────────────────────── */
interface SkillInfo {
  id: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  category: 'passing' | 'shooting' | 'defending' | 'dribbling' | 'physical' | 'goalkeeping';
}

const SKILLS: SkillInfo[] = [
  // Passing
  { id: 'one_touch_pass', label: 'One-touch Pass', labelAr: 'التمريرة بلمسة واحدة', description: 'Accurate passes with just one touch', descriptionAr: 'تمريرات دقيقة بلمسة واحدة', category: 'passing' },
  { id: 'through_passing', label: 'Through Passing', labelAr: 'التمريرة البينية', description: 'Precise through balls behind the defense', descriptionAr: 'تمريرات بينية دقيقة خلف الدفاع', category: 'passing' },
  { id: 'pinpoint_crossing', label: 'Pinpoint Crossing', labelAr: 'العرضية الدقيقة', description: 'Highly accurate crosses into the box', descriptionAr: 'عرضيات دقيقة جداً داخل منطقة الجزاء', category: 'passing' },
  { id: 'outside_curler', label: 'Outside Curler', labelAr: 'الكيرفة الخارجية', description: 'Curl passes and shots with outside of foot', descriptionAr: 'تمريرات وتسديدات منحنية بخارج القدم', category: 'passing' },
  { id: 'weighted_pass', label: 'Weighted Pass', labelAr: 'التمريرة الموزونة', description: 'Perfectly weighted passes to teammates', descriptionAr: 'تمريرات بقوة مثالية للزملاء', category: 'passing' },
  { id: 'long_throw', label: 'Long Throw', labelAr: 'الرمية الطويلة', description: 'Can throw the ball far into the box', descriptionAr: 'قادر على رمي الكرة لمسافة بعيدة', category: 'passing' },

  // Shooting
  { id: 'long_range_drive', label: 'Long Range Drive', labelAr: 'التسديدة البعيدة', description: 'Powerful and accurate long-range shots', descriptionAr: 'تسديدات قوية ودقيقة من مسافات بعيدة', category: 'shooting' },
  { id: 'knuckle_shot', label: 'Knuckle Shot', labelAr: 'الكرة المتذبذبة', description: 'Shots that swerve unpredictably in the air', descriptionAr: 'تسديدات تتذبذب في الهواء بشكل غير متوقع', category: 'shooting' },
  { id: 'rising_shot', label: 'Rising Shot', labelAr: 'التسديدة الصاعدة', description: 'Powerful rising shots that climb towards goal', descriptionAr: 'تسديدات قوية صاعدة نحو المرمى', category: 'shooting' },
  { id: 'first_time_shot', label: 'First-time Shot', labelAr: 'التسديدة المباشرة', description: 'Accurate shots without controlling the ball first', descriptionAr: 'تسديدات دقيقة بدون السيطرة على الكرة أولاً', category: 'shooting' },
  { id: 'penalty_specialist', label: 'Penalty Specialist', labelAr: 'متخصص ركلات الجزاء', description: 'Calm and accurate penalty kick taker', descriptionAr: 'مسدد ركلات جزاء هادئ ودقيق', category: 'shooting' },
  { id: 'chip_shot_control', label: 'Chip Shot Control', labelAr: 'التسديدة اللوبية', description: 'Delicate chip shots over the goalkeeper', descriptionAr: 'تسديدات لوبية ناعمة فوق حارس المرمى', category: 'shooting' },
  { id: 'rabona', label: 'Rabona', labelAr: 'رابونا', description: 'Can perform the rabona kick technique', descriptionAr: 'قادر على تنفيذ تقنية الرابونا', category: 'shooting' },

  // Defending
  { id: 'acrobatic_clearance', label: 'Acrobatic Clearance', labelAr: 'التشتيت البهلواني', description: 'Spectacular clearances in difficult situations', descriptionAr: 'تشتيتات رائعة في المواقف الصعبة', category: 'defending' },
  { id: 'interception', label: 'Interception', labelAr: 'قطع الكرات', description: 'Excellent at reading and cutting passing lanes', descriptionAr: 'ممتاز في قراءة وقطع خطوط التمرير', category: 'defending' },
  { id: 'man_marking', label: 'Man Marking', labelAr: 'المراقبة اللصيقة', description: 'Tight man-to-man marking ability', descriptionAr: 'قدرة عالية على المراقبة اللصيقة', category: 'defending' },
  { id: 'track_back', label: 'Track Back', labelAr: 'الرجوع الدفاعي', description: 'Willingness to chase back and defend', descriptionAr: 'الاستعداد للرجوع والمساهمة دفاعياً', category: 'defending' },
  { id: 'sliding_tackle', label: 'Sliding Tackle', labelAr: 'الانزلاق', description: 'Clean and effective sliding tackles', descriptionAr: 'انزلاقات نظيفة وفعالة', category: 'defending' },

  // Dribbling
  { id: 'scissors_feint', label: 'Scissors Feint', labelAr: 'المقص', description: 'Quick scissors feint to deceive defenders', descriptionAr: 'حركة المقص السريعة لخداع المدافعين', category: 'dribbling' },
  { id: 'step_on_skill', label: 'Step On Skill', labelAr: 'الدوس على الكرة', description: 'Skillful step-on moves for close control', descriptionAr: 'حركات الدوس على الكرة للتحكم القريب', category: 'dribbling' },
  { id: 'double_touch', label: 'Double Touch', labelAr: 'اللمسة المزدوجة', description: 'Quick double-touch to change direction', descriptionAr: 'اللمسة المزدوجة السريعة لتغيير الاتجاه', category: 'dribbling' },
  { id: 'flip_flap', label: 'Flip Flap', labelAr: 'فليب فلاب', description: 'Elastico-style flip flap move', descriptionAr: 'حركة الفليب فلاب على طريقة الإلاستيكو', category: 'dribbling' },
  { id: 'marseille_turn', label: 'Marseille Turn', labelAr: 'لفة مارسيليا', description: 'The classic Zidane roulette spin move', descriptionAr: 'حركة الدوران الكلاسيكية على طريقة زيدان', category: 'dribbling' },
  { id: 'sombrero', label: 'Sombrero', labelAr: 'سومبريرو', description: 'Flick the ball over the opponent\'s head', descriptionAr: 'رفع الكرة فوق رأس الخصم', category: 'dribbling' },
  { id: 'elastico', label: 'Elastico', labelAr: 'إلاستيكو', description: 'The famous elastico dribbling technique', descriptionAr: 'تقنية الإلاستيكو الشهيرة', category: 'dribbling' },
  { id: 'heel_trick', label: 'Heel Trick', labelAr: 'خدعة الكعب', description: 'Clever heel flicks and passes', descriptionAr: 'تمريرات وحركات ذكية بالكعب', category: 'dribbling' },
  { id: 'speed_merchant', label: 'Speed Merchant', labelAr: 'تاجر السرعة', description: 'Exceptional pace to outrun defenders', descriptionAr: 'سرعة استثنائية لتجاوز المدافعين', category: 'dribbling' },

  // Physical / Mental
  { id: 'captaincy', label: 'Captaincy', labelAr: 'القيادة', description: 'Natural leader that inspires the team', descriptionAr: 'قائد طبيعي يلهم الفريق', category: 'physical' },
  { id: 'super_sub', label: 'Super Sub', labelAr: 'البديل الخارق', description: 'Performs better when coming off the bench', descriptionAr: 'أداء أفضل عند الدخول كبديل', category: 'physical' },
  { id: 'fighting_spirit', label: 'Fighting Spirit', labelAr: 'الروح القتالية', description: 'Never gives up, fights until the end', descriptionAr: 'لا يستسلم أبداً، يقاتل حتى النهاية', category: 'physical' },
  { id: 'aerial_superiority', label: 'Aerial Superiority', labelAr: 'التفوق الهوائي', description: 'Dominant in aerial duels and headers', descriptionAr: 'مسيطر في الصراعات الهوائية والضربات الرأسية', category: 'physical' },

  // Goalkeeping
  { id: 'low_punt_trajectory', label: 'Low Punt Trajectory', labelAr: 'الركلة المنخفضة', description: 'Goal kicks with a low, fast trajectory', descriptionAr: 'ركلات مرمى بمسار منخفض وسريع', category: 'goalkeeping' },
  { id: 'gk_long_throw', label: 'GK Long Throw', labelAr: 'رمية الحارس الطويلة', description: 'Goalkeeper can throw the ball far distances', descriptionAr: 'قدرة الحارس على رمي الكرة لمسافات بعيدة', category: 'goalkeeping' },
  { id: 'gk_reflexes', label: 'GK Reflexes', labelAr: 'ردود فعل الحارس', description: 'Lightning-fast reflexes to make saves', descriptionAr: 'ردود فعل سريعة كالبرق لإنقاذ المرمى', category: 'goalkeeping' },
];

const CATEGORY_LABELS: Record<string, { en: string; ar: string; icon: string }> = {
  passing: { en: 'Passing', ar: 'التمرير', icon: '🎯' },
  shooting: { en: 'Shooting', ar: 'التسديد', icon: '🔥' },
  defending: { en: 'Defending', ar: 'الدفاع', icon: '🛡️' },
  dribbling: { en: 'Dribbling', ar: 'المراوغة', icon: '🏃' },
  physical: { en: 'Physical / Mental', ar: 'البدنية والذهنية', icon: '💪' },
  goalkeeping: { en: 'Goalkeeping', ar: 'حراسة المرمى', icon: '🧤' },
};

const CATEGORIES = ['passing', 'shooting', 'defending', 'dribbling', 'physical', 'goalkeeping'] as const;

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */
interface SkillsChecklistProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  locale?: 'en' | 'ar';
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function SkillsChecklist({
  selectedSkills,
  onSkillsChange,
  locale = 'ar',
}: SkillsChecklistProps) {
  const txt = translations[locale];
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  const toggleSkill = useCallback(
    (skillId: string) => {
      onSkillsChange(
        selectedSkills.includes(skillId)
          ? selectedSkills.filter((s) => s !== skillId)
          : [...selectedSkills, skillId],
      );
    },
    [selectedSkills, onSkillsChange],
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{txt.title}</h2>
        <p className="text-sm text-slate-400 mt-1">{txt.subtitle}</p>
      </div>

      {/* Selected count + Clear */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-2.5 border border-slate-700/40">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-black text-lg">{selectedSkills.length}</span>
          <span className="text-slate-400 text-sm">{txt.selected}</span>
        </div>
        {selectedSkills.length > 0 && (
          <button
            onClick={() => onSkillsChange([])}
            className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            {txt.clearAll}
          </button>
        )}
      </div>

      {/* Skills by Category */}
      {CATEGORIES.map((cat) => {
        const catSkills = SKILLS.filter((s) => s.category === cat);
        const catLabel = CATEGORY_LABELS[cat];

        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 px-1">
              <span>{catLabel.icon}</span>
              <span>{locale === 'ar' ? catLabel.ar : catLabel.en}</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {catSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                const isHovered = hoveredSkill === skill.id;

                return (
                  <div key={skill.id} className="relative">
                    <motion.button
                      onClick={() => toggleSkill(skill.id)}
                      onMouseEnter={() => setHoveredSkill(skill.id)}
                      onMouseLeave={() => setHoveredSkill(null)}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                        ${isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/40 hover:border-slate-600 hover:text-slate-300'
                        }
                      `}
                    >
                      {isSelected && (
                        <span className="inline-block mr-1">✓</span>
                      )}
                      {locale === 'ar' ? skill.labelAr : skill.label}
                    </motion.button>

                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 shadow-xl whitespace-nowrap pointer-events-none"
                        >
                          {locale === 'ar' ? skill.descriptionAr : skill.description}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
