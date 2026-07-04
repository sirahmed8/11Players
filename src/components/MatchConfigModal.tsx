import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MatchConfig {
  date: string;
  time: string;
  location: string;
  cost: string;
  notes: string;
}

interface MatchConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: MatchConfig) => void;
}

export default function MatchConfigModal({ isOpen, onClose, onGenerate }: MatchConfigModalProps) {
  const [config, setConfig] = useState<MatchConfig>({
    date: '',
    time: '',
    location: '',
    cost: '',
    notes: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Time picker internal state
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('PM');

  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
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

  if (!isOpen) return null;

  // Calendar helpers
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-visible border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
      >
        <div className="p-6 overflow-y-auto overflow-x-visible">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xl">⚙️</span>
            <span>Match Configuration</span>
          </h2>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Custom Date Picker */}
              <div className="relative" ref={datePickerRef}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowTimePicker(false);
                  }}
                  className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center justify-between group"
                >
                  <span className={config.date ? "font-medium text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                    {config.date || "mm/dd/yyyy"}
                  </span>
                  <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">📅</span>
                </button>

                {/* Calendar Dropdown */}
                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 z-50 w-72 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-900 dark:text-white text-base">
                          {monthNames[month]} {year}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-bold"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-bold"
                          >
                            ›
                          </button>
                        </div>
                      </div>

                      {/* Weekday Names */}
                      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                        {dayNames.map(d => (
                          <span key={d} className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
                            {d}
                          </span>
                        ))}
                      </div>

                      {/* Day Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const isSelected = config.date === formatted;
                          const isToday = new Date().toISOString().split('T')[0] === formatted;

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => handleSelectDate(dayNum)}
                              className={`h-8 w-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30 font-bold scale-105"
                                  : isToday
                                  ? "border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80"
                              }`}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Footer shortcuts */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex justify-between items-center text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({ ...prev, date: '' }));
                            setShowDatePicker(false);
                          }}
                          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectToday}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                        >
                          Today
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Custom Time Picker */}
              <div className="relative" ref={timePickerRef}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Time</label>
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

                {/* Time Dropdown */}
                <AnimatePresence>
                  {showTimePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 sm:left-0 top-full mt-2 z-50 w-64 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
                    >
                      {/* Presets */}
                      <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/80">
                        <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                          Popular Presets
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handlePresetTime(t)}
                              className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                                config.time === t
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30 font-bold"
                                  : "bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom selectors */}
                      <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        Custom Time
                      </span>
                      <div className="flex gap-2 items-center justify-between">
                        {/* Hour */}
                        <div className="flex-1">
                          <select
                            value={selectedHour}
                            onChange={(e) => handleTimeUpdate(e.target.value, selectedMinute, selectedPeriod)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/80 px-2 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                          >
                            {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                        <span className="font-bold text-slate-400">:</span>
                        {/* Minute */}
                        <div className="flex-1">
                          <select
                            value={selectedMinute}
                            onChange={(e) => handleTimeUpdate(selectedHour, e.target.value, selectedPeriod)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/80 px-2 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                          >
                            {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        {/* Period */}
                        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700/60 p-0.5 border border-slate-200 dark:border-slate-700">
                          {["AM", "PM"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleTimeUpdate(selectedHour, selectedMinute, p)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                selectedPeriod === p
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location / Pitch</label>
              <input
                type="text"
                placeholder="e.g. Cairo Stadium"
                value={config.location}
                onChange={(e) => setConfig({ ...config, location: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cost per Player</label>
              <input
                type="text"
                placeholder="e.g. 50 EGP"
                value={config.cost}
                onChange={(e) => setConfig({ ...config, cost: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
              <textarea
                placeholder="Any special instructions for players..."
                value={config.notes}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] min-h-[80px] transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onGenerate(config);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98]"
            >
              Generate Teams
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

