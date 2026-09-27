import React from "react";
import PitchSplitBillCalculator from "@/components/billing/PitchSplitBillCalculator";
import MatchActionHubBar from "@/components/match/MatchActionHubBar";
import ProGate from "@/components/ui/ProGate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch Rent Split Bill | 11Players",
  description: "Pitch rent split-bill calculator with multi-currency conversion, payment status tracker, and shareable summaries.",
};

export default function SplitBillPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto mb-6">
        <MatchActionHubBar />
      </div>
      <ProGate
        requiredPlan="club_organizer"
        featureNameEn="Turf Rent Split-Bill Calculator"
        featureNameAr="حاسبة تقاسم حجز الملعب والمصروفات"
      >
        <PitchSplitBillCalculator />
      </ProGate>
    </div>
  );
}

