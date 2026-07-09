import { motion, AnimatePresence } from 'framer-motion';
import SVGPitchPicker from '@/components/SVGPitchPicker';
import { WizardState } from './types';
import { PESPosition } from '@/types';

export default function Step2Positions({
  state,
  errors,
  txt,
  handlePositionsSelected,
  locale
}: {
  state: WizardState;
  errors: Record<string, string>;
  txt: any;
  handlePositionsSelected: (positions: { primary: PESPosition; secondary: PESPosition; tertiary: PESPosition }) => void;
  locale: string;
}) {
  return (
    <div className="space-y-4">
      <SVGPitchPicker 
        onPositionsSelected={handlePositionsSelected} 
        locale={(locale as 'en' | 'ar') ?? 'ar'} 
        initialPositions={[state.primaryPosition, state.secondaryPosition, state.tertiaryPosition].filter(Boolean) as any[]}
      />
      <AnimatePresence>
        {state.primaryPosition && state.secondaryPosition && state.tertiaryPosition && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="text-center">
            <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-400 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-4 py-2 rounded-full">✅ {txt.positionsConfirmed}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {errors.positions && <p className="text-center text-sm text-red-400">{errors.positions}</p>}
    </div>
  );
}
