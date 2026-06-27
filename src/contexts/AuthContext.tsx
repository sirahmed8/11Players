"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { PlayersProvider } from "./PlayersContext";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check if the user's UID exists in the 'admins' Firestore collection
  const checkAdminStatus = useCallback(async (uid: string): Promise<boolean> => {
    try {
      const adminDoc = await getDoc(doc(db, "admins", uid));
      return adminDoc.exists();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const ownerEmail = 'a7medorabe7@gmail.com';
        const userIsOwner = firebaseUser.email === ownerEmail;
        setIsOwner(userIsOwner);

        // If owner, set admin true immediately and skip Firestore check
        if (userIsOwner) {
          setIsAdmin(true);
          setLoading(false);
        } else {
          // Run admin check and set loading to false only after it resolves
          checkAdminStatus(firebaseUser.uid).then(adminStatus => {
            setIsAdmin(adminStatus);
            setLoading(false);
          }).catch(err => {
            console.error("Admin check failed:", err);
            setIsAdmin(false);
            setLoading(false);
          });
        }
      } else {
        setIsAdmin(false);
        setIsOwner(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [checkAdminStatus]);

  // Sign in with Google popup
  const login = useCallback(async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user and admin status
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      throw error;
    }
  }, []);

  // Sign out
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isOwner, login, logout }}>
      <PlayersProvider>
        {children}
      </PlayersProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
