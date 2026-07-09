"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale, useTheme } from "@/components/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/types";
import { Send, Loader2, ArrowLeft, Image as ImageIcon, X, Reply, SmilePlus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export default function CommunityChatPage() {
  const { user, isAdmin } = useAuth();
  const { activeCommunityId, activeCommunity, communitySettings } = useCommunity();
  const { locale } = useLocale();
  const { theme } = useTheme();
  const isAr = locale === "ar";
  const router = useRouter();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingToMsgId, setReactingToMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      setMessages(prev => {
        // Check for new messages if we already have some loaded
        if (prev.length > 0 && msgs.length > prev.length) {
          const newMsg = msgs[msgs.length - 1];
          if (newMsg.senderUid !== user?.uid) {
            toast.custom((t) => (
              <div
                onClick={() => toast.dismiss(t.id)}
                className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/30 hover:scale-[1.02] transition-all"
              >
                <div className="relative h-11 w-11 shrink-0">
                  <Image className="rounded-full object-cover border border-slate-200 dark:border-slate-700" src={newMsg.senderPic || "/logo.jpg"} alt="" fill sizes="44px" />
                </div>
                <div className="flex-1 w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>💬 {newMsg.senderName}</span>
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
  }, [activeCommunityId, router, user?.uid, isAr]);

  useEffect(() => {
    // Cooldown timer
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || !user || !activeCommunityId) return;

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
    const currentImage = imageFile;
    setImageFile(null);
    const replyId = replyTo?.id || null;
    setReplyTo(null);
    setShowEmojiPicker(false);

    if (editingMessage) {
      try {
        if (!editingMessage.id) return;
        await updateDoc(doc(db, "communities", activeCommunityId, "chats", editingMessage.id), {
          text: currentText,
          isEdited: true
        });
        setEditingMessage(null);
      } catch (err) {
        console.error(err);
        toast.error(isAr ? "فشل تعديل الرسالة" : "Failed to edit message");
      }
      return;
    }

    let imageUrl = null;
    if (currentImage) {
      setUploadingImage(true);
      try {
        imageUrl = await uploadImageToCloudinary(currentImage);
      } catch (uploadError) {
        console.error("Storage upload error:", uploadError);
      }
      setUploadingImage(false);
      if (!imageUrl) {
        toast.error(isAr ? "فشل رفع الصورة. الرجاء المحاولة لاحقاً" : "Failed to upload image. Please try again.");
        return;
      }
    }

    try {
      await addDoc(collection(db, "communities", activeCommunityId, "chats"), {
        senderUid: user.uid,
        senderName: user.displayName || "User",
        senderPic: user.photoURL || "",
        text: currentText,
        ...(imageUrl ? { imageUrl } : {}),
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(isAr ? "حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)" : "Image size too large (Max 5MB)");
        return;
      }
      setImageFile(file);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-4xl mx-auto px-4 h-[calc(100vh-140px)] flex flex-col">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl p-4 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/communities')} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
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
                    className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'self-end rtl:self-start' : 'self-start rtl:self-end'}`}
                  >
                    {!isMe && showAvatar && (
                      <span className="text-xs text-slate-500 mb-1 ml-12 rtl:mr-12 rtl:ml-0">{msg.senderName}</span>
                    )}
                    
                    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse rtl:flex-row' : ''}`}>
                      {/* Avatar */}
                      {!isMe ? (
                        <div className="w-8 h-8 flex-shrink-0">
                          {showAvatar ? (
                            <Image src={msg.senderPic || '/placeholder.png'} alt="" className="w-full h-full rounded-full object-cover" width={32} height={32} referrerPolicy="no-referrer" />
                          ) : <div className="w-8 h-8" />}
                        </div>
                      ) : null}

                      {/* Bubble Container */}
                      <div className="flex flex-col relative group">
                        
                        {/* Reply reference */}
                        {replyMsg && (
                          <div className={`text-xs p-3 rounded-xl mb-2 opacity-90 border-l-4 rtl:border-l-0 rtl:border-r-4 ${isMe ? 'bg-emerald-600/90 border-emerald-300 text-white' : 'bg-slate-200 dark:bg-slate-800 border-indigo-500 text-slate-800 dark:text-slate-200'}`}>
                            <div className="font-bold mb-1 flex items-center gap-1"><Reply className="w-3 h-3" /> {replyMsg.senderName}</div>
                            <div className="truncate max-w-[200px]">{replyMsg.text}</div>
                          </div>
                        )}

                        {/* Main Bubble */}
                        <div className={`px-4 py-2 rounded-2xl relative z-10 text-sm shadow-sm flex flex-col gap-2 ${
                          isMe 
                            ? 'bg-emerald-500 text-white rounded-br-sm' 
                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm border border-slate-200 dark:border-slate-600'
                        }`}>
                          {msg.imageUrl && (
                            <div className="w-full max-w-sm rounded-xl overflow-hidden cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')}>
                              <Image src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover" width={500} height={500} />
                            </div>
                          )}
                          {msg.text && <p className="text-start" dir="auto">{msg.text}</p>}
                          
                          {/* Quick Actions (Hover) - Moved to side */}
                          <div className={`absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 p-1 ${isMe ? 'right-full mr-2 rtl:right-auto rtl:left-full rtl:ml-2' : 'left-full ml-2 rtl:left-auto rtl:right-full rtl:mr-2'}`}>
                            <button onClick={() => setReplyTo(msg)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors" title={isAr ? "رد" : "Reply"}>
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleReaction(msg.id!, '👍')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">👍</button>
                            <button onClick={() => handleReaction(msg.id!, '❤️')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">❤️</button>
                            <button onClick={() => setReactingToMsgId(msg.id!)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors" title={isAr ? "تفاعل" : "React"}>
                              <SmilePlus className="w-3.5 h-3.5" />
                            </button>
                            {isMe && (
                              <button onClick={() => { setText(msg.text || ""); setEditingMessage(msg); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors" title={isAr ? "تعديل" : "Edit"}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                              </button>
                            )}
                            {(isAdmin || isMe) && (
                              <button onClick={() => setShowDeleteConfirm(msg.id!)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors" title={isAr ? "حذف" : "Delete"}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* General Emoji Reaction Picker */}
                          <AnimatePresence>
                            {reactingToMsgId === msg.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`absolute top-full mt-2 z-50 ${isMe ? 'right-0' : 'left-0'}`}
                              >
                                <div className="relative">
                                  <button onClick={() => setReactingToMsgId(null)} className="absolute -top-2 -right-2 z-10 bg-slate-800 text-white rounded-full p-1 shadow-md hover:bg-slate-700">
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

                        {/* Edited Tag */}
                        {msg.isEdited && (
                          <div className={`text-[10px] text-slate-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {isAr ? "تم التعديل" : "Edited"}
                          </div>
                        )}

                        {/* Reactions Display */}
                        {Object.keys(reactionCounts).length > 0 && (
                          <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                              <button 
                                key={emoji}
                                onClick={() => handleReaction(msg.id!, emoji)}
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
              {replyTo && !editingMessage && (
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
              {editingMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg text-sm border-l-4 border-indigo-500"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{isAr ? "تعديل الرسالة" : "Editing Message"}</span>
                    <span className="truncate text-slate-600 dark:text-slate-400">{editingMessage.text}</span>
                  </div>
                  <button onClick={() => { setEditingMessage(null); setText(""); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 transition-all p-2 flex flex-col">
                
                {imageFile && (
                  <div className="flex items-center gap-2 p-2 mb-2 bg-white dark:bg-slate-800 rounded-lg relative self-start shadow-sm border border-slate-200 dark:border-slate-700">
                    <Image src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 w-16 object-cover rounded-md" width={64} height={64} unoptimized />
                    <button type="button" onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors">
                      <SmilePlus className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 20, scale: 0.95 }}
                          className="absolute bottom-12 rtl:right-0 ltr:left-0 z-50 shadow-2xl"
                        >
                          <EmojiPicker 
                            theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                            onEmojiClick={(e) => { setText(prev => prev + e.emoji); }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.heic" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input 
                    type="text" 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={cooldown > 0 ? (isAr ? `انتظر ${cooldown}ث` : `Wait ${cooldown}s`) : (isAr ? "اكتب رسالتك..." : "Type a message...")}
                    disabled={cooldown > 0 || uploadingImage}
                    className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm p-1 disabled:opacity-50 text-start"
                    dir="auto"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={(!text.trim() && !imageFile) || cooldown > 0 || uploadingImage}
                className="px-4 py-4 h-14 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center flex-shrink-0"
              >
                {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full"
                dir={isAr ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-3 mb-4 text-red-500">
                  <Trash2 className="w-8 h-8" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {isAr ? "حذف الرسالة" : "Delete Message"}
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  {isAr 
                    ? "هل أنت متأكد من رغبتك في حذف هذه الرسالة؟ سيتم مسحها لدى الجميع ولا يمكن التراجع عن هذا الإجراء." 
                    : "Are you sure you want to delete this message? It will be removed for everyone and this action cannot be undone."}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={() => {
                      deleteMessage(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg transition-colors"
                  >
                    {isAr ? "تأكيد الحذف" : "Confirm Delete"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
