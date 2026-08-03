"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, limitToLast } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/types";
import { Send, Loader2, Sparkles, MessageSquare, Headphones, X, Bot, Search, LogIn, Image as ImageIcon, SmilePlus, Reply, Trash2, ShieldCheck, Volume2, VolumeX, Mic, MicOff, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { getPlayerOverall } from "@/lib/playerUtils";
import { usePlayers } from "@/contexts/PlayersContext";
import { call11AIChat } from "@/lib/aiService";

interface AIChatMsg {
  id: string;
  sender: "user" | "ai";
  text: string;
  imagePreview?: string;
  timestamp: number;
}

import FormattedText, { formatBidiText } from "@/components/ui/FormattedText";

const formatMessageTime = (ts: any, isAr: boolean) => {
  if (!ts) return "";
  let date: Date | null = null;
  if (typeof ts?.toDate === "function") {
    date = ts.toDate();
  } else if (ts?.seconds) {
    date = new Date(ts.seconds * 1000);
  } else if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === "number" || typeof ts === "string") {
    date = new Date(ts);
  }
  if (!date || isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function FloatingChatWidget() {
  const [mounted, setMounted] = useState(false);
  const { user, isAdmin, isOwner, isGlobalModerator } = useAuth();
  const { userProfile: profile } = useAuthProfile(user);
  const { activeCommunityId, activeCommunity, communitySettings } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const { players = [] } = usePlayers();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "community" | "support">("ai");
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic Resize Dimensions State
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 640;
      return {
        width: isMobile ? Math.min(360, window.innerWidth - 24) : 440,
        height: isMobile ? Math.min(500, window.innerHeight - 120) : 600,
      };
    }
    return { width: 440, height: 600 };
  });
  const isResizing = useRef(false);
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 440, h: 620 });

  const handlePointerDownResize = (e: React.PointerEvent) => {
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: dimensions.width,
      h: dimensions.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isResizing.current) return;
    const deltaX = resizeStart.current.x - e.clientX;
    const deltaY = resizeStart.current.y - e.clientY;

    const newWidth = Math.min(Math.max(resizeStart.current.w + (isAr ? -deltaX : deltaX), 360), 920);
    const newHeight = Math.min(Math.max(resizeStart.current.h + deltaY, 480), 880);

    setDimensions({ width: newWidth, height: newHeight });
  };

  const handlePointerUpResize = (e: React.PointerEvent) => {
    if (isResizing.current) {
      isResizing.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // AI Chat Messages & Multimodal Voice/Vision State
  const [aiMessages, setAiMessages] = useState<AIChatMsg[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [aiImageFile, setAiImageFile] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [aiImageInlineData, setAiImageInlineData] = useState<{ mimeType: string; data: string } | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectAiImage = (file: File) => {
    setAiImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAiImagePreview(result);
      const base64Data = result.split(",")[1];
      setAiImageInlineData({
        mimeType: file.type || "image/jpeg",
        data: base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const fallbackBrowserSpeech = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeakingMsgId(null);
      setAudioPlayer(null);
      toast.error(isAr ? "تعذر تشغيل الصوت" : "Failed to play audio");
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#\-•]/g, " ").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 200));
    utterance.lang = isAr ? "ar-SA" : "en-US";
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakMessage = async (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      if (audioPlayer) {
        audioPlayer.pause();
        setAudioPlayer(null);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
      return;
    }

    if (audioPlayer) {
      audioPlayer.pause();
    }

    setSpeakingMsgId(msgId);

    try {
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: isAr ? "ar" : "en" }),
      });

      if (!res.ok) throw new Error("Audio generation failed");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setSpeakingMsgId(null);
        setAudioPlayer(null);
      };

      audio.onerror = () => {
        fallbackBrowserSpeech(msgId, text);
      };

      setAudioPlayer(audio);
      await audio.play();
    } catch (err) {
      fallbackBrowserSpeech(msgId, text);
    }
  };

  const toggleMicListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(isAr ? "الاستماع الصوتي غير مدعوم في متصفحك" : "Speech input not supported in browser");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isAr ? "ar-SA" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.success(isAr ? "جاري الاستماع لصوتك... تحدث الآن 🎙️" : "Listening... Speak now 🎙️");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setAiInput((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const [aiWelcomeLoading, setAiWelcomeLoading] = useState(false);

  // Trigger AI welcome generator ONLY when user opens the chatbot (isOpen === true)
  useEffect(() => {
    if (!user || !isOpen) {
      return;
    }

    // If AI messages already loaded in current session memory, don't re-generate
    if (aiMessages.length > 0) {
      setAiWelcomeLoading(false);
      return;
    }

    let isMounted = true;
    setAiWelcomeLoading(true);

    const fetchLiveAiGreeting = async () => {
      const playerName = profile?.fullName || user?.displayName || (isAr ? "كابتن" : "Captain");
      const playerOvr = profile ? getPlayerOverall(profile) : 72;
      const playerPos = profile?.primaryPosition
        ? (isAr ? (profile.primaryPosition === "DMF" ? "لاعب وسط دفاعي" : profile.primaryPosition) : profile.primaryPosition)
        : (isAr ? "لاعب وسط" : "Midfielder");
      const goals = profile?.stats?.goals || 0;
      const assists = profile?.stats?.assists || 0;

      const systemPrompt = isAr
        ? `أنت 11AI — المحلل التكتيكي والمدرب الشخصي في منصة 11Players.
قم بتوليد رسالة ترحيبية تكتيكية مخصصة وحماسية ومولدة بالذكاء الاصطناعي خصيصاً للكابتن ${playerName}:
- اسم اللاعب: ${playerName}
- المركز: ${playerPos}
- التقييم الإجمالي (OVR): ${playerOvr}
- إحصائياته: ${goals} أهداف | ${assists} تمريرات حاسمة

اتبع هذا التنسيق بدقة وقم بتوليد فقرة النصيحة التكتيكية الأخيرة ديناميكياً بحسب مركز اللاعب وتقييمه:

⚽ **أهلاً بك يا قائد ${playerName}!**

أنا **11AI** — محللك التكتيكي الخاص ومدربك الشخصي على منصة **11Players**.

📊 **حالتك الحالية:**

- **المركز:** ${playerPos}
- **التقييم العام:** ${playerOvr}
- **الإحصائيات:** ${goals} أهداف | ${assists} تمريرات حاسمة

(اكتب هنا فقرة حماسية تكتيكية ديناميكية من سطرين تناسب مركره "${playerPos}" بتقييم ${playerOvr}، تحفزه على قيادة الفريق وإثبات جدارته على أرض الملعب).`
        : `You are 11AI — Elite Tactical Analyst & Personal Career Coach on 11Players.
Generate a dynamic, high-energy tactical welcome greeting for Captain ${playerName}:
- Position: ${playerPos}
- Overall Rating: ${playerOvr}
- Stats: ${goals} Goals | ${assists} Assists

Follow this exact Markdown template (dynamically generating the final tactical advice paragraph to match their position "${playerPos}" and rating ${playerOvr}):

⚽ **Welcome back, Captain ${playerName}!**

I am **11AI** — your Elite Tactical Analyst & Personal Career Coach on **11Players**.

📊 **Live Status:**

- **Position:** ${playerPos}
- **Overall Rating (OVR):** ${playerOvr}
- **Stats:** ${goals} Goals | ${assists} Assists

(Write a custom 2-line tactical motivation tailored dynamically to their position "${playerPos}" and rating ${playerOvr}).`;

      try {
        const aiRes = await call11AIChat({
          message: systemPrompt,
          playerContext: {
            fullName: playerName,
            overall: playerOvr,
            primaryPosition: playerPos,
            goals,
            assists,
          },
          communityRoster: [],
          history: [],
        });

        if (!isMounted) return;

        const liveText = aiRes?.reply || (isAr
          ? `⚽ **أهلاً بك يا قائد ${playerName}!**\n\nأنا **11AI** — محللك التكتيكي الخاص ومدربك الشخصي على منصة **11Players**.\n\n📊 **حالتك الحالية:**\n\n- **المركز:** ${playerPos}\n- **التقييم العام:** ${playerOvr}\n- **الإحصائيات:** ${goals} أهداف | ${assists} تمريرات حاسمة\n\nبصفتك صمام الأمان في خط الوسط بتقييم ${playerOvr}، فإن مهمتك الأولى هي تدمير هجمات الخصم وبناء اللعب النظيف من الخلف. حان الوقت لإثبات جدارتك على أرضية الملعب وكتابة التاريخ في أولى مبارياتك!`
          : `⚽ **Welcome back, Captain ${playerName}!**\n\nI am **11AI** — your Elite Tactical Analyst & Personal Career Coach on **11Players**.\n\n📊 **Live Status:**\n\n- **Position:** ${playerPos}\n- **Overall Rating (OVR):** ${playerOvr}\n- **Stats:** ${goals} Goals | ${assists} Assists\n\nAs the midfield anchor with an OVR of ${playerOvr}, your primary mission is to break opponent attacks and build clean play from the back. Time to dominate the pitch and write history in your upcoming matches!`);

        const msgs: AIChatMsg[] = [
          {
            id: "welcome",
            sender: "ai",
            text: liveText,
            timestamp: Date.now(),
          },
        ];

        setAiMessages(msgs);
      } catch (err) {
        console.warn("Failed to fetch live AI welcome message:", err);
      } finally {
        if (isMounted) {
          setAiWelcomeLoading(false);
        }
      }
    };

    fetchLiveAiGreeting();

    return () => {
      isMounted = false;
    };
  }, [profile, user, isOpen, isAr]);

  // Full Chat Shared State (Community & Support)
  const [commInput, setCommInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiHeight, setEmojiHeight] = useState(260);

  // Community Messages State
  const [communityMessages, setCommunityMessages] = useState<ChatMessage[]>([]);

  // Slow mode logic
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Support State for Staff & Users
  const isStaff = Boolean(isAdmin || isOwner || isGlobalModerator);
  const [supportThreads, setSupportThreads] = useState<any[]>([]);
  const [supportSearch, setSupportSearch] = useState("");
  const [supportFilter, setSupportFilter] = useState<"all" | "unread">("all");
  const [selectedSupportUser, setSelectedSupportUser] = useState<{ uid: string; name: string } | null>(null);
  const [supportMessages, setSupportMessages] = useState<ChatMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages.length, communityMessages.length, supportMessages.length, activeTab, isOpen]);

  // Slow mode timer
  useEffect(() => {
    const slowModeSeconds = (communitySettings as any)?.slowModeSeconds || 0;
    if (slowModeSeconds === 0 || lastMessageTime === 0) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastMessageTime) / 1000);
      const remaining = slowModeSeconds - elapsed;
      if (remaining <= 0) {
        setCooldown(0);
        clearInterval(interval);
      } else {
        setCooldown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastMessageTime, (communitySettings as any)?.slowModeSeconds]);

  // Listen to Community Chat (`communities/${cid}/chats`)
  useEffect(() => {
    if (!activeCommunityId || !isOpen || !user) return;
    const q = query(
      collection(db, "communities", activeCommunityId, "chats"),
      orderBy("timestamp", "asc"),
      limitToLast(60)
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      setCommunityMessages(msgs);
    }, (err) => console.warn("Widget community snapshot error:", err));

    return () => unsub();
  }, [activeCommunityId, isOpen, user]);

  // Listen for Support Threads (Staff)
  useEffect(() => {
    if (!user || !isStaff || !isOpen) return;
    const q = query(collection(db, "support_threads"), orderBy("lastUpdatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const threads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSupportThreads(threads);
      if (!selectedSupportUser && threads.length > 0) {
        setSelectedSupportUser({ uid: threads[0].id, name: (threads[0] as any).userName || "User" });
      }
    }, (err) => console.warn("Widget support threads snapshot error:", err));

    return () => unsub();
  }, [user, isStaff, isOpen, selectedSupportUser]);

  // Listen to Support Messages
  const targetSupportUid = isStaff ? selectedSupportUser?.uid : user?.uid;

  useEffect(() => {
    if (!targetSupportUid || !isOpen || !user) return;
    const q = query(
      collection(db, "support_threads", targetSupportUid, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      setSupportMessages(msgs);
    }, (err) => console.warn("Widget support messages error:", err));

    return () => unsub();
  }, [targetSupportUid, isOpen, user]);

  // Send AI Message
  const handleSendAI = async (textToSend?: string) => {
    const queryText = textToSend || aiInput;
    if ((!queryText.trim() && !aiImageInlineData) || aiLoading) return;

    const userMsg: AIChatMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText.trim(),
      imagePreview: aiImagePreview || undefined,
      timestamp: Date.now(),
    };

    setAiMessages((prev) => [...prev, userMsg]);

    const imagePayload = aiImageInlineData;
    if (!textToSend) setAiInput("");
    setAiImageFile(null);
    setAiImagePreview(null);
    setAiImageInlineData(null);
    setAiLoading(true);

    try {
      const playerContext = {
        fullName: profile?.fullName || user?.displayName || "Player",
        overall: profile ? getPlayerOverall(profile) : 75,
        primaryPosition: profile?.primaryPosition || "Midfielder",
        goals: profile?.stats?.goals || 0,
        assists: profile?.stats?.assists || 0,
        matchesCount: profile?.stats?.matchesCount || 0,
        playStyle: profile?.playStyle || "Standard",
        communityName: activeCommunity?.name || "11Players Global",
      };

      const communityRoster = (players || []).map((p) => ({
        name: p.fullName || (p as any).displayName || "Player",
        cardName: (p as any).cardName || p.fullName || "",
        position: p.primaryPosition || "MID",
        secondaryPosition: p.secondaryPosition || "",
        tertiaryPosition: p.tertiaryPosition || "",
        ovr: getPlayerOverall(p),
        goals: p.stats?.goals || 0,
        assists: p.stats?.assists || 0,
        matchesCount: p.stats?.matchesPlayed || 0,
        playStyle: p.playStyle || "Standard",
        height: p.height || "",
        weight: p.weight || "",
        calculatedAge: p.calculatedAge || "",
      }));

      const data = await call11AIChat({
        message: queryText,
        playerContext,
        communityRoster,
        history: aiMessages.map((m) => ({ sender: m.sender, text: m.text })),
        imageInlineData: imagePayload,
      });

      if (!data || !data.reply) {
        throw new Error("Failed to fetch response");
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply,
          timestamp: Date.now(),
        },
      ]);

      if (Array.isArray(data.suggestedPrompts) && data.suggestedPrompts.length > 0) {
        setDynamicPrompts(data.suggestedPrompts);
      }
    } catch (err: any) {
      console.error(err);
      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: isAr ? "عذراً، حدث خطأ مؤقت أثناء الاتصال بـ 11AI. حاول مرة أخرى." : "Sorry, an error occurred connecting to 11AI. Try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Send Full Chat Message (Community / Support)
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!commInput.trim() && !imageFile) || !user) return;

    if (activeTab === "community" && cooldown > 0 && !isAdmin) {
      toast.error(isAr ? `يرجى الانتظار ${cooldown} ثانية قبل إرسال رسالة أخرى` : `Please wait ${cooldown}s before sending another message`);
      return;
    }

    const textVal = commInput.trim();
    const fileToUpload = imageFile;
    setCommInput("");
    setImageFile(null);

    try {
      setUploadingImage(true);
      let imgUrl = "";
      if (fileToUpload) {
        imgUrl = (await uploadImageToCloudinary(fileToUpload)) || "";
      }

      const payload: any = {
        text: textVal,
        imageUrl: imgUrl || null,
        senderUid: user.uid,
        senderName: user.displayName || user.email?.split("@")[0] || "Player",
        senderPhotoUrl: user.photoURL || null,
        timestamp: serverTimestamp(),
        replyTo: replyTo ? {
          id: replyTo.id,
          senderName: replyTo.senderName,
          text: replyTo.text || (isAr ? "صورة" : "Image"),
        } : null,
      };

      if (activeTab === "community") {
        if (!activeCommunityId) return;
        await addDoc(collection(db, "communities", activeCommunityId, "chats"), payload);
        setLastMessageTime(Date.now());
        setCooldown((communitySettings as any)?.slowModeSeconds || 0);
      } else {
        const targetUid = isStaff ? (selectedSupportUser?.uid || user.uid) : user.uid;
        const isAdminReply = Boolean(isStaff && targetUid !== user.uid);

        await addDoc(collection(db, "support_threads", targetUid, "messages"), {
          ...payload,
          isAdminReply,
        });

        await setDoc(doc(db, "support_threads", targetUid), {
          userUid: targetUid,
          userName: selectedSupportUser?.name || user.displayName || "User",
          lastMessage: textVal || (isAr ? "صورة" : "Image"),
          lastUpdatedAt: serverTimestamp(),
          unreadForUser: isAdminReply,
          unreadForAdmin: !isAdminReply,
        }, { merge: true });
      }

      setReplyTo(null);
      setShowEmojiPicker(false);
    } catch (err) {
      toast.error(isAr ? "فشل الإرسال" : "Failed to send");
    } finally {
      setUploadingImage(false);
    }
  };

  // Reactions logic
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    try {
      const targetRef = activeTab === "community"
        ? doc(db, "communities", activeCommunityId!, "chats", msgId)
        : doc(db, "support_threads", targetSupportUid!, "messages", msgId);

      const msgs = activeTab === "community" ? communityMessages : supportMessages;
      const msg = msgs.find((m) => m.id === msgId);
      if (!msg) return;

      const reactions = (msg as any).reactions || {};
      const currentUsers: string[] = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
      const hasReacted = currentUsers.includes(user.uid);

      const updatedUsers = hasReacted
        ? currentUsers.filter((u) => u !== user.uid)
        : [...currentUsers, user.uid];

      const updatedReactions = { ...reactions, [emoji]: updatedUsers };
      if (updatedUsers.length === 0) delete updatedReactions[emoji];

      await updateDoc(targetRef, { reactions: updatedReactions });
    } catch (err) {
      console.error("Reaction error", err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    try {
      const targetRef = activeTab === "community"
        ? doc(db, "communities", activeCommunityId!, "chats", msgId)
        : doc(db, "support_threads", targetSupportUid!, "messages", msgId);
      await deleteDoc(targetRef);
      toast.success(isAr ? "تم حذف الرسالة" : "Message deleted");
    } catch (err) {
      toast.error(isAr ? "فشل حذف الرسالة" : "Failed to delete message");
    }
  };

  // Filtered support threads for staff
  const filteredThreads = supportThreads.filter((t) => {
    const nameMatch = (t.userName || "").toLowerCase().includes(supportSearch.toLowerCase());
    if (supportFilter === "unread") return nameMatch && t.unreadForAdmin;
    return nameMatch;
  });

  if (!mounted) return null;

  return (
    <>
      {/* ── Floating Action Button (iOS Animated FAB) ─────────────── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label="Toggle 11AI Chatbot"
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 rtl:right-auto rtl:left-4 sm:rtl:left-6 z-[9999999] w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/50 flex items-center justify-center text-white cursor-pointer transition-all pointer-events-auto"
      >
        <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
      </motion.button>

      {/* ── Floating Chatbot Modal Window (iOS Spring Physics Modal) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbot-modal"
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 30 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 26,
              mass: 0.8,
            }}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              transformOrigin: isAr ? "bottom left" : "bottom right",
            }}
            className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 rtl:right-auto rtl:left-3 sm:rtl:left-6 z-[9999999] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white pointer-events-auto max-w-[94vw] max-h-[72vh] sm:max-h-[82vh]"
            dir={isAr ? "rtl" : "ltr"}
          >
            {/* Drag Resize Handle (Top Edge) */}
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePointerDownResize(e);
              }}
              onPointerMove={handlePointerMoveResize}
              onPointerUp={handlePointerUpResize}
              className="absolute top-0 left-0 right-0 h-5 cursor-ns-resize z-50 flex items-center justify-center group touch-none select-none"
              style={{ touchAction: "none" }}
              title={isAr ? "اسحب لتعديل الحجم" : "Drag to resize window"}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-400 transition-colors" />
            </div>

            {/* Top Header */}
            <div className="bg-slate-950 p-4 pt-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>11AI Assistant</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {isAr ? "الذكاء الاصطناعي والتواصل" : "AI & Platform Assistant"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switcher Bar with Stable Active Pill */}
            <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-1.5 relative">
              {[
                { id: "ai", label: "11AI", icon: <Bot className="w-4 h-4" /> },
                { id: "community", label: isAr ? "المجتمع" : "Community", icon: <MessageSquare className="w-4 h-4" /> },
                { id: "support", label: isAr ? "الدعم" : "Support", icon: <Headphones className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setReplyTo(null);
                    setShowEmojiPicker(false);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 z-10 ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-black"
                      : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Scroll View Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* Guest banner if not signed in */}
              {!user && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-amber-400">
                    {isAr ? "يرجى تسجيل الدخول للاستفادة الكاملة من الذكاء الاصطناعي 11AI وغرف المحادثة والدعم." : "Please sign in to get personalized 11AI advice and access live channels."}
                  </p>
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isAr ? "تسجيل الدخول الآن" : "Sign In Now"}</span>
                  </Link>
                </div>
              )}

              {/* ── TAB 1: 11AI Assistant ──────────────────────────────────── */}
              {activeTab === "ai" && (
                <>
                  {aiWelcomeLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800" />
                          <div className="h-4 bg-slate-800 rounded w-2/3" />
                        </div>
                        <div className="h-3 bg-slate-800/80 rounded w-full" />
                        <div className="h-3 bg-slate-800/80 rounded w-5/6" />
                        <div className="pt-2 space-y-2">
                          <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                          <div className="h-3 bg-slate-800/60 rounded w-3/4" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <div className="h-8 w-32 bg-slate-950 border border-slate-800 rounded-xl" />
                        <div className="h-8 w-40 bg-slate-950 border border-slate-800 rounded-xl" />
                        <div className="h-8 w-36 bg-slate-950 border border-slate-800 rounded-xl" />
                      </div>
                    </div>
                  ) : (
                    <>
                  {aiMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-emerald-600 text-white rounded-br-none font-bold shadow-md"
                            : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg"
                        }`}
                      >
                        {msg.imagePreview && (
                          <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 shadow-md">
                            <Image src={msg.imagePreview} alt="Attached image preview" width={260} height={180} className="object-cover max-h-52 w-full rounded-lg" />
                          </div>
                        )}

                        {msg.text && <FormattedText content={msg.text} />}

                        {msg.sender === "ai" && (
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg.id, msg.text)}
                              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors font-bold"
                            >
                              {speakingMsgId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                  <span className="text-amber-400">{isAr ? "إيقاف الصوت" : "Stop Voice"}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{isAr ? "استمع للتحليل الصوتي 🔊" : "Listen Voice 🔊"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {aiLoading && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 p-2 font-bold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>{isAr ? "11AI يفكر ويحلل بياناتك..." : "11AI is analyzing..."}</span>
                    </div>
                  )}

                  {/* Dynamic AI Suggested Prompt Chips */}
                  {user && !aiLoading && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {(dynamicPrompts.length > 0
                        ? dynamicPrompts
                        : [
                            isAr ? "📈 حلل تقييمي ونقاط ضعفي" : "📈 Analyze my OVR & weakness",
                            isAr ? "⚡ مين أفضل اللاعبين في مركزي؟" : "⚡ Who are the top players in my position?",
                            isAr ? "🏆 كيف أقترب من جائزة الكرة الذهبية؟" : "🏆 Progress toward Ballon d'Or",
                            isAr ? "⚽ كيف أستعد للمباراة القادمة؟" : "⚽ Match preparation strategy",
                          ]
                      ).map((prompt, i) => (
                        <motion.button
                          key={i}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSendAI(prompt)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 transition-all text-start shadow-sm flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="[unicode-bidi:isolate]">{formatBidiText(prompt)}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  </>
                  )}
                </>
              )}

              {/* ── TAB 2 & TAB 3: Full Feature Live Chat ─────────────────── */}
              {(activeTab === "community" || activeTab === "support") && (
                <>
                  {/* Staff Searchable Inbox Header (Support Tab Only) */}
                  {activeTab === "support" && isStaff && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-2 shadow-inner"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={supportSearch}
                            onChange={(e) => setSupportSearch(e.target.value)}
                            placeholder={isAr ? "بحث عن مستخدم..." : "Search user..."}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 rtl:pl-2 rtl:pr-8 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300"
                          />
                        </div>
                        <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-1 relative shadow-inner">
                          {(["all", "unread"] as const).map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setSupportFilter(f)}
                              className={`relative px-3 py-1 rounded-lg text-xs font-black transition-colors flex items-center justify-center z-10 ${
                                supportFilter === f ? "text-white" : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {supportFilter === f && (
                                <motion.div
                                  layoutId="supportFilterPill"
                                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                  className="absolute inset-0 bg-emerald-600 rounded-lg shadow-md -z-10"
                                />
                              )}
                              <span>{f === "all" ? (isAr ? "الكل" : "All") : (isAr ? "غير مقروء" : "Unread")}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* User threads horizontal animated list */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 max-h-24">
                        {filteredThreads.map((t) => (
                          <motion.button
                            key={t.id}
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setSelectedSupportUser({ uid: t.id, name: t.userName || "User" })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 border flex items-center gap-1.5 transition-all ${
                              selectedSupportUser?.uid === t.id ? "bg-emerald-600 text-white border-emerald-500 shadow-md" : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <span>{t.userName || "User"}</span>
                            {t.unreadForAdmin && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Messages Feed */}
                  {((activeTab === "community" ? communityMessages : supportMessages).length === 0) ? (
                    <p className="text-center text-xs text-slate-500 py-12">
                      {activeTab === "community"
                        ? (isAr ? "لا توجد رسائل في القناة العامة بعد" : "No community messages yet")
                        : (isAr ? "تواصل مباشر مع الدعم الفني والإدارة" : "Direct private support thread")}
                    </p>
                  ) : (
                    (activeTab === "community" ? communityMessages : supportMessages).map((msg) => {
                      const isMe = msg.senderUid === user?.uid;
                      const isSupportReply = (msg as any).isAdminReply;
                      const hasReactions = (msg as any).reactions && Object.keys((msg as any).reactions).length > 0;

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative`}
                        >
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[11px] font-bold text-slate-300">{isMe ? (isAr ? "أنت" : "You") : msg.senderName}</span>
                            {isSupportReply && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {isAr ? "فريق الدعم" : "Official Support"}
                              </span>
                            )}
                            {formatMessageTime(msg.timestamp, isAr) && (
                              <span className="text-[10px] text-slate-400/90 font-medium">
                                {formatMessageTime(msg.timestamp, isAr)}
                              </span>
                            )}
                          </div>

                          {/* Reply preview */}
                          {(msg as any).replyTo && (
                            <div className="mb-1 text-[11px] bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-400 max-w-xs truncate border-s-2 border-s-emerald-500">
                              <span className="font-bold text-emerald-400">{(msg as any).replyTo.senderName}: </span>
                              <span>{(msg as any).replyTo.text}</span>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`relative max-w-xs sm:max-w-sm rounded-2xl p-3 text-xs leading-relaxed ${
                              isMe
                                ? "bg-emerald-600 text-white rounded-br-none shadow-md"
                                : isSupportReply
                                ? "bg-slate-950 border border-emerald-500/50 text-white rounded-bl-none shadow-emerald-950/20"
                                : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-md"
                            }`}
                          >
                            {msg.imageUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-slate-800 max-h-56 relative">
                                <Image
                                  src={msg.imageUrl}
                                  alt="Attachment"
                                  width={300}
                                  height={200}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => window.open(msg.imageUrl, '_blank')}
                                />
                              </div>
                            )}

                            <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                            {/* Sent time inside bubble */}
                            {formatMessageTime(msg.timestamp, isAr) && (
                              <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? "text-emerald-100/75" : "text-slate-400/80"} font-medium`}>
                                <span>{formatMessageTime(msg.timestamp, isAr)}</span>
                              </div>
                            )}

                            {/* Reactions row */}
                            {hasReactions && (
                              <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-white/10">
                                {Object.entries(msg.reactions!).map(([emoji, users]) => {
                                  const reactedByMe = users.includes(user?.uid || "");
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id || '', emoji)}
                                      className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${
                                        reactedByMe
                                          ? "bg-emerald-950 border-emerald-500 text-emerald-400 font-bold"
                                          : "bg-slate-900 border-slate-800 text-slate-300"
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[9px] font-black">{users.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Hover Reaction & Actions Menu */}
                          <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {["❤️", "🔥", "👏", "😂", "👍"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id || '', emoji)}
                                className="p-1 hover:scale-125 transition-transform text-[11px] rounded-lg bg-slate-950 border border-slate-800"
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              onClick={() => setReplyTo(msg)}
                              className="p-1 text-slate-400 hover:text-white transition-colors text-xs rounded-lg bg-slate-950 border border-slate-800"
                              title={isAr ? "رد" : "Reply"}
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            {(isMe || isStaff) && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id || '')}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors text-xs rounded-lg bg-slate-950 border border-slate-800"
                                title={isAr ? "حذف" : "Delete"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </>
              )}
            </div>

            {/* Reply Preview Bar Banner */}
            {replyTo && (activeTab === "community" || activeTab === "support") && (
              <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <Reply className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{isAr ? "الرد على" : "Replying to"} <strong className="text-white">{replyTo.senderName}</strong>: {replyTo.text}</span>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Slow Mode Cooldown Banner */}
            {activeTab === "community" && cooldown > 0 && !isAdmin && (
              <div className="bg-amber-950/40 border-t border-amber-800/60 px-4 py-1 text-center text-xs text-amber-400 font-bold">
                {isAr ? "وضع التروي مفعل: انتظر" : "Slow Mode active: wait"} {cooldown}s
              </div>
            )}

            {/* Full Input Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800">
              {!user ? (
                <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-900/90 border border-amber-500/30 rounded-2xl">
                  <span className="text-xs font-bold text-amber-400">
                    {isAr ? "🔒 يجب تسجيل الدخول للتفاعل مع 11AI والقنوات" : "🔒 Sign in required to interact with 11AI & channels"}
                  </span>
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shrink-0 shadow-md"
                  >
                    {isAr ? "دخول" : "Sign In"}
                  </Link>
                </div>
              ) : activeTab === "ai" ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={aiFileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleSelectAiImage(e.target.files[0])}
                  />

                  {/* Multimodal Image Preview Thumbnail */}
                  {aiImagePreview && (
                    <div className="relative inline-block border border-emerald-500/50 rounded-xl overflow-hidden bg-slate-900 p-1">
                      <Image src={aiImagePreview} alt="Vision upload preview" width={60} height={60} className="rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setAiImageFile(null);
                          setAiImagePreview(null);
                          setAiImageInlineData(null);
                        }}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAI();
                    }}
                    className="flex items-center gap-1.5"
                  >
                    {/* Multimodal Vision Image Button */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => aiFileInputRef.current?.click()}
                      className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all shrink-0"
                      title={isAr ? "تحليل صورة أو تشكيلة بالذكاء الاصطناعي" : "Attach image for AI vision analysis"}
                    >
                      <Camera className="w-4 h-4" />
                    </motion.button>

                    {/* Microphone Speech Voice Input Button */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={toggleMicListening}
                      className={`p-2.5 rounded-2xl border transition-all shrink-0 ${
                        isListening
                          ? "bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse shadow-lg"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400"
                      }`}
                      title={isAr ? "تحدث بالصوت بدلاً من الكتابة" : "Speak to 11AI using microphone"}
                    >
                      {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                    </motion.button>

                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder={
                        isListening
                          ? (isAr ? "جاري الاستماع... تحدث الآن 🎙️" : "Listening... Speak now 🎙️")
                          : (isAr ? "اسأل أو ارفع صورة لتحليلها..." : "Ask or attach an image to analyze...")
                      }
                      className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300"
                    />

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={(!aiInput.trim() && !aiImageInlineData) || aiLoading}
                      className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md transition-all flex items-center justify-center shrink-0"
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </motion.button>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setImageFile(e.target.files[0])}
                  />

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      imageFile ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-slate-900 border-slate-800 text-emerald-400 hover:text-white"
                    }`}
                    title={isAr ? "إرفاق صورة" : "Attach Image"}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-white transition-all"
                    title={isAr ? "رموز تعبيرية" : "Emoji Picker"}
                  >
                    <SmilePlus className="w-4 h-4" />
                  </motion.button>

                  <input
                    type="text"
                    value={commInput}
                    onChange={(e) => setCommInput(e.target.value)}
                    placeholder={
                      activeTab === "community"
                        ? (isAr ? "اكتب رسالة للمجتمع..." : "Message community...")
                        : (isAr ? "اكتب رسالة للدعم الفني..." : "Message support...")
                    }
                    disabled={!user || uploadingImage}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 disabled:opacity-50"
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={(!commInput.trim() && !imageFile) || uploadingImage || !user}
                    className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md transition-all flex items-center justify-center shrink-0 font-bold"
                  >
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </motion.button>
                </form>
              )}
            </div>

            {/* Emoji Picker Container */}
            <AnimatePresence>
              {showEmojiPicker && (activeTab === "community" || activeTab === "support") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: emojiHeight, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-900 border-t border-slate-800 overflow-hidden relative z-30"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => setCommInput((prev) => prev + emojiData.emoji)}
                    theme={EmojiTheme.DARK}
                    width="100%"
                    height={emojiHeight}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
