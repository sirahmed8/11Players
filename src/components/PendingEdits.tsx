"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc, writeBatch, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useLocale } from "@/components/ThemeProvider";
import { useCommunity } from "@/contexts/CommunityContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import ConfirmModal from "@/components/ConfirmModal";
import { getAllPlayerCommunities } from "@/lib/playerUtils";
import { Edit3, Check, X, Shield, Brain, CircleDot, Wand2, Footprints, Plane, Target, Wind, Rocket, Zap, ArrowUpCircle, Dumbbell, Scale, HeartPulse, Axe, Hand, Users, AlertCircle, ArrowRight } from "lucide-react";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import type { PlayerAttributes, PESPosition } from "@/types";

const ATTRIBUTE_KEYS: (keyof PlayerAttributes)[] = [
  'offensiveAwareness', 'ballControl', 'dribbling', 'lowPass', 'loftedPass',
  'finishing', 'heading', 'speed', 'acceleration', 'kickingPower',
  'jump', 'physicalContact', 'balance', 'stamina',
  'defensiveAwareness', 'ballWinning', 'aggression',
  'gkAwareness', 'gkCatching', 'gkClearing', 'gkReflexes', 'gkReach'
];

const ATTRIBUTE_LABELS: Record<keyof PlayerAttributes, { en: string; ar: string }> = {
  offensiveAwareness: { en: 'Offensive Awareness', ar: 'الوعي الهجومي' },
  ballControl: { en: 'Ball Control', ar: 'التحكم بالكرة' },
  dribbling: { en: 'Dribbling', ar: 'المراوغة' },
  lowPass: { en: 'Low Pass', ar: 'التمرير القصير' },
  loftedPass: { en: 'Lofted Pass', ar: 'التمرير الطويل' },
  finishing: { en: 'Finishing', ar: 'الإنهاء والتسديد' },
  heading: { en: 'Heading', ar: 'الرأسيات' },
  speed: { en: 'Speed', ar: 'السرعة القصوى' },
  acceleration: { en: 'Acceleration', ar: 'التسارع والانطلاق' },
  kickingPower: { en: 'Kicking Power', ar: 'قوة التسديد' },
  jump: { en: 'Jump', ar: 'القفز والارتقاء' },
  physicalContact: { en: 'Physical Contact', ar: 'القوة والالتحام البدني' },
  balance: { en: 'Balance', ar: 'التوازن الجسدي' },
  stamina: { en: 'Stamina', ar: 'اللياقة البدنية' },
  defensiveAwareness: { en: 'Defensive Awareness', ar: 'الوعي الدفاعي' },
  ballWinning: { en: 'Ball Winning', ar: 'افتكاك الكرة' },
  aggression: { en: 'Aggression', ar: 'الشراسة الدفاعية' },
  gkAwareness: { en: 'GK Awareness', ar: 'تمركز حارس المرمى' },
  gkCatching: { en: 'GK Catching', ar: 'الإمساك بالكرة' },
  gkClearing: { en: 'GK Clearing', ar: 'تشتيت الكرة' },
  gkReflexes: { en: 'GK Reflexes', ar: 'ردة الفعل للمرمى' },
  gkReach: { en: 'GK Reach', ar: 'مدى الوصول والارتماء' }
};

const POSITIONS: PESPosition[] = ['CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'DMF', 'RMF', 'LMF', 'CB', 'RB', 'LB', 'GK'];
const PLAY_STYLES = ['Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-Lying Forward', 'Dummy Runner', 'Creative Playmaker', 'Hole Player', 'Classic No. 10', 'Prolific Winger', 'Roaming Flank', 'Cross Specialist', 'Orchestrator', 'Box-to-Box', 'The Destroyer', 'Anchor Man', 'Build Up', 'Extra Frontman', 'Offensive Full-back', 'Defensive Full-back', 'Full-back Finisher', 'Offensive Goalkeeper', 'Defensive Goalkeeper'];

interface PendingEditsProps {
  filterPlayerId?: string;    // If set, only shows edits for this player
  inlineMode?: boolean;       // If true, renders inline (no trigger button)
}

export default function PendingEdits({ filterPlayerId, inlineMode }: PendingEditsProps = {}) {
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const { isOwner } = useAuth();
  const isAr = locale === "ar";
  const [edits, setEdits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(!!inlineMode);

  const [reviewingEdit, setReviewingEdit] = useState<any | null>(null);
  const [currentPlayerData, setCurrentPlayerData] = useState<any | null>(null);
  const [reviewFormData, setReviewFormData] = useState<any>({});
  const [activeReviewTab, setActiveReviewTab] = useState<'profile' | 'attributes' | 'stats'>('attributes');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    let communityEdits: any[] = [];
    let globalEdits: any[] = [];
    
    const merge = () => {
      const merged = [...communityEdits, ...globalEdits];
      // Remove duplicates by ID
      let unique = merged.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
      // Filter to specific player if in per-player mode
      if (filterPlayerId) {
        unique = unique.filter(e => e.playerId === filterPlayerId);
      }
      setEdits(unique);
      setLoading(false);
    };

    if (activeCommunityId) {
      const q = query(collection(db, `communities/${activeCommunityId}/editRequests`), where("status", "==", "pending"));
      unsubs.push(onSnapshot(q, (snapshot) => {
        communityEdits = snapshot.docs.map(d => ({ id: d.id, _collection: `communities/${activeCommunityId}/editRequests`, ...d.data() }));
        merge();
      }));
    }

    if (isOwner) {
      const q2 = query(collection(db, 'editRequests'), where("status", "==", "pending"));
      unsubs.push(onSnapshot(q2, (snapshot) => {
        globalEdits = snapshot.docs.map(d => ({ id: d.id, _collection: 'editRequests', ...d.data() }));
        merge();
      }));
    }

    if (!activeCommunityId && !isOwner) {
      setLoading(false);
    }

    return () => unsubs.forEach(u => u());
  }, [activeCommunityId, isOwner, filterPlayerId]);

  const handleOpenReview = async (edit: any) => {
    setReviewingEdit(edit);
    
    // Fetch current player database profile to display exact Before vs. After diff
    let fetchedCurrent: any = {};
    try {
      if (edit.playerId) {
        const snap = await getDoc(doc(db, "players", edit.playerId));
        if (snap.exists()) {
          fetchedCurrent = snap.data();
        }
      }
    } catch (err) {
      console.warn("Could not fetch current player data for diff:", err);
    }
    setCurrentPlayerData(fetchedCurrent);

    const initialAttributes = {
      ...(fetchedCurrent.attributes || {}),
      ...(edit.attributes || edit.profileData?.attributes || {})
    };

    setReviewFormData({
      fullName: edit.profileData?.fullName || edit.playerName || fetchedCurrent.fullName || "",
      cardName: edit.profileData?.cardName || edit.cardName || fetchedCurrent.cardName || "",
      primaryPosition: edit.profileData?.primaryPosition || fetchedCurrent.primaryPosition || "CMF",
      secondaryPosition: edit.profileData?.secondaryPosition || fetchedCurrent.secondaryPosition || "",
      tertiaryPosition: edit.profileData?.tertiaryPosition || fetchedCurrent.tertiaryPosition || "",
      playStyle: edit.profileData?.playStyle || fetchedCurrent.playStyle || "",
      height: edit.profileData?.height || fetchedCurrent.height || 175,
      weight: edit.profileData?.weight || fetchedCurrent.weight || 70,
      profileData: { ...(fetchedCurrent || {}), ...(edit.profileData || {}) },
      attributes: initialAttributes,
      stats: edit.stats || edit.profileData?.stats || fetchedCurrent.stats || {}
    });

    if (edit.attributes || edit.source === 'peer_ratings') {
      setActiveReviewTab('attributes');
    } else {
      setActiveReviewTab('profile');
    }
  };

  // Dynamically calculate predicted overall based on current review sliders (`see what it will be`)
  const predictedOverall = useMemo(() => {
    if (!reviewFormData.attributes) {
      return currentPlayerData?.overallRating || 70;
    }
    return calculateRealisticOverall(
      reviewFormData.attributes,
      reviewFormData.primaryPosition as PESPosition,
      reviewFormData.playStyle || reviewFormData.profileData?.playStyle || currentPlayerData?.playStyle || ""
    );
  }, [reviewFormData.attributes, reviewFormData.primaryPosition, reviewFormData.playStyle, reviewFormData.profileData?.playStyle, currentPlayerData]);

  const applyApproval = async (edit: any, modifiedData?: any) => {
    const collectionPath = edit._collection || (activeCommunityId ? `communities/${activeCommunityId}/editRequests` : 'editRequests');
    const editCommunityId = activeCommunityId || null;

    try {
      const playerRef = doc(db, "players", edit.playerId);
      const playerSnap = await getDoc(playerRef);
      const playerData = playerSnap.exists() ? playerSnap.data() : {};
      
      const targetProfileData = modifiedData?.profileData || edit.profileData || {};
      const targetAttributes = modifiedData?.attributes || edit.attributes;
      const targetStats = modifiedData?.stats || edit.stats;

      const pos = modifiedData?.primaryPosition || targetProfileData.primaryPosition || playerData.primaryPosition || "CMF";
      const secPos = modifiedData?.secondaryPosition !== undefined ? modifiedData.secondaryPosition : (targetProfileData.secondaryPosition || playerData.secondaryPosition || "");
      const tertPos = modifiedData?.tertiaryPosition !== undefined ? modifiedData.tertiaryPosition : (targetProfileData.tertiaryPosition || playerData.tertiaryPosition || "");
      const style = modifiedData?.playStyle !== undefined ? modifiedData.playStyle : (targetProfileData.playStyle || playerData.playStyle || "");

      const updateDataGlobal: any = { ...targetProfileData, primaryPosition: pos, secondaryPosition: secPos, tertiaryPosition: tertPos, playStyle: style };
      const updateDataComm: any = { ...targetProfileData, primaryPosition: pos, secondaryPosition: secPos, tertiaryPosition: tertPos, playStyle: style };

      if (targetAttributes) {
        const mergedAttr = { ...(playerData.attributes || {}), ...targetAttributes };
        const newOverall = calculateRealisticOverall(mergedAttr, pos, style);
        updateDataGlobal.attributes = mergedAttr;
        updateDataGlobal.approvedAttributes = mergedAttr;
        updateDataGlobal.overallRating = newOverall;
        updateDataComm.attributes = mergedAttr;
        updateDataComm.approvedAttributes = mergedAttr;
        updateDataComm.overallRating = newOverall;
      } else if (Object.keys(targetProfileData).length > 0 || modifiedData?.playStyle !== undefined || modifiedData?.primaryPosition !== undefined) {
        const newOverall = calculateRealisticOverall(playerData.attributes || {}, pos, style);
        updateDataGlobal.overallRating = newOverall;
        updateDataComm.overallRating = newOverall;
      }

      const resolvedCommId = editCommunityId || null;
      if (targetStats && resolvedCommId) {
        updateDataGlobal[`communityStats.${resolvedCommId}`] = targetStats;
        updateDataComm.stats = targetStats;
      }
      
      const batch = writeBatch(db);
      if (Object.keys(updateDataGlobal).length > 0) {
        batch.set(playerRef, updateDataGlobal, { merge: true });
      }
      if (Object.keys(updateDataComm).length > 0) {
        const commIds = getAllPlayerCommunities(playerData, resolvedCommId);
        for (const commId of commIds) {
          const commPlayerRef = doc(db, `communities/${commId}/players`, edit.playerId);
          batch.set(commPlayerRef, updateDataComm, { merge: true });
        }
      }
      batch.delete(doc(db, collectionPath, edit.id));
      await batch.commit();

      // Notify player about approval without disclosing rater identities if peer rated
      try {
        const titleText = edit.source === 'peer_ratings'
          ? (isAr ? 'تم اعتماد تقييم الأداء والقدرات الجديد!' : 'New Peer Ability Ratings Approved!')
          : (isAr ? 'تمت الموافقة على تعديلاتك!' : 'Profile Edits Approved!');
        const bodyText = edit.source === 'peer_ratings'
          ? (isAr ? `قام مسؤول المجتمع بمراجعة واعتماد التقييمات الجديدة لقدراتك بنجاح. تقييمك العام الحالي: ${updateDataGlobal.overallRating || 'مُحدّث'}.` : `Your community admin approved new peer performance ability ratings. New OVR: ${updateDataGlobal.overallRating || 'Updated'}.`)
          : (isAr ? 'تمت مراجعة طلب تعديل ملفك الشخصي وقدراته والموافقة عليه بنجاح.' : 'Your requested profile and attribute updates have been approved and applied.');

        await setDoc(doc(collection(db, `users/${edit.playerId}/notifications`)), {
          type: 'stats',
          title: titleText,
          body: bodyText,
          read: false,
          createdAt: serverTimestamp(),
          link: '/profile?uid=' + edit.playerId
        });
      } catch (err) {
        console.warn("Player notification send warning:", err);
      }

      toast.success(isAr ? "تم اعتماد التعديلات وتطبيق التقييمات والقدرات بنجاح!" : "Edits approved and player abilities updated successfully!");
      setReviewingEdit(null);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "خطأ في الموافقة على التعديل." : "Error approving edit.");
    }
  };

  const handleApprove = (edit: any) => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "موافقة على التعديل" : "Approve Edit",
      message: isAr ? "هل أنت متأكد من الموافقة وتطبيق هذه التعديلات والتقييمات؟" : "Are you sure you want to approve and apply these profile edits/ratings?",
      onConfirm: () => applyApproval(edit)
    });
  };

  const handleApproveAll = () => {
    if (edits.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? "الموافقة على الكل" : "Approve All",
      message: isAr ? `هل أنت متأكد من الموافقة على جميع الاقتراحات (${edits.length}) دفعة واحدة؟` : `Are you sure you want to approve all ${edits.length} suggestions at once?`,
      onConfirm: async () => {
        try {
          // Process sequentially to avoid overlapping batches and issues
          for (const edit of edits) {
            await applyApproval(edit);
          }
          setIsModalOpen(false);
          toast.success(isAr ? "تم اعتماد جميع التعديلات بنجاح!" : "All edits approved successfully!");
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "حدث خطأ أثناء الموافقة على البعض." : "Error occurred while approving some edits.");
        }
      }
    });
  };

  const handleReject = (edit: any) => {
    const collPath = edit._collection || (activeCommunityId ? `communities/${activeCommunityId}/editRequests` : 'editRequests');
    setConfirmModal({
      isOpen: true,
      title: isAr ? "رفض التعديل" : "Reject Edit",
      message: isAr ? "هل أنت متأكد من رفض هذا التعديل؟" : "Are you sure you want to reject this edit?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, collPath, edit.id));
          if (edit.source !== 'peer_ratings') {
            try {
              await setDoc(doc(collection(db, `users/${edit.playerId}/notifications`)), {
                type: 'system',
                title: isAr ? 'تم رفض التعديل - تقديم التماس؟' : 'Edit Rejected - Want to Appeal?',
                body: isAr ? 'لم تتم الموافقة على تعديلاتك. هل ترغب في تقديم التماس ومراجعة طلبك مع إدارة المجتمع؟' : 'Your requested profile edit was not approved. Want to make an appeal with community management?',
                read: false,
                createdAt: serverTimestamp(),
                link: '/support'
              });
            } catch (e) {
              console.warn(e);
            }
          }
          toast.success(isAr ? "تم رفض التعديل." : "Edit rejected.");
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "خطأ في رفض التعديل." : "Error rejecting edit.");
        }
      }
    });
  };

  if (loading) return null;

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full relative py-3 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-amber-200/60 dark:border-amber-500/20"
      >
        <AlertCircle className="w-4 h-4" />
        <span>{isAr ? "مراجعة الاقتراحات والتقييمات" : "Review Suggestions & Edits"}</span>
        {edits.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
            {edits.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                <h3 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="text-amber-500 text-2xl">⚠️</span> {isAr ? "طلبات ومقترحات التقييم" : "Pending Profile Edits"} ({edits.length})
                </h3>
                <div className="flex items-center gap-3">
                  {edits.length > 0 && (
                    <button
                      onClick={handleApproveAll}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {isAr ? "الموافقة على الكل" : "Approve All"}
                    </button>
                  )}
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {edits.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? "لا توجد اقتراحات حالياً." : "No pending suggestions right now."}
                  </div>
                ) : (
                  <AnimatePresence>
                    {edits.map(edit => (
                      <motion.div
                        key={edit.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:border-amber-400/60 transition-all"
                        dir={isAr ? 'rtl' : 'ltr'}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-lg text-slate-900 dark:text-white">
                              {edit.playerName || edit.profileData?.fullName || "Player"}
                            </span>
                            {edit.profileData?.cardName && (
                              <span className="text-xs bg-amber-500/20 text-amber-500 font-black px-2 py-0.5 rounded-lg">
                                {edit.profileData.cardName}
                              </span>
                            )}
                            {edit.source === 'peer_ratings' ? (
                              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 border border-purple-300 dark:border-purple-700">
                                <Users className="w-3.5 h-3.5" />
                                {isAr ? `متوسط تقييم الزملاء (${edit.raterCount || 1} مقيّم)` : `Peer Rating Avg (${edit.raterCount || 1} raters)`}
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                                {isAr ? "طلب تعديل شخصي" : "Self Profile Edit"}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 items-center">
                            <span>{isAr ? "تاريخ التقديم:" : "Requested:"} {new Date(edit.requestedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                            {edit.source === 'peer_ratings' && edit.raterNames && edit.raterNames.length > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                🔒 {isAr ? "المقيّمون (للمسؤول فقط):" : "Raters (Admin View Only):"} {edit.raterNames.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
                          <button
                            onClick={() => handleOpenReview(edit)}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                            {isAr ? "مراجعة وتعديل ومقارنة" : "Review, Diff & Edit"}
                          </button>
                          <button
                            onClick={() => handleApprove(edit)}
                            className="px-4 py-2.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-500 transition-all shadow-md flex items-center gap-2 text-sm"
                          >
                            <Check className="w-4 h-4" />
                            {isAr ? "اعتماد مباشر" : "Quick Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(edit)}
                            className="px-3.5 py-2.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-all flex items-center gap-1.5 text-sm"
                          >
                            <X className="w-4 h-4" />
                            {isAr ? "رفض" : "Reject"}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Before vs. After Diff Inspector & Interactive Slider Dashboard */}
      <AnimatePresence>
        {reviewingEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 md:p-8 shadow-2xl max-h-[92vh] flex flex-col my-auto"
            >
              {/* Header with OVR Prediction (`see what it will be`) */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
                <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Edit3 className="w-6 h-6 text-amber-500" />
                    {isAr ? "مراجعة وتعديل التقييمات والقدرات (قارن واعتمد)" : "Review & Edit Player Ability Ratings"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? "يمكنك تعديل أي رقم أو قدرة قبل الاعتماد. يتم حفظ التقييمات في قدرات اللاعب مع إخفاء أسماء المقيّمين."
                      : "You can tweak any slider before approving. Rater names remain strictly anonymous to the player."}
                  </p>
                </div>

                {/* Real-time OVR Badge (`see what it will be`) */}
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner">
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">{isAr ? "التقييم الحالي" : "Current OVR"}</div>
                    <div className="text-xl font-black text-slate-600 dark:text-slate-300">{currentPlayerData?.overallRating || 70}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-500 rtl:rotate-180" />
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-emerald-500">{isAr ? "بعد الاعتماد" : "New OVR"}</div>
                    <div className="text-2xl font-black text-emerald-500 drop-shadow-sm animate-pulse">{predictedOverall}</div>
                  </div>
                </div>
              </div>

              {/* Rater Visibility Notice (`Visible to Community Admins to prevent bullying`) */}
              {reviewingEdit.source === 'peer_ratings' && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex items-start gap-3 text-sm">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-purple-900 dark:text-purple-200 block">
                      {isAr ? "حماية خصوصية التقييم (سرية للمقيّم، مكشوفة للمشرف):" : "Rating Anonymity Protection (Anonymous to Player, Visible to Admin):"}
                    </span>
                    <span className="text-purple-700 dark:text-purple-300 text-xs leading-relaxed">
                      {isAr
                        ? `قام ${reviewingEdit.raterCount || 1} لاعب بتقديم هذا التقييم. أسماء المقيّمين: [ ${reviewingEdit.raterNames?.join(', ') || 'زملاء'} ]. عند الموافقة سيتم تحديث قدرات اللاعب فقط ولن تظهر أسماء المقيّمين له لمنع أي حساسية أو تنمر.`
                        : `Submitted by ${reviewingEdit.raterCount || 1} peers. Raters: [ ${reviewingEdit.raterNames?.join(', ') || 'Peers'} ]. Once approved, only the attributes change; rater identities remain strictly confidential from the player.`}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveReviewTab('attributes')}
                  className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all shrink-0 ${
                    activeReviewTab === 'attributes'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  <span>{isAr ? "قدرات ومؤهلات اللاعب (22 مهارة)" : "Player Attributes & Abilities (22 Stats)"}</span>
                </button>

                <button
                  onClick={() => setActiveReviewTab('profile')}
                  className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all shrink-0 ${
                    activeReviewTab === 'profile'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{isAr ? "البيانات الأساسية والمقارنة" : "Profile Details Diff"}</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {activeReviewTab === 'attributes' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {isAr ? "قارن بين التقييم الحالي في قاعدة البيانات والتقييم المقترح، وحرك المؤشر لتعديل أي رقم:" : "Compare current vs proposed ratings, drag sliders to customize before approval:"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ATTRIBUTE_KEYS.map((key) => {
                        const oldVal = currentPlayerData?.attributes?.[key] ?? 60;
                        const newVal = reviewFormData.attributes?.[key] ?? oldVal;
                        const diff = newVal - oldVal;

                        return (
                          <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl transition-all hover:border-emerald-500/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                {ATTRIBUTE_LABELS[key]?.[isAr ? 'ar' : 'en'] || key}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-semibold" title="Current in database">
                                  {isAr ? `الحالي: ${oldVal}` : `Old: ${oldVal}`}
                                </span>
                                {diff !== 0 && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                    diff > 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                  }`}>
                                    {diff > 0 ? `+${diff}` : diff}
                                  </span>
                                )}
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 min-w-[2.5ch] text-end">
                                  {newVal}
                                </span>
                              </div>
                            </div>

                            <input
                              type="range"
                              min="40"
                              max="99"
                              value={newVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setReviewFormData((prev: any) => ({
                                  ...prev,
                                  attributes: {
                                    ...(prev.attributes || {}),
                                    [key]: val
                                  }
                                }));
                              }}
                              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeReviewTab === 'profile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? "الاسم الكامل (الحالي vs الجديد)" : "Full Name (Old vs New)"}
                      </label>
                      <div className="text-xs text-slate-400 mb-1">{isAr ? `الحالي في النظام:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.fullName || 'N/A'}</span></div>
                      <input
                        type="text"
                        value={reviewFormData.fullName}
                        onChange={e => setReviewFormData({
                          ...reviewFormData,
                          fullName: e.target.value,
                          profileData: { ...reviewFormData.profileData, fullName: e.target.value }
                        })}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? "اسم البطاقة (Card Name)" : "Card Name"}
                      </label>
                      <div className="text-xs text-slate-400 mb-1">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.cardName || 'N/A'}</span></div>
                      <input
                        type="text"
                        value={reviewFormData.cardName}
                        onChange={e => setReviewFormData({
                          ...reviewFormData,
                          cardName: e.target.value,
                          profileData: { ...reviewFormData.profileData, cardName: e.target.value }
                        })}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? "المركز الأساسي (Position)" : "Primary Position"}
                      </label>
                      <div className="text-xs text-slate-400 mb-1">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.primaryPosition || 'CMF'}</span></div>
                      <select
                        value={reviewFormData.primaryPosition}
                        onChange={e => setReviewFormData({
                          ...reviewFormData,
                          primaryPosition: e.target.value,
                          profileData: { ...reviewFormData.profileData, primaryPosition: e.target.value }
                        })}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        {POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                          {isAr ? "المركز الثانوي (Secondary)" : "Secondary Position"}
                        </label>
                        <div className="text-xs text-slate-400 mb-1">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.secondaryPosition || (isAr ? 'لا يوجد' : 'None')}</span></div>
                        <select
                          value={reviewFormData.secondaryPosition || ""}
                          onChange={e => setReviewFormData({
                            ...reviewFormData,
                            secondaryPosition: e.target.value,
                            profileData: { ...reviewFormData.profileData, secondaryPosition: e.target.value }
                          })}
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="">{isAr ? "بدون (None)" : "None"}</option>
                          {POSITIONS.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                          {isAr ? "المركز الثالث (Tertiary)" : "Tertiary Position"}
                        </label>
                        <div className="text-xs text-slate-400 mb-1">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.tertiaryPosition || (isAr ? 'لا يوجد' : 'None')}</span></div>
                        <select
                          value={reviewFormData.tertiaryPosition || ""}
                          onChange={e => setReviewFormData({
                            ...reviewFormData,
                            tertiaryPosition: e.target.value,
                            profileData: { ...reviewFormData.profileData, tertiaryPosition: e.target.value }
                          })}
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="">{isAr ? "بدون (None)" : "None"}</option>
                          {POSITIONS.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? "أسلوب اللعب (Play Style)" : "Play Style"}
                      </label>
                      <div className="text-xs text-slate-400 mb-1">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.playStyle || (isAr ? 'لا يوجد' : 'None')}</span></div>
                      <select
                        value={reviewFormData.playStyle || ""}
                        onChange={e => setReviewFormData({
                          ...reviewFormData,
                          playStyle: e.target.value,
                          profileData: { ...reviewFormData.profileData, playStyle: e.target.value }
                        })}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="">{isAr ? "بدون (None)" : "None"}</option>
                        {PLAY_STYLES.map(style => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? "الطول (سم) والوزن (كجم)" : "Height (cm) & Weight (kg)"}
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          placeholder="Height"
                          value={reviewFormData.height || 175}
                          onChange={e => setReviewFormData({
                            ...reviewFormData,
                            height: Number(e.target.value),
                            profileData: { ...reviewFormData.profileData, height: Number(e.target.value) }
                          })}
                          className="w-1/2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        />
                        <input
                          type="number"
                          placeholder="Weight"
                          value={reviewFormData.weight || 70}
                          onChange={e => setReviewFormData({
                            ...reviewFormData,
                            weight: Number(e.target.value),
                            profileData: { ...reviewFormData.profileData, weight: Number(e.target.value) }
                          })}
                          className="w-1/2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="flex flex-wrap justify-end gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setReviewingEdit(null)}
                  className="px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? "إلغاء ومغادرة" : "Cancel"}
                </button>
                <button
                  onClick={() => applyApproval(reviewingEdit, reviewFormData)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>{isAr ? `اعتماد وتطبيق التقييمات (OVR: ${predictedOverall})` : `Approve & Apply (OVR: ${predictedOverall})`}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}

