"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import GlobalUsersTable from "@/components/GlobalUsersTable";

export default function OwnerPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // New community form
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommAdmin, setNewCommAdmin] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "communities"));
      setCommunities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community)));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const id = `comm-${Date.now()}`;
      const commRef = doc(db, "communities", id);
      await setDoc(commRef, {
        name: newCommName,
        description: newCommDesc,
        adminUid: newCommAdmin,
        isPrivate,
        password: isPrivate ? password : null,
        createdAt: new Date().toISOString()
      });
      toast.success(isAr ? "تم إنشاء المجتمع!" : "Community created!");
      setNewCommName("");
      setNewCommDesc("");
      setNewCommAdmin("");
      setPassword("");
      setIsPrivate(false);
      fetchCommunities();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create");
    }
    setCreating(false);
  };

  const handleDeleteCommunity = async (id: string) => {
    if (!window.confirm("Are you SURE you want to delete this community? ALL PLAYERS inside will be lost.")) return;
    try {
      // For a real production app, we would delete all players in the subcollection first.
      // Firestore client SDK doesn't support recursive delete, so we do what we can.
      await deleteDoc(doc(db, "communities", id));
      toast.success("Community deleted");
      fetchCommunities();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleWipeAllData = async () => {
    if (!window.confirm(isAr ? "تنبيه خطير! هل أنت متأكد من مسح كافة بيانات الموقع والمجتمعات واللاعبين؟" : "CRITICAL WARNING! Are you sure you want to wipe ALL site data?")) return;
    if (!window.confirm("Final confirmation. This CANNOT be undone.")) return;

    try {
      const batch = writeBatch(db);
      // Delete all players
      const pSnap = await getDocs(collection(db, "players"));
      pSnap.forEach(d => batch.delete(d.ref));
      
      // Delete all communities
      const cSnap = await getDocs(collection(db, "communities"));
      cSnap.forEach(d => batch.delete(d.ref));

      // Delete match
      batch.delete(doc(db, "system", "latestMatch"));

      await batch.commit();
      toast.success("Wipe complete.");
      fetchCommunities();
    } catch (e) {
      console.error(e);
      toast.error("Wipe failed.");
    }
  };

  const handleGlobalResetStats = async () => {
    if (!window.confirm(isAr ? "هل أنت متأكد من تصفير كافة إحصائيات اللاعبين وحذف جميع المباريات في كافة المجتمعات؟" : "Are you sure you want to reset ALL player stats and delete ALL matches across ALL communities?")) return;
    
    setLoading(true);
    try {
      // For each community, fetch players and matches, and reset/delete them
      const cSnap = await getDocs(collection(db, "communities"));
      for (const cDoc of cSnap.docs) {
        const batch = writeBatch(db);
        let operationsCount = 0;
        
        // Reset players
        const pSnap = await getDocs(collection(db, "communities", cDoc.id, "players"));
        pSnap.forEach(p => {
          const docRef = doc(db, "communities", cDoc.id, "players", p.id);
          batch.update(docRef, {
            'stats.goals': 0,
            'stats.assists': 0,
            'stats.mvp': 0,
            'stats.matchesPlayed': 0,
          });
          operationsCount++;
        });

        // Delete matches
        const mSnap = await getDocs(collection(db, "communities", cDoc.id, "matches"));
        mSnap.forEach(m => {
          batch.delete(m.ref);
          operationsCount++;
        });

        if (operationsCount > 0) {
          // Note: Firestore batches are limited to 500 operations. 
          // For a massive database, chunking is required, but this suffices for the scope.
          await batch.commit();
        }
      }
      toast.success(isAr ? "تم تصفير جميع الإحصائيات بنجاح" : "Global stats reset successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to reset stats globally.");
    }
    setLoading(false);
  };

  return (
    <ProtectedRoute ownerOnly>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-12">
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-red-600 mb-2">
              {isAr ? "لوحة المالك (Owner)" : "Owner Dashboard"}
            </h1>
            <p className="text-slate-500">
              {isAr ? "إدارة المجتمعات، وصلاحيات المسؤولين، والنظام بأكمله." : "Manage communities, admins, and the entire system."}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold mb-4">{isAr ? "إنشاء مجتمع جديد" : "Create New Community"}</h2>
                <form onSubmit={handleCreateCommunity} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Name</label>
                    <input required value={newCommName} onChange={e => setNewCommName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                    <input required value={newCommDesc} onChange={e => setNewCommDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Admin UID (User ID)</label>
                    <input required value={newCommAdmin} onChange={e => setNewCommAdmin(e.target.value)} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`relative w-12 h-6 transition-colors duration-300 ease-in-out rounded-full ${isPrivate ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <motion.div animate={{ x: isPrivate ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm" />
                    </div>
                    <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="sr-only" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Private</span>
                  </label>
                  <div 
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isPrivate ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden px-1 pb-1">
                      <div className="pt-3">
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Password</label>
                        <input required={isPrivate} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" />
                      </div>
                    </div>
                  </div>
                  <button disabled={creating} className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
                    {creating ? "Creating..." : "Create"}
                  </button>
                </form>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-800/30 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
                <button onClick={handleGlobalResetStats} className="w-full py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700">
                  Global Stats Reset (All Communities)
                </button>
                <button onClick={handleWipeAllData} className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                  Wipe ALL Site Data
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold mb-4">{isAr ? "المجتمعات الحالية" : "Active Communities"}</h2>
                {loading ? <p>Loading...</p> : (
                  <div className="space-y-4">
                    {communities.map(c => (
                      <div key={c.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <div>
                          <div className="font-bold text-lg flex items-center gap-2">
                            {c.name} {c.isPrivate && <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded">Private</span>}
                          </div>
                          <div className="text-sm text-slate-500">Admin UID: {c.adminUid}</div>
                          {c.isPrivate && <div className="text-xs text-slate-400">Password: {c.password}</div>}
                        </div>
                        <button onClick={() => handleDeleteCommunity(c.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded">Delete</button>
                      </div>
                    ))}
                    {communities.length === 0 && <p className="text-slate-500">No communities exist yet.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
