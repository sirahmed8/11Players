'use client';

import React from 'react';
import LiveMatchBroadcaster from '@/components/broadcaster/LiveMatchBroadcaster';
import { useMatchData } from '@/hooks/useMatchData';
import { useCommunity } from '@/contexts/CommunityContext';
import { useLocale } from '@/components/ui/ThemeProvider';
import SiteSkeletonLoader from '@/components/ui/SiteSkeletonLoader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Swords, Play, Activity } from 'lucide-react';
import Link from 'next/link';

function LiveContent() {
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { matchData, loading } = useMatchData(activeCommunityId);
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  if (loading) {
    return <SiteSkeletonLoader variant="live-broadcaster" />;
  }

  // Real Match active
  if (matchData && (matchData.status === 'live' || matchData.status === 'registering')) {
    const teamAName = matchData.teamAName || (activeCommunity ? `${activeCommunity.name} - Team A` : 'Team Alpha');
    const teamBName = matchData.teamBName || (activeCommunity ? `${activeCommunity.name} - Team B` : 'Team Bravo');

    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
        <LiveMatchBroadcaster
          teamAName={teamAName}
          teamBName={teamBName}
          initialScoreA={matchData.scoreA || 0}
          initialScoreB={matchData.scoreB || 0}
          autoSimulate={matchData.status === 'live'}
        />
      </main>
    );
  }

  // No active match running — Clean empty state wrapped in premium glass card
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl p-10 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-2xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isAr ? 'لا توجد مباراة مباشرة قائمة حالياً' : 'No Live Match Currently Playing'}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            {isAr ? (
              <>
                لا يتبوأ بث مباشر حالياً في مجتمع <span className="text-emerald-400 font-bold">{activeCommunity?.name || 'مجتمعك'}</span>. يمكنك بدء مباراة جديدة أو فتح لوحة التحكم المباشرة من مركز المباريات.
              </>
            ) : (
              <>
                There is no live match broadcast right now in <span className="text-emerald-400 font-bold">{activeCommunity?.name || 'your community'}</span>. Start a new match or open the Live Controller from the matches hub.
              </>
            )}
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/matches"
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isAr ? 'الانتقال لمركز المباريات والحجز' : 'Go to Matches Hub'}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LiveMatchPage() {
  return (
    <ProtectedRoute requireCommunity>
      <LiveContent />
    </ProtectedRoute>
  );
}
