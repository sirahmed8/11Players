"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useCommunity } from "./CommunityContext";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // True if Global Owner OR Community Admin
  isOwner: boolean; // True ONLY if Global Owner
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const { activeCommunity, loadingCommunity } = useCommunity();

  // Determine if the current user is an admin of the active community
  const isCommunityAdmin = activeCommunity?.adminUid === user?.uid || activeCommunity?.adminUid === user?.email;
  const isAdmin = isOwner || isCommunityAdmin;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const ownerEmail = "a7medorabe7@gmail.com";
        const userIsOwner = firebaseUser.email === ownerEmail;
        setIsOwner(userIsOwner);
      } else {
        setIsOwner(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    setLoading(true);
    await signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isOwner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
