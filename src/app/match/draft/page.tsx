"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayers } from '@/contexts/PlayersContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/components/ui/ThemeProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SiteSkeletonLoader from '@/components/ui/SiteSkeletonLoader';
import MatchActionHubBar from '@/components/match/MatchActionHubBar';
import CaptainDraftRoom from '@/components/draft/CaptainDraftRoom';
import { PlayerProfile } from '@/types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Users, Sparkles, Trophy, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function DraftContent() {
  const router = useRouter();
  const { players, loading } = usePlayers();
  const { activeCommunity, activeCommunityId } = useCommunity();
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [draftStarted, setDraftStarted] = useState(false);
  const [captain1Uid, setCaptain1Uid] = useState<string>('');
  const [captain2Uid, setCaptain2Uid] = useState<string>('');

  // Active sorted pool
  const eligiblePlayers = useMemo(() => {
    return (players || []).filter((p) => !p.isExcludedFromMatchmaking);
  }, [players]);

  // Default captains to top 2 rated players if not chosen
  const topPlayers = useMemo(() => {
    return [...eligiblePlayers].sort((a, b) => (b.overallRating || 70) - (a.overallRating || 70));
  }, [eligiblePlayers]);

  const activeCap1 = captain1Uid || topPlayers[0]?.uid || '';
  const activeCap2 = captain2Uid || (topPlayers[1]?.uid !== activeCap1 ? topPlayers[1]?.uid : topPlayers[2]?.uid) || '';

  const handleLaunchMatch = async (teamA: PlayerProfile[], teamB: PlayerProfile[]) => {
    if (!activeCommunityId) return;

    try {
      const matchDocRef = doc(db, "communities", activeCommunityId, "matches", "latest");
      await setDoc(matchDocRef, {
        teamA,
        teamB,
        matchType: 'draft',
        status: 'scheduled',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        scoreA: 0,
        scoreB: 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success(
        isAr 
          ? "تم اعتماد نتيجة القرعة وتشكيل الفرق بنجاح!" 
          : "Draft finalized & teams configured successfully!"
      );
      router.push('/match');
    } catch (err) {
      console.error("Failed to save drafted teams:", err);
      toast.error(isAr ? "فشل حفظ نتيجة القرعة" : "Failed to save draft result");
    }
  };

  if (loading) {
    return <SiteSkeletonLoader variant="draft-room" />;
  }

  const hasEnoughPlayers = eligiblePlayers.length >= 4;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16 transition-colors" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        <MatchActionHubBar />

        {/* Page Hero Header */}
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                <Trophy className="w-3.5 h-3.5" />
                <span>{isAr ? "نظام قرعة الكباتن الحية" : "Live Captain Draft Engine"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {isAr ? "غرفة قرعة الكباتن (Captain Draft Room)" : "Captain Draft Room"}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                {isAr
                  ? `اختر كباتن الفرق وابدأ قرعة الاختيار بنظام Snake Draft التبادلي مع موازنة فورية لطاقات OVR ومؤشر PSI لمجتمع ${activeCommunity?.name || ''}.`
                  : `Select team captains and initiate real-time Snake or Classic turn drafting with instant OVR and PSI balance monitoring for ${activeCommunity?.name || 'your community'}.`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {draftStarted && (
                <button
                  type="button"
                  onClick={() => setDraftStarted(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isAr ? "إعادة ضبط الكباتن" : "Reset Captains"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        {!hasEnoughPlayers ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-2xl">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? "عدد اللاعبين غير كافٍ للقرعة" : "Not Enough Players For A Draft"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isAr
                ? "تتطلب القرعة وجود 4 لاعبين على الأقل في المجتمع لتشكيل فريقين (كابتن ولاعب إضافي لكل فريق)."
                : "The draft room requires at least 4 registered community players to form two teams with rotating picks."}
            </p>
            <div className="pt-2">
              <Link
                href="/community"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 shadow-md shadow-emerald-600/20"
              >
                <Users className="w-4 h-4" />
                <span>{isAr ? "دعوة لاعبين للمجتمع" : "Manage Community Roster"}</span>
              </Link>
            </div>
          </div>
        ) : !draftStarted ? (
          /* Captain Setup View */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? "الخطوة 1: تحديد كابتن الفريق أ والفريق ب" : "Step 1: Assign Captains for Team A and Team B"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr 
                  ? "اختر الكابتن الأول والثاني لبدء دورة الاختيار التبادلي." 
                  : "Select Captain 1 and Captain 2 before launching the turn-based draft."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Captain 1 Picker */}
              <div className="space-y-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {isAr ? "كابتن الفريق أ (Team A Captain)" : "Team A Captain (First Pick)"}
                </label>
                <select
                  value={activeCap1}
                  onChange={(e) => setCaptain1Uid(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {topPlayers.map((p) => (
                    <option key={p.uid} value={p.uid} disabled={p.uid === activeCap2}>
                      {p.cardName || p.fullName} ({p.primaryPosition || 'CMF'} - {p.overallRating || 70} OVR)
                    </option>
                  ))}
                </select>
              </div>

              {/* Captain 2 Picker */}
              <div className="space-y-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  {isAr ? "كابتن الفريق ب (Team B Captain)" : "Team B Captain (Second Pick)"}
                </label>
                <select
                  value={activeCap2}
                  onChange={(e) => setCaptain2Uid(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  {topPlayers.map((p) => (
                    <option key={p.uid} value={p.uid} disabled={p.uid === activeCap1}>
                      {p.cardName || p.fullName} ({p.primaryPosition || 'CMF'} - {p.overallRating || 70} OVR)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setDraftStarted(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? "دخول غرفة القرعة وبدء الاختيار" : "Enter Draft Room & Begin Picks"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Live Interactive Captain Draft Room */
          <CaptainDraftRoom
            initialPlayers={eligiblePlayers}
            captain1Uid={activeCap1}
            captain2Uid={activeCap2}
            turnSeconds={30}
            onMatchLaunch={handleLaunchMatch}
          />
        )}
      </div>
    </div>
  );
}

export default function DraftPage() {
  return (
    <ProtectedRoute requireCommunity>
      <DraftContent />
    </ProtectedRoute>
  );
}
