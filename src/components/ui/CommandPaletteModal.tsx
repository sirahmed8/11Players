"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, Zap, Trophy, Shield, Users, Settings, Volume2, VolumeX, Moon, Sun, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import { soundFx } from "@/lib/soundEffects";

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickMatch?: () => void;
}

interface CommandItem {
  id: string;
  titleEn: string;
  titleAr: string;
  category: "navigation" | "actions" | "settings";
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickMatch,
}) => {
  const router = useRouter();
  const { locale, toggleLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const isAr = locale === "ar";
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        soundFx.playClick();
        if (isOpen) onClose();
        else {
          // Open triggered from parent or direct listener
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items: CommandItem[] = [
    {
      id: "quick-match",
      titleEn: "Quick Match Generator",
      titleAr: "مولد المباريات السريع",
      category: "actions",
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        if (onOpenQuickMatch) onOpenQuickMatch();
      },
    },
    {
      id: "nav-matches",
      titleEn: "Matches & Lineups",
      titleAr: "المباريات والتكتيكات",
      category: "navigation",
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
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
      icon: <Shield className="w-4 h-4 text-teal-400" />,
      action: () => {
        onClose();
        router.push("/match/draft");
      },
    },
    {
      id: "nav-stats",
      titleEn: "Stats & Division Leaderboard",
      titleAr: "الإحصائيات وترتيب الدوريات",
      category: "navigation",
      icon: <Users className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onClose();
        router.push("/stats");
      },
    },
    {
      id: "toggle-sound",
      titleEn: soundFx.getIsMuted() ? "Unmute Sound Effects" : "Mute Sound Effects",
      titleAr: soundFx.getIsMuted() ? "تفعيل الأصوات" : "كتم الأصوات",
      category: "settings",
      icon: soundFx.getIsMuted() ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />,
      action: () => {
        soundFx.toggleMute();
        onClose();
      },
    },
    {
      id: "toggle-theme",
      titleEn: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      titleAr: theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن",
      category: "settings",
      icon: theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  const filteredItems = items.filter((item) => {
    const title = isAr ? item.titleAr : item.titleEn;
    return title.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl glass-card rounded-3xl border border-slate-800 bg-slate-900/95 text-slate-100 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Search Input Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? "ابحث عن صفحة، إعداد، أو إجراء سريّ... (Ctrl+K)" : "Search pages, actions, settings... (Ctrl+K)"}
              className="w-full bg-transparent text-sm font-bold text-white placeholder-slate-500 focus:outline-none"
            />
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                {isAr ? "لم يتم العثور على نتائج" : "No commands found"}
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFx.playClick();
                    item.action();
                  }}
                  className="w-full p-3 rounded-2xl flex items-center justify-between hover:bg-slate-800/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-slate-700">
                      {item.icon}
                    </div>
                    <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPaletteModal;
