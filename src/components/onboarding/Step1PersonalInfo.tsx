import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { WizardState } from './types';

// Custom Select Dropdown
export const CustomSelect = ({ value, options, placeholder, onChange }: { value: string | number; options: { value: string | number; label: string }[]; placeholder: string; onChange: (v: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-2.5 px-2 rounded-lg text-center cursor-pointer font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
          isOpen
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            : value
              ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              : 'bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        {selectedLabel}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.8, y: -4 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.8, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/30 custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(String(opt.value)); setIsOpen(false); }}
                className={`w-full px-3 py-2 text-sm text-center transition-colors ${
                  String(opt.value) === String(value)
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Number Input Component
export const NumberInput = ({ value, onChange, min, max, label, error, isRTL }: any) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label} *</label>
    <div className={`relative flex items-center bg-white dark:bg-slate-800/60 rounded-xl border-2 transition-all duration-300 ${error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-500'}`}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-white focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className={`absolute flex flex-col border-slate-200 dark:border-slate-700 h-full overflow-hidden ${isRTL ? 'left-0 border-r rounded-l-[10px]' : 'right-0 border-l rounded-r-[10px]'}`}>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="flex-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors flex items-center justify-center">
          <ChevronUp className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="flex-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors flex items-center justify-center">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

export default function Step1PersonalInfo({
  state,
  errors,
  txt,
  handleFieldChange,
  isRTL
}: {
  state: WizardState;
  errors: Record<string, string>;
  txt: any;
  handleFieldChange: (field: keyof WizardState, value: string | number) => void;
  isRTL: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">📋 {txt.step1}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{txt.firstName} *</label>
            <div className={`relative flex items-center bg-white dark:bg-slate-800/60 rounded-xl border-2 transition-all duration-300 ${errors.firstName ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-500'}`}>
              <input
                type="text" value={state.firstName} onChange={(e) => handleFieldChange('firstName', e.target.value)} placeholder={txt.firstNamePlaceholder}
                className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
              />
            </div>
            {errors.firstName && <p className="text-xs text-red-400">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{txt.lastName} *</label>
            <div className={`relative flex items-center bg-white dark:bg-slate-800/60 rounded-xl border-2 transition-all duration-300 ${errors.lastName ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-500'}`}>
              <input
                type="text" value={state.lastName} onChange={(e) => handleFieldChange('lastName', e.target.value)} placeholder={txt.lastNamePlaceholder}
                className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
              />
            </div>
            {errors.lastName && <p className="text-xs text-red-400">{errors.lastName}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{txt.cardName} *</label>
          <div className={`relative flex items-center bg-white dark:bg-slate-800/60 rounded-xl border-2 transition-all duration-300 ${errors.cardName ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-500'}`}>
            <input
              type="text" value={state.cardName} onChange={(e) => handleFieldChange('cardName', e.target.value)} placeholder={txt.cardNamePlaceholder}
              className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none uppercase"
              dir="ltr"
            />
          </div>
          {errors.cardName && <p className="text-xs text-red-400">{errors.cardName}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{txt.dateOfBirth} *</label>
          <div className={`flex gap-1.5 rounded-xl bg-white dark:bg-slate-800/60 border-2 transition-all duration-300 ${errors.dateOfBirth ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'} p-1.5`}>
            <CustomSelect
              value={state.dateOfBirth ? state.dateOfBirth.split('-')[2] : ''}
              placeholder="DD"
              options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1).padStart(2, '0') }))}
              onChange={(v) => {
                const [y, m] = state.dateOfBirth ? state.dateOfBirth.split('-') : [new Date().getFullYear().toString(), '01'];
                handleFieldChange('dateOfBirth', `${y}-${m}-${v}`);
              }}
            />
            <CustomSelect
              value={state.dateOfBirth ? state.dateOfBirth.split('-')[1] : ''}
              placeholder="MM"
              options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1).padStart(2, '0') }))}
              onChange={(v) => {
                const [y, , d] = state.dateOfBirth ? state.dateOfBirth.split('-') : [new Date().getFullYear().toString(), '', '01'];
                handleFieldChange('dateOfBirth', `${y}-${v}-${d}`);
              }}
            />
            <CustomSelect
              value={state.dateOfBirth ? state.dateOfBirth.split('-')[0] : ''}
              placeholder="YYYY"
              options={Array.from({ length: 50 }, (_, i) => ({ value: new Date().getFullYear() - 10 - i, label: String(new Date().getFullYear() - 10 - i) }))}
              onChange={(v) => {
                const [, m, d] = state.dateOfBirth ? state.dateOfBirth.split('-') : ['', '01', '01'];
                handleFieldChange('dateOfBirth', `${v}-${m}-${d}`);
              }}
            />
          </div>
          {state.calculatedAge > 0 && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{txt.age}: {state.calculatedAge}</p>}
          {errors.dateOfBirth && <p className="text-xs text-red-400">{errors.dateOfBirth}</p>}
        </div>
        
        <NumberInput value={state.height} onChange={(v: number) => handleFieldChange('height', v)} min={100} max={250} label={txt.height} error={errors.height} isRTL={isRTL} />
        <NumberInput value={state.weight} onChange={(v: number) => handleFieldChange('weight', v)} min={30} max={200} label={txt.weight} error={errors.weight} isRTL={isRTL} />

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{txt.preferredFoot} *</label>
          <div className="flex gap-2">
            {(['Right', 'Left', 'Ambidextrous'] as const).map((foot) => {
              const isSelected = state.preferredFoot === foot;
              const label = foot === 'Right' ? txt.footRight : foot === 'Left' ? txt.footLeft : txt.footAmbidextrous;
              return (
                <motion.button
                  key={foot} whileTap={{ scale: 0.95 }} onClick={() => handleFieldChange('preferredFoot', foot)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-300 ${isSelected ? 'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/20' : 'bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700/40 hover:border-slate-400 dark:hover:border-slate-600'}`}
                >
                  {foot === 'Right' ? '🦶' : foot === 'Left' ? '🦶' : '🦶🦶'} {label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
