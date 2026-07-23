import { useState, useEffect } from "react";
import { doc, getDocs, collection, query, where, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useAuthProfile(user: any) {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "players", user.uid), async (userDoc) => {
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      } else if (user.email) {
        try {
          const q = query(collection(db, "players"), where("email", "==", user.email));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const existingData = querySnap.docs[0].data();
            await setDoc(doc(db, "players", user.uid), { ...existingData, uid: user.uid }, { merge: true });
            setUserProfile(existingData);
          }
        } catch (e) {
          console.error("Profile sync by email error:", e);
        }
      }
    });

    return () => unsub();
  }, [user]);

  return { userProfile, setUserProfile };
}
