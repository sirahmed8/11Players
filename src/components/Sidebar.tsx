"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import SettingsMenu from "@/components/SettingsMenu";
import { ShieldAlert, Menu, X, Users, Globe, User, BookOpen, BarChart3, Swords, Home, MessageCircle, MessagesSquare, HeadphonesIcon, InboxIcon, Settings2, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunity } from "@/contexts/CommunityContext";
import { collection, query, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function Sidebar() {
  const { user, isAdmin, isOwner, isGlobalModerator } = useAuth();
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const pathname = usePathname();
  const isAr = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const lastNotifiedTimeRef = useRef<number>(0);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);

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
              <img className="h-11 w-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" src={latestUnreadThread.userPic || "/logo.jpg"} alt="" />
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
            }
          }
        } else {
          setUnreadSupportCount(0);
        }
      }
    });

    return () => unsub();
  }, [user, isOwner, isGlobalModerator, pathname, isAr]);

  const links = [
    { href: "/communities", labelEn: "Communities", labelAr: "المجتمعات", icon: <Globe className="w-5 h-5" /> },
    ...(activeCommunityId ? [
      { href: `/community`, labelEn: "Home / Players", labelAr: "الرئيسية / اللاعبين", icon: <Home className="w-5 h-5" /> },
      { href: `/match`, labelEn: "Matches", labelAr: "المباريات", icon: <Swords className="w-5 h-5" /> },
      { href: `/stats`, labelEn: "Leaderboard", labelAr: "المتصدريين", icon: <BarChart3 className="w-5 h-5" /> },
      { href: `/community-chat`, labelEn: "Community Chat", labelAr: "دردشة المجتمع", icon: <MessageCircle className="w-5 h-5" /> },
    ] : []),
    ...(user ? [{ href: `/profile?uid=${user.uid}`, labelEn: "My Profile", labelAr: "ملفي الشخصي", icon: <User className="w-5 h-5" /> }] : []),
    { href: "/guide", labelEn: "Guide", labelAr: "الدليل", icon: <BookOpen className="w-5 h-5" /> },
    ...(user ? [{ href: "/notifications", labelEn: "Notifications", labelAr: "الإشعارات", icon: <Bell className="w-5 h-5" /> }] : []),
    ...(user && !isOwner && !isGlobalModerator ? [{ href: "/support", labelEn: "Support", labelAr: "الدعم الفني", icon: <HeadphonesIcon className="w-5 h-5" /> }] : []),
    ...(isOwner || isGlobalModerator ? [{ href: "/inbox", labelEn: "Inbox", labelAr: "البريد الوارد", icon: <InboxIcon className="w-5 h-5" /> }] : []),
  ];

  // Hide sidebar completely on Welcome page if not logged in
  if (pathname === "/" && !user) {
    return null;
  }

  return (
    <aside className="flex-shrink-0 z-50">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 rounded-b-3xl shadow-sm">
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md -z-10 rounded-b-3xl" />
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 relative">
            <Menu className="w-6 h-6" />
            {(unreadInboxCount > 0 || unreadSupportCount > 0) && (
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

          {/* Links */}
          <div className="py-6 px-4 flex flex-col gap-2 flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
            {links.map((link) => {
              const baseHref = link.href.split("?")[0];
              const cleanPathname = pathname.replace(/\/$/, '') || '/';
              const isActive = cleanPathname === baseHref;
              const hasUnreadDot = (link.href === "/inbox" && unreadInboxCount > 0) || (link.href === "/support" && unreadSupportCount > 0);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold relative ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    <span>{isAr ? link.labelAr : link.labelEn}</span>
                  </div>
                  {hasUnreadDot && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50 flex-shrink-0" />
                  )}
                </Link>
              );
            })}

            {isOwner && (
              <Link
                href="/users"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold mt-4 ${
                  pathname.startsWith("/users")
                    ? "bg-slate-800 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>{isAr ? "المستخدمين" : "Users"}</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold mt-4 ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                <span>{isAr ? "إدارة المجتمع" : "Admin"}</span>
              </Link>
            )}

            {isOwner && (
              <Link
                href="/owner"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                  pathname.startsWith("/owner")
                    ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                    : "text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                <span>{isAr ? "المالك" : "Owner"}</span>
              </Link>
            )}
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
