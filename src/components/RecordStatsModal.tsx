"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, deleteDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerProfile } from '@/types';
import { Target, Handshake, Trophy, X, CheckCircle, Shield, Check } from 'lucide-react';
import { useCommunity } from '@/contexts/CommunityContext';
import { useLocale } from '@/components/ThemeProvider';
import { calculateRealisticOverall } from '@/lib/overallCalculator';
import toast from 'react-hot-toast';

interface RecordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
}

export default function RecordStatsModal({ isOpen, onClose, matchData }: RecordStatsModalProps) {
  const { activeCommunityId } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  // Store stats incrementally per player: uid -> { goals, assists, mvp, played }
  const [stats, setStats] = useState<Record<string, { goals: number; assists: number; mvp: boolean; played: boolean }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && matchData) {
      const initialStats: any = {};
      const allPlayers = [
        ...(matchData.teamA || []),
        ...(matchData.teamB || []),
        ...(matchData.bench || []).map((b: any) => b.player || b),
      ];
      
      allPlayers.forEach(p => {
        if (!p || !p.uid) return;
        const isBench = matchData.bench?.some((b: any) => (b.player?.uid || b.uid) === p.uid);
        initialStats[p.uid] = {
          goals: 0,
          assists: 0,
          mvp: false,
          played: !isBench,
        };
      });
      setStats(initialStats);
    }
  }, [isOpen, matchData]);

  if (!isOpen || !matchData) return null;

  const allPlayers = [
    ...(matchData.teamA || []),
    ...(matchData.teamB || []),
    ...(matchData.bench || []).map((b: any) => b.player || b),
  ].filter(p => p && p.uid);

  const updateStat = (uid: string, field: string, val: any) => {
    setStats(prev => ({
      ...prev,
      [uid]: { ...prev[uid], [field]: val }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);

      const activePlayers = allPlayers.filter(p => {
        const pStats = stats[p.uid];
        return pStats && (pStats.played || pStats.goals > 0 || pStats.assists > 0 || pStats.mvp);
      });

      const snaps = await Promise.all(
        activePlayers.map(p => getDoc(doc(db, 'players', p.uid)).catch(() => null))
      );

      for (let i = 0; i < activePlayers.length; i++) {
        const p = activePlayers[i];
        const pStats = stats[p.uid];
        if (!pStats) continue;

        const globalSnap = snaps[i];
        const currentData = globalSnap && globalSnap.exists() ? globalSnap.data() : {};
        const currentStats = currentData.stats || p.stats || {};

        const newStats: any = { ...currentStats };
        if (pStats.goals > 0) newStats.goals = (currentStats.goals || 0) + Number(pStats.goals);
        if (pStats.assists > 0) newStats.assists = (currentStats.assists || 0) + Number(pStats.assists);
        if (pStats.mvp) newStats.mvp = (currentStats.mvp || 0) + 1;
        if (pStats.played) newStats.matchesPlayed = (currentStats.matchesPlayed || 0) + 1;

        const activeAttr = currentData.approvedAttributes || currentData.attributes || p.approvedAttributes || p.attributes || {};
        const newOverall = calculateRealisticOverall(activeAttr, currentData.primaryPosition || p.primaryPosition || 'CMF', currentData.playStyle || p.playStyle || '');

        const globalRef = doc(db, 'players', p.uid);
        batch.set(globalRef, { stats: newStats, overallRating: newOverall }, { merge: true });
        if (activeCommunityId) {
          const commRef = doc(db, 'communities', activeCommunityId, 'players', p.uid);
          batch.set(commRef, { stats: newStats, overallRating: newOverall }, { merge: true });
        }
      }

      if (activeCommunityId) {
        const targetMatchId = (matchData.id && matchData.id !== "latest") ? matchData.id : `match_${Date.now()}`;
        const historyRef = doc(db, "communities", activeCommunityId, "matches", targetMatchId);
        batch.set(historyRef, { ...matchData, id: targetMatchId, status: "finished", finishedAt: new Date().toISOString(), recordedStats: stats }, { merge: true });
        
        const latestMatchRef = doc(db, "communities", activeCommunityId, "matches", "latest");
        batch.delete(latestMatchRef);
      }

      await batch.commit();
      toast.success(isAr ? "تم حفظ إحصائيات المباراة وإنهاء المباراة بنجاح!" : "Match ended & stats recorded successfully!");
      onClose();
    } catch (e) {
      console.error("Failed to save stats:", e);
      toast.error(isAr ? "فشل حفظ إحصائيات المباراة." : "Failed to save stats.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose} dir={isAr ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-7 h-7 text-amber-500" />
                {isAr ? 'تسجيل إحصائيات المباراة' : 'Record Match Stats'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'تحديث الأهداف، التمريرات الحاسمة، وأفضل لاعب للمباراة المكتملة.' : 'Update goals, assists, and MVP for the completed fixture.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {allPlayers.map(p => {
              const isBench = matchData.bench?.some((b: any) => (b.player?.uid || b.uid) === p.uid);
              const pStats = stats[p.uid] || { goals: 0, assists: 0, mvp: false, played: !isBench };
              return (
                <motion.div
                  key={p.uid}
                  whileHover={{ scale: 1.005 }}
                  className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    isBench
                      ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 opacity-85'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80'
                  } ${pStats.mvp ? 'ring-2 ring-amber-500/80 border-amber-500/50 bg-amber-500/5' : ''}`}
                >
                  <div className="flex items-center gap-3 w-52">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 overflow-hidden shadow-sm flex-shrink-0">
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-[14px] overflow-hidden flex items-center justify-center">
                        {p.photoUrl ? (
                          <Image src={p.photoUrl} alt="" className="w-full h-full object-cover" width={44} height={44} referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-black text-sm text-slate-500">{p.cardName?.slice(0, 2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{p.cardName || p.fullName}</div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isBench ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'}`}>
                          {isBench ? (isAr ? 'دكة' : 'Bench') : (p.assignedPosition || p.primaryPosition)}
                        </span>
                        <span>• OVR {calculateRealisticOverall(p.approvedAttributes || p.attributes || {}, p.primaryPosition || 'CMF', p.playStyle || '')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    {/* Played Toggle Button */}
                    <button
                      type="button"
                      onClick={() => updateStat(p.uid, 'played', !pStats.played)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 shadow-sm border ${
                        pStats.played
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-emerald-500/10 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 hover:text-emerald-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${pStats.played ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'}`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{isAr ? 'شارك' : 'Played'}</span>
                    </button>

                    {/* Goals */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Target className="w-4 h-4 text-emerald-500" /> {isAr ? 'أهداف' : 'Goals'}
                      </span>
                      <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner p-0.5">
                        <button
                          onClick={() => updateStat(p.uid, 'goals', Math.max(0, pStats.goals - 1))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-black text-base shadow-sm active:scale-95"
                        >−</button>
                        <div className="w-8 text-center font-black text-slate-900 dark:text-white text-base">
                          {pStats.goals}
                        </div>
                        <button
                          onClick={() => updateStat(p.uid, 'goals', pStats.goals + 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-black text-base shadow-sm active:scale-95"
                        >+</button>
                      </div>
                    </div>

                    {/* Assists */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Handshake className="w-4 h-4 text-blue-500" /> {isAr ? 'صناعة' : 'Assists'}
                      </span>
                      <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner p-0.5">
                        <button
                          onClick={() => updateStat(p.uid, 'assists', Math.max(0, pStats.assists - 1))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-black text-base shadow-sm active:scale-95"
                        >−</button>
                        <div className="w-8 text-center font-black text-slate-900 dark:text-white text-base">
                          {pStats.assists}
                        </div>
                        <button
                          onClick={() => updateStat(p.uid, 'assists', pStats.assists + 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-black text-base shadow-sm active:scale-95"
                        >+</button>
                      </div>
                    </div>

                    {/* MVP Toggle Button */}
                    <button
                      type="button"
                      onClick={() => updateStat(p.uid, 'mvp', !pStats.mvp)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 shadow-sm border ${
                        pStats.mvp
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-amber-500/10 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-amber-500/40 hover:text-amber-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${pStats.mvp ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'}`}>
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <span>MVP</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-6 font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3.5 px-6 font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isAr ? 'جاري الحفظ السريع...' : 'Saving Stats...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {isAr ? 'إنهاء المباراة وحفظ الإحصائيات' : 'End Match & Save Stats'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
