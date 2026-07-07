"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SupportThread, ChatMessage } from "@/types";
import { Send, Loader2, ArrowLeft, Image as ImageIcon, X, MessageSquare, Search, Sparkles, RefreshCw, ShieldCheck, CheckCheck, User, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";

export default function InboxPage() {
  const { user, isGlobalModerator } = useAuth();
  const { locale } = useLocale();
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
    
    // Mark as read when opening
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
                className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/30 hover:scale-[1.02] transition-all"
              >
                <img className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-700" src={newMsg.senderPic || "/logo.jpg"} alt="" />
                <div className="flex-1 w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>💬 {newMsg.senderName || (isAr ? 'مستخدم' : 'User')}</span>
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !imageFile) || !user || !activeThreadId) return;

    const currentText = replyText.trim();
    setReplyText("");
    const currentImage = imageFile;
    setImageFile(null);

    let imageUrl = null;
    if (currentImage) {
      setUploadingImage(true);
      imageUrl = await uploadImageToCloudinary(currentImage);
      setUploadingImage(false);
      if (!imageUrl) {
        toast.error(isAr ? "فشل رفع الصورة" : "Failed to upload image");
        return;
      }
    }

    try {
      const threadRef = doc(db, "support_threads", activeThreadId);
      
      await setDoc(threadRef, {
        lastMessage: imageUrl ? (isAr ? "📷 صورة" : "📷 Image") : currentText,
        lastUpdatedAt: serverTimestamp(),
        unreadCount: 0,
        unreadForAdmin: false,
        unreadForUser: true
      }, { merge: true });

      await addDoc(collection(threadRef, "messages"), {
        senderUid: user.uid,
        senderName: user.displayName || "Admin Support",
        senderPic: user.photoURL || "/logo.jpg",
        text: currentText,
        ...(imageUrl ? { imageUrl } : {}),
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إرسال الرد" : "Failed to send reply");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isAr ? "حجم الصورة كبير جداً" : "Image too large");
        return;
      }
      setImageFile(file);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);
  const filteredThreads = threads.filter(t => 
    (t.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-7xl mx-auto px-2 md:px-6 h-[calc(100vh-120px)] flex">
          
          {/* Glassmorphic Chat App Container */}
          <div className="w-full h-full flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            
            {/* --- LEFT SIDEBAR: THREADS LIST --- */}
            <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40`}>
              
              {/* Sidebar Header */}
              <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black tracking-tight">{isAr ? "البريد الوارد" : "Inbox"}</h1>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{isAr ? "دعم وتواصل اللاعبين" : "Player Support Hub"}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-full border border-emerald-500/20">
                    {threads.length} {isAr ? "محادثة" : "Chats"}
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative flex items-center">
                  <Search className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                  <input 
                    type="text"
                    placeholder={isAr ? "البحث بالاسم أو الرسالة..." : "Search chats or names..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-white dark:bg-slate-800/80 rounded-2xl py-2.5 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 focus:ring-2 focus:ring-emerald-500 transition-all outline-none shadow-sm`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className={`absolute ${isAr ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loadingThreads ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-xs font-bold text-slate-400">{isAr ? "جاري تحميل المحادثات..." : "Loading conversations..."}</span>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-slate-400 my-auto py-20 gap-3 text-center">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-1 border border-slate-200 dark:border-slate-700">
                      <MessageSquare className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">{isAr ? "لا توجد محادثات مطابقة" : "No matching chats"}</p>
                    <p className="text-xs max-w-[200px]">{isAr ? "لم يتم العثور على أي رسائل حالياً" : "When users send support messages, they will appear here"}</p>
                  </div>
                ) : (
                  filteredThreads.map(t => {
                    const isSelected = activeThreadId === t.id;
                    const hasUnread = (t?.unreadCount || 0) > 0 || t?.unreadForAdmin === true;
                    
                    return (
                      <motion.button 
                        whileHover={{ scale: 0.995 }}
                        whileTap={{ scale: 0.98 }}
                        key={t.id}
                        onClick={() => setActiveThreadId(t.id)}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer relative ${
                          isSelected 
                            ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 shadow-sm' 
                            : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        {/* Avatar with Online Dot */}
                        <div className="relative flex-shrink-0">
                          {t.userPic ? (
                            <Image src={t.userPic} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" width={48} height={48} />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-white text-lg shadow-sm">
                              {t.userName?.charAt(0) || "U"}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                        </div>

                        {/* Thread Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`font-black text-sm truncate ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                              {t.userName || "Player"}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
                              {formatTime(t.lastUpdatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs truncate ${hasUnread ? 'font-black text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                              {t.lastMessage || (isAr ? "بدأ محادثة جديدة" : "Started a conversation")}
                            </p>
                            {hasUnread && (
                              <span className="w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/40 animate-pulse">
                                {t.unreadCount || 1}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* --- RIGHT AREA: CHAT WINDOW --- */}
            <div className={`${!activeThreadId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-gradient-to-b from-slate-50/40 via-slate-100/20 to-slate-50/40 dark:from-slate-950/60 dark:via-slate-900/40 dark:to-slate-950/60`}>
              
              {!activeThreadId ? (
                /* Instagram / WhatsApp Empty State */
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 p-8 text-center">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-xl mb-6 ring-8 ring-emerald-500/5 animate-pulse"
                  >
                    <MessageSquare className="w-12 h-12 text-emerald-500" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
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
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveThreadId(null)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="relative">
                        {activeThread?.userPic ? (
                          <Image src={activeThread.userPic} alt="" className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" width={44} height={44} />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-black text-white text-base shadow-sm">
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
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          {isAr ? "نشط ومتاح الآن" : "Active Now • Player"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile?uid=${activeThread?.id}`}
                        target="_blank"
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60"
                        title={isAr ? "عرض الملف الشخصي" : "View Profile"}
                      >
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{isAr ? "الملف" : "Profile"}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div ref={scrollRef} className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-3.5">
                    {loadingMessages ? (
                      <div className="flex-1 flex flex-col justify-center items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-xs font-bold text-slate-400">{isAr ? "جاري جلب الرسائل..." : "Fetching messages..."}</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-3xl flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
                          <Sparkles className="w-8 h-8 text-amber-500 animate-bounce" />
                        </div>
                        <p className="font-extrabold text-slate-700 dark:text-slate-300 mb-1">{isAr ? "بداية المحادثة" : "Start of Conversation"}</p>
                        <p className="text-xs max-w-xs">{isAr ? "قم بإرسال رسالة ترحيبية للاعب للبدء في المساعدة" : "Send a message below to reply to this player"}</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderUid === user?.uid;
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            key={msg.id || idx} 
                            className={`flex gap-2.5 max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                          >
                            {!isMe && (
                              <Image 
                                src={msg.senderPic || activeThread?.userPic || "/logo.jpg"} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 self-end mb-1 flex-shrink-0 shadow-sm" 
                                width={32} 
                                height={32} 
                              />
                            )}
                            <div className={`px-4 py-3 rounded-3xl relative text-sm shadow-md flex flex-col gap-2 ${
                              isMe 
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-emerald-500/15' 
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-sm'
                            }`}>
                              {msg.imageUrl && (
                                <div className="w-full max-w-sm rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-black/10" onClick={() => window.open(msg.imageUrl, '_blank')}>
                                  <Image src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300" width={400} height={400} />
                                </div>
                              )}
                              {msg.text && <p className="leading-relaxed break-words font-medium">{msg.text}</p>}
                              
                              <div className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                                <span>{formatTime(msg.timestamp)}</span>
                                {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline" />}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Bar */}
                  <div className="p-3 md:p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 z-20">
                    <form onSubmit={handleReply} className="flex gap-2.5 items-end">
                      <div className="flex-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all p-2 flex flex-col shadow-inner">
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
                            placeholder={isAr ? "اكتب ردك للاعب..." : "Type your message..."}
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
                        className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 text-white shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center flex-shrink-0"
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
    </ProtectedRoute>
  );
}
