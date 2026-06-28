"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/types";
import { Send, Loader2, ArrowLeft, Image as ImageIcon, X, Reply, SmilePlus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CommunityChatPage() {
  const { user, isAdmin } = useAuth();
  const { activeCommunityId, activeCommunity, communitySettings } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Slow mode logic
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!activeCommunityId) {
      router.push("/communities");
      return;
    }

    const q = query(
      collection(db, "communities", activeCommunityId, "chats"),
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
  }, [activeCommunityId, router]);

  useEffect(() => {
    // Cooldown timer
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !activeCommunityId) return;

    if (!isAdmin && communitySettings.slowModeDelay > 0) {
      const now = Date.now();
      const timeSinceLast = (now - lastMessageTime) / 1000;
      if (timeSinceLast < communitySettings.slowModeDelay) {
        toast.error(isAr ? `يرجى الانتظار ${Math.ceil(communitySettings.slowModeDelay - timeSinceLast)} ثانية` : `Please wait ${Math.ceil(communitySettings.slowModeDelay - timeSinceLast)}s`);
        return;
      }
    }

    const currentText = text.trim();
    setText("");
    const replyId = replyTo?.id || null;
    setReplyTo(null);

    try {
      await addDoc(collection(db, "communities", activeCommunityId, "chats"), {
        senderUid: user.uid,
        senderName: user.displayName || "User",
        senderPic: user.photoURL || "",
        text: currentText,
        timestamp: serverTimestamp(),
        ...(replyId ? { replyToId: replyId } : {}),
      });
      setLastMessageTime(Date.now());
      if (!isAdmin && communitySettings.slowModeDelay > 0) {
        setCooldown(communitySettings.slowModeDelay);
      }
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إرسال الرسالة" : "Failed to send message");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!activeCommunityId) return;
    try {
      await deleteDoc(doc(db, "communities", activeCommunityId, "chats", id));
      toast.success(isAr ? "تم حذف الرسالة" : "Message deleted");
    } catch (err) {
      toast.error(isAr ? "فشل الحذف" : "Failed to delete");
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    if (!activeCommunityId || !user) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const currentReactions = msg.reactions || {};
    const hasReacted = currentReactions[user.uid] === emoji;
    
    const newReactions = { ...currentReactions };
    if (hasReacted) {
      delete newReactions[user.uid]; // Toggle off
    } else {
      newReactions[user.uid] = emoji;
    }

    try {
      await updateDoc(doc(db, "communities", activeCommunityId, "chats", msgId), {
        reactions: newReactions
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeCommunityId) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-4xl mx-auto px-4 h-[calc(100vh-140px)] flex flex-col">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl p-4 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">{activeCommunity?.name || "Community Chat"}</h1>
              <p className="text-xs text-slate-500">
                {communitySettings.slowModeDelay > 0 && (
                  <span className="text-amber-500 font-semibold flex items-center gap-1">
                    {isAr ? `الوضع البطيء: ${communitySettings.slowModeDelay}ث` : `Slow mode: ${communitySettings.slowModeDelay}s`}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 bg-slate-100 dark:bg-slate-900/50 p-4 md:p-6 overflow-y-auto flex flex-col gap-6"
          >
            {loading ? (
              <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex justify-center items-center text-slate-400">
                {isAr ? "كن أول من يرسل رسالة!" : "Be the first to send a message!"}
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderUid === user?.uid;
                const showAvatar = index === 0 || messages[index - 1].senderUid !== msg.senderUid;
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
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}
                  >
                    {!isMe && showAvatar && (
                      <span className="text-xs text-slate-500 mb-1 ml-12 rtl:mr-12 rtl:ml-0">{msg.senderName}</span>
                    )}
                    
                    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      {!isMe ? (
                        <div className="w-8 h-8 flex-shrink-0">
                          {showAvatar ? (
                            <img src={msg.senderPic || '/placeholder.png'} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : <div className="w-8 h-8" />}
                        </div>
                      ) : null}

                      {/* Bubble Container */}
                      <div className="flex flex-col relative group">
                        
                        {/* Reply reference */}
                        {replyMsg && (
                          <div className={`text-xs p-2 rounded-t-xl mb-[-10px] opacity-75 ${isMe ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className="font-bold opacity-80">{replyMsg.senderName}</div>
                            <div className="truncate max-w-[200px]">{replyMsg.text}</div>
                          </div>
                        )}

                        {/* Main Bubble */}
                        <div className={`px-4 py-2 rounded-2xl relative z-10 text-sm shadow-sm ${
                          isMe 
                            ? 'bg-emerald-500 text-white rounded-br-sm' 
                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm border border-slate-200 dark:border-slate-600'
                        }`}>
                          {msg.text}
                          
                          {/* Quick Actions (Hover) */}
                          <div className={`absolute top-0 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 p-1 ${isMe ? 'right-0' : 'left-0'}`}>
                            <button onClick={() => setReplyTo(msg)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500">
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleReaction(msg.id, '👍')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">👍</button>
                            <button onClick={() => handleReaction(msg.id, '❤️')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">❤️</button>
                            {(isAdmin || isMe) && (
                              <button onClick={() => deleteMessage(msg.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reactions Display */}
                        {Object.keys(reactionCounts).length > 0 && (
                          <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                              <button 
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className={`text-xs px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${msg.reactions?.[user?.uid || ''] === emoji ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : ''}`}
                              >
                                <span>{emoji}</span>
                                <span className="opacity-75">{count as React.ReactNode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-b-2xl shadow-sm border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2 relative">
            <AnimatePresence>
              {replyTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg text-sm border-l-4 border-emerald-500"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Replying to {replyTo.senderName}</span>
                    <span className="truncate text-slate-600 dark:text-slate-400">{replyTo.text}</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <input 
                type="text" 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={cooldown > 0 ? (isAr ? `انتظر ${cooldown}ث` : `Wait ${cooldown}s`) : (isAr ? "اكتب رسالتك..." : "Type a message...")}
                disabled={cooldown > 0}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!text.trim() || cooldown > 0}
                className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
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
