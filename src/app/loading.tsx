"use client";

import { usePathname } from "next/navigation";
import SiteSkeletonLoader, { getSkeletonVariantForPath } from "@/components/ui/SiteSkeletonLoader";

export default function RootLoading() {
  const pathname = usePathname();
  const variant = getSkeletonVariantForPath(pathname || "/");
  return <SiteSkeletonLoader variant={variant} />;
}
