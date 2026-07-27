"use client";

import React, { useState } from "react";
import { Swords, Trophy, Flame, TrendingUp, Calendar, Zap, Shield, Users, Award } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";

export interface MatchRecord {
  id: string;
  date: string;
  teamAName: string;
  teamBName: string;
  captainAUid: string;
  captainBUid: string;
  scoreA: number;
  scoreB: number;
  yellowCards?: number;
  redCards?: number;
  venue?: string;
}

export interface HeadToHeadStats {
  captainAName: string;
  captainBName: string;
  totalMatches: number;
  winsA: number;
  winsB: number;
  draws: number;
  goalsA: number;
  goalsB: number;
  goalDiffA: number;
  goalDiffB: number;
  winRateA: number;
  winRateB: number;
  totalCards: number;
}

export const SAMPLE_DERBY_MATCHES: MatchRecord[] = [
  {
    id: "m1",
    date: "2026-07-20",
    teamAName: "Red Lions FC (Capt. Ahmed)",
    teamBName: "Blue Falcons (Capt. Tariq)",
    captainAUid: "capt_ahmed",
    captainBUid: "capt_tariq",
    scoreA: 3,
    scoreB: 2,
    yellowCards: 3,
    redCards: 0,
    venue: "Al-Malaz Pitch A",
  },
  {
    id: "m2",
    date: "2026-07-12",
    teamAName: "Red Lions FC (Capt. Ahmed)",
    teamBName: "Blue Falcons (Capt. Tariq)",
    captainAUid: "capt_ahmed",
    captainBUid: "capt_tariq",
    scoreA: 1,
    scoreB: 1,
    yellowCards: 2,
    redCards: 0,
    venue: "Al-Hamra Turf",
  },
  {
    id: "m3",
    date: "2026-07-05",
    teamAName: "Red Lions FC (Capt. Ahmed)",
    teamBName: "Blue Falcons (Capt. Tariq)",
    captainAUid: "capt_ahmed",
    captainBUid: "capt_tariq",
    scoreA: 4,
    scoreB: 1,
    yellowCards: 4,
    redCards: 1,
    venue: "Prince Faisal Stadium",
  },
  {
    id: "m4",
    date: "2026-06-28",
    teamAName: "Red Lions FC (Capt. Ahmed)",
    teamBName: "Blue Falcons (Capt. Tariq)",
    captainAUid: "capt_ahmed",
    captainBUid: "capt_tariq",
    scoreA: 2,
    scoreB: 3,
    yellowCards: 1,
    redCards: 0,
    venue: "Al-Malaz Pitch B",
  },
  {
    id: "m5",
    date: "2026-06-21",
    teamAName: "Red Lions FC (Capt. Ahmed)",
    teamBName: "Blue Falcons (Capt. Tariq)",
    captainAUid: "capt_ahmed",
    captainBUid: "capt_tariq",
    scoreA: 2,
    scoreB: 2,
    yellowCards: 2,
    redCards: 0,
    venue: "Al-Yasmin Turf",
  },
];

/**
 * Aggregates Head-to-Head stats between two captains.
 */
export function aggregateHeadToHeadStats(
  matches: MatchRecord[],
  captainAUid: string = "capt_ahmed",
  captainBUid: string = "capt_tariq"
): HeadToHeadStats {
  const filtered = matches.filter(
    (m) =>
      (m.captainAUid === captainAUid && m.captainBUid === captainBUid) ||
      (m.captainAUid === captainBUid && m.captainBUid === captainAUid)
  );

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let goalsA = 0;
  let goalsB = 0;
  let totalCards = 0;

  filtered.forEach((m) => {
    const isAFirst = m.captainAUid === captainAUid;
    const scoreA = isAFirst ? m.scoreA : m.scoreB;
    const scoreB = isAFirst ? m.scoreB : m.scoreA;

    goalsA += scoreA;
    goalsB += scoreB;
    totalCards += (m.yellowCards || 0) + (m.redCards || 0) * 2;

    if (scoreA > scoreB) winsA++;
    else if (scoreB > scoreA) winsB++;
    else draws++;
  });

  const totalMatches = filtered.length;
  const winRateA = totalMatches > 0 ? Number(((winsA / totalMatches) * 100).toFixed(1)) : 0;
  const winRateB = totalMatches > 0 ? Number(((winsB / totalMatches) * 100).toFixed(1)) : 0;

  return {
    captainAName: "Capt. Ahmed",
    captainBName: "Capt. Tariq",
    totalMatches,
    winsA,
    winsB,
    draws,
    goalsA,
    goalsB,
    goalDiffA: goalsA - goalsB,
    goalDiffB: goalsB - goalsA,
    winRateA,
    winRateB,
    totalCards,
  };
}

/**
 * Calculates current win streak for Captain A or B.
 */
export function calculateCurrentStreak(
  matches: MatchRecord[],
  captainAUid: string = "capt_ahmed"
): { winner: "A" | "B" | "DRAW"; count: number; streakText: string } {
  if (!matches || matches.length === 0) {
    return { winner: "DRAW", count: 0, streakText: "No matches recorded" };
  }

  // Sort matches by date descending
  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const first = sorted[0];
  const isAFirst = first.captainAUid === captainAUid;
  const scoreA = isAFirst ? first.scoreA : first.scoreB;
  const scoreB = isAFirst ? first.scoreB : first.scoreA;

  let currentWinner: "A" | "B" | "DRAW" = "DRAW";
  if (scoreA > scoreB) currentWinner = "A";
  else if (scoreB > scoreA) currentWinner = "B";
  else currentWinner = "DRAW";

  let streak = 0;
  for (const m of sorted) {
    const isA = m.captainAUid === captainAUid;
    const sA = isA ? m.scoreA : m.scoreB;
    const sB = isA ? m.scoreB : m.scoreA;

    let w: "A" | "B" | "DRAW" = "DRAW";
    if (sA > sB) w = "A";
    else if (sB > sA) w = "B";

    if (w === currentWinner) {
      streak++;
    } else {
      break;
    }
  }

  const name = currentWinner === "A" ? "Capt. Ahmed" : currentWinner === "B" ? "Capt. Tariq" : "Draw";
  const streakText = currentWinner === "DRAW" ? "Undecided / Draw" : `${name} (${streak} W Streak)`;

  return { winner: currentWinner, count: streak, streakText };
}

/**
 * Computes 0-100 Rivalry Intensity Score.
 */
export function calculateRivalryIntensityScore(stats: HeadToHeadStats): {
  score: number;
  label: string;
  level: "WARM" | "HEAT" | "FIERCE" | "EL CLASICO";
} {
  if (stats.totalMatches === 0) {
    return { score: 0, label: "Friendly Warmup", level: "WARM" };
  }

  // 1. Matches factor (max 30 pts)
  const matchesFactor = Math.min(30, stats.totalMatches * 6);

  // 2. Goal closeness factor (max 30 pts): the smaller the goal diff percentage, the higher the score
  const totalGoals = stats.goalsA + stats.goalsB;
  const goalDiffRatio = totalGoals > 0 ? Math.abs(stats.goalsA - stats.goalsB) / totalGoals : 0;
  const closenessFactor = Math.round((1 - goalDiffRatio) * 30);

  // 3. Card/Foul intensity factor (max 20 pts)
  const cardsFactor = Math.min(20, stats.totalCards * 3);

  // 4. Win balance factor (max 20 pts)
  const winDiff = Math.abs(stats.winsA - stats.winsB);
  const winBalanceFactor = Math.max(0, 20 - winDiff * 5);

  const rawScore = matchesFactor + closenessFactor + cardsFactor + winBalanceFactor;
  const score = Math.min(100, Math.max(10, Math.round(rawScore)));

  let label = "Local Derby";
  let level: "WARM" | "HEAT" | "FIERCE" | "EL CLASICO" = "WARM";

  if (score >= 85) {
    label = "EL CLASICO RIVALRY";
    level = "EL CLASICO";
  } else if (score >= 65) {
    label = "FIERCE CITY DERBY";
    level = "FIERCE";
  } else if (score >= 40) {
    label = "HIGH HEAT RIVALRY";
    level = "HEAT";
  } else {
    label = "WARM COMPETITION";
    level = "WARM";
  }

  return { score, label, level };
}

export default function DerbyRivalryEngine() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [matches] = useState<MatchRecord[]>(SAMPLE_DERBY_MATCHES);

  const stats = aggregateHeadToHeadStats(matches);
  const streak = calculateCurrentStreak(matches);
  const intensity = calculateRivalryIntensityScore(stats);

  const getIntensityColor = (level: string) => {
    switch (level) {
      case "EL CLASICO":
        return "from-rose-500 via-amber-500 to-red-600 text-rose-300 border-rose-500/50";
      case "FIERCE":
        return "from-amber-500 to-orange-600 text-amber-300 border-amber-500/50";
      case "HEAT":
        return "from-teal-500 to-emerald-600 text-emerald-300 border-teal-500/50";
      default:
        return "from-slate-700 to-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-rose-500 animate-pulse" />
            {isAr ? "محرك المواجهات المباشرة والديربي" : "Derby Rivalry H2H Engine"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr
              ? "تتبع المواجهات المباشرة بين الكباتن والأندية، وحلّل الفوز وسلسلة الانتصارات ومؤشر حدة التنافس."
              : "Track head-to-head captain rivalries, win rates, goal differences, and rivalry intensity scores."}
          </p>
        </div>

        {/* Rivalry Intensity Score Badge */}
        <div className={`p-4 rounded-2xl border bg-gradient-to-r ${getIntensityColor(intensity.level)} backdrop-blur-md flex items-center gap-4 shadow-xl`}>
          <Flame className="w-10 h-10 text-rose-500 animate-bounce" />
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">{intensity.label}</div>
            <div className="text-2xl font-black text-white font-mono">{intensity.score} / 100</div>
          </div>
        </div>
      </div>

      {/* Head to Head Main Showdown Card */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Captain A */}
          <div className="md:col-span-5 bg-slate-950/80 p-6 rounded-2xl border border-rose-500/30 flex flex-col items-center text-center space-y-2 shadow-lg">
            <div className="w-20 h-20 rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-3xl font-black text-rose-400 font-mono shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              A
            </div>
            <h2 className="text-xl font-extrabold text-white">{stats.captainAName}</h2>
            <span className="text-xs text-rose-400 font-semibold bg-rose-950/60 px-3 py-1 rounded-full border border-rose-500/30">
              Red Lions FC
            </span>

            <div className="pt-3 w-full grid grid-cols-3 gap-2 text-center border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? "انتصارات" : "Wins"}</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{stats.winsA}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? "الأهداف" : "Goals"}</span>
                <span className="text-lg font-black text-white font-mono">{stats.goalsA}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? "نسبة الفوز" : "Win Rate"}</span>
                <span className="text-lg font-black text-rose-400 font-mono">{stats.winRateA}%</span>
              </div>
            </div>
          </div>

          {/* VS Center Pillar */}
          <div className="md:col-span-2 flex flex-col items-center justify-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-cyan-500 p-0.5 shadow-2xl">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-xl font-black text-white font-mono">
                VS
              </div>
            </div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stats.totalMatches} {isAr ? "مباريات" : "Matches"}</span>
            <span className="text-xs text-amber-400 font-semibold font-mono">{stats.draws} {isAr ? "تعادلات" : "Draws"}</span>
          </div>

          {/* Captain B */}
          <div className="md:col-span-5 bg-slate-950/80 p-6 rounded-2xl border border-cyan-500/30 flex flex-col items-center text-center space-y-2 shadow-lg">
            <div className="w-20 h-20 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-3xl font-black text-cyan-400 font-mono shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              B
            </div>
            <h2 className="text-xl font-extrabold text-white">{stats.captainBName}</h2>
            <span className="text-xs text-cyan-400 font-semibold bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
              Blue Falcons FC
            </span>

            <div className="pt-3 w-full grid grid-cols-3 gap-2 text-center border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? "انتصارات" : "Wins"}</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{stats.winsB}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? "الأهداف" : "Goals"}</span>
                <span className="text-lg font-black text-white font-mono">{stats.goalsB}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? "نسبة الفوز" : "Win Rate"}</span>
                <span className="text-lg font-black text-cyan-400 font-mono">{stats.winRateB}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Win Rate Progress Meter Comparison Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-rose-400 font-mono">{stats.captainAName} ({stats.winRateA}%)</span>
            <span className="text-slate-400 uppercase tracking-wider">{isAr ? "مقارنة السيطرة والانتصارات" : "Dominance Comparison"}</span>
            <span className="text-cyan-400 font-mono">{stats.captainBName} ({stats.winRateB}%)</span>
          </div>

          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
            <div
              className="h-full bg-rose-500 rounded-l-full transition-all duration-500"
              style={{ width: `${stats.winRateA}%` }}
            />
            <div
              className="h-full bg-slate-700 transition-all duration-500"
              style={{ width: `${(stats.draws / (stats.totalMatches || 1)) * 100}%` }}
            />
            <div
              className="h-full bg-cyan-400 rounded-r-full transition-all duration-500"
              style={{ width: `${stats.winRateB}%` }}
            />
          </div>
        </div>

        {/* Streak Tracker & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            <div>
              <span className="text-xs text-slate-400 font-medium block">{isAr ? "سلسلة الانتصارات الحالية" : "Current Active Streak"}</span>
              <span className="text-sm font-black text-white font-mono">{streak.streakText}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-emerald-400" />
            <div>
              <span className="text-xs text-slate-400 font-medium block">{isAr ? "فارق الأهداف الإجمالي" : "Goal Difference"}</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                +{stats.goalDiffA} (A) / {stats.goalDiffB} (B)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Zap className="w-6 h-6 text-rose-400" />
            <div>
              <span className="text-xs text-slate-400 font-medium block">{isAr ? "البطاقات الملونة بالمواجهات" : "Total Match Cards"}</span>
              <span className="text-sm font-black text-rose-400 font-mono">{stats.totalCards} Cards</span>
            </div>
          </div>
        </div>
      </div>

      {/* Match History Timeline */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          {isAr ? "سجل المباريات التاريخية للديربي" : "Derby Match History Timeline"}
        </h2>

        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  {m.date}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{m.venue}</span>
              </div>

              <div className="flex items-center gap-4 text-sm font-bold">
                <span className={m.scoreA > m.scoreB ? "text-emerald-400" : "text-slate-300"}>
                  {m.teamAName}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-amber-400 font-mono text-base border border-slate-800">
                  {m.scoreA} - {m.scoreB}
                </span>
                <span className={m.scoreB > m.scoreA ? "text-emerald-400" : "text-slate-300"}>
                  {m.teamBName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
