"use client";

import React, { Suspense } from "react";
import { PlayerProfileContent } from "@/components/profile/PlayerProfileContent";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";

export default function DynamicUsernameClient({ rawUsername }: { rawUsername: string }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<SiteSkeletonLoader variant="profile" />}>
        <PlayerProfileContent directUsername={rawUsername} />
      </Suspense>
    </ProtectedRoute>
  );
}
