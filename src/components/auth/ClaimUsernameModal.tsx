"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useLocale } from "@/components/ui/ThemeProvider";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cleanUsername, validateUsernameFormat, checkUsernameAvailability, generateUsernameSuggestions } from "@/lib/username";
import { AtSign, Check, Loader2, AlertCircle, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";

export default function ClaimUsernameModal() {
  const { user } = useAuth();
  const { userProfile, setUserProfile } = useAuthProfile(user);
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [inputVal, setInputVal] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Evaluate localStorage dynamically so auth loading resolution immediately hides modal
  const isLocallyClaimed = typeof window !== "undefined" && Boolean(
    (user?.uid && localStorage.getItem(`claimed_username_${user.uid}`)) ||
    (user?.email && localStorage.getItem(`claimed_username_${user.email}`)) ||
    localStorage.getItem("claimed_username_global")
  );

  const hasUsername = Boolean(userProfile?.username || isLocallyClaimed || dismissed);
  const isMissingUsername = Boolean(user && userProfile && !hasUsername);

  useEffect(() => {
    if (userProfile && !userProfile.username && !isLocallyClaimed) {
      const initialSuggestions = generateUsernameSuggestions(
        userProfile.fullName || user?.displayName || undefined,
        userProfile.cardName || undefined,
        user?.email || undefined
      );
      setSuggestions(initialSuggestions);
      if (initialSuggestions.length > 0) {
        setInputVal(initialSuggestions[0]);
      }
    }
  }, [userProfile, user, isLocallyClaimed]);

  // Live debounced availability check
  useEffect(() => {
    if (!inputVal) {
      setAvailable(null);
      setErrorMsg("");
      return;
    }

    const cleaned = cleanUsername(inputVal);
    const format = validateUsernameFormat(cleaned);
    if (!format.valid) {
      setAvailable(false);
      setErrorMsg(isAr ? format.errorAr || "تنسيق غير صالح" : format.errorEn || "Invalid format");
      setChecking(false);
      return;
    }

    let isMounted = true;
    setChecking(true);
    setErrorMsg("");

    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(cleaned, user?.uid, user?.email || undefined);
      if (isMounted) {
        setChecking(false);
        setAvailable(res.available);
        if (!res.available) {
          setErrorMsg(isAr ? res.errorAr || "غير متاح" : res.errorEn || "Not available");
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [inputVal, isAr, user?.uid, user?.email]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      if (user?.uid) localStorage.setItem(`claimed_username_${user.uid}`, "skipped");
      if (user?.email) localStorage.setItem(`claimed_username_${user.email}`, "skipped");
      localStorage.setItem("claimed_username_global", "skipped");
    }
    setDismissed(true);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleaned = cleanUsername(inputVal);

    if (!available || checking) return;

    setSubmitting(true);
    try {
      // 1. Save to main user document in Firestore
      await setDoc(doc(db, "players", user.uid), { username: cleaned }, { merge: true });

      // 2. Query any existing docs by email to update them as well
      if (user.email) {
        try {
          const q = query(collection(db, "players"), where("email", "==", user.email));
          const querySnap = await getDocs(q);
          for (const docSnap of querySnap.docs) {
            await setDoc(doc(db, "players", docSnap.id), { username: cleaned }, { merge: true });
          }
        } catch (e) {
          console.error("Sync handle by email failed:", e);
        }
      }

      // 3. Store in localStorage keys
      if (typeof window !== "undefined") {
        localStorage.setItem(`claimed_username_${user.uid}`, cleaned);
        if (user.email) localStorage.setItem(`claimed_username_${user.email}`, cleaned);
        localStorage.setItem("claimed_username_global", cleaned);
      }
      setDismissed(true);

      // 4. Update local state
      if (setUserProfile) {
        setUserProfile((prev: any) => ({ ...prev, username: cleaned }));
      }

      toast.success(isAr ? `مرحباً بك! تم تعيين اسم المستخدم @${cleaned} بنجاح 🎉` : `Welcome! Username @${cleaned} claimed successfully 🎉`);
    } catch (err) {
      console.error("Failed to claim username:", err);
      toast.error(isAr ? "فشل حفظ اسم المستخدم" : "Failed to save username");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMissingUsername) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-955/85 backdrop-blur-2xl" dir={isAr ? "rtl" : "ltr"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 overflow-hidden text-white space-y-6"
        >
          {/* Close / Skip Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all cursor-pointer z-30"
            title={isAr ? "إغلاق" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Ambient Lighting FX */}
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

          {/* FUT Top Icon Badge */}
          <div className="text-center space-y-3 relative z-10">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-20 h-20 mx-auto flex items-center justify-center"
            >
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/40 via-teal-500/30 to-emerald-600/40 blur-xl animate-pulse" />
              
              {/* Main Badge Frame */}
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 p-[2px] shadow-2xl shadow-emerald-500/40">
                <div className="w-full h-full bg-slate-950/90 rounded-[22px] backdrop-blur-md flex items-center justify-center border border-emerald-400/20">
                  <AtSign className="w-9 h-9 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                </div>
              </div>

              {/* Verified Mini Badge */}
              <div className="absolute -bottom-1 -right-1 bg-slate-950 border border-emerald-400/50 p-1 rounded-full text-emerald-400 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </motion.div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">
                {isAr ? "اختر اسم المستخدم الفريد" : "Claim Your Unique Username"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium mt-1 max-w-sm mx-auto">
                {isAr
                  ? "يسمح لك اسم المستخدم (@username) بمشاركة رابط ملفك الشخصي بسهولة والظهور في البحث."
                  : "Your unique handle (@username) lets friends search for you easily and gives you a clean, shareable profile link."}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleClaim} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <span>{isAr ? "اسم المستخدم" : "Username Handle"}</span>
                <span className="text-rose-400">*</span>
              </label>

              {/* Single Input Box Architecture — Matches Global Search Box 100% */}
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-lg select-none pointer-events-none z-10 rtl:left-auto rtl:right-4">
                  @
                </span>

                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(cleanUsername(e.target.value))}
                  placeholder="e.g. omda_7"
                  className={`w-full pl-10 rtl:pl-28 rtl:pr-10 pr-28 py-3.5 bg-slate-900/80 border rounded-2xl text-sm md:text-base font-bold text-white placeholder-slate-500 outline-none focus:outline-none focus-visible:outline-none transition-all duration-300 ${
                    errorMsg
                      ? "border-rose-500/80 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      : available === true
                      ? "border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      : "border-slate-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  }`}
                  dir="ltr"
                />

                {/* Status Badge — Positioned inside single input */}
                <div className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center">
                  <AnimatePresence mode="wait">
                    {checking && (
                      <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      </motion.div>
                    )}
                    {!checking && available === true && (
                      <motion.div
                        key="available"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-black px-2.5 py-1 rounded-xl border border-emerald-500/40"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{isAr ? "متاح" : "Available"}</span>
                      </motion.div>
                    )}
                    {!checking && available === false && (
                      <motion.div
                        key="taken"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 bg-rose-500/20 text-rose-400 text-xs font-bold px-2.5 py-1 rounded-xl border border-rose-500/40"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{isAr ? "غير متاح" : "Taken"}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold text-rose-400 px-1"
                >
                  {errorMsg}
                </motion.p>
              )}
            </div>

            {/* Quick Suggestions Pills */}
            {suggestions.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? "مقترحات سريعة لك:" : "Suggested for you:"}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug) => (
                    <motion.button
                      key={sug}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => setInputVal(sug)}
                      className={`text-xs font-extrabold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        inputVal === sug
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/30"
                          : "bg-slate-800/90 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      @{sug}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={available && !checking && !submitting ? { scale: 1.02 } : {}}
              whileTap={available && !checking && !submitting ? { scale: 0.98 } : {}}
              type="submit"
              disabled={!available || checking || submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isAr ? "جاري الحفظ..." : "Claiming Username..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>{isAr ? `تأكيد وحفظ @${cleanUsername(inputVal) || "username"}` : `Claim @${cleanUsername(inputVal) || "username"}`}</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
