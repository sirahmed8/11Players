"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/types";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SupportPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsub();
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const currentText = text.trim();
    setText("");

    try {
      await addDoc(collection(db, "support_threads", user.uid, "messages"), {
        senderUid: user.uid,
        senderName: user.displayName || "Unknown",
        senderPic: user.photoURL || "",
        text: currentText,
        timestamp: serverTimestamp(),
      });
      await setDoc(doc(db, "support_threads", user.uid), {
        lastMessage: currentText,
        lastUpdatedAt: serverTimestamp(),
        unreadCount: 1 // We'll implement unread counts properly later if needed
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
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
                    <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-b-2xl shadow-sm border-t border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSend} className="flex gap-2 relative">
              <input 
                type="text" 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!text.trim()}
                className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
