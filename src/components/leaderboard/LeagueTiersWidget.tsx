"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Shield, Medal, Award, ChevronRight } from "lucide-react";
import { soundFx } from "@/lib/soundEffects";

export interface LeagueTier {
  id: string;
  name: string;
  minOvr: number;
  maxOvr: number;
  badgeColor: string;
  glowColor: string;
  icon: React.ReactNode;
  memberCount: number;
}

export const LEAGUE_TIERS: LeagueTier[] = [
  {
    id: "champions",
    name: "Champions League",
    minOvr: 88,
    maxOvr: 99,
    badgeColor: "from-amber-500 to-yellow-300 text-slate-950 border-amber-300",
    glowColor: "shadow-amber-500/20",
    icon: <Crown className="w-5 h-5 text-amber-950" />,
    memberCount: 8,
  },
  {
    id: "master",
    name: "Master Division",
    minOvr: 82,
    maxOvr: 87,
    badgeColor: "from-purple-600 to-violet-400 text-white border-purple-300",
    glowColor: "shadow-purple-500/20",
    icon: <Sparkles className="w-5 h-5 text-purple-100" />,
    memberCount: 16,
  },
  {
    id: "premier",
    name: "Premier Tier",
    minOvr: 75,
    maxOvr: 81,
    badgeColor: "from-emerald-600 to-teal-400 text-white border-emerald-300",
    glowColor: "shadow-emerald-500/20",
    icon: <Medal className="w-5 h-5 text-emerald-100" />,
    memberCount: 24,
  },
  {
    id: "challenge",
    name: "Challenge League",
    minOvr: 0,
    maxOvr: 74,
    badgeColor: "from-slate-700 to-slate-500 text-white border-slate-400",
    glowColor: "shadow-slate-500/20",
    icon: <Shield className="w-5 h-5 text-slate-200" />,
    memberCount: 32,
  },
];

export const LeagueTiersWidget: React.FC = () => {
  return (
    <div className="w-full glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Competitive Division Tiers</h3>
            <p className="text-slate-400 text-xs">OVR rating threshold divisions & ranking tiers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LEAGUE_TIERS.map((tier) => (
          <motion.div
            key={tier.id}
            whileHover={{ scale: 1.03, y: -2 }}
            onClick={() => soundFx.playClick()}
            className={`p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 shadow-lg ${tier.glowColor} transition-all space-y-3 cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${tier.badgeColor} shadow-md`}>
                {tier.icon}
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                OVR {tier.minOvr} - {tier.maxOvr}
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-white">{tier.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{tier.memberCount} Active Players</p>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${tier.badgeColor}`}
                style={{ width: `${Math.min(100, (tier.memberCount / 40) * 100)}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LeagueTiersWidget;
