"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { doc, onSnapshot, collection, updateDoc, arrayUnion, arrayRemove, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ui/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PlayerCard from "@/components/player/PlayerCard";
import { PlayerProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import MatchPitchDisplay from "@/components/match/MatchPitchDisplay";
import PlayerCardCompact from "@/components/player/PlayerCardCompact";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useMatchData } from "@/hooks/useMatchData";

import { useRouter, useSearchParams } from "next/navigation";
import RecordStatsModal from "@/components/match/RecordStatsModal";
import PlayerRatingModal from "@/components/player/PlayerRatingModal";
import EditMatchModal from "@/components/match/EditMatchModal";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import TurfMatchDisplay from "@/components/match/TurfMatchDisplay";
import LiveMatchController from "@/components/match/LiveMatchController";
import MatchConfigModal, { MatchConfig } from "@/components/match/MatchConfigModal";
import RegistrationPanel from "@/components/match/RegistrationPanel";

// Modular Sub-Components
import MatchHeader from "@/components/match/MatchHeader";
import LiveScoreboard from "@/components/match/LiveScoreboard";
import MotmPanel from "@/components/match/MotmPanel";
import MatchHistory from "@/components/match/MatchHistory";
import MatchTimeline from "@/components/match/MatchTimeline";
import PenaltyShootout from "@/components/match/PenaltyShootout";
import MatchPredictionWidget from "@/components/match/MatchPredictionWidget";

import { generateTurfMatch, balanceTeams } from "@/lib/engine";
import toast from "react-hot-toast";
import { Trophy, Sparkles, RefreshCw, Trash2, Edit, Flag, ArrowLeft, Users } from "lucide-react";

function MatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const { user, isAdmin, isOwner } = useAuth();
  const { activeCommunityId } = useCommunity();
  const { players } = usePlayers();

  const { matchData, loading, error, historyMatches, historyLoading } = useMatchData(activeCommunityId);

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Match History state — respect ?tab=history from query string
  const [activeTab, setActiveTab] = useState<'current' | 'history'>(() => {
    return searchParams.get('tab') === 'history' ? 'history' : 'current';
  });
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState<any>(null);

  const handleToggleSignInToBooking = async () => {
    if (!activeCommunityId || !user || !matchData || isSubmittingBooking) return;
    setIsSubmittingBooking(true);
    try {
      const isSignedUp = (matchData.signedUpPlayerUids || []).includes(user.uid);
      const latestRef = doc(db, "communities", activeCommunityId, "matches", "latest");
      const matchRef = doc(db, "communities", activeCommunityId, "matches", matchData.id);

      if (isSignedUp) {
        await updateDoc(latestRef, { signedUpPlayerUids: arrayRemove(user.uid) });
        await updateDoc(matchRef, { signedUpPlayerUids: arrayRemove(user.uid) }).catch(() => {});
        toast.success(isAr ? "تم إلغاء تسجيل حضورك" : "You have signed out from this match");
      } else {
        const currentCount = (matchData.signedUpPlayerUids || []).length;
        if (matchData.maxPlayers && currentCount >= matchData.maxPlayers) {
          toast.error(isAr ? "عذراً، اكتمل العدد المطلوب للحجز" : "Sorry, booking capacity reached");
        } else {
          await updateDoc(latestRef, { signedUpPlayerUids: arrayUnion(user.uid) });
          await updateDoc(matchRef, { signedUpPlayerUids: arrayUnion(user.uid) }).catch(() => {});
          toast.success(isAr ? "تم تسجيل حضورك للمباراة بنجاح! ⚽" : "Successfully signed in for the match! ⚽");
        }
      }
    } catch (err: any) {
      console.error("Sign in/out error:", err);
      toast.error(isAr ? "حدث خطأ أثناء التسجيل" : "Failed to update attendance");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleGenerateFromBooking = async () => {
    if (!activeCommunityId || !matchData || matchData.status !== 'registering') return;
    const signedUpUids = matchData.signedUpPlayerUids || [];
    if (signedUpUids.length < 4) {
      toast.error(isAr ? "يتطلب تكوين الفرق 4 لاعبين مسجلين على الأقل" : "Generating teams requires at least 4 checked-in players");
      return;
    }
    try {
      const signedUpPlayers = players.filter(p => signedUpUids.includes(p.uid));
      const config = matchData.config || {};
      const turfConfig = {
        numTeams: config.numTeams || 2,
        playersPerTeam: config.playersPerTeam || 6,
        gkMode: (config.gkMode || 'rotating') as 'fixed' | 'rotating',
        fixedGkTeamA: config.fixedGkTeamA,
        fixedGkTeamB: config.fixedGkTeamB,
        gkRotationInterval: (config.gkRotationInterval || 'per_match') as 'per_goal' | 'per_time',
        gkRotationMinutes: config.gkRotationMinutes,
        matchType: (config.matchType === 'friendly' ? 'friendly' : config.matchType === 'winner_stays' ? 'winner_stays' : config.matchType || 'league') as 'league' | 'knockout' | 'winner_stays' | 'friendly',
        matchDurationMins: config.matchDurationMins || 20,
        endCondition: config.endCondition || 'time',
        targetGoals: config.targetGoals || 3,
      };
      const turfResult = generateTurfMatch(signedUpPlayers, turfConfig);
      const updatedData = {
        ...matchData,
        status: 'active',
        turfResult,
        generatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), updatedData);
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchData.id), updatedData);
      toast.success(isAr ? "تم تكوين الفرق بنجاح وبدء المباراة!" : "Teams generated and match active!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل تكوين الفرق" : "Failed to generate teams");
    }
  };

  const handleRemakeTeams = async () => {
    if (!activeCommunityId || !matchData || !matchData.turfResult) return;
    try {
      const activePlayers = matchData.turfResult.teams.flatMap((t: any) => t.players);
      const config = matchData.config || {};
      const turfConfig = {
        numTeams: config.numTeams || matchData.turfResult.numTeams || 2,
        playersPerTeam: config.playersPerTeam || matchData.turfResult.playersPerTeam || 6,
        gkMode: (config.gkMode || matchData.turfResult.gkMode || 'rotating') as 'fixed' | 'rotating',
        fixedGkTeamA: config.fixedGkTeamA,
        fixedGkTeamB: config.fixedGkTeamB,
        gkRotationInterval: (config.gkRotationInterval || matchData.turfResult.gkRotationInterval || 'per_match') as 'per_goal' | 'per_time',
        gkRotationMinutes: config.gkRotationMinutes,
        matchType: (config.matchType === 'friendly' ? 'friendly' : config.matchType === 'winner_stays' ? 'winner_stays' : config.matchType || matchData.turfResult.matchType || 'league') as 'league' | 'knockout' | 'winner_stays' | 'friendly',
        matchDurationMins: config.matchDurationMins || matchData.turfResult.matchDurationMins || 20,
        endCondition: config.endCondition || matchData.turfResult.endCondition || 'time',
        targetGoals: config.targetGoals || matchData.turfResult.targetGoals || 3,
      };
      const turfResult = generateTurfMatch(activePlayers, turfConfig);
      const updatedData = {
        ...matchData,
        turfResult,
        generatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), updatedData);
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchData.id), updatedData);
      toast.success(isAr ? "تم إعادة توزيع الفرق بخلط جديد!" : "Teams remade successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إعادة التوزيع" : "Failed to remake teams");
    }
  };

  const handleEndBooking = async () => {
    if (!activeCommunityId || !matchData) return;
    if (!window.confirm(isAr ? "هل أنت متأكد من رغبتك في إنهاء الحجز بالكامل؟ سيتم نقل المباراة للأرشيف." : "Are you sure you want to end this booking completely?")) return;
    try {
      let bestMotmPlayer: any = null;
      let highestMotmScore = -999;
      const allMatchPlayers = [
        ...(matchData.teamA || []),
        ...(matchData.teamB || []),
        ...(matchData.bench || []).map((b: any) => b.player || b),
        ...(matchData.turfResult?.teams || []).flatMap((t: any) => t.players || []),
        ...(matchData.signedUpPlayerUids ? players.filter(p => matchData.signedUpPlayerUids.includes(p.uid)) : [])
      ];
      const uniquePlayers = Array.from(new Map(allMatchPlayers.filter(p => p && p.uid).map(p => [p.uid, p])).values());
      uniquePlayers.forEach((p: any) => {
        const ovr = Number(p.overallRating || p.attributes?.pace || 70);
        const goals = Number(matchData.recordedStats?.[p.uid]?.goals || p.stats?.goals || 0);
        const assists = Number(matchData.recordedStats?.[p.uid]?.assists || p.stats?.assists || 0);
        const mvp = Boolean(matchData.recordedStats?.[p.uid]?.mvp || false);
        const score = (goals * 4) + (assists * 2.5) + (mvp ? 6 : 0) + (ovr * 0.15);
        if (score > highestMotmScore) {
          highestMotmScore = score;
          bestMotmPlayer = p;
        }
      });
      const aiMotm = matchData.aiMotm || (bestMotmPlayer ? {
        uid: bestMotmPlayer.uid,
        name: bestMotmPlayer.cardName || bestMotmPlayer.fullName || "Player",
        photoUrl: bestMotmPlayer.photoUrl || null,
        score: Math.round(highestMotmScore * 10) / 10,
        goals: matchData.recordedStats?.[bestMotmPlayer.uid]?.goals || 0,
        assists: matchData.recordedStats?.[bestMotmPlayer.uid]?.assists || 0,
        reasonEn: `AI Algorithmic selection based on match rating (${bestMotmPlayer.overallRating || 75} OVR) and match impact.`,
        reasonAr: `اختيار الذكاء الاصطناعي بناءً على التقييم العام (${bestMotmPlayer.overallRating || 75} OVR) وتأثير اللاعب في المباراة.`
      } : null);

      const finishedData = { ...matchData, status: 'finished', finishedAt: new Date().toISOString(), aiMotm };
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchData.id), finishedData);
      await deleteDoc(doc(db, "communities", activeCommunityId, "matches", "latest"));
      toast.success(isAr ? "تم إنهاء الحجز وااختيار نجم المباراة بالأرشيف بنجاح!" : "Booking ended & AI Man of the Match selected successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء إنهاء الحجز" : "Failed to end booking");
    }
  };

  const handleDeleteMatch = async () => {
    if (!activeCommunityId || !matchData) return;
    if (!window.confirm(isAr ? "هل أنت متأكد من رغبتك في حذف المباراة تماماً؟ لن يتم نقلها للأرشيف." : "Are you sure you want to completely delete this match? It will not be archived.")) return;
    try {
      await deleteDoc(doc(db, "communities", activeCommunityId, "matches", "latest"));
      await deleteDoc(doc(db, "communities", activeCommunityId, "matches", matchData.id));
      toast.success(isAr ? "تم حذف المباراة بنجاح" : "Match completely deleted");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء الحذف" : "Failed to delete match");
    }
  };

  const handleCreateMatchFromPage = async (config: MatchConfig, previewData?: any) => {
    if (!activeCommunityId) return;
    try {
      let availablePlayers = players.filter((p) => !p.isExcludedFromMatchmaking);
      if (config.selectedPlayerUids && config.selectedPlayerUids.length > 0) {
        const selectedSet = new Set(config.selectedPlayerUids);
        availablePlayers = availablePlayers.filter(p => selectedSet.has(p.uid));
      }
      const playerIds = availablePlayers.map((p) => p.uid);

      if (!config.isOpenRegistration && playerIds.length < 22) {
        toast.error(isAr ? `توزيع الفرق يتطلب 22 لاعب على الأقل. يوجد حالياً ${playerIds.length}.` : `Matchmaking requires at least 22 players. Currently have ${playerIds.length}.`);
        return;
      }

      const matchId = `match_${Date.now()}`;
      let newMatchData: any;

      if (config.isOpenRegistration) {
        newMatchData = {
          id: matchId,
          success: true,
          status: 'registering',
          matchMode: config.matchMode || 'turf',
          maxPlayers: (config.playersPerTeam || 6) * (config.numTeams || 2),
          signedUpPlayerUids: [],
          config,
          generatedAt: new Date().toISOString(),
        };
      } else if (config.matchMode === 'turf') {
        let turfResult: any;
        if (previewData && previewData.matchMode === 'turf' && previewData.turfResult) {
          turfResult = previewData.turfResult;
        } else {
          const turfConfig = {
            numTeams: config.numTeams || 2,
            playersPerTeam: config.playersPerTeam || 6,
            gkMode: (config.gkMode || 'rotating') as 'fixed' | 'rotating',
            fixedGkTeamA: config.fixedGkTeamA,
            fixedGkTeamB: config.fixedGkTeamB,
            gkRotationInterval: (config.gkRotationInterval || 'per_match') as 'per_goal' | 'per_time',
            gkRotationMinutes: config.gkRotationMinutes,
            matchType: (config.matchType === 'friendly' ? 'friendly' : config.matchType === 'winner_stays' ? 'winner_stays' : config.matchType || 'league') as 'league' | 'knockout' | 'winner_stays' | 'friendly',
            matchDurationMins: config.matchDurationMins || 20,
            endCondition: config.endCondition || 'time',
            targetGoals: config.targetGoals || 3,
          };
          turfResult = generateTurfMatch(availablePlayers, turfConfig);
        }
        newMatchData = {
          id: matchId,
          success: true,
          status: 'active',
          matchMode: 'turf',
          turfResult,
          config,
          generatedAt: new Date().toISOString(),
        };
      } else {
        let teamA, teamB, bench, metrics, formation, tipsAndTactics;
        if (previewData && previewData.matchMode === 'standard') {
          teamA = previewData.teamA || [];
          teamB = previewData.teamB || [];
          bench = previewData.bench || [];
          metrics = previewData.metrics || { teamAAvg: 70, teamBAvg: 70 };
          formation = previewData.formation || "4-3-3";
          tipsAndTactics = previewData.tipsAndTactics || [];
        } else {
          const result = balanceTeams(availablePlayers);
          teamA = result.teamA;
          teamB = result.teamB;
          bench = [...(result.benchA || []), ...(result.benchB || [])];
          metrics = result.metrics;
          formation = result.formation;
          tipsAndTactics = result.tipsAndTactics;
        }
        newMatchData = {
          id: matchId,
          success: true,
          status: 'active',
          matchMode: 'standard',
          teamA,
          teamB,
          bench,
          metrics,
          formation,
          tipsAndTactics,
          config,
          generatedAt: new Date().toISOString(),
        };
      }

      await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), newMatchData);
      await setDoc(doc(db, "communities", activeCommunityId, "matches", matchId), newMatchData);
      setIsConfigModalOpen(false);
      toast.success(isAr ? "تم إنشاء المباراة / الحجز بنجاح!" : "Match / Booking created successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل في إنشاء المباراة أو الحجز" : "Failed to create match or booking");
    }
  };

  const handleVoteCaptain = async (candidateUid: string) => {
    if (!user?.uid) {
      toast.error(isAr ? "يرجى تسجيل الدخول أولاً للتصويت" : "Please log in to vote");
      return;
    }
    if (user.uid === candidateUid) {
      toast.error(isAr ? "لا يمكنك التصويت لنفسك ككابتن الفريق!" : "You cannot vote for yourself as captain!");
      return;
    }
    const currentMatch = activeTab === "history" ? selectedHistoryMatch : matchData;
    if (!activeCommunityId || !currentMatch?.id) return;

    try {
      const currentVotes = { ...(currentMatch.captainVotes || {}) };
      const isAlreadyVotedForThisCandidate = currentVotes[user.uid] === candidateUid;

      if (isAlreadyVotedForThisCandidate) {
        delete currentVotes[user.uid];
      } else {
        currentVotes[user.uid] = candidateUid;
      }

      if (currentMatch.id !== "latest") {
        setSelectedHistoryMatch((prev: any) => prev ? { ...prev, captainVotes: currentVotes } : prev);
      }

      const matchRef = doc(db, "communities", activeCommunityId, "matches", currentMatch.id);
      await setDoc(matchRef, { captainVotes: currentVotes }, { merge: true });

      if (currentMatch.id === matchData?.id || currentMatch.id === 'latest') {
        await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), { captainVotes: currentVotes }, { merge: true });
      }

      if (isAlreadyVotedForThisCandidate) {
        toast.success(isAr ? "تم إلغاء صوتك لكابتن الفريق" : "Your captain vote was removed");
      } else {
        try {
          await setDoc(doc(collection(db, `users/${candidateUid}/notifications`), `captain_vote_match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
            type: 'social',
            title: isAr ? '👑 صوت كابتن للمباراة!' : '👑 Match Captain Vote!',
            body: isAr ? `قام أحد زملائك في المجتمع بالتصويت لك لتكون كابتن الفريق في المباراة!` : `A community teammate voted for you to be captain in the match!`,
            read: false,
            createdAt: serverTimestamp(),
            link: '/match'
          });
        } catch (e) {
          console.warn("Could not send match captain vote notification:", e);
        }
        toast.success(isAr ? "تم تسجيل صوتك (+1) للكابتن بنجاح! 👑" : "Your captain vote (+1) has been recorded! 👑");
      }
    } catch (err) {
      console.error("Vote captain error:", err);
      toast.error(isAr ? "حدث خطأ أثناء التصويت" : "Error recording vote");
    }
  };

  const handleSaveTeamPositions = async (teamKey: 'teamA' | 'teamB', updatedTeam: any[], newFormation?: string) => {
    const currentMatch = activeTab === "history" ? selectedHistoryMatch : matchData;
    if (!activeCommunityId || !currentMatch?.id || !isAdmin || isViewingHistory) return;

    try {
      const updatedFormation = {
        ...(currentMatch.formation || {}),
        [teamKey]: newFormation || currentMatch.formation?.[teamKey] || (teamKey === 'teamA' ? '4-3-3' : '4-4-2')
      };

      const avgRating = updatedTeam.reduce((acc, p) => acc + (p.psi || p.overallRating || 60), 0) / Math.max(1, updatedTeam.length);
      const updatedMetrics = {
        ...(currentMatch.metrics || {}),
        [`${teamKey}Overall`]: avgRating
      };

      const updatePayload = {
        [teamKey]: updatedTeam,
        formation: updatedFormation,
        metrics: updatedMetrics
      };

      const matchRef = doc(db, "communities", activeCommunityId, "matches", currentMatch.id);
      await setDoc(matchRef, updatePayload, { merge: true });

      if (currentMatch.id === matchData?.id || currentMatch.id === 'latest') {
        await setDoc(doc(db, "communities", activeCommunityId, "matches", "latest"), updatePayload, { merge: true });
      }

      toast.success(isAr ? "تم تحديث مراكز وتشكيلة الفريق وحفظ التقييمات الواقعية!" : "Team formation, positions, and realistic OVR updated!");
    } catch (err) {
      console.error("Save positions error:", err);
      toast.error(isAr ? "حدث خطأ أثناء حفظ التشكيلة" : "Failed to save team positions");
    }
  };

  const displayMatch = activeTab === "history" ? selectedHistoryMatch : matchData;
  const isViewingHistory = activeTab === "history" && Boolean(selectedHistoryMatch);

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-950 text-white transition-colors pb-16" dir={isAr ? 'rtl' : 'ltr'}>
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          
          {/* Header Banner — Solid Dark Slate */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-950 text-emerald-400 border border-slate-800 mb-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? "مركز إدارة المباريات والتشكيلات التكتيكية" : "Matches & Lineups Control Center"}</span>
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  {isAr ? "المباريات والتكتيكات" : "Matches & Lineups"}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  {isAr 
                    ? "تابع التشكيلات والتكتيكات للمباراة القادمة، أو استعرض سجل المباريات السابقة والإحصائيات."
                    : "View upcoming match lineups and tactics, or explore historical matches and recorded statistics."}
                </p>
              </div>
            </div>

            {/* Action buttons for Admin */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <span>⚽</span>
                <span>{isAr ? "إنشاء مباراة أو حجز جديد" : "Create Match / Booking"}</span>
              </button>
            )}
          </div>

          {/* Solid Navigation Tab Switcher */}
          <div className="flex justify-center">
            <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-2 shadow-2xl">
              <button
                type="button"
                onClick={() => { setActiveTab('current'); setSelectedHistoryMatch(null); }}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'current'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-transparent text-slate-400 hover:text-white font-bold'
                }`}
              >
                <span>⚡</span>
                <span>{isAr ? "المباراة القادمة" : "Upcoming Match"}</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('history'); setSelectedHistoryMatch(null); }}
                className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-transparent text-slate-400 hover:text-white font-bold'
                }`}
              >
                <span>📜</span>
                <span>{isAr ? "سجل المباريات السابقة" : "Match History"}</span>
              </button>
            </div>
          </div>

          {/* Config details banner for displayed match */}
          {displayMatch?.config && (
            <MatchHeader
              config={displayMatch.config}
              isAr={isAr}
              isAdmin={isAdmin}
              isViewingHistory={isViewingHistory}
              onOpenRecordModal={() => setIsRecordModalOpen(true)}
              onOpenEditModal={() => setIsEditModalOpen(true)}
              onDeleteMatch={handleDeleteMatch}
            />
          )}

          {activeTab === 'history' && !selectedHistoryMatch ? (
            <MatchHistory
              historyLoading={historyLoading}
              historyMatches={historyMatches}
              isAr={isAr}
              isAdmin={isAdmin}
              activeCommunityId={activeCommunityId}
              onSelectHistoryMatch={(m) => setSelectedHistoryMatch(m)}
            />
          ) : (
            <>
              {isViewingHistory && (
                <div className="mb-6 bg-slate-900 border border-amber-500/40 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 text-xl shadow">
                      📜
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        {isAr ? "سجل مباراة سابقة" : "Historical Match Record"}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {isAr ? "التاريخ:" : "Date:"} {displayMatch.config?.date || new Date(displayMatch.finishedAt || displayMatch.generatedAt || Date.now()).toLocaleDateString()}
                        {displayMatch.config?.location ? ` • 🏟️ ${displayMatch.config.location}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryMatch(null)}
                    className="px-5 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                    <span>{isAr ? "العودة لسجل المباريات" : "Back to Match History"}</span>
                  </button>
                </div>
              )}

              {loading && !isViewingHistory ? (
                <SiteSkeletonLoader variant="match" />
              ) : error && !isViewingHistory ? (
                <div className="text-center py-16 bg-slate-900 rounded-3xl border border-rose-500/40 text-rose-400 font-bold text-xs">
                  {error}
                </div>
              ) : !displayMatch ? (
                <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center gap-4">
                  <h3 className="text-xl font-black text-white">
                    {isAr ? "لا توجد مباراة مبرمجة حالياً" : "No Match Scheduled"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md font-medium">
                    {isAr ? "يرجى الانتظار حتى تقوم الإدارة بتشكيل الفرق." : "Please wait for admins to generate the next match."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsConfigModalOpen(true)}
                      className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>⚽</span>
                      <span>{isAr ? "إنشاء مباراة أو فتح حجز جديد" : "Create Match / Open Booking"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
                  {/* Open Registration / Booking View */}
                  {displayMatch.status === 'registering' && (
                    <RegistrationPanel
                      matchData={displayMatch}
                      user={user}
                      players={players}
                      isAr={isAr}
                      isSubmitting={isSubmittingBooking}
                      isAdmin={isAdmin || isOwner}
                      onToggleSignIn={handleToggleSignInToBooking}
                      onGenerateTeams={handleGenerateFromBooking}
                    />
                  )}

                  {/* Live Admin Control Panel (When Active) */}
                  {displayMatch.status !== 'registering' && isAdmin && !isViewingHistory && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 text-white shadow-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-black text-xs text-amber-400">
                          {isAr ? "لوحة تحكم الإدارة الحية للمباراة" : "Live Admin Match Control Panel"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRemakeTeams}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{isAr ? "إعادة خلط وتوزيع الفرق" : "Remake Teams"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleEndBooking}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs shadow transition-all flex items-center gap-1.5"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>{isAr ? "إنهاء الحجز وأرشفته" : "End & Archive Booking"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pre-Match Prediction Poll Widget */}
                  {displayMatch.status !== 'finished' && !isViewingHistory && activeCommunityId && (
                    <MatchPredictionWidget
                      matchId={displayMatch.id || 'latest'}
                      communityId={activeCommunityId}
                      userUid={user?.uid}
                      isAr={isAr}
                    />
                  )}

                  {/* AI Man of the Match (MOTM) Banner */}
                  {(displayMatch.aiMotm || (displayMatch.status === 'finished' && displayMatch.recordedStats)) && (
                    <MotmPanel
                      aiMotm={displayMatch.aiMotm}
                      recordedStats={displayMatch.recordedStats}
                      teamA={displayMatch.teamA}
                      teamB={displayMatch.teamB}
                      turfResult={displayMatch.turfResult}
                      isAr={isAr}
                    />
                  )}

                  {/* Live Match Stopwatch & Extra Time Controller */}
                  {displayMatch.status !== 'registering' && !isViewingHistory && (
                    <LiveMatchController
                      matchDurationMins={displayMatch.config?.matchDurationMins || displayMatch.turfResult?.matchDurationMins || 20}
                      isAr={isAr}
                      isAdmin={isAdmin}
                      onOpenRecordModal={() => setIsRecordModalOpen(true)}
                      enableCardsSystem={displayMatch.turfResult?.enableCardsSystem !== false && displayMatch.enableCardsSystem !== false}
                    />
                  )}

                  {/* Turf / Casual Match Display */}
                  {displayMatch.status !== 'registering' && displayMatch.matchMode === 'turf' && displayMatch.turfResult && (
                    <TurfMatchDisplay 
                      turfResult={displayMatch.turfResult} 
                      isAr={isAr} 
                      captainVotes={displayMatch.captainVotes || {}}
                      onVoteCaptain={handleVoteCaptain}
                      currentUserUid={user?.uid}
                    />
                  )}

                  {/* Standard 11v11 Lineup View */}
                  {displayMatch.status !== 'registering' && displayMatch.matchMode !== 'turf' && displayMatch.matchMode !== 'inter_community' && (
                    <div className="space-y-8">
                      {/* Scoreboard Banner if match has recorded stats */}
                      {displayMatch.recordedStats && (
                        <LiveScoreboard
                          recordedStats={displayMatch.recordedStats}
                          formation={displayMatch.formation}
                          teamA={displayMatch.teamA}
                          teamB={displayMatch.teamB}
                          isAr={isAr}
                        />
                      )}

                      <div className="grid xl:grid-cols-2 gap-8">
                        {/* Team A */}
                        <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-2xl">
                          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <h3 className="text-2xl font-black text-cyan-400">Team A</h3>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-slate-950 text-cyan-300 px-3 py-1.5 rounded-xl font-bold border border-slate-800 text-xs">
                                {displayMatch.formation?.teamA || "4-3-3"}
                              </span>
                              <span className="font-mono bg-slate-950 text-slate-300 px-3 py-1.5 rounded-xl font-bold border border-slate-800 text-xs">
                                OVR: {displayMatch.metrics?.teamAOverall?.toFixed(1) || 75}
                              </span>
                            </div>
                          </div>

                          <MatchPitchDisplay 
                            team={displayMatch.teamA || []} 
                            teamName="Team A" 
                            color="blue" 
                            onPlayerClick={(p) => setSelectedPlayer(p as unknown as PlayerProfile)} 
                            recordedStats={displayMatch.recordedStats}
                            isAdmin={isAdmin && !isViewingHistory}
                            currentFormation={displayMatch.formation?.teamA || '4-3-3'}
                            onFormationOrPositionChange={(updatedTeam, newForm) => handleSaveTeamPositions('teamA', updatedTeam, newForm)}
                            captainVotes={displayMatch.captainVotes || {}}
                            onVoteCaptain={handleVoteCaptain}
                            currentUserUid={user?.uid}
                            isAr={isAr}
                          />
                        </div>

                        {/* Team B */}
                        <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-2xl">
                          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <h3 className="text-2xl font-black text-rose-400">Team B</h3>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-slate-950 text-rose-300 px-3 py-1.5 rounded-xl font-bold border border-slate-800 text-xs">
                                {displayMatch.formation?.teamB || "4-4-2"}
                              </span>
                              <span className="font-mono bg-slate-950 text-slate-300 px-3 py-1.5 rounded-xl font-bold border border-slate-800 text-xs">
                                OVR: {displayMatch.metrics?.teamBOverall?.toFixed(1) || 75}
                              </span>
                            </div>
                          </div>

                          <MatchPitchDisplay 
                            team={displayMatch.teamB || []} 
                            teamName="Team B" 
                            color="red" 
                            isReversed={false}
                            onPlayerClick={(p) => setSelectedPlayer(p as unknown as PlayerProfile)} 
                            recordedStats={displayMatch.recordedStats}
                            isAdmin={isAdmin && !isViewingHistory}
                            currentFormation={displayMatch.formation?.teamB || '4-4-2'}
                            onFormationOrPositionChange={(updatedTeam, newForm) => handleSaveTeamPositions('teamB', updatedTeam, newForm)}
                            captainVotes={displayMatch.captainVotes || {}}
                            onVoteCaptain={handleVoteCaptain}
                            currentUserUid={user?.uid}
                            isAr={isAr}
                          />
                        </div>
                      </div>

                      {/* Individual Player Stats Table */}
                      {displayMatch.recordedStats && (
                        <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-2xl">
                          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-4">
                            <span>📊</span>
                            <span>{isAr ? 'إحصائيات اللاعبين في المباراة' : 'Player Match Statistics'}</span>
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400">
                                  <th className="text-start py-3 px-3 font-black">{isAr ? 'اللاعب' : 'Player'}</th>
                                  <th className="text-center py-3 px-2 font-black">{isAr ? 'الفريق' : 'Team'}</th>
                                  <th className="text-center py-3 px-2 font-black text-amber-400">⚽</th>
                                  <th className="text-center py-3 px-2 font-black text-emerald-400">🅰️</th>
                                  <th className="text-center py-3 px-2 font-black text-yellow-400">🟨</th>
                                  <th className="text-center py-3 px-2 font-black text-rose-400">🟥</th>
                                  <th className="text-center py-3 px-2 font-black text-purple-400">⭐</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {[...(displayMatch.teamA || []), ...(displayMatch.teamB || [])].map((p: any) => {
                                  const stats = displayMatch.recordedStats?.[p.uid];
                                  if (!stats) return null;
                                  const isTeamA = (displayMatch.teamA || []).some((t: any) => t.uid === p.uid);
                                  return (
                                    <tr key={p.uid} className="hover:bg-slate-950 transition-colors">
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                            {(p.photoUrl || p.googlePic) ? (
                                              <Image src={p.photoUrl || p.googlePic} alt="" width={28} height={28} className="object-cover w-full h-full" />
                                            ) : (
                                              (p.cardName || p.fullName || '?').charAt(0)
                                            )}
                                          </div>
                                          <span className="font-bold text-white text-xs">{p.cardName || p.fullName}</span>
                                        </div>
                                      </td>
                                      <td className="text-center py-3 px-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isTeamA ? 'bg-slate-950 text-cyan-400 border-cyan-500/40' : 'bg-slate-950 text-rose-400 border-rose-500/40'}`}>
                                          {isTeamA ? 'Team A' : 'Team B'}
                                        </span>
                                      </td>
                                      <td className="text-center py-3 px-2 font-black text-emerald-400">{stats.goals || 0}</td>
                                      <td className="text-center py-3 px-2 font-black text-cyan-400">{stats.assists || 0}</td>
                                      <td className="text-center py-3 px-2 font-black text-yellow-400">{stats.yellowCards || 0}</td>
                                      <td className="text-center py-3 px-2 font-black text-rose-400">{stats.redCards || 0}</td>
                                      <td className="text-center py-3 px-2">{stats.mvp ? <span className="text-amber-400 font-black">MVP</span> : <span className="text-slate-600">-</span>}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </main>

        {/* Player Detail Card Modal */}
        <AnimatePresence>
          {selectedPlayer && (
            <div
              onClick={() => setSelectedPlayer(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl"
              >
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-slate-950 rounded-full flex items-center justify-center shadow border border-slate-800 z-10 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
                <PlayerCard player={selectedPlayer} />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <MatchConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onGenerate={handleCreateMatchFromPage}
          communityPlayers={players}
        />

        <RecordStatsModal 
          isOpen={isRecordModalOpen} 
          onClose={() => setIsRecordModalOpen(false)} 
          matchData={matchData} 
        />

        <EditMatchModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          matchData={matchData}
          communityId={activeCommunityId || ""}
        />

        <PlayerRatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          matchId={selectedHistoryMatch?.id || ''}
          players={[...(displayMatch?.teamA || []), ...(displayMatch?.teamB || [])]}
          isAr={isAr}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<SiteSkeletonLoader variant="match" />}>
      <MatchContent />
    </Suspense>
  );
}
