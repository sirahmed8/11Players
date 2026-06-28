"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import toast from "react-hot-toast";
import { Check, X, Loader2 } from "lucide-react";

export default function PendingRequests() {
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCommunityId) return;
    fetchRequests();
  }, [activeCommunityId]);

  const fetchRequests = async () => {
    if (!activeCommunityId) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "communities", activeCommunityId, "joinRequests"));
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    if (!activeCommunityId) return;
    setActionLoading(request.id);
    try {
      // Add to players
      await setDoc(doc(db, "communities", activeCommunityId, "players", request.id), {
        ...request,
        requestedAt: undefined, // remove temp field
      });
      // Remove from joinRequests
      await deleteDoc(doc(db, "communities", activeCommunityId, "joinRequests", request.id));
      
      // Update global profile
      await updateDoc(doc(db, "players", request.id), {
        pendingCommunities: arrayRemove(activeCommunityId),
        memberCommunities: arrayUnion(activeCommunityId)
      });
      
      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success(isAr ? "تم الموافقة" : "Approved");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ" : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (request: any) => {
    if (!activeCommunityId) return;
    setActionLoading(request.id);
    try {
      // Remove from joinRequests
      await deleteDoc(doc(db, "communities", activeCommunityId, "joinRequests", request.id));
      
      // Update global profile
      await updateDoc(doc(db, "players", request.id), {
        pendingCommunities: arrayRemove(activeCommunityId)
      });
      
      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success(isAr ? "تم الرفض" : "Denied");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ" : "An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;
  }

  if (requests.length === 0) return null;

  return (
    <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
        {isAr ? "طلبات الانضمام المعلقة" : "Pending Join Requests"}
      </h3>
      <div className="flex flex-col gap-3">
        {requests.map(req => (
          <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {req.googlePic && (
                <img src={req.googlePic} alt={req.fullName} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" />
              )}
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{req.fullName}</p>
                <p className="text-sm text-slate-500">{req.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleDeny(req)} 
                disabled={actionLoading === req.id}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleApprove(req)} 
                disabled={actionLoading === req.id}
                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
