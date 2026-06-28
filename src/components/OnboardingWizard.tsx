'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/components/ThemeProvider';
import type { PESPosition, PlayerAttributes, PlayerProfile } from '@/types';
import SVGPitchPicker from '@/components/SVGPitchPicker';
import AttributeSliders from '@/components/AttributeSliders';
import SkillsChecklist from '@/components/SkillsChecklist';
import BackgroundRemover from '@/components/BackgroundRemover';
import PlayerCard from '@/components/PlayerCard';
import PlayerStylePicker from '@/components/PlayerStylePicker';
import { ChevronUp, ChevronDown } from 'lucide-react';

/* ──────────────────────────────────────────────
   Translations
   ────────────────────────────────────────────── */
const t = {
  en: {
    step1: 'Bio Data',
    step2: 'Position',
    step3: 'Attributes & Skills',
    step4: 'Photo & Submit',
    stepOf: 'of',
    firstName: 'First Name',
    firstNamePlaceholder: 'Enter your first name',
    lastName: 'Last Name',
    lastNamePlaceholder: 'Enter your last name',
    cardName: 'Card Name',
    cardNamePlaceholder: 'Display name on card (e.g. MESSI)',
    dateOfBirth: 'Date of Birth',
    age: 'Age',
    height: 'Height (cm)',
    weight: 'Weight (kg)',
    preferredFoot: 'Preferred Foot',
    footRight: 'Right',
    footLeft: 'Left',
    footAmbidextrous: 'Ambidextrous',
    positionTitle: 'Select Your Positions',
    positionSubtitle: 'Choose primary, secondary, and tertiary positions on the pitch',
    positionsConfirmed: 'All 3 positions selected!',
    attrSkillsTitle: 'Rate Your Abilities',
    attrSkillsSubtitle: 'Set your attributes, play style, and special skills',
    playStyleTitle: 'Play Style',
    photoTitle: 'Upload & Preview',
    photoSubtitle: 'Upload your photo and preview your player card',
    previewCard: 'Card Preview',
    submit: 'Submit & Generate Card',
    submitting: 'Submitting...',
    submitSuccess: 'Profile created! Redirecting...',
    submitError: 'Failed to submit. Please try again.',
    next: 'Next',
    previous: 'Previous',
    required: 'This field is required',
    invalidAge: 'You must be between 10 and 60 years old',
    invalidHeight: 'Height must be between 100 and 250 cm',
    invalidWeight: 'Weight must be between 30 and 200 kg',
    selectPositions: 'Please select all 3 positions',
    selectPlayStyle: 'Please select a play style',
  },
  ar: {
    step1: 'البيانات الشخصية',
    step2: 'المركز',
    step3: 'السمات والمهارات',
    step4: 'الصورة والإرسال',
    stepOf: 'من',
    firstName: 'الاسم الأول',
    firstNamePlaceholder: 'أدخل اسمك الأول',
    lastName: 'الاسم الأخير',
    lastNamePlaceholder: 'أدخل اسم العائلة',
    cardName: 'اسم البطاقة',
    cardNamePlaceholder: 'الاسم المعروض على البطاقة (مثل: ميسي)',
    dateOfBirth: 'تاريخ الميلاد',
    age: 'العمر',
    height: 'الطول (سم)',
    weight: 'الوزن (كجم)',
    preferredFoot: 'القدم المفضلة',
    footRight: 'يمنى',
    footLeft: 'يسرى',
    footAmbidextrous: 'كلتاهما',
    positionTitle: 'اختر مراكزك',
    positionSubtitle: 'اختر المركز الأساسي والثانوي والثالث على الملعب',
    positionsConfirmed: 'تم اختيار 3 مراكز!',
    attrSkillsTitle: 'قيّم قدراتك',
    attrSkillsSubtitle: 'حدد مستوى سماتك وأسلوب لعبك ومهاراتك الخاصة',
    playStyleTitle: 'أسلوب اللعب',
    photoTitle: 'الرفع والمعاينة',
    photoSubtitle: 'ارفع صورتك وعاين بطاقة اللاعب',
    previewCard: 'معاينة البطاقة',
    submit: 'إرسال وإنشاء البطاقة',
    submitting: 'جارٍ الإرسال...',
    submitSuccess: 'تم إنشاء الملف! جارٍ إعادة التوجيه...',
    submitError: 'فشل الإرسال. يرجى المحاولة مرة أخرى.',
    next: 'التالي',
    previous: 'السابق',
    required: 'هذا الحقل مطلوب',
    invalidAge: 'يجب أن يكون العمر بين 10 و 60 سنة',
    invalidHeight: 'الطول يجب أن يكون بين 100 و 250 سم',
    invalidWeight: 'الوزن يجب أن يكون بين 30 و 200 كجم',
    selectPositions: 'يرجى اختيار 3 مراكز',
    selectPlayStyle: 'يرجى اختيار أسلوب اللعب',
  },
} as const;

/* ──────────────────────────────────────────────
   Wizard State
   ────────────────────────────────────────────── */
interface WizardState {
  firstName: string;
  lastName: string;
  cardName: string;
  dateOfBirth: string;
  calculatedAge: number;
  height: number;
  weight: number;
  preferredFoot: 'Right' | 'Left' | 'Ambidextrous';
  primaryPosition: PESPosition | null;
  secondaryPosition: PESPosition | null;
  tertiaryPosition: PESPosition | null;
  attributes: PlayerAttributes;
  specialSkills: string[];
  playStyle: string;
  photoUrl: string;
}

const DEFAULT_ATTRIBUTES: PlayerAttributes = {
  offensiveAwareness: 40, ballControl: 40, dribbling: 40, lowPass: 40, loftedPass: 40,
  finishing: 40, heading: 40, speed: 40, acceleration: 40, kickingPower: 40,
  jump: 40, physicalContact: 40, balance: 40, stamina: 40,
  defensiveAwareness: 40, ballWinning: 40, goalkeeping: 40,
};

const INITIAL_STATE: WizardState = {
  firstName: '', lastName: '', cardName: '', dateOfBirth: '', calculatedAge: 0,
  height: 175, weight: 70, preferredFoot: 'Right',
  primaryPosition: null, secondaryPosition: null, tertiaryPosition: null,
  attributes: { ...DEFAULT_ATTRIBUTES }, specialSkills: [], playStyle: '',
  photoUrl: '',
};

const TOTAL_STEPS = 4;

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */
function calculateAge(dob: string): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
export default function OnboardingWizard() {
  const { user } = useAuth();
  const { locale, isRTL } = useLocale();
  const router = useRouter();
  const txt = t[locale as 'en' | 'ar'] ?? t.ar;

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* ── Local Storage Persistence ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('11players_wizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          ...INITIAL_STATE,
          ...parsed,
          attributes: { ...DEFAULT_ATTRIBUTES, ...(parsed.attributes || {}) }
        });
      }
    } catch (e) {
      console.error('Failed to load draft', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('11players_wizard_draft', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }, [state]);

  /* ── Clear errors on locale change ── */
  useEffect(() => {
    setErrors({});
  }, [locale]);

  /* ── Field change ── */
  const handleFieldChange = useCallback((field: keyof WizardState, value: string | number) => {
    setState((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'dateOfBirth') next.calculatedAge = calculateAge(value as string);
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /* ── Positions ── */
  const handlePositionsSelected = useCallback((positions: { primary: PESPosition; secondary: PESPosition; tertiary: PESPosition }) => {
    setState((prev) => ({ ...prev, primaryPosition: positions.primary, secondaryPosition: positions.secondary, tertiaryPosition: positions.tertiary }));
    setErrors((prev) => { const next = { ...prev }; delete next['positions']; return next; });
  }, []);

  /* ── Custom Select Dropdown ── */
  const CustomSelect = ({ value, options, placeholder, onChange }: { value: string | number; options: { value: string | number; label: string }[]; placeholder: string; onChange: (v: string) => void }) => {
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

  /* ── Number Input Component ── */
  const NumberInput = ({ value, onChange, min, max, label, error }: any) => (
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

  /* ── Validation ── */
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!state.firstName.trim()) newErrors['firstName'] = txt.required;
      if (!state.lastName.trim()) newErrors['lastName'] = txt.required;
      if (!state.cardName.trim()) {
        newErrors['cardName'] = txt.required;
      } else if (!/^[A-Za-z\s\-]+$/.test(state.cardName)) {
        newErrors['cardName'] = locale === 'ar' ? 'يجب أن يكون اسم البطاقة باللغة الإنجليزية' : 'Card name must be in English';
      }
      if (!state.dateOfBirth) newErrors['dateOfBirth'] = txt.required;
      else {
        const age = calculateAge(state.dateOfBirth);
        if (age < 10 || age > 60) newErrors['dateOfBirth'] = txt.invalidAge;
      }
      if (!state.height || state.height < 100 || state.height > 250) newErrors['height'] = txt.invalidHeight;
      if (!state.weight || state.weight < 30 || state.weight > 200) newErrors['weight'] = txt.invalidWeight;
    }

    if (step === 2) {
      if (!state.primaryPosition || !state.secondaryPosition || !state.tertiaryPosition) {
        newErrors['positions'] = txt.selectPositions;
      }
    }

    if (step === 3) {
      if (!state.playStyle) newErrors['playStyle'] = txt.selectPlayStyle;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [state, txt, locale]);

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  }, [currentStep, validateStep]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const profile: PlayerProfile = {
        uid: user.uid,
        fullName: `${state.firstName.trim()} ${state.lastName.trim()}`,
        cardName: state.cardName.trim().toUpperCase(),
        dateOfBirth: state.dateOfBirth,
        calculatedAge: state.calculatedAge,
        height: state.height,
        weight: state.weight,
        preferredFoot: state.preferredFoot,
        primaryPosition: state.primaryPosition!,
        secondaryPosition: state.secondaryPosition!,
        tertiaryPosition: state.tertiaryPosition!,
        attributes: state.attributes,
        specialSkills: state.specialSkills || [],
        playStyle: state.playStyle || '',
        photoUrl: state.photoUrl || '',
        isVerifiedByAdmin: false,
        hasWarning: false,
        stats: { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 },
      };

      // Remove any undefined values to prevent Firestore errors
      const cleanProfile = JSON.parse(JSON.stringify(profile));

      // Use a short timeout, but if it times out, we still proceed optimistically
      // because Firestore will queue the write locally and sync when possible.
      const submitPromise = setDoc(doc(db, 'players', user.uid), cleanProfile);
      
      try {
        await Promise.race([
          submitPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
      } catch (err: any) {
        if (err.message !== 'timeout') {
          throw err;
        }
        // If it's just a timeout, we ignore it and proceed optimistically.
        console.log('Submission taking longer than expected, proceeding optimistically...');
      }

      localStorage.removeItem('11players_wizard_draft'); // Clear draft on success
      setSubmitMessage({ type: 'success', text: txt.submitSuccess });
      setTimeout(() => {
        window.location.href = '/community';
      }, 1500);
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.message || txt.submitError;
      setSubmitMessage({ type: 'error', text: `${txt.submitError} (${errorMessage})` });
      setIsSubmitting(false);
    }
  }, [user, state, txt, router, validateStep]);

  /* ── Preview profile ── */
  const previewProfile = useMemo((): PlayerProfile => ({
    ...state,
    uid: 'preview',
    fullName: state.firstName || state.lastName ? `${state.firstName} ${state.lastName}`.trim() : 'Player Name',
    cardName: (state.cardName || 'PLAYER').toUpperCase(),
    dateOfBirth: state.dateOfBirth || '2000-01-01',
    calculatedAge: state.calculatedAge || 25,
    primaryPosition: state.primaryPosition || 'CF',
    secondaryPosition: state.secondaryPosition || 'SS',
    tertiaryPosition: state.tertiaryPosition || 'AMF',
    isVerifiedByAdmin: false,
    hasWarning: false,
    stats: { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 },
  }), [user, state]);

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;
  const stepLabels = [txt.step1, txt.step2, txt.step3, txt.step4];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ─── Step Indicator ─── */}
      <div className="mb-8">
        <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
            style={{ [isRTL ? 'right' : 'left']: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        <div className="flex justify-between items-center">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                  }}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                    ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : isActive ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'}
                  `}
                >
                  {isCompleted ? '✓' : stepNum}
                </motion.div>
                <span className={`text-xs font-medium hidden sm:block transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-600 dark:text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-slate-500 mt-3 sm:hidden">
          {currentStep} {txt.stepOf} {TOTAL_STEPS} — {stepLabels[currentStep - 1]}
        </p>
      </div>

      {/* ─── Step Content ─── */}
      <div className="relative overflow-hidden min-h-[500px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div key={currentStep} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeInOut' }} className="px-2 pb-4">
            
            {/* ═══ STEP 1: Bio Data ═══ */}
            {currentStep === 1 && (
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
                  
                  <NumberInput value={state.height} onChange={(v: number) => handleFieldChange('height', v)} min={100} max={250} label={txt.height} error={errors.height} />
                  <NumberInput value={state.weight} onChange={(v: number) => handleFieldChange('weight', v)} min={30} max={200} label={txt.weight} error={errors.weight} />

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
            )}

            {/* ═══ STEP 2: Positions ═══ */}
            {currentStep === 2 && (
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
            )}

            {/* ═══ STEP 3: Attributes & Skills ═══ */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">⚡ {txt.attrSkillsTitle}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{txt.attrSkillsSubtitle}</p>
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
            )}

            {/* ═══ STEP 4: Photo & Submit ═══ */}
            {currentStep === 4 && (
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
                <AnimatePresence>
                  {submitMessage && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`text-center p-3 rounded-xl border ${submitMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-500/10 border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-300'}`}>
                      {submitMessage.type === 'success' ? '🎉' : '❌'} {submitMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={isSubmitting}
                  className={`w-full py-4 px-8 rounded-2xl text-lg font-bold shadow-md shadow-emerald-500/20 transition-all ${isSubmitting ? 'bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 text-white'}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 rounded-full border-2 border-slate-500/30 border-t-slate-300" />
                      {txt.submitting}
                    </span>
                  ) : (<>⚡ {txt.submit}</>)}
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Navigation Buttons ─── */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-300 dark:border-slate-800/60">
        {currentStep > 1 ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={goPrev} className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl border border-slate-300 dark:border-slate-700/50 transition-all">
            <span className={isRTL ? '' : 'rotate-180 inline-block'}>→</span>
            {txt.previous}
          </motion.button>
        ) : (<div />)}
        {currentStep < TOTAL_STEPS && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={goNext} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all">
            {txt.next}
            <span className={isRTL ? 'rotate-180 inline-block' : ''}>→</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
