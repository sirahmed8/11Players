"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useLocale } from "@/components/ui/ThemeProvider";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cleanUsername, validateUsernameFormat, checkUsernameAvailability, generateUsernameSuggestions } from "@/lib/username";
import { AtSign, Check, Loader2, Sparkles, User, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ClaimUsernameModal() {
  const { user } = useAuth();
  const { userProfile } = useAuthProfile(user);
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [inputVal, setInputVal] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Show modal only if user is logged in, profile exists, but username is missing
  const isMissingUsername = Boolean(user && userProfile && !userProfile.username);

  useEffect(() => {
    if (userProfile && !userProfile.username) {
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
  }, [userProfile, user]);

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
      const res = await checkUsernameAvailability(cleaned, user?.uid);
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
  }, [inputVal, isAr, user?.uid]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleaned = cleanUsername(inputVal);

    if (!available || checking) return;

    setSubmitting(true);
    try {
      await setDoc(doc(db, "players", user.uid), { username: cleaned }, { merge: true });
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
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl" dir={isAr ? "rtl" : "ltr"}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 overflow-hidden text-white space-y-6"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 mx-auto shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <AtSign className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
              <span>{isAr ? "اختر اسم المستخدم الفريد الخاص بك" : "Claim Your Unique Username"}</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {isAr
                ? "يسمح لك اسم المستخدم (@username) بمشاركة رابط ملفك الشخصي بسهولة والظهور في البحث."
                : "Your unique handle (@username) lets friends search for you easily and gives you a memorable clean profile link."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <span>{isAr ? "اسم المستخدم" : "Username Handle"}</span>
                <span className="text-rose-400">*</span>
              </label>
              <div
                className={`relative flex items-center bg-slate-950 border-2 rounded-2xl px-3.5 py-3 transition-all duration-300 ${
                  errorMsg
                    ? "border-rose-500/80 shadow-lg shadow-rose-500/10"
                    : available
                    ? "border-emerald-500/80 shadow-lg shadow-emerald-500/10"
                    : "border-slate-800 focus-within:border-emerald-500"
                }`}
              >
                <span className="text-emerald-400 font-black text-lg select-none mr-1.5 rtl:mr-0 rtl:ml-1.5">@</span>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(cleanUsername(e.target.value))}
                  placeholder="e.g. omda_7"
                  className="w-full bg-transparent text-white font-bold placeholder-slate-600 focus:outline-none text-base tracking-wide"
                  dir="ltr"
                />

                {/* Status Indicator */}
                <div className="flex items-center ml-2 rtl:ml-0 rtl:mr-2">
                  {checking && <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />}
                  {!checking && available === true && (
                    <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs font-black px-2 py-1 rounded-lg border border-emerald-500/40">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? "متاح" : "Available"}</span>
                    </div>
                  )}
                  {!checking && available === false && (
                    <div className="flex items-center gap-1 bg-rose-500/20 text-rose-400 text-xs font-bold px-2 py-1 rounded-lg border border-rose-500/40">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{isAr ? "غير متاح" : "Taken"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && <p className="text-xs font-semibold text-rose-400 mt-1">{errorMsg}</p>}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400">{isAr ? "مقترحات سريعة لك:" : "Suggested for you:"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setInputVal(sug)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                        inputVal === sug
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20"
                          : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-emerald-500/40 hover:text-white"
                      }`}
                    >
                      @{sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!available || checking || submitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isAr ? "جاري الحفظ..." : "Claiming Username..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{isAr ? `تأكيد وحفظ @${cleanUsername(inputVal) || "username"}` : `Claim @${cleanUsername(inputVal) || "username"}`}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
