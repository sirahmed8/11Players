"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Trophy, Shield, Zap, Target, Award, UserCheck, Flame, ArrowRightLeft } from "lucide-react";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ThemeProvider";
import { getPlayerOverall } from "@/lib/playerUtils";
import FormIcon from "@/components/FormIcon";
import { SKILLS } from "@/components/SkillsChecklist";

interface PlayerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayerA?: PlayerProfile | null;
  initialPlayerB?: PlayerProfile | null;
  allPlayers: PlayerProfile[];
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
    if (initialPlayerA) {
      setPlayerAId(initialPlayerA.uid);
      setIsSelectingA(false);
    }
    if (initialPlayerB) {
      setPlayerBId(initialPlayerB.uid);
      setIsSelectingB(false);
    }
  }, [initialPlayerA, initialPlayerB]);

  const playerA = useMemo(() => allPlayers.find((p) => p.uid === playerAId) || null, [allPlayers, playerAId]);
  const playerB = useMemo(() => allPlayers.find((p) => p.uid === playerBId) || null, [allPlayers, playerBId]);

  const ovrA = playerA ? getPlayerOverall(playerA) : 0;
  const ovrB = playerB ? getPlayerOverall(playerB) : 0;

  const filteredForA = useMemo(() => {
    const q = searchA.toLowerCase().trim();
    return allPlayers
      .filter((p) => p.uid !== playerBId && (!q || p.cardName?.toLowerCase().includes(q) || p.fullName?.toLowerCase().includes(q)))
      .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a)); // Sort by OVR desc
  }, [allPlayers, searchA, playerBId]);

  const filteredForB = useMemo(() => {
    const q = searchB.toLowerCase().trim();
    return allPlayers
      .filter((p) => p.uid !== playerAId && (!q || p.cardName?.toLowerCase().includes(q) || p.fullName?.toLowerCase().includes(q)))
      .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a)); // Sort by OVR desc
  }, [allPlayers, searchB, playerAId]);

  const getAttrValue = (p: PlayerProfile | null, key: string): number => {
    if (!p) return 50;
    const attrs = (p.approvedAttributes || p.attributes || {}) as any;
    return attrs[key] || 50;
  };

  const statCategories = [
    { key: "PAC", nameEn: "Pace (PAC)", nameAr: "السرعة (PAC)" },
    { key: "SHO", nameEn: "Shooting (SHO)", nameAr: "التسديد (SHO)" },
    { key: "PAS", nameEn: "Passing (PAS)", nameAr: "التمرير (PAS)" },
    { key: "DRI", nameEn: "Dribbling (DRI)", nameAr: "المراوغة (DRI)" },
    { key: "DEF", nameEn: "Defending (DEF)", nameAr: "الدفاع (DEF)" },
    { key: "PHY", nameEn: "Physical (PHY)", nameAr: "الجرأة والبدنية (PHY)" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">{isAr ? "مقارنة مباشرة بين اللاعبين" : "Head-to-Head Player Comparison"}</h3>
              <p className="text-xs text-slate-400">{isAr ? "قارن القدرات والمهارات وإحصائيات المباريات جنبًا إلى جنب" : "Compare ratings, attributes, special skills, and match stats side-by-side"}</p>
            </div>
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
          {/* Top Selector / Player Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Player A Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-500" />
              {isSelectingA || !playerA ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-500">{isAr ? "اختر اللاعب الأول" : "Select Player A"}</span>
                  </div>
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
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredForA.map((p) => (
                      <button
                        key={p.uid}
                        onClick={() => { setPlayerAId(p.uid); setIsSelectingA(false); }}
                        className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-emerald-500/10 transition-colors text-start"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs">
                            {p.photoUrl ? (
                              <Image src={p.photoUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
                            ) : (
                              p.cardName?.charAt(0) || "?"
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{p.cardName}</p>
                            <p className="text-[10px] text-slate-500">{p.primaryPosition}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-lg">{getPlayerOverall(p)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-blue-500/40 shadow-lg flex-shrink-0 flex items-center justify-center font-black text-xl">
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
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-500/20">
                          {playerA.primaryPosition}
                        </span>
                        {playerA.playStyle && (
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {playerA.playStyle.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      {ovrA}
                    </div>
                    <button
                      onClick={() => setIsSelectingA(true)}
                      className="mt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {isAr ? "تغيير اللاعب" : "Change Player"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Player B Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-red-500" />
              {isSelectingB || !playerB ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-500">{isAr ? "اختر اللاعب الثاني" : "Select Player B"}</span>
                  </div>
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
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredForB.map((p) => (
                      <button
                        key={p.uid}
                        onClick={() => { setPlayerBId(p.uid); setIsSelectingB(false); }}
                        className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-emerald-500/10 transition-colors text-start"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs">
                            {p.photoUrl ? (
                              <Image src={p.photoUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
                            ) : (
                              p.cardName?.charAt(0) || "?"
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{p.cardName}</p>
                            <p className="text-[10px] text-slate-500">{p.primaryPosition}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-lg">{getPlayerOverall(p)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-amber-500/40 shadow-lg flex-shrink-0 flex items-center justify-center font-black text-xl">
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
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs border border-amber-500/20">
                          {playerB.primaryPosition}
                        </span>
                        {playerB.playStyle && (
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {playerB.playStyle.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      {ovrB}
                    </div>
                    <button
                      onClick={() => setIsSelectingB(true)}
                      className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {isAr ? "تغيير اللاعب" : "Change Player"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* If both selected, show comparisons */}
          {playerA && playerB ? (
            <div className="space-y-8">
              {/* Core Attributes Bars */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-5 text-center">
                  {isAr ? "مقارنة القدرات الرئيسية" : "Core Attributes Comparison"}
                </h4>
                <div className="space-y-5">
                  {statCategories.map((stat) => {
                    const valA = getAttrValue(playerA, stat.key);
                    const valB = getAttrValue(playerB, stat.key);
                    const diff = Math.abs(valA - valB);
                    const winnerA = valA > valB;
                    const winnerB = valB > valA;

                    return (
                      <div key={stat.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-black">
                          <div className={`flex items-center gap-1.5 ${winnerA ? "text-blue-600 dark:text-blue-400 font-black text-sm" : "text-slate-600 dark:text-slate-400"}`}>
                            <span>{valA}</span>
                            {winnerA && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">+{diff}</span>}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{isAr ? stat.nameAr : stat.nameEn}</span>
                          <div className={`flex items-center gap-1.5 ${winnerB ? "text-amber-600 dark:text-amber-400 font-black text-sm" : "text-slate-600 dark:text-slate-400"}`}>
                            {winnerB && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded">+{diff}</span>}
                            <span>{valB}</span>
                          </div>
                        </div>
                        {/* Split Bar */}
                        <div className="grid grid-cols-2 gap-2 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 p-0.5">
                          <div className="flex justify-end bg-transparent">
                            <div
                              style={{ width: `${Math.min(100, (valA / 99) * 100)}%` }}
                              className={`h-full rounded-l-full transition-all duration-500 ${winnerA ? "bg-gradient-to-l from-blue-600 to-indigo-500 shadow-sm" : "bg-slate-400 dark:bg-slate-500"}`}
                            />
                          </div>
                          <div className="flex justify-start bg-transparent">
                            <div
                              style={{ width: `${Math.min(100, (valB / 99) * 100)}%` }}
                              className={`h-full rounded-r-full transition-all duration-500 ${winnerB ? "bg-gradient-to-r from-amber-500 to-red-500 shadow-sm" : "bg-slate-400 dark:bg-slate-500"}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Physical & Biometrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { labelEn: "Height", labelAr: "الطول", valA: playerA.height ? `${playerA.height} cm` : "-", valB: playerB.height ? `${playerB.height} cm` : "-" },
                  { labelEn: "Weight", labelAr: "الوزن", valA: playerA.weight ? `${playerA.weight} kg` : "-", valB: playerB.weight ? `${playerB.weight} kg` : "-" },
                  { labelEn: "Preferred Foot", labelAr: "القدم المفضلة", valA: playerA.preferredFoot || "Both", valB: playerB.preferredFoot || "Both" },
                  { labelEn: "Peer Rating Avg", labelAr: "متوسط تقييم الزملاء", valA: playerA.peerRatingAvg ? `${playerA.peerRatingAvg.toFixed(1)}/10` : "-", valB: playerB.peerRatingAvg ? `${playerB.peerRatingAvg.toFixed(1)}/10` : "-" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{isAr ? item.labelAr : item.labelEn}</p>
                    <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                      <span className="text-blue-600 dark:text-blue-400">{item.valA}</span>
                      <span className="text-slate-300 dark:text-slate-600">vs</span>
                      <span className="text-amber-600 dark:text-amber-400">{item.valB}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Match Stats Comparison */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 text-center">
                  {isAr ? "إحصائيات الأداء في المباريات" : "Match Impact Statistics"}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { labelEn: "Goals", labelAr: "الأهداف", valA: playerA.stats?.goals || 0, valB: playerB.stats?.goals || 0 },
                    { labelEn: "Assists", labelAr: "صناعة الأهداف", valA: playerA.stats?.assists || 0, valB: playerB.stats?.assists || 0 },
                    { labelEn: "G/A Total", labelAr: "مجموع المساهمات", valA: (playerA.stats?.goals || 0) + (playerA.stats?.assists || 0), valB: (playerB.stats?.goals || 0) + (playerB.stats?.assists || 0) },
                    { labelEn: "MVPs", labelAr: "رجل المباراة (MVP)", valA: playerA.stats?.mvp || 0, valB: playerB.stats?.mvp || 0 },
                  ].map((stat, idx) => {
                    const winA = stat.valA > stat.valB;
                    const winB = stat.valB > stat.valA;
                    return (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">{isAr ? stat.labelAr : stat.labelEn}</span>
                        <div className="flex items-center justify-center gap-3 text-sm font-black">
                          <span className={winA ? "text-blue-600 dark:text-blue-400 text-base underline" : "text-slate-700 dark:text-slate-300"}>{stat.valA}</span>
                          <span className="text-xs text-slate-400">-</span>
                          <span className={winB ? "text-amber-600 dark:text-amber-400 text-base underline" : "text-slate-700 dark:text-slate-300"}>{stat.valB}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Skills Comparison */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 text-center">
                  {isAr ? "المهارات الخاصة (Special Skills)" : "Special Skills Breakdown"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Player A Skills */}
                  <div>
                    <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{playerA.cardName} Skills ({playerA.specialSkills?.length || 0})</span>
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
                        <span className="text-xs text-slate-400 italic">{isAr ? "لا توجد مهارات خاصة مختارة" : "No special skills selected"}</span>
                      )}
                    </div>
                  </div>

                  {/* Player B Skills */}
                  <div>
                    <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{playerB.cardName} Skills ({playerB.specialSkills?.length || 0})</span>
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
                        <span className="text-xs text-slate-400 italic">{isAr ? "لا توجد مهارات خاصة مختارة" : "No special skills selected"}</span>
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
                {isAr ? "يرجى اختيار اللاعب الأول والثاني لعرض المقارنة التفصيلية." : "Please select both players above to launch head-to-head comparison."}
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
            {isAr ? "إغلاق نافذة المقارنة" : "Close Comparison"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
