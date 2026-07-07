"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import toast from "react-hot-toast";

interface PlayerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
  matchId: string;
}

export default function PlayerRatingModal({ isOpen, onClose, matchData, matchId }: PlayerRatingModalProps) {
  const { user } = useAuth();
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const allPlayers = [...(matchData?.teamA || []), ...(matchData?.teamB || [])];

  useEffect(() => {
    if (!isOpen || !user || !activeCommunityId || !matchId) return;

    // Check if user already rated
    getDoc(doc(db, "communities", activeCommunityId, "matches", matchId, "ratings", user.uid))
      .then(snap => {
        if (snap.exists()) {
          setAlreadyRated(true);
          setRatings(snap.data().ratings || {});
        } else {
          setAlreadyRated(false);
          setRatings({});
        }
      })
      .catch(console.error);
  }, [isOpen, user, activeCommunityId, matchId]);

  const handleSubmit = async () => {
    if (!user || !activeCommunityId || !matchId) return;

    const ratedCount = Object.keys(ratings).length;
    if (ratedCount === 0) {
      toast.error(isAr ? "يرجى تقييم لاعب واحد على الأقل" : "Please rate at least one player");
      return;
    }

    setSubmitting(true);
    try {
      await setDoc(
        doc(db, "communities", activeCommunityId, "matches", matchId, "ratings", user.uid),
        {
          ratings,
          raterUid: user.uid,
          raterName: user.displayName || "",
          ratedAt: new Date().toISOString(),
        }
      );

      toast.success(isAr ? "تم حفظ تقييماتك بنجاح!" : "Your ratings have been saved!");
      setAlreadyRated(true);
    } catch (err) {
      console.error("Failed to save ratings:", err);
      toast.error(isAr ? "فشل في حفظ التقييمات" : "Failed to save ratings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRating = (playerUid: string, value: number) => {
    setRatings(prev => ({ ...prev, [playerUid]: value }));
  };

  if (!matchData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                  ⭐
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {isAr ? "تقييم اللاعبين" : "Rate Players"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {isAr ? "قيّم أداء اللاعبين من 1 إلى 10" : "Rate player performance from 1 to 10"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {alreadyRated && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-4 text-sm font-bold text-emerald-700 dark:text-emerald-400 text-center mb-4">
                  ✅ {isAr ? "لقد قمت بتقييم هذه المباراة مسبقاً. يمكنك تحديث تقييماتك." : "You've already rated this match. You can update your ratings."}
                </div>
              )}

              {allPlayers.filter(p => p.uid !== user?.uid).map((player: any) => {
                const isTeamA = (matchData.teamA || []).some((t: any) => t.uid === player.uid);
                const currentRating = ratings[player.uid] || 0;
                const currentHover = hoveredRating[player.uid] || 0;
                const displayRating = currentHover || currentRating;

                return (
                  <div
                    key={player.uid}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 gap-4"
                  >
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        {(player.photoUrl || player.googlePic) ? (
                          <Image
                            src={player.photoUrl || player.googlePic}
                            alt=""
                            className="w-full h-full object-cover"
                            width={40}
                            height={40}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-500">
                            {(player.cardName || player.fullName || "?").charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{player.cardName || player.fullName}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isTeamA
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}>
                          {isTeamA ? "Team A" : "Team B"}
                        </span>
                      </div>
                    </div>

                    {/* Rating Stars */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <button
                          key={val}
                          onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [player.uid]: val }))}
                          onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [player.uid]: 0 }))}
                          onClick={() => handleRating(player.uid, val)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200 ${
                            val <= displayRating
                              ? val <= 3
                                ? "bg-red-500 text-white scale-110 shadow-sm"
                                : val <= 6
                                  ? "bg-amber-500 text-white scale-110 shadow-sm"
                                  : "bg-emerald-500 text-white scale-110 shadow-sm"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">
                {isAr
                  ? `${Object.keys(ratings).length} / ${allPlayers.filter(p => p.uid !== user?.uid).length} لاعب مقيّم`
                  : `${Object.keys(ratings).length} / ${allPlayers.filter(p => p.uid !== user?.uid).length} players rated`}
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(ratings).length === 0}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {submitting
                  ? (isAr ? "جاري الحفظ..." : "Saving...")
                  : alreadyRated
                    ? (isAr ? "تحديث التقييمات" : "Update Ratings")
                    : (isAr ? "إرسال التقييمات" : "Submit Ratings")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
