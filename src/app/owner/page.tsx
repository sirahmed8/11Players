"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, writeBatch, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import GlobalUsersTable from "@/components/GlobalUsersTable";
import { Users, FileText, UserCheck, ShieldCheck, Lock, X } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

function OwnerCommunitiesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="h-5 w-40 max-w-[75%] rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-3.5 w-56 max-w-full rounded-md bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-3.5 w-72 max-w-full rounded-md bg-slate-200/70 dark:bg-slate-800" />
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <div className="h-9 w-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OwnerPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

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
        createdAt: serverTimestamp()
      });

      // Add admin to the community's players
      if (newCommAdmin) {
        const adminDoc = await getDoc(doc(db, "players", newCommAdmin));
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          await setDoc(doc(db, "communities", id, "players", newCommAdmin), {
            ...adminData,
            role: "admin",
            joinedAt: new Date().toISOString()
          });

          // Update admin's global profile
          await updateDoc(doc(db, "players", newCommAdmin), {
            memberCommunities: arrayUnion(id),
            joinedCommunities: arrayUnion(id)
          });
        }
      }
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

  const handleDeleteCommunity = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "حذف المجتمع" : "Delete Community",
      message: isAr ? "هل أنت متأكد من رغبتك في حذف هذا المجتمع؟ سيتم فقدان جميع بيانات اللاعبين داخله." : "Are you SURE you want to delete this community? ALL PLAYERS inside will be lost.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "communities", id));
          toast.success("Community deleted");
          fetchCommunities();
        } catch (e) {
          toast.error("Failed to delete");
        }
      }
    });
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

  const handleWipeAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "تنبيه خطير جداً!" : "CRITICAL WARNING!",
      message: isAr ? "هل أنت متأكد من مسح كافة بيانات الموقع والمجتمعات واللاعبين؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to wipe ALL site data? This CANNOT be undone.",
      onConfirm: async () => {
        setProcessing(true);
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
          setProcessing(false);
        } catch (e) {
          console.error(e);
          toast.error("Wipe failed.");
          setProcessing(false);
        }
      }
    });
  };

  const handleGlobalResetStats = () => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "تصفير شامل للإحصائيات" : "Global Stats Reset",
      message: isAr ? "هل أنت متأكد من تصفير كافة إحصائيات اللاعبين وحذف جميع المباريات في كافة المجتمعات؟" : "Are you sure you want to reset ALL player stats and delete ALL matches across ALL communities?",
      onConfirm: async () => {
        setProcessing(true);
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
              await batch.commit();
            }
          }
          toast.success(isAr ? "تم تصفير جميع الإحصائيات بنجاح" : "Global stats reset successfully.");
        } catch (e) {
          console.error(e);
          toast.error("Failed to reset stats globally.");
        }
        setProcessing(false);
      }
    });
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
                    <div className="relative w-full">
                      <Users className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input required value={newCommName} onChange={e => setNewCommName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" placeholder="Elite League..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "الوصف" : "Description"}</label>
                    <div className="relative w-full">
                      <FileText className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input required value={newCommDesc} onChange={e => setNewCommDesc(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" placeholder="The best community for..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "معرف المسؤول (UID)" : "Admin UID (User ID)"}</label>
                    <div className="relative w-full">
                      <UserCheck className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input required value={newCommAdmin} onChange={e => setNewCommAdmin(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" placeholder="e.g. 8xJ9..." />
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
                  <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isPrivate ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'}`}>
                    <div className="overflow-hidden">
                      <div className="pt-1 pb-1">
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "كلمة المرور" : "Password"}</label>
                        <div className="relative w-full">
                          <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input required={isPrivate} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" placeholder="Secret..." />
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
                <button disabled={processing} onClick={handleGlobalResetStats} className="w-full py-2 bg-orange-600 disabled:opacity-50 text-white font-bold rounded-lg hover:bg-orange-700">
                  Global Stats Reset (All Communities)
                </button>
                <button disabled={processing} onClick={handleWipeAllData} className="w-full py-2 bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg hover:bg-red-700">
                  Wipe ALL Site Data
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold mb-4">{isAr ? "المجتمعات الحالية" : "Active Communities"}</h2>
                {loading ? <OwnerCommunitiesSkeleton /> : (
                  <div className="space-y-4">
                    {communities.map(c => (
                      <div key={c.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-4 bg-slate-50 dark:bg-slate-900">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-4">
                          <div>
                            <div className="font-black text-lg flex items-center gap-2">
                              {c.name} {c.isPrivate && <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-lg">Private</span>}
                            </div>
                            <div className="text-sm font-semibold text-slate-500 mt-1">Admin UID: {c.adminUid}</div>
                            <div className="text-sm text-slate-500 truncate max-w-sm mt-1">{c.description}</div>
                            {c.isPrivate && <div className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md mt-2 inline-block">Password: {c.password}</div>}
                          </div>
                          <div className="flex gap-2 self-end sm:self-auto">
                            <button 
                              onClick={() => {
                                setEditingCommunity(c.id);
                                setEditName(c.name);
                                setEditDesc(c.description || "");
                                setEditAdminUid(c.adminUid);
                                setIsEditPrivate(c.isPrivate || false);
                                setEditPassword(c.password || "");
                              }} 
                              className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button onClick={() => handleDeleteCommunity(c.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl font-bold text-sm transition-colors">Delete</button>
                          </div>
                        </div>
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

      <AnimatePresence>
        {editingCommunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setEditingCommunity(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isAr ? "تعديل بيانات المجتمع" : "Edit Community"}
                </h3>
                <button
                  onClick={() => setEditingCommunity(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "الاسم" : "Name"}</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "الوصف" : "Description"}</label>
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none" placeholder="Description" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "معرف المسؤول" : "Admin UID"}</label>
                  <input value={editAdminUid} onChange={e => setEditAdminUid(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none" placeholder="Admin UID" />
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isEditPrivate ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'} transition-colors`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-white">{isAr ? "مجتمع خاص" : "Private Community"}</span>
                      </div>
                    </div>
                    <div className={`relative w-12 h-6 transition-colors duration-300 ease-in-out rounded-full ${isEditPrivate ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <motion.div animate={{ x: isEditPrivate ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm" />
                    </div>
                    <input type="checkbox" checked={isEditPrivate} onChange={e => setIsEditPrivate(e.target.checked)} className="sr-only" />
                  </label>
                </div>
                
                <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isEditPrivate ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <div className="pt-1 pb-1">
                      <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">{isAr ? "كلمة المرور" : "Password"}</label>
                      <input value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none" placeholder="Password" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
                <button
                  onClick={() => setEditingCommunity(null)}
                  className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {isAr ? "إلغاء" : "Discard"}
                </button>
                <button
                  onClick={() => handleEditSave(editingCommunity!)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {isAr ? "حفظ التغييرات" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      {processing && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mb-6 shadow-lg"></div>
          <h2 className="text-3xl font-black mb-2 animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            {isAr ? "جاري معالجة البيانات..." : "Processing Operation..."}
          </h2>
          <p className="text-slate-300 font-medium tracking-wide">
            {isAr ? "الرجاء عدم إغلاق أو تحديث هذه الصفحة" : "Please do not close or refresh this page"}
          </p>
        </div>
      )}
    </ProtectedRoute>
  );
}
