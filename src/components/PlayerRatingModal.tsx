'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunity } from '@/contexts/CommunityContext';
import toast from 'react-hot-toast';

interface PlayerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  players: any[];
  isAr: boolean;
}

export default function PlayerRatingModal({ isOpen, onClose, matchId, players, isAr }: PlayerRatingModalProps) {
  const { user } = useAuth();
  const { activeCommunityId } = useCommunity();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [existingRatings, setExistingRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing ratings for this user in this match
  useEffect(() => {
    if (!isOpen || !user || !activeCommunityId || !matchId) return;
    setIsLoading(true);

    const loadRatings = async () => {
      try {
        const ratingDocRef = doc(db, 'communities', activeCommunityId, 'matches', matchId, 'ratings', user.uid);
        const snap = await getDoc(ratingDocRef);
        if (snap.exists()) {
          const data = snap.data();
          const savedRatings = data.ratings || {};
          setRatings(savedRatings);
          setExistingRatings(savedRatings);
        }
      } catch (err) {
        console.error('Failed to load existing ratings', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRatings();
  }, [isOpen, user, activeCommunityId, matchId]);

  const handleRatingChange = (playerId: string, value: number) => {
    setRatings(prev => ({ ...prev, [playerId]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !activeCommunityId) return;
    setIsSubmitting(true);
    try {
      // Save per-match ratings
      const ratingDocRef = doc(db, 'communities', activeCommunityId, 'matches', matchId, 'ratings', user.uid);
      await setDoc(ratingDocRef, {
        ratedBy: user.uid,
        ratings,
        timestamp: serverTimestamp()
      });

      // Also save cross-match peer ratings (latest rating per player)
      for (const [playerId, rating] of Object.entries(ratings)) {
        if (!rating) continue;
        const peerRef = doc(db, 'communities', activeCommunityId, 'playerRatings', `${user.uid}_${playerId}`);
        await setDoc(peerRef, {
          raterUid: user.uid,
          ratedUid: playerId,
          rating,
          matchId,
          timestamp: serverTimestamp()
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit ratings', err);
      toast.error(isAr ? 'فشل في إرسال التقييمات' : 'Failed to submit ratings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const ratedCount = Object.values(ratings).filter(v => v > 0).length;
  const editablePlayers = players.filter(p => p.uid !== user?.uid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {isAr ? 'تقييم أداء اللاعبين' : 'Rate Players Performance'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? `قيّم زملائك (1-10) — ${ratedCount}/${editablePlayers.length} ${isAr ? 'تم تقييمهم' : 'rated'}`
                : `Rate your teammates (1-10) — ${ratedCount}/${editablePlayers.length} rated`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : submitted ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center text-3xl">✅</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'تم إرسال تقييماتك بنجاح!' : 'Your ratings have been submitted!'}
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {editablePlayers.map(p => {
                const currentRating = ratings[p.uid] || 0;
                const hasExisting = !!existingRatings[p.uid];
                const ratingLabel = isAr
                  ? ['سيء جداً', 'سيء', 'ضعيف', 'مقبول', 'متوسط', 'جيد', 'جيد جداً', 'ممتاز', 'متميز', 'استثنائي'][currentRating - 1] || ''
                  : ['', 'Terrible', 'Bad', 'Poor', 'Fair', 'Average', 'Good', 'Very Good', 'Excellent', 'Outstanding', 'Exceptional'][currentRating] || '';

                return (
                  <motion.div
                    key={p.uid}
                    layout
                    className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all hover:border-amber-400/50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {p.photoUrl || p.googlePic ? (
                          <div className="relative w-full h-full">
                            <Image src={p.photoUrl || p.googlePic} alt="" fill sizes="44px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                            {(p.cardName || p.fullName || '?').charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.cardName || p.fullName}</h4>
                        <span className="text-xs text-slate-500">{p.primaryPosition}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasExisting && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold">
                            {isAr ? 'مُعدّل' : 'Edited'}
                          </span>
                        )}
                        <div className="text-2xl font-black min-w-[3ch] text-center">
                          <span className={currentRating >= 8 ? 'text-emerald-500' : currentRating >= 5 ? 'text-amber-500' : currentRating > 0 ? 'text-red-500' : 'text-slate-300 dark:text-slate-600'}>
                            {currentRating || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rating scale */}
                    <div className="flex justify-between items-center px-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                        <button
                          key={val}
                          onClick={() => handleRatingChange(p.uid, val)}
                          className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center transition-all duration-200 ${
                            currentRating === val
                              ? val >= 8
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 transform scale-110'
                                : val >= 5
                                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 transform scale-110'
                                  : 'bg-red-500 text-white shadow-md shadow-red-500/30 transform scale-110'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    {ratingLabel && (
                      <p className="text-center text-xs font-semibold mt-1.5 text-slate-500">{ratingLabel}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {!submitted && !isLoading && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || ratedCount === 0}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>⭐</span>
                  <span>{isAr ? 'حفظ التقييمات' : 'Submit Ratings'}</span>
                  {ratedCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{ratedCount}</span>
                  )}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
