"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ui/ThemeProvider";
import toast from "react-hot-toast";
import { Loader2, Trash2, Search, ArrowUpDown, Eye, Users, Sparkles } from "lucide-react";
import { PlayerProfile } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import GlobalUserRow from "@/components/admin/GlobalUserRow";
import { getAllPlayerCommunities } from '@/lib/playerUtils';
import ManageUserCommunitiesModal from "@/components/community/ManageUserCommunitiesModal";

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
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'fullName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

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

      // Process global players first ensuring explicit uid field
      usersSnap.docs.forEach(d => {
        const data = d.data();
        allUsersMap[d.id] = { uid: d.id, ...data } as PlayerProfile;
      });

      // Fetch all community player rosters in parallel
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
        } catch (e) {
          // Ignore individual subcollection access errors
        }
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
      message: isAr ? "هل أنت متأكد من حظر/حذف هذا المستخدم نهائياً؟" : "Are you sure you want to completely ban/delete this user?",
      onConfirm: async () => {
        try {
          const { writeBatch } = await import("firebase/firestore");
          const batch = writeBatch(db);

          // Remove from all communities they are a member of
          if (user.memberCommunities && user.memberCommunities.length > 0) {
            user.memberCommunities.forEach(cId => {
              batch.delete(doc(db, "communities", cId, "players", user.uid));
            });
          }

          // Remove global profile
          batch.delete(doc(db, "players", user.uid));
          
          await batch.commit();

          setUsers(prev => prev.filter(u => u.uid !== user.uid));
          toast.success(isAr ? "تم حذف المستخدم من النظام" : "User completely deleted");
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "فشل حذف المستخدم" : "Failed to delete user");
        }
      }
    });
  };

  const handleDeleteAllMock = () => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "حذف اللاعبين الوهميين" : "Delete Mock Players",
      message: isAr ? "هل أنت متأكد من حذف جميع اللاعبين الوهميين (32 لاعب) من كافة المجتمعات والنظام؟" : "Are you sure you want to delete all dummy/mock players from all communities and system?",
      onConfirm: async () => {
        try {
          const { writeBatch } = await import("firebase/firestore");
          const mockUsers = users.filter(u => u.isMockData || u.uid.startsWith('dummy_') || u.uid.startsWith('test-player-') || (u.email && u.email.includes('dummy')));
          if (mockUsers.length === 0) {
            toast.success(isAr ? "لا يوجد لاعبين وهميين" : "No mock players found");
            return;
          }
          const batch = writeBatch(db);
          for (const u of mockUsers) {
            const commIds = getAllPlayerCommunities(u);
            for (const commId of commIds) {
              batch.delete(doc(db, "communities", commId as string, "players", u.uid));
            }
            batch.delete(doc(db, "players", u.uid));
          }
          await batch.commit();
          setUsers(prev => prev.filter(u => !mockUsers.some(m => m.uid === u.uid)));
          toast.success(isAr ? `تم حذف ${mockUsers.length} لاعب وهمي بنجاح` : `Successfully deleted ${mockUsers.length} mock players`);
        } catch (err) {
          console.error(err);
          toast.error(isAr ? "فشل حذف اللاعبين الوهميين" : "Failed to delete mock players");
        }
      }
    });
  };

  const handleApplyAIToAllGlobalUsers = () => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "تطبيق اختيار الذكاء الاصطناعي الأفضل للجميع" : "Apply AI Best Choice to All Players",
      message: isAr
        ? `هل أنت متأكد من تحليل طاقات جميع المستخدمين (${users.length}) وتطبيق أفضل مركز وأسلوب لعب من الذكاء الاصطناعي وحفظها في قاعدة البيانات؟`
        : `Are you sure you want to analyze all (${users.length}) users and save their AI-recommended primary position & play style directly to the database?`,
      onConfirm: async () => {
        try {
          const { writeBatch, doc } = await import("firebase/firestore");
          const { getTacticalSuggestions } = await import("@/lib/suggestionEngine");
          let count = 0;

          const batchSize = 350;
          for (let i = 0; i < users.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = users.slice(i, i + batchSize);

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

              const topChoice = suggestions.positions[0];
              if (topChoice) {
                const bestPos = topChoice.position;
                const bestStyle = topChoice.bestPlayStyle || p.playStyle || 'Box-to-Box';

                const updates: any = {
                  primaryPosition: bestPos,
                  playStyle: bestStyle,
                };

                batch.update(doc(db, 'players', p.uid), updates);
                count++;
              }
            });

            await batch.commit();
          }

          toast.success(
            isAr
              ? `تم تطبيق أفضل مراكز وأساليب الذكاء الاصطناعي لـ ${count} لاعب بنجاح! ⚡`
              : `Successfully applied AI best choices to ${count} players! ⚡`
          );
          fetchUsers();
        } catch (err) {
          console.error("Failed to apply AI choices to all users:", err);
          toast.error(isAr ? "فشل تطبيق خيارات الذكاء الاصطناعي" : "Failed to apply AI choices");
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

  const filteredUsers = React.useMemo(() => {
    let result = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(q) || 
        u.cardName.toLowerCase().includes(q) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
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
  }, [users, searchQuery, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (loading) {
    return <SiteSkeletonLoader variant="table" />;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isAr ? "جميع المستخدمين" : "All Users"}
          </h2>
          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
            {filteredUsers.length} {isAr ? "مستخدم" : "Users"}
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
          <button
            onClick={handleApplyAIToAllGlobalUsers}
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all active:scale-95 shrink-0"
            title={isAr ? "تطبيق أفضل مراكز وأساليب الذكاء الاصطناعي لجميع اللاعبين" : "Apply AI best position & play style to all users"}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{isAr ? "تطبيق خيار الذكاء الاصطناعي للجميع" : "Apply AI Best to All"}</span>
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={isAr ? "البحث بالاسم أو الإيميل..." : "Search by name or email..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
            />
          </div>
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th 
                className="px-6 py-4 text-sm font-semibold text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group"
                onClick={() => handleSort('fullName')}
              >
                <div className="flex items-center gap-2">
                  {isAr ? "المستخدم" : "User"}
                  <ArrowUpDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-sm font-semibold text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  {isAr ? "البريد الإلكتروني" : "Email"}
                  <ArrowUpDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                </div>
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500">{isAr ? "المجتمعات" : "Communities"}</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500 text-right">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedUsers.map(u => (
              <GlobalUserRow
                key={u.uid}
                u={u}
                isAr={isAr}
                communitiesMap={communitiesMap}
                userCommMap={userCommMap}
                onBanUser={handleBanUser}
                onManageCommunities={(user) => setManageCommModal({ open: true, user })}
              />
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  {isAr ? "لا يوجد مستخدمين" : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3.5">
        {paginatedUsers.map(u => {
          const photo = u.photoUrl || u.googlePic || (u as any).photoURL || (u as any).userPic || "";
          const activeLocalComm = typeof window !== "undefined" ? localStorage.getItem("activeCommunityId") : null;
          const commIds = Array.from(
            new Set([
              ...(u.memberCommunities || []),
              ...(u.joinedCommunities || []),
              ...(userCommMap[u.uid] || []),
              ...((u as any).lastCommunityId ? [(u as any).lastCommunityId] : []),
              ...((activeLocalComm && (userCommMap[u.uid] || u.memberCommunities?.includes(activeLocalComm))) ? [activeLocalComm] : []),
            ].filter(Boolean))
          ) as string[];

          return (
            <div key={u.uid} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {photo ? (
                  <Image src={photo} alt={u.fullName} className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30" width={48} height={48} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold shrink-0 text-lg">
                    {u.fullName?.charAt(0) || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 dark:text-white truncate text-sm">{u.fullName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{u.cardName || u.email || "N/A"}</div>
                  {u.email && <div className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</div>}
                </div>
              </div>

              {/* Communities */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-bold mb-1.5 uppercase tracking-wider">{isAr ? "المجتمعات" : "Communities"}</span>
                <div className="flex flex-wrap gap-1.5">
                  {commIds.length > 0 ? (
                    commIds.map((c) => (
                      <span key={c} className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
                        {communitiesMap[c] || c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">{isAr ? "لا يوجد مجتمعات" : "No communities"}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                <button
                  onClick={() => setManageCommModal({ open: true, user: u })}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isAr ? "المجتمعات" : "Communities"}</span>
                </button>
                <Link
                  href={`/profile?uid=${u.uid}`}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isAr ? "الملف الشخصي" : "Profile"}</span>
                </Link>
                <button
                  onClick={() => handleBanUser(u)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  title={isAr ? "حظر / حذف" : "Ban / Delete User"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500">
            {isAr ? "لا يوجد مستخدمين" : "No users found"}
          </div>
        )}
      </div>

      {/* Clean Standalone Pagination Bar */}
      {totalPages > 1 && (
        <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs font-bold text-slate-500">
            {isAr ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            >
              {isAr ? "السابق" : "Previous"}
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
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
