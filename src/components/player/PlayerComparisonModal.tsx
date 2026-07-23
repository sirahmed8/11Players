"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Zap, ArrowRightLeft, UserX } from "lucide-react";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ui/ThemeProvider";
import { getPlayerOverall } from "@/lib/playerUtils";
import FormIcon from "@/components/ui/FormIcon";
import { SKILLS } from "@/components/player/SkillsChecklist";

interface PlayerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayerA?: PlayerProfile | null;
  initialPlayerB?: PlayerProfile | null;
  allPlayers: PlayerProfile[];
}

// All 22 attributes with display names
const ALL_ATTRIBUTES: { key: string; nameEn: string; nameAr: string; groupEn: string; groupAr: string }[] = [
  // Offensive
  { key: "offensiveAwareness", nameEn: "Offensive Awareness", nameAr: "الوعي الهجومي",   groupEn: "Offensive", groupAr: "هجوم" },
  { key: "finishing",          nameEn: "Finishing",           nameAr: "الإنهاء",          groupEn: "Offensive", groupAr: "هجوم" },
  { key: "kickingPower",       nameEn: "Kicking Power",       nameAr: "قوة الركل",        groupEn: "Offensive", groupAr: "هجوم" },
  { key: "heading",            nameEn: "Heading",             nameAr: "الركلة الرأسية",   groupEn: "Offensive", groupAr: "هجوم" },
  // Technical
  { key: "ballControl",        nameEn: "Ball Control",        nameAr: "التحكم بالكرة",    groupEn: "Technical", groupAr: "تقني" },
  { key: "dribbling",          nameEn: "Dribbling",           nameAr: "المراوغة",         groupEn: "Technical", groupAr: "تقني" },
  { key: "lowPass",            nameEn: "Low Pass",            nameAr: "التمرير المنخفض",  groupEn: "Technical", groupAr: "تقني" },
  { key: "loftedPass",         nameEn: "Lofted Pass",         nameAr: "التمرير العالي",   groupEn: "Technical", groupAr: "تقني" },
  // Physical
  { key: "speed",              nameEn: "Speed",               nameAr: "السرعة",           groupEn: "Physical",  groupAr: "بدني" },
  { key: "acceleration",       nameEn: "Acceleration",        nameAr: "التسارع",          groupEn: "Physical",  groupAr: "بدني" },
  { key: "jump",               nameEn: "Jump",                nameAr: "الوثب",            groupEn: "Physical",  groupAr: "بدني" },
  { key: "physicalContact",    nameEn: "Physical Contact",    nameAr: "التلاقي البدني",   groupEn: "Physical",  groupAr: "بدني" },
  { key: "balance",            nameEn: "Balance",             nameAr: "الاتزان",          groupEn: "Physical",  groupAr: "بدني" },
  { key: "stamina",            nameEn: "Stamina",             nameAr: "التحمل",           groupEn: "Physical",  groupAr: "بدني" },
  // Defensive
  { key: "defensiveAwareness", nameEn: "Defensive Awareness", nameAr: "الوعي الدفاعي",   groupEn: "Defensive", groupAr: "دفاع" },
  { key: "ballWinning",        nameEn: "Ball Winning",        nameAr: "استرداد الكرة",   groupEn: "Defensive", groupAr: "دفاع" },
  { key: "aggression",         nameEn: "Aggression",          nameAr: "العدوانية",        groupEn: "Defensive", groupAr: "دفاع" },
  // GK
  { key: "gkAwareness",        nameEn: "GK Awareness",        nameAr: "وعي حارس المرمى", groupEn: "Goalkeeper", groupAr: "حراسة" },
  { key: "gkCatching",         nameEn: "GK Catching",         nameAr: "مسك الكرة",       groupEn: "Goalkeeper", groupAr: "حراسة" },
  { key: "gkClearing",         nameEn: "GK Clearing",         nameAr: "إبعاد الكرة",     groupEn: "Goalkeeper", groupAr: "حراسة" },
  { key: "gkReflexes",         nameEn: "GK Reflexes",         nameAr: "ردود فعل الحارس", groupEn: "Goalkeeper", groupAr: "حراسة" },
  { key: "gkReach",            nameEn: "GK Reach",            nameAr: "مدى الحارس",      groupEn: "Goalkeeper", groupAr: "حراسة" },
];

const GROUP_ORDER = ["Offensive", "Technical", "Physical", "Defensive", "Goalkeeper"];

// Optimized player list row — no framer-motion, receives pre-computed ovr to avoid scroll lag
function PlayerListRow({ p, ovr, onClick }: { p: PlayerProfile; ovr: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors text-start"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 text-slate-700 dark:text-slate-200">
          {p.photoUrl ? (
            <Image src={p.photoUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            p.cardName?.charAt(0) || "?"
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">{p.cardName}</p>
          <p className="text-[10px] text-slate-500 leading-tight">{p.primaryPosition}</p>
        </div>
      </div>
      <span className="text-xs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-lg shrink-0 ml-2">{ovr}</span>
    </button>
  );
}

function getAttrValue(p: PlayerProfile | null, key: string): number {
  if (!p) return 0;
  const attrs = (p.approvedAttributes || p.attributes || {}) as any;
  const val = attrs[key];
  return typeof val === "number" ? val : 0;
}

export default function PlayerComparisonModal({
  isOpen,
  onClose,
  initialPlayerA,
  initialPlayerB,
  allPlayers = [],
}: PlayerComparisonModalProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [playerAId, setPlayerAId] = useState<string>(initialPlayerA?.uid || "");
  const [playerBId, setPlayerBId] = useState<string>(initialPlayerB?.uid || "");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [isSelectingA, setIsSelectingA] = useState(!initialPlayerA);
  const [isSelectingB, setIsSelectingB] = useState(!initialPlayerB);

  React.useEffect(() => {
    if (initialPlayerA) { setPlayerAId(initialPlayerA.uid); setIsSelectingA(false); }
    if (initialPlayerB) { setPlayerBId(initialPlayerB.uid); setIsSelectingB(false); }
  }, [initialPlayerA, initialPlayerB]);

  const ovrMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allPlayers) {
      map.set(p.uid, getPlayerOverall(p));
    }
    return map;
  }, [allPlayers]);

  const playerA = useMemo(() => allPlayers.find((p) => p.uid === playerAId) || null, [allPlayers, playerAId]);
  const playerB = useMemo(() => allPlayers.find((p) => p.uid === playerBId) || null, [allPlayers, playerBId]);

  const ovrA = ovrMap.get(playerAId) ?? 0;
  const ovrB = ovrMap.get(playerBId) ?? 0;

  const filteredForA = useMemo(() => {
    const q = searchA.toLowerCase().trim();
    return allPlayers
      .filter((p) => p.uid !== playerBId && (!q || p.cardName?.toLowerCase().includes(q) || p.fullName?.toLowerCase().includes(q)))
      .sort((a, b) => (ovrMap.get(b.uid) ?? 0) - (ovrMap.get(a.uid) ?? 0));
  }, [allPlayers, searchA, playerBId, ovrMap]);

  const filteredForB = useMemo(() => {
    const q = searchB.toLowerCase().trim();
    return allPlayers
      .filter((p) => p.uid !== playerAId && (!q || p.cardName?.toLowerCase().includes(q) || p.fullName?.toLowerCase().includes(q)))
      .sort((a, b) => (ovrMap.get(b.uid) ?? 0) - (ovrMap.get(a.uid) ?? 0));
  }, [allPlayers, searchB, playerAId, ovrMap]);

  const removeA = useCallback(() => { setPlayerAId(""); setIsSelectingA(true); setSearchA(""); }, []);
  const removeB = useCallback(() => { setPlayerBId(""); setIsSelectingB(true); setSearchB(""); }, []);

  const showComparison = playerA && playerB;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          dir={isAr ? "rtl" : "ltr"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto"
          >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black">{isAr ? "مقارنة مباشرة بين اللاعبين" : "Head-to-Head Comparison"}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">

          {/* Player Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Player A */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-500" />
              {isSelectingA || !playerA ? (
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase text-slate-500">{isAr ? "اختر اللاعب الأول" : "Select Player A"}</span>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={isAr ? "ابحث عن اسم..." : "Search name..."}
                      value={searchA}
                      onChange={(e) => setSearchA(e.target.value)}
                      className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  {/* Optimized list — no animations on rows, limited to 50 items to fix scroll lag */}
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 overscroll-contain">
                    {filteredForA.slice(0, 50).map((p) => (
                      <PlayerListRow key={p.uid} p={p} ovr={ovrMap.get(p.uid) ?? 0} onClick={() => { setPlayerAId(p.uid); setIsSelectingA(false); }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-blue-500/40 shadow-lg shrink-0 flex items-center justify-center font-black text-xl text-slate-700 dark:text-slate-200">
                      {playerA.photoUrl ? (
                        <Image src={playerA.photoUrl} alt="" width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        playerA.cardName?.charAt(0) || "?"
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{playerA.cardName}</h4>
                        {playerA.form && <FormIcon form={playerA.form} className="w-4 h-4" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-500/20">{playerA.primaryPosition}</span>
                        {playerA.playStyle && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{playerA.playStyle.replace(/_/g, " ")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-md">{ovrA}</div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setIsSelectingA(true)} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">{isAr ? "تغيير" : "Change"}</button>
                      <span className="text-slate-400 text-[10px]">•</span>
                      <button onClick={removeA} className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5">
                        <UserX className="w-3 h-3" />{isAr ? "إزالة" : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Player B */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-red-500" />
              {isSelectingB || !playerB ? (
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase text-slate-500">{isAr ? "اختر اللاعب الثاني" : "Select Player B"}</span>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={isAr ? "ابحث عن اسم..." : "Search name..."}
                      value={searchB}
                      onChange={(e) => setSearchB(e.target.value)}
                      className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 overscroll-contain">
                    {filteredForB.slice(0, 50).map((p) => (
                      <PlayerListRow key={p.uid} p={p} ovr={ovrMap.get(p.uid) ?? 0} onClick={() => { setPlayerBId(p.uid); setIsSelectingB(false); }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-amber-500/40 shadow-lg shrink-0 flex items-center justify-center font-black text-xl text-slate-700 dark:text-slate-200">
                      {playerB.photoUrl ? (
                        <Image src={playerB.photoUrl} alt="" width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        playerB.cardName?.charAt(0) || "?"
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{playerB.cardName}</h4>
                        {playerB.form && <FormIcon form={playerB.form} className="w-4 h-4" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs border border-amber-500/20">{playerB.primaryPosition}</span>
                        {playerB.playStyle && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{playerB.playStyle.replace(/_/g, " ")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 text-white font-black text-2xl flex items-center justify-center shadow-md">{ovrB}</div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setIsSelectingB(true)} className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline">{isAr ? "تغيير" : "Change"}</button>
                      <span className="text-slate-400 text-[10px]">•</span>
                      <button onClick={removeB} className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5">
                        <UserX className="w-3 h-3" />{isAr ? "إزالة" : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison content — only when both are selected */}
          {showComparison ? (
            <div className="space-y-8">

              {/* OVR + Match Stats */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 text-center">
                  {isAr ? "الأداء العام" : "Overall & Match Stats"}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { labelEn: "OVR Rating", labelAr: "التقييم الكلي",    valA: ovrA,                                                               valB: ovrB },
                    { labelEn: "Goals",       labelAr: "الأهداف",          valA: playerA.stats?.goals || 0,                                          valB: playerB.stats?.goals || 0 },
                    { labelEn: "Assists",     labelAr: "التمريرات",        valA: playerA.stats?.assists || 0,                                        valB: playerB.stats?.assists || 0 },
                    { labelEn: "MVPs",        labelAr: "رجل المباراة",     valA: playerA.stats?.mvp || 0,                                            valB: playerB.stats?.mvp || 0 },
                    { labelEn: "G+A",         labelAr: "مساهمات",          valA: (playerA.stats?.goals || 0) + (playerA.stats?.assists || 0),        valB: (playerB.stats?.goals || 0) + (playerB.stats?.assists || 0) },
                    { labelEn: "Matches",     labelAr: "مباريات",          valA: playerA.stats?.matchesPlayed || 0,                                  valB: playerB.stats?.matchesPlayed || 0 },
                    { labelEn: "Height",      labelAr: "الطول",            valA: playerA.height || 0,                                                valB: playerB.height || 0 },
                    { labelEn: "Weight",      labelAr: "الوزن",            valA: playerA.weight || 0,                                                valB: playerB.weight || 0 },
                  ].map((stat, idx) => {
                    const winA = stat.valA > stat.valB;
                    const winB = stat.valB > stat.valA;
                    return (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase">{isAr ? stat.labelAr : stat.labelEn}</span>
                        <div className="flex items-center justify-center gap-2 text-sm font-black">
                          <span className={winA ? "text-blue-600 dark:text-blue-400 text-base" : "text-slate-600 dark:text-slate-400"}>{stat.valA}</span>
                          <span className="text-slate-300 dark:text-slate-600 text-xs">vs</span>
                          <span className={winB ? "text-amber-600 dark:text-amber-400 text-base" : "text-slate-600 dark:text-slate-400"}>{stat.valB}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* All 22 Attributes — grouped */}
              {GROUP_ORDER.map((group) => {
                const attrs = ALL_ATTRIBUTES.filter((a) => a.groupEn === group);
                return (
                  <div key={group} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <h4 className="font-black text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-5 text-center">
                      {isAr ? attrs[0]?.groupAr : group}
                    </h4>
                    <div className="space-y-4">
                      {attrs.map((attr) => {
                        const valA = getAttrValue(playerA, attr.key);
                        const valB = getAttrValue(playerB, attr.key);
                        const diff = Math.abs(valA - valB);
                        const winnerA = valA > valB;
                        const winnerB = valB > valA;

                        return (
                          <div key={attr.key} className="space-y-1">
                            {/* Label row */}
                            <div className="flex items-center justify-between text-xs font-black">
                              <div className={`flex items-center gap-1.5 min-w-[44px] ${winnerA ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>
                                <span>{valA}</span>
                                {winnerA && diff > 0 && (
                                  <span className="text-[9px] bg-blue-500 text-white px-1 py-0.5 rounded font-black">+{diff}</span>
                                )}
                              </div>
                              <span className="text-slate-600 dark:text-slate-300 font-bold text-[11px] text-center px-2">
                                {isAr ? attr.nameAr : attr.nameEn}
                              </span>
                              <div className={`flex items-center gap-1.5 justify-end min-w-[44px] ${winnerB ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}`}>
                                {winnerB && diff > 0 && (
                                  <span className="text-[9px] bg-amber-500 text-white px-1 py-0.5 rounded font-black">+{diff}</span>
                                )}
                                <span>{valB}</span>
                              </div>
                            </div>
                            {/* Split bar */}
                            <div className="grid grid-cols-2 gap-1 h-2.5 overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-full">
                              <div className="flex justify-end rounded-l-full overflow-hidden">
                                <div
                                  style={{ width: valA > 0 ? `${Math.min(100, (valA / 99) * 100)}%` : "0%" }}
                                  className={`h-full rounded-l-full transition-none ${winnerA ? "bg-gradient-to-l from-blue-600 to-indigo-500" : "bg-blue-300 dark:bg-blue-800"}`}
                                />
                              </div>
                              <div className="flex justify-start rounded-r-full overflow-hidden">
                                <div
                                  style={{ width: valB > 0 ? `${Math.min(100, (valB / 99) * 100)}%` : "0%" }}
                                  className={`h-full rounded-r-full transition-none ${winnerB ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-amber-300 dark:bg-amber-800"}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Special Skills */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 text-center">
                  {isAr ? "المهارات الخاصة" : "Special Skills"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      {playerA.cardName} ({playerA.specialSkills?.length || 0})
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {playerA.specialSkills && playerA.specialSkills.length > 0 ? (
                        playerA.specialSkills.map((sId) => {
                          const sObj = SKILLS.find((x) => x.id === sId);
                          return (
                            <span key={sId} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-bold">
                              {sObj ? (isAr ? sObj.labelAr : sObj.label) : sId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic">{isAr ? "لا توجد مهارات خاصة" : "No special skills"}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      {playerB.cardName} ({playerB.specialSkills?.length || 0})
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {playerB.specialSkills && playerB.specialSkills.length > 0 ? (
                        playerB.specialSkills.map((sId) => {
                          const sObj = SKILLS.find((x) => x.id === sId);
                          return (
                            <span key={sId} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
                              {sObj ? (isAr ? sObj.labelAr : sObj.label) : sId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic">{isAr ? "لا توجد مهارات خاصة" : "No special skills"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ArrowRightLeft className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50 animate-pulse" />
              <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
                {isAr ? "اختر لاعبَين من فوق لبدء المقارنة المفصلة." : "Select both players above to start the detailed comparison."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm hover:opacity-90 transition-opacity"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
