"use client";

import React, { useState, useEffect, useRef, cloneElement } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useLocale } from "@/components/ui/ThemeProvider";
import SettingsMenu from "@/components/layout/SettingsMenu";
import { ShieldAlert, Menu, X, Users, Globe, User, BookOpen, BarChart3, Swords, Home, MessageCircle, MessagesSquare, HeadphonesIcon, InboxIcon, Settings2, Bell, Trophy, Sparkles, Edit3, Shirt, Activity, Newspaper, Receipt, Flame, Zap, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunity } from "@/contexts/CommunityContext";
import { collection, query, orderBy, limit, onSnapshot, doc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import QuickMatchGeneratorModal from "@/components/match/QuickMatchGeneratorModal";
import CommandPaletteModal from "@/components/ui/CommandPaletteModal";

import { Suspense } from "react";

const PUBLIC_ROUTES = ["/", "/guide", "/privacy", "/tos", "/cookie"];

function SidebarContent() {
  const { user, isAdmin, isOwner, isGlobalModerator, loading: authLoading, hasInitialCommunityLoad } = useAuth();
  const { userProfile } = useAuthProfile(user);
  const { activeCommunityId, loadingCommunity } = useCommunity();
  const { locale } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAr = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [isQuickMatchOpen, setIsQuickMatchOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  // Global Ctrl+K / Cmd+K listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [pendingEditsCount, setPendingEditsCount] = useState(0);
  const lastNotifiedTimeRef = useRef<number>(0);
  const lastNotifToastTimeRef = useRef<number>(Date.now());
  const lastEditToastTimeRef = useRef<number>(Date.now());
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Synchronously check if Firebase auth credentials exist in localStorage
  const [hasCachedUser] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return Object.keys(localStorage).some((k) => k.startsWith("firebase:authUser"));
    } catch (e) {
      return false;
    }
  });

  // Auto-scroll active link inside sidebar container ONLY (does NOT scroll document window)
  useEffect(() => {
    if (activeLinkRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeLinkRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        const offsetTop = element.offsetTop - container.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
        container.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
      }
    }
  }, [pathname, searchParams]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Listen for Personal Notifications (updates unread count badge; AdviceNotification.tsx handles the live toast popups)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
    const unsub = onSnapshot(q, (snap) => {
      setUnreadNotifsCount(snap.docs.length);
    }, (err) => {
      if (err?.code !== 'permission-denied') console.warn("Sidebar notifications snapshot warning:", err);
    });
    return () => unsub();
  }, [user]);

  // Listen for Global Chat Notifications (Admin/Moderator Inbox)
  useEffect(() => {
    if (!user || (!isOwner && !isGlobalModerator)) return;

    const q = query(collection(db, "support_threads"), orderBy("lastUpdatedAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      let unread = 0;
      let latestUnreadThread: any = null;
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if ((data.unreadCount && data.unreadCount > 0) || data.unreadForAdmin === true) {
          unread++;
          if (!latestUnreadThread) latestUnreadThread = { id: docSnap.id, ...data };
        }
      });

      setUnreadInboxCount(unread);

      // Trigger UI site toast notification if new message arrived recently
      if (latestUnreadThread && latestUnreadThread.lastUpdatedAt) {
        const msgTime = latestUnreadThread.lastUpdatedAt.toDate ? latestUnreadThread.lastUpdatedAt.toDate().getTime() : new Date(latestUnreadThread.lastUpdatedAt).getTime();
        const now = Date.now();
        if (now - msgTime < 20000 && msgTime > lastNotifiedTimeRef.current && pathnameRef.current !== "/inbox") {
          lastNotifiedTimeRef.current = msgTime;
          toast.custom((t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                router.push("/inbox");
              }}
              className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/40 hover:scale-[1.02] transition-all"
            >
              <div className="relative h-11 w-11 shrink-0">
                <Image src={latestUnreadThread.userPic || "/logo.jpg"} alt="" fill sizes="44px" className="rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
              </div>
              <div className="flex-1 w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                  <span>💬 {latestUnreadThread.userName || (isAr ? 'رسالة دعم جديدة' : 'New Support Message')}</span>
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                  {latestUnreadThread.lastMessage || (isAr ? 'أرسل رسالة جديدة' : 'Sent a message')}
                </p>
              </div>
            </div>
          ), { duration: 6000, position: 'top-center' });
        }
      }
    }, (err) => {
      if (err?.code !== 'permission-denied') console.warn("Sidebar support_threads snapshot warning:", err);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOwner, isGlobalModerator]);

  // Listen for Admin Edit Requests & System Feed (Self-edits / Peer Proposals)
  useEffect(() => {
    if (!user || (!isAdmin && !isOwner && !isGlobalModerator)) return;

    const editsQuery = activeCommunityId 
      ? query(collection(db, `communities/${activeCommunityId}/editRequests`), limit(20))
      : query(collection(db, 'editRequests'), limit(20));

    const unsubEdits = onSnapshot(editsQuery, (snap) => {
      setPendingEditsCount(snap.size || 0);

      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const reqTime = data.requestedAt ? new Date(data.requestedAt).getTime() : Date.now();
          const now = Date.now();
          if (now - reqTime < 30000 && reqTime > lastEditToastTimeRef.current && pathnameRef.current !== "/admin") {
            lastEditToastTimeRef.current = reqTime;
            toast.custom((t) => (
              <div
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push("/admin?tab=edits");
                }}
                className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/50 hover:scale-[1.02] transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xl">⚡</span>
                </div>
                <div className="flex-1 w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{data.playerName || (isAr ? 'طلب مراجعة جديد' : 'New Review Request')}</span>
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                    {data.source === 'peer_ratings' ? (isAr ? 'تم اقتراح تقييم وقدرات جديدة للاعب' : 'Peer rating suggestion submitted') : (isAr ? 'طلب تعديل ملف شخصي وقدرات' : 'Profile edit request submitted')}
                  </p>
                </div>
              </div>
            ), { duration: 6000, position: 'top-center' });
          }
        }
      });
    }, () => {
      setPendingEditsCount(0);
    });

    return () => unsubEdits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, isOwner, isGlobalModerator, activeCommunityId]);

  // Listen for Global Chat Notifications (Regular User Support Desk)
  useEffect(() => {
    if (!user || isOwner || isGlobalModerator) return;

    const unsub = onSnapshot(doc(db, "support_threads", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.unreadForUser === true) {
          setUnreadSupportCount(1);
          if (data.lastUpdatedAt) {
            const msgTime = data.lastUpdatedAt.toDate ? data.lastUpdatedAt.toDate().getTime() : new Date(data.lastUpdatedAt).getTime();
            const now = Date.now();
            if (now - msgTime < 20000 && msgTime > lastNotifiedTimeRef.current && pathnameRef.current !== "/support") {
              lastNotifiedTimeRef.current = msgTime;
              toast.custom((t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.push("/support");
                  }}
                  className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/40 hover:scale-[1.02] transition-all"
                >
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <HeadphonesIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                      <span>🎧 {isAr ? 'رد من الدعم الفني' : 'Support Desk Reply'}</span>
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                      {data.lastMessage || (isAr ? 'تم الرد على استفسارك' : 'New reply on your ticket')}
                    </p>
                  </div>
                </div>
              ), { duration: 6000, position: 'top-center' });

              const notifId = `support-${msgTime}`;
              const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
              if (!deletedIds.includes(notifId) && !localStorage.getItem(`created_${notifId}`)) {
                localStorage.setItem(`created_${notifId}`, 'true');
                import('firebase/firestore').then(({ setDoc, doc, serverTimestamp }) => {
                  setDoc(doc(db, "users", user.uid, "notifications", notifId), {
                    type: "admin",
                    title: isAr ? 'رد من الدعم الفني' : 'Support Desk Reply',
                    body: data.lastMessage || (isAr ? 'تم الرد على استفسارك' : 'New reply on your ticket'),
                    read: false,
                    createdAt: serverTimestamp(),
                    link: "/support"
                  }, { merge: true }).catch(console.error);
                });
              }
            }
          }
        } else {
          setUnreadSupportCount(0);
        }
      }
    }, (err) => {
      console.warn("Sidebar user support_thread snapshot warning:", err);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOwner, isGlobalModerator]);

  // Listen for Unrated Recent Matches
  useEffect(() => {
    if (!user || !activeCommunityId) return;

    // We look for matches finished recently
    const q = query(collection(db, "communities", activeCommunityId, "matches"), orderBy("generatedAt", "desc"), limit(3));
    const unsub = onSnapshot(q, async (snap) => {
      for (const docSnap of snap.docs) {
        const matchData = docSnap.data();
        if (matchData.status === 'finished' || matchData.recordedStats) {
          // Check if user was in this match
          const inTeamA = (matchData.teamA || []).some((p: any) => p.uid === user.uid);
          const inTeamB = (matchData.teamB || []).some((p: any) => p.uid === user.uid);
          
          if (inTeamA || inTeamB) {
            // Check if user already rated it
            const { getDoc } = await import('firebase/firestore');
            const ratingDoc = await getDoc(doc(db, 'communities', activeCommunityId, 'matches', docSnap.id, 'ratings', user.uid));
            
            if (!ratingDoc.exists()) {
              const matchTime = matchData.finishedAt ? new Date(matchData.finishedAt).getTime() : Date.now();
              // Notify for matches finished in the last 24 hours (not just 2)
              if (Date.now() - matchTime < 24 * 60 * 60 * 1000) {
                // Show toast notification
                toast.custom((t) => (
                  <div
                    onClick={() => {
                      toast.dismiss(t.id);
                      // Navigate to match history tab — ?tab=history now parsed by match page
                      window.location.href = "/match?tab=history";
                    }}
                    className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-amber-500/40 hover:scale-[1.02] transition-all"
                  >
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm flex-shrink-0 text-xl">
                      ⭐
                    </div>
                    <div className="flex-1 w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{isAr ? 'تقييم المباراة' : 'Rate Match'}</span>
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {isAr ? 'انتهت المباراة! اضغط هنا لتقييم أداء زملائك' : 'Match finished! Click here to rate your teammates.'}
                      </p>
                    </div>
                  </div>
                ), { duration: 8000, position: 'top-center', id: 'rate-match-toast' });

                const rateNotifId = `rate-match-${docSnap.id}`;
                const deletedNotifs: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
                if (!deletedNotifs.includes(rateNotifId) && !localStorage.getItem(`created_${rateNotifId}`)) {
                  localStorage.setItem(`created_${rateNotifId}`, 'true');
                  import('firebase/firestore').then(({ setDoc, doc, serverTimestamp }) => {
                    setDoc(doc(db, "users", user.uid, "notifications", rateNotifId), {
                      type: "match",
                      title: isAr ? 'تقييم المباراة' : 'Rate Match',
                      body: isAr ? 'انتهت المباراة! اضغط هنا لتقييم أداء زملائك' : 'Match finished! Click here to rate your teammates.',
                      read: false,
                      createdAt: serverTimestamp(),
                      link: "/match?tab=history"
                    }, { merge: true }).catch(console.error);
                  });
                }

                break; // Only show for the most recent unrated match
              }
            }
          }
        }
      }
    }, (err) => {
      if (err?.code !== 'permission-denied') console.warn("Sidebar user support_thread snapshot warning:", err);
    });

    return () => unsub();
  }, [user, activeCommunityId, isAr]);

  const linkGroups = [
    {
      titleEn: "Community Workspace",
      titleAr: "مساحة المجتمع",
      items: [
        { href: "/communities", labelEn: "Communities", labelAr: "المجتمعات", icon: <Globe className="w-5 h-5" /> },
        ...(activeCommunityId ? [
          { href: `/community`, labelEn: "Home / Players", labelAr: "الرئيسية / اللاعبين", icon: <Home className="w-5 h-5" /> },
          { href: `/kit-builder`, labelEn: "Kit & Crest Builder", labelAr: "مصمم الأطقم والشعار", icon: <Shirt className="w-5 h-5" /> },
          { href: `/matches`, labelEn: "Matches & Hagaz", labelAr: "المباريات والحجز", icon: <Swords className="w-5 h-5" /> },
          { href: `/live`, labelEn: "Live Broadcaster", labelAr: "البث والتحكم المباشر", icon: <Activity className="w-5 h-5" /> },
          { href: `/newspaper`, labelEn: "Post-Match Newspaper", labelAr: "جريدة الهجوزات", icon: <Newspaper className="w-5 h-5" /> },
          { href: `/split-bill`, labelEn: "Turf Split Bill", labelAr: "حاسبة تقاسم الحجز", icon: <Receipt className="w-5 h-5" /> },
          { href: `/leaderboard`, labelEn: "Leaderboard & Awards", labelAr: "المتصدريين والجوائز", icon: <BarChart3 className="w-5 h-5" /> },
          { href: `/derby`, labelEn: "Derby Rivalries H2H", labelAr: "الديربي والمواجهات", icon: <Flame className="w-5 h-5" /> },
        ] : [
          { href: `/kit-builder`, labelEn: "Kit & Crest Builder", labelAr: "مصمم الأطقم والشعار", icon: <Shirt className="w-5 h-5" /> },
          { href: `/newspaper`, labelEn: "Post-Match Newspaper", labelAr: "جريدة الهجوزات", icon: <Newspaper className="w-5 h-5" /> },
          { href: `/split-bill`, labelEn: "Turf Split Bill", labelAr: "حاسبة تقاسم الحجز", icon: <Receipt className="w-5 h-5" /> },
          { href: `/derby`, labelEn: "Derby Rivalries H2H", labelAr: "الديربي والمواجهات", icon: <Flame className="w-5 h-5" /> },
        ]),
      ]
    },
    {
      titleEn: "Personal Hub",
      titleAr: "الحساب الشخصي",
      items: [
        { href: "/pro-pass", labelEn: "11Players PRO Pass", labelAr: "اشتراك PRO Pass", icon: <Crown className="w-5 h-5 text-amber-400" /> },
        ...(user ? [
          { href: userProfile?.username ? `/${userProfile.username}` : `/profile?uid=${user.uid}`, labelEn: "My Profile", labelAr: "ملفي الشخصي", icon: <User className="w-5 h-5" /> },
          { href: "/skill-tree", labelEn: "Achievements", labelAr: "الإنجازات", icon: <Trophy className="w-5 h-5" /> },
          { href: "/notifications", labelEn: "Notifications", labelAr: "الإشعارات", icon: <Bell className="w-5 h-5" /> }
        ] : []),
      ]
    },
    ...(isAdmin || isOwner || isGlobalModerator ? [{
      titleEn: "Admin & Management",
      titleAr: "إدارة المنصة والمجتمع",
      items: [
        ...(isAdmin ? [{ href: "/admin", labelEn: "Admin Dashboard", labelAr: "لوحة التحكم واقتراحات القدرات", icon: <ShieldAlert className="w-5 h-5" />, badge: pendingEditsCount > 0 ? pendingEditsCount : undefined }] : []),
        { href: "/season-ceremony", labelEn: "Season Ceremony", labelAr: "حفل ختام الموسم والتتويج", icon: <Trophy className="w-5 h-5" /> },
        { href: "/announcements", labelEn: "Announcements", labelAr: "بث الإعلانات", icon: <Sparkles className="w-5 h-5" /> },
        ...(isOwner || isAdmin ? [
          { href: "/analytics", labelEn: "Platform Analytics", labelAr: "تحليلات وإحصائيات المنصة", icon: <BarChart3 className="w-5 h-5 text-emerald-400" /> },
        ] : []),
        ...(isOwner ? [
          { href: "/users", labelEn: "Users List", labelAr: "قائمة المستخدمين", icon: <Users className="w-5 h-5" /> },
          { href: "/owner", labelEn: "Owner Control", labelAr: "التحكم الشامل", icon: <ShieldAlert className="w-5 h-5" /> },
        ] : [])
      ]
    }] : []),
    {
      titleEn: "Help & Rules",
      titleAr: "المساعدة والقوانين",
      items: [
        { href: "/guide", labelEn: "Guide & Rules", labelAr: "الدليل والقوانين", icon: <BookOpen className="w-5 h-5" /> },
      ]
    }
  ];

  // Public pages should not reserve sidebar space or flash skeleton for guests
  if (PUBLIC_ROUTES.includes(pathname) && !user) {
    return null;
  }

  const isDefinitelyGuest = !user && !authLoading && !hasCachedUser;

  // Hide sidebar completely when user is not logged in
  if (isDefinitelyGuest) {
    return null;
  }
  
  // Show skeleton only while Firebase auth is resolving for logged in users
  if (authLoading) {
    return (
      <aside className="flex-shrink-0 z-50 md:w-80">
        {/* Mobile Top Bar - minimal placeholder */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 rounded-b-3xl shadow-sm">
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md -z-10 rounded-b-3xl" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Menu className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="11Players" width={32} height={32} className="rounded-lg object-cover shadow-sm" priority />
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-xl tracking-tight">11Players</span>
            </div>
          </div>
        </div>
        {/* Desktop sidebar - skeleton with pulse items */}
        <div
          className="hidden md:block fixed md:sticky top-0 md:top-4 h-screen md:h-[calc(100vh-2rem)] w-72 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 z-50 rounded-3xl mx-4 shadow-2xl shadow-black/20 p-4 space-y-4"
          style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center gap-3 p-2 border-b border-slate-200/50 dark:border-slate-800/50 rounded-t-3xl pb-4">
            <Image src="/logo.jpg" alt="11Players Logo" width={40} height={40} className="rounded-xl object-cover shadow-sm" priority />
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-2xl tracking-tight">11Players</span>
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex-shrink-0 z-50 md:w-80">
      {/* Mobile Top Bar (Always Fixed at Top While Scrolling) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[100] h-16 px-4 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative">
            <Menu className="w-5 h-5" />
            {(unreadInboxCount > 0 || unreadSupportCount > 0 || unreadNotifsCount > 0 || pendingEditsCount > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-slate-900" />
            )}
          </button>
          <Link href="/communities" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="11Players" width={32} height={32} className="rounded-lg object-cover shadow-sm" priority />
            <span className="font-black text-emerald-400 text-xl tracking-tight">11Players</span>
          </Link>
        </div>
        <SettingsMenu direction="down" />
      </div>

      {/* Spacer for Fixed Mobile Top Bar */}
      <div className="h-16 md:hidden" />

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/80 z-[105] md:hidden backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container (Dynamic viewport height on mobile, sticky on desktop) */}
      <div
        className={`fixed md:sticky top-0 md:top-4 bottom-0 md:bottom-auto h-[100dvh] md:h-[calc(100vh-2rem)] md:max-h-[90vh] w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 z-[110] md:z-50 overflow-hidden transform transition-transform duration-300 ease-in-out shadow-2xl shadow-emerald-500/5 ${
          isOpen ? "translate-x-0" : isAr ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isAr ? "right-0 left-auto rounded-l-3xl md:rounded-3xl md:mx-4" : "left-0 right-auto rounded-r-3xl md:rounded-3xl md:mx-4"}`}
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="w-full h-full flex flex-col relative">
          
          {/* Logo Area (Fixed Header) */}
          <div className={`flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 ${isAr ? "rounded-tl-3xl md:rounded-t-3xl" : "rounded-tr-3xl md:rounded-t-3xl"}`} style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
            <Link href="/communities" className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="11Players Logo" width={40} height={40} className="rounded-xl object-cover shadow-sm" priority />
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-2xl tracking-tight">11Players</span>
            </Link>
            <button onClick={toggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Categorized Links */}
          <div ref={scrollContainerRef} className="py-5 px-3 flex flex-col gap-5 flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
            {linkGroups.map((group, gIdx) => {
              if (group.items.length === 0) return null;
              return (
                <div key={gIdx} className="space-y-1.5">
                  <div className="px-3 mb-1 text-[10px] font-black tracking-widest uppercase text-slate-400/80 dark:text-slate-600 flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200/60 dark:bg-slate-800/60" />
                    <span className="shrink-0">{isAr ? group.titleAr : group.titleEn}</span>
                    <div className="h-px flex-1 bg-slate-200/60 dark:bg-slate-800/60" />
                  </div>
                  <div className="space-y-1">
                    {group.items.map((link: any) => {
                      const baseHref = link.href.split("?")[0];
                      const cleanPathname = pathname.replace(/\/$/, '') || '/';
                      let isActive = cleanPathname === baseHref;
                      if (cleanPathname === '/profile' && baseHref === '/profile') {
                        const currentUidParam = searchParams?.get('uid');
                        isActive = !currentUidParam || currentUidParam === user?.uid;
                      }

                      return (
                        <Link
                          ref={isActive ? activeLinkRef : null}
                          key={link.href}
                          href={link.href}
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-150 font-bold text-sm group ${
                              isActive
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                                isActive
                                  ? 'bg-white/20'
                                  : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
                              }`}>
                                {cloneElement(link.icon, {
                                  className: `w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-500'}`,
                                })}
                              </div>
                            <span className="truncate">{isAr ? link.labelAr : link.labelEn}</span>
                          </div>
                          {link.badge !== undefined && link.badge > 0 ? (
                            <span className="min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-black rounded-full shadow-sm shadow-red-500/40 animate-pulse flex items-center justify-center flex-shrink-0">
                              {link.badge > 99 ? "99+" : link.badge}
                            </span>
                          ) : ((link.href === "/notifications" && unreadNotifsCount > 0) || (link.href === "/inbox" && unreadInboxCount > 0) || (link.href === "/support" && unreadSupportCount > 0)) ? (
                            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Settings Area (Fixed Footer) */}
          <div className="mt-auto flex-shrink-0 p-4 border-t border-slate-200/40 dark:border-slate-800/40 bg-white/80 dark:bg-slate-900/80 hidden md:block md:rounded-b-3xl" style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-600 font-semibold select-none">
                © 2026 11Players
              </span>
              <SettingsMenu direction="up" />
            </div>
          </div>
        </div>
      </div>
      <QuickMatchGeneratorModal isOpen={isQuickMatchOpen} onClose={() => setIsQuickMatchOpen(false)} />
      <CommandPaletteModal isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onOpenQuickMatch={() => setIsQuickMatchOpen(true)} />
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={
      <div className="hidden md:block w-72 h-[90vh] bg-slate-900/40 rounded-3xl border border-slate-800/80 animate-pulse mx-4" />
    }>
      <SidebarContent />
    </Suspense>
  );
}
