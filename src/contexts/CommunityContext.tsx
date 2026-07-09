"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community, CommunitySettings } from "@/types";

interface CommunityContextProps {
  activeCommunityId: string | null;
  setActiveCommunityId: (id: string | null) => void;
  activeCommunity: Community | null;
  communitySettings: CommunitySettings;
  loadingCommunity: boolean;
}

const CommunityContext = createContext<CommunityContextProps | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCommunityId, setActiveCommunityIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeCommunityId");
    }
    return null;
  });
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [communitySettings, setCommunitySettings] = useState<CommunitySettings>({ slowModeDelay: 0 });
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  const [hasReadStorage, setHasReadStorage] = useState(true);

  const setActiveCommunityId = useCallback((id: string | null) => {
    setActiveCommunityIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("activeCommunityId", id);
      } else {
        localStorage.removeItem("activeCommunityId");
      }
    }
  }, []);

  // Sync active community data from Firestore
  useEffect(() => {
    if (!hasReadStorage) return;

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

    const unsubSettings = onSnapshot(doc(db, "communities", activeCommunityId, "settings", "config"), (snap) => {
      if (snap.exists()) {
        setCommunitySettings(snap.data() as CommunitySettings);
      } else {
        setCommunitySettings({ slowModeDelay: 0 });
      }
    }, (err) => {
      console.error("Failed to fetch community settings:", err);
    });

    return () => {
      unsub();
      unsubSettings();
    };
  }, [activeCommunityId, hasReadStorage, setActiveCommunityId]);

  return (
    <CommunityContext.Provider 
      value={{ 
        activeCommunityId, 
        setActiveCommunityId, 
        activeCommunity, 
        communitySettings,
        loadingCommunity 
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) throw new Error("useCommunity must be used within a CommunityProvider");
  return context;
};
