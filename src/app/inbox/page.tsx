"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SupportThread, ChatMessage } from "@/types";
import { Send, Loader2, ArrowLeft, Image as ImageIcon, X, MessageSquare, Search, Sparkles, RefreshCw, ShieldCheck, CheckCheck, User, ExternalLink, Reply, SmilePlus, Trash2, Pin, PinOff, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function InboxPage() {
  const { user, isGlobalModerator } = useAuth();
  const { locale } = useLocale();
  const { theme } = useTheme();
  const isAr = locale === "ar";
  
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Chat features state
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [reactingToMsgId, setReactingToMsgId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isGlobalModerator) return;
    
    const q = query(collection(db, "support_threads"), orderBy("lastUpdatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const thrds = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportThread));
      setThreads(thrds);
      setLoadingThreads(false);
    });

    return () => unsub();
  }, [isGlobalModerator]);

  useEffect(() => {
    if (!activeThreadId) return;
    setLoadingMessages(true);
    
    const threadRef = doc(db, "support_threads", activeThreadId);
    updateDoc(threadRef, { unreadCount: 0, unreadForAdmin: false }).catch(() => {});

    const q = query(
      collection(db, "support_threads", activeThreadId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      
      setMessages(prev => {
        if (prev.length > 0 && msgs.length > prev.length) {
          const newMsg = msgs[msgs.length - 1];
          if (newMsg.senderUid !== user?.uid) {
            toast.custom((t) => (
              <div
                onClick={() => toast.dismiss(t.id)}
                className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-3xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/30 hover:scale-[1.02] transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  💬
                </div>
                <div className="flex-1 w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{newMsg.senderName || (isAr ? 'مستخدم' : 'User')}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                    {newMsg.text || (isAr ? 'أرسل صورة' : 'Sent an image')}
                  </p>
                </div>
              </div>
            ), { duration: 5000, position: 'top-center' });
          }
        }
        return msgs;
      });

      setLoadingMessages(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsub();
  }, [activeThreadId, user?.uid, isAr]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !imageFile) || !user || !activeThreadId) return;

    const messageText = replyText.trim();
    const fileToUpload = imageFile;
    const isEditing = !!editingMessage;
    const targetEditId = editingMessage?.id;
    const replyTargetId = replyTo?.id;

    setReplyText("");
    setImageFile(null);
    setReplyTo(null);
    setEditingMessage(null);

    try {
      let imageUrl: string | null = "";
      if (fileToUpload) {
        setUploadingImage(true);
        try {
          const res = await uploadImageToCloudinary(fileToUpload);
          if (!res) throw new Error("Upload failed");
          imageUrl = res;
        } catch (err) {
          toast.error(isAr ? "فشل رفع الصورة" : "Failed to upload image");
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      if (isEditing && targetEditId) {
        await updateDoc(doc(db, "support_threads", activeThreadId, "messages", targetEditId), {
          text: messageText,
          ...(imageUrl ? { imageUrl } : {}),
          isEdited: true
        });
        toast.success(isAr ? "تم تعديل الرد" : "Reply updated");
        return;
      }

      const threadRef = doc(db, "support_threads", activeThreadId);
      await setDoc(threadRef, {
        lastMessage: `🎧 ${messageText || "Image"}`,
        lastUpdatedAt: serverTimestamp(),
        unreadCount: 1,
        unreadForUser: true,
        unreadForAdmin: false
      }, { merge: true });

      const messagesRef = collection(db, "support_threads", activeThreadId, "messages");
      const newMsgData: any = {
        senderUid: user.uid,
        senderName: isAr ? "الدعم الفني (مشرف)" : "Official Support",
        senderPic: "/logo.jpg",
        text: messageText,
        timestamp: serverTimestamp()
      };
      if (imageUrl) newMsgData.imageUrl = imageUrl;
      if (replyTargetId) newMsgData.replyToId = replyTargetId;

      await addDoc(messagesRef, newMsgData);
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء إرسال الرد" : "Error sending reply");
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    if (!user?.uid || !activeThreadId) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const currentReactions = msg.reactions || {};
    const hasReacted = currentReactions[user.uid] === emoji;
    const newReactions = { ...currentReactions };
    
    if (hasReacted) {
      delete newReactions[user.uid];
    } else {
      newReactions[user.uid] = emoji;
    }

    try {
      await updateDoc(doc(db, "support_threads", activeThreadId, "messages", msgId), {
        reactions: newReactions
      });
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!user?.uid || !activeThreadId) return;
    try {
      await deleteDoc(doc(db, "support_threads", activeThreadId, "messages", msgId));
      setShowDeleteConfirm(null);
      toast.success(isAr ? "تم حذف الرسالة" : "Message deleted");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل حذف الرسالة" : "Failed to delete message");
    }
  };

  const formatTime = (ts: any) => {
    if (!ts || !ts.toDate) return "";
    return ts.toDate().toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTogglePinThread = async (e: React.MouseEvent, threadId: string, currentPinned?: boolean) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, "support_threads", threadId), {
        isPinned: !currentPinned
      });
      toast.success(!currentPinned ? (isAr ? "تم تثبيت المحادثة" : "Chat pinned") : (isAr ? "تم إلغاء تثبيت المحادثة" : "Chat unpinned"));
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل التعديل" : "Failed to update");
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const messagesSnap = await getDocs(collection(db, "support_threads", threadId, "messages"));
      const deletePromises = messagesSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, "support_threads", threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
      }
      toast.success(isAr ? "تم حذف المحادثة" : "Chat deleted");
    } catch (err) {
      console.error("Delete thread error:", err);
      toast.error(isAr ? "فشل حذف المحادثة" : "Failed to delete chat");
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);
  const filteredThreads = threads.filter(t => 
    t.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <ProtectedRoute ownerOnly>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12 font-sans" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-6xl mx-auto px-4 h-[calc(100vh-130px)] flex flex-col">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex overflow-hidden">
            
            {/* Left Sidebar: Threads List */}
            <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-e border-slate-200 dark:border-slate-800 flex-col bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0`}>
              
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h1 className="font-black text-lg text-slate-900 dark:text-white">{isAr ? "البريد الوارد" : "Inbox"}</h1>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {threads.length} {isAr ? "محادثات" : "Chats"}
                  </span>
                </div>

                <div className="relative w-full">
                  <Search className="w-5 h-5 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={isAr ? "ابحث بالاسم أو المحادثة..." : "Search chats or names..."}
                    className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
                {loadingThreads ? (
                  <SiteSkeletonLoader variant="list" />
                ) : filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold">{isAr ? "لا توجد رسائل دعم فني." : "No support chats found."}</div>
                ) : (
                  filteredThreads.map(thread => {
                    const isSelected = thread.id === activeThreadId;
                    const hasUnread = thread.unreadCount > 0 || thread.unreadForAdmin;
                    return (
                      <button
                        type="button"
                        key={thread.id}
                        onClick={() => setActiveThreadId(thread.id)}
                        className={`w-full p-3 rounded-2xl text-left rtl:text-right transition-all flex items-start gap-3 relative ${
                          isSelected 
                            ? "bg-emerald-500 text-white shadow-md font-bold" 
                            : hasUnread
                            ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-slate-900 dark:text-white font-extrabold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          {thread.userPic ? (
                            <Image src={thread.userPic} alt="" className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" width={40} height={40} referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-slate-700 text-white flex items-center justify-center font-black text-sm">
                              {thread.userName?.charAt(0) || "U"}
                            </div>
                          )}
                          {hasUnread && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {thread.isPinned && (
                                <span className="text-amber-500" title={isAr ? "مثبتة" : "Pinned"}>📌</span>
                              )}
                              <span className="font-black text-sm truncate">{thread.userName || "Player"}</span>
                              {thread.status === 'closed' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg shrink-0">🔒 {isAr ? "مغلق" : "Closed"}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleTogglePinThread(e, thread.id, thread.isPinned)}
                                className={`p-1 rounded-lg hover:bg-black/10 transition-colors ${thread.isPinned ? 'text-amber-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}
                                title={thread.isPinned ? (isAr ? "إلغاء التثبيت" : "Unpin") : (isAr ? "تثبيت" : "Pin")}
                              >
                                {thread.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setThreadToDelete(thread.id); }}
                                className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title={isAr ? "حذف" : "Delete"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                {formatTime(thread.lastUpdatedAt)}
                              </span>
                            </div>
                          </div>
                          <p className={`text-xs truncate ${isSelected ? 'text-emerald-50 font-medium' : hasUnread ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {thread.lastMessage || (isAr ? 'رسالة جديدة' : 'New message')}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Area: Chat Window */}
            <div className={`${!activeThreadId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-slate-50/50 dark:bg-slate-950/50`}>
              
              {!activeThreadId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 p-8 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-md mb-4">
                    <MessageSquare className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                    {isAr ? "محادثات الدعم الفني الخاصة" : "11Players Support Desk"}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                    {isAr ? "اختر محادثة من القائمة للرد على اللاعبين وحل المشكلات بأسلوب فوري وسريع." : "Select a player conversation from the sidebar to start chatting, send photos, and assist users instantly."}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isAr ? "اتصال آمن ومشفر للمشرفين" : "End-to-end encrypted Admin Desk"}</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="bg-white dark:bg-slate-900 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-20 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setActiveThreadId(null)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="relative">
                        {activeThread?.userPic ? (
                          <Image src={activeThread.userPic} alt="" className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" width={40} height={40} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-white text-base shadow-sm">
                            {activeThread?.userName?.charAt(0) || "U"}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                            {activeThread?.userName || "Player"}
                          </h2>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                            ID: {activeThread?.id?.slice(0, 8)}...
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          {isAr ? "نشط ومتاح الآن" : "Active Now • Online"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleTogglePinThread(e, activeThread!.id, activeThread!.isPinned)}
                        className={`p-2 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                          activeThread?.isPinned
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title={activeThread?.isPinned ? (isAr ? "إلغاء التثبيت" : "Unpin Chat") : (isAr ? "تثبيت المحادثة" : "Pin Chat")}
                      >
                        {activeThread?.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        <span className="hidden sm:inline">{activeThread?.isPinned ? (isAr ? "مثبتة" : "Pinned") : (isAr ? "تثبيت" : "Pin")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveThreadId(null)}
                        className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
                        title={isAr ? "إغلاق نافذة المحادثة" : "Close Chat Screen"}
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">{isAr ? "إغلاق" : "Close"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setThreadToDelete(activeThread!.id)}
                        className="p-2 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
                        title={isAr ? "حذف المحادثة" : "Delete Chat"}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden md:inline">{isAr ? "حذف" : "Delete"}</span>
                      </button>

                      <Link
                        href={`/profile?uid=${activeThread?.id}`}
                        target="_blank"
                        className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700"
                        title={isAr ? "عرض الملف الشخصي" : "View Profile"}
                      >
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{isAr ? "الملف" : "Profile"}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div ref={scrollRef} className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
                    {loadingMessages ? (
                      <SiteSkeletonLoader variant="list" />
                    ) : messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
                          <Sparkles className="w-8 h-8 text-amber-500 animate-bounce" />
                        </div>
                        <p className="font-extrabold text-slate-700 dark:text-slate-300 mb-1">{isAr ? "بداية المحادثة" : "Start of Conversation"}</p>
                        <p className="text-xs max-w-xs">{isAr ? "قم بإرسال رسالة ترحيبية للاعب للبدء في المساعدة" : "Send a message below to reply to this player"}</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderUid === user?.uid;
                        const showAvatar = idx === 0 || messages[idx - 1].senderUid !== msg.senderUid;
                        const replyMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

                        // Group reactions
                        const reactionCounts = Object.values(msg.reactions || {}).reduce((acc: any, emoji: any) => {
                          acc[emoji] = (acc[emoji] || 0) + 1;
                          return acc;
                        }, {});

                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            key={msg.id || idx} 
                            className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end rtl:self-start' : 'self-start rtl:self-end'}`}
                          >
                            {!isMe && showAvatar && (
                              <span className="text-xs font-bold text-slate-500 mb-1 ml-11 rtl:mr-11 rtl:ml-0">{msg.senderName}</span>
                            )}
                            
                            <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse rtl:flex-row' : ''}`}>
                              {!isMe ? (
                                <div className="w-8 h-8 flex-shrink-0">
                                  {showAvatar ? (
                                    <Image 
                                      src={msg.senderPic || activeThread?.userPic || "/logo.jpg"} 
                                      alt="" 
                                      className="w-full h-full rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                                      width={32} 
                                      height={32} 
                                    />
                                  ) : <div className="w-8 h-8" />}
                                </div>
                              ) : null}

                              {/* Bubble Container */}
                              <div className="flex flex-col relative group">
                                
                                {/* Replied Message Banner */}
                                {replyMsg && (
                                  <div className={`text-xs p-3 rounded-2xl mb-1.5 opacity-90 border-l-4 rtl:border-l-0 rtl:border-r-4 ${isMe ? 'bg-emerald-600/20 border-emerald-500 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 border-indigo-500 text-slate-800 dark:text-slate-200'}`}>
                                    <div className="font-bold mb-0.5 flex items-center gap-1"><Reply className="w-3 h-3" /> {replyMsg.senderName}</div>
                                    <div className="truncate max-w-[200px] font-medium">{replyMsg.text}</div>
                                  </div>
                                )}

                                {/* Bubble Body */}
                                <div className={`px-4 py-3 rounded-3xl relative z-10 text-sm shadow-sm flex flex-col gap-2 ${
                                  isMe 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {msg.imageUrl && (
                                    <div className="w-full max-w-sm rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-black/10" onClick={() => window.open(msg.imageUrl, '_blank')}>
                                      <Image src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300" width={400} height={400} />
                                    </div>
                                  )}
                                  {msg.text && <p className="leading-relaxed break-words font-medium">{msg.text}</p>}
                                  
                                  <div className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-emerald-100/90' : 'text-slate-400'}`}>
                                    {msg.isEdited && <span>({isAr ? 'معدل' : 'edited'})</span>}
                                    <span>{formatTime(msg.timestamp)}</span>
                                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-white inline" />}
                                  </div>

                                  {/* Quick Action Buttons (Hover) */}
                                  <div className={`absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 p-1 z-20 ${isMe ? 'right-full mr-2 rtl:right-auto rtl:left-full rtl:ml-2' : 'left-full ml-2 rtl:left-auto rtl:right-full rtl:mr-2'}`}>
                                    <button type="button" onClick={() => setReplyTo(msg)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors" title={isAr ? "رد" : "Reply"}>
                                      <Reply className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleReaction(msg.id!, '👍')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">👍</button>
                                    <button type="button" onClick={() => handleReaction(msg.id!, '❤️')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">❤️</button>
                                    <button type="button" onClick={() => setReactingToMsgId(msg.id!)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors" title={isAr ? "تفاعل" : "React"}>
                                      <SmilePlus className="w-3.5 h-3.5" />
                                    </button>
                                    {isMe && (
                                      <button type="button" onClick={() => { setReplyText(msg.text || ""); setEditingMessage(msg); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors" title={isAr ? "تعديل" : "Edit"}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                      </button>
                                    )}
                                    <button type="button" onClick={() => setShowDeleteConfirm(msg.id!)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors" title={isAr ? "حذف" : "Delete"}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Reaction Badges Under Bubble */}
                                {Object.keys(reactionCounts).length > 0 && (
                                  <div className={`flex flex-wrap gap-1 mt-1 z-10 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {Object.entries(reactionCounts).map(([emoji, count]: [string, any]) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleReaction(msg.id!, emoji)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform"
                                      >
                                        <span>{emoji}</span>
                                        {count > 1 && <span className="text-slate-500 text-[10px]">{count}</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Emoji Picker Popover */}
                                <AnimatePresence>
                                  {reactingToMsgId === msg.id && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className={`absolute top-full mt-2 z-50 ${isMe ? 'right-0' : 'left-0'}`}
                                    >
                                      <div className="relative">
                                        <button type="button" onClick={() => setReactingToMsgId(null)} className="absolute -top-2 -right-2 z-10 bg-slate-800 text-white rounded-full p-1 shadow-md hover:bg-slate-700">
                                          <X className="w-3 h-3" />
                                        </button>
                                        <EmojiPicker 
                                          theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                                          onEmojiClick={(e) => { 
                                            handleReaction(msg.id!, e.emoji); 
                                            setReactingToMsgId(null);
                                          }}
                                        />
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Delete Confirmation Modal */}
                  <AnimatePresence>
                    {showDeleteConfirm && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
                        >
                          <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
                          <h3 className="text-lg font-black mb-1">{isAr ? "حذف الرسالة؟" : "Delete Message?"}</h3>
                          <p className="text-xs text-slate-500 mb-6">{isAr ? "هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟" : "Are you sure you want to permanently delete this message?"}</p>
                          <div className="flex gap-3">
                            <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold text-sm hover:bg-slate-200 transition-colors">
                              {isAr ? "إلغاء" : "Cancel"}
                            </button>
                            <button type="button" onClick={() => handleDeleteMessage(showDeleteConfirm)} className="flex-1 py-2.5 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                              {isAr ? "حذف" : "Delete"}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Floating Sleek Input Bar */}
                  <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-20 flex-shrink-0">
                    
                    {/* Reply / Edit Banner */}
                    <AnimatePresence>
                      {(replyTo || editingMessage) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center justify-between px-4 py-2 mb-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {editingMessage ? (
                              <>
                                <span className="text-amber-500">✏️ {isAr ? 'تعديل الرسالة:' : 'Editing Message:'}</span>
                                <span className="truncate text-slate-600 dark:text-slate-300">{editingMessage.text}</span>
                              </>
                            ) : (
                              <>
                                <Reply className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">{isAr ? `الرد على ${replyTo?.senderName}:` : `Replying to ${replyTo?.senderName}:`}</span>
                                <span className="truncate text-slate-600 dark:text-slate-300">{replyTo?.text}</span>
                              </>
                            )}
                          </div>
                          <button 
                            type="button"
                            onClick={() => { setReplyTo(null); setEditingMessage(null); setReplyText(""); }} 
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleReply} className="flex gap-2.5 items-end">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 transition-all p-2 flex flex-col">
                        
                        {imageFile && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 p-2 mb-2 bg-white dark:bg-slate-900 rounded-2xl relative self-start shadow-md border border-slate-200 dark:border-slate-700">
                            <Image src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 w-16 object-cover rounded-xl" width={64} height={64} unoptimized />
                            <button type="button" onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-transform hover:scale-110">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        )}
                        
                        <div className="flex items-center gap-2 px-2">
                          <input type="file" accept=".jpg,.jpeg,.png,.webp,.heic" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-full transition-all">
                            <ImageIcon className="w-5 h-5" />
                          </button>
                          <input 
                            type="text" 
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={isAr ? "اكتب ردك للاعب..." : "Type your reply to player..."}
                            disabled={uploadingImage}
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm py-1.5 px-1 font-medium disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={(!replyText.trim() && !imageFile) || uploadingImage}
                        className="w-12 h-12 rounded-3xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white shadow-md transition-all flex items-center justify-center flex-shrink-0 font-bold"
                      >
                        {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </motion.button>
                    </form>
                  </div>

                </>
              )}
            </div>

          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={!!threadToDelete}
        onClose={() => setThreadToDelete(null)}
        onConfirm={() => threadToDelete ? handleDeleteThread(threadToDelete) : undefined}
        title={isAr ? "حذف المحادثة" : "Delete Chat"}
        message={isAr ? "هل أنت متأكد من رغبتك في حذف هذه المحادثة نهائياً؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to permanently delete this chat? This action cannot be undone."}
      />
    </ProtectedRoute>
  );
}
