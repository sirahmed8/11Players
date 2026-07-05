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
        import("firebase/firestore").then(({ doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs }) => {
          import("@/lib/firebase").then(({ db }) => {
            getDoc(doc(db, "players", firebaseUser.uid)).then(async (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                if (!data.email || !data.googlePic || !data.googleName) {
                  updateDoc(doc(db, "players", firebaseUser.uid), {
                    email: firebaseUser.email || '',
                    googlePic: firebaseUser.photoURL || '',
                    googleName: firebaseUser.displayName || ''
                  }).catch(console.error);
                }
                setIsGlobalModerator(userIsOwner || !!data.isGlobalModerator);
              } else if (firebaseUser.email) {
                // Profile not found by UID (e.g. host mismatch or legacy). Query by Google email!
                try {
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
                    console.log("Successfully restored and synced profile by email across hosts!");
                  } else {
                    setIsGlobalModerator(userIsOwner);
                  }
                } catch (err) {
                  console.error("Error syncing profile by email:", err);
                  setIsGlobalModerator(userIsOwner);
                }
              } else {
                setIsGlobalModerator(userIsOwner);
              }
            });
          });
        });
      } else {
        setIsOwner(false);
        setIsGlobalModerator(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync activeCommunityId with Firestore so it remembers across logins/devices
  useEffect(() => {
    if (!user) return;
    
    const syncCommunity = async () => {
      const userRef = doc(db, "users", user.uid);
      
      if (activeCommunityId) {
        // Save to Firestore
        try {
          await setDoc(userRef, { lastCommunityId: activeCommunityId }, { merge: true });
        } catch (e) {
          console.error("Failed to save lastCommunityId:", e);
        }
      } else {
        // Load from Firestore if missing
        try {
          const snap = await getDoc(userRef);
          if (snap.exists() && snap.data().lastCommunityId) {
            setActiveCommunityId(snap.data().lastCommunityId);
          }
        } catch (e) {
          console.error("Failed to load lastCommunityId:", e);
        }
      }
    };
    
    syncCommunity();
  }, [user, activeCommunityId, setActiveCommunityId]);

  const login = useCallback(async () => {
    setLoading(true);
    await signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isOwner, isGlobalModerator, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
