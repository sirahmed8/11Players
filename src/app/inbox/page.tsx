"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLocale } from "@/components/ui/ThemeProvider";

export default function InboxRedirectPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  useEffect(() => {
    toast(
      isAr
        ? "📥 بريد الدعم والشكاوى متوفر الآن عبر الزر العائم (11AI) أسفل الشاشة!"
        : "📥 Support Inbox is now available via the 11AI floating widget at the bottom corner!",
      { icon: "🤖", duration: 5000 }
    );
    router.replace("/community");
  }, [router, isAr]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-sm font-bold">Redirecting...</span>
      </div>
    </div>
  );
}
