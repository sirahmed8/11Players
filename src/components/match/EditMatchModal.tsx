"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";
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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && matchData?.config) {
      setDate(matchData.config.date || "");
      setTime(matchData.config.time || "");
      setStartTime(matchData.config.startTime || "");
      setEndTime(matchData.config.endTime || "");
      setLocation(matchData.config.location || "");
      setCost(matchData.config.cost || "");
      setNotes(matchData.config.notes || "");
    }
  }, [isOpen, matchData]);

  const handleApplyPresetDuration = (hours: number) => {
    const start = startTime || "08:00 PM";
    const computedEnd = addHoursTo12hTime(start, hours);
    setStartTime(start);
    setEndTime(computedEnd);
    setTime(`${start} - ${computedEnd}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const matchRef1 = doc(db, "communities", communityId, "matches", "latest");
      const matchRef2 = doc(db, "communities", communityId, "matches", matchData.id);
      
      const finalTime = (startTime && endTime) ? `${startTime} - ${endTime}` : time;

      const updatedConfig = {
        ...matchData.config,
        date,
        time: finalTime,
        startTime,
        endTime,
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

  function addHoursTo12hTime(start: string, hoursToAdd: number): string {
    if (!start) return "";
    const parts = start.trim().split(" ");
    if (parts.length !== 2) return start;
    let [timePart, period] = parts;
    let [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);

    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    const totalMins = h * 60 + m + Math.round(hoursToAdd * 60);
    let newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;

    let newPeriod = "AM";
    if (newH >= 12) {
      newPeriod = "PM";
      if (newH > 12) newH -= 12;
    } else if (newH === 0) {
      newH = 12;
    }

    const newHStr = newH.toString().padStart(2, "0");
    const newMStr = newM.toString().padStart(2, "0");
    return `${newHStr}:${newMStr} ${newPeriod}`;
  }

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
            className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 text-white"
          >
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">
              {isAr ? "تعديل وقت وحجز المباراة" : "Edit Hagaz Time & Details"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "التاريخ" : "Date"}</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300" />
              </div>

              {/* Time Range Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "من الساعة (البداية)" : "From (Start Time)"}</label>
                  <input type="text" placeholder="08:00 PM" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "إلى الساعة (النهاية)" : "To (End Time)"}</label>
                  <input type="text" placeholder="10:00 PM" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                </div>
              </div>

              {/* Quick Duration Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{isAr ? "مدة الحجز السريعة" : "Quick Duration"}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { hours: 1, labelAr: "ساعة", labelEn: "1 Hour" },
                    { hours: 1.5, labelAr: "ساعة ونصف", labelEn: "1.5 Hrs" },
                    { hours: 2, labelAr: "ساعتين", labelEn: "2 Hours" },
                    { hours: 3, labelAr: "3 ساعات", labelEn: "3 Hours" },
                  ].map((d) => (
                    <button
                      key={d.hours}
                      type="button"
                      onClick={() => handleApplyPresetDuration(d.hours)}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-xs font-bold transition-all text-slate-300"
                    >
                      {isAr ? d.labelAr : d.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "الملعب" : "Location"}</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "التكلفة" : "Cost"}</label>
                <input type="text" value={cost} onChange={e => setCost(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{isAr ? "ملاحظات" : "Notes"}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300" />
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
