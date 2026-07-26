"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Lock, Sparkles, Loader2, Check } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import toast from "react-hot-toast";

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCommunityId: string) => void;
}

export default function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(isAr ? "يرجى إدخال اسم المجتمع" : "Please enter a community name");
      return;
    }
    if (isPrivate && !password.trim()) {
      toast.error(isAr ? "يرجى إدخال كلمة مرور للمجتمع الخاص" : "Please set a password for private community");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "communities"), {
        name: name.trim(),
        description: description.trim(),
        adminUid: user?.uid || "",
        isPrivate,
        password: isPrivate ? password.trim() : "",
        createdAt: new Date().toISOString(),
        createdTimestamp: serverTimestamp(),
      });

      toast.success(isAr ? `تم إنشاء مجتمع "${name}" بنجاح!` : `Community "${name}" created successfully!`);
      setName("");
      setDescription("");
      setPassword("");
      setIsPrivate(false);
      onSuccess(docRef.id);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إنشاء المجتمع" : "Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl z-10 p-6 md:p-8"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Top glow accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rtl:left-5 rtl:right-auto p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {isAr ? "إنشاء مجتمع كروي جديد" : "Create New Football Community"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isAr ? "أضف مجتمعاً مخصصاً لإدارة المباريات والإحصائيات" : "Add a custom community to host matches and player stats"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Community Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {isAr ? "اسم المجتمع *" : "Community Name *"}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? "مثال: رابطة أبطال القاهرة" : "e.g. Cairo Champions League"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {isAr ? "وصف المجتمع" : "Description"}
              </label>
              <textarea
                rows={3}
                placeholder={isAr ? "اكتب نبذة عن مجتمعك ومواعيد المباريات..." : "Describe your community, match schedules..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Privacy toggle */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${isPrivate ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"}`}>
                  {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-black text-white">
                    {isPrivate ? (isAr ? "مجتمع خاص" : "Private Community") : (isAr ? "مجتمع عام" : "Public Community")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isPrivate
                      ? (isAr ? "يتطلب كلمة مرور للانضمام" : "Requires a password to join")
                      : (isAr ? "مفتوح لجميع لاعبي المنصة" : "Open for all platform players")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-12 h-7 rounded-full transition-colors ${isPrivate ? "bg-amber-500" : "bg-slate-700"}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${isPrivate ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* Password input if private */}
            {isPrivate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                  {isAr ? "كلمة مرور الانضمام *" : "Join Password *"}
                </label>
                <input
                  type="password"
                  required={isPrivate}
                  placeholder={isAr ? "أنشئ كلمة مرور" : "Create password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </motion.div>
            )}

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{isAr ? "تأكيد وإنشاء المجتمع" : "Confirm & Create Community"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
