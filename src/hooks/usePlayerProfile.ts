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
          let finalPlayer = { uid: snap.id, ...d, attributes: d.attributes || {}, stats: d.stats || {} } as PlayerProfile;
          
          // Check if attributes or stats/fullName are sparse, enrich from community roster
          if (!finalPlayer.fullName || !finalPlayer.cardName || Object.keys(finalPlayer.attributes || {}).length === 0) {
            const activeCommId = activeCommunityId || (typeof window !== 'undefined' ? localStorage.getItem('activeCommunityId') : null);
            if (activeCommId) {
              try {
                const commSnap = await getDoc(doc(db, "communities", activeCommId, "players", effectiveUid));
                if (commSnap.exists()) {
                  const cd = commSnap.data();
                  finalPlayer = {
                    ...cd,
                    ...finalPlayer,
                    fullName: finalPlayer.fullName || cd.fullName || cd.cardName,
                    cardName: finalPlayer.cardName || cd.cardName || cd.fullName,
                    attributes: { ...(cd.attributes || {}), ...(finalPlayer.attributes || {}) },
                    stats: { ...(cd.stats || {}), ...(finalPlayer.stats || {}) },
                  } as PlayerProfile;
                }
              } catch (e) {}
            }
          }

          setPlayer(finalPlayer);
          setLoading(false);
        } else {
          // Check if effectiveUid is actually a username handle or card name
          try {
            const cleanHandle = effectiveUid.toLowerCase().replace(/^@+/, "");
            const uQuery = query(collection(db, "players"), where("username", "==", cleanHandle));
            const uSnap = await getDocs(uQuery);
            if (!uSnap.empty) {
              const uDoc = uSnap.docs[0];
              const ud = uDoc.data();
              setPlayer({ uid: uDoc.id, ...ud, attributes: ud.attributes || {}, stats: ud.stats || {} } as PlayerProfile);
              setLoading(false);
              return;
            }

            // Secondary check by upper case cardName or fullName
            const cQuery = query(collection(db, "players"), where("cardName", "==", cleanHandle.toUpperCase()));
            const cSnap = await getDocs(cQuery);
            if (!cSnap.empty) {
              const cDoc = cSnap.docs[0];
              const cd = cDoc.data();
              setPlayer({ uid: cDoc.id, ...cd, attributes: cd.attributes || {}, stats: cd.stats || {} } as PlayerProfile);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn("Username/CardName query lookup error:", err);
          }

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
                const matchedUid = querySnap.docs[0].id;
                setPlayer({ uid: matchedUid, ...existingData, attributes: existingData.attributes || {}, stats: existingData.stats || {} } as PlayerProfile);
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
