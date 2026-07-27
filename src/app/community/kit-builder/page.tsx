import React from "react";
import KitBadgeBuilder from "@/components/builder/KitBadgeBuilder";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kit & Crest Builder | 11Players Hagoozat Elite",
  description: "Canvas-based kit & crest designer interface for custom team jerseys and community badges.",
};

export default function KitBuilderPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <KitBadgeBuilder />
    </div>
  );
}
