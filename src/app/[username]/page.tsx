"use client";

import React, { use, Suspense } from "react";
import { PlayerProfileContent } from "@/app/profile/page";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";

export default function DynamicUsernamePage({ params }: { params: Promise<{ username: string }> }) {
  // Next.js 16 params Promise unwrap
  const unwrappedParams = use(params);
  const rawUsername = unwrappedParams?.username ? unwrappedParams.username.replace(/^@+/, "") : "";

  return (
    <ProtectedRoute>
      <Suspense fallback={<SiteSkeletonLoader variant="profile" />}>
        <PlayerProfileContent directUsername={rawUsername} />
      </Suspense>
    </ProtectedRoute>
  );
}
