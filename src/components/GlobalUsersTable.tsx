"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ThemeProvider";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import { PlayerProfile } from "@/types";

export default function GlobalUsersTable() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [users, setUsers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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
  };

  const handleBanUser = async (user: PlayerProfile) => {
    if (!window.confirm(isAr ? "هل أنت متأكد من حظر/حذف هذا المستخدم نهائياً؟" : "Are you sure you want to completely ban/delete this user?")) return;
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
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {isAr ? "جميع المستخدمين" : "All Users"}
        </h2>
        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
          {users.length} {isAr ? "مستخدم" : "Users"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-sm font-semibold text-slate-500">{isAr ? "المستخدم" : "User"}</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500">{isAr ? "البريد الإلكتروني" : "Email"}</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500">{isAr ? "المجتمعات" : "Communities"}</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-500 text-right">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {u.googlePic ? (
                      <img src={u.googlePic} alt={u.fullName} className="w-10 h-10 rounded-full" />
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
    </div>
  );
}
