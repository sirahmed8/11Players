"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/components/ThemeProvider";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
  communityId: string;
}

export default function EditMatchModal({ isOpen, onClose, matchData, communityId }: EditMatchModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && matchData?.config) {
      setDate(matchData.config.date || "");
      setTime(matchData.config.time || "");
      setLocation(matchData.config.location || "");
      setCost(matchData.config.cost || "");
      setNotes(matchData.config.notes || "");
    }
  }, [isOpen, matchData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const matchRef1 = doc(db, "communities", communityId, "matches", "latest");
      const matchRef2 = doc(db, "communities", communityId, "matches", matchData.id);
      
      const updatedConfig = {
        ...matchData.config,
        date,
        time,
        location,
        cost,
        notes
      };

      await updateDoc(matchRef1, { config: updatedConfig });
      await updateDoc(matchRef2, { config: updatedConfig });
      
      toast.success(isAr ? "تم تحديث تفاصيل المباراة بنجاح" : "Match details updated successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل التحديث" : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800"
          >
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">
              {isAr ? "تعديل تفاصيل المباراة" : "Edit Match Details"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "التاريخ" : "Date"}</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "الوقت" : "Time"}</label>
                <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "الملعب" : "Location"}</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "التكلفة" : "Cost"}</label>
                <input type="text" value={cost} onChange={e => setCost(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? "ملاحظات" : "Notes"}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
              >
                {isSaving ? "..." : (isAr ? "حفظ" : "Save")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
