import React from "react";
import XpSkillTree from "@/components/gamification/XpSkillTree";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "XP Playstyle Skill Tree | 11Players Hagoozat Elite",
  description: "Gamification & XP skill tree component with unlockable playstyle badges and multi-tier badge ranks.",
};

export default function SkillTreePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <XpSkillTree />
    </div>
  );
}
