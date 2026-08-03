"use client";

import React from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Shield, Medal, Award } from "lucide-react";
import { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";

// ─── Tier definitions (OVR thresholds only; counts are computed from real data) ──
interface TierDef {
  id: string;
  nameEn: string;
  nameAr: string;
  minOvr: number;
  maxOvr: number;
  badgeColor: string;
  glowColor: string;
  barColor: string;
  icon: React.ReactNode;
}

export const TIER_DEFS: TierDef[] = [
  {
    id: "champions",
    nameEn: "Champions League",
    nameAr: "دوري الأبطال",
    minOvr: 88,
    maxOvr: 99,
    badgeColor: "from-amber-500 to-yellow-300",
    glowColor: "shadow-amber-500/20",
    barColor: "from-amber-500 to-yellow-300",
    icon: <Crown className="w-5 h-5 text-amber-950" />,
  },
  {
    id: "master",
    nameEn: "Master Division",
    nameAr: "قسم الماستر",
    minOvr: 82,
    maxOvr: 87,
    badgeColor: "from-purple-600 to-violet-400",
    glowColor: "shadow-purple-500/20",
    barColor: "from-purple-600 to-violet-400",
    icon: <Sparkles className="w-5 h-5 text-purple-100" />,
  },
  {
    id: "premier",
    nameEn: "Premier Tier",
    nameAr: "الدرجة الممتازة",
    minOvr: 75,
    maxOvr: 81,
    badgeColor: "from-emerald-600 to-teal-400",
    glowColor: "shadow-emerald-500/20",
    barColor: "from-emerald-600 to-teal-400",
    icon: <Medal className="w-5 h-5 text-emerald-100" />,
  },
  {
    id: "challenge",
    nameEn: "Challenge League",
    nameAr: "دوري التحدي",
    minOvr: 0,
    maxOvr: 74,
    badgeColor: "from-slate-700 to-slate-500",
    glowColor: "shadow-slate-500/20",
    barColor: "from-slate-600 to-slate-400",
    icon: <Shield className="w-5 h-5 text-slate-200" />,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface LeagueTiersWidgetProps {
  players: PlayerProfile[];
  isAr?: boolean;
}

export const LeagueTiersWidget: React.FC<LeagueTiersWidgetProps> = ({
  players,
  isAr = false,
}) => {
  // Compute real member counts per tier from actual player OVR values
  const tierCounts = React.useMemo(() => {
    const counts: Record<string, PlayerProfile[]> = {
      champions: [],
      master: [],
      premier: [],
      challenge: [],
    };
    for (const p of players) {
      const ovr = getPlayerOverall(p);
      if (ovr >= 88) counts.champions.push(p);
      else if (ovr >= 82) counts.master.push(p);
      else if (ovr >= 75) counts.premier.push(p);
      else counts.challenge.push(p);
    }
    return counts;
  }, [players]);

  const totalPlayers = players.length;

  return (
    <div className="w-full glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              {isAr ? "أقسام التصنيف التنافسي" : "Competitive Division Tiers"}
            </h3>
            <p className="text-slate-400 text-xs">
              {isAr
                ? `${totalPlayers} لاعب مصنّف حسب تقييم OVR الفعلي`
                : `${totalPlayers} player${totalPlayers !== 1 ? "s" : ""} ranked by real OVR rating`}
            </p>
          </div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIER_DEFS.map((tier) => {
          const members = tierCounts[tier.id] ?? [];
          const count = members.length;
          const pct = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;

          return (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.03, y: -2 }}
              className={`p-4 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 shadow-lg ${tier.glowColor} transition-all space-y-3 cursor-pointer`}
            >
              {/* Icon + OVR badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-tr ${tier.badgeColor} shadow-md`}
                >
                  {tier.icon}
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  OVR {tier.minOvr}
                  {tier.maxOvr < 99 ? `–${tier.maxOvr}` : "+"}
                </span>
              </div>

              {/* Tier name + real count */}
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  {isAr ? tier.nameAr : tier.nameEn}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {count === 0
                    ? isAr
                      ? "لا يوجد لاعبون"
                      : "No players yet"
                    : isAr
                    ? `${count} لاعب نشط`
                    : `${count} Active Player${count !== 1 ? "s" : ""}`}
                </p>
              </div>

              {/* Progress bar — % of total roster in this tier */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${tier.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>

              {/* Percentage label */}
              {totalPlayers > 0 && (
                <p className="text-[10px] text-slate-500 font-semibold text-right">
                  {Math.round(pct)}% {isAr ? "من الفريق" : "of roster"}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LeagueTiersWidget;
