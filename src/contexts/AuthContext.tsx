"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const checkAdminStatus = useCallback(async (uid: string): Promise<boolean> => {
    try {
      const adminDoc = await getDoc(doc(db, "admins", uid));
      return adminDoc.exists();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const ownerEmail = "a7medorabe7@gmail.com";
        const userIsOwner = firebaseUser.email === ownerEmail;
        setIsOwner(userIsOwner);

        if (userIsOwner) {
          setIsAdmin(true);
          setLoading(false);
        } else {
          checkAdminStatus(firebaseUser.uid)
            .then((status) => setIsAdmin(status))
            .finally(() => setLoading(false));
        }
      } else {
        setIsAdmin(false);
        setIsOwner(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [checkAdminStatus]);

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
