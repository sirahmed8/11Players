"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/types";
import { Send, Loader2, Image as ImageIcon, X, MessageSquare, Sparkles, ArrowLeft, ShieldCheck, CheckCheck, Headphones, LifeBuoy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const msg = params.get("msg");
      if (msg) {
        setText(msg);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Create/update the thread document so it shows in the Owner's Inbox
    const threadRef = doc(db, "support_threads", user.uid);
    setDoc(threadRef, {
      id: user.uid,
      userName: user.displayName || "Unknown User",
      userPic: user.photoURL || "/logo.jpg",
      lastUpdatedAt: serverTimestamp(),
    }, { merge: true }).catch(console.error);

    // Clear unread badge for user when opening
    updateDoc(threadRef, { unreadForUser: false }).catch(() => {});

    const q = query(
      collection(db, "support_threads", user.uid, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      
      setMessages(prev => {
        if (prev.length > 0 && msgs.length > prev.length) {
          const newMsg = msgs[msgs.length - 1];
          if (newMsg.senderUid !== user.uid) {
            toast.custom((t) => (
              <div
                onClick={() => toast.dismiss(t.id)}
                className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/30 hover:scale-[1.02] transition-all"
              >
                <img className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-700" src={newMsg.senderPic || "/logo.jpg"} alt="" />
                <div className="flex-1 w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>💬 {newMsg.senderName || (isAr ? 'الدعم الفني' : '11Players Support')}</span>
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
      
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsub();
  }, [user, isAr]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || !user) return;

    const currentText = text.trim();
    setText("");
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
      const threadRef = doc(db, "support_threads", user.uid);
      await setDoc(threadRef, {
        id: user.uid,
        userName: user.displayName || "User",
        userPic: user.photoURL || "/logo.jpg",
        lastMessage: imageUrl ? (isAr ? "📷 صورة" : "📷 Image") : currentText,
        lastUpdatedAt: serverTimestamp(),
        unreadCount: 1, // for the admin to read
        unreadForAdmin: true,
        unreadForUser: false
      }, { merge: true });

      await addDoc(collection(threadRef, "messages"), {
        senderUid: user.uid,
        senderName: user.displayName || "User",
        senderPic: user.photoURL || "/logo.jpg",
        text: currentText,
        ...(imageUrl ? { imageUrl } : {}),
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إرسال الرسالة" : "Failed to send message");
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

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-4xl mx-auto px-2 md:px-6 h-[calc(100vh-120px)] flex flex-col">
          
          {/* Glassmorphic Support Chat Card */}
          <div className="w-full h-full flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between z-20 shadow-sm">
              <div className="flex items-center gap-3.5">
                <button onClick={() => router.back()} className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                      {isAr ? "الدعم الفني المباشر" : "11Players Official Support"}
                    </h1>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide">
                      {isAr ? "متصل 24/7" : "ONLINE"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {isAr ? "تواصل مع المالك وفريق الإشراف لحل أي استفسار بسرعة وسرية" : "Direct chat with Founders & Moderators for instant assistance"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? "محادثة مشفرة" : "Verified Desk"}</span>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 bg-gradient-to-b from-slate-50/40 via-slate-100/20 to-slate-50/40 dark:from-slate-950/60 dark:via-slate-900/40 dark:to-slate-950/60 p-4 md:p-6 overflow-y-auto flex flex-col gap-3.5"
            >
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <span className="text-xs font-bold text-slate-400">{isAr ? "جاري الاتصال بالدعم..." : "Connecting to support desk..."}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 my-auto py-8">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-3xl flex items-center justify-center mb-5 border border-emerald-500/30 shadow-lg ring-8 ring-emerald-500/5 animate-pulse"
                  >
                    <LifeBuoy className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    {isAr ? "مرحباً بك في الدعم الفني لـ 11Players" : "Welcome to 11Players Help Desk"}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
                    {isAr 
                      ? "نحن هنا لمساعدتك في إنشاء مجتمعك الخاص، إدارة حسابك، أو الرد على أي استفسار يخص المباريات والتقييمات."
                      : "We are here to assist you with setting up your community, managing your account, or resolving any platform questions."}
                  </p>
                  
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setText(isAr ? "أريد إنشاء المجتمع الخاص بي والدخول كمسؤول" : "I want to create my own community and become a host")}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2.5 text-xs md:text-sm"
                  >
                    <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                    {isAr ? "أريد إنشاء المجتمع الخاص بي" : "I want to create my community"}
                  </motion.button>
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
                      className={`flex items-end gap-2.5 max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      {!isMe && (
                        <Image 
                          src={msg.senderPic || "/logo.jpg"} 
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
              <form onSubmit={handleSend} className="flex gap-2.5 items-end">
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
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={isAr ? "اكتب رسالتك للدعم الفني..." : "Type your message to support..."}
                      disabled={uploadingImage}
                      className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm py-1.5 px-1 font-medium disabled:opacity-50"
                    />
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={(!text.trim() && !imageFile) || uploadingImage}
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 text-white shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center flex-shrink-0"
                >
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </motion.button>
              </form>
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
