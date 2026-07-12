import React, { useEffect, useRef } from "react";
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

  // Track which notification IDs we've already toasted so we don't re-toast on re-render
  const notifiedIds = useRef<Set<string>>(new Set());
  // Record time when this component mounted — only toast notifications newer than this
  const mountedAt = useRef<number>(Date.now());
  // Track last toast timestamp to prevent stacking multiple toasts at the exact same moment
  const lastToastTime = useRef<number>(0);

  // --- Global notification toaster (app-wide listener) ---
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let toastedInThisBatch = 0;

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

        // Limit to showing at most 1 toast per batch so multiple simultaneous notifications don't stack
        if (!notif.read && toastedInThisBatch === 0 && Date.now() - lastToastTime.current > 3000) {
          toastedInThisBatch++;
          lastToastTime.current = Date.now();

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

  // --- Advice generator (once per 24h) ---
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
          await generatePersonalizedAdvices(user.uid, playerDoc.data() as any, isAr);
          sessionStorage.setItem("adviceLastShown", Date.now().toString());
        }
      } catch (err) {
        console.error("Failed to generate advice", err);
      }
    };
    
    fetchProfileAndGenerateAdvice();
  }, [user, isAr]);

  return null;
}
