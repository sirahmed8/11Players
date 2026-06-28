"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CommunitiesPage() {
  const { user } = useAuth();
  const { activeCommunityId, setActiveCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const snap = await getDocs(collection(db, "communities"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
        setCommunities(data);
      } catch (err) {
        console.error("Failed to fetch communities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  const handleJoin = async (community: Community) => {
    if (!user) {
      toast.error(isAr ? "يجب تسجيل الدخول أولاً" : "Must be logged in to join");
      return;
    }

    if (community.isPrivate) {
      const enteredPassword = passwordInput[community.id];
      if (enteredPassword !== community.password) {
        toast.error(isAr ? "كلمة المرور غير صحيحة" : "Incorrect password");
        return;
      }
    }

    setActiveCommunityId(community.id);
    toast.success(isAr ? `تم دخول مجتمع ${community.name}` : `Entered ${community.name} community`);
    router.push("/community");
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
          <div className="flex justify-center"><div className="animate-spin text-3xl">⚽</div></div>
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
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">{c.description}</p>
                
                {c.isPrivate && activeCommunityId !== c.id && (
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
                  className={`w-full py-2 rounded-xl font-bold transition-colors ${activeCommunityId === c.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {activeCommunityId === c.id ? (isAr ? "المجتمع النشط الآن" : "Currently Active") : (isAr ? "دخول" : "Enter Community")}
                </button>
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
