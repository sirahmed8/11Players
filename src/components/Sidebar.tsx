"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import SettingsMenu from "@/components/SettingsMenu";
import { ShieldAlert, Menu, X, Users, Globe, User, BookOpen, BarChart3, Swords, Home, MessageCircle, MessagesSquare, HeadphonesIcon, InboxIcon, Settings2, Bell, Trophy, Sparkles, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunity } from "@/contexts/CommunityContext";
import { collection, query, orderBy, limit, onSnapshot, doc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

const PUBLIC_ROUTES = ["/", "/guide", "/privacy", "/tos", "/cookie"];

export default function Sidebar() {
  const { user, isAdmin, isOwner, isGlobalModerator, loading: authLoading, hasInitialCommunityLoad } = useAuth();
  const { activeCommunityId, loadingCommunity } = useCommunity();
  const { locale } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAr = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const lastNotifiedTimeRef = useRef<number>(0);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Listen for Personal Notifications
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
    const unsub = onSnapshot(q, (snap) => {
      setUnreadNotifsCount(snap.docs.length);
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
        if (now - msgTime < 20000 && msgTime > lastNotifiedTimeRef.current && pathname !== "/inbox") {
          lastNotifiedTimeRef.current = msgTime;
          toast.custom((t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = "/inbox";
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
    });

    return () => unsub();
  }, [user, isOwner, isGlobalModerator, pathname, isAr]);

  // Listen for Admin Edit Requests & System Feed (Self-edits / Peer Proposals)
  useEffect(() => {
    if (!user || (!isAdmin && !isOwner && !isGlobalModerator)) return;

    const editsQuery = activeCommunityId 
      ? query(collection(db, `communities/${activeCommunityId}/editRequests`), limit(20))
      : query(collection(db, 'editRequests'), limit(20));

    const unsubEdits = onSnapshot(editsQuery, (snap) => {
      if (!snap.empty) {
        setUnreadNotifsCount(snap.size);
      }
    }, () => {});

    return () => unsubEdits();
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
            if (now - msgTime < 20000 && msgTime > lastNotifiedTimeRef.current && pathname !== "/support") {
              lastNotifiedTimeRef.current = msgTime;
              toast.custom((t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.href = "/support";
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
    });

    return () => unsub();
  }, [user, isOwner, isGlobalModerator, pathname, isAr]);

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
    });

    return () => unsub();
  }, [user, activeCommunityId, isAr]);

  const linkGroups = [
    {
      titleEn: "Community Workspace",
      titleAr: "مساحة المجتمع",
      items: [
        { href: "/communities", labelEn: "Communities", labelAr: "المجتمعات", icon: <Globe className="w-5 h-5 text-indigo-500" /> },
        ...(activeCommunityId ? [
          { href: `/community`, labelEn: "Home / Players", labelAr: "الرئيسية / اللاعبين", icon: <Home className="w-5 h-5 text-emerald-500" /> },
          { href: `/match`, labelEn: "Matches & Hagaz", labelAr: "المباريات والحجز", icon: <Swords className="w-5 h-5 text-amber-500" /> },
          { href: `/stats`, labelEn: "Leaderboard & Awards", labelAr: "المتصدريين والجوائز", icon: <BarChart3 className="w-5 h-5 text-sky-500" /> },
          { href: `/community-chat`, labelEn: "Community Chat", labelAr: "دردشة المجتمع", icon: <MessageCircle className="w-5 h-5 text-violet-500" /> },
        ] : []),
      ]
    },
    {
      titleEn: "Personal Hub",
      titleAr: "الحساب الشخصي",
      items: [
        ...(user ? [
          { href: `/profile?uid=${user.uid}`, labelEn: "My Profile", labelAr: "ملفي الشخصي", icon: <User className="w-5 h-5 text-blue-500" /> },
          { href: "/notifications", labelEn: "Notifications", labelAr: "الإشعارات", icon: <Bell className="w-5 h-5 text-rose-500" /> }
        ] : []),
      ]
    },
    ...(isAdmin || isOwner || isGlobalModerator ? [{
      titleEn: "Admin & Management",
      titleAr: "إدارة المنصة والمجتمع",
      items: [
        ...(isAdmin ? [{ href: "/admin", labelEn: "Admin Dashboard", labelAr: "لوحة التحكم واقتراحات القدرات", icon: <ShieldAlert className="w-5 h-5 text-amber-500" />, badge: unreadInboxCount > 0 ? unreadInboxCount : undefined }] : []),
        { href: "/season-ceremony", labelEn: "Season Ceremony", labelAr: "حفل ختام الموسم والتتويج", icon: <Trophy className="w-5 h-5 text-yellow-500" /> },
        { href: "/announcements", labelEn: "Announcements", labelAr: "بث الإعلانات", icon: <Sparkles className="w-5 h-5 text-orange-500" /> },
        { href: "/inbox", labelEn: "Support Inbox", labelAr: "بريد الدعم والشكاوى", icon: <InboxIcon className="w-5 h-5 text-purple-500" />, badge: unreadInboxCount > 0 ? unreadInboxCount : undefined },
        ...(isOwner ? [
          { href: "/users", labelEn: "Users List", labelAr: "قائمة المستخدمين", icon: <Users className="w-5 h-5 text-slate-400" /> },
          { href: "/owner", labelEn: "Owner Control", labelAr: "التحكم الشامل", icon: <ShieldAlert className="w-5 h-5 text-red-500" /> },
        ] : [])
      ]
    }] : []),
    {
      titleEn: "Help & Support",
      titleAr: "المساعدة والدعم",
      items: [
        { href: "/guide", labelEn: "Guide & Rules", labelAr: "الدليل والقوانين", icon: <BookOpen className="w-5 h-5 text-teal-500" /> },
        ...(user && !isOwner && !isGlobalModerator ? [{ href: "/support", labelEn: "Support Desk", labelAr: "الدعم الفني والشكاوى", icon: <HeadphonesIcon className="w-5 h-5 text-cyan-500" />, badge: unreadSupportCount > 0 ? unreadSupportCount : undefined }] : []),
      ]
    }
  ];

  // Public pages should not reserve sidebar/top-bar space while auth resolves.
  if (PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  // Hide sidebar completely when user is not logged in
  if (!user && !authLoading) {
    return null;
  }
  
  // Show skeleton only while Firebase auth is resolving.
  // activeCommunityId is read from localStorage synchronously, so no flicker needed for that.
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
        {/* Desktop sidebar - skeleton */}
        <div className="hidden md:block fixed md:sticky top-0 md:top-4 h-screen md:h-[calc(100vh-2rem)] w-72 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 z-50 rounded-3xl mx-4 shadow-2xl shadow-black/20"
          style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center gap-3 p-6 border-b border-slate-200/50 dark:border-slate-800/50 rounded-t-3xl">
            <Image src="/logo.jpg" alt="11Players Logo" width={40} height={40} className="rounded-xl object-cover shadow-sm" priority />
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-2xl tracking-tight">11Players</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex-shrink-0 z-50 md:w-80">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 rounded-b-3xl shadow-sm">
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md -z-10 rounded-b-3xl" />
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 relative">
            <Menu className="w-6 h-6" />
            {(unreadInboxCount > 0 || unreadSupportCount > 0 || unreadNotifsCount > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white dark:border-slate-900" />
            )}
          </button>
          <Link href="/communities" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="11Players" width={32} height={32} className="rounded-lg object-cover shadow-sm" priority />
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-xl tracking-tight">11Players</span>
          </Link>
        </div>
        <SettingsMenu direction="down" />
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div
        className={`fixed md:sticky top-0 md:top-4 h-screen md:h-[calc(100vh-2rem)] w-72 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl shadow-black/20 ${
          isOpen ? "translate-x-0" : isAr ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isAr ? "right-0 left-auto rounded-l-3xl md:rounded-3xl md:mx-4" : "left-0 right-auto rounded-r-3xl md:rounded-3xl md:mx-4"}`}
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
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
          <div className="py-5 px-3 flex flex-col gap-5 flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
            {linkGroups.map((group, gIdx) => {
              if (group.items.length === 0) return null;
              return (
                <div key={gIdx} className="space-y-1.5">
                  <div className="px-3 text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    <span>{isAr ? group.titleAr : group.titleEn}</span>
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
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-200 font-bold text-sm group ${
                            isActive
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            {link.icon}
                            <span className="truncate">{isAr ? link.labelAr : link.labelEn}</span>
                          </div>
                          {link.badge !== undefined && link.badge > 0 ? (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[11px] font-black rounded-full shadow-sm animate-pulse flex-shrink-0">
                              {link.badge}
                            </span>
                          ) : ((link.href === "/notifications" && unreadNotifsCount > 0) || (link.href === "/inbox" && unreadInboxCount > 0) || (link.href === "/support" && unreadSupportCount > 0)) ? (
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50 flex-shrink-0" />
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
          <div className="mt-auto flex-shrink-0 p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 hidden md:block md:rounded-b-3xl" style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
            <SettingsMenu direction="up" />
          </div>
        </div>
      </div>
    </aside>
  );
}
