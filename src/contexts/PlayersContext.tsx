"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";

interface PlayersContextProps {
  players: PlayerProfile[];
  loading: boolean;
}

const PlayersContext = createContext<PlayersContextProps | undefined>(undefined);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("calculatedAge", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPlayers: PlayerProfile[] = [];
        snapshot.forEach((doc) => {
          fetchedPlayers.push({ uid: doc.id, ...doc.data() } as PlayerProfile);
        });
        setPlayers(fetchedPlayers);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching players:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <PlayersContext.Provider value={{ players, loading }}>
      {children}
    </PlayersContext.Provider>
  );
};

export const usePlayers = (): PlayersContextProps => {
  const context = useContext(PlayersContext);
  if (!context) {
    throw new Error("usePlayers must be used within a PlayersProvider");
  }
  return context;
};
