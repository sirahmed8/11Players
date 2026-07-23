"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, CheckCircle, X, ShieldAlert } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  icon?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = true,
  icon
}: ConfirmModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          dir={isAr ? "rtl" : "ltr"}
          className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border ${
            isDestructive 
              ? "border-red-500/30 dark:border-red-500/20 shadow-red-500/10" 
              : "border-emerald-500/30 dark:border-emerald-500/20 shadow-emerald-500/10"
          } overflow-hidden z-10`}
        >
          {/* Subtle Glow Background Effect */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isDestructive ? "bg-red-500/10 dark:bg-red-500/15" : "bg-emerald-500/10 dark:bg-emerald-500/15"
          }`} />

          {/* Close Button */}
          <button
            onClick={loading ? undefined : onClose}
            disabled={loading}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            {/* Icon Box */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg ${
              isDestructive
                ? "bg-gradient-to-br from-red-500/20 to-red-600/30 text-red-600 dark:text-red-400 border border-red-500/30"
                : "bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            }`}>
              {icon || (isDestructive ? <ShieldAlert className="w-8 h-8 animate-pulse" /> : <CheckCircle className="w-8 h-8" />)}
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
              {title}
            </h3>

            {/* Message Body */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-1/2 px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {cancelText || (isAr ? "إلغاء" : "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={loading}
                className={`w-full sm:w-1/2 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isDestructive
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/30"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30"
                }`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{confirmText || (isAr ? "تأكيد" : "Confirm")}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
