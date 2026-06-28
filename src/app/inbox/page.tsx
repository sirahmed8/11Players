"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SupportThread, ChatMessage } from "@/types";
import { Send, Loader2, ArrowLeft, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import toast from "react-hot-toast";

export default function InboxPage() {
  const { user, isGlobalModerator } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [threads, setThreads] = useState<SupportThread[]>([]);
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
    
    const q = query(
      collection(db, "support_threads", activeThreadId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      
      setMessages(prev => {
        if (prev.length > 0 && msgs.length > prev.length) {
          const newMsg = msgs[msgs.length - 1];
          if (newMsg.senderUid !== user?.uid && Notification.permission === "granted" && document.hidden) {
            new Notification("New Support Message", {
              body: newMsg.text || "Sent an image",
              icon: "/logo.jpg"
            });
          }
        }
        return msgs;
      });

      setLoadingMessages(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => unsub();
  }, [activeThreadId]);

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
        lastMessage: imageUrl ? (isAr ? "صورة" : "Image") : currentText,
        lastUpdatedAt: serverTimestamp(),
        unreadCount: 0
      }, { merge: true });

      await addDoc(collection(threadRef, "messages"), {
        senderUid: user.uid,
        senderName: user.displayName || "Admin",
        senderPic: user.photoURL || "",
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-6xl mx-auto px-4 h-[calc(100vh-140px)] flex bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50`}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h1 className="text-xl font-black">{isAr ? "البريد الوارد" : "Inbox"}</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingThreads ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center text-slate-500">{isAr ? "لا توجد رسائل" : "No messages"}</div>
              ) : (
                threads.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`w-full text-left p-4 border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 ${activeThreadId === t.id ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
                  >
                    {t.userPic ? (
                      <img src={t.userPic} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center font-bold text-slate-500">
                        {t.userName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{t.userName}</div>
                      <div className="text-xs text-slate-500 truncate">{t.lastMessage}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={`${!activeThreadId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative`}>
            {!activeThreadId ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                {isAr ? "اختر محادثة للبدء" : "Select a conversation to start"}
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <button onClick={() => setActiveThreadId(null)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {activeThread?.userPic ? (
                    <img src={activeThread.userPic} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center font-bold text-slate-500">
                      {activeThread?.userName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <div className="font-bold">{activeThread?.userName}</div>
                    <div className="text-xs text-slate-500">{activeThread?.id}</div>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                  {loadingMessages ? (
                    <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex justify-center items-center text-slate-400">No messages found.</div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.senderUid === user?.uid;
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id} 
                          className={`flex max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}
                        >
                          <div className={`px-4 py-2 rounded-2xl relative z-10 text-sm shadow-sm flex flex-col gap-2 ${
                            isMe 
                              ? 'bg-emerald-500 text-white rounded-br-sm' 
                              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm border border-slate-200 dark:border-slate-600'
                          }`}>
                            {msg.imageUrl && (
                              <div className="w-full max-w-sm rounded-xl overflow-hidden cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')}>
                                <img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover" />
                              </div>
                            )}
                            {msg.text && <p>{msg.text}</p>}
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                  <form onSubmit={handleReply} className="flex gap-2 items-end pt-4">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 transition-all p-2 flex flex-col">
                      {imageFile && (
                        <div className="flex items-center gap-2 p-2 mb-2 bg-white dark:bg-slate-800 rounded-lg relative self-start shadow-sm border border-slate-200 dark:border-slate-700">
                          <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                          <button type="button" onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors">
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <input 
                          type="text" 
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder={isAr ? "اكتب ردك..." : "Type your reply..."}
                          disabled={uploadingImage}
                          className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm p-1 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={(!replyText.trim() && !imageFile) || uploadingImage}
                      className="px-4 py-4 h-14 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center flex-shrink-0"
                    >
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
