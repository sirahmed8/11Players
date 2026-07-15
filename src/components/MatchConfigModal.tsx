import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/components/ThemeProvider';
import { Users, RotateCw, Trophy, Timer, Shuffle } from 'lucide-react';

export interface MatchConfig {
  date: string;
  time: string;
  location: string;
  cost: string;
  notes: string;
  // Turf / Casual mode fields
  matchMode?: 'standard' | 'turf';
  numTeams?: number;              // 2, 3, 4+
  playersPerTeam?: number;        // 4 to 10
  gkMode?: 'fixed' | 'rotating'; // GK rotation style
  gkRotationInterval?: 'per_match' | 'per_goal';
  matchType?: 'league' | 'knockout' | 'winner_stays';
  matchDurationMins?: number;     // Duration per match
}

interface MatchConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: MatchConfig) => void;
}

export default function MatchConfigModal({ isOpen, onClose, onGenerate }: MatchConfigModalProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'standard' | 'turf'>('standard');

  const [config, setConfig] = useState<MatchConfig>({
    date: '',
    time: '',
    location: '',
    cost: '',
    notes: '',
    matchMode: 'standard',
    numTeams: 2,
    playersPerTeam: 6,
    gkMode: 'rotating',
    gkRotationInterval: 'per_match',
    matchType: 'league',
    matchDurationMins: 20,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('PM');

  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = isAr
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayNames = isAr
    ? ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSelectDate = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setConfig(prev => ({ ...prev, date: formattedDate }));
    setShowDatePicker(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setCurrentMonthDate(today);
    setConfig(prev => ({ ...prev, date: formattedDate }));
    setShowDatePicker(false);
  };

  const handleTimeUpdate = (hour: string, minute: string, period: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    setConfig(prev => ({ ...prev, time: `${hour}:${minute} ${period}` }));
  };

  const handlePresetTime = (preset: string) => {
    const [timePart, period] = preset.split(' ');
    const [h, m] = timePart.split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(period);
    setConfig(prev => ({ ...prev, time: preset }));
    setShowTimePicker(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-visible border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="p-6 overflow-y-auto overflow-x-visible">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xl">⚙️</span>
                <span>{isAr ? 'إعدادات المباراة' : 'Match Configuration'}</span>
              </h2>

              {/* Mode Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setActiveTab('standard'); setConfig(prev => ({ ...prev, matchMode: 'standard' })); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                    activeTab === 'standard'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>⚽</span>
                  <span>{isAr ? 'مباراة قانونية (11 × 11)' : 'Standard (11v11)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('turf'); setConfig(prev => ({ ...prev, matchMode: 'turf' })); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                    activeTab === 'turf'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  <span>{isAr ? 'حجز كورة عادي (خماسي / سداسي)' : 'Turf / Casual Match'}</span>
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date Picker */}
                  <div className="relative" ref={datePickerRef}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'التاريخ' : 'Date'}</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDatePicker(!showDatePicker);
                        setShowTimePicker(false);
                      }}
                      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center justify-between group"
                    >
                      <span className={config.date ? "font-medium text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                        {config.date || (isAr ? 'يوم/شهر/سنة' : 'mm/dd/yyyy')}
                      </span>
                      <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">📅</span>
                    </button>

                    <AnimatePresence>
                      {showDatePicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 z-50 w-72 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {monthNames[month]} {year}
                            </span>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-bold">‹</button>
                              <button type="button" onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-bold">›</button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                            {dayNames.map(d => (
                              <span key={d} className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</span>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                              <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const dayNum = i + 1;
                              const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                              const isSelected = config.date === formatted;
                              const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                              const isToday = formatted === todayStr;

                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => handleSelectDate(dayNum)}
                                  className={`h-8 w-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                                    isSelected
                                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-105"
                                      : isToday
                                      ? "border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80"
                                  }`}
                                >
                                  {dayNum}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex justify-between items-center text-xs">
                            <button type="button" onClick={() => { setConfig(prev => ({ ...prev, date: '' })); setShowDatePicker(false); }} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              {isAr ? 'مسح' : 'Clear'}
                            </button>
                            <button type="button" onClick={handleSelectToday} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                              {isAr ? 'اليوم' : 'Today'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Time Picker */}
                  <div className="relative" ref={timePickerRef}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'الوقت' : 'Time'}</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTimePicker(!showTimePicker);
                        setShowDatePicker(false);
                      }}
                      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center justify-between group"
                    >
                      <span className={config.time ? "font-medium text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                        {config.time || "--:-- --"}
                      </span>
                      <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">⏰</span>
                    </button>

                    <AnimatePresence>
                      {showTimePicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 left-auto top-full mt-2 z-50 w-72 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
                        >
                          <div className="mb-3">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                              {isAr ? 'أوقات شائعة' : 'Popular Presets'}
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"].map(t => (
                                <button key={t} type="button" onClick={() => handlePresetTime(t)} className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${config.time === t ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-700/80 my-3 pt-3">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                              {isAr ? 'وقت مخصص' : 'Custom Time'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1">
                                <select value={selectedHour} onChange={(e) => handleTimeUpdate(e.target.value, selectedMinute, selectedPeriod)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/80 px-2 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50">
                                  {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                              </div>
                              <span className="font-bold text-slate-400">:</span>
                              <div className="flex-1">
                                <select value={selectedMinute} onChange={(e) => handleTimeUpdate(selectedHour, e.target.value, selectedPeriod)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/80 px-2 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50">
                                  {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700/60 p-0.5 border border-slate-200 dark:border-slate-700">
                                {["AM", "PM"].map((p) => (
                                  <button key={p} type="button" onClick={() => handleTimeUpdate(selectedHour, selectedMinute, p)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedPeriod === p ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}>
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'الملعب' : 'Location / Pitch'}</label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: الملعب الرئيسي' : 'e.g. Cairo Stadium'}
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'التكلفة لكل لاعب' : 'Cost per Player'}</label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: 50 جنيه' : 'e.g. 50 EGP'}
                    value={config.cost}
                    onChange={(e) => setConfig({ ...config, cost: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{isAr ? 'ملاحظات' : 'Notes'}</label>
                  <textarea
                    placeholder={isAr ? 'أي تعليمات خاصة للاعبين...' : 'Any special instructions for players...'}
                    value={config.notes}
                    onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] min-h-[80px] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* ────────── Turf Settings ────────── */}
              {activeTab === 'turf' && (
                <div className="space-y-5 mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm">
                    <Shuffle className="w-4 h-4" />
                    <span>{isAr ? 'إعدادات حجز الكورة العادي / الخماسي' : 'Turf / Casual Matchmaking Settings'}</span>
                  </div>

                  {/* Num Teams */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{isAr ? 'عدد الفرق' : 'Number of Teams'}</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[2, 3, 4].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, numTeams: n }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                              config.numTeams === n
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Players per Team */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        {isAr ? 'لاعبين/فريق' : 'Players / Team'}
                      </label>
                      <select
                        value={config.playersPerTeam}
                        onChange={e => setConfig(prev => ({ ...prev, playersPerTeam: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
                      >
                        {[4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} {isAr ? 'لاعبين' : 'players'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* GK Mode */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1"><RotateCw className="w-3.5 h-3.5" />{isAr ? 'نظام حارس المرمى' : 'GK System'}</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gkMode: 'fixed' }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          config.gkMode === 'fixed'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        🥅 {isAr ? 'حارس ثابت' : 'Fixed GK'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gkMode: 'rotating' }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          config.gkMode === 'rotating'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        🔄 {isAr ? 'حارس دوار' : 'Rotating GK'}
                      </button>
                    </div>
                    {config.gkMode === 'rotating' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, gkRotationInterval: 'per_match' }))}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                            config.gkRotationInterval === 'per_match'
                              ? 'bg-amber-400 text-white border-amber-400'
                              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isAr ? 'يتبدل كل مباراة' : 'Rotate per match'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, gkRotationInterval: 'per_goal' }))}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                            config.gkRotationInterval === 'per_goal'
                              ? 'bg-amber-400 text-white border-amber-400'
                              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isAr ? 'يتبدل كل هدف' : 'Rotate per goal'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Match Format + Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{isAr ? 'نوع البطولة' : 'Tournament'}</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchType: 'league' }))}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                              config.matchType === 'league'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? 'دوري' : 'League'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchType: 'knockout' }))}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                              config.matchType === 'knockout'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isAr ? 'كأس' : 'Knockout'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, matchType: 'winner_stays' }))}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                            config.matchType === 'winner_stays'
                              ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <RotateCw className="w-4 h-4" />
                          <span>{isAr ? "الكسبان مستمر" : "Winner Stays On"}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{isAr ? 'مدة المباراة (دقيقة)' : 'Match Duration (min)'}</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[10, 15, 20, 25, 30].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, matchDurationMins: m }))}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                              config.matchDurationMins === m
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200">
                    {isAr
                      ? `سيتم توزيع اللاعبين على ${config.numTeams} فرق بنظام الدور (Serpentine Draft) بحيث تكون قوة الفرق متكافئة — ${config.playersPerTeam} لاعب لكل فريق — ${config.gkMode === 'rotating' ? `مع دوران الحراسة ${config.gkRotationInterval === 'per_goal' ? 'بعد كل هدف' : 'كل مباراة'}` : 'مع حارس ثابت'} — ${config.matchType === 'league' ? 'دوري ذهاب وإياب' : config.matchType === 'knockout' ? 'كأس إقصاء' : 'الكسبان مستمر'} — ${config.matchDurationMins} دقيقة.`
                      : `Players will be split into ${config.numTeams} balanced teams via Serpentine Draft — ${config.playersPerTeam} players each — ${config.gkMode === 'rotating' ? `rotating GK ${config.gkRotationInterval === 'per_goal' ? 'per goal' : 'per match'}` : 'fixed GK'} — ${config.matchType === 'league' ? 'League' : config.matchType === 'knockout' ? 'Knockout' : 'Winner Stays On'} format — ${config.matchDurationMins} min.`
                    }
                  </div>
                </div>
              )}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onGenerate(config);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98] outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {isAr ? 'تكوين الفرق' : 'Generate Teams'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
