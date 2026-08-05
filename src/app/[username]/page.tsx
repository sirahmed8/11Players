"use client";

import React, { use } from "react";
import PlayerProfilePage from "@/app/profile/page";

export default function DynamicUsernamePage({ params }: { params: Promise<{ username: string }> }) {
  // Next.js 16 params Promise unwrap
  const unwrappedParams = use(params);
  const rawUsername = unwrappedParams?.username ? unwrappedParams.username.replace(/^@+/, "") : "";

  return <PlayerProfilePage directUsername={rawUsername} />;
}
