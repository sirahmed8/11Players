"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useLocale } from "@/components/ThemeProvider";
import { useCommunity } from "@/contexts/CommunityContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingEdits() {
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [edits, setEdits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCommunityId) return;
    const q = query(collection(db, `communities/${activeCommunityId}/editRequests`), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEdits(pending);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeCommunityId]);

  const handleApprove = async (edit: any) => {
    if (!activeCommunityId) return;
    if (!confirm(isAr ? "هل أنت متأكد من الموافقة على هذا التعديل؟" : "Are you sure you want to approve this edit?")) return;
    try {
      const updateData: any = {};
      if (edit.attributes) {
        updateData.attributes = edit.attributes;
      }
      if (edit.stats) {
        updateData[`communityStats.${activeCommunityId}`] = edit.stats;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, "players", edit.playerId), updateData);
      }
      await deleteDoc(doc(db, `communities/${activeCommunityId}/editRequests`, edit.id));
      toast.success(isAr ? "تمت الموافقة على التعديل بنجاح!" : "Edit approved successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "خطأ في الموافقة على التعديل." : "Error approving edit.");
    }
  };

  const handleReject = async (edit: any) => {
    if (!activeCommunityId) return;
    if (!confirm(isAr ? "هل أنت متأكد من رفض هذا التعديل؟" : "Are you sure you want to reject this edit?")) return;
    try {
      await deleteDoc(doc(db, `communities/${activeCommunityId}/editRequests`, edit.id));
      toast.success(isAr ? "تم رفض التعديل." : "Edit rejected.");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "خطأ في رفض التعديل." : "Error rejecting edit.");
    }
  };

  if (loading) return <div className="text-center py-4">Loading pending edits...</div>;
  if (edits.length === 0) return null;

  return (
    <div className="mb-8 p-6 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
        <span className="text-amber-500">⚠️</span> {isAr ? "تعديلات معلقة" : "Pending Profile Edits"} ({edits.length})
      </h3>
      <div className="space-y-4">
        <AnimatePresence>
          {edits.map(edit => (
            <motion.div
              key={edit.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{edit.playerName}</p>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {edit.attributes && <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded mr-2">{isAr ? "القدرات" : "Attributes"}</span>}
                  {edit.stats && <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">{isAr ? "الإحصائيات" : "Stats"}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? "طلب في:" : "Requested at:"} {new Date(edit.requestedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(edit)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  {isAr ? "موافقة" : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(edit)}
                  className="px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  {isAr ? "رفض" : "Reject"}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
