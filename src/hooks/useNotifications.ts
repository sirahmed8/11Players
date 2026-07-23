import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType = "system" | "match" | "hint" | "advices" | "admin" | "owner" | "updates" | "stats" | "trophies";

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
}

export function useNotifications(user: any) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
        notifs = notifs.filter(n => !deletedIds.includes(n.id));
      } catch (e) {}
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { notifications, setNotifications, loading };
}
