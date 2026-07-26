"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useLocale } from "@/components/ui/ThemeProvider";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, writeBatch, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Users, FileText, UserCheck, ShieldCheck, Lock, X, Crown, Sparkles, AlertTriangle, RefreshCw, Trash2, Edit } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";

export default function OwnerPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // AI Model Choice state
  const [activeModel, setActiveModel] = useState<string>("gemini-3.5-flash-lite");

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

      if (newCommAdmin) {
        const adminDoc = await getDoc(doc(db, "players", newCommAdmin));
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          await setDoc(doc(db, "communities", id, "players", newCommAdmin), {
            ...adminData,
            role: "admin",
            joinedAt: new Date().toISOString()
          });

          await updateDoc(doc(db, "players", newCommAdmin), {
            memberCommunities: arrayUnion(id),
            joinedCommunities: arrayUnion(id)
          });
        }
      }
      toast.success(isAr ? "تم إنشاء المجتمع بنجاح! 🏰" : "Community created successfully! 🏰");
      setNewCommName("");
      setNewCommDesc("");
      setNewCommAdmin("");
      setPassword("");
      setIsPrivate(false);
      fetchCommunities();
    } catch (e) {
      console.error(e);
      toast.error(isAr ? "فشل إنشاء المجتمع" : "Failed to create community");
    }
    setCreating(false);
  };

  const handleDeleteCommunity = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "حذف المجتمع" : "Delete Community",
      message: isAr ? "هل أنت متأكد من رغبتك في حذف هذا المجتمع نهائياً؟ سيتم مسح كافة البيانات المسجلة داخله." : "Are you SURE you want to delete this community? ALL DATA inside will be lost.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "communities", id));
          toast.success(isAr ? "تم حذف المجتمع بنجاح" : "Community deleted successfully");
          fetchCommunities();
        } catch (e) {
          toast.error(isAr ? "فشل حذف المجتمع" : "Failed to delete community");
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
      toast.success(isAr ? "تم تحديث بيانات المجتمع بنجاح" : "Community updated successfully");
      setEditingCommunity(null);
      fetchCommunities();
    } catch (e) {
      toast.error(isAr ? "فشل التحديث" : "Failed to update");
    }
  };

  const handleWipeAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: isAr ? "⚠️ تنبيه خطير جداً (مسح كامل البيانات)!" : "⚠️ CRITICAL WARNING (Full System Wipe)!",
      message: isAr ? "هل أنت متأكد من مسح كافة بيانات الموقع والمجتمعات واللاعبين نهائياً؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to wipe ALL site data? This CANNOT be undone.",
      onConfirm: async () => {
        setProcessing(true);
        try {
          const batch = writeBatch(db);
          const pSnap = await getDocs(collection(db, "players"));
          pSnap.forEach(d => batch.delete(d.ref));
          
          const cSnap = await getDocs(collection(db, "communities"));
          cSnap.forEach(d => batch.delete(d.ref));

          batch.delete(doc(db, "system", "latestMatch"));

          await batch.commit();
          toast.success(isAr ? "تم مسح كافة البيانات بالكامل" : "Wipe complete.");
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
          const cSnap = await getDocs(collection(db, "communities"));
          for (const cDoc of cSnap.docs) {
            const batch = writeBatch(db);
            let opsCount = 0;
            
            const pSnap = await getDocs(collection(db, "communities", cDoc.id, "players"));
            pSnap.forEach(p => {
              const docRef = doc(db, "communities", cDoc.id, "players", p.id);
              batch.update(docRef, {
                'stats.goals': 0,
                'stats.assists': 0,
                'stats.mvp': 0,
                'stats.matchesPlayed': 0,
              });
              opsCount++;
            });

            const mSnap = await getDocs(collection(db, "communities", cDoc.id, "matches"));
            mSnap.forEach(m => {
              batch.delete(m.ref);
              opsCount++;
            });

            if (opsCount > 0) {
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

  if (loading) {
    return (
      <ProtectedRoute ownerOnly>
        <div className="min-h-screen bg-slate-950 text-white p-8">
          <SiteSkeletonLoader variant="page" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute ownerOnly>
      <div className="min-h-screen bg-slate-950 text-white pb-16 transition-colors" dir={isAr ? 'rtl' : 'ltr'}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          
          {/* Header Banner — Solid Dark Slate */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-950 text-amber-400 border border-slate-800 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isAr ? "مركز الحوكمة والإدارة العليا للمالك" : "Owner Portal & Executive Suite"}</span>
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  {isAr ? "لوحة المالك (Owner Portal)" : "Owner Portal"}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  {isAr 
                    ? "التحكم الكامل بالنظام، إنشاء المجتمعات، اختيار نماذج الذكاء الاصطناعي، وإجراءات الطوارئ."
                    : "Full system administration, community management, AI model configuration, and emergency controls."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column: Create Community & AI Configuration & Danger Zone */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Create Community Form */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <span>🏰</span>
                  <span>{isAr ? "إنشاء مجتمع جديد" : "Create New Community"}</span>
                </h2>

                <form onSubmit={handleCreateCommunity} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">{isAr ? "اسم المجتمع" : "Community Name"}</label>
                    <div className="relative">
                      <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 text-slate-500 pointer-events-none" />
                      <input required value={newCommName} onChange={e => setNewCommName(e.target.value)} className="w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-white placeholder-slate-500" placeholder="Elite Champions..." />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">{isAr ? "الوصف" : "Description"}</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 absolute left-3 top-3 rtl:left-auto rtl:right-3 text-slate-500 pointer-events-none" />
                      <textarea rows={2} value={newCommDesc} onChange={e => setNewCommDesc(e.target.value)} className="w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-white placeholder-slate-500 resize-none" placeholder={isAr ? "وصف المجتمع والأقسام..." : "Community description..."} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">{isAr ? "معرف المشرف المسؤول (Admin UID)" : "Admin UID"}</label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 text-slate-500 pointer-events-none" />
                      <input required value={newCommAdmin} onChange={e => setNewCommAdmin(e.target.value)} className="w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold font-mono text-white placeholder-slate-500" placeholder="e.g. 8xJ9..." />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isPrivate ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-black text-white">{isAr ? "مجتمع خاص (مغلق)" : "Private Community"}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{isAr ? "يتطلب كلمة مرور للانضمام" : "Requires password to join"}</span>
                        </div>
                      </div>
                      <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded" />
                    </label>
                  </div>

                  {isPrivate && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">{isAr ? "كلمة المرور" : "Password"}</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 text-slate-500 pointer-events-none" />
                        <input required={isPrivate} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-white placeholder-slate-500" placeholder="Secret..." />
                      </div>
                    </div>
                  )}

                  <button disabled={creating} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs shadow transition-all flex justify-center items-center gap-2">
                    {creating ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء مجتمع جديد" : "Create New Community")}
                  </button>
                </form>
              </div>

              {/* AI Model Selector Config Card */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? "نموذج الذكاء الاصطناعي الافتراضي" : "Default AI Model Config"}</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {isAr ? "تحديد النموذج الأساسي لمساعد الذكاء الاصطناعي وحاسبة التكتيكات:" : "Select active LLM candidate for 11AI Chatbot & Tactical Advisor:"}
                </p>

                <div className="space-y-2">
                  {[
                    { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (Recommended)" },
                    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite (Fallback)" },
                    { id: "gemma-4-31b-it", label: "Gemma 4 31B IT" },
                    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Comprehensive)" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setActiveModel(m.id);
                        toast.success(isAr ? `تم اختيار النموذج: ${m.label}` : `Selected model: ${m.label}`);
                      }}
                      className={`w-full p-3 rounded-2xl border text-xs font-bold transition-all text-start flex items-center justify-between ${
                        activeModel === m.id
                          ? 'bg-slate-950 text-emerald-400 border-emerald-500/50 shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{m.label}</span>
                      {activeModel === m.id && <span className="text-emerald-400 font-black">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-rose-500/40 shadow-2xl space-y-4">
                <h2 className="text-sm font-black text-rose-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{isAr ? "منطقة الخطر وإجراءات الطوارئ" : "Danger Zone"}</span>
                </h2>
                
                <button disabled={processing} onClick={handleGlobalResetStats} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Global Stats Reset (All Communities)</span>
                </button>
                <button disabled={processing} onClick={handleWipeAllData} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe ALL Site Data</span>
                </button>
              </div>

            </div>

            {/* Right Column: Active Communities List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>🏰</span>
                    <span>{isAr ? "المجتمعات الحالية بالنظام" : "Active System Communities"}</span>
                  </h2>
                  <span className="bg-slate-950 text-emerald-400 border border-slate-800 px-3 py-1 rounded-full text-xs font-mono font-bold">
                    {communities.length} {isAr ? "مجتمع" : "Communities"}
                  </span>
                </div>

                <div className="space-y-4">
                  {communities.map(c => (
                    <div key={c.id} className="p-5 border border-slate-800 rounded-2xl flex flex-col gap-4 bg-slate-950 hover:border-slate-700 transition-all">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full gap-4">
                        <div>
                          <div className="font-black text-base text-white flex items-center gap-2">
                            <span>{c.name}</span>
                            {c.isPrivate && (
                              <span className="text-[10px] font-black bg-amber-950 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                Private 🔒
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-400 mt-1 font-mono">Admin UID: {c.adminUid || 'Unassigned'}</div>
                          <div className="text-xs text-slate-400 truncate max-w-md mt-1 font-medium">{c.description || 'No description'}</div>
                          {c.isPrivate && (
                            <div className="text-[10px] font-mono bg-slate-900 text-amber-300 border border-slate-800 px-2.5 py-1 rounded-lg mt-2 inline-block">
                              Password: {c.password}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingCommunity(c.id);
                              setEditName(c.name);
                              setEditDesc(c.description || "");
                              setEditAdminUid(c.adminUid);
                              setIsEditPrivate(c.isPrivate || false);
                              setEditPassword(c.password || "");
                            }} 
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3 text-amber-400" />
                            <span>Edit</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCommunity(c.id)} 
                            className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {communities.length === 0 && (
                    <p className="text-slate-500 text-xs italic text-center py-8">
                      {isAr ? "لا توجد مجتمعات مسجلة حالياً." : "No communities exist yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Edit Community Modal */}
      <AnimatePresence>
        {editingCommunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h3 className="text-base font-black text-white">
                  {isAr ? "تعديل بيانات المجتمع" : "Edit Community"}
                </h3>
                <button
                  onClick={() => setEditingCommunity(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? "الاسم" : "Name"}</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white outline-none focus:border-emerald-500" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? "الوصف" : "Description"}</label>
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white outline-none focus:border-emerald-500" placeholder="Description" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? "معرف المسؤول (Admin UID)" : "Admin UID"}</label>
                  <input value={editAdminUid} onChange={e => setEditAdminUid(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono font-bold text-white outline-none focus:border-emerald-500" placeholder="Admin UID" />
                </div>
                
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isEditPrivate ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">{isAr ? "مجتمع خاص" : "Private Community"}</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={isEditPrivate} onChange={e => setIsEditPrivate(e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded" />
                  </label>
                </div>
                
                {isEditPrivate && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? "كلمة المرور" : "Password"}</label>
                    <input value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white outline-none focus:border-emerald-500" placeholder="Password" />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-950 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCommunity(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs border border-slate-800 transition-colors"
                >
                  {isAr ? "إلغاء" : "Discard"}
                </button>
                <button
                  type="button"
                  onClick={() => handleEditSave(editingCommunity!)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs transition-all shadow"
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
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mb-6 shadow-lg"></div>
          <h2 className="text-2xl font-black mb-2 animate-pulse text-emerald-400">
            {isAr ? "جاري معالجة البيانات..." : "Processing Operation..."}
          </h2>
          <p className="text-slate-400 font-semibold text-xs tracking-wide">
            {isAr ? "الرجاء عدم إغلاق أو تحديث هذه الصفحة" : "Please do not close or refresh this page"}
          </p>
        </div>
      )}
    </ProtectedRoute>
  );
}
