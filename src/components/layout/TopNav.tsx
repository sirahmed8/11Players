"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Menu } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";
import Image from "next/image";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  
  const [pageTitle, setPageTitle] = useState("");

  const isHome = pathname === "/" || pathname === "/communities";

  useEffect(() => {
    if (pathname.includes("/profile")) setPageTitle(isAr ? "الملف الشخصي" : "Profile");
    else if (pathname.includes("/match")) setPageTitle(isAr ? "المباريات" : "Matches");
    else if (pathname.includes("/community")) setPageTitle(isAr ? "المجتمع" : "Community");
    else if (pathname.includes("/admin")) setPageTitle(isAr ? "لوحة التحكم" : "Admin");
    else if (pathname.includes("/stats")) setPageTitle(isAr ? "الإحصائيات" : "Stats");
    else if (pathname.includes("/inbox")) setPageTitle(isAr ? "البريد" : "Inbox");
    else if (pathname.includes("/support")) setPageTitle(isAr ? "الدعم" : "Support");
    else setPageTitle("11Players");
  }, [pathname, isAr]);

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between shadow-sm md:hidden">
      <div className="flex items-center gap-3">
        {!isHome && (
          <button 
            onClick={() => router.back()}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors"
          >
            {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
        )}
        <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{pageTitle}</span>
      </div>
      <div className="flex items-center gap-3">
        <Image src="/logo.jpg" alt="11Players" width={32} height={32} className="rounded-lg object-cover shadow-sm" priority />
      </div>
    </div>
  );
}
