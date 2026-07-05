"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ThemeProvider";
import toast from "react-hot-toast";
import { Loader2, Trash2, Search, ArrowUpDown } from "lucide-react";
import { PlayerProfile } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";

export default function GlobalUsersTable() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [users, setUsers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'fullName', direction: 'asc' });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "players"));
      setUsers(snap.docs.map(d => ({ ...d.data() } as PlayerProfile)));
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
            const commIds = Array.from(new Set([...(u.memberCommunities || []), ...(u.joinedCommunities || []), 'comm-1782681792342'].filter(Boolean))) as string[];
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

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isAr ? "جميع المستخدمين" : "All Users"}
          </h2>
          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
            {filteredUsers.length} {isAr ? "مستخدم" : "Users"}
          </span>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleDeleteAllMock}
            className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-500/30 transition-all active:scale-95 whitespace-nowrap"
          >
            🗑️ {isAr ? "حذف اللاعبين الوهميين" : "Delete Mock Players"}
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
      <div className="overflow-x-auto">
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
            {filteredUsers.map(u => (
              <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {u.googlePic || u.photoUrl ? (
                      <Image src={u.googlePic || u.photoUrl} alt={u.fullName} className="w-10 h-10 rounded-full" width={40} height={40} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                        {u.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                      <div className="text-sm text-slate-500">{u.cardName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {u.email || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.memberCommunities && u.memberCommunities.length > 0 ? (
                      u.memberCommunities.map(c => (
                        <span key={c} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleBanUser(u)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Ban / Delete User"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  {isAr ? "لا يوجد مستخدمين" : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
