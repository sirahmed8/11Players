'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  RotateCw, 
  Check, 
  X, 
  ShieldAlert, 
  Zap, 
  Sliders, 
  Flame, 
  ChevronUp,
  Activity,
  Bot
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export type TacticalCommandType =
  | 'REROLL_TACTICS'
  | 'SUB_STRIKER'
  | 'PARK_THE_BUS'
  | 'HIGH_PRESS'
  | 'FLANK_ATTACK';

export interface TacticalRecommendationCard {
  id: string;
  command: TacticalCommandType;
  matchedKeyword: string;
  language: 'en' | 'ar';
  title: { en: string; ar: string };
  actionDescription: { en: string; ar: string };
  formationSuggestion: string;
  instructions: { en: string[]; ar: string[] };
  confidence: number; // 0.0 - 1.0
  timestamp: string;
}

// ── Voice Parser Logic (Exported for Unit Testing) ─────────────────────────

export function parseVoiceCommand(transcript: string): TacticalRecommendationCard | null {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.toLowerCase().trim();

  // Keyword Matchers
  const isReroll = text.includes('re-roll') || text.includes('reroll') || text.includes('new tactics') ||
                   text.includes('change tactics') || text.includes('تكتيك جديد') || text.includes('جدد التكتيك') || text.includes('تغيير التكتيك');

  const isSubStriker = text.includes('substitute striker') || text.includes('sub striker') || text.includes('change striker') ||
                       text.includes('fresh striker') || text.includes('تبديل المهاجم') || text.includes('تغيير المهاجم') || text.includes('دخول مهاجم');

  const isParkBus = text.includes('park the bus') || text.includes('defend deep') || text.includes('lock it down') ||
                    text.includes('ركن الحافلة') || text.includes('دفاع متأخر') || text.includes('تكتل دفاعي');

  const isHighPress = text.includes('high press') || text.includes('gegenpress') || text.includes('press high') ||
                      text.includes('ضغط عالي') || text.includes('ضغط متقدم') || text.includes('ضغط شرس');

  const isFlankAttack = text.includes('flank attack') || text.includes('attack wide') || text.includes('wing play') ||
                        text.includes('هجوم من الأطراف') || text.includes('الأجنحة') || text.includes('عرضيات');

  const isArabic = /[\u0600-\u06FF]/.test(text);
  const lang: 'en' | 'ar' = isArabic ? 'ar' : 'en';
  const id = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isReroll) {
    return {
      id,
      command: 'REROLL_TACTICS',
      matchedKeyword: isArabic ? 'تكتيك جديد' : 're-roll tactics',
      language: lang,
      title: { en: 'Tactical Re-Roll Activated', ar: 'تطبيق تكتيك جديد ومعدل' },
      actionDescription: {
        en: 'Re-shuffling pitch roles to unlock midfield creativity and randomize attacking patterns.',
        ar: 'إعادة توزيع الأدوار في الملعب لتنشيط الخط الهجومي وإرباك دفاع الخصم.'
      },
      formationSuggestion: '4-3-3 Dynamic',
      instructions: {
        en: ['Switch to 1-touch passing', 'Increase wing-back support', 'Midfield roaming freedom'],
        ar: ['التمرير المباشر السريع', 'زيادة المساندة الهجومية للأظهرة', 'حرية التحرك لثنائي الوسط']
      },
      confidence: 0.98,
      timestamp
    };
  }

  if (isSubStriker) {
    return {
      id,
      command: 'SUB_STRIKER',
      matchedKeyword: isArabic ? 'تبديل المهاجم' : 'substitute striker',
      language: lang,
      title: { en: 'Striker Substitution Target', ar: 'استراتيجية تبديل وتنشيط الهجوم' },
      actionDescription: {
        en: 'Injecting fresh physical presence up front to target aerial balls and press low block.',
        ar: 'إدخال مهاجم بديل بنشاط وطاقة جديدة للاستفادة من العرضيات المرتفعة.'
      },
      formationSuggestion: '4-4-2 Target Man',
      instructions: {
        en: ['Bring on target man CF', 'Pump high whipped crosses', 'Attack second balls in box'],
        ar: ['إدخال مهاجم بنية جسمانية قوية', 'تكثيف العرضيات المرتفعة', 'متابعة الكرة الثانية داخل الصندوق']
      },
      confidence: 0.95,
      timestamp
    };
  }

  if (isParkBus) {
    return {
      id,
      command: 'PARK_THE_BUS',
      matchedKeyword: isArabic ? 'ركن الحافلة' : 'park the bus',
      language: lang,
      title: { en: 'Ultra-Defensive Lock-Down', ar: 'ركن الحافلة والتأمين الدفاعي' },
      actionDescription: {
        en: 'Dropping all 10 outfield players into compact deep block to guard lead.',
        ar: 'تراجع كافة اللاعبين خلف الكرة وإغلاق المساحات تماماً للحفاظ على التقدم.'
      },
      formationSuggestion: '5-4-1 Ultra Block',
      instructions: {
        en: ['Compact low defensive line', 'Safety clearances first', 'Slow down match restart pace'],
        ar: ['تكتل دفاعي منخفض ومحكم', 'تشتيت الأخطار أولاً بأول', 'إبطاء رتم اللعب في الرميات والضربات']
      },
      confidence: 0.99,
      timestamp
    };
  }

  if (isHighPress) {
    return {
      id,
      command: 'HIGH_PRESS',
      matchedKeyword: isArabic ? 'ضغط عالي' : 'high press',
      language: lang,
      title: { en: 'High Intensity Gegenpress', ar: 'ضغط عالي وهجوم كاسح' },
      actionDescription: {
        en: 'Pushing backline to midfield and triggering instant 5-second counter-pressing.',
        ar: 'تقديم خط الدفاع لمنتصف الملعب والضغط الشرس فور فقدان الكرة.'
      },
      formationSuggestion: '4-3-3 High Press',
      instructions: {
        en: ['Push defensive line high', 'Trap fullbacks on touchline', 'Double team ball carrier'],
        ar: ['رفع التمركز الدفاعي لأعلى', 'حصار ظهراء الخصم عند التماس', 'ضغط ثنائي مكثف']
      },
      confidence: 0.96,
      timestamp
    };
  }

  if (isFlankAttack) {
    return {
      id,
      command: 'FLANK_ATTACK',
      matchedKeyword: isArabic ? 'هجوم من الأطراف' : 'flank attack',
      language: lang,
      title: { en: 'Wide Flank Overload', ar: 'اختراق الأطراف والعرضيات' },
      actionDescription: {
        en: 'Overloading left and right wings with overlapping fullbacks and wide wingers.',
        ar: 'التركيز على فتح المساحات في الأجنحة واستغلال ثغرات الظهيرين.'
      },
      formationSuggestion: '3-4-3 Wide Wingers',
      instructions: {
        en: ['Heavy winger overlap', 'Diagonal long cross-field switches', 'Driven low crosses'],
        ar: ['صعود الهجومي المستمر للأجنحة', 'تمريرات قطرية واسعة', 'عرضيات أرضية سريعة']
      },
      confidence: 0.94,
      timestamp
    };
  }

  return null;
}

// ── Component Props ────────────────────────────────────────────────────────

export interface VoiceTacticsAssistantProps {
  onApplyTactics?: (recommendation: TacticalRecommendationCard) => void;
  className?: string;
}

// ── React Component ────────────────────────────────────────────────────────

export const VoiceTacticsAssistant: React.FC<VoiceTacticsAssistantProps> = ({
  onApplyTactics,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [activeCard, setActiveCard] = useState<TacticalRecommendationCard | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = lang === 'ar' ? 'ar-EG' : 'en-US';

        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);

          const parsed = parseVoiceCommand(currentTranscript);
          if (parsed) {
            setActiveCard(parsed);
          }
        };

        rec.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } catch (e) {
        console.warn('Speech recognition initialization error:', e);
        setSpeechSupported(false);
      }
    }
  }, [lang]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      // Fallback message if speech API is unavailable
      setTranscript(lang === 'ar' ? 'عذراً، محرك الصوت غير مدعوم في متصفحك. استخدم الأزرار اليدوية بالأسفل.' : 'Speech API not supported in browser. Use fallback buttons below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const handleManualTrigger = (commandText: string) => {
    setTranscript(commandText);
    const parsed = parseVoiceCommand(commandText);
    if (parsed) {
      setActiveCard(parsed);
    }
  };

  const handleApply = () => {
    if (activeCard) {
      onApplyTactics?.(activeCard);
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 2500);
    }
  };

  const handleReroll = () => {
    if (activeCard) {
      const freshCard = parseVoiceCommand(`${activeCard.matchedKeyword} re-roll`);
      if (freshCard) {
        setActiveCard({
          ...freshCard,
          id: `rec_${Date.now()}`,
          confidence: 0.99
        });
      }
    }
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 font-sans ${className}`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* ── Floating Trigger Button (Collapsed) ── */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className="relative group px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white font-extrabold shadow-2xl hover:shadow-emerald-500/25 border border-emerald-400/40 flex items-center gap-2.5 transition-all"
        >
          <div className="relative">
            <Bot className="w-5 h-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs tracking-tight">11AI Voice Tactics</span>
        </motion.button>
      )}

      {/* ── Expanded Voice Widget Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 sm:w-96 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl backdrop-blur-2xl p-5 text-slate-100 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {lang === 'ar' ? 'مساعد التكتيك الصوتي' : '11AI Voice Tactics Assistant'}
                  </h4>
                  <span className="text-[10px] text-slate-400 block">
                    {speechSupported ? (lang === 'ar' ? 'جاهز للاستماع' : 'Speech API Ready') : (lang === 'ar' ? 'نمط المفاتيح اليدوية' : 'Manual Trigger Mode')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLang(prev => (prev === 'en' ? 'ar' : 'en'))}
                  className="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {lang === 'en' ? 'AR' : 'EN'}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mic Trigger & Pulse Visualizer */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center relative overflow-hidden">
              <motion.button
                onClick={toggleListening}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center font-black shadow-xl transition-all ${
                  isListening
                    ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white animate-pulse shadow-red-500/50'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-emerald-500/30 hover:scale-105'
                }`}
              >
                {isListening ? <Mic className="w-7 h-7 animate-spin" /> : <Mic className="w-7 h-7" />}
              </motion.button>

              <span className="text-xs font-bold mt-2 text-slate-300">
                {isListening 
                  ? (lang === 'ar' ? 'جاري الاستماع للتعليق الصوتي...' : 'Listening to voice command...') 
                  : (lang === 'ar' ? 'اضغط للمحدثة الصوتية' : 'Tap mic to speak tactical trigger')}
              </span>

              {/* Transcript Display */}
              {transcript && (
                <div className="mt-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs italic text-amber-400 font-mono">
                  "{transcript}"
                </div>
              )}
            </div>

            {/* Manual Trigger Buttons (Fallback & Quick Actions) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {lang === 'ar' ? 'مشغلات التكتيك السريعة (يدوياً):' : 'Quick Voice Trigger Shortcuts:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { en: 're-roll tactics', ar: 'تكتيك جديد' },
                  { en: 'substitute striker', ar: 'تبديل المهاجم' },
                  { en: 'park the bus', ar: 'ركن الحافلة' },
                  { en: 'high press', ar: 'ضغط عالي' },
                  { en: 'flank attack', ar: 'هجوم من الأطراف' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleManualTrigger(item[lang])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    "{item[lang]}"
                  </button>
                ))}
              </div>
            </div>

            {/* Active Recommendation Card */}
            <AnimatePresence mode="wait">
              {activeCard && (
                <motion.div
                  key={activeCard.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-black rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {activeCard.formationSuggestion}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeCard.timestamp} • {Math.round(activeCard.confidence * 100)}% Match
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-extrabold text-white">
                      {activeCard.title[lang]}
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {activeCard.actionDescription[lang]}
                    </p>
                  </div>

                  {/* Bullet Instructions */}
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    {activeCard.instructions[lang].map((inst, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                        <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{inst}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Handlers */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleApply}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1 shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تطبيق التكتيك' : 'Apply Tactic'}</span>
                    </button>

                    <button
                      onClick={handleReroll}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إعادة سحب' : 'Re-roll'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Applied Toast Notice */}
            {appliedNotice && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs text-center font-extrabold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'تم تطبيق التعديلات التكتيكية بنجاح!' : 'Tactical strategy applied successfully!'}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceTacticsAssistant;
