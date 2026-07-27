import React from "react";
import DerbyRivalryEngine from "@/components/derby/DerbyRivalryEngine";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Derby & Captain Rivalry H2H | 11Players Hagoozat Elite",
  description: "Head-to-head stats tracker for captain rivalries and community derbies with rivalry intensity scores.",
};

export default function DerbyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <DerbyRivalryEngine />
    </div>
  );
}
