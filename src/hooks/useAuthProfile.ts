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
      let data: any = null;
      if (userDoc.exists()) {
        data = userDoc.data();
      } else if (user.email) {
        try {
          const q = query(collection(db, "players"), where("email", "==", user.email));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            data = querySnap.docs[0].data();
            await setDoc(doc(db, "players", user.uid), { ...data, uid: user.uid }, { merge: true });
          }
        } catch (e) {
          console.error("Profile sync by email error:", e);
        }
      }

      if (data) {
        const localHandle = typeof window !== "undefined"
          ? (localStorage.getItem(`claimed_username_${user.uid}`) || (user.email && localStorage.getItem(`claimed_username_${user.email}`)) || localStorage.getItem("claimed_username_global"))
          : null;
        if (localHandle && !data.username) {
          data = { ...data, username: localHandle };
          setDoc(doc(db, "players", user.uid), { username: localHandle }, { merge: true }).catch(console.error);
          if (user.email) {
            const qEmail = query(collection(db, "players"), where("email", "==", user.email));
            getDocs(qEmail).then((snap) => {
              snap.docs.forEach((dSnap) => {
                setDoc(doc(db, "players", dSnap.id), { username: localHandle }, { merge: true }).catch(console.error);
              });
            }).catch(console.error);
          }
        }
        setUserProfile(data);
      }
    }, (err) => {
      console.warn("useAuthProfile onSnapshot error:", err);
    });

    return () => unsub();
  }, [user]);

  return { userProfile, setUserProfile };
}
