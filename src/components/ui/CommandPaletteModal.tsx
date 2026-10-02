"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Zap,
  Trophy,
  Shield,
  Users,
  Moon,
  Sun,
  ArrowRight,
  X,
  AtSign,
  CreditCard,
  Crown,
  Settings,
  Receipt,
  Shirt,
  Newspaper,
  BookOpen,
  Headphones,
  Flame,
  Activity,
  Globe,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import { usePlayers } from "@/contexts/PlayersContext";

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickMatch?: () => void;
}

interface CommandItem {
  id: string;
  titleEn: string;
  titleAr: string;
  category: "navigation" | "actions" | "settings" | "players";
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickMatch,
}) => {
  const router = useRouter();
  const { locale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { players = [] } = usePlayers();
  const isAr = locale === "ar";

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener to toggle or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(
    () => [
      {
        id: "quick-match",
        titleEn: "Quick Match Generator",
        titleAr: "مولد المباريات السريع",
        category: "actions",
        icon: <Zap className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onClose();
          if (onOpenQuickMatch) onOpenQuickMatch();
        },
      },
      {
        id: "nav-pricing",
        titleEn: "Subscription Tiers & Pricing Matrix",
        titleAr: "خطط وباقات الاشتراك والأسعار",
        category: "navigation",
        icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onClose();
          router.push("/pricing");
        },
      },
      {
        id: "nav-pro-pass",
        titleEn: "PRO Pass Hub & Benefits",
        titleAr: "باقة الكابتن والمجتمعات PRO Pass",
        category: "navigation",
        icon: <Crown className="w-4 h-4 text-amber-500" />,
        action: () => {
          onClose();
          router.push("/pro-pass");
        },
      },
      {
        id: "nav-matches",
        titleEn: "Matches & Lineups",
        titleAr: "المباريات والتكتيكات",
        category: "navigation",
        icon: <Trophy className="w-4 h-4 text-amber-500" />,
        action: () => {
          onClose();
          router.push("/match");
        },
      },
      {
        id: "nav-draft",
        titleEn: "Captain Draft Room",
        titleAr: "غرفة اختيارات الكباتن",
        category: "navigation",
        icon: <Shield className="w-4 h-4 text-teal-500" />,
        action: () => {
          onClose();
          router.push("/match/draft");
        },
      },
      {
        id: "nav-split-bill",
        titleEn: "Turf Rent Split-Bill Calculator",
        titleAr: "حاسبة تقاسم حجز الملعب",
        category: "navigation",
        icon: <Receipt className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onClose();
          router.push("/split-bill");
        },
      },
      {
        id: "nav-kit-builder",
        titleEn: "Kit & Crest Studio",
        titleAr: "مصمم الأطقم وشعارات النوادي",
        category: "navigation",
        icon: <Shirt className="w-4 h-4 text-indigo-500" />,
        action: () => {
          onClose();
          router.push("/kit-builder");
        },
      },
      {
        id: "nav-newspaper",
        titleEn: "Retro Sports Newspaper Generator",
        titleAr: "جريدة الهجوزات الرياضية",
        category: "navigation",
        icon: <Newspaper className="w-4 h-4 text-amber-600" />,
        action: () => {
          onClose();
          router.push("/newspaper");
        },
      },
      {
        id: "nav-derby",
        titleEn: "Derby Rivalries H2H Engine",
        titleAr: "محرك الديربيات والمواجهات المباشرة",
        category: "navigation",
        icon: <Flame className="w-4 h-4 text-rose-500" />,
        action: () => {
          onClose();
          router.push("/derby");
        },
      },
      {
        id: "nav-live",
        titleEn: "Live Spectator Broadcaster",
        titleAr: "البث التكتيكي المباشر والتعليق",
        category: "navigation",
        icon: <Activity className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onClose();
          router.push("/live");
        },
      },
      {
        id: "nav-stats",
        titleEn: "Stats & Division Leaderboard",
        titleAr: "الإحصائيات وترتيب الدوريات",
        category: "navigation",
        icon: <Users className="w-4 h-4 text-cyan-500" />,
        action: () => {
          onClose();
          router.push("/stats");
        },
      },
      {
        id: "nav-communities",
        titleEn: "Communities Directory",
        titleAr: "دليل ومجتمعات الملاعب",
        category: "navigation",
        icon: <Globe className="w-4 h-4 text-blue-500" />,
        action: () => {
          onClose();
          router.push("/communities");
        },
      },
      {
        id: "nav-achievements",
        titleEn: "Achievements & Honors",
        titleAr: "خزانة الكؤوس والإنجازات",
        category: "navigation",
        icon: <Award className="w-4 h-4 text-amber-500" />,
        action: () => {
          onClose();
          router.push("/achievements");
        },
      },
      {
        id: "nav-settings",
        titleEn: "Settings & GDPR Privacy",
        titleAr: "إعدادات الحساب والخصوصية (GDPR)",
        category: "navigation",
        icon: <Settings className="w-4 h-4 text-slate-500" />,
        action: () => {
          onClose();
          router.push("/settings");
        },
      },
      {
        id: "nav-guide",
        titleEn: "Tactical Guide & PSI Matrix",
        titleAr: "دليل المراكز والتكتيك الرياضي",
        category: "navigation",
        icon: <BookOpen className="w-4 h-4 text-teal-500" />,
        action: () => {
          onClose();
          router.push("/guide");
        },
      },
      {
        id: "nav-support",
        titleEn: "Support & Help Desk",
        titleAr: "مركز المساعدة والدعم الفني",
        category: "navigation",
        icon: <Headphones className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onClose();
          router.push("/support");
        },
      },
      {
        id: "toggle-theme",
        titleEn: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        titleAr: theme === "dark" ? "التحويل للوضع الفاتح" : "التحويل للوضع الداكن",
        category: "settings",
        icon:
          theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          ),
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      // Dynamic Player Items for Search by Username / Name
      ...players.slice(0, 50).map((p) => {
        const handle = p.username ? `@${p.username}` : "";
        const displayName = `${p.cardName || p.fullName} ${handle}`.trim();
        return {
          id: `player-${p.uid}`,
          titleEn: `Player: ${displayName}`,
          titleAr: `لاعب: ${displayName}`,
          category: "players" as const,
          icon: <AtSign className="w-4 h-4 text-emerald-500" />,
          action: () => {
            onClose();
            router.push(p.username ? `/profile?username=${p.username}` : `/profile?uid=${p.uid}`);
          },
        };
      }),
    ],
    [players, router, onClose, onOpenQuickMatch, theme, toggleTheme]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const matchEn = item.titleEn.toLowerCase().includes(q);
      const matchAr = item.titleAr.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      return matchEn || matchAr || matchCategory;
    });
  }, [items, query]);

  // Adjust selectedIndex bounds when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md"
          onClick={onClose}
          dir={isAr ? "rtl" : "ltr"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-950/40">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  isAr
                    ? "ابحث عن صفحة، باقة، أو لاعب باسم المستخدم... (Ctrl+K)"
                    : "Search pages, pricing, or players by username... (Ctrl+K)"
                }
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                ESC
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label={isAr ? "إغلاق" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs font-semibold">
                  {isAr ? "لم يتم العثور على أوامر أو لاعبين مطابقة" : "No matching commands or players found"}
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-all text-start group cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-white dark:bg-slate-900 border-emerald-500/40 text-emerald-500"
                              : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 group-hover:border-slate-300 dark:group-hover:border-slate-700"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="truncate">
                          <span
                            className={`text-xs sm:text-sm font-bold block truncate ${
                              isSelected
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                            }`}
                          >
                            {isAr ? item.titleAr : item.titleEn}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 transition-transform rtl:rotate-180 ${
                          isSelected
                            ? "text-emerald-600 dark:text-emerald-400 translate-x-1 rtl:-translate-x-1"
                            : "text-slate-400 dark:text-slate-600 group-hover:text-emerald-500"
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    ↑↓
                  </kbd>{" "}
                  {isAr ? "للتنقل" : "to navigate"}
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    Enter
                  </kbd>{" "}
                  {isAr ? "للاختيار" : "to select"}
                </span>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                11Players Spotlight
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPaletteModal;
