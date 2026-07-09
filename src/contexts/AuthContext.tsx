"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useCommunity } from "./CommunityContext";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // True if Global Owner OR Community Admin
  isOwner: boolean; // True ONLY if Global Owner
  isGlobalModerator: boolean; // True if Global Owner OR assigned Global Moderator
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasInitialCommunityLoad: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isGlobalModerator, setIsGlobalModerator] = useState(false);
  const { activeCommunityId, setActiveCommunityId, activeCommunity, loadingCommunity } = useCommunity();

  // Determine if the current user is an admin of the active community
  const isCommunityAdmin = activeCommunity?.adminUid === user?.uid || activeCommunity?.adminUid === user?.email;
  const isAdmin = isOwner || isCommunityAdmin;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const ownerEmail = "a7medorabe7@gmail.com";
        const ownerUid = "G8vV7jTvd0VUeRlohrGFyARhiiw1";
        const userIsOwner = firebaseUser.email?.toLowerCase() === ownerEmail || firebaseUser.uid === ownerUid;
        setIsOwner(userIsOwner);
        
        // Force sync missing Google data or restore profile by email across hosts
        try {
          const playerDocSnap = await getDoc(doc(db, "players", firebaseUser.uid));
          if (playerDocSnap.exists()) {
            const data = playerDocSnap.data();
            if (!data.email || !data.googlePic || !data.googleName) {
              updateDoc(doc(db, "players", firebaseUser.uid), {
                email: firebaseUser.email || '',
                googlePic: firebaseUser.photoURL || '',
                googleName: firebaseUser.displayName || ''
              }).catch(console.error);
            }
            setIsGlobalModerator(userIsOwner || !!data.isGlobalModerator);
          } else if (firebaseUser.email) {
            // Profile not found by UID. Query by Google email!
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            const q = query(collection(db, "players"), where("email", "==", firebaseUser.email));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const existingData = querySnap.docs[0].data();
              await setDoc(doc(db, "players", firebaseUser.uid), {
                ...existingData,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                googlePic: firebaseUser.photoURL || existingData.googlePic || '',
                googleName: firebaseUser.displayName || existingData.googleName || ''
              }, { merge: true });
              setIsGlobalModerator(userIsOwner || !!existingData.isGlobalModerator);
            } else {
              setIsGlobalModerator(userIsOwner);
            }
          } else {
            setIsGlobalModerator(userIsOwner);
          }
        } catch (err) {
          console.error("Error syncing profile:", err);
          setIsGlobalModerator(userIsOwner);
        }
      } else {
        setIsOwner(false);
        setIsGlobalModerator(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [hasInitialCommunityLoad, setHasInitialCommunityLoad] = useState(false);

  // Sync activeCommunityId with Firestore so it remembers across logins/devices
  useEffect(() => {
    if (!user) return;
    
    const syncCommunity = async () => {
      const playerRef = doc(db, "players", user.uid);
      
      if (activeCommunityId) {
        // Already have a community ID (from localStorage or context) — mark as loaded immediately
        // to prevent flickering, then persist to Firestore in the background
        if (!hasInitialCommunityLoad) setHasInitialCommunityLoad(true);
        try {
          await setDoc(playerRef, { lastCommunityId: activeCommunityId, activeCommunityId }, { merge: true });
        } catch (e) {
          console.error("Failed to save lastCommunityId:", e);
        }
      } else if (!hasInitialCommunityLoad) {
        // Only try to load from Firestore if we have NO community yet
        try {
          const snap = await getDoc(playerRef);
          if (snap.exists()) {
            const data = snap.data();
            const commToSet = data.lastCommunityId || data.activeCommunityId || (data.memberCommunities && data.memberCommunities[0]) || (data.joinedCommunities && data.joinedCommunities[0]);
            if (commToSet) {
              setActiveCommunityId(commToSet);
            }
          }
          setHasInitialCommunityLoad(true);
        } catch (e) {
          console.error("Failed to load lastCommunityId:", e);
          setHasInitialCommunityLoad(true);
        }
      }
    };
    
    syncCommunity();
  }, [user, activeCommunityId, setActiveCommunityId, hasInitialCommunityLoad]);

  const login = useCallback(async () => {
    setLoading(true);
    await signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isOwner, isGlobalModerator, login, logout, hasInitialCommunityLoad }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
