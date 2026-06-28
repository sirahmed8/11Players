import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';
import PlayerCardCompact from './PlayerCardCompact';
import { PlayerProfile } from '@/types';
import { useLocale } from './ThemeProvider';

// Note: MatchmakingResult is imported as 'any' here or we can define a quick type
export default function MatchmakingModal({ result, onClose }: { result: any, onClose: () => void }) {
  const { locale } = useLocale();
  const t = (locale: string, en: string, ar: string) => locale === 'ar' ? ar : en;

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 p-6 lg:p-10 text-slate-900 dark:text-white"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
          <h2 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
            {t(locale, 'Matchmaking Results', 'نتائج تشكيل الفرق')}
          </h2>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-bold"
          >
            {t(locale, 'Close', 'إغلاق')}
          </button>
        </div>
        
        <div className="grid xl:grid-cols-2 gap-10">
          {/* Team A */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">Team A</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl font-bold border border-blue-200 dark:border-blue-800/50">
                  {result.formation?.teamA || "Formation"}
                </span>
                <span className="font-mono bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
                  OVR: {result.metrics?.teamAOverall?.toFixed(1)}
                </span>
              </div>
            </div>
            {result.tipsAndTactics?.teamA && (
              <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                <p className="text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">💡 {t(locale, 'Tactics:', 'التكتيك:')}</span> 
                  {result.tipsAndTactics.teamA}
                </p>
              </div>
            )}
            
            {/* Player Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {result.teamA?.map((p: any) => (
                <div key={p.uid} className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative transform transition-transform duration-300 group-hover:scale-[1.02]">
                    <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 shadow-xl">
                      <span className="font-black text-white text-xs">{p.assignedPosition}</span>
                    </div>
                    <PlayerCardCompact player={p as PlayerProfile} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team B */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="text-3xl font-black text-red-600 dark:text-red-400">Team B</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-4 py-2 rounded-xl font-bold border border-red-200 dark:border-red-800/50">
                  {result.formation?.teamB || "Formation"}
                </span>
                <span className="font-mono bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
                  OVR: {result.metrics?.teamBOverall?.toFixed(1)}
                </span>
              </div>
            </div>
            {result.tipsAndTactics?.teamB && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl">
                <p className="text-red-800 dark:text-red-200 font-medium leading-relaxed">
                  <span className="font-bold text-red-600 dark:text-red-400 mr-2">💡 {t(locale, 'Tactics:', 'التكتيك:')}</span> 
                  {result.tipsAndTactics.teamB}
                </p>
              </div>
            )}
            
            {/* Player Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {result.teamB?.map((p: any) => (
                <div key={p.uid} className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative transform transition-transform duration-300 group-hover:scale-[1.02]">
                    <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 shadow-xl">
                      <span className="font-black text-white text-xs">{p.assignedPosition}</span>
                    </div>
                    <PlayerCardCompact player={p as PlayerProfile} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
