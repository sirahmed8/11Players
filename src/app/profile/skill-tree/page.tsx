'use client';

import React, { useState, useEffect } from 'react';
import XpSkillTree from '@/components/gamification/XpSkillTree';
import { AchievementsContent } from '@/components/gamification/AchievementsContent';
import { useSearchParams } from 'next/navigation';
import { useLocale } from '@/components/ui/ThemeProvider';
import { Zap, Trophy, Award, Sparkles } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function ProgressionHubContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'skill-tree' ? 'skill-tree' : 'achievements';
  const [activeTab, setActiveTab] = useState<'skill-tree' | 'achievements'>(initialTab);
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'skill-tree') {
      setActiveTab('skill-tree');
    } else if (tabParam === 'achievements') {
      setActiveTab('achievements');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Unified Progression Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {isAr ? 'شجرة التطوير والإنجازات' : 'Player Progression Hub'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {isAr ? 'تطوير قدرات اللاعب والشارات وفتح الإنجازات الملحمية' : 'Unlock playstyle attributes, badge ranks, and epic trophies'}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('skill-tree')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'skill-tree'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isAr ? 'شجرة المهارات XP' : 'Playstyle Skill Tree'}</span>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'achievements'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{isAr ? 'خزانة الإنجازات' : 'Hall of Achievements'}</span>
            </button>
          </div>
        </div>

        {/* Tab View Render */}
        {activeTab === 'skill-tree' ? (
          <XpSkillTree />
        ) : (
          <AchievementsContent />
        )}
      </div>
    </div>
  );
}

export default function SkillTreePage() {
  return (
    <ProtectedRoute>
      <ProgressionHubContent />
    </ProtectedRoute>
  );
}
