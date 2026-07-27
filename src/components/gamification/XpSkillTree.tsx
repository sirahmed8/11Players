"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Zap, Shield, Target, Activity, Flame, Lock, CheckCircle2, ChevronRight, Sparkles, Star } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import toast from "react-hot-toast";

export type BadgeRank = "Bronze" | "Silver" | "Gold" | "Diamond" | "Locked";

export interface SkillNodeDefinition {
  id: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  category: "Attack" | "Midfield" | "Defense" | "Physical" | "Goalkeeper";
  iconName: "Target" | "Activity" | "Shield" | "Sparkles" | "Zap" | "Flame";
  requirements: {
    minXp: number;
    statKey?: string;
    minValue?: number;
    matchesMin?: number;
  };
  rankThresholds: {
    Bronze: number;
    Silver: number;
    Gold: number;
    Diamond: number;
  };
}

export interface PlayerStatsAndAttributes {
  matchesPlayed: number;
  goals: number;
  assists: number;
  mvp: number;
  attributes: {
    finishing?: number;
    stamina?: number;
    defensiveAwareness?: number;
    lowPass?: number;
    speed?: number;
    gkReflexes?: number;
  };
}

export const DEFAULT_SKILL_NODES: SkillNodeDefinition[] = [
  {
    id: "sniper",
    name: { en: "Sniper", ar: "القناص" },
    description: {
      en: "Deadly finishing accuracy and powerful long-range strike ability.",
      ar: "إنهاء حاسم ودقة عالية في التسديدات البعيدة والقوية.",
    },
    category: "Attack",
    iconName: "Target",
    requirements: { minXp: 500, statKey: "finishing", minValue: 75 },
    rankThresholds: { Bronze: 500, Silver: 1200, Gold: 2500, Diamond: 5000 },
  },
  {
    id: "engine",
    name: { en: "The Engine", ar: "محرك الفريق" },
    description: {
      en: "Unstoppable stamina, box-to-box coverage, and unrelenting work rate.",
      ar: "طاقة لا تنضب، تغطية شاملة للملعب ومعدل عمل خيالي.",
    },
    category: "Physical",
    iconName: "Activity",
    requirements: { minXp: 400, statKey: "stamina", minValue: 78 },
    rankThresholds: { Bronze: 400, Silver: 1000, Gold: 2000, Diamond: 4500 },
  },
  {
    id: "brick_wall",
    name: { en: "Brick Wall", ar: "السد المنيع" },
    description: {
      en: "Impenetrable defensive positioning and dominant tackling authority.",
      ar: "تمركُز دفاعي قوي وافتكاك للكرات بصورة حاسمة.",
    },
    category: "Defense",
    iconName: "Shield",
    requirements: { minXp: 450, statKey: "defensiveAwareness", minValue: 75 },
    rankThresholds: { Bronze: 450, Silver: 1100, Gold: 2200, Diamond: 4800 },
  },
  {
    id: "playmaker",
    name: { en: "Playmaker", ar: "صانع الألعاب" },
    description: {
      en: "Visionary key passing, assist mastery, and game tempo control.",
      ar: "رؤية ثاقبة للملعب، تمريرات حاسمة والتحكم برتم المباراة.",
    },
    category: "Midfield",
    iconName: "Sparkles",
    requirements: { minXp: 600, statKey: "lowPass", minValue: 76 },
    rankThresholds: { Bronze: 600, Silver: 1300, Gold: 2600, Diamond: 5200 },
  },
  {
    id: "speed_demon",
    name: { en: "Speed Demon", ar: "نفاثة الملعب" },
    description: {
      en: "Explosive acceleration and rapid wing sprint velocity.",
      ar: "تسارع انفجاري وسرعة فائقة في انطلاقات الأطراف.",
    },
    category: "Physical",
    iconName: "Zap",
    requirements: { minXp: 350, statKey: "speed", minValue: 80 },
    rankThresholds: { Bronze: 350, Silver: 900, Gold: 1800, Diamond: 4000 },
  },
  {
    id: "safe_hands",
    name: { en: "Safe Hands", ar: "القفاز الذهبي" },
    description: {
      en: "Cat-like goalkeeper reflexes, clean sheet dominance, and aerial saves.",
      ar: "ردود فعل حارسة خارقة والتصدي للكرات الخطرة.",
    },
    category: "Goalkeeper",
    iconName: "Flame",
    requirements: { minXp: 300, statKey: "gkReflexes", minValue: 72 },
    rankThresholds: { Bronze: 300, Silver: 800, Gold: 1600, Diamond: 3600 },
  },
];

/**
 * Calculates total player XP based on matches and achievements.
 */
export function calculateTotalPlayerXp(
  matchesPlayed: number,
  goals: number,
  assists: number,
  mvps: number,
  cleanSheets: number = 0
): number {
  const matchXp = matchesPlayed * 50;
  const goalXp = goals * 100;
  const assistXp = assists * 75;
  const mvpXp = mvps * 200;
  const cleanSheetXp = cleanSheets * 120;
  return matchXp + goalXp + assistXp + mvpXp + cleanSheetXp;
}

/**
 * Evaluates unlock status and rank for a given skill tree node.
 */
export function evaluateBadgeUnlockStatus(
  badgeId: string,
  playerStats: PlayerStatsAndAttributes,
  userXp: number
): {
  unlocked: boolean;
  currentRank: BadgeRank;
  nextRequirementText: string;
  progressPercent: number;
} {
  const node = DEFAULT_SKILL_NODES.find((n) => n.id === badgeId);
  if (!node) {
    return { unlocked: false, currentRank: "Locked", nextRequirementText: "Unknown Node", progressPercent: 0 };
  }

  // Check stat requirement if present
  let statReqMet = true;
  if (node.requirements.statKey && node.requirements.minValue) {
    const val = (playerStats.attributes as any)[node.requirements.statKey] || 0;
    if (val < node.requirements.minValue) {
      statReqMet = false;
    }
  }

  const xpReqMet = userXp >= node.requirements.minXp;
  const unlocked = statReqMet && xpReqMet;

  if (!unlocked) {
    const progress = Math.min(100, Math.round((userXp / node.requirements.minXp) * 100));
    const statText = node.requirements.statKey ? ` & ${node.requirements.statKey} >= ${node.requirements.minValue}` : "";
    return {
      unlocked: false,
      currentRank: "Locked",
      nextRequirementText: `Requires ${node.requirements.minXp} XP${statText}`,
      progressPercent: progress,
    };
  }

  // Determine Rank
  let currentRank: BadgeRank = "Bronze";
  let targetXp = node.rankThresholds.Silver;

  if (userXp >= node.rankThresholds.Diamond) {
    currentRank = "Diamond";
    targetXp = node.rankThresholds.Diamond;
  } else if (userXp >= node.rankThresholds.Gold) {
    currentRank = "Gold";
    targetXp = node.rankThresholds.Diamond;
  } else if (userXp >= node.rankThresholds.Silver) {
    currentRank = "Silver";
    targetXp = node.rankThresholds.Gold;
  } else {
    currentRank = "Bronze";
    targetXp = node.rankThresholds.Silver;
  }

  const progressPercent =
    currentRank === "Diamond"
      ? 100
      : Math.min(100, Math.round((userXp / targetXp) * 100));

  return {
    unlocked: true,
    currentRank,
    nextRequirementText: currentRank === "Diamond" ? "MAX RANK REACHED!" : `Next Rank at ${targetXp} XP`,
    progressPercent,
  };
}

export function getSkillTreeNodes(): SkillNodeDefinition[] {
  return DEFAULT_SKILL_NODES;
}

export default function XpSkillTree() {
  const { user } = useAuth();
  const { userProfile: profile } = useAuthProfile(user);
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const playerStats: PlayerStatsAndAttributes = {
    matchesPlayed: profile?.stats?.matchesPlayed || profile?.stats?.matchesCount || 0,
    goals: profile?.stats?.goals || 0,
    assists: profile?.stats?.assists || 0,
    mvp: profile?.stats?.mvps || profile?.stats?.manOfTheMatch || 0,
    attributes: {
      finishing: profile?.attributes?.finishing || 70,
      stamina: profile?.attributes?.stamina || 70,
      defensiveAwareness: profile?.attributes?.defensiveAwareness || 70,
      lowPass: profile?.attributes?.lowPass || 70,
      speed: profile?.attributes?.speed || 70,
      gkReflexes: profile?.attributes?.gkReflexes || 70,
    },
  };

  const totalXp = calculateTotalPlayerXp(
    playerStats.matchesPlayed,
    playerStats.goals,
    playerStats.assists,
    playerStats.mvp
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string>("sniper");
  const [unlockedEffect, setUnlockedEffect] = useState<string | null>(null);

  const selectedNode = DEFAULT_SKILL_NODES.find((n) => n.id === selectedNodeId) || DEFAULT_SKILL_NODES[0];
  const selectedEval = evaluateBadgeUnlockStatus(selectedNode.id, playerStats, totalXp);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const ev = evaluateBadgeUnlockStatus(nodeId, playerStats, totalXp);
    if (ev.unlocked) {
      setUnlockedEffect(nodeId);
      setTimeout(() => setUnlockedEffect(null), 1200);
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case "Target":
        return <Target className="w-6 h-6" />;
      case "Activity":
        return <Activity className="w-6 h-6" />;
      case "Shield":
        return <Shield className="w-6 h-6" />;
      case "Sparkles":
        return <Sparkles className="w-6 h-6" />;
      case "Zap":
        return <Zap className="w-6 h-6" />;
      case "Flame":
      default:
        return <Flame className="w-6 h-6" />;
    }
  };

  const getRankBadgeClass = (rank: BadgeRank) => {
    switch (rank) {
      case "Diamond":
        return "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.5)]";
      case "Gold":
        return "bg-amber-950 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
      case "Silver":
        return "bg-slate-800 border-slate-400 text-slate-100 shadow-[0_0_10px_rgba(203,213,225,0.4)]";
      case "Bronze":
        return "bg-amber-900/60 border-amber-600 text-amber-300";
      case "Locked":
      default:
        return "bg-slate-950 border-slate-800 text-slate-500 opacity-60";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-400" />
            {isAr ? "شجرة المهارات والأوسمة (XP Skill Tree)" : "XP Playstyle Skill Tree"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr
              ? "افتح أوسمة أسلوب اللعب وارتقِ برتبتك من البرونزي إلى الماسي بزيادة نقاط الخبرة والأداء."
              : "Unlock playstyle badges, gain XP through matches & stats, and promote rank tiers."}
          </p>
        </div>

        {/* Total XP Counter */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-400/40 p-4 rounded-2xl flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          <div>
            <div className="text-xs font-semibold text-amber-300 uppercase">{isAr ? "نقاط الخبرة الحالية" : "Total Player XP"}</div>
            <div className="text-2xl font-black text-white font-mono">{totalXp.toLocaleString()} XP</div>
          </div>
        </div>
      </div>

      {/* Skill Tree Nodes Grid & Details Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Grid: Skill Tree Nodes Graph */}
        <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md space-y-6 relative overflow-hidden">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            {isAr ? "خريطة الأوسمة المتاحة" : "Skill Badge Matrix"}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {DEFAULT_SKILL_NODES.map((node) => {
              const status = evaluateBadgeUnlockStatus(node.id, playerStats, totalXp);
              const isSelected = node.id === selectedNodeId;

              return (
                <motion.div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${
                    isSelected ? "ring-2 ring-amber-400 shadow-xl" : ""
                  } ${getRankBadgeClass(status.currentRank)}`}
                >
                  {/* Framer Motion Unlock Particle Burst */}
                  {unlockedEffect === node.id && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 rounded-2xl bg-amber-400/40 pointer-events-none z-20"
                    />
                  )}

                  <div className={`p-3 rounded-full border shadow-inner ${status.unlocked ? "bg-amber-400/20 border-amber-300 text-amber-300" : "bg-slate-900 border-slate-800 text-slate-600"}`}>
                    {status.unlocked ? renderIcon(node.iconName) : <Lock className="w-6 h-6 text-slate-500" />}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{node.name[isAr ? "ar" : "en"]}</h3>
                    <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">{node.category}</span>
                  </div>

                  {/* Rank Tag */}
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${status.unlocked ? "bg-black/40 border-amber-400/40 text-amber-300" : "bg-slate-900 border-slate-800 text-slate-600"}`}>
                    {status.currentRank}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Details Panel: Inspector */}
        <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
                  {renderIcon(selectedNode.iconName)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedNode.name[isAr ? "ar" : "en"]}</h3>
                  <span className="text-xs text-amber-400 font-semibold">{selectedNode.category} Playstyle</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getRankBadgeClass(selectedEval.currentRank)}`}>
                {selectedEval.currentRank}
              </span>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">{selectedNode.description[isAr ? "ar" : "en"]}</p>

            {/* Unlock Requirements Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">{isAr ? "متطلبات الفتح والرتبة" : "Unlock & Rank Requirements"}</span>
              <div className="flex justify-between text-slate-200 font-mono">
                <span>Min XP Required:</span>
                <span className="text-amber-400 font-bold">{selectedNode.requirements.minXp} XP</span>
              </div>
              {selectedNode.requirements.statKey && (
                <div className="flex justify-between text-slate-200 font-mono">
                  <span>Required Attribute ({selectedNode.requirements.statKey}):</span>
                  <span className="text-amber-400 font-bold">&gt;= {selectedNode.requirements.minValue}</span>
                </div>
              )}
            </div>

            {/* XP Progress Bar towards next rank */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">{selectedEval.nextRequirementText}</span>
                <span className="text-amber-400 font-mono">{selectedEval.progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${selectedEval.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action unlock notification */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{isAr ? "حالة الوسام:" : "Badge Status:"}</span>
            {selectedEval.unlocked ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {isAr ? "مفتوح وجاهز" : "Unlocked & Active"}
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Lock className="w-4 h-4" /> {isAr ? "مغلق (تحتاج مزيد من XP)" : "Locked (More XP Needed)"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
