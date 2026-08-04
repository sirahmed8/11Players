"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ui/ThemeProvider";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, Search, ArrowUpDown, Eye, Users, Sparkles, Shield, UserCheck, Activity, CheckSquare, Square, Filter, Check, Crown } from "lucide-react";
import { PlayerProfile } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import GlobalUserRow from "@/components/admin/GlobalUserRow";
import { getAllPlayerCommunities } from '@/lib/playerUtils';
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import ManageUserCommunitiesModal from "@/components/community/ManageUserCommunitiesModal";
import CustomDropdown from "@/components/ui/CustomDropdown";

export default function GlobalUsersTable() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [users, setUsers] = useState<PlayerProfile[]>([]);
  const usersRef = useRef(users);
  usersRef.current = users;

  const [communitiesMap, setCommunitiesMap] = useState<Record<string, string>>({});
  const [userCommMap, setUserCommMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'fullName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Selected UIDs for Bulk Operations Panel
  const [selectedUids, setSelectedUids] = useState<string[]>([]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const [manageCommModal, setManageCommModal] = useState<{
    open: boolean;
    user: PlayerProfile | null;
  }>({ open: false, user: null });

  const fetchUsers = useCallback(async () => {
    setLoading(usersRef.current.length === 0);
    try {
      const [usersSnap, commsSnap] = await Promise.all([
        getDocs(collection(db, "players")),
        getDocs(collection(db, "communities"))
      ]);

      const commMap: Record<string, string> = {};
      const uCommMap: Record<string, string[]> = {};
      const allUsersMap: Record<string, PlayerProfile> = {};

      usersSnap.docs.forEach(d => {
        const data = d.data();
        allUsersMap[d.id] = { uid: d.id, ...data } as PlayerProfile;
      });

      const communityRosterPromises = commsSnap.docs.map(async (cDoc) => {
        const cData = cDoc.data();
        commMap[cDoc.id] = cData.name || cDoc.id;
        if (cData.adminUid) {
          uCommMap[cData.adminUid] = Array.from(new Set([...(uCommMap[cData.adminUid] || []), cDoc.id]));
        }
        if (cData.ownerUid) {
          uCommMap[cData.ownerUid] = Array.from(new Set([...(uCommMap[cData.ownerUid] || []), cDoc.id]));
        }
        try {
          const pSnap = await getDocs(collection(db, "communities", cDoc.id, "players"));
          pSnap.docs.forEach(pDoc => {
            uCommMap[pDoc.id] = Array.from(new Set([...(uCommMap[pDoc.id] || []), cDoc.id]));
            if (!allUsersMap[pDoc.id]) {
              const pData = pDoc.data();
              allUsersMap[pDoc.id] = { uid: pDoc.id, ...pData } as PlayerProfile;
            }
          });
        } catch (e) {}
      });

      await Promise.all(communityRosterPromises);

      const combinedUsersList = Object.values(allUsersMap);
      setCommunitiesMap(commMap);
      setUserCommMap(uCommMap);
      setUsers(combinedUsersList);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل جلب المستخدمين" : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = (user: PlayerProfile) => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "حظر / حذف مستخدم" : "Ban / Delete User",
      message: isAr ? `هل أنت متأكد من حظر/حذف المستخدم (${user.fullName}) نهائياً؟` : `Are you sure you want to delete ${user.fullName}?`,
      onConfirm: async () => {
        try {
          const { writeBatch } = await import("firebase/firestore");
          const batch = writeBatch(db);

          if (user.memberCommunities && user.memberCommunities.length > 0) {
            user.memberCommunities.forEach(cId => {
              batch.delete(doc(db, "communities", cId, "players", user.uid));
            });
          }

          batch.delete(doc(db, "players", user.uid));
          await batch.commit();

          setUsers(prev => prev.filter(u => u.uid !== user.uid));
          setSelectedUids(prev => prev.filter(id => id !== user.uid));
          toast.success(isAr ? "تم حذف المستخدم من النظام" : "User completely deleted");
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "فشل حذف المستخدم" : "Failed to delete user");
        }
      }
    });
  };

  const handleApplyAIToSelectedUsers = (targetList: PlayerProfile[]) => {
    if (targetList.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: isAr ? "تطبيق الذكاء الاصطناعي على المحددين" : "Apply AI Best Choice to Selected",
      message: isAr
        ? `هل أنت متأكد من تحليل طاقات ${targetList.length} لاعب وتطبيق أفضل مركز وتكتيك لهم بالذكاء الاصطناعي؟`
        : `Analyze & apply AI position choices for ${targetList.length} selected players?`,
      onConfirm: async () => {
        try {
          const { writeBatch, doc } = await import("firebase/firestore");
          const { getTacticalSuggestions } = await import("@/lib/suggestionEngine");
          let count = 0;

          const batchSize = 350;
          for (let i = 0; i < targetList.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = targetList.slice(i, i + batchSize);

            chunk.forEach((p) => {
              const suggestions = getTacticalSuggestions(
                p.attributes,
                p.height || 175,
                p.weight || 70,
                p.preferredFoot || 'Right',
                p.calculatedAge,
                p.peerRatingAvg,
                p.peerRatingCount
              );

              const topChoice    = suggestions.positions[0];
              const secondChoice = suggestions.positions[1];
              const thirdChoice  = suggestions.positions[2];
              if (topChoice) {
                const bestPos    = topChoice.position;
                const secondPos  = secondChoice?.position || '';
                const thirdPos   = thirdChoice?.position || '';
                const bestStyle  = topChoice.bestPlayStyle || p.playStyle || 'Box-to-Box';

                const newOverall = calculateRealisticOverall(
                  p.attributes || ({} as any),
                  bestPos,
                  bestStyle,
                  p.height || 175,
                  p.weight || 70,
                  p.calculatedAge,
                  p.peerRatingAvg,
                  p.peerRatingCount,
                  p.preferredFoot || 'Right',
                  p.specialSkills || [],
                  p.stats
                );

                const updates: any = {
                  primaryPosition:   bestPos,
                  secondaryPosition: secondPos,
                  tertiaryPosition:  thirdPos,
                  playStyle:         bestStyle,
                  overallRating:     newOverall
                };

                batch.update(doc(db, 'players', p.uid), updates);
                count++;
              }
            });

            await batch.commit();
          }

          toast.success(isAr ? `تم تحديث ${count} لاعب بنجاح! ⚡` : `Updated ${count} players with AI! ⚡`);
          fetchUsers();
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "فشل تحديث المستخدمين" : "Failed to update users");
        }
      }
    });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectUser = (uid: string) => {
    setSelectedUids(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const toggleSelectAll = () => {
    if (selectedUids.length === paginatedUsers.length) {
      setSelectedUids([]);
    } else {
      setSelectedUids(paginatedUsers.map(u => u.uid));
    }
  };

  const handleTogglePro = useCallback(async (u: PlayerProfile, plan: 'pro_captain' | 'club_organizer' | 'free' = 'pro_captain') => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const isCurrentlyPro = u.subscription?.status === 'active';
      const displayName = (u as any).name || u.fullName || u.cardName || "Player";
      if (isCurrentlyPro && plan === 'free') {
        await updateDoc(doc(db, "players", u.uid), {
          "subscription.status": "inactive",
          "subscription.plan": "free"
        });
        toast.success(isAr ? `تم إلغاء تفعيل اشتراك ${displayName}` : `Subscription revoked for ${displayName}`);
      } else {
        await updateDoc(doc(db, "players", u.uid), {
          subscription: {
            plan: plan,
            status: "active",
            expiresAt: "2099-12-31T23:59:59Z",
            subscribedAt: new Date().toISOString(),
          }
        });
        const planName = plan === 'club_organizer' ? 'Club Organizer' : 'PRO Captain';
        toast.success(isAr ? `تم منح اشتراك ${planName} إلى ${displayName} مجاناً! 👑` : `${planName} Pass Granted to ${displayName}! 👑`);
      }
      fetchUsers();
    } catch (err) {
      console.error("Error toggling PRO status:", err);
      toast.error(isAr ? "فشل تغيير الاشتراك" : "Failed to toggle PRO status");
    }
  }, [fetchUsers, isAr]);

  const handleBulkGrantPro = useCallback(async () => {
    if (selectedUids.length === 0) return;
    try {
      const { doc, writeBatch } = await import("firebase/firestore");
      const batch = writeBatch(db);
      selectedUids.forEach(uid => {
        batch.set(doc(db, "players", uid), {
          subscription: {
            plan: "pro_captain",
            status: "active",
            expiresAt: "2099-12-31T23:59:59Z",
            subscribedAt: new Date().toISOString(),
          }
        }, { merge: true });
      });
      await batch.commit();
      toast.success(isAr ? `تم منح اشتراك PRO Captain لـ ${selectedUids.length} لاعب بنجاح! 👑` : `Granted PRO Captain Pass to ${selectedUids.length} players! 👑`);
      setSelectedUids([]);
      fetchUsers();
    } catch (err) {
      console.error("Bulk PRO grant error:", err);
      toast.error(isAr ? "فشل المنح المجمع" : "Bulk PRO grant failed");
    }
  }, [selectedUids, fetchUsers, isAr]);

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.fullName || '').toLowerCase().includes(q) || 
        (u.cardName || '').toLowerCase().includes(q) || 
        (u.username && u.username.toLowerCase().includes(q.replace(/^@/, ''))) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    if (roleFilter !== "all") {
      if (roleFilter === "owner") result = result.filter(u => (u as any).isOwner);
      else if (roleFilter === "admin") result = result.filter(u => (u as any).isAdmin || (u as any).isOwner);
      else if (roleFilter === "player") result = result.filter(u => !(u as any).isAdmin && !(u as any).isOwner);
    }
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortConfig.key] || "";
        const bVal = (b as any)[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [users, searchQuery, roleFilter, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, sortConfig]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full text-white" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header & Controls — Solid Dark Slate */}
      <div className="p-6 border-b border-slate-800 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-950">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-black">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>{isAr ? "دليل جميع لاعبي المنصة" : "All Platform Players Directory"}</span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-mono">
                {filteredUsers.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {isAr ? "إدارة الأدوار، الصلاحيات، وتطبيق تكتيكات الذكاء الاصطناعي" : "Manage roles, community memberships, and bulk AI choices"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder={isAr ? "البحث بالاسم أو الإيميل..." : "Search name or email..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 outline-none text-xs font-bold placeholder-slate-500"
            />
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-48">
            <CustomDropdown
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              isAr={isAr}
              options={[
                { value: "all", label: isAr ? "👑 جميع الرتب" : "👑 All Roles" },
                { value: "owner", label: isAr ? "👑 المالكين فقط" : "👑 Owners Only" },
                { value: "admin", label: isAr ? "⚡ المشرفين والمالكين" : "⚡ Admins & Owners" },
                { value: "player", label: isAr ? "👤 اللاعبين" : "👤 Players Only" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Panel (When users selected) */}
      <AnimatePresence>
        {selectedUids.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="bg-emerald-950/40 border-b border-emerald-500/40 p-4 px-6 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/30">
                {selectedUids.length}
              </span>
              <div>
                <span className="block text-xs font-black text-white">
                  {isAr ? `تم تحديد ${selectedUids.length} لاعب من المنصة` : `${selectedUids.length} platform players selected`}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {isAr ? "جاهز لإجراءات التحكم المجمعة بالذكاء الاصطناعي" : "Ready for bulk AI optimization & actions"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleBulkGrantPro()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>{isAr ? "منح PRO مجاناً للمحددين 👑" : "Grant PRO Pass to Selected 👑"}</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyAIToSelectedUsers(users.filter(u => selectedUids.includes(u.uid)))}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{isAr ? "تطبيق الذكاء الاصطناعي ⚡" : "Apply AI Choice ⚡"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedUids([])}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isAr ? "إلغاء التحديد" : "Clear Selection"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table View */}
      <div className="w-full overflow-x-auto rounded-none border-t border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full min-w-[950px] text-left rtl:text-right border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-black select-none">
              <th className="px-4 py-4 w-14 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="p-1 rounded-lg hover:bg-slate-900 transition-colors inline-flex items-center justify-center"
                  title={isAr ? "تحديد الكل" : "Select All"}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${
                      selectedUids.length > 0 && selectedUids.length === paginatedUsers.length
                        ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/30"
                        : "bg-slate-950 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {selectedUids.length > 0 && (
                      <Check className="w-3.5 h-3.5 stroke-[3] text-slate-950" />
                    )}
                  </div>
                </button>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-slate-900 transition-colors group min-w-[220px]"
                onClick={() => handleSort('fullName')}
              >
                <div className="flex items-center gap-2">
                  {isAr ? "اللاعب" : "Player"}
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
              </th>
              <th className="px-6 py-4 min-w-[200px]">{isAr ? "المركز والأسلوب" : "Position & Style"}</th>
              <th className="px-6 py-4 min-w-[180px]">{isAr ? "المجتمعات والنشاط" : "Communities & Activity"}</th>
              <th className="px-6 py-4 text-right rtl:text-left min-w-[190px]">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse bg-slate-900/40">
                  <td className="px-4 py-4 text-center">
                    <div className="w-5 h-5 rounded-lg bg-slate-800 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 shrink-0" />
                      <div className="space-y-1.5 min-w-0">
                        <div className="w-32 h-4 bg-slate-800 rounded" />
                        <div className="w-24 h-3 bg-slate-800/60 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="w-28 h-4 bg-slate-800 rounded" />
                      <div className="w-20 h-3 bg-slate-800/60 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="w-24 h-4 bg-slate-800 rounded" />
                      <div className="w-16 h-3 bg-slate-800/60 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-8 bg-slate-800 rounded-xl" />
                      <div className="w-8 h-8 bg-slate-800 rounded-xl" />
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedUsers.map(u => {
              const isSelected = selectedUids.includes(u.uid);
              return (
                <tr
                  key={u.uid}
                  className={`transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-950/20 border-l-4 border-emerald-500 shadow-inner'
                      : 'hover:bg-slate-950/60'
                  }`}
                >
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleSelectUser(u.uid)}
                      className="p-1 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/30"
                            : "bg-slate-950 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-slate-950" />}
                      </div>
                    </button>
                  </td>
                  <GlobalUserRow
                    u={u}
                    isAr={isAr}
                    communitiesMap={communitiesMap}
                    userCommMap={userCommMap}
                    onBanUser={handleBanUser}
                    onManageCommunities={(user) => setManageCommModal({ open: true, user })}
                    onTogglePro={handleTogglePro}
                  />
                </tr>
              );
            })}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-xs">
                  {isAr ? "لا يوجد مستخدمين مطابقين للفلاتر" : "No matching users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs font-bold text-slate-400">
            {isAr ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold disabled:opacity-40 hover:bg-emerald-600 hover:text-white transition-all"
            >
              {isAr ? "السابق" : "Previous"}
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold disabled:opacity-40 hover:bg-emerald-600 hover:text-white transition-all"
            >
              {isAr ? "التالي" : "Next"}
            </button>
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
      
      <ManageUserCommunitiesModal
        user={manageCommModal.user}
        isOpen={manageCommModal.open}
        onClose={() => setManageCommModal({ open: false, user: null })}
        communitiesMap={communitiesMap}
        onRefresh={fetchUsers}
      />
    </div>
  );
}
