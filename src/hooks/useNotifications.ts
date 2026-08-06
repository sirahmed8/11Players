import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
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

    const mergeNotifications = () => {
      let combined = [...userNotifs, ...globalAnns];
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
        combined = combined.filter(n => !deletedIds.includes(n.id) || n.isPublicBroadcast);
      } catch (e) {}
      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
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

    // 2. Global announcements listener (synced into updates category)
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

    return () => {
      unsubUser();
      unsubAnn();
    };
  }, [user]);

  return { notifications, setNotifications, loading };
}
