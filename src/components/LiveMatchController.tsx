'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Timer, ShieldAlert, Pause, Clock3 } from 'lucide-react';

interface LiveMatchControllerProps {
  matchDurationMins?: number;
  isAr?: boolean;
  isAdmin?: boolean;
  onOpenRecordModal?: () => void;
  enableCardsSystem?: boolean;
}

export default function LiveMatchController({
  matchDurationMins = 20,
  isAr = false,
  isAdmin = false,
  onOpenRecordModal,
}: LiveMatchControllerProps) {
  const totalMainSeconds = Math.max(60, matchDurationMins * 60);
  const [timerState, setTimerState] = useState<'stopped' | 'running' | 'finished'>('stopped');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [wastedSeconds, setWastedSeconds] = useState(0);
  const [trackingWasted, setTrackingWasted] = useState(false);
  const trackingStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (timerState !== 'running') return;
    const interval = window.setInterval(() => {
      setSecondsElapsed((previous) => {
        const next = Math.min(totalMainSeconds, previous + 1);
        if (next >= totalMainSeconds) setTimerState('finished');
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerState, totalMainSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleWastedTracking = () => {
    if (trackingWasted) {
      const startedAt = trackingStartedAt.current;
      if (startedAt) setWastedSeconds((current) => current + Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
      trackingStartedAt.current = null;
      setTrackingWasted(false);
    } else {
      trackingStartedAt.current = Date.now();
      setTrackingWasted(true);
    }
  };

  const reset = () => {
    trackingStartedAt.current = null;
    setTrackingWasted(false);
    setWastedSeconds(0);
    setSecondsElapsed(0);
    setTimerState('stopped');
  };

  const liveWastedSeconds = wastedSeconds + (trackingWasted && trackingStartedAt.current
    ? Math.max(0, Math.round((Date.now() - trackingStartedAt.current) / 1000))
    : 0);
  const progressPercent = Math.min(100, (secondsElapsed / totalMainSeconds) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl p-6 sm:p-8 mb-8 border shadow-xl overflow-hidden text-white ${
        timerState === 'finished' ? 'bg-emerald-950/90 border-emerald-500/70' : 'bg-slate-900 border-slate-700'
      }`}
    >
      <div className="absolute -right-20 -top-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border-2 ${
            timerState === 'finished' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 text-white'
          }`}>
            <span className="text-2xl sm:text-3xl font-mono tracking-tight">{formatTime(Math.max(0, totalMainSeconds - secondsElapsed))}</span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80 mt-1">{timerState === 'finished' ? (isAr ? 'انتهت' : 'FINAL') : (isAr ? 'الوقت الأساسي' : 'MAIN TIME')}</span>
          </div>
          <div className="space-y-2 text-center md:text-start">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/10 border border-white/15"><Timer className="w-3.5 h-3.5 text-emerald-400" />{matchDurationMins} {isAr ? 'دقيقة' : 'MIN'}</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30"><Clock3 className="w-3.5 h-3.5" />+{formatTime(liveWastedSeconds)} {isAr ? 'بدل ضائع' : 'WASTED'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">{isAr ? 'توقيت المباراة المباشر' : 'Live Match Timer'}</h3>
            <p className="text-xs sm:text-sm text-slate-300">{isAr ? 'شغّل الوقت الأساسي وسجّل فترات التوقف بضغطة واحدة. سيُضاف بدل الضائع تلقائياً بعد النهاية.' : 'Run the main clock and track breaks with one button. Wasted time is added automatically after the final whistle.'}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {timerState === 'running' ? (
              <button type="button" onClick={toggleWastedTracking} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${trackingWasted ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'}`}>
                <Pause className="w-4 h-4" />{trackingWasted ? (isAr ? 'استئناف اللعب' : 'Resume Play') : (isAr ? 'احتساب وقت التوقف' : 'Track Wasted Time')}
              </button>
            ) : timerState === 'finished' ? (
              <span className="px-5 py-3 rounded-2xl font-black text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">{isAr ? `أضيف ${formatTime(liveWastedSeconds)} بدل ضائع` : `${formatTime(liveWastedSeconds)} added as extra time`}</span>
            ) : (
              <button type="button" onClick={() => setTimerState('running')} className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"><Play className="w-4 h-4 fill-current" />{isAr ? 'بدء المباراة' : 'Start Match'}</button>
            )}
            <button type="button" onClick={reset} className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all" title={isAr ? 'إعادة ضبط' : 'Reset'}><RotateCcw className="w-4 h-4" /></button>
          </div>
        )}

        {onOpenRecordModal && <button type="button" onClick={onOpenRecordModal} className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95"><ShieldAlert className="w-4 h-4" />{isAr ? 'تسجيل الإحصائيات' : 'Record Stats'}</button>}
      </div>
      <div className="mt-6 w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60"><motion.div className={`h-full rounded-full transition-all duration-300 ${timerState === 'finished' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500'}`} style={{ width: `${progressPercent}%` }} /></div>
    </motion.div>
  );
}
