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
import { Users, FileText, UserCheck, ShieldCheck, Lock } from "lucide-react";

export default function OwnerPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingCommunity, setEditingCommunity] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAdminUid, setEditAdminUid] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isEditPrivate, setIsEditPrivate] = useState(false);

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
      await deleteDoc(doc(db, "communities", id));
      toast.success("Community deleted");
      fetchCommunities();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleEditSave = async (id: string) => {
    try {
      await setDoc(doc(db, "communities", id), {
        name: editName,
        description: editDesc,
        adminUid: editAdminUid,
        isPrivate: isEditPrivate,
        password: isEditPrivate ? editPassword : null,
      }, { merge: true });
      toast.success(isAr ? "تم تحديث المجتمع بنجاح" : "Community updated successfully");
      setEditingCommunity(null);
      fetchCommunities();
    } catch (e) {
      toast.error(isAr ? "فشل التحديث" : "Failed to update");
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-12">
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
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "الاسم" : "Name"}</label>
                    <div className="relative group">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input required value={newCommName} onChange={e => setNewCommName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none" placeholder="Elite League..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "الوصف" : "Description"}</label>
                    <div className="relative group">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input required value={newCommDesc} onChange={e => setNewCommDesc(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none" placeholder="The best community for..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "معرف المسؤول (UID)" : "Admin UID (User ID)"}</label>
                    <div className="relative group">
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input required value={newCommAdmin} onChange={e => setNewCommAdmin(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none" placeholder="e.g. 8xJ9..." />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isPrivate ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'} transition-colors`}>
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900 dark:text-white">{isAr ? "مجتمع خاص" : "Private Community"}</span>
                          <span className="text-xs text-slate-500">{isAr ? "يتطلب كلمة مرور للدخول" : "Requires password to join"}</span>
                        </div>
                      </div>
                      <div className={`relative w-12 h-6 transition-colors duration-300 ease-in-out rounded-full ${isPrivate ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <motion.div animate={{ x: isPrivate ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm" />
                      </div>
                      <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="sr-only" />
                    </label>
                  </div>
                  <div 
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isPrivate ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-2">
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "كلمة المرور" : "Password"}</label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input required={isPrivate} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none" placeholder="Secret..." />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button disabled={creating} className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                    {creating ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء المجتمع" : "Create Community")}
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
                      <div key={c.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-4 bg-slate-50 dark:bg-slate-900">
                        {editingCommunity === c.id ? (
                          <div className="flex flex-col gap-3">
                            <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600" placeholder="Name" />
                            <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600" placeholder="Description" />
                            <input value={editAdminUid} onChange={e => setEditAdminUid(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600" placeholder="Admin UID" />
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={isEditPrivate} onChange={e => setIsEditPrivate(e.target.checked)} />
                              Private
                            </label>
                            {isEditPrivate && (
                              <input value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600" placeholder="Password" />
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => handleEditSave(c.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Save</button>
                              <button onClick={() => setEditingCommunity(null)} className="bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <div className="font-bold text-lg flex items-center gap-2">
                                {c.name} {c.isPrivate && <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded">Private</span>}
                              </div>
                              <div className="text-sm text-slate-500">Admin UID: {c.adminUid}</div>
                              <div className="text-sm text-slate-500 truncate max-w-sm">{c.description}</div>
                              {c.isPrivate && <div className="text-xs text-slate-400">Password: {c.password}</div>}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingCommunity(c.id);
                                  setEditName(c.name);
                                  setEditDesc(c.description || "");
                                  setEditAdminUid(c.adminUid);
                                  setIsEditPrivate(c.isPrivate || false);
                                  setEditPassword(c.password || "");
                                }} 
                                className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1 rounded"
                              >
                                Edit
                              </button>
                              <button onClick={() => handleDeleteCommunity(c.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded">Delete</button>
                            </div>
                          </div>
                        )}
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
