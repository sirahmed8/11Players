"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { collection, getDocs, getCountFromServer, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Users, Lock, Globe, Swords, MessageCircle,
  ChevronRight, Sparkles, CheckCircle2, Clock, Plus,
  Search, Share2
} from "lucide-react";
import CommunityChallengeModal, { CommunityChallenge } from "@/components/community/CommunityChallengeModal";
import CreateCommunityModal from "@/components/community/CreateCommunityModal";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";

// ── Skeleton Grid ─────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col gap-4 min-h-[260px]">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          <div className="flex justify-between items-start">
            <div className="h-6 w-36 bg-slate-800 rounded-xl" />
            <div className="h-5 w-16 bg-slate-800/80 rounded-full" />
          </div>
          <div className="h-5 w-24 bg-slate-800/60 rounded-lg" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-full bg-slate-800/80 rounded-lg" />
            <div className="h-3.5 w-5/6 bg-slate-800/60 rounded-lg" />
            <div className="h-3.5 w-4/6 bg-slate-800/40 rounded-lg" />
          </div>
          <div className="h-11 w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ── Community Card Component ──────────────────────────────────────────────────
function CommunityCard({
  c,
  isActive,
  isMember,
  isPending,
  actionLoading,
  isAdmin,
  activeCommunityId,
  passwordInput,
  setPasswordInput,
  onJoin,
  onChallenge,
  onShare,
}: {
  c: Community & { playerCount?: number };
  isAr?: boolean;
  isActive: boolean;
  isMember: boolean;
  isPending: boolean;
  actionLoading: string | null;
  isAdmin: boolean;
  activeCommunityId: string | null;
  passwordInput: Record<string, string>;
  setPasswordInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onJoin: (c: Community) => void;
  onChallenge: (c: Community) => void;
  onShare: (c: Community) => void;
}) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const isPrivate = Boolean(c.isPrivate);
  const loading = actionLoading === c.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 ${
        isActive
          ? "bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-900/90 border-emerald-500/50 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/30"
          : "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700/80 shadow-md"
      }`}
    >
      {/* Hover bg shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-amber-500/0 group-hover:from-emerald-500/[0.04] group-hover:to-teal-500/[0.03] transition-all duration-500 pointer-events-none" />

      <div className="relative p-6 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-black text-white truncate leading-tight">{c.name}</h2>
              <button
                onClick={() => onShare(c)}
                title={isAr ? "مشاركة الرابط" : "Share Link"}
                className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-lg transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border
                ${c.isPrivate
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}>
                {c.isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                {c.isPrivate ? (isAr ? "خاص" : "Private") : (isAr ? "عام" : "Public")}
              </div>
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {isAr ? "نشط حالياً" : "Currently Active"}
                </span>
              )}
            </div>
          </div>

          {/* Player count badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-black text-white">{(c as any).playerCount ?? 0}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed flex-1 line-clamp-3" dir="auto">
          {c.description || (isAr ? "لا يوجد وصف لهذه الرابطة الكروية." : "No description provided.")}
        </p>

        {/* Password input for private communities */}
        <AnimatePresence>
          {c.isPrivate && !isMember && !isPending && !isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="password"
                placeholder={isAr ? "كلمة المرور للدخول" : "Enter password to join"}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                value={passwordInput[c.id] || ""}
                onChange={(e) => setPasswordInput(prev => ({ ...prev, [c.id]: e.target.value }))}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="space-y-2 mt-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onJoin(c)}
            disabled={isPending || loading}
            className={`relative group/btn w-full py-3.5 rounded-2xl font-black text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2 cursor-pointer
              ${isActive
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                : isPending
                ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                : isMember
                ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20"
              }`}
          >
            {!isActive && !isPending && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-600 ease-in-out pointer-events-none" />
            )}
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              <><CheckCircle2 className="w-4 h-4" />{isAr ? "المجتمع النشط" : "Currently Active"}</>
            ) : isPending ? (
              <><Clock className="w-4 h-4" />{isAr ? "قيد المراجعة" : "Pending Approval"}</>
            ) : isMember ? (
              <><ChevronRight className="w-4 h-4 rtl:rotate-180" />{isAr ? "دخول المجتمع" : "Enter Community"}</>
            ) : (
              <><Plus className="w-4 h-4" />{isAr ? "طلب انضمام" : "Request to Join"}</>
            )}
          </motion.button>

          {/* Challenge button — only show for admins on other communities */}
          {isAdmin && activeCommunityId && c.id !== activeCommunityId && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChallenge(c)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 hover:border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5" />
              {isAr ? "تحدي هذا المجتمع" : "Challenge Community"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page Content ──────────────────────────────────────────────────────────
function CommunitiesContent() {
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const { activeCommunityId, setActiveCommunityId, activeCommunity } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "mine" | "public" | "private">("all");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Challenge modal state
  const [challengeTarget, setChallengeTarget] = useState<Community | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [myChallenges, setMyChallenges] = useState<CommunityChallenge[]>([]);

  const { userProfile, setUserProfile } = useAuthProfile(user);

  // ── Challenges listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeCommunityId) return;
    const unsub1 = onSnapshot(query(collection(db, "community_challenges"), where("challengerCommunityId", "==", activeCommunityId)), (snap) => {
      const list: CommunityChallenge[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityChallenge));
      setMyChallenges(prev => [...prev.filter(c => c.challengerCommunityId !== activeCommunityId), ...list]);
    }, (err) => {
      if (err?.code !== 'permission-denied') console.warn("Challenge unsub1 error:", err);
    });
    const unsub2 = onSnapshot(query(collection(db, "community_challenges"), where("targetCommunityId", "==", activeCommunityId)), (snap) => {
      const list: CommunityChallenge[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityChallenge));
      setMyChallenges(prev => [...prev.filter(c => c.targetCommunityId !== activeCommunityId), ...list]);
    }, (err) => {
      if (err?.code !== 'permission-denied') console.warn("Challenge unsub2 error:", err);
    });
    return () => { unsub1(); unsub2(); };
  }, [activeCommunityId]);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [authLoading, user, router]);

  // ── Fetch communities ───────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "communities"));
        const data = await Promise.all(snap.docs.map(async (d) => {
          let count = 0;
          try {
            count = (await getCountFromServer(collection(db, "communities", d.id, "players"))).data().count;
          } catch {
            try { count = (await getDocs(collection(db, "communities", d.id, "players"))).size; } catch {}
          }
          return { id: d.id, ...d.data(), playerCount: count } as Community & { playerCount: number };
        }));

        data.sort((a, b) => {
          if (a.id === activeCommunityId) return -1;
          if (b.id === activeCommunityId) return 1;
          return ((b as any).playerCount || 0) - ((a as any).playerCount || 0);
        });
        setCommunities(data);

        // Check if there is an auto-join query param (?join=COMMUNITY_ID)
        const autoJoinId = searchParams?.get("join");
        if (autoJoinId) {
          const target = data.find(c => c.id === autoJoinId);
          if (target) {
            setActiveCommunityId(target.id);
            toast.success(isAr ? `تم دخول ${target.name}` : `Entered ${target.name}`);
            router.push("/community");
          }
        }
      } catch (err) {
        console.error("Failed to fetch communities:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, activeCommunityId, searchParams, setActiveCommunityId, isAr, router]);

  // ── Filtered Communities ────────────────────────────────────────────────────
  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      // Search
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Filter tab
      if (filterTab === "public") return !c.isPrivate;
      if (filterTab === "private") return c.isPrivate;
      if (filterTab === "mine") {
        return (
          activeCommunityId === c.id ||
          userProfile?.memberCommunities?.includes(c.id) ||
          userProfile?.joinedCommunities?.includes(c.id) ||
          c.adminUid === user?.uid ||
          isOwner
        );
      }
      return true;
    });
  }, [communities, searchQuery, filterTab, activeCommunityId, userProfile, user, isOwner]);

  // ── Join handler ────────────────────────────────────────────────────────────
  const handleJoin = async (community: Community) => {
    if (!user) { toast.error(isAr ? "يجب تسجيل الدخول أولاً" : "Must be logged in to join"); return; }
    if (!userProfile) { toast.error(isAr ? "يجب إكمال ملفك الشخصي أولاً" : "Complete your profile first"); router.push("/onboarding"); return; }

    const { doc, setDoc, updateDoc, arrayUnion } = await import("firebase/firestore");

    const isMember = userProfile.memberCommunities?.includes(community.id) || community.adminUid === user.uid || isOwner;
    if (isMember) { setActiveCommunityId(community.id); toast.success(isAr ? `تم دخول ${community.name}` : `Entered ${community.name}`); router.push("/community"); return; }
    if (userProfile.pendingCommunities?.includes(community.id)) { toast.success(isAr ? "طلبك قيد المراجعة" : "Your request is pending"); return; }

    if (community.isPrivate && passwordInput[community.id] !== community.password) {
      toast.error(isAr ? "كلمة المرور غير صحيحة" : "Incorrect password"); return;
    }

    setActionLoading(community.id);
    try {
      const cleanProfile = { ...userProfile, role: "member", joinedAt: new Date().toISOString() };
      delete (cleanProfile as any).pendingCommunities;
      delete (cleanProfile as any).memberCommunities;
      delete (cleanProfile as any).joinedCommunities;

      await setDoc(doc(db, "communities", community.id, "players", user.uid), cleanProfile, { merge: true });
      await updateDoc(doc(db, "players", user.uid), { memberCommunities: arrayUnion(community.id), joinedCommunities: arrayUnion(community.id) });
      setUserProfile((prev: any) => ({ ...prev, memberCommunities: [...(prev?.memberCommunities || []), community.id], joinedCommunities: [...(prev?.joinedCommunities || []), community.id] }));
      setActiveCommunityId(community.id);
      toast.success(isAr ? `انضممت إلى ${community.name}!` : `Joined ${community.name}!`);
      router.push("/community");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل الانضمام" : "Failed to join");
    } finally {
      setActionLoading(null);
    }
  };

  const handleShareLink = (c: Community) => {
    const shareUrl = `${window.location.origin}/communities?join=${c.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(isAr ? "تم نسخ رابط الانضمام!" : "Join link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={isAr ? "rtl" : "ltr"}>

      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[400px] rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-4">
            <Globe className="w-3.5 h-3.5" />
            {isAr ? "دليل المجتمعات والكؤوس" : "Communities & Leagues Directory"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
            {isAr ? "اختر مجتمعك الكروي" : "Choose Your Community"}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            {isAr ? "انضم إلى مجتمعات الكرة، أدر المباريات، تتبع الإحصائيات وتنافس على الجوائز الفردية والجماعية." : "Join a football community, organize matches, track stats, and compete for individual & team honours."}
          </p>
        </motion.div>

        {/* Create community CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/60 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-md shadow-2xl shadow-emerald-950/30"
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? "إدارة وتنظيم مجاني" : "Host & Manage Matches"}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white mb-2">
              {isAr ? "أنشئ مجتمعك الخاص وأدر بطولاتك" : "Create & Manage Your Own Community"}
            </h3>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              {isAr
                ? "هل أنتم مجموعة أصدقاء أو رابطة تنظمون حجوزات ومباريات؟ أنشئ مجتمعكم الآن مجاناً لتتبع إحصائيات اللاعبين وتقييم الأداء!"
                : "Are you a group of friends or a league organizing weekly matches? Create your community now for free to balance teams and track live match stats!"}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 z-10">
            {isAdmin || isOwner ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>{isAr ? "إنشاء مجتمع جديد" : "Create New Community"}</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const msg = encodeURIComponent(isAr ? "مرحباً، أرغب في إنشاء مجتمع جديد." : "Hello, I'd like to create a new community.");
                  router.push(`/support?msg=${msg}`);
                }}
                className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{isAr ? "طلب إنشاء مجتمع" : "Request a Community"}</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Active challenges banner */}
        <AnimatePresence>
          {myChallenges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4 }}
              className="mb-8 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-slate-900/60 p-6 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-400">
                    {isAr ? "تحديات المجتمعات النشطة" : "Active Inter-Community Challenges"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? "تنسيق المباريات والتفاوض مع المجتمعات الأخرى" : "Coordinate matches and negotiate with rival communities"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myChallenges.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-white truncate">
                        {ch.challengerCommunityName} <span className="text-amber-400">vs</span> {ch.targetCommunityName}
                      </p>
                      <span className="text-[11px] font-semibold text-amber-400/80">
                        {ch.status === "approved" ? (isAr ? "🎉 معتمد ومغلق للتشكيلة" : "🎉 Approved & Squads Locked")
                          : ch.status === "deal_reached" ? (isAr ? "🤝 تم الاتفاق! اختر تشكيلتك" : "🤝 Deal Reached! Lock Squad")
                          : (isAr ? "💬 جاري التفاوض..." : "💬 Negotiating...")}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setChallengeTarget(null); setActiveChallengeId(ch.id); }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shrink-0 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                    >
                      {isAr ? "فتح" : "Open"}
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute top-3.5 left-4 rtl:left-auto rtl:right-4 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isAr ? "بحث عن مجتمع..." : "Search community..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 rtl:pl-4 rtl:pr-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl w-full md:w-auto overflow-x-auto hide-scrollbar">
            {[
              { id: "all", labelAr: "الكل", labelEn: "All" },
              { id: "mine", labelAr: "مجتمعاتي", labelEn: "My Communities" },
              { id: "public", labelAr: "عامة", labelEn: "Public" },
              { id: "private", labelAr: "خاصة", labelEn: "Private" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  filterTab === tab.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Communities grid */}
        {loading ? (
          <SkeletonGrid />
        ) : filteredCommunities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8"
          >
            <Globe className="w-14 h-14 mx-auto mb-4 text-slate-700" />
            <p className="text-lg font-bold text-slate-300">
              {isAr ? "لم نجد مجتمعات تطابق البحث" : "No communities match your search"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? "جرّب تغيير كلمات البحث أو تصفح كافة المجتمعات." : "Try changing filter keywords or browse all communities."}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommunities.map((c, i) => {
              const isActive = activeCommunityId === c.id;
              const isMember = isActive
                || userProfile?.memberCommunities?.includes(c.id)
                || userProfile?.joinedCommunities?.includes(c.id)
                || c.adminUid === user?.uid
                || isOwner;
              const isPending = !!userProfile?.pendingCommunities?.includes(c.id);

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CommunityCard
                    c={c}
                    isAr={isAr}
                    isActive={isActive}
                    isMember={!!isMember}
                    isPending={isPending}
                    actionLoading={actionLoading}
                    isAdmin={isAdmin}
                    activeCommunityId={activeCommunityId}
                    passwordInput={passwordInput}
                    setPasswordInput={setPasswordInput}
                    onJoin={handleJoin}
                    onChallenge={(community) => { setActiveChallengeId(null); setChallengeTarget(community); }}
                    onShare={handleShareLink}
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Challenge Modal */}
        <CommunityChallengeModal
          isOpen={!!challengeTarget || !!activeChallengeId}
          onClose={() => { setChallengeTarget(null); setActiveChallengeId(null); }}
          activeCommunityId={activeCommunityId || ""}
          activeCommunityName={activeCommunity?.name || (isAr ? "مجتمعي" : "My Community")}
          targetCommunity={challengeTarget}
          existingChallengeId={activeChallengeId}
        />

        {/* Create Community Modal */}
        <CreateCommunityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(newId) => {
            setActiveCommunityId(newId);
            router.push("/community");
          }}
        />
      </main>
    </div>
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading communities...</div>}>
      <CommunitiesContent />
    </Suspense>
  );
}

