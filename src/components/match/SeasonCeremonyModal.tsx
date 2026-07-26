"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Sparkles, Send, CheckCircle2, ShieldAlert, Award, Calendar, RefreshCw, X, Shield, ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, writeBatch, arrayUnion, serverTimestamp, setDoc, addDoc, collection } from "firebase/firestore";
import toast from "react-hot-toast";
import type { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";
import confetti from 'canvas-confetti';
import Image from "next/image";

interface SeasonCeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerProfile[];
  activeCommunityId: string;
  locale: string;
  onRefresh: () => void;
}

export default function SeasonCeremonyModal({
  isOpen,
  onClose,
  players,
  activeCommunityId,
  locale,
  onRefresh,
}: SeasonCeremonyModalProps) {
  const isAr = locale === "ar";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sendWinnerNotifs, setSendWinnerNotifs] = useState(true);
  const [sendCommunityBroadcast, setSendCommunityBroadcast] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  const currentYear = new Date().getFullYear();
  const seasonName = `Season ${currentYear}`;
  const previousSeasonName = `Season ${currentYear - 1}`;
  const [isFirstSeason, setIsFirstSeason] = useState(false);

  // Check if this is the first season launch
  useEffect(() => {
    const checkFirstSeason = async () => {
      if (!activeCommunityId) return;
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const commDoc = await getDoc(doc(db, "communities", activeCommunityId));
        if (commDoc.exists()) {
          const data = commDoc.data();
          setIsFirstSeason(!data.lastSeasonResetYear);
        }
      } catch (err) {
        console.warn("Error checking first season:", err);
      }
    };
    checkFirstSeason();
  }, [activeCommunityId]);

  const winners = useMemo(() => {
    if (!players || players.length === 0) return null;

    const topScorer = [...players].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))[0];
    const topAssister = [...players].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))[0];
    const topMVP = [...players].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0))[0];

    const ballonDor = [...players].sort((a, b) => {
      const aScore = ((a.stats?.goals || 0) * 2) + ((a.stats?.assists || 0) * 1) + ((a.stats?.mvp || 0) * 5);
      const bScore = ((b.stats?.goals || 0) * 2) + ((b.stats?.assists || 0) * 1) + ((b.stats?.mvp || 0) * 5);
      return bScore - aScore;
    })[0];

    const defensivePositions = ['CB', 'LB', 'RB', 'DMF', 'GK'];
    const topDefender = [...players]
      .filter(p => p.primaryPosition && defensivePositions.includes(p.primaryPosition))
      .sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a))[0] || null;

    return {
      ballonDor: (ballonDor && ((ballonDor.stats?.goals || 0) + (ballonDor.stats?.assists || 0) + (ballonDor.stats?.mvp || 0) > 0)) ? ballonDor : null,
      topScorer: (topScorer && (topScorer.stats?.goals || 0) > 0) ? topScorer : null,
      topAssister: (topAssister && (topAssister.stats?.assists || 0) > 0) ? topAssister : null,
      topMVP: (topMVP && (topMVP.stats?.mvp || 0) > 0) ? topMVP : null,
      topDefender: topDefender || null
    };
  }, [players]);

  if (!winners) return null;

  const handleExecuteCeremony = async () => {
    if (!activeCommunityId) return;
    setIsExecuting(true);
    const dateStr = new Date().toISOString();

    try {
      const initBatch = writeBatch(db);
      if (!isFirstSeason) {
        const seasonHistoryRef = doc(db, `communities/${activeCommunityId}/seasonHistory`, `season_${currentYear - 1}`);
        initBatch.set(seasonHistoryRef, {
          seasonYear: currentYear - 1,
          closedAt: serverTimestamp(),
          winners: {
            ballonDor: winners.ballonDor ? { uid: winners.ballonDor.uid, name: winners.ballonDor.cardName || winners.ballonDor.fullName, score: ((winners.ballonDor.stats?.goals || 0) * 2 + (winners.ballonDor.stats?.assists || 0) + (winners.ballonDor.stats?.mvp || 0) * 5) } : null,
            topScorer: winners.topScorer ? { uid: winners.topScorer.uid, name: winners.topScorer.cardName || winners.topScorer.fullName, goals: winners.topScorer.stats?.goals || 0 } : null,
            topAssister: winners.topAssister ? { uid: winners.topAssister.uid, name: winners.topAssister.cardName || winners.topAssister.fullName, assists: winners.topAssister.stats?.assists || 0 } : null,
            topMVP: winners.topMVP ? { uid: winners.topMVP.uid, name: winners.topMVP.cardName || winners.topMVP.fullName, mvp: winners.topMVP.stats?.mvp || 0 } : null,
          },
          totalPlayers: players.length
        }, { merge: true });
      }

      const commRef = doc(db, 'communities', activeCommunityId);
      initBatch.set(commRef, { lastSeasonResetYear: currentYear }, { merge: true });
      await initBatch.commit();

      // Process players in safe chunks of 200 (under 500 limit)
      const batchSize = 200;
      for (let i = 0; i < players.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = players.slice(i, i + batchSize);

        chunk.forEach(p => {
          const docRef = doc(db, 'communities', activeCommunityId, 'players', p.uid);

          const newTrophies: any[] = [];
          if (winners.ballonDor && p.uid === winners.ballonDor.uid) {
            newTrophies.push({ name: "Ballon d'Or", season: previousSeasonName, icon: "👑", date: dateStr });
          }
          if (winners.topScorer && p.uid === winners.topScorer.uid) {
            newTrophies.push({ name: "Golden Boot", season: previousSeasonName, icon: "⚽", date: dateStr });
          }
          if (winners.topAssister && p.uid === winners.topAssister.uid) {
            newTrophies.push({ name: "Playmaker", season: previousSeasonName, icon: "🎯", date: dateStr });
          }
          if (winners.topMVP && p.uid === winners.topMVP.uid) {
            newTrophies.push({ name: "Season MVP", season: previousSeasonName, icon: "⭐", date: dateStr });
          }
          if (winners.topDefender && p.uid === winners.topDefender.uid) {
            newTrophies.push({ name: "Golden Shield", season: previousSeasonName, icon: "🛡️", date: dateStr });
          }

          const setPayload: any = {
            stats: {
              goals: 0,
              assists: 0,
              mvp: 0,
              matchesPlayed: 0
            }
          };

          if (newTrophies.length > 0) {
            setPayload.trophies = arrayUnion(...newTrophies);
            const globalDocRef = doc(db, 'players', p.uid);
            batch.set(globalDocRef, { trophies: arrayUnion(...newTrophies) }, { merge: true });
          }

          batch.set(docRef, setPayload, { merge: true });
        });

        await batch.commit();
      }

      // Winners Notifications
      if (sendWinnerNotifs) {
        const winnerMap: Array<{ uid: string; trophy: string; icon: string }> = [];
        if (winners.ballonDor) winnerMap.push({ uid: winners.ballonDor.uid, trophy: "الكرة الذهبية (Ballon d'Or)", icon: "👑" });
        if (winners.topScorer) winnerMap.push({ uid: winners.topScorer.uid, trophy: "الحذاء الذهبي (Golden Boot)", icon: "⚽" });
        if (winners.topAssister) winnerMap.push({ uid: winners.topAssister.uid, trophy: "أفضل صانع ألعاب (Playmaker)", icon: "🎯" });
        if (winners.topMVP) winnerMap.push({ uid: winners.topMVP.uid, trophy: "لاعب الموسم (Season MVP)", icon: "⭐" });

        for (const w of winnerMap) {
          try {
            const notifRef = doc(db, `users/${w.uid}/notifications`, `trophy_${currentYear}_${w.uid}_${Date.now()}`);
            await setDoc(notifRef, {
              type: 'trophies',
              title: isAr ? `${w.icon} تهانينا! لقد توجت بلقب الموسم!` : `${w.icon} Congratulations! You are Season Champion!`,
              body: isAr
                ? `لقد فزت رسمياً بجائزة ${w.trophy} عن أدائك الخارق في ${previousSeasonName}. تمت إضافة الجائزة لخزانة بطولاتك في ملفك الشخصي!`
                : `You officially won ${w.trophy} for your performance in ${previousSeasonName}. Added to your Profile!`,
              read: false,
              createdAt: serverTimestamp(),
              link: `/profile?uid=${w.uid}`
            });
          } catch (e) {
            console.warn("Error sending winner notification:", e);
          }
        }
      }

      // Community Broadcast
      if (sendCommunityBroadcast) {
        try {
          const annRef = doc(db, `communities/${activeCommunityId}/announcements`, `season_${currentYear}_start`);
          await setDoc(annRef, {
            title: isAr ? `🏆 ختام موسم ${previousSeasonName} وانطلاق ${seasonName}!` : `🏆 ${previousSeasonName} Ended & ${seasonName} Started!`,
            content: isAr
              ? `تم تتويج الفرسان وأبطال الموسم الماضي وتوزيع جوائز خزانة الألقاب، وتم تصفير العدادات وبدء التنافس من جديد لموسم ${currentYear}. أظهروا لنا مهاراتكم!`
              : `Champions crowned, trophies awarded, and stats reset! The battle for ${seasonName} glory starts now!`,
            date: dateStr,
            author: isAr ? "إدارة المجتمع" : "Community Admin"
          });

          // Post to Community Live Chat
          const bDorName = winners.ballonDor ? (winners.ballonDor.cardName || winners.ballonDor.fullName) : "N/A";
          const scorerName = winners.topScorer ? `${winners.topScorer.cardName || winners.topScorer.fullName} (${winners.topScorer.stats?.goals || 0} أهداف)` : "N/A";

          await addDoc(collection(db, "communities", activeCommunityId, "chat"), {
            senderId: "system",
            senderName: isAr ? "11AI التتويج" : "11AI Ceremony",
            senderPhoto: "",
            text: isAr
              ? `🏆 [حفل التتويج الفاخر]: وانطلق رسمياً موسم ${currentYear}!\n👑 الكرة الذهبية: ${bDorName}\n⚽ الحذاء الذهبي: ${scorerName}\nبالتوفيق للجميع في المشوار الجديد! 🚀`
              : `🏆 [Official Ceremony]: ${seasonName} Has Launched!\n👑 Ballon d'Or: ${bDorName}\n⚽ Golden Boot: ${scorerName}\nGood luck to all! 🚀`,
            createdAt: serverTimestamp(),
            isSystem: true,
          });
        } catch (e) {
          console.warn("Could not post season broadcast announcement:", e);
        }
      }

      onRefresh();

      // Confetti celebration
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
      }, 250);

      toast.success(
        isAr
          ? "🎉 تم تتويج الأبطال ومنح الجوائز وبدء الموسم الجديد بنجاح!"
          : "🎉 Champions crowned, trophies awarded & new season launched!"
      );
      onClose();
    } catch (err) {
      console.error("Error executing seasonal ceremony:", err);
      toast.error(isAr ? "حدث خطأ أثناء تتويج الأبطال وإنهاء الموسم" : "Error executing season ceremony");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.3, damping: 25 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            dir={isAr ? "rtl" : "ltr"}
          >
            {/* Solid Dark Header */}
            <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                  <Trophy className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>{isFirstSeason
                      ? (isAr ? "بدء الموسم الأول" : "Start First Season")
                      : (isAr ? "حفل تتويج الأبطال وتصفير الموسم" : "Season Ceremony & Coronation")
                    }</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {isFirstSeason
                      ? (isAr ? `انطلاق ${seasonName} رسميًا للمجتمع` : `Launching ${seasonName} for your community`)
                      : (isAr
                          ? `تتويج أبطال ${previousSeasonName} وتصفير العدادات لانطلاق ${seasonName}`
                          : `Awarding ${previousSeasonName} trophies & launching ${seasonName}`
                        )
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="p-2.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Steps Navigation Bar */}
            <div className="flex border-b border-slate-800 bg-slate-950 p-3 gap-2 overflow-x-auto">
              {[
                { stepNum: 1, label: isAr ? "منصة الأبطال" : "Podium & Winners" },
                { stepNum: 2, label: isAr ? "إشعارات التتويج" : "Notifications & Broadcast" },
                { stepNum: 3, label: isAr ? "التنفيذ والتصفير" : "Execute & Launch" },
              ].map(s => (
                <button
                  key={s.stepNum}
                  onClick={() => setStep(s.stepNum as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    step === s.stepNum
                      ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === s.stepNum ? "bg-slate-950 text-amber-400 font-bold" : "bg-slate-950 text-slate-400"
                  }`}>
                    {s.stepNum}
                  </span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {step === 1 && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 text-xs flex items-center gap-3 font-medium">
                    <Award className="w-5 h-5 shrink-0 text-amber-400" />
                    <span>
                      {isAr
                        ? "حساب الفائزين يتم تلقائياً بناءً على إحصائيات الأهداف والصناعة ومرات الفوز بأفضل لاعب في الموسم."
                        : "Winners are calculated automatically from goals, assists, and MOTM stats."}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ballon d'Or Card */}
                    <div className="p-5 bg-slate-950 border border-amber-500/50 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-amber-400 overflow-hidden shrink-0 flex items-center justify-center text-amber-400 text-2xl font-black">
                        {winners.ballonDor?.photoUrl ? (
                          <Image src={winners.ballonDor.photoUrl} alt="Ballon d'Or Winner" width={56} height={56} className="w-full h-full object-cover" />
                        ) : "👑"}
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                          {isAr ? "الكرة الذهبية (Ballon d'Or)" : "Ballon d'Or"}
                        </div>
                        <div className="text-sm font-black text-white truncate mt-0.5">
                          {winners.ballonDor ? (winners.ballonDor.cardName || winners.ballonDor.fullName) : (isAr ? "لا يوجد بيانات كافية" : "No Qualifying Player")}
                        </div>
                        {winners.ballonDor && (
                          <div className="text-[10px] text-amber-300 mt-1 flex items-center gap-2 font-bold">
                            <span>⚽ {winners.ballonDor.stats?.goals || 0}</span>
                            <span>👟 {winners.ballonDor.stats?.assists || 0}</span>
                            <span>⭐ {winners.ballonDor.stats?.mvp || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Golden Boot */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-emerald-400 text-2xl font-black">
                        {winners.topScorer?.photoUrl ? (
                          <Image src={winners.topScorer.photoUrl} alt="Golden Boot Winner" width={56} height={56} className="w-full h-full object-cover" />
                        ) : "⚽"}
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                          {isAr ? "الحذاء الذهبي (الهداف)" : "Golden Boot"}
                        </div>
                        <div className="text-sm font-black text-white truncate mt-0.5">
                          {winners.topScorer ? (winners.topScorer.cardName || winners.topScorer.fullName) : (isAr ? "لا يوجد أهداف" : "No goals recorded")}
                        </div>
                        {winners.topScorer && (
                          <div className="text-[10px] text-emerald-400 mt-1 font-bold">
                            {winners.topScorer.stats?.goals || 0} {isAr ? "أهداف" : "Goals"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Playmaker */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-cyan-400 text-2xl font-black">
                        {winners.topAssister?.photoUrl ? (
                          <Image src={winners.topAssister.photoUrl} alt="Top Playmaker Winner" width={56} height={56} className="w-full h-full object-cover" />
                        ) : "🎯"}
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                          {isAr ? "أفضل صانع ألعاب" : "Top Playmaker"}
                        </div>
                        <div className="text-sm font-black text-white truncate mt-0.5">
                          {winners.topAssister ? (winners.topAssister.cardName || winners.topAssister.fullName) : (isAr ? "لا يوجد تمريرات" : "No assists recorded")}
                        </div>
                        {winners.topAssister && (
                          <div className="text-[10px] text-cyan-400 mt-1 font-bold">
                            {winners.topAssister.stats?.assists || 0} {isAr ? "تمريرة حاسمة" : "Assists"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Season MVP */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-purple-400 text-2xl font-black">
                        {winners.topMVP?.photoUrl ? (
                          <Image src={winners.topMVP.photoUrl} alt="Season MVP Winner" width={56} height={56} className="w-full h-full object-cover" />
                        ) : "⭐"}
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                          {isAr ? "رجل الموسم (MVP)" : "Season MVP"}
                        </div>
                        <div className="text-sm font-black text-white truncate mt-0.5">
                          {winners.topMVP ? (winners.topMVP.cardName || winners.topMVP.fullName) : (isAr ? "لا يوجد جوائز" : "No MOTM recorded")}
                        </div>
                        {winners.topMVP && (
                          <div className="text-[10px] text-purple-400 mt-1 font-bold">
                            {winners.topMVP.stats?.mvp || 0} {isAr ? "مرة رجل المباراة" : "MOTM Awards"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-colors ${sendWinnerNotifs ? 'bg-slate-950 border-amber-500/50' : 'bg-slate-950 border-slate-800'}`}>
                    <input
                      type="checkbox"
                      checked={sendWinnerNotifs}
                      onChange={e => setSendWinnerNotifs(e.target.checked)}
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-700 bg-slate-900 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>{isAr ? "إرسال إشعارات التهنئة الفردية للأبطال 🏆" : "Personal Winner Notifications 🏆"}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-medium">
                        {isAr
                          ? "إرسال إشعار فوري لكل فائز يهنئه باللقب وتثبيته في خزانة ملفه الشخصي."
                          : "Dispatch instant notifications to trophy winners to update their profile."}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-colors ${sendCommunityBroadcast ? 'bg-slate-950 border-emerald-500/50' : 'bg-slate-950 border-slate-800'}`}>
                    <input
                      type="checkbox"
                      checked={sendCommunityBroadcast}
                      onChange={e => setSendCommunityBroadcast(e.target.checked)}
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-700 bg-slate-900 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>{isAr ? "بث إعلان رسمي وفي محادثة المجتمع 📢" : "Broadcast Announcement & Community Chat 📢"}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-medium">
                        {isAr
                          ? `نشر إشعار وبث رسالة في المحادثة بختام ${previousSeasonName} وانطلاق ${seasonName}.`
                          : `Publish community post and chat message announcing ${previousSeasonName} winners.`}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shadow-xl">
                    <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {isFirstSeason
                        ? (isAr ? "هل أنت مستعد لبدء الموسم الأول؟" : "Ready to Start First Season?")
                        : (isAr ? "هل أنت مستعد لاعتماد التتويج وبدء الموسم؟" : "Ready to Crown Champions & Launch Season?")
                      }
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                      {isFirstSeason
                        ? (isAr ? `سيتم بدء ${seasonName} وإحصائيات جميع اللاعبين ستبدأ من الصفر.` : `Starting ${seasonName} with clean stats.`)
                        : (isAr
                            ? `سيتم حفظ ألقاب ${previousSeasonName} الدائمة، وإرسال الإشعارات، وتصفير إحصائيات الأهداف لجميع اللاعبين لبدء ${seasonName}.`
                            : `Archives ${previousSeasonName} trophies, sends notifications, and resets stats for ${seasonName}.`
                          )
                      }
                    </p>
                  </div>

                  {!isFirstSeason && (
                    <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-3 text-start font-medium">
                      <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
                      <span>
                        {isAr
                          ? "ملاحظة: تصفير الإحصائيات ينطبق على أهداف وصناعات الموسم فقط، بينما تظل ألقاب وجوائز اللاعبين محفوظة للأبد."
                          : "Note: Stats reset applies to season goals/assists, while awarded trophies remain permanently archived."}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as any)}
                  disabled={isExecuting}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white transition-colors"
                >
                  {isAr ? "السابق" : "Previous"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isExecuting}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as any)}
                  className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-600/30 transition-all flex items-center gap-2"
                >
                  <span>{isAr ? "التالي" : "Next Step"}</span>
                  <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteCeremony}
                  disabled={isExecuting}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Trophy className="w-4 h-4 animate-bounce" />
                  <span>{isExecuting
                    ? (isAr ? "جاري البدء..." : "Starting...")
                    : (isFirstSeason
                        ? (isAr ? `بدء ${seasonName} 🚀` : `Start ${seasonName} 🚀`)
                        : (isAr ? `تتويج الأبطال وبدء ${seasonName} 🚀` : `Crown Champions & Launch ${seasonName} 🚀`)
                      )
                  }</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
