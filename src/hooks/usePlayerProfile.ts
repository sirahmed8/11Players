import { useState, useEffect } from "react";
import { doc, getDocs, collection, query, where, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { useRouter } from "next/navigation";

export function usePlayerProfile(effectiveUid: string | null | undefined, user: any, isViewingOwnProfile: boolean, rawUid: string | null, activeCommunityId?: string | null) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedUid, setResolvedUid] = useState<string | null>(null);
  const router = useRouter();

  // Step 1: Resolve the effectiveUid to a real Firestore UID
  useEffect(() => {
    if (!effectiveUid) {
      setResolvedUid(null);
      return;
    }

    // Instant resolution for standard UIDs (eliminates 1.5s network lag)
    const isStandardUid = Boolean(effectiveUid && (effectiveUid.length >= 15 || effectiveUid === user?.uid));
    if (isStandardUid) {
      setResolvedUid(effectiveUid);
      return;
    }

    const resolveUid = async () => {
      try {
        const cleanHandle = effectiveUid.toLowerCase().replace(/^@+/, "");
        
        const uQuery = query(collection(db, "players"), where("username", "==", cleanHandle));
        const uSnap = await getDocs(uQuery);
        if (!uSnap.empty) {
          setResolvedUid(uSnap.docs[0].id);
          return;
        }

        const cQuery = query(collection(db, "players"), where("cardName", "==", cleanHandle.toUpperCase()));
        const cSnap = await getDocs(cQuery);
        if (!cSnap.empty) {
          setResolvedUid(cSnap.docs[0].id);
          return;
        }

        setResolvedUid(effectiveUid);
      } catch (err) {
        console.warn("UID resolution error:", err);
        setResolvedUid(effectiveUid);
      }
    };

    resolveUid();
  }, [effectiveUid, user?.uid]);

  // Step 2: Subscribe to the resolved UID
  useEffect(() => {
    if (!resolvedUid) return;

    if (!player) {
      setLoading(true);
    }
    
    const unsub = onSnapshot(
      doc(db, "players", resolvedUid),
      async (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          let finalPlayer = { uid: snap.id, ...d, attributes: d.attributes || {}, stats: d.stats || {} } as PlayerProfile;
          
          // Check if attributes or stats/fullName are sparse, enrich from community roster
          if (!finalPlayer.fullName || !finalPlayer.cardName || Object.keys(finalPlayer.attributes || {}).length === 0) {
            const activeCommId = activeCommunityId || (typeof window !== 'undefined' ? localStorage.getItem('activeCommunityId') : null);
            if (activeCommId) {
              try {
                const commSnap = await getDoc(doc(db, "communities", activeCommId, "players", resolvedUid));
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
  }, [resolvedUid, activeCommunityId, isViewingOwnProfile, rawUid, router]);

  return { player, setPlayer, loading, setLoading };
}
