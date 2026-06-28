"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function CommunitiesPage() {
  const { user, isOwner } = useAuth();
  const { activeCommunityId, setActiveCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState<{ [key: string]: string }>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "communities"));
        const data = await Promise.all(snap.docs.map(async (d) => {
          let count = 0;
          try {
            const countSnap = await getCountFromServer(collection(db, "communities", d.id, "players"));
            count = countSnap.data().count;
          } catch (e) {
            console.error("Failed to get count", e);
          }
          return { id: d.id, ...d.data(), playerCount: count } as Community & { playerCount: number };
        }));
        setCommunities(data);

        if (user) {
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(db, "players", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleJoin = async (community: Community) => {
    if (!user) {
      toast.error(isAr ? "يجب تسجيل الدخول أولاً" : "Must be logged in to join");
      return;
    }

    if (!userProfile) {
      toast.error(isAr ? "يجب إكمال ملفك الشخصي أولاً" : "Must complete your profile first");
      router.push("/onboarding");
      return;
    }

    const { doc, setDoc, updateDoc, arrayUnion } = await import("firebase/firestore");

    // Check if they are already a member or admin
    const isMember = userProfile.memberCommunities?.includes(community.id) || community.adminUid === user.uid || isOwner;

    if (isMember) {
      setActiveCommunityId(community.id);
      toast.success(isAr ? `تم دخول مجتمع ${community.name}` : `Entered ${community.name} community`);
      router.push("/community");
      return;
    }

    // Check if already pending
    if (userProfile.pendingCommunities?.includes(community.id)) {
      toast.success(isAr ? "طلبك قيد المراجعة" : "Your request is pending approval");
      return;
    }

    if (community.isPrivate) {
      const enteredPassword = passwordInput[community.id];
      if (enteredPassword !== community.password) {
        toast.error(isAr ? "كلمة المرور غير صحيحة" : "Incorrect password");
        return;
      }
    }

    setActionLoading(community.id);
    try {
      // 1. Add to community's joinRequests collection
      await setDoc(doc(db, "communities", community.id, "joinRequests", user.uid), {
        ...userProfile,
        requestedAt: new Date().toISOString()
      });

      // 2. Add to user's global pendingCommunities
      await updateDoc(doc(db, "players", user.uid), {
        pendingCommunities: arrayUnion(community.id)
      });

      setUserProfile((prev: any) => ({ ...prev, pendingCommunities: [...(prev?.pendingCommunities || []), community.id] }));
      toast.success(isAr ? "تم إرسال طلب الانضمام! في انتظار موافقة المسؤول." : "Join request sent! Waiting for admin approval.");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إرسال الطلب" : "Failed to send request");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
            {isAr ? "المجتمعات المتاحة" : "Available Communities"}
          </h1>
          <p className="text-slate-500">
            {isAr ? "اختر مجتمعك المفضل للبدء" : "Select your preferred community to get started"}
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((c) => (
              <div key={c.id} className={`p-6 rounded-2xl border ${activeCommunityId === c.id ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} shadow-sm flex flex-col`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{c.name}</h2>
                  {c.isPrivate ? (
                    <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded">🔒 {isAr ? "خاص" : "Private"}</span>
                  ) : (
                    <span className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded">🌍 {isAr ? "عام" : "Public"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 self-start px-2 py-1 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {isAr ? `${(c as any).playerCount || 0} لاعبين` : `${(c as any).playerCount || 0} Players`}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1 text-start" dir="auto">{c.description}</p>
                
                {(() => {
                  const isMember = userProfile?.memberCommunities?.includes(c.id) || c.adminUid === user?.uid || isOwner;
                  const isPending = userProfile?.pendingCommunities?.includes(c.id);
                  const isCurrent = activeCommunityId === c.id;

                  return (
                    <>
                      {c.isPrivate && !isMember && !isPending && !isCurrent && (
                        <input 
                          type="password"
                          placeholder={isAr ? "كلمة المرور" : "Password"}
                          className="w-full mb-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                          value={passwordInput[c.id] || ""}
                          onChange={(e) => setPasswordInput({ ...passwordInput, [c.id]: e.target.value })}
                        />
                      )}

                      <button 
                        onClick={() => handleJoin(c)}
                        disabled={isPending || actionLoading === c.id}
                        className={`w-full py-2 rounded-xl font-bold transition-colors disabled:opacity-50 ${isCurrent ? 'bg-emerald-600 text-white shadow-lg' : isPending ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        {actionLoading === c.id ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : isCurrent ? (
                          isAr ? "المجتمع النشط الآن" : "Currently Active"
                        ) : isPending ? (
                          isAr ? "قيد المراجعة" : "Pending Approval"
                        ) : isMember ? (
                          isAr ? "دخول" : "Enter"
                        ) : (
                          isAr ? "طلب انضمام" : "Join Request"
                        )}
                      </button>
                    </>
                  );
                })()}
              </div>
            ))}
            {communities.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                {isAr ? "لا توجد مجتمعات بعد." : "No communities found."}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
