import React, { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
      >
        <div className="p-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Match Configuration</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={config.date}
                  onChange={(e) => setConfig({ ...config, date: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                <input
                  type="time"
                  value={config.time}
                  onChange={(e) => setConfig({ ...config, time: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Location / Pitch</label>
              <input
                type="text"
                placeholder="e.g. Cairo Stadium"
                value={config.location}
                onChange={(e) => setConfig({ ...config, location: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost per Player</label>
              <input
                type="text"
                placeholder="e.g. 50 EGP"
                value={config.cost}
                onChange={(e) => setConfig({ ...config, cost: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
              <textarea
                placeholder="Any special instructions..."
                value={config.notes}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] transition-shadow duration-300"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onGenerate(config);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/30"
            >
              Generate Teams
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
