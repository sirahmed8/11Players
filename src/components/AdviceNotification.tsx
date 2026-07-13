"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ThemeProvider";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdviceNotification() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const notifiedIds = useRef<Set<string>>(new Set());
  const mountedAt = useRef<number>(Date.now());
  const lastToastTime = useRef<number>(0);

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

        if (notifiedIds.current.has(id)) return;
        notifiedIds.current.add(id);

        const createdAt = notif.createdAt?.toMillis
          ? notif.createdAt.toMillis()
          : notif.createdAt instanceof Date
          ? notif.createdAt.getTime()
          : typeof notif.createdAt === "string"
          ? new Date(notif.createdAt).getTime()
          : 0;

        if (createdAt && createdAt < mountedAt.current - 5000) return;

        if (!notif.read && toastedInThisBatch === 0 && Date.now() - lastToastTime.current > 2500) {
          toastedInThisBatch++;
          lastToastTime.current = Date.now();

          const icon = notif.type === "advices" ? "💡" :
                       notif.type === "stats" ? "📊" :
                       notif.type === "admin" ? "🛡️" :
                       notif.type === "owner" ? "👑" :
                       notif.type === "trophies" ? "🏆" :
                       notif.type === "match" ? "⚽" : "🔔";

          toast.custom((t) => (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={t.visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -40, scale: 0.9 }}
              exit={{ opacity: 0, y: -50, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              drag="y"
              dragConstraints={{ top: -120, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -30 || info.velocity.y < -200) {
                  toast.dismiss(t.id);
                }
              }}
              onClick={() => toast.dismiss(t.id)}
              className="max-w-md w-full bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-amber-500/30 p-4 gap-3.5 items-center cursor-pointer border border-amber-500/40 hover:scale-[1.02] transition-transform select-none"
              dir={isAr ? "rtl" : "ltr"}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                {icon}
              </div>
              <div className="flex-1 w-0">
                <p className="text-sm font-black text-white truncate">
                  {notif.title}
                </p>
                <p className="mt-1 text-xs text-slate-300 line-clamp-2 font-medium">
                  {notif.body}
                </p>
                <p className="text-[10px] text-amber-400/80 font-bold mt-1.5">
                  {isAr ? "↑ اسحب للأعلى للإغلاق" : "↑ Swipe up to dismiss"}
                </p>
              </div>
              {notif.link && (
                <Link
                  href={notif.link}
                  onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-black shrink-0 hover:bg-amber-400 transition-colors"
                >
                  {isAr ? "عرض" : "View"}
                </Link>
              )}
            </motion.div>
          ), { duration: 7000, position: "top-center", id: `notif-${id}` });
        }
      });
    });

    return () => unsub();
  }, [user, isAr]);

  // --- Advice generator (every 10 minutes) ---
  useEffect(() => {
    if (!user) return;

    const fetchProfileAndGenerateAdvice = async () => {
      try {
        const playerDoc = await getDoc(doc(db, "players", user.uid));
        if (playerDoc.exists()) {
          const { generatePersonalizedAdvices } = await import("@/lib/adviceGenerator");
          await generatePersonalizedAdvices(user.uid, playerDoc.data() as any, isAr);
        }
      } catch (err) {
        console.error("Failed to generate advice", err);
      }
    };

    fetchProfileAndGenerateAdvice();
    const interval = setInterval(fetchProfileAndGenerateAdvice, 10 * 60 * 1000); // Check every 10m

    return () => clearInterval(interval);
  }, [user, isAr]);

  return null;
}
