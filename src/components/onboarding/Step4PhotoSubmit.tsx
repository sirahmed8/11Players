import { motion } from 'framer-motion';
import BackgroundRemover from '@/components/BackgroundRemover';
import PlayerCard from '@/components/PlayerCard';
import { WizardState } from './types';
import { PlayerProfile } from '@/types';

export default function Step4PhotoSubmit({
  state,
  txt,
  handleFieldChange,
  previewProfile,
  locale
}: {
  state: WizardState;
  txt: any;
  handleFieldChange: (field: keyof WizardState, value: string | number) => void;
  previewProfile: PlayerProfile;
  locale: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">📸 {txt.photoTitle}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{txt.photoSubtitle}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <BackgroundRemover 
          onImageReady={(url) => handleFieldChange('photoUrl', url)} 
          locale={(locale as 'en' | 'ar') ?? 'ar'} 
          initialImageUrl={state.photoUrl}
        />
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{txt.previewCard}</h3>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <PlayerCard player={previewProfile} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
