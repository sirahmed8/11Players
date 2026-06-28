"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SupportThread, ChatMessage } from "@/types";
import { Send, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InboxPage() {
  const { user, isGlobalModerator } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setMessages(msgs);
      setLoadingMessages(false);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsub();
  }, [activeThreadId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !activeThreadId) return;

    const currentText = text.trim();
    setText("");

    try {
      await addDoc(collection(db, "support_threads", activeThreadId, "messages"), {
        senderUid: user.uid,
        senderName: "Support Team",
        senderPic: "", // Default logo could be here
        text: currentText,
        timestamp: serverTimestamp(),
      });
      await setDoc(doc(db, "support_threads", activeThreadId), {
        lastMessage: currentText,
        lastUpdatedAt: serverTimestamp(),
        unreadCount: 0 
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-6xl mx-auto px-4 h-[calc(100vh-140px)] flex bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* Threads List */}
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

          {/* Chat Area */}
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
                        <div key={msg.id} className={`flex max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                          <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-700 rounded-bl-sm'}`}>
                            {msg.text}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                      type="text" 
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={isAr ? "اكتب رسالتك..." : "Type message..."}
                      className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!text.trim()}
                      className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
                    >
                      <Send className="w-5 h-5" />
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
