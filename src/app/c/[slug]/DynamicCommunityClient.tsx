"use client";

import React, { useEffect, useState } from "react";
import CommunityPage from "@/app/community/page";
import { useCommunity } from "@/contexts/CommunityContext";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

export default function DynamicCommunityClient({ rawSlug }: { rawSlug: string }) {
  const { setActiveCommunityId } = useCommunity();
  const params = useParams();
  const [slug, setSlug] = useState<string>(rawSlug && rawSlug !== "demo" ? rawSlug : "");

  useEffect(() => {
    if (params?.slug && typeof params.slug === "string" && params.slug !== "demo") {
      setSlug(params.slug);
      return;
    }

    if (typeof window !== "undefined") {
      const parts = window.location.pathname.replace(/^\/+/, "").split("/");
      if (parts[0] === "c" && parts[1] && parts[1] !== "demo") {
        setSlug(decodeURIComponent(parts[1]));
      }
    }
  }, [params, rawSlug]);

  useEffect(() => {
    const targetSlug = slug || rawSlug;
    if (!targetSlug || targetSlug === "demo") return;
    let isMounted = true;

    async function resolveCommunity() {
      try {
        const docRef = doc(db, "communities", targetSlug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setActiveCommunityId(docSnap.id);
          return;
        }

        const q = query(collection(db, "communities"), where("slug", "==", targetSlug));
        const querySnap = await getDocs(q);
        if (!querySnap.empty && isMounted) {
          setActiveCommunityId(querySnap.docs[0].id);
          return;
        }

        const qCode = query(collection(db, "communities"), where("code", "==", targetSlug));
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
  }, [slug, rawSlug, setActiveCommunityId]);

  return <CommunityPage />;
}
