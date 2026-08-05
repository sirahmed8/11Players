"use client";

import React, { useEffect } from "react";
import CommunityPage from "@/app/community/page";
import { useCommunity } from "@/contexts/CommunityContext";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DynamicCommunityClient({ rawSlug }: { rawSlug: string }) {
  const { setActiveCommunityId } = useCommunity();

  useEffect(() => {
    if (!rawSlug) return;
    let isMounted = true;

    async function resolveCommunity() {
      try {
        const docRef = doc(db, "communities", rawSlug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setActiveCommunityId(docSnap.id);
          return;
        }

        const q = query(collection(db, "communities"), where("slug", "==", rawSlug));
        const querySnap = await getDocs(q);
        if (!querySnap.empty && isMounted) {
          setActiveCommunityId(querySnap.docs[0].id);
          return;
        }

        const qCode = query(collection(db, "communities"), where("code", "==", rawSlug));
        const querySnapCode = await getDocs(qCode);
        if (!querySnapCode.empty && isMounted) {
          setActiveCommunityId(querySnapCode.docs[0].id);
        }
      } catch (e) {
        console.error("Failed to resolve community slug:", e);
      }
    }

    resolveCommunity();

    return () => {
      isMounted = false;
    };
  }, [rawSlug, setActiveCommunityId]);

  return <CommunityPage />;
}
