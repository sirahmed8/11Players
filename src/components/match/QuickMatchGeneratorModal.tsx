"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export interface QuickMatchGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickMatchGeneratorModal: React.FC<QuickMatchGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [matchFormat, setMatchFormat] = useState<"5v5" | "8v8" | "11v11">("11v11");
  const [turfType, setTurfType] = useState<string>("Natural Grass");

  if (!isOpen) return null;

  const handleLaunch = () => {
    onClose();
    router.push("/match/draft");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/95 text-slate-100 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Quick Match Generator</h3>
                <p className="text-slate-400 text-xs">Rapid squad setup & PES auto-balancer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Match Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(["5v5", "8v8", "11v11"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setMatchFormat(fmt)}
                    className={`py-3 rounded-xl font-black text-sm border transition-all ${
                      matchFormat === fmt
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Turf Pitch Type</label>
              <div className="grid grid-cols-2 gap-2">
                {["Natural Grass", "Artificial Turf 3G", "Indoor Futsal", "Floodlight Arena"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTurfType(t)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border text-left transition-all flex items-center justify-between ${
                      turfType === t
                        ? "bg-slate-800 border-emerald-500 text-emerald-400"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{t}</span>
                    {turfType === t && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              Launch Draft Room <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickMatchGeneratorModal;
