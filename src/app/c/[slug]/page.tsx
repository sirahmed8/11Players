import React from "react";
import DynamicCommunityClient from "./DynamicCommunityClient";

export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export default async function DynamicCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = await params;
  const rawSlug = unwrappedParams?.slug || "";

  return <DynamicCommunityClient rawSlug={rawSlug} />;
}
