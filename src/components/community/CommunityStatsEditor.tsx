import React from 'react';
import type { CommunityStats } from '@/types';

interface CommunityStatsEditorProps {
  stats: CommunityStats;
  onStatChange: (field: keyof CommunityStats, value: number) => void;
  isRTL: boolean;
}

export default function CommunityStatsEditor({ stats, onStatChange, isRTL }: CommunityStatsEditorProps) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
        {isRTL ? 'إحصائيات المجتمع' : 'Community Stats'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['goals', 'assists', 'mvp', 'matchesPlayed'].map(statKey => (
          <div key={statKey}>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{statKey}</label>
            <input 
              type="number" 
              min="0" 
              value={stats[statKey as keyof CommunityStats] as number || 0} 
              onChange={(e) => onStatChange(statKey as keyof CommunityStats, parseInt(e.target.value) || 0)} 
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
