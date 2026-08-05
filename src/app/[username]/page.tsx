import React from "react";
import DynamicUsernameClient from "./DynamicUsernameClient";

export function generateStaticParams() {
  return [{ username: "demo" }];
}

export default async function DynamicUsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const unwrappedParams = await params;
  const rawUsername = unwrappedParams?.username ? unwrappedParams.username.replace(/^@+/, "") : "";

  return <DynamicUsernameClient rawUsername={rawUsername} />;
}
