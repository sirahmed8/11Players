"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community } from "@/types";

interface CommunityContextProps {
  activeCommunityId: string | null;
  setActiveCommunityId: (id: string | null) => void;
  activeCommunity: Community | null;
  loadingCommunity: boolean;
}

const CommunityContext = createContext<CommunityContextProps | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCommunityId, setActiveCommunityIdState] = useState<string | null>(null);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("activeCommunityId");
    if (saved) {
      setActiveCommunityIdState(saved);
    } else {
      setLoadingCommunity(false);
    }
  }, []);

  const setActiveCommunityId = (id: string | null) => {
    setActiveCommunityIdState(id);
    if (id) {
      localStorage.setItem("activeCommunityId", id);
    } else {
      localStorage.removeItem("activeCommunityId");
    }
  };

  // Sync active community data from Firestore
  useEffect(() => {
    if (!activeCommunityId) {
      setActiveCommunity(null);
      setLoadingCommunity(false);
      return;
    }

    setLoadingCommunity(true);
    const unsub = onSnapshot(doc(db, "communities", activeCommunityId), (snap) => {
      if (snap.exists()) {
        setActiveCommunity({ id: snap.id, ...snap.data() } as Community);
      } else {
        setActiveCommunity(null);
        setActiveCommunityId(null); // Invalid ID, clear it
      }
      setLoadingCommunity(false);
    }, (err) => {
      console.error("Failed to fetch community:", err);
      setLoadingCommunity(false);
    });

    return () => unsub();
  }, [activeCommunityId]);

  return (
    <CommunityContext.Provider value={{ activeCommunityId, setActiveCommunityId, activeCommunity, loadingCommunity }}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) throw new Error("useCommunity must be used within a CommunityProvider");
  return context;
};
