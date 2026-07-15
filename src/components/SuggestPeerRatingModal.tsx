"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { useLocale } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import type { PlayerProfile, PESPosition, PlayerAttributes } from "@/types";
import AttributeSliders from "@/components/AttributeSliders";
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      setAttributes(player.approvedAttributes || player.attributes || {} as PlayerAttributes);
      setPrimaryPosition((player.primaryPosition as PESPosition) || 'CMF');
      setPlayStyle(player.playStyle || '');
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
      player.peerRatingCount
    );
  }, [attributes, primaryPosition, playStyle, player]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) {
      toast.error(isAr ? "يجب تسجيل الدخول لإرسال اقتراح" : "Must be logged in to suggest ratings");
      return;
    }

    setSubmitting(true);
    try {
      const collectionPath = activeCommunityId
        ? `communities/${activeCommunityId}/editRequests`
        : `editRequests`;

      const payload = {
        playerId: player.uid,
        playerName: player.fullName,
        cardName: player.cardName || player.fullName,
        source: "peer_ratings",
        suggestedByUid: user.uid,
        suggestedByName: user.displayName || user.email || "Peer Player",
        attributes: attributes,
        profileData: {
          primaryPosition,
          playStyle,
          height: player.height || 175,
          weight: player.weight || 70,
          fullName: player.fullName,
          cardName: player.cardName || player.fullName,
        },
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, collectionPath), payload);

      // Notify the target player
      try {
        await addDoc(collection(db, `users/${player.uid}/notifications`), {
          type: 'stats',
          title: isAr ? 'اقتراح تقييم جديد لمهاراتك!' : 'New Ability Rating Suggestion!',
          body: isAr
            ? `قام أحد اللاعبين في مجتمعك باقتراح تعديل على طاقاتك ومركزك (التقييم المقترح: ${suggestedOvr}). في انتظار اعتماد مسؤول المجتمع.`
            : `A community peer suggested updates to your abilities and ratings (Suggested OVR: ${suggestedOvr}). Waiting for Admin approval.`,
          read: false,
          createdAt: serverTimestamp(),
          link: '/profile?uid=' + player.uid
        });
      } catch (e) {
        console.warn("Could not notify target player:", e);
      }

      toast.success(isAr ? "تم إرسال اقتراحك بنجاح وسيتوجه للمسؤول للاعتماد!" : "Suggestion sent successfully! Waiting for admin review.");
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

            {/* Quick Position & Style Selectors */}
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "المركز الأساسي" : "Primary Pos"}</label>
                <select
                  value={primaryPosition}
                  onChange={(e) => setPrimaryPosition(e.target.value as PESPosition)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "أسلوب اللعب" : "Play Style"}</label>
                <select
                  value={playStyle}
                  onChange={(e) => setPlayStyle(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="">{isAr ? "بدون أسلوب" : "None"}</option>
                  {PLAY_STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Body Content: Sliders */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="flex items-center gap-2 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-300 text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                {isAr
                  ? "قم بتعديل شريحة القدرات أدناه حسب أداء اللاعب الفعلي في الملعب. عند النقر على إرسال، سيصل الإشعار إلى المسؤول ومراجعة التغيير لاعتماده."
                  : "Adjust sliders according to exact on-pitch performance. Upon submission, the Community Admin will review the exact before/after difference."}
              </span>
            </div>

            <AttributeSliders
              attributes={attributes}
              onChange={setAttributes}
              locale={isAr ? "ar" : "en"}
              primaryPosition={primaryPosition}
              playStyle={playStyle}
            />
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
    </AnimatePresence>
  );
}
