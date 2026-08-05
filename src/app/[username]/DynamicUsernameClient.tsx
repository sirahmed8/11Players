"use client";

import React, { Suspense, useState, useEffect } from "react";
import { PlayerProfileContent } from "@/components/profile/PlayerProfileContent";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import { useParams } from "next/navigation";

export default function DynamicUsernameClient({ rawUsername }: { rawUsername: string }) {
  const params = useParams();
  const [handle, setHandle] = useState<string>(rawUsername && rawUsername !== "demo" ? rawUsername : "");

  useEffect(() => {
    if (params?.username && typeof params.username === "string" && params.username !== "demo") {
      setHandle(params.username.replace(/^@+/, ""));
      return;
    }

    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\/+/, "").split("/")[0];
      if (path && path !== "demo" && path !== "profile") {
        setHandle(decodeURIComponent(path).replace(/^@+/, ""));
      }
    }
  }, [params, rawUsername]);

  return (
    <ProtectedRoute>
      <Suspense fallback={<SiteSkeletonLoader variant="profile" />}>
        <PlayerProfileContent directUsername={handle || rawUsername} />
      </Suspense>
    </ProtectedRoute>
  );
}
