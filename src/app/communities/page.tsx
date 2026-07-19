"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ThemeProvider";
import { collection, getDocs, getCountFromServer, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import CommunityChallengeModal, { CommunityChallenge } from "@/components/CommunityChallengeModal";

export default function CommunitiesPage() {
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const { activeCommunityId, setActiveCommunityId, activeCommunity } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState<{ [key: string]: string }>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Challenge modal state
  const [challengeTarget, setChallengeTarget] = useState<Community | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [myChallenges, setMyChallenges] = useState<CommunityChallenge[]>([]);

  useEffect(() => {
    if (!activeCommunityId) return;
    const unsub1 = onSnapshot(query(collection(db, "community_challenges"), where("challengerCommunityId", "==", activeCommunityId)), (snap) => {
      const list1: CommunityChallenge[] = [];
      snap.forEach(d => list1.push({ id: d.id, ...d.data() } as CommunityChallenge));
      setMyChallenges(prev => {
        const other = prev.filter(c => c.challengerCommunityId !== activeCommunityId);
        return [...other, ...list1];
      });
    });
    const unsub2 = onSnapshot(query(collection(db, "community_challenges"), where("targetCommunityId", "==", activeCommunityId)), (snap) => {
      const list2: CommunityChallenge[] = [];
      snap.forEach(d => list2.push({ id: d.id, ...d.data() } as CommunityChallenge));
      setMyChallenges(prev => {
        const other = prev.filter(c => c.targetCommunityId !== activeCommunityId);
        return [...other, ...list2];
      });
    });
    return () => { unsub1(); unsub2(); };
  }, [activeCommunityId]);

  // Redirect to welcome page if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

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
          const { doc, onSnapshot, collection, query, where, getDocs, setDoc } = await import("firebase/firestore");
          const unsub = onSnapshot(doc(db, "players", user.uid), async (userDoc) => {
            if (userDoc.exists()) {
              setUserProfile(userDoc.data());
            } else if (user.email) {
              try {
                const q = query(collection(db, "players"), where("email", "==", user.email));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                  const existingData = querySnap.docs[0].data();
                  await setDoc(doc(db, "players", user.uid), { ...existingData, uid: user.uid }, { merge: true });
                  setUserProfile(existingData);
                }
              } catch (e) {
                console.error("Profile sync by email in communities error:", e);
              }
            }
          });
          return () => unsub();
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
      const cleanProfile = {
        ...userProfile,
        role: "member", // Explicitly ensure they join as a regular member/user, NOT admin!
        joinedAt: new Date().toISOString()
      };
      delete (cleanProfile as any).pendingCommunities;
      delete (cleanProfile as any).memberCommunities;
      delete (cleanProfile as any).joinedCommunities;

      await setDoc(doc(db, "communities", community.id, "players", user.uid), cleanProfile, { merge: true });
      await updateDoc(doc(db, "players", user.uid), {
        memberCommunities: arrayUnion(community.id),
        joinedCommunities: arrayUnion(community.id)
      });

      setUserProfile((prev: any) => ({
        ...prev,
        memberCommunities: [...(prev?.memberCommunities || []), community.id],
        joinedCommunities: [...(prev?.joinedCommunities || []), community.id]
      }));

      setActiveCommunityId(community.id);
      toast.success(isAr ? `تم الانضمام إلى مجتمع ${community.name} بنجاح!` : `Joined ${community.name} community successfully!`);
      router.push("/community");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل الانضمام" : "Failed to join");
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

        {/* Request Create Community CTA Banner */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-slate-900/10 border-2 border-dashed border-emerald-500/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-emerald-500/60">
          <div className="text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-3">
              <span>🚀</span>
              <span>{isAr ? "خدمة خاصة" : "Special Service"}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
              {isAr ? "هل ترغب في إنشاء مجتمعك الخاص وإدارته؟" : "Want to create and manage your own community?"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {isAr ? "إذا كنت تنظم بطولات أو مباريات وترغب في إنشاء مجتمع خاص بفريقك مع صلاحيات المسؤول الكاملة، تواصل مع الدعم الفني مباشرة وسنقم بإنشائه وتخصيصه لك." : "If you organize tournaments or matches and want a dedicated community with full admin privileges, contact support directly to request your custom community setup."}
            </p>
          </div>
          <button
            onClick={() => {
              const msg = encodeURIComponent(isAr ? "مرحباً، أرغب في إنشاء مجتمع جديد وإدارته كمسؤول." : "Hello, I would like to create and manage a new community as an admin.");
              router.push(`/support?msg=${msg}`);
            }}
            className="w-full md:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0 text-base"
          >
            <span>💬</span>
            <span>{isAr ? "طلب إنشاء مجتمع" : "Request Create Community"}</span>
          </button>
        </div>

        {/* Active Inter-Community Challenges Banner */}
        {myChallenges.length > 0 && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-600/20 via-orange-600/15 to-slate-900/40 border border-amber-500/40 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <div>
                <h3 className="text-lg font-black text-amber-500 dark:text-amber-400">
                  {isAr ? "تحديات المجتمعات ومحادثات الاتفاق" : "Inter-Community Challenges & Negotiation Chats"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? "تنسيق المباريات والتفاوض مع المجتمعات الأخرى واختيار تشكيلتك المغلقة" : "Coordinate matches, negotiate terms, and lock squads with rival communities"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myChallenges.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {c.challengerCommunityName} vs {c.targetCommunityName}
                    </p>
                    <span className="text-[11px] text-amber-400 font-semibold">
                      {c.status === 'approved' ? (isAr ? '🎉 معتمد ومغلق للتشكيلة' : '🎉 Approved & Squads Locked') :
                       c.status === 'deal_reached' ? (isAr ? '🤝 تم الاتفاق! اختر تشكيلتك' : '🤝 Deal Reached! Lock Squad') :
                       (isAr ? '💬 جاري التفاوض...' : '💬 Negotiating Chat...')}
                    </span>
                  </div>
                  <button
                    onClick={() => { setChallengeTarget(null); setActiveChallengeId(c.id); }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shrink-0 shadow transition-transform active:scale-95"
                  >
                    {isAr ? "فتح المحادثة" : "Open Chat"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[260px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-400/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
                
                <div>
                  {/* Name + badge row */}
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-6 w-16 bg-emerald-500/20 rounded-lg" />
                  </div>
                  
                  {/* Player count pill */}
                  <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-md mb-4" />
                  
                  {/* Description lines */}
                  <div className="space-y-2.5 mb-6">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
                  </div>
                </div>

                {/* Button */}
                <div className="h-12 w-full bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl mt-auto flex items-center justify-center">
                  <div className="h-4 w-28 bg-emerald-500/30 rounded-md" />
                </div>
              </div>
            ))}
          </div>
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
                  const isCurrent = activeCommunityId === c.id;
                  const isMember = isCurrent || userProfile?.memberCommunities?.includes(c.id) || userProfile?.joinedCommunities?.includes(c.id) || c.adminUid === user?.uid || isOwner;
                  const isPending = userProfile?.pendingCommunities?.includes(c.id);

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

                      {isAdmin && activeCommunityId && c.id !== activeCommunityId && (
                        <button
                          onClick={() => { setActiveChallengeId(null); setChallengeTarget(c); }}
                          className="w-full mt-2 py-2 rounded-xl font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors text-xs flex items-center justify-center gap-1.5"
                        >
                          <span>⚔️</span>
                          <span>{isAr ? "تحدي هذا المجتمع (التفاوض والموعد)" : "Challenge Community (Negotiate & Chat)"}</span>
                        </button>
                      )}
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

        <CommunityChallengeModal
          isOpen={!!challengeTarget || !!activeChallengeId}
          onClose={() => { setChallengeTarget(null); setActiveChallengeId(null); }}
          activeCommunityId={activeCommunityId || ""}
          activeCommunityName={activeCommunity?.name || (isAr ? "مجتمعي" : "My Community")}
          targetCommunity={challengeTarget}
          existingChallengeId={activeChallengeId}
        />
      </main>
    </div>
  );
}
