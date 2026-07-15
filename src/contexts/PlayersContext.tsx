"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { useCommunity } from "./CommunityContext";

interface PlayersContextProps {
  players: PlayerProfile[];
  loading: boolean;
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

  useEffect(() => {
    if (loadingCommunity) return;

    // If no community is selected, don't load community players.
    // (We will have a separate hook or page for Global Leaderboard)
    if (!activeCommunityId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "communities", activeCommunityId, "players"), 
      orderBy("calculatedAge", "asc")
    );
    
    let fallbackTimer: NodeJS.Timeout | null = null;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveRoster: PlayerProfile[] = [];
      snapshot.forEach((doc) => {
        liveRoster.push({ uid: doc.id, ...doc.data() } as PlayerProfile);
      });
      setPlayers(liveRoster);

      // If coming from local cache and we have very few items on initial load,
      // wait momentarily for the live server snapshot before clearing loading skeleton.
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
    <PlayersContext.Provider value={{ players, loading }}>
      {children}
    </PlayersContext.Provider>
  );
};

export const usePlayers = () => {
  const context = useContext(PlayersContext);
  if (!context) throw new Error("usePlayers must be used within a PlayersProvider");
  return context;
};
