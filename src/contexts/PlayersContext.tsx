"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { collection, query, onSnapshot, getDocs, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { useCommunity } from "./CommunityContext";

interface PlayersContextProps {
  players: PlayerProfile[];
  loading: boolean;
  refreshPlayers: () => Promise<void>;
}

const PlayersContext = createContext<PlayersContextProps | undefined>(undefined);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(loading);
  const { activeCommunityId, loadingCommunity } = useCommunity();

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const refreshPlayers = useCallback(async () => {
    if (!activeCommunityId) return;
    try {
      const commPlayersRef = collection(db, "communities", activeCommunityId, "players");
      const commSnap = await getDocs(commPlayersRef);
      const liveRoster: PlayerProfile[] = [];
      const batch = writeBatch(db);
      let batchCount = 0;

      for (const d of commSnap.docs) {
        const commData = { uid: d.id, ...d.data() } as PlayerProfile;
        try {
          // Check global doc to sync/heal any desync in stats or overallRating
          const globalSnap = await getDoc(doc(db, "players", d.id));
          if (globalSnap.exists()) {
            const globalData = globalSnap.data() as PlayerProfile;
            let needsUpdate = false;
            const healedData = { ...commData };

            // Sync stats if global has newer or community stats
            const globalStats = globalData.communityStats?.[activeCommunityId] || globalData.stats;
            if (globalStats && JSON.stringify(globalStats) !== JSON.stringify(commData.stats)) {
              healedData.stats = { ...(commData.stats || {}), ...globalStats };
              needsUpdate = true;
            }

            // Sync overall rating if different
            if (globalData.overallRating && globalData.overallRating !== commData.overallRating) {
              healedData.overallRating = globalData.overallRating;
              needsUpdate = true;
            }

            // Sync approvedAttributes if global has them
            if (globalData.approvedAttributes && !commData.approvedAttributes) {
              healedData.approvedAttributes = globalData.approvedAttributes;
              needsUpdate = true;
            }

            if (needsUpdate) {
              batch.set(doc(db, "communities", activeCommunityId, "players", d.id), {
                ...(healedData.stats ? { stats: healedData.stats } : {}),
                ...(healedData.overallRating ? { overallRating: healedData.overallRating } : {}),
                ...(healedData.approvedAttributes ? { approvedAttributes: healedData.approvedAttributes } : {}),
              }, { merge: true });
              batchCount++;
            }
            liveRoster.push(needsUpdate ? healedData : commData);
          } else {
            liveRoster.push(commData);
          }
        } catch (e) {
          liveRoster.push(commData);
        }
      }

      if (batchCount > 0) {
        await batch.commit().catch(err => console.warn("Sync batch warning:", err));
      }

      liveRoster.sort((a, b) => (Number(a.calculatedAge) || 99) - (Number(b.calculatedAge) || 99));
      setPlayers(liveRoster);
    } catch (err) {
      console.error("Failed to refresh players:", err);
    }
  }, [activeCommunityId]);

  useEffect(() => {
    if (loadingCommunity) return;

    if (!activeCommunityId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Query without orderBy("calculatedAge") filter so docs missing calculatedAge are never dropped!
    const q = query(collection(db, "communities", activeCommunityId, "players"));
    let fallbackTimer: NodeJS.Timeout | null = null;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveRoster: PlayerProfile[] = [];
      snapshot.forEach((doc) => {
        liveRoster.push({ uid: doc.id, ...doc.data() } as PlayerProfile);
      });
      // Sort in memory safely
      liveRoster.sort((a, b) => (Number(a.calculatedAge) || 99) - (Number(b.calculatedAge) || 99));
      setPlayers(liveRoster);

      if (snapshot.metadata.fromCache && snapshot.size <= 3 && loadingRef.current) {
        if (!fallbackTimer) {
          fallbackTimer = setTimeout(() => setLoading(false), 900);
        }
      } else {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setLoading(false);
      }
    }, (error) => {
      console.error("Real-time roster sync failed:", error);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [activeCommunityId, loadingCommunity]);

  return (
    <PlayersContext.Provider value={{ players, loading, refreshPlayers }}>
      {children}
    </PlayersContext.Provider>
  );
};

export const usePlayers = () => {
  const context = useContext(PlayersContext);
  if (!context) throw new Error("usePlayers must be used within a PlayersProvider");
  return context;
};

