'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunity } from '@/contexts/CommunityContext';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Brain, Target, Shield, Zap, Hand, CheckCircle, AlertCircle } from 'lucide-react';
import type { PlayerAttributes } from '@/types';

interface PlayerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  players: any[];
  isAr: boolean;
}

const ABILITY_CATEGORIES = [
  {
    id: 'offensive',
    nameEn: 'Offensive & Finishing',
    nameAr: 'الهجوم والإنهاء',
    icon: Target,
    keys: ['offensiveAwareness', 'ballControl', 'dribbling', 'finishing', 'kickingPower'] as (keyof PlayerAttributes)[]
  },
  {
    id: 'passing',
    nameEn: 'Passing & Vision',
    nameAr: 'التمرير والرؤية',
    icon: Brain,
    keys: ['lowPass', 'loftedPass'] as (keyof PlayerAttributes)[]
  },
  {
    id: 'physical',
    nameEn: 'Physical & Pace',
    nameAr: 'البدني والسرعة',
    icon: Zap,
    keys: ['speed', 'acceleration', 'jump', 'physicalContact', 'balance', 'stamina'] as (keyof PlayerAttributes)[]
  },
  {
    id: 'defensive',
    nameEn: 'Defensive & Aggression',
    nameAr: 'الدفاع والافتكاك',
    icon: Shield,
    keys: ['defensiveAwareness', 'ballWinning', 'aggression', 'heading'] as (keyof PlayerAttributes)[]
  },
  {
    id: 'goalkeeping',
    nameEn: 'Goalkeeping Abilities',
    nameAr: 'قدرات حراسة المرمى',
    icon: Hand,
    keys: ['gkAwareness', 'gkCatching', 'gkClearing', 'gkReflexes', 'gkReach'] as (keyof PlayerAttributes)[]
  }
];

const ABILITY_NAMES: Record<string, { en: string; ar: string }> = {
  offensiveAwareness: { en: 'Offensive Awareness', ar: 'الوعي الهجومي' },
  ballControl: { en: 'Ball Control', ar: 'التحكم بالكرة' },
  dribbling: { en: 'Dribbling', ar: 'المراوغة' },
  lowPass: { en: 'Low Pass', ar: 'التمرير القصير' },
  loftedPass: { en: 'Lofted Pass', ar: 'التمرير الطويل' },
  finishing: { en: 'Finishing', ar: 'الإنهاء والتسديد' },
  heading: { en: 'Heading', ar: 'الرأسيات' },
  speed: { en: 'Speed', ar: 'السرعة' },
  acceleration: { en: 'Acceleration', ar: 'التسارع' },
  kickingPower: { en: 'Kicking Power', ar: 'قوة التسديد' },
  jump: { en: 'Jump', ar: 'القفز والارتقاء' },
  physicalContact: { en: 'Physical Contact', ar: 'الالتحام البدني' },
  balance: { en: 'Balance', ar: 'التوازن' },
  stamina: { en: 'Stamina', ar: 'اللياقة البدنية' },
  defensiveAwareness: { en: 'Defensive Awareness', ar: 'الوعي الدفاعي' },
  ballWinning: { en: 'Ball Winning', ar: 'افتكاك الكرة' },
  aggression: { en: 'Aggression', ar: 'الشراسة' },
  gkAwareness: { en: 'GK Awareness', ar: 'تمركز الحارس' },
  gkCatching: { en: 'GK Catching', ar: 'الإمساك بالكرة' },
  gkClearing: { en: 'GK Clearing', ar: 'التشتيت' },
  gkReflexes: { en: 'GK Reflexes', ar: 'ردة الفعل' },
  gkReach: { en: 'GK Reach', ar: 'مدى الوصول' }
};

export default function PlayerRatingModal({ isOpen, onClose, matchId, players, isAr }: PlayerRatingModalProps) {
  const { user } = useAuth();
  const { activeCommunityId, activeCommunity } = useCommunity();
  
  // Store detailed ability ratings per player: { [playerId]: { offensiveAwareness: 75, ... } }
  const [abilityRatings, setAbilityRatings] = useState<Record<string, Partial<PlayerAttributes>>>({});
  // Store 1-5 star ratings per player: { [playerId]: 1-5 }
  const [starRatings, setStarRatings] = useState<Record<string, number>>({});
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [activeTabByPlayer, setActiveTabByPlayer] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── Inline star rating picker ──
  const StarPicker = ({ playerId, value, onChange }: { playerId: string; value: number; onChange: (s: number) => void }) => {
    const [hovered, setHovered] = React.useState(0);
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="text-2xl transition-transform hover:scale-125 focus:outline-none"
          >
            <span className={(hovered || value) >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>
              ★
            </span>
          </button>
        ))}
        {value > 0 && (
          <span className="text-xs font-black text-amber-500 ml-1">{value}/5</span>
        )}
      </div>
    );
  };


  useEffect(() => {
    if (!isOpen || !user || !activeCommunityId || !matchId) return;
    setIsLoading(true);

    const loadRatings = async () => {
      try {
        const ratingDocRef = doc(db, 'communities', activeCommunityId, 'matches', matchId, 'ratings', user.uid);
        const snap = await getDoc(ratingDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.abilityRatings) {
            setAbilityRatings(data.abilityRatings);
          } else if (data.ratings) {
            // Convert legacy 1-10 ratings to baseline attributes (e.g. 8/10 -> ~80)
            const converted: Record<string, Partial<PlayerAttributes>> = {};
            for (const [pid, val] of Object.entries(data.ratings)) {
              const numVal = typeof val === 'number' ? val : 7;
              const scaled = Math.min(99, Math.max(40, numVal * 10));
              converted[pid] = {
                offensiveAwareness: scaled,
                ballControl: scaled,
                dribbling: scaled,
                lowPass: scaled,
                loftedPass: scaled,
                finishing: scaled,
                speed: scaled,
                acceleration: scaled,
                stamina: scaled,
                defensiveAwareness: scaled,
                ballWinning: scaled
              };
            }
            setAbilityRatings(converted);
          }
          // Load star ratings
          if (data.starRatings) {
            setStarRatings(data.starRatings);
          }
        }
      } catch (err) {
        console.error('Failed to load existing ratings', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRatings();
  }, [isOpen, user, activeCommunityId, matchId]);

  const handleAbilityChange = (playerId: string, abilityKey: keyof PlayerAttributes, value: number) => {
    setAbilityRatings(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [abilityKey]: value
      }
    }));
  };

  const getPlayerOverallAverage = (playerId: string) => {
    const attrs = abilityRatings[playerId];
    if (!attrs) return 0;
    const values = Object.values(attrs).filter(v => typeof v === 'number' && v > 0) as number[];
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  };

  const handleSubmit = async () => {
    if (!user || !activeCommunityId) return;
    setIsSubmitting(true);
    try {
      const currentRaterProfile = players.find(p => p.uid === user.uid);
      const raterDisplayName = currentRaterProfile?.fullName || currentRaterProfile?.cardName || user.displayName || (user as any).fullName || 'Player';

      // 1. Save per-match ratings for this rater
      const ratingDocRef = doc(db, 'communities', activeCommunityId, 'matches', matchId, 'ratings', user.uid);
      await setDoc(ratingDocRef, {
        ratedBy: user.uid,
        raterName: raterDisplayName,
        abilityRatings,
        starRatings,
        timestamp: serverTimestamp()
      });

      // 1b. Save individual star ratings to playerMatchRatings and aggregate rolling average
      for (const [targetPlayerId, stars] of Object.entries(starRatings)) {
        if (!stars || stars < 1) continue;
        try {
          // Save individual star rating
          const starRef = doc(db, 'communities', activeCommunityId, 'playerMatchRatings', `${matchId}_${user.uid}_${targetPlayerId}`);
          await setDoc(starRef, {
            matchId,
            raterUid: user.uid,
            raterName: raterDisplayName,
            ratedUid: targetPlayerId,
            stars,
            timestamp: serverTimestamp()
          });

          // Aggregate rolling average star rating for this player
          const allStarsQuery = query(
            collection(db, 'communities', activeCommunityId, 'playerMatchRatings'),
            where('ratedUid', '==', targetPlayerId)
          );
          const allStarsSnap = await getDocs(allStarsQuery);
          const allStarValues = allStarsSnap.docs.map(d => d.data().stars as number).filter(s => s >= 1 && s <= 5);
          if (allStarValues.length > 0) {
            const avgStars = allStarValues.reduce((a, b) => a + b, 0) / allStarValues.length;
            const roundedAvg = Math.round(avgStars * 10) / 10;
            const targetPlayer = players.find(p => p.uid === targetPlayerId);
            if (targetPlayer) {
              // Update global player doc
              const playerRef = doc(db, 'players', targetPlayerId);
              await setDoc(playerRef, {
                matchStarRatingAvg: roundedAvg,
                matchStarRatingCount: allStarValues.length
              }, { merge: true });
              // Update community player doc too
              const commPlayerRef = doc(db, `communities/${activeCommunityId}/players`, targetPlayerId);
              await setDoc(commPlayerRef, {
                matchStarRatingAvg: roundedAvg,
                matchStarRatingCount: allStarValues.length
              }, { merge: true });
            }
          }
        } catch (starErr) {
          console.warn('Could not save star rating:', starErr);
        }
      }

      // 2. Save individual peer rating records & aggregate Peer Rating Proposals in editRequests
      for (const [targetPlayerId, attrs] of Object.entries(abilityRatings)) {
        if (!attrs || Object.keys(attrs).length === 0) continue;
        
        const targetPlayer = players.find(p => p.uid === targetPlayerId);
        const avgOverall = getPlayerOverallAverage(targetPlayerId);

        // Save detailed peer record
        const peerRef = doc(db, 'communities', activeCommunityId, 'playerRatings', `${user.uid}_${targetPlayerId}`);
        await setDoc(peerRef, {
          raterUid: user.uid,
          raterName: raterDisplayName,
          ratedUid: targetPlayerId,
          rating: avgOverall,
          attributes: attrs,
          matchId,
          timestamp: serverTimestamp()
        });

        // Fetch all peer ratings for targetPlayerId to build aggregated average proposal for Admin
        try {
          const peerQuery = query(collection(db, 'communities', activeCommunityId, 'playerRatings'), where('ratedUid', '==', targetPlayerId));
          const peerSnaps = await getDocs(peerQuery);
          
          const aggregatedAttrs: Record<string, number> = {};
          const attrCounts: Record<string, number> = {};
          const raterNamesSet = new Set<string>();

          peerSnaps.forEach(docSnap => {
            const d = docSnap.data();
            if (d.raterName) raterNamesSet.add(d.raterName);
            const pattrs = d.attributes || {};
            for (const [key, val] of Object.entries(pattrs)) {
              if (typeof val === 'number' && val >= 40 && val <= 99) {
                aggregatedAttrs[key] = (aggregatedAttrs[key] || 0) + val;
                attrCounts[key] = (attrCounts[key] || 0) + 1;
              }
            }
          });

          // Calculate final averages
          const finalAvgAttrs: any = {};
          for (const key of Object.keys(aggregatedAttrs)) {
            finalAvgAttrs[key] = Math.round(aggregatedAttrs[key] / attrCounts[key]);
          }

          if (Object.keys(finalAvgAttrs).length > 0 && targetPlayer) {
            // Create/Update Peer Rating Proposal inside editRequests (Visible to Admin only!)
            const proposalDocRef = doc(db, 'communities', activeCommunityId, 'editRequests', `peer_proposal_${targetPlayerId}`);
            await setDoc(proposalDocRef, {
              playerId: targetPlayerId,
              playerName: targetPlayer.cardName || targetPlayer.fullName || 'Player',
              cardName: targetPlayer.cardName || '',
              photoUrl: targetPlayer.photoUrl || targetPlayer.googlePic || '',
              requestedAt: new Date().toISOString(),
              status: 'pending',
              source: 'peer_ratings',
              raterCount: peerSnaps.size,
              raterNames: Array.from(raterNamesSet), // Strictly for admin review modal!
              attributes: finalAvgAttrs,
              profileData: {
                fullName: targetPlayer.fullName,
                cardName: targetPlayer.cardName,
                primaryPosition: targetPlayer.primaryPosition || 'CMF'
              }
            }, { merge: true });

            try {
              const ownerUid = "G8vV7jTvd0VUeRlohrGFyARhiiw1";
              let adminUidToNotify = activeCommunity?.adminUid;
              if (!adminUidToNotify && activeCommunityId) {
                try {
                  const cSnap = await getDoc(doc(db, "communities", activeCommunityId));
                  if (cSnap.exists()) adminUidToNotify = cSnap.data()?.adminUid;
                } catch (e) {}
              }

              if (adminUidToNotify) {
                await setDoc(doc(collection(db, `users/${adminUidToNotify}/notifications`), `peer_rate_adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
                  type: 'stats',
                  title: isAr ? 'إقتراح تقييم قدرات من اللاعبين' : 'New Peer Ability Rating Suggestion',
                  body: isAr ? `تم تحديث متوسط تقييمات القدرات للاعب ${targetPlayer.fullName || 'لاعب'}. يرجى المراجعة.` : `Peer ability ratings updated for ${targetPlayer.fullName || 'player'}. Please review.`,
                  read: false,
                  createdAt: serverTimestamp(),
                  link: '/admin?tab=edits'
                });
              }
              if (adminUidToNotify !== ownerUid) {
                await setDoc(doc(collection(db, `users/${ownerUid}/notifications`), `peer_rate_own_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
                  type: 'stats',
                  title: isAr ? 'إقتراح تقييم قدرات من اللاعبين' : 'New Peer Ability Rating Suggestion',
                  body: isAr ? `تم تحديث متوسط تقييمات القدرات للاعب ${targetPlayer.fullName || 'لاعب'}.` : `Peer ability ratings updated for ${targetPlayer.fullName || 'player'}.`,
                  read: false,
                  createdAt: serverTimestamp(),
                  link: '/admin?tab=edits'
                });
              }

              if (user && user.uid !== targetPlayerId) {
                await setDoc(doc(collection(db, `users/${targetPlayerId}/notifications`), `peer_rate_usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
                  type: 'stats',
                  title: isAr ? '💡 تقييم قدرات جديد لملفك' : '💡 New Ability Ratings Suggestion',
                  body: isAr ? `قام زملائك بتقييم واقتراح طاقات لقدراتك في المجتمع. سيتم مراجعة التقييم من قبل المسؤول.` : `Peers submitted ability rating suggestions for your profile. The community admin will review them soon.`,
                  read: false,
                  createdAt: serverTimestamp(),
                  link: '/profile?uid=' + targetPlayerId
                });
              }
            } catch (notifErr) {
              console.warn("Peer rating notification warning:", notifErr);
            }
          }
        } catch (proposalErr) {
          console.warn('Could not aggregate peer rating proposal:', proposalErr);
        }
      }

      setSubmitted(true);
      toast.success(isAr ? 'تم إرسال تقييمات القدرات بنجاح وإرسالها لمشرف المجتمع للاعتماد!' : 'Ability ratings submitted to community admin for approval!');
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2200);
    } catch (err) {
      console.error('Failed to submit ability ratings', err);
      toast.error(isAr ? 'فشل في إرسال التقييمات' : 'Failed to submit ratings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const editablePlayers = players.filter(p => p.uid !== user?.uid);
  const ratedCount = Object.keys(abilityRatings).filter(pid => getPlayerOverallAverage(pid) > 0).length;
  const starRatedCount = Object.keys(starRatings).filter(pid => starRatings[pid] > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/80">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>⭐</span>
              {isAr ? 'تقييم قدرات ومؤهلات اللاعبين (40 - 99)' : 'Rate Teammates Abilities & Stats'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isAr
                ? `قيّم مهارات وقدرات زملائك بدقة. يتم تجميع التقييمات وعرض المتوسط على مسؤول المجتمع للموافقة عليه دون كشف هويتك كمقيّم لمنع أي إحراج.`
                : `Rate detailed attributes. Averages are proposed to your community admin for review while keeping your rater identity strictly anonymous.`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl bg-white dark:bg-slate-800 shadow-sm">
            ✕
          </button>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : submitted ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-lg">✅</div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {isAr ? 'تم إرسال تقييماتك للمشرف بنجاح!' : 'Ratings Submitted for Approval!'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
                {isAr ? 'شكراً لتعاونك! سيقوم مسؤول المجتمع بمراجعة واعتماد متوسط التقييمات العادل دون الكشف عن أسمائكم.' : 'Thank you! Your community admin will review and approve the fair average ratings.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {editablePlayers.map(p => {
                const avgOvr = getPlayerOverallAverage(p.uid);
                const isExpanded = expandedPlayerId === p.uid;
                const activeTab = activeTabByPlayer[p.uid] || 'offensive';
                const currentAttrs = abilityRatings[p.uid] || {};

                return (
                  <motion.div
                    key={p.uid}
                    layout
                    className={`bg-slate-50 dark:bg-slate-800/60 rounded-2xl border transition-all ${
                      isExpanded
                        ? 'border-emerald-500 shadow-lg dark:border-emerald-500/80 bg-white dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-amber-400/60'
                    }`}
                  >
                    {/* Player Summary Row */}
                    <div
                      onClick={() => setExpandedPlayerId(isExpanded ? null : p.uid)}
                      className="p-4 flex items-center gap-4 cursor-pointer select-none"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 shadow-sm border border-slate-300 dark:border-slate-600">
                        {p.photoUrl || p.googlePic ? (
                          <Image src={p.photoUrl || p.googlePic} alt="" width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-lg">
                            {(p.cardName || p.fullName || '?').charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-base truncate">{p.cardName || p.fullName}</h4>
                          <span className="text-xs font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                            {p.primaryPosition || 'CMF'}
                          </span>
                        </div>
                        {/* Star Rating Row */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold shrink-0">
                            {isAr ? 'أداء في المباراة:' : 'Match Perf:'}
                          </span>
                          <StarPicker
                            playerId={p.uid}
                            value={starRatings[p.uid] || 0}
                            onChange={(s) => setStarRatings(prev => ({ ...prev, [p.uid]: s }))}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {isExpanded
                            ? (isAr ? 'حرك المؤشر لتقييم كل مهارة وقدرة (40 - 99)' : 'Drag sliders to rate specific abilities (40 - 99)')
                            : (isAr ? 'انقر لفتح وتقييم القدرات التفصيلية من الوعي الهجومي حتى حراسة المرمى' : 'Click to expand and rate detailed abilities')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {avgOvr > 0 && (
                          <div className="text-end">
                            <div className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'متوسط تقييمك' : 'Your Avg'}</div>
                            <div className="text-2xl font-black text-emerald-500">{avgOvr}</div>
                          </div>
                        )}
                        <div className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Ability Ratings Pane */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-200 dark:border-slate-700/80 p-5 bg-slate-100/60 dark:bg-slate-900/60 rounded-b-2xl"
                        >
                          {/* Category Tabs */}
                          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                            {ABILITY_CATEGORIES.map(cat => {
                              const Icon = cat.icon;
                              const isActive = activeTab === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setActiveTabByPlayer(prev => ({ ...prev, [p.uid]: cat.id }));
                                  }}
                                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                                    isActive
                                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Sliders for active category */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ABILITY_CATEGORIES.find(c => c.id === activeTab)?.keys.map(key => {
                              const val = (currentAttrs[key] as number) || (p.attributes?.[key] as number) || 65;
                              const label = ABILITY_NAMES[key]?.[isAr ? 'ar' : 'en'] || key;

                              return (
                                <div key={key} className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
                                    <span className="text-base font-black text-emerald-500">{val}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="40"
                                    max="99"
                                    value={val}
                                    onChange={e => handleAbilityChange(p.uid, key, Number(e.target.value))}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && !isLoading && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
              <div>{isAr ? `تم تقييم ${ratedCount} لاعبين بالطاقات` : `${ratedCount} players rated (abilities)`}</div>
              {starRatedCount > 0 && (
                <div className="text-amber-500 font-bold">{isAr ? `${starRatedCount} لاعبين تم تقييمهم بنجوم الأداء ⭐` : `${starRatedCount} players rated with ⭐ stars`}</div>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || ratedCount === 0}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{isAr ? 'إرسال التقييمات للاعتماد' : 'Submit Ratings for Approval'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

