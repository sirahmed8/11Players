"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";

interface PlayersContextProps {
  players: PlayerProfile[];
  loading: boolean;
}

const PlayersContext = createContext<PlayersContextProps | undefined>(undefined);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("calculatedAge", "asc"));
    
    // Real-time listener replacing static getDocs
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveRoster: PlayerProfile[] = [];
      snapshot.forEach((doc) => {
        liveRoster.push({ uid: doc.id, ...doc.data() } as PlayerProfile);
      });
      setPlayers(liveRoster);
      setLoading(false);
    }, (error) => {
      console.error("Real-time roster sync failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
