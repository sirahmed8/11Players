"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Sparkles, Send, CheckCircle2, ShieldAlert, Award, Calendar, RefreshCw, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, writeBatch, arrayUnion, serverTimestamp, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import type { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";
import confetti from 'canvas-confetti';

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
      // We will commit the history & comm tag separately
      const initBatch = writeBatch(db);
      // 1. Save Season Archive / History only if not the very first season.
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

      // Update community last reset year tag
      const commRef = doc(db, 'communities', activeCommunityId);
      initBatch.set(commRef, { lastSeasonResetYear: currentYear }, { merge: true });
      await initBatch.commit();

      // 2. Process all players in chunks to avoid > 500 writes limit per batch
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

          // Use set with merge: true to avoid errors if the community player document doesn't fully exist
          batch.set(docRef, setPayload, { merge: true });
        });

        await batch.commit();
      }

      // 3. Dispatch Multi-stage notifications right after successful batch commit
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
                ? `لقد فزت رسمياً بجائزة ${w.trophy} عن أداءك الخارق في ${previousSeasonName}. تمت إضافة الجائزة لخزانة بطولاتك في ملفك الشخصي!`
                : `You officially won ${w.trophy} for your incredible performance in ${previousSeasonName}. Added to your Trophy Cabinet!`,
              read: false,
              createdAt: serverTimestamp(),
              link: `/profile?uid=${w.uid}`
            });
          } catch (e) {
            console.warn("Error sending winner notification:", e);
          }
        }
      }

      if (sendCommunityBroadcast) {
        // Send a community-wide announcement
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
          
          // Send notification to ALL players
          players.forEach(async (p) => {
            try {
              const notifRef = doc(db, `users/${p.uid}/notifications`, `season_start_${currentYear}_${Date.now()}_${Math.random().toString(36).substring(2,6)}`);
              await setDoc(notifRef, {
                type: 'admin',
                title: isAr ? `🚀 انطلاق الموسم الجديد: ${seasonName}!` : `🚀 New Season Started: ${seasonName}!`,
                body: isAr
                  ? `مرحباً بك في الموسم الجديد! إحصائياتك جاهزة للبدء من الصفر. بالتوفيق في الوصول للقمة والمنافسة على الألقاب!`
                  : `Welcome to the new season! Your stats are fresh and ready. Good luck reaching the top and competing for titles!`,
                read: false,
                createdAt: serverTimestamp()
              });
            } catch (e) {}
          });

        } catch (e) {
          console.warn("Could not post season broadcast announcement:", e);
        }
      }

      onRefresh();
      
      // Confetti effect to celebrate the new season!
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-400">
                <Trophy className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>{isFirstSeason 
                    ? (isAr ? "بدء الموسم الأول" : "Start First Season")
                    : (isAr ? "حفل تتويج الأبطال وخاتمة الموسم" : "Season Ceremony & Champions Coronation")
                  }</span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </h2>
                <p className="text-xs text-amber-300/80 font-medium">
                  {isFirstSeason
                    ? (isAr ? `بدء ${seasonName} للمجتمع` : `Starting ${seasonName} for the community`)
                    : (isAr
                        ? `توزيع جوائز ${previousSeasonName} وتصفير الإحصائيات لانطلاق ${seasonName}`
                        : `Awarding ${previousSeasonName} trophies & launching ${seasonName}`
                      )
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Wizard Steps Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 py-3 gap-4">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                step === 1 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>1</span>
              <span>{isAr ? "منصة الأبطال" : "Podium & Winners"}</span>
            </button>
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                step === 2 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>2</span>
              <span>{isAr ? "إشعارات التتويج" : "Ceremony Notifications"}</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                step === 3 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>3</span>
              <span>{isAr ? "التنفيذ والتصفير" : "Execute & Launch"}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs flex items-center gap-3">
                  <Award className="w-6 h-6 shrink-0 text-amber-400" />
                  <span>
                    {isAr
                      ? "تم حساب الفائزين تلقائياً بناءً على إحصائيات الأهداف، الصناعة، ومرات الفوز بأفضل لاعب في الموسم. سيتم إضافة هذه الألقاب لخزانة جوائزهم في ملفهم الشخصي فور الاعتماد."
                      : "Winners calculated automatically from season stats (Goals, Assists, MVPs). Trophies will be permanently added to their profiles."}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ballon d'Or */}
                  <div className="p-5 bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/40 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-3xl opacity-20">👑</div>
                    <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-2xl font-black text-slate-950 shadow-lg shrink-0">
                      👑
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                        {isAr ? "الكرة الذهبية (Ballon d'Or)" : "Ballon d'Or"}
                      </div>
                      <div className="text-lg font-black text-white truncate mt-0.5">
                        {winners.ballonDor ? (winners.ballonDor.cardName || winners.ballonDor.fullName) : (isAr ? "لا يوجد بيانات كافية" : "No Qualifying Player")}
                      </div>
                      {winners.ballonDor && (
                        <div className="text-xs text-amber-300/80 mt-1 flex items-center gap-3 font-semibold">
                          <span>⚽ {winners.ballonDor.stats?.goals || 0}</span>
                          <span>👟 {winners.ballonDor.stats?.assists || 0}</span>
                          <span>⭐ {winners.ballonDor.stats?.mvp || 0} MOTM</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Golden Boot */}
                  <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl font-black shrink-0">
                      ⚽
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                        {isAr ? "الحذاء الذهبي (الهداف)" : "Golden Boot"}
                      </div>
                      <div className="text-lg font-black text-white truncate mt-0.5">
                        {winners.topScorer ? (winners.topScorer.cardName || winners.topScorer.fullName) : (isAr ? "لا يوجد أهداف" : "No goals recorded")}
                      </div>
                      {winners.topScorer && (
                        <div className="text-xs text-emerald-300 mt-1 font-bold">
                          {winners.topScorer.stats?.goals || 0} {isAr ? "أهداف" : "Goals"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Playmaker */}
                  <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl font-black shrink-0">
                      🎯
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
                        {isAr ? "أفضل صانع ألعاب" : "Top Playmaker"}
                      </div>
                      <div className="text-lg font-black text-white truncate mt-0.5">
                        {winners.topAssister ? (winners.topAssister.cardName || winners.topAssister.fullName) : (isAr ? "لا يوجد تمريرات" : "No assists recorded")}
                      </div>
                      {winners.topAssister && (
                        <div className="text-xs text-cyan-300 mt-1 font-bold">
                          {winners.topAssister.stats?.assists || 0} {isAr ? "تمريرة حاسمة" : "Assists"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Season MVP */}
                  <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                    <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl font-black shrink-0">
                      ⭐
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
                        {isAr ? "رجل الموسم (MVP)" : "Season MVP"}
                      </div>
                      <div className="text-lg font-black text-white truncate mt-0.5">
                        {winners.topMVP ? (winners.topMVP.cardName || winners.topMVP.fullName) : (isAr ? "لا يوجد جوائز رجل مباراة" : "No MOTM recorded")}
                      </div>
                      {winners.topMVP && (
                        <div className="text-xs text-purple-300 mt-1 font-bold">
                          {winners.topMVP.stats?.mvp || 0} {isAr ? "مرة أفضل لاعب" : "MOTM Awards"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-300 text-xs flex items-center gap-3">
                  <Send className="w-6 h-6 shrink-0 text-cyan-400" />
                  <span>
                    {isAr
                      ? "تحكم في الإشعارات التلقائية التي سيتم إرسالها لأعضاء مجتمعك فور تتويج الأبطال وبدء الموسم."
                      : "Configure automatic congratulatory notifications and broadcast announcements."}
                  </span>
                </div>

                <div className="space-y-4">
                  <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-colors ${sendWinnerNotifs ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/80 border-slate-700 hover:border-amber-500/30'}`}>
                    <div className="relative mt-1 flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 shadow-inner"
                         style={{
                           backgroundColor: sendWinnerNotifs ? '#10b981' : '#334155'
                         }}>
                      <input
                        type="checkbox"
                        checked={sendWinnerNotifs}
                        onChange={e => setSendWinnerNotifs(e.target.checked)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      />
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                        animate={{ x: sendWinnerNotifs ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {sendWinnerNotifs && <CheckCircle2 className="w-3 h-3 text-emerald-500" strokeWidth={4} />}
                      </motion.div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{isAr ? "إشعارات التهنئة الفردية للأبطال الفائزين 🏆" : "Personal Winner Notifications 🏆"}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? "إرسال إشعار فوري لكل فائز (الهداف، أفضل صانع ألعاب، إلخ) يهنئه باللقب ويعلمه بإضافته لملفه الشخصي."
                          : "Dispatch instant notifications to each trophy winner congratulating them and announcing the new profile trophy."}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-colors ${sendCommunityBroadcast ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/80 border-slate-700 hover:border-amber-500/30'}`}>
                    <div className="relative mt-1 flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 shadow-inner"
                         style={{
                           backgroundColor: sendCommunityBroadcast ? '#8b5cf6' : '#334155' // violet-500
                         }}>
                      <input
                        type="checkbox"
                        checked={sendCommunityBroadcast}
                        onChange={e => setSendCommunityBroadcast(e.target.checked)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      />
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                        animate={{ x: sendCommunityBroadcast ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {sendCommunityBroadcast && <CheckCircle2 className="w-3 h-3 text-violet-500" strokeWidth={4} />}
                      </motion.div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{isAr ? "إعلان عام للمجتمع ببدء الموسم الجديد 📢" : "Community Announcement Broadcast 📢"}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? `نشر إعلان رسمي في صفحة الإعلانات يعلن ختام ${previousSeasonName} وتتويج الأبطال وانطلاق منافسات ${seasonName} الجديد.`
                          : `Publish an official community post announcing ${previousSeasonName} winners and kicking off ${seasonName}.`}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 shadow-xl animate-pulse">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {isFirstSeason 
                      ? (isAr ? "هل أنت مستعد لبدء الموسم الأول؟" : "Ready to Start the First Season?")
                      : (isAr ? "هل أنت مستعد لاعتماد التتويج وبدء الموسم؟" : "Ready to Crown Champions & Launch Season?")
                    }
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    {isFirstSeason
                      ? (isAr
                          ? `سيتم بدء ${seasonName} وإحصائيات جميع اللاعبين ستبدأ من الصفر.`
                          : `This will start ${seasonName} and all player stats will begin from zero.`
                        )
                      : (isAr
                          ? `سيتم حفظ ألقاب ${previousSeasonName} الدائمة، وإرسال الإشعارات، وتصفير إحصائيات الأهداف والصناعة لجميع اللاعبين لبدء ${seasonName}.`
                          : `This will permanently archive ${previousSeasonName} trophies, dispatch notifications, and reset stats to 0 to launch ${seasonName}.`
                        )
                    }
                  </p>
                </div>

                {!isFirstSeason && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs flex items-center gap-3 text-start">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
                    <span>
                      {isAr
                        ? "تنبيه: تصفير الإحصائيات لا يمكن التراجع عنه، ولكن ستظل ألقاب وجوائز اللاعبين محفوظة للأبد في ملفاتهم وأرشيف المجتمع."
                        : "Note: Resetting stats cannot be undone, but awarded trophies and season history will remain permanently archived."}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                disabled={isExecuting}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
              >
                {isAr ? "السابق" : "Previous"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isExecuting}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as any)}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <span>{isAr ? "التالي" : "Next Step"}</span>
                <span>➔</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteCeremony}
                disabled={isExecuting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Trophy className="w-5 h-5 animate-bounce" />
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
