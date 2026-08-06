import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
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

export const INITIAL_PLATFORM_NOTIFICATIONS: Omit<UserNotification, "id" | "read">[] = [
  {
    title: "🎨 3D Kit & Crest Builder Studio Launched!",
    titleEn: "🎨 3D Kit & Crest Builder Studio Launched!",
    titleAr: "🎨 إطلاق استوديو مصمم الأطقم والشعارات 3D!",
    body: "Design high-definition 3D squad jerseys and metallic crest badges with custom fabric patterns, realistic shaders, and 4K PNG exports.",
    bodyEn: "Design high-definition 3D squad jerseys and metallic crest badges with custom fabric patterns, realistic shaders, and 4K PNG exports.",
    bodyAr: "صمم طقم فريقك وشعار مجتمعك بخامات احترافية 3D وتشطيبات كروم ملكية وتصدير صور عالية الدقة.",
    type: "updates",
    link: "/kit-builder",
    createdAt: new Date().toISOString(),
  },
  {
    title: "💡 11AI Tactical Scout & Lineup Optimizer",
    titleEn: "💡 11AI Tactical Scout & Lineup Optimizer",
    titleAr: "💡 11AI المحلل التكتيكي ومحسن التشكيلات",
    body: "Analyze match performance, squad chemistry, and positional suitability with 11AI real-time tactical intelligence.",
    bodyEn: "Analyze match performance, squad chemistry, and positional suitability with 11AI real-time tactical intelligence.",
    bodyAr: "حلل أداء فريقك، الانسجام بين اللاعبين ومناسبتك للمركز بذكاء 11AI التكتيكي المباشر.",
    type: "advices",
    link: "/analytics",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    title: "⚔️ Derby Rivalries H2H Challenges Unlocked",
    titleEn: "⚔️ Derby Rivalries H2H Challenges Unlocked",
    titleAr: "⚔️ إطلاق تحديات الديربي والمواجهات المباشرة H2H",
    body: "Challenge rival squads in your district, climb local leaderboard ranks, and earn exclusive match trophies.",
    bodyEn: "Challenge rival squads in your district, climb local leaderboard ranks, and earn exclusive match trophies.",
    bodyAr: "تحدّ الفرق المنافسة في منطقتك، وتصدر لائحة الأبطال المحلية واكسب كؤوس المباريات الحصرية.",
    type: "trophies",
    link: "/stats/derby",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    title: "💸 Automated Turf Split-Bill Calculator",
    titleEn: "💸 Automated Turf Split-Bill Calculator",
    titleAr: "💸 حاسبة تقسيم تكلفة حجز الملعب التلقائية",
    body: "Split field rental costs instantly among match players with automated WhatsApp payment links and revenue reports.",
    bodyEn: "Split field rental costs instantly among match players with automated WhatsApp payment links and revenue reports.",
    bodyAr: "قسم تكلفة حجز الملعب فوراً بين اللاعبين مع مشاركة الروابط التلقائية عبر واتساب وتقارير الإيرادات.",
    type: "match",
    link: "/split-bill",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    title: "🌳 Playstyle Skill Tree & Achievements",
    titleEn: "🌳 Playstyle Skill Tree & Achievements",
    titleAr: "🌳 شجرة مهارات اللعب والإنجازات الجديدة",
    body: "Earn Skill Points (SP) from match MVP ratings and unlock custom playstyle badges like Sniper, Engine, and Playmaker.",
    bodyEn: "Earn Skill Points (SP) from match MVP ratings and unlock custom playstyle badges like Sniper, Engine, and Playmaker.",
    bodyAr: "اكسب نقاط المهارة (SP) من تقييمات المباريات وافتح شارات لعب مميزة مثل القناص، المحرك، وصانع الألعاب.",
    type: "stats",
    link: "/profile/skill-tree",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    title: "👑 11Players PRO Pass Benefits Unlocked",
    titleEn: "👑 11Players PRO Pass Benefits Unlocked",
    titleAr: "👑 مميزات 11Players PRO Pass المتاحة لك",
    body: "Enjoy 3D Kit Builder Studio, Golden Card Badge, AI Match Analytics, Unlimited Communities, and PDF/Excel Exports.",
    bodyEn: "Enjoy 3D Kit Builder Studio, Golden Card Badge, AI Match Analytics, Unlimited Communities, and PDF/Excel Exports.",
    bodyAr: "استمتع باستوديو الأطقم 3D والشارة الذهبية وتحليلات AI وتصدير الإحصائيات وانضمام غير محدود للمجتمعات.",
    type: "admin",
    link: "/pro-pass",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

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
      const readIds: string[] = JSON.parse(localStorage.getItem('11players_read_notifs') || '[]');
      const deletedIds: string[] = JSON.parse(localStorage.getItem('11players_deleted_notifs') || '[]');
      const seenKeys = new Set<string>();
      const combined: UserNotification[] = [];

      for (const n of [...userNotifs, ...globalAnns, ...topLevelNotifs]) {
        const key = ((n.titleEn || n.title || "") + "___" + (n.bodyEn || n.body || "")).toLowerCase().trim();
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        if (deletedIds.includes(n.id) && !n.isPublicBroadcast) continue;

        const isRead = n.read || readIds.includes(n.id);
        combined.push({ ...n, read: isRead });
      }

      combined.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // Auto-seed initial platform notifications & advices if user has no personal notifications
      if (userNotifs.length < 3 && user?.uid) {
        INITIAL_PLATFORM_NOTIFICATIONS.forEach((initNotif) => {
          const key = (initNotif.titleEn + "___" + initNotif.bodyEn).toLowerCase().trim();
          if (!seenKeys.has(key)) {
            try {
              addDoc(collection(db, "users", user.uid, "notifications"), {
                ...initNotif,
                read: false,
              }).catch(() => {});
            } catch (e) {}
          }
        });
      }

      setNotifications(combined);
      setLoading(false);
    };

    // 1. User specific notifications listener
    const qUser = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubUser = onSnapshot(
      qUser,
      (snapshot) => {
        userNotifs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as UserNotification));
        mergeNotifications();
      },
      (err) => console.error("Error fetching user notifications:", err)
    );

    // 2. Global announcements listener
    const qAnn = query(collection(db, "announcements"), orderBy("createdAt", "desc"));

    const unsubAnn = onSnapshot(
      qAnn,
      (snapshot) => {
        globalAnns = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: `ann_notif_${docSnap.id}`,
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
      },
      (err) => console.error("Error fetching announcement notifications:", err)
    );

    // 3. Top-level notifications listener
    const qTop = query(collection(db, "notifications"), orderBy("createdAt", "desc"));

    const unsubTop = onSnapshot(
      qTop,
      (snapshot) => {
        topLevelNotifs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as UserNotification));
        mergeNotifications();
      },
      (err) => console.warn("Error fetching top notifications:", err)
    );

    return () => {
      unsubUser();
      unsubAnn();
      unsubTop();
    };
  }, [user]);

  return { notifications, setNotifications, loading };
}
