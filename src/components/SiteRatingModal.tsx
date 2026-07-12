"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/components/ThemeProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { PlayerProfile } from '@/types';

export default function SiteRatingModal() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [userProfile, setUserProfile] = useState<PlayerProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          setUserProfile(snap.data() as PlayerProfile);
        }
      } catch (e) {
        console.error("Error loading profile for SiteRatingModal:", e);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user || !userProfile) return;

    // Check if already rated or permanently dismissed
    const hasRated = localStorage.getItem('11players_site_rated');
    if (hasRated === 'true') return;

    // Check if profile is completed
    const hasProfile = Boolean(userProfile.fullName && userProfile.cardName && userProfile.primaryPosition);
    // Check if joined a community
    const hasCommunity = Boolean(
      (userProfile.memberCommunities && userProfile.memberCommunities.length > 0) ||
      userProfile.activeCommunityId ||
      userProfile.lastCommunityId
    );

    if (!hasProfile || !hasCommunity) return;

    // Trigger popup after 45 seconds of active session on site
    const timer = setTimeout(() => {
      // Re-verify local storage before opening
      if (localStorage.getItem('11players_site_rated') !== 'true') {
        setIsOpen(true);
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [user, userProfile]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      if (db && user) {
        await addDoc(collection(db, 'site_feedback'), {
          uid: user.uid,
          playerName: userProfile?.cardName || userProfile?.fullName || 'Player',
          rating,
          comment: comment.trim(),
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error("Error submitting rating:", e);
    } finally {
      localStorage.setItem('11players_site_rated', 'true');
      setSubmitted(true);
      setIsSubmitting(false);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Remember dismissal for 3 days before asking again
    localStorage.setItem('11players_site_rated', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-7 text-white shadow-2xl shadow-amber-500/10"
      >
        {!submitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl mb-3">
                ⭐
              </div>
              <h3 className="text-2xl font-black text-white">
                {isAr ? 'كيف تقيم تجربتك في 11PLAYERS؟' : 'Enjoying 11PLAYERS?'}
              </h3>
              <p className="text-sm font-semibold text-slate-400 mt-1">
                {isAr
                  ? 'لقد أكملت ملفك وانضممت للمجتمع، يسعدنا سماع رأيك لتحسين المنصة!'
                  : "You've set up your profile and joined a community! Let us know how we're doing."}
              </p>
            </div>

            {/* Stars Selector */}
            <div className="flex items-center justify-center gap-3 my-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <span
                    className={`text-4xl ${
                      star <= (hoveredRating || rating)
                        ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                        : 'text-slate-700'
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* Optional Comment */}
            <div className="mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={
                  isAr
                    ? 'أخبرنا بملاحظاتك أو مقترحاتك التطويرية (اختياري)...'
                    : 'Any feedback or feature requests? (Optional)...'
                }
                className="w-full rounded-2xl bg-slate-800/80 border border-slate-700 p-4 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className={`w-full py-3.5 rounded-2xl font-black text-base transition-all ${
                  rating === 0 || isSubmitting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                }`}
              >
                {isSubmitting
                  ? (isAr ? 'جاري الإرسال...' : 'Submitting...')
                  : (isAr ? 'إرسال التقييم' : 'Submit Rating')}
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-2xl font-bold text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isAr ? 'تذكيري لاحقاً' : 'Maybe Later'}
              </button>
            </div>
          </>
        ) : (
          /* Thank You Screen */
          <div className="py-8 text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-4xl mb-4">
              🎉
            </div>
            <h4 className="text-2xl font-black text-white">
              {isAr ? 'شكراً لتقييمك!' : 'Thank You!'}
            </h4>
            <p className="text-sm font-semibold text-slate-300 mt-2">
              {isAr
                ? 'نقدر جداً رأيك، ونسعى دائماً لجعل تجربة 11PLAYERS الأفضل على الإطلاق.'
                : 'We appreciate your feedback and are constantly improving 11PLAYERS for you.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
