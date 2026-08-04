"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Shield, Sparkles, Users, Tv, Newspaper, Receipt, Swords, SlidersHorizontal } from "lucide-react";

interface Props {
  className?: string;
}

export default function MatchActionHubBar({ className = "" }: Props) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const tabs = [
    {
      id: "matchmaking",
      href: "/match",
      activeCheck: (path: string) => path === "/match" || path === "/matches",
      labelEn: "Squad Balancer",
      labelAr: "موازن التشكيلة",
      icon: SlidersHorizontal,
      badgeEn: "Core",
      badgeAr: "الأساسي",
    },
    {
      id: "draft",
      href: "/match/draft",
      activeCheck: (path: string) => path.includes("/draft"),
      labelEn: "Captain Draft",
      labelAr: "درافت الكباتن",
      icon: Users,
      badgeEn: "Live Draft",
      badgeAr: "درافت حي",
    },
    {
      id: "live",
      href: "/match/live",
      activeCheck: (path: string) => path.includes("/live"),
      labelEn: "Live Broadcaster",
      labelAr: "البث المباشر",
      icon: Tv,
      badgeEn: "2D Pitch",
      badgeAr: "ملعب حي",
    },
    {
      id: "newspaper",
      href: "/match/newspaper",
      activeCheck: (path: string) => path.includes("/newspaper"),
      labelEn: "Sports Newspaper",
      labelAr: "جريدة المباراة",
      icon: Newspaper,
      badgeEn: "Retro",
      badgeAr: "كلاسيك",
    },
    {
      id: "split-bill",
      href: "/match/split-bill",
      activeCheck: (path: string) => path.includes("/split-bill"),
      labelEn: "Split Rent Bill",
      labelAr: "تقسيم الحجز",
      icon: Receipt,
      badgeEn: "Finance",
      badgeAr: "مالية",
    },
    {
      id: "derby",
      href: "/stats/derby",
      activeCheck: (path: string) => path.includes("/derby"),
      labelEn: "Derby Rivalries",
      labelAr: "ديربي الديربيات",
      icon: Swords,
      badgeEn: "H2H",
      badgeAr: "مواجهات",
    },
  ];

  return (
    <div className={`w-full mb-6 ${className}`} dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-1.5 md:p-2 shadow-xl overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = tab.activeCheck(pathname);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`relative group px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-xs md:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "text-emerald-400 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMatchHubTab"
                    className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 z-10 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span className="z-10 whitespace-nowrap">
                  {isAr ? tab.labelAr : tab.labelEn}
                </span>
                <span
                  className={`z-10 px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold z-10 ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800/80 text-slate-500 border border-slate-700/50 group-hover:text-slate-400"
                  }`}
                >
                  {isAr ? tab.badgeAr : tab.badgeEn}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
