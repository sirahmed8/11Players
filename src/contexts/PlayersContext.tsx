"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";

interface PlayersContextProps {
  players: PlayerProfile[];
  loading: boolean;
  refreshPlayers: () => Promise<void>;
}

const PlayersContext = createContext<PlayersContextProps | undefined>(undefined);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "players"), orderBy("calculatedAge", "asc"));
      const snapshot = await getDocs(q);
      const fetchedPlayers: PlayerProfile[] = [];
      snapshot.forEach((doc) => {
        fetchedPlayers.push({ uid: doc.id, ...doc.data() } as PlayerProfile);
      });
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <PlayersContext.Provider value={{ players, loading, refreshPlayers: fetchPlayers }}>
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
