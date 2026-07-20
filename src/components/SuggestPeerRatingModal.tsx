"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, AlertCircle } from "lucide-react";
import { useLocale } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, setDoc, doc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import type { PlayerProfile, PESPosition, PlayerAttributes } from "@/types";
import AttributeSliders from "@/components/AttributeSliders";
import SkillsChecklist from "@/components/SkillsChecklist";
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import { getPlayerOverall } from "@/lib/playerUtils";

interface SuggestPeerRatingModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
}

const POSITIONS: PESPosition[] = ['CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'DMF', 'RMF', 'LMF', 'CB', 'RB', 'LB', 'GK'];
const PLAY_STYLES = ['Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-Lying Forward', 'Dummy Runner', 'Creative Playmaker', 'Hole Player', 'Classic No. 10', 'Prolific Winger', 'Roaming Flank', 'Cross Specialist', 'Orchestrator', 'Box-to-Box', 'The Destroyer', 'Anchor Man', 'Build Up', 'Extra Frontman', 'Offensive Full-back', 'Defensive Full-back', 'Full-back Finisher', 'Offensive Goalkeeper', 'Defensive Goalkeeper'];

export default function SuggestPeerRatingModal({ player, isOpen, onClose }: SuggestPeerRatingModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const { user } = useAuth();
  const { activeCommunityId } = useCommunity();

  const [attributes, setAttributes] = useState<PlayerAttributes>(player.approvedAttributes || player.attributes || {} as PlayerAttributes);
  const [primaryPosition, setPrimaryPosition] = useState<PESPosition>((player.primaryPosition as PESPosition) || 'CMF');
  const [playStyle, setPlayStyle] = useState<string>(player.playStyle || '');
  const [specialSkills, setSpecialSkills] = useState<string[]>(player.specialSkills || []);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      setAttributes(player.approvedAttributes || player.attributes || {} as PlayerAttributes);
      setPrimaryPosition((player.primaryPosition as PESPosition) || 'CMF');
      setPlayStyle(player.playStyle || '');
      setSpecialSkills(player.specialSkills || []);
    }
  }, [isOpen, player]);

  const currentOvr = useMemo(() => getPlayerOverall(player), [player]);

  const suggestedOvr = useMemo(() => {
    return calculateRealisticOverall(
      attributes,
      primaryPosition,
      playStyle,
      player.height,
      player.weight,
      player.calculatedAge,
      player.peerRatingAvg,
      player.peerRatingCount,
      player.preferredFoot
    );
  }, [attributes, primaryPosition, playStyle, player]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(isAr ? "يجب تسجيل الدخول لإرسال اقتراح" : "Must be logged in to suggest ratings");
      return;
    }

    setSubmitting(true);
    try {
      const collRoot = activeCommunityId ? `communities/${activeCommunityId}` : ``;
      const ratingsPath = collRoot ? `${collRoot}/playerRatings` : `playerRatings`;
      const requestsPath = collRoot ? `${collRoot}/editRequests` : `editRequests`;

      // 1. Save this peer's individual rating suggestion
      const peerRatingRef = doc(db, ratingsPath, `${user.uid}_${player.uid}`);
      await setDoc(peerRatingRef, {
        raterUid: user.uid,
        raterName: user.displayName || user.email || "Peer Player",
        ratedUid: player.uid,
        rating: suggestedOvr,
        attributes: attributes,
        primaryPosition,
        playStyle,
        specialSkills,
        timestamp: serverTimestamp()
      });

      // 2. Fetch all peer ratings for this player to calculate consensus
      const peerQuery = query(collection(db, ratingsPath), where("ratedUid", "==", player.uid));
      const peerSnaps = await getDocs(peerQuery);

      const aggregatedAttrs: Record<string, number> = {};
      const attrCounts: Record<string, number> = {};
      const raterNamesSet = new Set<string>();
      const posCounts: Record<string, number> = {};
      const styleCounts: Record<string, number> = {};
      const skillCounts: Record<string, number> = {};

      peerSnaps.forEach(docSnap => {
        const d = docSnap.data();
        if (d.raterName) raterNamesSet.add(d.raterName);
        if (d.primaryPosition) posCounts[d.primaryPosition] = (posCounts[d.primaryPosition] || 0) + 1;
        if (d.playStyle) styleCounts[d.playStyle] = (styleCounts[d.playStyle] || 0) + 1;
        if (Array.isArray(d.specialSkills)) {
          d.specialSkills.forEach((s: string) => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          });
        }
        const pattrs = d.attributes || {};
        for (const [key, val] of Object.entries(pattrs)) {
          if (typeof val === "number" && val >= 40 && val <= 99) {
            aggregatedAttrs[key] = (aggregatedAttrs[key] || 0) + val;
            attrCounts[key] = (attrCounts[key] || 0) + 1;
          }
        }
      });

      // Calculate consensus averages & mode values across peers
      const finalAvgAttrs: any = {};
      for (const key of Object.keys(aggregatedAttrs)) {
        finalAvgAttrs[key] = Math.round(aggregatedAttrs[key] / attrCounts[key]);
      }

      const consensusPos = Object.keys(posCounts).sort((a, b) => posCounts[b] - posCounts[a])[0] || primaryPosition;
      const consensusStyle = Object.keys(styleCounts).sort((a, b) => styleCounts[b] - styleCounts[a])[0] || playStyle;
      
      // Include any skill selected by at least 30% of peers (or at least 1 peer if very few voters)
      const threshold = Math.max(1, Math.ceil(peerSnaps.size * 0.3));
      const consensusSkills = Object.keys(skillCounts).filter(s => skillCounts[s] >= threshold);

      const consensusOvr = calculateRealisticOverall(
        finalAvgAttrs,
        consensusPos as PESPosition,
        consensusStyle,
        player.height,
        player.weight,
        player.calculatedAge,
        player.peerRatingAvg,
        player.peerRatingCount,
        player.preferredFoot
      );

      // 3. Save aggregated consensus proposal into editRequests (Visible to Admin in PendingEdits)
      const proposalRef = doc(db, requestsPath, `peer_proposal_${player.uid}`);
      await setDoc(proposalRef, {
        playerId: player.uid,
        playerName: player.fullName,
        cardName: player.cardName || player.fullName,
        photoUrl: player.photoUrl || "",
        source: "peer_ratings",
        suggestedByUid: user.uid,
        suggestedByName: `إجماع من ${peerSnaps.size} لاعبين (Consensus of ${peerSnaps.size} peers)`,
        raterCount: peerSnaps.size,
        raterNames: Array.from(raterNamesSet),
        attributes: finalAvgAttrs,
        profileData: {
          primaryPosition: consensusPos,
          playStyle: consensusStyle,
          specialSkills: consensusSkills,
          height: player.height || 175,
          weight: player.weight || 70,
          fullName: player.fullName,
          cardName: player.cardName || player.fullName,
        },
        suggestedOvr: consensusOvr,
        status: "pending",
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Notify the target player
      try {
        await addDoc(collection(db, `users/${player.uid}/notifications`), {
          type: 'stats',
          title: isAr ? 'اقتراح تقييم جديد لمهاراتك!' : 'New Ability Rating Suggestion!',
          body: isAr
            ? `قام أحد اللاعبين في مجتمعك باقتراح تعديل على طاقاتك ومركزك ومهاراتك (التقييم المقترح: ${consensusOvr}). في انتظار اعتماد مسؤول المجتمع.`
            : `A community peer suggested updates to your abilities, position, and skills (Suggested OVR: ${consensusOvr}). Waiting for Admin approval.`,
          read: false,
          createdAt: serverTimestamp(),
          link: '/profile?uid=' + player.uid
        });
      } catch (e) {
        console.warn("Could not notify target player:", e);
      }

      toast.success(isAr ? "تم إرسال وحفظ اقتراحك واحتسابه ضمن إجماع اللاعبين!" : "Suggestion submitted and aggregated into community consensus!");
      onClose();
    } catch (err) {
      console.error("Failed to submit peer suggestion:", err);
      toast.error(isAr ? "حدث خطأ أثناء إرسال الاقتراح" : "Failed to submit suggestion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isAr ? "rtl" : "ltr"}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">
                  {isAr ? `اقترح تعديل طاقات وتقييم: ${player.fullName}` : `Suggest Rating & Abilities: ${player.fullName}`}
                </h3>
                <p className="text-emerald-100 text-xs">
                  {isAr
                    ? "اقترح الطاقات الواقعية لزميلك وسيقوم مسؤول المجتمع بمراجعتها واعتماد الفرق"
                    : "Suggest realistic stats; Community Admin will review and merge changes"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* OVR Preview Bar */}
          <div className="px-6 py-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-start sm:items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{isAr ? "التقييم الحالي:" : "Current OVR:"}</span>
                <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{currentOvr}</span>
              </div>
              <div className="text-xl font-black text-slate-400">➔</div>
              <div className="flex flex-col items-start sm:items-center">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{isAr ? "التقييم المقترح:" : "Suggested OVR:"}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{suggestedOvr}</span>
                  {suggestedOvr !== currentOvr && (
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${suggestedOvr > currentOvr ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'}`}>
                      {suggestedOvr > currentOvr ? `+${suggestedOvr - currentOvr}` : `${suggestedOvr - currentOvr}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body Content: Sliders */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="flex items-center gap-2 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-300 text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                {isAr
                  ? "قم بتعديل شريحة القدرات والمركز والمهارات حسب أداء اللاعب الفعلي. سيتم احتساب إجماع اللاعبين تلقائياً ومراجعته من المسؤول."
                  : "Adjust sliders, position, and skills according to on-pitch performance. Peer consensus is automatically aggregated for admin review."}
              </span>
            </div>

            {/* Position and Play Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {isAr ? "المركز الأساسي المقترح" : "Suggested Primary Position"}
                </label>
                <select
                  value={primaryPosition}
                  onChange={(e) => setPrimaryPosition(e.target.value as PESPosition)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {isAr ? "أسلوب اللعب المقترح" : "Suggested Play Style"}
                </label>
                <select
                  value={playStyle}
                  onChange={(e) => setPlayStyle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:outline-none [-webkit-tap-highlight-color:transparent]"
                >
                  <option value="">{isAr ? "بدون (None)" : "None"}</option>
                  {PLAY_STYLES.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">
                {isAr ? 'القدرات والسمات (Attributes)' : 'Attributes'}
              </h3>
              <AttributeSliders
                attributes={attributes}
                onChange={setAttributes}
                locale={isAr ? "ar" : "en"}
                primaryPosition={primaryPosition}
                playStyle={playStyle}
              />
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">
                {isAr ? 'المهارات الخاصة المقترحة (Suggested Special Skills)' : 'Suggested Special Skills'}
              </h3>
              <SkillsChecklist
                selectedSkills={specialSkills}
                onSkillsChange={setSpecialSkills}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الاقتراح للمسؤول" : "Submit Suggestion")}</span>
            </button>
          </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
