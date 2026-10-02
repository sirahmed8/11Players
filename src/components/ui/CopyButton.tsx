"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface CopyButtonProps {
  text: string;
  labelEn?: string;
  labelAr?: string;
  isAr?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default function CopyButton({
  text,
  labelEn = "Copy",
  labelAr = "نسخ",
  isAr = false,
  className = "",
  size = "md",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(isAr ? "تم النسخ إلى الحافظة!" : "Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isAr ? "فشل النسخ" : "Failed to copy");
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
        copied
          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
          : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-white"
      } ${isSmall ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs font-bold"} ${className}`}
      title={isAr ? labelAr : labelEn}
      aria-label={isAr ? labelAr : labelEn}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          </motion.div>
        )}
      </AnimatePresence>
      <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? labelAr : labelEn)}</span>
    </button>
  );
}
