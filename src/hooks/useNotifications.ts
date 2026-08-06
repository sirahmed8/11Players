import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType = "system" | "match" | "hint" | "advices" | "admin" | "owner" | "updates" | "stats" | "trophies" | "broadcasts";

export interface UserNotification {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  body: string;
  bodyAr?: string;
  bodyEn?: string;
  read: boolean;
  createdAt: any;
  type: NotificationType;
  link?: string;
  isPublicBroadcast?: boolean;
}

export function useNotifications(user: any) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let userNotifs: UserNotification[] = [];
    let globalAnns: UserNotification[] = [];
    let topLevelNotifs: UserNotification[] = [];

    const mergeNotifications = () => {
      const seenKeys = new Set<string>();
      const combined: UserNotification[] = [];

      for (const n of [...userNotifs, ...globalAnns, ...topLevelNotifs]) {
        const key = ((n.titleEn || n.title || "") + "___" + (n.bodyEn || n.body || "")).toLowerCase().trim();
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        try {
          const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
          if (deletedIds.includes(n.id) && !n.isPublicBroadcast) continue;
        } catch (e) {}

        combined.push(n);
      }

      combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // If user has no personal notifications yet, auto-seed initial tactical advice notification
      if (userNotifs.length === 0 && user?.uid) {
        try {
          addDoc(collection(db, "users", user.uid, "notifications"), {
            titleEn: "💡 Official 11AI Tactical Advice",
            titleAr: "💡 نصيحة 11AI التكتيكية الرسمية",
            bodyEn: "Welcome to 11Players! As an active player on our platform, maintain high positioning discipline, train consistently, and build synergy with your squad captains to elevate your OVR rating.",
            bodyAr: "أهلاً بك في 11Players! كلاعب نشط في مجتمعنا، حافظ على الانضباط التكتيكي في الملعب، وتدرب باستمرار، وابنِ انسجاماً رائعاً مع قادة فريقك لرفع تقييمك (OVR).",
            read: false,
            createdAt: new Date().toISOString(),
            type: "advices",
            link: "/notifications"
          }).catch(() => {});
        } catch (e) {}
      }

      setNotifications(combined);
      setLoading(false);
    };

    // 1. User specific notifications listener
    const qUser = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubUser = onSnapshot(qUser, (snapshot) => {
      userNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
      mergeNotifications();
    }, (err) => console.error("Error fetching user notifications:", err));

    // 2. Global announcements listener
    const qAnn = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );

    const unsubAnn = onSnapshot(qAnn, (snapshot) => {
      globalAnns = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `ann_notif_${doc.id}`,
          title: data.titleEn || data.titleAr || "Official Broadcast",
          titleEn: data.titleEn,
          titleAr: data.titleAr,
          body: data.bodyEn || data.bodyAr || "",
          bodyEn: data.bodyEn,
          bodyAr: data.bodyAr,
          read: true,
          createdAt: data.createdAt,
          type: "updates",
          link: data.link || "/notifications?category=broadcasts",
          isPublicBroadcast: true,
        } as UserNotification;
      });
      mergeNotifications();
    }, (err) => console.error("Error fetching announcement notifications:", err));

    // 3. Top-level notifications listener
    const qTop = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubTop = onSnapshot(qTop, (snapshot) => {
      topLevelNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
      mergeNotifications();
    }, (err) => console.warn("Error fetching top notifications:", err));

    return () => {
      unsubUser();
      unsubAnn();
      unsubTop();
    };
  }, [user]);

  return { notifications, setNotifications, loading };
}
