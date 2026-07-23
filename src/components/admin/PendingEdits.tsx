"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc, writeBatch, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useLocale } from "@/components/ui/ThemeProvider";
import { useCommunity } from "@/contexts/CommunityContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { getAllPlayerCommunities } from "@/lib/playerUtils";
import { Edit3, Check, X, Shield, Brain, Users, ArrowRight, ChevronDown, AlertCircle, Sparkles, Sliders, Layers, UserCheck } from "lucide-react";
import SkillsChecklist from "@/components/player/SkillsChecklist";
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

interface AttributeGroup {
  id: string;
  titleEn: string;
  titleAr: string;
  keys: (keyof PlayerAttributes)[];
}

const ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    id: 'shooting',
    titleEn: 'Shooting & Finishing',
    titleAr: 'التسديد والإنهاء الهجومي',
    keys: ['offensiveAwareness', 'finishing', 'kickingPower', 'heading']
  },
  {
    id: 'passing',
    titleEn: 'Passing & Playmaking',
    titleAr: 'التمرير وصناعة اللعب',
    keys: ['lowPass', 'loftedPass', 'ballControl']
  },
  {
    id: 'dribbling',
    titleEn: 'Dribbling & Agility',
    titleAr: 'المراوغة والسرعة والرشاقة',
    keys: ['dribbling', 'speed', 'acceleration', 'balance']
  },
  {
    id: 'physical',
    titleEn: 'Physical & Stamina',
    titleAr: 'القوة الجسدية واللياقة والارتقاء',
    keys: ['physicalContact', 'stamina', 'jump']
  },
  {
    id: 'defense',
    titleEn: 'Defense & Tackling',
    titleAr: 'الدفاع وافتكاك الكرة والشراسة',
    keys: ['defensiveAwareness', 'ballWinning', 'aggression']
  },
  {
    id: 'goalkeeping',
    titleEn: 'Goalkeeping',
    titleAr: 'حراسة المرمى',
    keys: ['gkAwareness', 'gkCatching', 'gkClearing', 'gkReflexes', 'gkReach']
  }
];

const POSITIONS: PESPosition[] = ['CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'DMF', 'RMF', 'LMF', 'CB', 'RB', 'LB', 'GK'];
const PLAY_STYLES = [
  'Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-Lying Forward', 'Dummy Runner',
  'Creative Playmaker', 'Hole Player', 'Classic No. 10', 'Prolific Winger', 'Roaming Flank',
  'Cross Specialist', 'Orchestrator', 'Box-to-Box', 'The Destroyer', 'Anchor Man', 'Build Up',
  'Extra Frontman', 'Offensive Full-back', 'Defensive Full-back', 'Full-back Finisher',
  'Offensive Goalkeeper', 'Defensive Goalkeeper'
];

const CustomSelect = ({ value, options, placeholder, onChange, dropUp = false }: { 
  value: string | number; 
  options: { value: string | number; label: string }[]; 
  placeholder: string; 
  onChange: (v: string) => void;
  dropUp?: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-300 flex items-center justify-between gap-2 shadow-xs ${
          isOpen
            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
            : value
              ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.8, y: dropUp ? 4 : -4 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.8, y: dropUp ? 4 : -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: dropUp ? 'bottom' : 'top' }}
            className={`absolute z-[100] ${dropUp ? 'bottom-full mb-2' : 'mt-2'} w-full max-h-52 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-black/15 dark:shadow-black/50 custom-scrollbar p-1.5 space-y-0.5`}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(String(opt.value)); setIsOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl text-start transition-all duration-150 flex items-center justify-between ${
                  String(opt.value) === String(value)
                    ? 'bg-emerald-500 text-white font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {String(opt.value) === String(value) && <span>✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface EditCardItemProps {
  edit: any;
  isAr: boolean;
  onReview: (edit: any) => void;
  onApprove: (edit: any) => void;
  onReject: (edit: any) => void;
}

const EditCardItem = ({
  edit,
  isAr,
  onReview,
  onApprove,
  onReject,
}: EditCardItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, transition: { duration: 0.15 } }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="p-5 bg-slate-50/95 dark:bg-slate-800/95 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md hover:border-amber-400/80 dark:hover:border-amber-400/80 transition-all duration-300 relative group overflow-hidden"
    >
      <div className={`absolute top-0 bottom-0 ${isAr ? 'right-0' : 'left-0'} w-2 ${edit.source === 'peer_ratings' ? 'bg-purple-500' : 'bg-blue-500'}`} />

      <div className={`space-y-2 flex-1 ${isAr ? 'mr-3' : 'ml-3'}`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
            {edit.playerName || edit.profileData?.fullName || "Player Profile"}
          </span>
          {edit.profileData?.cardName && (
            <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black px-2.5 py-0.5 rounded-lg border border-amber-500/30">
              {edit.profileData.cardName}
            </span>
          )}
          {edit.source === 'peer_ratings' ? (
            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 border border-purple-300/60 dark:border-purple-700/60 shadow-2xs">
              <Users className="w-3.5 h-3.5" />
              {isAr ? `تقييم قدرات الزملاء (${edit.raterCount || 1} مقيّم)` : `Peer Ratings Suggestion (${edit.raterCount || 1} raters)`}
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 border border-blue-300/60 dark:border-blue-700/60 shadow-2xs">
              <UserCheck className="w-3.5 h-3.5" />
              {isAr ? "طلب تعديل الملف والشخصية" : "Self Profile Edit Request"}
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 items-center">
          <span>{isAr ? "تاريخ التقديم:" : "Requested:"} {new Date(edit.requestedAt || edit.updatedAt || Date.now()).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
          {edit.source === 'peer_ratings' && edit.raterNames && edit.raterNames.length > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1">
              <span>🔒</span> {isAr ? "المقيّمون (للمسؤول فقط):" : "Raters (Admin View Only):"} {edit.raterNames.join(", ")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end shrink-0">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onReview(edit)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl transition-all shadow-md hover:shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 text-sm"
        >
          <Edit3 className="w-4 h-4" />
          {isAr ? "مقارنة وتعديل (Diff & Review)" : "Compare & Edit Diff"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onApprove(edit)}
          className="px-4 py-2.5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-600/20 flex items-center gap-2 text-sm"
        >
          <Check className="w-4 h-4" />
          {isAr ? "اعتماد سريع" : "Quick Approve"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onReject(edit)}
          className="px-3.5 py-2.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-900/60 transition-all flex items-center gap-1.5 text-sm"
        >
          <X className="w-4 h-4" />
          {isAr ? "رفض" : "Reject"}
        </motion.button>
      </div>
    </motion.div>
  );
};

interface PendingEditsProps {
  filterPlayerId?: string;
  inlineMode?: boolean;
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
  const [activeReviewTab, setActiveReviewTab] = useState<'attributes' | 'profile'>('attributes');

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
      let unique = merged.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
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
      cardName: edit.profileData?.cardName !== undefined ? edit.profileData.cardName : (edit.cardName || fetchedCurrent.cardName || ""),
      primaryPosition: edit.profileData?.primaryPosition || fetchedCurrent.primaryPosition || "CMF",
      secondaryPosition: edit.profileData?.secondaryPosition !== undefined ? edit.profileData.secondaryPosition : (fetchedCurrent.secondaryPosition || ""),
      tertiaryPosition: edit.profileData?.tertiaryPosition !== undefined ? edit.profileData.tertiaryPosition : (fetchedCurrent.tertiaryPosition || ""),
      playStyle: edit.profileData?.playStyle !== undefined ? edit.profileData.playStyle : (fetchedCurrent.playStyle || ""),
      preferredFoot: edit.profileData?.preferredFoot || fetchedCurrent.preferredFoot || "Right",
      specialSkills: edit.profileData?.specialSkills || edit.specialSkills || fetchedCurrent.specialSkills || [],
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

  const predictedOverall = useMemo(() => {
    if (!reviewFormData.attributes) {
      return currentPlayerData?.overallRating || 70;
    }
    return calculateRealisticOverall(
      reviewFormData.attributes,
      reviewFormData.primaryPosition as PESPosition,
      reviewFormData.playStyle || reviewFormData.profileData?.playStyle || currentPlayerData?.playStyle || "",
      reviewFormData.height || reviewFormData.profileData?.height || currentPlayerData?.height || 175,
      reviewFormData.weight || reviewFormData.profileData?.weight || currentPlayerData?.weight || 70,
      currentPlayerData?.calculatedAge || 25,
      currentPlayerData?.peerRatingAvg,
      currentPlayerData?.peerRatingCount,
      reviewFormData.preferredFoot || currentPlayerData?.preferredFoot
    );
  }, [reviewFormData.attributes, reviewFormData.primaryPosition, reviewFormData.playStyle, reviewFormData.profileData, reviewFormData.height, reviewFormData.weight, reviewFormData.preferredFoot, currentPlayerData]);

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
      const prefFoot = modifiedData?.preferredFoot !== undefined ? modifiedData.preferredFoot : (targetProfileData.preferredFoot || playerData.preferredFoot || "Right");
      const skills = modifiedData?.specialSkills !== undefined ? modifiedData.specialSkills : (targetProfileData.specialSkills || edit.specialSkills || playerData.specialSkills || []);

      const updateDataGlobal: any = { ...targetProfileData, primaryPosition: pos, secondaryPosition: secPos, tertiaryPosition: tertPos, playStyle: style, preferredFoot: prefFoot, specialSkills: skills };
      const updateDataComm: any = { ...targetProfileData, primaryPosition: pos, secondaryPosition: secPos, tertiaryPosition: tertPos, playStyle: style, preferredFoot: prefFoot, specialSkills: skills };

      const height = targetProfileData.height || playerData.height;
      const weight = targetProfileData.weight || playerData.weight;
      const age = targetProfileData.calculatedAge || playerData.calculatedAge;
      let peerAvg = playerData.peerRatingAvg;
      let peerCount = playerData.peerRatingCount || 0;

      if (targetAttributes || edit.source === 'peer_ratings') {
        const existingReviews = Array.isArray(playerData.peerReviews) ? [...playerData.peerReviews] : [];
        const reviewerId = edit.suggestedByUid || edit.raterUid || `reviewer_${Date.now()}`;
        const reviewerName = edit.suggestedByName || edit.raterName || 'Community Member';
        
        const newReviewEntry = {
          reviewerUid: reviewerId,
          reviewerName: reviewerName,
          timestamp: new Date().toISOString(),
          ratings: targetAttributes || edit.attributes || {},
          suggestedOvr: edit.suggestedOvr || targetProfileData.suggestedOvr || null
        };

        const existingIdx = existingReviews.findIndex((r: any) => r.reviewerUid === reviewerId);
        if (existingIdx >= 0 && !reviewerId.startsWith('reviewer_')) {
          existingReviews[existingIdx] = newReviewEntry;
        } else {
          existingReviews.push(newReviewEntry);
        }

        const baseAttr = playerData.attributes || {};
        const blendedAttr: any = { ...baseAttr };
        const allKeys = new Set([...Object.keys(baseAttr), ...(targetAttributes ? Object.keys(targetAttributes) : [])]);
        
        allKeys.forEach((key) => {
          let sum = typeof baseAttr[key] === 'number' ? baseAttr[key] : 0;
          let count = typeof baseAttr[key] === 'number' ? 1 : 0;
          existingReviews.forEach((rev: any) => {
            if (rev.ratings && typeof rev.ratings[key] === 'number') {
              sum += rev.ratings[key];
              count++;
            }
          });
          if (count > 0) {
            blendedAttr[key] = Math.round(sum / count);
          }
        });

        peerCount = existingReviews.length;
        if (edit.suggestedOvr && typeof edit.suggestedOvr === 'number') {
          const scaledOvrRating = Math.min(10, Math.max(1, Number((edit.suggestedOvr / 10).toFixed(1))));
          const prevTotal = (playerData.peerRatingAvg || 6.0) * Math.max(1, playerData.peerRatingCount || 1);
          peerAvg = Number(((prevTotal + scaledOvrRating) / (Math.max(1, playerData.peerRatingCount || 1) + 1)).toFixed(1));
        }

        const newOverall = calculateRealisticOverall(blendedAttr, pos, style, height, weight, age, peerAvg, peerCount, prefFoot);
        
        updateDataGlobal.attributes = blendedAttr;
        updateDataGlobal.approvedAttributes = blendedAttr;
        updateDataGlobal.overallRating = newOverall;
        updateDataGlobal.peerReviews = existingReviews;
        updateDataGlobal.peerRatingAvg = peerAvg;
        updateDataGlobal.peerRatingCount = peerCount;

        updateDataComm.attributes = blendedAttr;
        updateDataComm.approvedAttributes = blendedAttr;
        updateDataComm.overallRating = newOverall;
        updateDataComm.peerReviews = existingReviews;
        updateDataComm.peerRatingAvg = peerAvg;
        updateDataComm.peerRatingCount = peerCount;
      } else if (Object.keys(targetProfileData).length > 0 || modifiedData?.playStyle !== undefined || modifiedData?.primaryPosition !== undefined || modifiedData?.preferredFoot !== undefined || modifiedData?.specialSkills !== undefined) {
        const newOverall = calculateRealisticOverall(playerData.attributes || {}, pos, style, height, weight, age, peerAvg, peerCount, prefFoot);
        updateDataGlobal.overallRating = newOverall;
        updateDataComm.overallRating = newOverall;
      }

      const resolvedCommId = editCommunityId || null;
      if (targetStats && resolvedCommId) {
        updateDataGlobal[`communityStats.${resolvedCommId}`] = targetStats;
        updateDataGlobal.stats = targetStats;
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

      try {
        const targetUid = edit.playerId || edit.uid || edit.player?.uid;
        if (targetUid) {
          const titleText = edit.source === 'peer_ratings'
            ? (isAr ? 'تم اعتماد تقييم الأداء والقدرات الجديد!' : 'New Peer Ability Ratings Approved!')
            : (isAr ? 'تمت الموافقة على تعديلاتك!' : 'Profile Edits Approved!');
          const bodyText = edit.source === 'peer_ratings'
            ? (isAr ? `قام مسؤول المجتمع بمراجعة واعتماد التقييمات الجديدة لقدراتك بنجاح. تقييمك العام الحالي: ${updateDataGlobal.overallRating || 'مُحدّث'}.` : `Your community admin approved new peer performance ability ratings. New OVR: ${updateDataGlobal.overallRating || 'Updated'}.`)
            : (isAr ? 'تمت مراجعة طلب تعديل ملفك الشخصي وقدراته والموافقة عليه بنجاح.' : 'Your requested profile and attribute updates have been approved and applied.');

          await setDoc(doc(collection(db, `users/${targetUid}/notifications`), `edit_ok_${targetUid}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
            type: 'stats',
            title: titleText,
            body: bodyText,
            read: false,
            createdAt: serverTimestamp(),
            link: '/profile?uid=' + targetUid
          });
        }
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
      message: isAr ? `هل أنت متأكد من الموافقة على جميع الاقتراحات (${edits.length}) دفعة واحدة؟ سيتم احتساب المتوسط من جميع الاقتراحات السابقة والحالية.` : `Are you sure you want to approve all ${edits.length} suggestions at once? Average will be calculated from all past and current suggestions.`,
      onConfirm: async () => {
        try {
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

  const handleRejectAll = () => {
    if (edits.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? "رفض الكل" : "Reject All",
      message: isAr ? `هل أنت متأكد من رفض جميع الاقتراحات (${edits.length}) دفعة واحدة؟` : `Are you sure you want to reject all ${edits.length} suggestions at once?`,
      onConfirm: async () => {
        try {
          for (const edit of edits) {
            const collPath = edit._collection || (activeCommunityId ? `communities/${activeCommunityId}/editRequests` : 'editRequests');
            await deleteDoc(doc(db, collPath, edit.id));
            const targetUid = edit.playerId || edit.uid || edit.player?.uid;
            if (targetUid && edit.source !== 'peer_ratings') {
              try {
                await setDoc(doc(collection(db, `users/${targetUid}/notifications`), `edit_rej_${targetUid}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
                  type: 'system',
                  title: isAr ? 'تم رفض التعديل - تقديم التماس؟' : 'Edit Rejected - Want to Appeal?',
                  body: isAr ? 'لم تتم الموافقة على تعديلاتك. هل ترغب في تقديم التماس ومراجعة طلبك مع إدارة المجتمع؟' : 'Your requested profile edit was not approved. Want to make an appeal with community management?',
                  read: false,
                  createdAt: serverTimestamp(),
                  link: '/support'
                });
              } catch (e) {}
            }
          }
          setIsModalOpen(false);
          toast.success(isAr ? "تم رفض جميع التعديلات بنجاح!" : "All edits rejected successfully!");
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "حدث خطأ أثناء رفض البعض." : "Error occurred while rejecting some edits.");
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
          const targetUid = edit.playerId || edit.uid || edit.player?.uid;
          if (targetUid && edit.source !== 'peer_ratings') {
            try {
              await setDoc(doc(collection(db, `users/${targetUid}/notifications`), `edit_rej_${targetUid}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`), {
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
          if (reviewingEdit && reviewingEdit.id === edit.id) {
            setReviewingEdit(null);
          }
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "خطأ في رفض التعديل." : "Error rejecting edit.");
        }
      }
    });
  };

  const handleAttributeChange = (attrKey: string, val: number) => {
    setReviewFormData((prev: any) => ({
      ...prev,
      attributes: {
        ...(prev.attributes || {}),
        [attrKey]: val,
      },
    }));
  };

  const handleBasicFieldChange = (field: string, val: any) => {
    setReviewFormData((prev: any) => ({
      ...prev,
      [field]: val,
      profileData: {
        ...(prev.profileData || {}),
        [field]: val,
      },
    }));
  };

  const handleApproveReviewed = () => {
    if (reviewingEdit) {
      applyApproval(reviewingEdit, reviewFormData);
    }
  };

  if (loading) return null;

  const renderReviewModal = () => (
    <AnimatePresence>
      {reviewingEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-5xl p-5 sm:p-8 shadow-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden"
          >
            {/* Header / Live Diff Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {isAr ? "مراجعة ومقارنة الاقتراح (Diff Review & Live Adjust)" : "Side-by-Side Diff & Live Sliders"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {isAr
                        ? "قارن بين البيانات الحالية والمقترحة وحرّك المؤشرات لمشاهدة التقييم العام (OVR) يتغير مباشرة قبل الاعتماد."
                        : "Compare current DB values vs proposed edits. Tweak sliders to see real-time OVR recalculation before applying."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live OVR Comparison Badge */}
              <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/90 px-6 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-inner shrink-0 self-stretch sm:self-auto justify-center">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-black text-slate-400">{isAr ? "التقييم الحالي" : "Current OVR"}</div>
                  <div className="text-2xl font-black text-slate-600 dark:text-slate-300">{currentPlayerData?.overallRating || 70}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500 rtl:rotate-180" />
                <div className="text-center">
                  <div className="text-[10px] uppercase font-black text-emerald-500">{isAr ? "بعد الاعتماد (حي)" : "Proposed OVR"}</div>
                  <div className="text-3xl font-black text-emerald-500 drop-shadow-xs animate-pulse">{predictedOverall}</div>
                </div>
              </div>
            </div>

            {/* Anonymity Shield Banner for Peer Ratings */}
            {reviewingEdit.source === 'peer_ratings' && (
              <div className="mb-6 p-4 bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex items-start gap-3.5 text-sm shadow-xs shrink-0">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-purple-900 dark:text-purple-200 block">
                    {isAr ? "حماية سرية المقيّمين (سرية للاعب، مكشوفة للمشرف فقط):" : "Rater Confidentiality Shield (Anonymous to Player, Visible to Admin):"}
                  </span>
                  <span className="text-purple-700 dark:text-purple-300 text-xs leading-relaxed mt-0.5 block">
                    {isAr
                      ? `قام ${reviewingEdit.raterCount || 1} لاعب بتقديم هذا التقييم. أسماء المقيّمين: [ ${reviewingEdit.raterNames?.join(', ') || 'زملاء'} ]. عند اعتمادك سيتم تحديث قدرات اللاعب فقط دون إفشاء هويات المقيّمين.`
                      : `Submitted by ${reviewingEdit.raterCount || 1} peers. Raters: [ ${reviewingEdit.raterNames?.join(', ') || 'Peers'} ]. Once approved, only the attributes change; rater identities remain strictly confidential from the player.`}
                  </span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 overflow-x-auto pb-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveReviewTab('attributes')}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 ${
                  activeReviewTab === 'attributes'
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-500/40'
                    : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>{isAr ? "قدرات ومؤهلات اللاعب (22 مهارة مجزأة بوضوح)" : "Attributes & Ability Ratings (Grouped Diff)"}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveReviewTab('profile')}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 ${
                  activeReviewTab === 'profile'
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-500/40'
                    : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{isAr ? "البيانات والشخصية (مقارنة الحقول)" : "Profile Details & Positions Diff"}</span>
              </motion.button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
              {activeReviewTab === 'attributes' ? (
                <div className="space-y-6">
                  {ATTRIBUTE_GROUPS.map((group) => (
                    <div key={group.id} className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/60">
                      <h5 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {isAr ? group.titleAr : group.titleEn}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.keys.map((key) => {
                          const oldVal = Number(currentPlayerData?.attributes?.[key]) || 60;
                          const newVal = Number(reviewFormData.attributes?.[key] ?? oldVal);
                          const diff = newVal - oldVal;

                          return (
                            <div key={key} className="p-4 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl transition-all hover:border-emerald-500/50 shadow-2xs">
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  {ATTRIBUTE_LABELS[key]?.[isAr ? 'ar' : 'en'] || key}
                                </span>
                                
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900" title="Current in database">
                                    {isAr ? `الحالي: ${oldVal}` : `Old: ${oldVal}`}
                                  </span>
                                  {diff !== 0 && (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
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
                                onChange={(e) => handleAttributeChange(key, Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {isAr ? "الاسم الكامل (الحالي vs الجديد)" : "Full Name (Old vs New)"}
                    </label>
                    <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي في النظام:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.fullName || 'N/A'}</span></div>
                    <input
                      type="text"
                      value={reviewFormData.fullName || ""}
                      onChange={e => handleBasicFieldChange('fullName', e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {isAr ? "اسم البطاقة (Card Name)" : "Card Name"}
                    </label>
                    <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.cardName || 'N/A'}</span></div>
                    <input
                      type="text"
                      value={reviewFormData.cardName !== undefined ? reviewFormData.cardName : ""}
                      onChange={e => handleBasicFieldChange('cardName', e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                      placeholder={isAr ? "الاسم المعروف" : "Nickname"}
                    />
                  </div>

                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {isAr ? "المركز الأساسي (Position)" : "Primary Position"}
                    </label>
                    <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.primaryPosition || 'CMF'}</span></div>
                    <CustomSelect
                      value={reviewFormData.primaryPosition || "CF"}
                      placeholder={isAr ? "اختر المركز" : "Select Position"}
                      options={POSITIONS.map(p => ({ value: p, label: p }))}
                      onChange={(v) => handleBasicFieldChange('primaryPosition', v)}
                    />
                  </div>

                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {isAr ? "القدم المفضلة" : "Preferred Foot"}
                    </label>
                    <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.preferredFoot || 'Right'}</span></div>
                    <CustomSelect
                      value={reviewFormData.preferredFoot || "Right"}
                      placeholder={isAr ? "اختر القدم" : "Select Foot"}
                      options={[
                        { value: 'Right', label: isAr ? 'اليمنى' : 'Right' },
                        { value: 'Left', label: isAr ? 'اليسرى' : 'Left' },
                        { value: 'Both', label: isAr ? 'كلتا القدمين' : 'Both' }
                      ]}
                      onChange={(v) => handleBasicFieldChange('preferredFoot', v)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? "المركز الثانوي (Secondary)" : "Secondary Position"}
                      </label>
                      <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.secondaryPosition || (isAr ? 'لا يوجد' : 'None')}</span></div>
                      <CustomSelect
                        value={reviewFormData.secondaryPosition || ""}
                        placeholder={isAr ? "بدون (None)" : "None"}
                        options={[{ value: '', label: isAr ? 'بدون (None)' : 'None' }, ...POSITIONS.map(p => ({ value: p, label: p }))]}
                        onChange={(v) => handleBasicFieldChange('secondaryPosition', v)}
                      />
                    </div>

                    <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? "المركز الثالث (Tertiary)" : "Tertiary Position"}
                      </label>
                      <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.tertiaryPosition || (isAr ? 'لا يوجد' : 'None')}</span></div>
                      <CustomSelect
                        value={reviewFormData.tertiaryPosition || ""}
                        placeholder={isAr ? "بدون (None)" : "None"}
                        options={[{ value: '', label: isAr ? 'بدون (None)' : 'None' }, ...POSITIONS.map(p => ({ value: p, label: p }))]}
                        onChange={(v) => handleBasicFieldChange('tertiaryPosition', v)}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {isAr ? "أسلوب اللعب (Play Style)" : "Play Style"}
                    </label>
                    <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.playStyle || (isAr ? 'لا يوجد' : 'None')}</span></div>
                    <CustomSelect
                      value={reviewFormData.playStyle || ""}
                      placeholder={isAr ? "بدون (None)" : "None"}
                      options={[{ value: '', label: isAr ? 'بدون (None)' : 'None' }, ...PLAY_STYLES.map(style => ({ value: style, label: style }))]}
                      onChange={(v) => handleBasicFieldChange('playStyle', v)}
                      dropUp={true}
                    />
                  </div>

                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {isAr ? "الطول (سم) والوزن (كجم)" : "Height (cm) & Weight (kg)"}
                    </label>
                    <div className="text-xs text-slate-400 mb-2">{isAr ? `الحالي:` : `Current:`} <span className="font-bold text-slate-700 dark:text-slate-300">{currentPlayerData?.height || 175} cm / {currentPlayerData?.weight || 70} kg</span></div>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Height"
                        value={reviewFormData.height || 175}
                        onChange={e => handleBasicFieldChange('height', Number(e.target.value))}
                        className="w-1/2 p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                      />
                      <input
                        type="number"
                        placeholder="Weight"
                        value={reviewFormData.weight || 70}
                        onChange={e => handleBasicFieldChange('weight', Number(e.target.value))}
                        className="w-1/2 p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 md:col-span-2 shadow-xs">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
                      {isAr ? "المهارات الخاصة (Special Skills)" : "Special Skills"}
                    </label>
                    <SkillsChecklist
                      selectedSkills={reviewFormData.specialSkills || []}
                      onSkillsChange={(skills) => handleBasicFieldChange('specialSkills', skills)}
                      locale={isAr ? 'ar' : 'en'}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap justify-end gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setReviewingEdit(null)}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm transition-all"
              >
                {isAr ? "إلغاء ومغادرة" : "Cancel"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleReject(reviewingEdit)}
                className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 font-bold text-sm transition-all flex items-center gap-1.5 shadow-xs"
              >
                <X className="w-5 h-5" />
                {isAr ? "رفض وحذف الاقتراح" : "Reject & Delete"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleApproveReviewed}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{isAr ? `اعتماد وتطبيق التقييمات (OVR: ${predictedOverall})` : `Approve & Apply (OVR: ${predictedOverall})`}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (inlineMode) {
    return (
      <div dir={isAr ? 'rtl' : 'ltr'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {edits.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
              {isAr ? "لا توجد اقتراحات حالياً." : "No pending suggestions right now."}
            </div>
          ) : (
            <AnimatePresence>
              {edits.map(edit => (
                <EditCardItem
                  key={edit.id}
                  edit={edit}
                  isAr={isAr}
                  onReview={handleOpenReview}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {renderReviewModal()}

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

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsModalOpen(true)}
        className="w-full relative py-3.5 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-xs border border-amber-200/80 dark:border-amber-500/20 shadow-xs"
      >
        <AlertCircle className="w-4 h-4" />
        <span>{isAr ? "مراجعة الاقتراحات والتقييمات" : "Review Suggestions & Edits"}</span>
        {edits.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
            {edits.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 my-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900 shrink-0">
                <h3 className="text-xl font-black flex items-center gap-2.5 text-slate-900 dark:text-white tracking-tight">
                  <span className="text-amber-500 text-2xl">⚠️</span> {isAr ? "طلبات ومقترحات التقييم" : "Pending Profile Edits"} ({edits.length})
                </h3>
                <div className="flex items-center gap-3">
                  {edits.length > 0 && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleApproveAll}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {isAr ? "الموافقة على الكل" : "Approve All"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRejectAll}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-2xl transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        {isAr ? "رفض الكل" : "Reject All"}
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(false)}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                {edits.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                    {isAr ? "لا توجد اقتراحات حالياً." : "No pending suggestions right now."}
                  </div>
                ) : (
                  <AnimatePresence>
                    {edits.map(edit => (
                      <EditCardItem
                        key={edit.id}
                        edit={edit}
                        isAr={isAr}
                        onReview={handleOpenReview}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderReviewModal()}

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
