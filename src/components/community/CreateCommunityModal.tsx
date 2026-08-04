"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Lock, Sparkles, Loader2, Check, Plus } from "lucide-react";
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
      {isOpen && (
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
          className="relative w-full max-w-lg overflow-hidden rounded-3xl backdrop-blur-2xl bg-slate-900/90 border border-slate-800/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 p-6 md:p-8"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Top glow accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {isAr ? "إنشاء مجتمع كروي جديد" : "Create New Community"}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr ? "احصل على رابط ورقم سري خاص بمجموعتك الكروية" : "Get a unique URL & code for your football group"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
                className="w-full px-4, py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
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

            {/* Privacy toggle card */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={`p-4 rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
                isPrivate
                  ? "bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10"
                  : "bg-slate-950/80 border-slate-800"
              }`}
            >
              <div
                className="flex items-center justify-between gap-4 cursor-pointer select-none"
                onClick={() => setIsPrivate(!isPrivate)}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    layout
                    key={isPrivate ? "private" : "public"}
                    initial={{ scale: 0.7, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className={`p-2.5 rounded-xl border ${
                      isPrivate
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-inner"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  </motion.div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {isPrivate
                        ? (isAr ? "مجتمع خاص (كلمة مرور)" : "Private Community (Password)")
                        : (isAr ? "مجتمع عام (مفتوح للجميع)" : "Public Community (Open)")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isPrivate
                        ? (isAr ? "يتطلب كلمة سر للانضمام" : "Requires password to join")
                        : (isAr ? "يمكن لأي لاعب الانضمام مباشرة" : "Anyone can join immediately")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPrivate(!isPrivate);
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                    isPrivate ? "bg-amber-500 shadow-md shadow-amber-500/30" : "bg-slate-700"
                  }`}
                >
                  <motion.div
                    animate={{ x: isPrivate ? (isAr ? -24 : 24) : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 left-1 rtl:right-1 rtl:left-auto w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center"
                  />
                </button>
              </div>

              {/* Password input */}
              <AnimatePresence initial={false}>
                {isPrivate && (
                  <motion.div
                    key="modal-password-field"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-slate-800/80">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit button */}
            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
