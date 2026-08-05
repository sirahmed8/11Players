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
      }
      
      // If primary doc missing OR missing username, search by email to find existing handle/profile
      if ((!data || !data.username) && user.email) {
        try {
          const q = query(collection(db, "players"), where("email", "==", user.email));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            // Find doc with username or first doc
            const docWithUsername = querySnap.docs.find((d) => Boolean(d.data().username)) || querySnap.docs[0];
            const emailData = docWithUsername.data();
            data = { ...(data || {}), ...emailData };
            
            // Sync found username to user.uid document in Firestore
            if (emailData.username) {
              await setDoc(doc(db, "players", user.uid), { ...emailData, username: emailData.username, uid: user.uid }, { merge: true });
              if (typeof window !== "undefined") {
                localStorage.setItem(`claimed_username_${user.uid}`, emailData.username);
                localStorage.setItem(`claimed_username_${user.email}`, emailData.username);
                localStorage.setItem("claimed_username_global", emailData.username);
              }
            }
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
