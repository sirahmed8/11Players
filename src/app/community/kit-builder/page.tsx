import React from "react";
import KitBadgeBuilder from "@/components/builder/KitBadgeBuilder";
import ProGate from "@/components/ui/ProGate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kit & Crest Builder | 11Players",
  description: "Canvas-based kit & crest designer interface for custom team jerseys and community badges. PRO Captain feature.",
};

export default function KitBuilderPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <ProGate
        requiredPlan="pro_captain"
        featureNameEn="3D Kit & Crest Builder Studio"
        featureNameAr="استوديو مصمم الأطقم والشعارات 3D"
      >
        <KitBadgeBuilder />
      </ProGate>
    </div>
  );
}
