import { useState, useEffect } from "react";
import { doc, getDocs, collection, query, where, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { useRouter } from "next/navigation";

export function usePlayerProfile(effectiveUid: string | null | undefined, user: any, isViewingOwnProfile: boolean, rawUid: string | null, activeCommunityId?: string | null) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!effectiveUid) {
      return;
    }

    if (!player) {
      setLoading(true);
    }
    
    const unsub = onSnapshot(
      doc(db, "players", effectiveUid),
      async (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setPlayer({ uid: snap.id, ...d, attributes: d.attributes || {}, stats: d.stats || {} } as PlayerProfile);
          setLoading(false);
        } else {
          // Check if player exists in active community before giving up
          const activeCommId = activeCommunityId || (typeof window !== 'undefined' ? localStorage.getItem('activeCommunityId') : null);
          if (activeCommId) {
            try {
              const commSnap = await getDoc(doc(db, "communities", activeCommId, "players", effectiveUid));
              if (commSnap.exists()) {
                const cd = commSnap.data();
                setPlayer({ uid: commSnap.id, ...cd, attributes: cd.attributes || {}, stats: cd.stats || {} } as PlayerProfile);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error("Fallback community profile lookup failed:", e);
            }
          }

          if (user?.email && isViewingOwnProfile) {
            try {
              const q = query(collection(db, "players"), where("email", "==", user.email));
              const querySnap = await getDocs(q);
              if (!querySnap.empty) {
                const existingData = querySnap.docs[0].data();
                await setDoc(doc(db, "players", effectiveUid), { ...existingData, uid: effectiveUid }, { merge: true });
                setPlayer({ uid: effectiveUid, ...existingData, attributes: existingData.attributes || {}, stats: existingData.stats || {} } as PlayerProfile);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error("Profile sync by email error:", e);
            }
          }

          setPlayer(null);
          setLoading(false);
          // Only redirect to onboarding if the user navigated to their OWN profile directly without param
          if (isViewingOwnProfile && !rawUid) {
            router.push("/onboarding");
          }
        }
      },
      (err) => {
        console.error("Profile onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUid, user?.uid, router]);

  return { player, setPlayer, loading, setLoading };
}
