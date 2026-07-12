"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, deleteDoc, getDoc, writeBatch, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useLocale } from "@/components/ThemeProvider";
import { useCommunity } from "@/contexts/CommunityContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import ConfirmModal from "@/components/ConfirmModal";
import { getAllPlayerCommunities } from "@/lib/playerUtils";
import { Edit3, Check, X } from "lucide-react";

export default function PendingEdits() {
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const { isOwner } = useAuth();
  const isAr = locale === "ar";
  const [edits, setEdits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewingEdit, setReviewingEdit] = useState<any | null>(null);
  const [reviewFormData, setReviewFormData] = useState<any>({});

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    let communityEdits: any[] = [];
    let globalEdits: any[] = [];
    
    const merge = () => {
      setEdits([...communityEdits, ...globalEdits]);
      setLoading(false);
    };

    if (activeCommunityId) {
      const q = query(collection(db, `communities/${activeCommunityId}/editRequests`), where("status", "==", "pending"));
      unsubs.push(onSnapshot(q, (snapshot) => {
        communityEdits = snapshot.docs.map(d => ({ id: d.id, _collection: `communities/${activeCommunityId}/editRequests`, ...d.data() }));
        merge();
      }));
    }

    if (isOwner) {
      const q2 = query(collection(db, 'editRequests'), where("status", "==", "pending"));
      unsubs.push(onSnapshot(q2, (snapshot) => {
        globalEdits = snapshot.docs.map(d => ({ id: d.id, _collection: 'editRequests', ...d.data() }));
        merge();
      }));
    }

    if (!activeCommunityId && !isOwner) {
      setLoading(false);
    }

    return () => unsubs.forEach(u => u());
  }, [activeCommunityId, isOwner]);

  const applyApproval = async (edit: any, modifiedData?: any) => {
    const collectionPath = edit._collection || (activeCommunityId ? `communities/${activeCommunityId}/editRequests` : 'editRequests');
    const editCommunityId = activeCommunityId || null;

    try {
      const playerRef = doc(db, "players", edit.playerId);
      const playerSnap = await getDoc(playerRef);
      const playerData = playerSnap.exists() ? playerSnap.data() : {};
      
      const targetProfileData = modifiedData?.profileData || edit.profileData || {};
      const targetAttributes = modifiedData?.attributes || edit.attributes;
      const targetStats = modifiedData?.stats || edit.stats;

      const pos = targetProfileData.primaryPosition || playerData.primaryPosition || "CMF";
      const style = targetProfileData.playStyle || playerData.playStyle || "";

      const updateDataGlobal: any = { ...targetProfileData };
      const updateDataComm: any = { ...targetProfileData };

      if (targetAttributes) {
        const mergedAttr = { ...(playerData.attributes || {}), ...targetAttributes };
        const newOverall = calculateRealisticOverall(mergedAttr, pos, style);
        updateDataGlobal.attributes = mergedAttr;
        updateDataGlobal.approvedAttributes = mergedAttr;
        updateDataGlobal.overallRating = newOverall;
        updateDataComm.attributes = mergedAttr;
        updateDataComm.approvedAttributes = mergedAttr;
        updateDataComm.overallRating = newOverall;
      } else if (Object.keys(targetProfileData).length > 0) {
        // Recalculate overall if position changed
        const newOverall = calculateRealisticOverall(playerData.attributes || {}, pos, style);
        updateDataGlobal.overallRating = newOverall;
        updateDataComm.overallRating = newOverall;
      }

      const resolvedCommId = editCommunityId || null;
      if (targetStats && resolvedCommId) {
        updateDataGlobal[`communityStats.${resolvedCommId}`] = targetStats;
        updateDataComm.stats = targetStats;
      }
      
      const batch = writeBatch(db);
      if (Object.keys(updateDataGlobal).length > 0) {
        batch.set(playerRef, updateDataGlobal, { merge: true });
      }
      if (Object.keys(updateDataComm).length > 0) {
        const commIds = getAllPlayerCommunities(playerData, resolvedCommId);
        for (const commId of commIds) {
          const commPlayerRef = doc(db, `communities/${commId}/players`, edit.playerId);
          batch.set(commPlayerRef, updateDataComm, { merge: true });
        }
      }
      batch.delete(doc(db, collectionPath, edit.id));
      await batch.commit();

      // Notify player about approval
      try {
        await setDoc(doc(collection(db, `users/${edit.playerId}/notifications`)), {
          type: 'stats',
          title: isAr ? 'تمت الموافقة على تعديلاتك!' : 'Profile Edits Approved!',
          body: isAr ? 'تمت مراجعة طلب تعديل ملفك الشخصي والموافقة عليه بنجاح.' : 'Your requested profile/attributes updates have been approved and applied.',
          read: false,
          createdAt: new Date(),
          link: '/profile'
        });
      } catch (err) {
        console.warn("Player notification send warning:", err);
      }

      toast.success(isAr ? "تمت الموافقة على التعديل وتحديث الملف الشخصي بنجاح!" : "Edit approved and profile updated successfully!");
      setReviewingEdit(null);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "خطأ في الموافقة على التعديل." : "Error approving edit.");
    }
  };

  const handleApprove = (edit: any) => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "موافقة على التعديل" : "Approve Edit",
      message: isAr ? "هل أنت متأكد من الموافقة على هذا التعديل؟" : "Are you sure you want to approve this edit?",
      onConfirm: () => applyApproval(edit)
    });
  };

  const handleOpenReview = (edit: any) => {
    setReviewingEdit(edit);
    setReviewFormData({
      fullName: edit.profileData?.fullName || edit.playerName || "",
      cardName: edit.profileData?.cardName || edit.cardName || "",
      primaryPosition: edit.profileData?.primaryPosition || "CMF",
      height: edit.profileData?.height || 175,
      weight: edit.profileData?.weight || 70,
      profileData: { ...(edit.profileData || {}) },
      attributes: edit.attributes ? { ...edit.attributes } : undefined,
      stats: edit.stats ? { ...edit.stats } : undefined
    });
  };

  const handleReject = (edit: any) => {
    const collPath = edit._collection || (activeCommunityId ? `communities/${activeCommunityId}/editRequests` : 'editRequests');
    setConfirmModal({
      isOpen: true,
      title: isAr ? "رفض التعديل" : "Reject Edit",
      message: isAr ? "هل أنت متأكد من رفض هذا التعديل؟" : "Are you sure you want to reject this edit?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, collPath, edit.id));
          // Notify player about rejection
          try {
            await setDoc(doc(collection(db, `users/${edit.playerId}/notifications`)), {
              type: 'system',
              title: isAr ? 'تحديث بشأن طلب التعديل' : 'Profile Edit Update',
              body: isAr ? 'لم تتم الموافقة على طلب تعديل ملفك الشخصي في الوقت الحالي.' : 'Your requested profile edit was not approved at this time.',
              read: false,
              createdAt: new Date(),
              link: '/profile'
            });
          } catch (e) {
            console.warn(e);
          }
          toast.success(isAr ? "تم رفض التعديل." : "Edit rejected.");
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "خطأ في رفض التعديل." : "Error rejecting edit.");
        }
      }
    });
  };

  if (loading || edits.length === 0) return null;

  return (
    <div className="mb-8 p-6 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
        <span className="text-amber-500">⚠️</span> {isAr ? "طلبات تعديل الملفات الشخصية والقدرات المعلقة" : "Pending Profile & Stats Edits"} ({edits.length})
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
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {edit.playerName || edit.profileData?.fullName}
                  {edit.profileData?.cardName && (
                    <span className="text-xs bg-amber-500/20 text-amber-500 font-black px-2 py-0.5 rounded">
                      {edit.profileData.cardName}
                    </span>
                  )}
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-2">
                  {edit.profileData && Object.keys(edit.profileData).length > 0 && (
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2.5 py-0.5 rounded font-bold text-xs">
                      {isAr ? "البيانات الشخصية" : "Profile Details"}
                    </span>
                  )}
                  {edit.attributes && (
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 rounded font-bold text-xs">
                      {isAr ? "القدرات" : "Attributes"}
                    </span>
                  )}
                  {edit.stats && (
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded font-bold text-xs">
                      {isAr ? "الإحصائيات" : "Stats"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? "تم الطلب في:" : "Requested at:"} {new Date(edit.requestedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleOpenReview(edit)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  {isAr ? "مراجعة وتعديل" : "Review & Edit"}
                </button>
                <button
                  onClick={() => handleApprove(edit)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1.5 text-sm"
                >
                  <Check className="w-4 h-4" />
                  {isAr ? "موافقة" : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(edit)}
                  className="px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 text-sm"
                >
                  <X className="w-4 h-4" />
                  {isAr ? "رفض" : "Reject"}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Review & Edit Modal */}
      {reviewingEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" />
              {isAr ? "مراجعة وتعديل طلب اللاعب" : "Review & Edit Player Request"}
            </h4>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {isAr ? "الاسم الكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={reviewFormData.fullName}
                  onChange={e => setReviewFormData({
                    ...reviewFormData,
                    fullName: e.target.value,
                    profileData: { ...reviewFormData.profileData, fullName: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {isAr ? "اسم البطاقة" : "Card Name"}
                  </label>
                  <input
                    type="text"
                    value={reviewFormData.cardName}
                    onChange={e => setReviewFormData({
                      ...reviewFormData,
                      cardName: e.target.value,
                      profileData: { ...reviewFormData.profileData, cardName: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {isAr ? "المركز الأساسي" : "Primary Position"}
                  </label>
                  <input
                    type="text"
                    value={reviewFormData.primaryPosition}
                    onChange={e => setReviewFormData({
                      ...reviewFormData,
                      primaryPosition: e.target.value,
                      profileData: { ...reviewFormData.profileData, primaryPosition: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setReviewingEdit(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => applyApproval(reviewingEdit, reviewFormData)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
              >
                {isAr ? "موافقة وتطبيق التعديلات" : "Approve & Apply Edits"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
