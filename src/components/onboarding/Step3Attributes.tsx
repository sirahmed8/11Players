import PlayerStylePicker from '@/components/PlayerStylePicker';
import AttributeSliders from '@/components/AttributeSliders';
import SkillsChecklist from '@/components/SkillsChecklist';
import TacticalSuggestionsCard from '@/components/TacticalSuggestionsCard';
import { WizardState } from './types';

export default function Step3Attributes({
  state,
  errors,
  txt,
  handleFieldChange,
  setState,
  locale
}: {
  state: WizardState;
  errors: Record<string, string>;
  txt: any;
  handleFieldChange: (field: keyof WizardState, value: string | number) => void;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  locale: string;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">⚡ {txt.attrSkillsTitle}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{txt.attrSkillsSubtitle}</p>
      </div>

      <div className="mb-6">
        <TacticalSuggestionsCard
          attributes={state.attributes}
          height={state.height}
          weight={state.weight}
          preferredFoot={state.preferredFoot}
          onApplySuggestions={(positions, playStyle) => {
            setState(prev => ({
              ...prev,
              primaryPosition: positions.primary,
              secondaryPosition: positions.secondary,
              tertiaryPosition: positions.tertiary,
              playStyle: playStyle
            }));
          }}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-emerald-400">{txt.playStyleTitle}</h3>
        <PlayerStylePicker 
          selectedStyle={state.playStyle} 
          onStyleSelect={(s) => handleFieldChange('playStyle', s)} 
          locale={(locale as 'en' | 'ar') ?? 'ar'} 
          primaryPosition={state.primaryPosition}
        />
        {errors.playStyle && <p className="text-sm text-red-400">{errors.playStyle}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-300 dark:border-slate-700/50 pt-8">
        <div className="col-span-1 lg:col-span-2 bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <div className="p-1">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-1">
                {locale === 'ar' ? "كن أميناً في تقييم مهاراتك" : "Be Honest With Your Ratings"}
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400/80 text-start" dir="auto">
                {locale === 'ar' 
                  ? "تقييمك الدقيق لمهاراتك يضمن لك وللجميع تجربة لعب عادلة ومتوازنة في المباريات. النظام سيكتشف التلاعب وسيقوم مديرو المجتمع بمراجعة وتعديل أي تقييمات غير واقعية بناءً على أدائك الفعلي في الملعب." 
                  : "Accurate evaluation of your skills ensures a fair and balanced playing experience for everyone in matches. The system detects anomalies and community admins will review and adjust unrealistic ratings based on your real-life performance."}
              </p>
            </div>
          </div>
        </div>
        
        <AttributeSliders 
          attributes={state.attributes} 
          onChange={(a) => setState(prev => ({...prev, attributes: a}))} 
          locale={(locale as 'en' | 'ar') ?? 'ar'} 
          primaryPosition={state.primaryPosition}
          playStyle={state.playStyle}
        />
        <SkillsChecklist selectedSkills={state.specialSkills} onSkillsChange={(s) => setState(prev => ({...prev, specialSkills: s}))} locale={(locale as 'en' | 'ar') ?? 'ar'} />
      </div>
    </div>
  );
}
