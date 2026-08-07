"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/leaderboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-sm font-bold">Redirecting to Leaderboards...</span>
      </div>
    </div>
  );
}

