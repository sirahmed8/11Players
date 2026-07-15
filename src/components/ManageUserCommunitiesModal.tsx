"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, writeBatch, arrayRemove, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { useLocale } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Trash2, Plus, ArrowRightLeft, ShieldAlert } from "lucide-react";
import type { PlayerProfile } from "@/types";

interface ManageUserCommunitiesModalProps {
  user: PlayerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  communitiesMap?: Record<string, string>;
  onRefresh?: () => void;
}

export default function ManageUserCommunitiesModal({
  user,
  isOpen,
  onClose,
  communitiesMap = {},
  onRefresh
}: ManageUserCommunitiesModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [allCommunities, setAllCommunities] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentCommIds, setCurrentCommIds] = useState<string[]>([]);
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});
  const [selectedAddComm, setSelectedAddComm] = useState<string>("");

  useEffect(() => {
    if (isOpen && user) {
      const comms = Array.from(
        new Set([
          ...(user.memberCommunities || []),
          ...(user.joinedCommunities || []),
          ...((user as any).communities || []),
          ...(user.activeCommunityId ? [user.activeCommunityId] : [])
        ].filter(Boolean))
      ) as string[];
      setCurrentCommIds(comms);

      const fetchComms = async () => {
        setLoading(true);
        try {
          const snap = await getDocs(collection(db, "communities"));
          const list = snap.docs.map(d => ({
            id: d.id,
            name: d.data().name || communitiesMap[d.id] || d.id
          }));
          setAllCommunities(list);
          if (list.length > 0) {
            setSelectedAddComm(list[0].id);
          }
        } catch (err) {
          console.error("Error fetching communities:", err);
          toast.error(isAr ? "فشل تحميل قائمة المجتمعات" : "Failed to load communities list");
        } finally {
          setLoading(false);
        }
      };
      fetchComms();
    }
  }, [isOpen, user, isAr, communitiesMap]);

  if (!isOpen || !user) return null;

  const handleRemoveFromCommunity = async (commId: string) => {
    if (!confirm(isAr ? `هل أنت متأكد من إزالة ${user.fullName} من هذا المجتمع؟` : `Are you sure you want to remove ${user.fullName} from this community?`)) {
      return;
    }
    setActionLoading(`remove-${commId}`);
    try {
      await deleteDoc(doc(db, "communities", commId, "players", user.uid));
      await updateDoc(doc(db, "players", user.uid), {
        memberCommunities: arrayRemove(commId),
        joinedCommunities: arrayRemove(commId),
        communities: arrayRemove(commId),
        ...(user.activeCommunityId === commId ? { activeCommunityId: null } : {})
      });

      setCurrentCommIds(prev => prev.filter(id => id !== commId));
      if (onRefresh) onRefresh();
      toast.success(isAr ? "تم إزالة المستخدم من المجتمع بنجاح" : "User removed from community successfully");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إزالة المستخدم من المجتمع" : "Failed to remove user from community");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToCommunity = async (commId: string) => {
    if (!commId) return;
    setActionLoading(`add-${commId}`);
    try {
      const cleanProfile: any = {
        ...user,
        role: "member",
        joinedAt: new Date().toISOString()
      };
      delete cleanProfile.pendingCommunities;
      delete cleanProfile.memberCommunities;
      delete cleanProfile.joinedCommunities;
      delete cleanProfile.communities;

      await setDoc(doc(db, "communities", commId, "players", user.uid), cleanProfile, { merge: true });
      await updateDoc(doc(db, "players", user.uid), {
        memberCommunities: arrayUnion(commId),
        joinedCommunities: arrayUnion(commId),
        communities: arrayUnion(commId),
        ...(!user.activeCommunityId ? { activeCommunityId: commId } : {})
      });

      setCurrentCommIds(prev => [...prev, commId]);
      if (onRefresh) onRefresh();
      toast.success(isAr ? "تمت إضافة المستخدم إلى المجتمع بنجاح" : "User added to community successfully");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إضافة المستخدم إلى المجتمع" : "Failed to add user to community");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveCommunity = async (fromCommId: string) => {
    const toCommId = moveTargets[fromCommId];
    if (!toCommId) {
      toast.error(isAr ? "يرجى اختيار المجتمع الهدف أولاً" : "Please select target community first");
      return;
    }
    if (fromCommId === toCommId) return;

    if (!confirm(isAr ? `هل أنت متأكد من نقل ${user.fullName} إلى المجتمع الجديد؟` : `Are you sure you want to move ${user.fullName} to the new community?`)) {
      return;
    }
    setActionLoading(`move-${fromCommId}`);
    try {
      const cleanProfile: any = {
        ...user,
        role: "member",
        joinedAt: new Date().toISOString()
      };
      delete cleanProfile.pendingCommunities;
      delete cleanProfile.memberCommunities;
      delete cleanProfile.joinedCommunities;
      delete cleanProfile.communities;

      await deleteDoc(doc(db, "communities", fromCommId, "players", user.uid));
      await setDoc(doc(db, "communities", toCommId, "players", user.uid), cleanProfile, { merge: true });

      const globalRef = doc(db, "players", user.uid);
      await updateDoc(globalRef, {
        memberCommunities: arrayRemove(fromCommId),
        joinedCommunities: arrayRemove(fromCommId),
        communities: arrayRemove(fromCommId)
      });
      await updateDoc(globalRef, {
        memberCommunities: arrayUnion(toCommId),
        joinedCommunities: arrayUnion(toCommId),
        communities: arrayUnion(toCommId),
        activeCommunityId: toCommId
      });

      setCurrentCommIds(prev => [...prev.filter(id => id !== fromCommId), toCommId]);
      if (onRefresh) onRefresh();
      toast.success(isAr ? "تم نقل المستخدم إلى المجتمع الجديد بنجاح" : "User moved to new community successfully");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل نقل المستخدم" : "Failed to move user");
    } finally {
      setActionLoading(null);
    }
  };

  const availableCommunities = allCommunities.filter(c => !currentCommIds.includes(c.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
          dir={isAr ? "rtl" : "ltr"}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {isAr ? "إدارة مجتمعات المستخدم" : "Manage User Communities"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.fullName} ({user.cardName})
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-slate-400 font-bold text-sm">
              {isAr ? "جاري تحميل قائمة المجتمعات..." : "Loading communities list..."}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Communities Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span>{isAr ? "المجتمعات الحالية المشترك بها" : "Current Communities"}</span>
                  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                    {currentCommIds.length}
                  </span>
                </h3>

                {currentCommIds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    {isAr ? "هذا المستخدم غير منضم لأي مجتمع حالياً." : "This user is not currently in any community."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {currentCommIds.map(commId => {
                      const commName = allCommunities.find(c => c.id === commId)?.name || communitiesMap[commId] || commId;
                      const isRemoving = actionLoading === `remove-${commId}`;
                      const isMoving = actionLoading === `move-${commId}`;

                      return (
                        <div key={commId} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {commName}
                            </span>
                            <button
                              onClick={() => handleRemoveFromCommunity(commId)}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white dark:text-red-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isRemoving ? (isAr ? "جاري الإزالة..." : "Removing...") : (isAr ? "إزالة من المجتمع" : "Remove")}</span>
                            </button>
                          </div>

                          {/* Move to another community control */}
                          {availableCommunities.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <select
                                value={moveTargets[commId] || ""}
                                onChange={e => setMoveTargets(prev => ({ ...prev, [commId]: e.target.value }))}
                                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                              >
                                <option value="">{isAr ? "اختر مجتمع للنقل إليه..." : "Select community to move to..."}</option>
                                {availableCommunities.map(ac => (
                                  <option key={ac.id} value={ac.id}>{ac.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleMoveCommunity(commId)}
                                disabled={!moveTargets[commId] || !!actionLoading}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>{isMoving ? (isAr ? "جاري النقل..." : "Moving...") : (isAr ? "نقل" : "Move")}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add to New Community Section */}
              {availableCommunities.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <span>{isAr ? "إضافة إلى مجتمع جديد" : "Add to Another Community"}</span>
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <select
                      value={selectedAddComm}
                      onChange={e => setSelectedAddComm(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">{isAr ? "اختر مجتمع للإضافة..." : "Select community to add..."}</option>
                      {availableCommunities.map(ac => (
                        <option key={ac.id} value={ac.id}>{ac.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddToCommunity(selectedAddComm)}
                      disabled={!selectedAddComm || !!actionLoading}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{actionLoading === `add-${selectedAddComm}` ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة للمجتمع" : "Add to Community")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
