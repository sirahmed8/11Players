import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ThemeProvider";
import toast from "react-hot-toast";
import Link from "next/link";

export default function AdviceNotification() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [advice, setAdvice] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Track which notification IDs we've already toasted so we don't re-toast on re-render
  const notifiedIds = useRef<Set<string>>(new Set());
  // Record time when this component mounted — only toast notifications newer than this
  const mountedAt = useRef<number>(Date.now());

  // --- Global notification toaster (app-wide listener) ---
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const notif = change.doc.data();
        const id = change.doc.id;

        // Skip if already toasted
        if (notifiedIds.current.has(id)) return;
        notifiedIds.current.add(id);

        // Only toast for notifications created AFTER page load (not old ones)
        const createdAt = notif.createdAt?.toMillis
          ? notif.createdAt.toMillis()
          : notif.createdAt instanceof Date
          ? notif.createdAt.getTime()
          : typeof notif.createdAt === "string"
          ? new Date(notif.createdAt).getTime()
          : 0;

        if (createdAt && createdAt < mountedAt.current - 5000) return; // 5s tolerance

        if (!notif.read) {
          const icon = notif.type === "advices" ? "💡" :
                       notif.type === "stats" ? "📊" :
                       notif.type === "admin" ? "🛡️" :
                       notif.type === "owner" ? "👑" :
                       notif.type === "trophies" ? "🏆" :
                       notif.type === "match" ? "⚽" : "🔔";

          toast.custom((t) => (
            <div
              onClick={() => toast.dismiss(t.id)}
              className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 gap-3.5 items-center cursor-pointer border border-emerald-500/30 hover:scale-[1.02] transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl shrink-0">
                {icon}
              </div>
              <div className="flex-1 w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {notif.title}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-medium">
                  {notif.body}
                </p>
              </div>
              {notif.link && (
                <Link
                  href={notif.link}
                  onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0"
                >
                  {isAr ? "عرض" : "View"}
                </Link>
              )}
            </div>
          ), { duration: 6000, position: "top-center", id: `notif-${id}` });
        }
      });
    });

    return () => unsub();
  }, [user, isAr]);

  // --- Advice generator (once per 24h, shows green coach popup) ---
  useEffect(() => {
    if (!user) return;
    const fetchProfileAndGenerateAdvice = async () => {
      const lastShown = sessionStorage.getItem("adviceLastShown");
      const now = Date.now();
      // Check once per session (10 min throttle to avoid Firestore spam on navigation)
      if (lastShown && now - parseInt(lastShown) < 600000) return;
      
      try {
        const playerDoc = await getDoc(doc(db, "players", user.uid));
        if (playerDoc.exists()) {
          const { generatePersonalizedAdvices } = await import("@/lib/adviceGenerator");
          const generated = await generatePersonalizedAdvices(user.uid, playerDoc.data() as any, isAr);
          
          if (generated && generated.length > 0) {
            setAdvice(generated[0].body);
            setTimeout(() => {
              setIsVisible(true);
              sessionStorage.setItem("adviceLastShown", Date.now().toString());
            }, 2000); // Delay slightly so it doesn't clash with notification toasts
          } else {
            // On cooldown — mark session so we don't re-check every navigation
            sessionStorage.setItem("adviceLastShown", Date.now().toString());
          }
        }
      } catch (err) {
        console.error("Failed to generate advice", err);
      }
    };
    
    fetchProfileAndGenerateAdvice();
  }, [user, isAr]);

  return (
    <AnimatePresence>
      {isVisible && advice && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-20 right-4 md:top-24 md:right-8 z-50 max-w-sm w-[calc(100vw-2rem)] md:w-full"
          dir={isAr ? "rtl" : "ltr"}
        >
          <div className="bg-emerald-600 text-white rounded-2xl shadow-2xl p-4 pr-12 rtl:pr-4 rtl:pl-12 relative overflow-hidden border border-emerald-400/30">
            <div className="absolute -right-6 -top-6 rtl:-left-6 rtl:-right-auto opacity-20">
              <Sparkles className="w-24 h-24" />
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-3 rtl:left-3 ltr:right-3 bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex gap-3 relative z-10">
              <div className="bg-emerald-500 rounded-full p-2 h-fit flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-100 text-sm mb-1">{isAr ? "نصيحة المدرب" : "Coach Advice"}</h4>
                <p className="text-sm leading-relaxed font-medium">{advice}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
