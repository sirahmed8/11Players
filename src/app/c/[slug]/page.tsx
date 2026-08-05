"use client";

import React, { use, useEffect } from "react";
import CommunityPage from "@/app/community/page";
import { useCommunity } from "@/contexts/CommunityContext";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DynamicCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const rawSlug = unwrappedParams?.slug || "";
  const { setActiveCommunityId } = useCommunity();

  useEffect(() => {
    if (!rawSlug) return;
    let isMounted = true;

    async function resolveCommunity() {
      try {
        // 1. Try by direct document ID
        const docRef = doc(db, "communities", rawSlug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setActiveCommunityId(docSnap.id);
          return;
        }

        // 2. Try by custom slug field
        const q = query(collection(db, "communities"), where("slug", "==", rawSlug));
        const querySnap = await getDocs(q);
        if (!querySnap.empty && isMounted) {
          setActiveCommunityId(querySnap.docs[0].id);
          return;
        }

        // 3. Try by code field
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
