"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/types";
import { Send, Loader2, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export default function SupportPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Create/update the thread document so it shows in the Owner's Inbox
    const threadRef = doc(db, "support_threads", user.uid);
    setDoc(threadRef, {
      id: user.uid,
      userName: user.displayName || "Unknown User",
      userPic: user.photoURL || "",
      lastMessage: "Started a conversation...",
      lastUpdatedAt: serverTimestamp(),
    }, { merge: true }).catch(console.error);

    const q = query(
      collection(db, "support_threads", user.uid, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      
      setMessages(prev => {
        // Check for new messages if we already have some loaded
        if (prev.length > 0 && msgs.length > prev.length) {
          const newMsg = msgs[msgs.length - 1];
          if (newMsg.senderUid !== user.uid && Notification.permission === "granted" && document.hidden) {
            new Notification("New Support Message", {
              body: newMsg.text,
              icon: "/logo.jpg"
            });
          }
        }
        return msgs;
      });
      
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    // Request permission for notifications on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => unsub();
  }, [user]);

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
        userPic: user.photoURL || "",
        lastMessage: imageUrl ? (isAr ? "صورة" : "Image") : currentText,
        lastUpdatedAt: serverTimestamp(),
        unreadCount: 1 // for the admin to read
      }, { merge: true });

      await addDoc(collection(threadRef, "messages"), {
        senderUid: user.uid,
        senderName: user.displayName || "User",
        senderPic: user.photoURL || "",
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-3xl mx-auto px-4 h-[calc(100vh-140px)] flex flex-col">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl p-6 border-b border-slate-200 dark:border-slate-700 shadow-sm">
            <h1 className="text-2xl font-black text-emerald-500">{isAr ? "الدعم الفني" : "Support"}</h1>
            <p className="text-sm text-slate-500">{isAr ? "تحدث مع المالك أو المشرفين مباشرة." : "Chat directly with the platform owner and moderators."}</p>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 bg-white dark:bg-slate-800 p-6 overflow-y-auto flex flex-col gap-4 shadow-sm"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <p>{isAr ? "لا توجد رسائل بعد. أرسل رسالة للبدء!" : "No messages yet. Send a message to start!"}</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderUid === user?.uid;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                  >
                    {!isMe && msg.senderPic && (
                      <img src={msg.senderPic} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                    )}
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
                );
              })
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-b-2xl shadow-sm border-t border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSend} className="flex gap-2 items-end">
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
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.heic" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input 
                    type="text" 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."}
                    disabled={uploadingImage}
                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm p-1 disabled:opacity-50"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={(!text.trim() && !imageFile) || uploadingImage}
                className="px-4 py-4 h-14 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center flex-shrink-0"
              >
                {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
