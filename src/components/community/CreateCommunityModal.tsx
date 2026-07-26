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
              <motion.input
                whileFocus={{ scale: 1.01, borderColor: "rgba(16, 185, 129, 0.8)" }}
                transition={{ duration: 0.2 }}
                type="text"
                required
                placeholder={isAr ? "مثال: رابطة أبطال القاهرة" : "e.g. Cairo Champions League"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {isAr ? "وصف المجتمع" : "Description"}
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.01, borderColor: "rgba(16, 185, 129, 0.8)" }}
                transition={{ duration: 0.2 }}
                rows={3}
                placeholder={isAr ? "اكتب نبذة عن مجتمعك ومواعيد المباريات..." : "Describe your community, match schedules..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all resize-none shadow-inner"
              />
            </div>

            {/* Privacy toggle with animated switch */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 shadow-inner"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  key={isPrivate ? "private" : "public"}
                  initial={{ scale: 0.8, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`p-2.5 rounded-xl border ${isPrivate ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"}`}
                >
                  {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </motion.div>
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
                className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${isPrivate ? "bg-amber-500" : "bg-slate-800 border border-slate-700"}`}
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] ${isPrivate ? "ml-auto" : "mr-auto"}`}
                >
                  {isPrivate ? "🔒" : "🌐"}
                </motion.span>
              </button>
            </motion.div>

            {/* Password input if private */}
            <AnimatePresence>
              {isPrivate && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                    {isAr ? "كلمة مرور المجتمع *" : "Community Password *"}
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01, borderColor: "rgba(245, 158, 11, 0.8)" }}
                    transition={{ duration: 0.2 }}
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
