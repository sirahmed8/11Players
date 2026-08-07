"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLocale } from "@/components/ui/ThemeProvider";

export default function SupportRedirectPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-11ai-chat", { detail: { tab: "ai" } }));
    }
    router.replace("/community");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-sm font-bold">Redirecting...</span>
      </div>
    </div>
  );
}
