"use client";

import React, { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import { PlayerProfileContent } from "@/components/profile/PlayerProfileContent";

export default function PlayerProfilePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<SiteSkeletonLoader variant="profile" />}>
        <PlayerProfileContent />
      </Suspense>
    </ProtectedRoute>
  );
}
