'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { useLocale } from '@/components/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: any;
}

interface VirtualChatProps {
  currentUser: User;
}

export default function VirtualChat({ currentUser }: VirtualChatProps) {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAr = locale === 'ar';

  // Labels
  const labels = {
    title: isAr ? '💬 الدردشة المباشرة' : '💬 Live Chat',
    placeholder: isAr ? 'اكتب رسالتك...' : 'Type your message...',
    send: isAr ? 'إرسال' : 'Send',
    empty: isAr ? 'لا توجد رسائل بعد. كن أول من يرسل! 🎉' : 'No messages yet. Be the first to send! 🎉',
    loading: isAr ? 'جاري التحميل...' : 'Loading...',
  };

  // Subscribe to Firestore messages
  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-scroll on new messages (scrolls the container only, avoiding page jump)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Center input when virtual keyboard opens on mobile
  const handleFocus = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  // Send message
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText('');
    inputRef.current?.focus();

    await addDoc(collection(db, 'chats'), {
      senderUid: currentUser.uid,
      senderName: currentUser.displayName || 'مجهول',
      text: trimmed,
      timestamp: serverTimestamp(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: any) => {
    const date: Date = timestamp?.toDate?.() || new Date();
    return date.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex flex-col w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 transition-colors"
      style={{ height: '520px' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800 transition-colors"
      >
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400/40 animate-ping" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
          {labels.title}
        </h2>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
          {messages.length} {isAr ? 'رسالة' : 'msgs'}
        </span>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">{labels.loading}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="text-4xl">💬</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">{labels.empty}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.senderUid === currentUser.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col max-w-[80%] ${
                    isOwn
                      ? isAr
                        ? 'mr-0 ml-auto items-end'
                        : 'ml-auto items-end'
                      : isAr
                      ? 'ml-0 mr-0 items-start'
                      : 'mr-auto items-start'
                  }`}
                >
                  {/* Sender name */}
                  <span
                    className={`text-[11px] font-medium mb-1 px-1 ${
                      isOwn ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {msg.senderName}
                  </span>

                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-emerald-600/90 text-white rounded-br-sm'
                        : 'bg-slate-200 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                    }`}
                    style={{
                      boxShadow: isOwn
                        ? '0 2px 8px rgba(16, 185, 129, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/80 transition-colors">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={labels.placeholder}
            className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600/50 outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-600/20"
          >
            {labels.send}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
