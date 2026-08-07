"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Zap, ArrowRightLeft, UserX, Trophy, Flame, Shield, Activity, Crown, Sparkles } from "lucide-react";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ui/ThemeProvider";
import { getPlayerOverall } from "@/lib/playerUtils";
import FormIcon from "@/components/ui/FormIcon";
import { SKILLS } from "@/components/player/SkillsChecklist";
import PlayerCardCompact from "@/components/player/PlayerCardCompact";

interface PlayerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayerA?: PlayerProfile | null;
  initialPlayerB?: PlayerProfile | null;
  allPlayers: PlayerProfile[];
}

const ALL_ATTRIBUTES: { key: string; nameEn: string; nameAr: string; groupEn: string; groupAr: string }[] = [
  // Offensive
  { key: "offensiveAwareness", nameEn: "Offensive Awareness", nameAr: "الوعي الهجومي",   groupEn: "Offensive", groupAr: "الهجوم" },
  { key: "finishing",          nameEn: "Finishing",           nameAr: "الإنهاء",          groupEn: "Offensive", groupAr: "الهجوم" },
  { key: "kickingPower",       nameEn: "Kicking Power",       nameAr: "قوة التسديد",      groupEn: "Offensive", groupAr: "الهجوم" },
  { key: "heading",            nameEn: "Heading",             nameAr: "الرأسيات",         groupEn: "Offensive", groupAr: "الهجوم" },
  // Technical
  { key: "ballControl",        nameEn: "Ball Control",        nameAr: "التحكم بالكرة",    groupEn: "Technical", groupAr: "التقنيات" },
  { key: "dribbling",          nameEn: "Dribbling",           nameAr: "المراوغة",         groupEn: "Technical", groupAr: "التقنيات" },
  { key: "lowPass",            nameEn: "Low Pass",            nameAr: "التمرير القصير",  groupEn: "Technical", groupAr: "التقنيات" },
  { key: "loftedPass",         nameEn: "Lofted Pass",         nameAr: "التمرير الطويل",   groupEn: "Technical", groupAr: "التقنيات" },
  // Physical
  { key: "speed",              nameEn: "Speed",               nameAr: "السرعة",           groupEn: "Physical",  groupAr: "البدنيات" },
  { key: "acceleration",       nameEn: "Acceleration",        nameAr: "التسارع",          groupEn: "Physical",  groupAr: "البدنيات" },
  { key: "jump",               nameEn: "Jump",                nameAr: "القفز",            groupEn: "Physical",  groupAr: "البدنيات" },
  { key: "physicalContact",    nameEn: "Physical Contact",    nameAr: "القوة البدنية",    groupEn: "Physical",  groupAr: "البدنيات" },
  { key: "balance",            nameEn: "Balance",             nameAr: "التوازن",          groupEn: "Physical",  groupAr: "البدنيات" },
  { key: "stamina",            nameEn: "Stamina",             nameAr: "اللياقة البدنية", groupEn: "Physical",  groupAr: "البدنيات" },
  // Defensive
  { key: "defensiveAwareness", nameEn: "Defensive Awareness", nameAr: "الوعي الدفاعي",   groupEn: "Defensive", groupAr: "الدفاع" },
  { key: "ballWinning",        nameEn: "Ball Winning",        nameAr: "افتكاك الكرة",     groupEn: "Defensive", groupAr: "الدفاع" },
  { key: "aggression",         nameEn: "Aggression",          nameAr: "الشراسة",          groupEn: "Defensive", groupAr: "الدفاع" },
  // GK
  { key: "gkAwareness",        nameEn: "GK Awareness",        nameAr: "وعي حارس المرمى", groupEn: "Goalkeeper", groupAr: "حراسة المرمى" },
  { key: "gkCatching",         nameEn: "GK Catching",         nameAr: "الإمساك بالكرة",  groupEn: "Goalkeeper", groupAr: "حراسة المرمى" },
  { key: "gkClearing",         nameEn: "GK Clearing",         nameAr: "إبعاد الكرة",     groupEn: "Goalkeeper", groupAr: "حراسة المرمى" },
  { key: "gkReflexes",         nameEn: "GK Reflexes",         nameAr: "ردود الفعل",      groupEn: "Goalkeeper", groupAr: "حراسة المرمى" },
  { key: "gkReach",            nameEn: "GK Reach",            nameAr: "التغطية والوصول",  groupEn: "Goalkeeper", groupAr: "حراسة المرمى" },
];

const GROUP_ORDER = ["Offensive", "Technical", "Physical", "Defensive", "Goalkeeper"];

function PlayerListRow({ p, ovr, onClick }: { p: PlayerProfile; ovr: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-800/80 active:bg-slate-800 transition-colors text-start border border-transparent hover:border-slate-700/60"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 text-slate-300 border border-slate-700 shadow-sm relative">
          {p.photoUrl ? (
            <Image src={p.photoUrl} alt="" fill sizes="36px" className="object-cover" />
          ) : (
            p.cardName?.charAt(0) || "?"
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-white truncate leading-tight">{p.cardName || p.fullName}</p>

          <p className="text-[10px] font-bold text-emerald-400 leading-tight mt-0.5">{p.primaryPosition}</p>
        </div>
      </div>
      <span className="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-1 rounded-lg shrink-0 ltr:ml-2 rtl:mr-2 shadow-sm">
        {ovr}
      </span>
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
      .filter((p) => {
        if (p.uid === playerBId) return false;
        if (!q) return true;
        const cName = p.cardName || p.fullName || "";
        return cName.toLowerCase().includes(q);
      })
      .sort((a, b) => (ovrMap.get(b.uid) ?? 0) - (ovrMap.get(a.uid) ?? 0));
  }, [allPlayers, searchA, playerBId, ovrMap]);

  const filteredForB = useMemo(() => {
    const q = searchB.toLowerCase().trim();
    return allPlayers
      .filter((p) => {
        if (p.uid === playerAId) return false;
        if (!q) return true;
        const cName = p.cardName || p.fullName || "";
        return cName.toLowerCase().includes(q);
      })
      .sort((a, b) => (ovrMap.get(b.uid) ?? 0) - (ovrMap.get(a.uid) ?? 0));
  }, [allPlayers, searchB, playerAId, ovrMap]);

  const removeA = useCallback(() => { setPlayerAId(""); setIsSelectingA(true); setSearchA(""); }, []);
  const removeB = useCallback(() => { setPlayerBId(""); setIsSelectingB(true); setSearchB(""); }, []);

  const showComparison = playerA && playerB;

  // Compute Head-to-Head stats summary
  const summary = useMemo(() => {
    if (!playerA || !playerB) return null;
    let winsA = 0;
    let winsB = 0;
    let ties = 0;

    ALL_ATTRIBUTES.forEach((attr) => {
      const vA = getAttrValue(playerA, attr.key);
      const vB = getAttrValue(playerB, attr.key);
      if (vA > vB) winsA++;
      else if (vB > vA) winsB++;
      else ties++;
    });

    return { winsA, winsB, ties };
  }, [playerA, playerB]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
          dir={isAr ? "rtl" : "ltr"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-white"
          >
            {/* ── Modal Header ─────────────────────────────────────────────── */}
            <div className="p-4 sm:p-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>{isAr ? "المواجهة المباشرة بين اللاعبين" : "Head-to-Head Comparison"}</span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    {isAr ? "مقارنة دقيقة في الطاقات والإحصائيات والقدرات" : "In-depth attribute & stat breakdown"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Scrollable Body ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
              {/* Player Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Player A Box */}
                <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
                  {isSelectingA || !playerA ? (
                    <div className="space-y-3">
                      <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                        {isAr ? "اختر اللاعب الأول (أزرق)" : "Select Player A (Blue)"}
                      </span>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          placeholder={isAr ? "ابحث عن اسم..." : "Search name..."}
                          value={searchA}
                          onChange={(e) => setSearchA(e.target.value)}
                          className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-cyan-500/60 text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar pr-1">
                        {filteredForA.map((p) => (
                          <PlayerListRow
                            key={p.uid}
                            p={p}
                            ovr={ovrMap.get(p.uid) ?? 0}
                            onClick={() => {
                              setPlayerAId(p.uid);
                              setIsSelectingA(false);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-stretch justify-center h-full gap-3">
                      <PlayerCardCompact player={playerA} />
                      <div className="flex justify-end gap-2 bg-slate-900/50 p-2 rounded-xl">
                        <button
                          onClick={() => setIsSelectingA(true)}
                          className="text-[11px] font-bold text-cyan-400 hover:underline bg-cyan-500/10 px-3 py-1 rounded-lg"
                        >
                          {isAr ? "تغيير" : "Change"}
                        </button>
                        <button
                          onClick={removeA}
                          className="text-[11px] font-bold text-red-400 hover:underline flex items-center gap-1 bg-red-500/10 px-3 py-1 rounded-lg"
                        >
                          <UserX className="w-3 h-3" />
                          {isAr ? "إزالة" : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Player B Box */}
                <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                  {isSelectingB || !playerB ? (
                    <div className="space-y-3">
                      <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                        {isAr ? "اختر اللاعب الثاني (ذهبي)" : "Select Player B (Gold)"}
                      </span>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          placeholder={isAr ? "ابحث عن اسم..." : "Search name..."}
                          value={searchB}
                          onChange={(e) => setSearchB(e.target.value)}
                          className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-amber-500/60 text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar pr-1">
                        {filteredForB.map((p) => (
                          <PlayerListRow
                            key={p.uid}
                            p={p}
                            ovr={ovrMap.get(p.uid) ?? 0}
                            onClick={() => {
                              setPlayerBId(p.uid);
                              setIsSelectingB(false);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-stretch justify-center h-full gap-3">
                      <PlayerCardCompact player={playerB} />
                      <div className="flex justify-end gap-2 bg-slate-900/50 p-2 rounded-xl">
                        <button
                          onClick={() => setIsSelectingB(true)}
                          className="text-[11px] font-bold text-amber-400 hover:underline bg-amber-500/10 px-3 py-1 rounded-lg"
                        >
                          {isAr ? "تغيير" : "Change"}
                        </button>
                        <button
                          onClick={removeB}
                          className="text-[11px] font-bold text-red-400 hover:underline flex items-center gap-1 bg-red-500/10 px-3 py-1 rounded-lg"
                        >
                          <UserX className="w-3 h-3" />
                          {isAr ? "إزالة" : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Content */}
              {showComparison ? (
                <div className="space-y-6">
                  {/* Head-to-Head Advantage Summary Box */}
                  {summary && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-950/90 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl shrink-0">
                          ⚡
                        </div>
                        <div>
                          <h4 className="font-black text-base text-white">
                            {summary.winsA > summary.winsB ? (
                              <span className="text-cyan-400">
                                {isAr ? `يتفوق ${playerA.cardName} في ${summary.winsA} طاقة!` : `${playerA.cardName} leads in ${summary.winsA} attributes!`}
                              </span>
                            ) : summary.winsB > summary.winsA ? (
                              <span className="text-amber-400">
                                {isAr ? `يتفوق ${playerB.cardName} في ${summary.winsB} طاقة!` : `${playerB.cardName} leads in ${summary.winsB} attributes!`}
                              </span>
                            ) : (
                              <span className="text-teal-400">
                                {isAr ? "المواجهة متكافئة تماماً!" : "Perfectly Balanced Matchup!"}
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            {isAr
                              ? `${playerA.cardName} (${summary.winsA}) vs ${playerB.cardName} (${summary.winsB}) — التعادلات (${summary.ties})`
                              : `${playerA.cardName} (${summary.winsA}) vs ${playerB.cardName} (${summary.winsB}) — Ties (${summary.ties})`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 shrink-0">
                        <span className="text-xs font-black text-cyan-400">{ovrA} OVR</span>
                        <span className="text-xs font-bold text-slate-500">vs</span>
                        <span className="text-xs font-black text-amber-400">{ovrB} OVR</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Overall & Match Stats Grid */}
                  <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 text-center flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <span>{isAr ? "الأداء العام وإحصائيات المباريات" : "Overall & Match Stats"}</span>
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
                          <div
                            key={idx}
                            className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-between gap-1 shadow-sm"
                          >
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                              {isAr ? stat.labelAr : stat.labelEn}
                            </span>
                            <div className="flex items-center justify-center gap-3 w-full text-base font-black">
                              <span className={winA ? "text-cyan-400 font-black text-lg" : "text-slate-400"}>
                                {stat.valA}
                              </span>
                              <span className="text-slate-600 text-xs font-bold">VS</span>
                              <span className={winB ? "text-amber-400 font-black text-lg" : "text-slate-400"}>
                                {stat.valB}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* All 22 Attributes — Grouped Bars */}
                  {GROUP_ORDER.map((group) => {
                    const attrs = ALL_ATTRIBUTES.filter((a) => a.groupEn === group);
                    return (
                      <div
                        key={group}
                        className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4"
                      >
                        <h4 className="font-black text-xs uppercase tracking-wider text-emerald-400 text-center flex items-center justify-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>{isAr ? attrs[0]?.groupAr : group}</span>
                        </h4>
                        <div className="space-y-3.5">
                          {attrs.map((attr) => {
                            const valA = getAttrValue(playerA, attr.key);
                            const valB = getAttrValue(playerB, attr.key);
                            const diff = Math.abs(valA - valB);
                            const winnerA = valA > valB;
                            const winnerB = valB > valA;

                            return (
                              <div key={attr.key} className="space-y-1.5">
                                {/* Label & Numeric Row */}
                                <div className="flex items-center justify-between text-xs font-black">
                                  <div
                                    className={`flex items-center gap-1.5 min-w-[50px] ${
                                      winnerA ? "text-cyan-400" : "text-slate-400"
                                    }`}
                                  >
                                    <span className="text-sm font-black">{valA}</span>
                                    {winnerA && diff > 0 && (
                                      <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded-md font-black">
                                        +{diff}
                                      </span>
                                    )}
                                  </div>

                                  <span className="text-slate-300 font-bold text-xs text-center px-2">
                                    {isAr ? attr.nameAr : attr.nameEn}
                                  </span>

                                  <div
                                    className={`flex items-center gap-1.5 justify-end min-w-[50px] ${
                                      winnerB ? "text-amber-400" : "text-slate-400"
                                    }`}
                                  >
                                    {winnerB && diff > 0 && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded-md font-black">
                                        +{diff}
                                      </span>
                                    )}
                                    <span className="text-sm font-black">{valB}</span>
                                  </div>
                                </div>

                                {/* Bi-Directional Split Progress Bar */}
                                <div className="grid grid-cols-2 gap-1.5 h-3 bg-slate-900 rounded-full p-0.5 border border-slate-800">
                                  <div className="flex justify-end rounded-l-full overflow-hidden">
                                    <div
                                      style={{ width: valA > 0 ? `${Math.min(100, (valA / 99) * 100)}%` : "0%" }}
                                      className={`h-full rounded-l-full transition-all duration-500 ${
                                        winnerA
                                          ? "bg-gradient-to-l from-cyan-400 to-blue-600 shadow-sm"
                                          : "bg-slate-700/60"
                                      }`}
                                    />
                                  </div>
                                  <div className="flex justify-start rounded-r-full overflow-hidden">
                                    <div
                                      style={{ width: valB > 0 ? `${Math.min(100, (valB / 99) * 100)}%` : "0%" }}
                                      className={`h-full rounded-r-full transition-all duration-500 ${
                                        winnerB
                                          ? "bg-gradient-to-r from-amber-400 to-orange-600 shadow-sm"
                                          : "bg-slate-700/60"
                                      }`}
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

                  {/* Special Skills Section */}
                  <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-wider text-amber-400 text-center flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>{isAr ? "المهارات الخاصة" : "Special Skills"}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h5 className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                          <span>{playerA.cardName || playerA.fullName}</span>
                          <span className="text-[10px] text-slate-500">({playerA.specialSkills?.length || 0})</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {playerA.specialSkills && playerA.specialSkills.length > 0 ? (
                            playerA.specialSkills.map((sId) => {
                              const sObj = SKILLS.find((x) => x.id === sId);
                              return (
                                <span
                                  key={sId}
                                  className="px-2.5 py-1 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs font-bold shadow-sm"
                                >
                                  ⭐ {sObj ? (isAr ? sObj.labelAr : sObj.label) : sId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              {isAr ? "لا توجد مهارات خاصة" : "No special skills"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <span>{playerB.cardName || playerB.fullName}</span>
                          <span className="text-[10px] text-slate-500">({playerB.specialSkills?.length || 0})</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {playerB.specialSkills && playerB.specialSkills.length > 0 ? (
                            playerB.specialSkills.map((sId) => {
                              const sObj = SKILLS.find((x) => x.id === sId);
                              return (
                                <span
                                  key={sId}
                                  className="px-2.5 py-1 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-500/30 text-xs font-bold shadow-sm"
                                >
                                  ⭐ {sObj ? (isAr ? sObj.labelAr : sObj.label) : sId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              {isAr ? "لا توجد مهارات خاصة" : "No special skills"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-950/80 rounded-3xl border border-slate-800 space-y-3">
                  <ArrowRightLeft className="w-12 h-12 text-emerald-400 mx-auto opacity-60 animate-pulse" />
                  <p className="text-slate-300 font-bold text-sm">
                    {isAr
                      ? "اختر لاعبَين من القائمة أعلاه لبدء المقارنة المفصلة بين الطاقات والإحصائيات."
                      : "Select two players above to initiate an in-depth head-to-head comparison."}
                  </p>
                </div>
              )}
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
