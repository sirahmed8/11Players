import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerProfile } from '@/types';

interface RecordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: any;
}

export default function RecordStatsModal({ isOpen, onClose, matchData }: RecordStatsModalProps) {
  // Store stats incrementally per player: uid -> { goals, assists, mvp, played }
  const [stats, setStats] = useState<Record<string, { goals: number; assists: number; mvp: boolean; played: boolean }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && matchData) {
      const initialStats: any = {};
      const allPlayers = [
        ...(matchData.teamA || []),
        ...(matchData.teamB || []),
        ...(matchData.bench || []).map((b: any) => b.player),
      ];
      
      allPlayers.forEach(p => {
        initialStats[p.uid] = {
          goals: 0,
          assists: 0,
          mvp: false,
          // By default, starters played. Bench didn't.
          played: !matchData.bench?.some((b: any) => b.player.uid === p.uid),
        };
      });
      setStats(initialStats);
    }
  }, [isOpen, matchData]);

  if (!isOpen || !matchData) return null;

  const allPlayers = [
    ...(matchData.teamA || []),
    ...(matchData.teamB || []),
    ...(matchData.bench || []).map((b: any) => b.player),
  ];

  const updateStat = (uid: string, field: string, val: any) => {
    setStats(prev => ({
      ...prev,
      [uid]: { ...prev[uid], [field]: val }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update each player's stats
      for (const p of allPlayers) {
        const pStats = stats[p.uid];
        if (!pStats) continue;
        
        // If they didn't play at all, don't update anything
        if (!pStats.played && pStats.goals === 0 && pStats.assists === 0 && !pStats.mvp) {
          continue;
        }

        const ref = doc(db, 'players', p.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const currentData = snap.data() as PlayerProfile;
          const currentStats = currentData.stats || { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 };
          
          await updateDoc(ref, {
            stats: {
              goals: currentStats.goals + pStats.goals,
              assists: currentStats.assists + pStats.assists,
              mvp: currentStats.mvp + (pStats.mvp ? 1 : 0),
              matchesPlayed: currentStats.matchesPlayed + (pStats.played ? 1 : 0),
            }
          });
        }
      }

      // 2. Clear the match or mark as finished
      await deleteDoc(doc(db, "system", "latestMatch"));

      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save stats.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Record Match Stats</h2>
          <p className="text-slate-500">Update goals, assists, and MVP for the completed match.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {allPlayers.map(p => {
            const isBench = matchData.bench?.some((b: any) => b.player.uid === p.uid);
            return (
              <div key={p.uid} className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border ${isBench ? 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                <div className="flex items-center gap-3 w-48">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    {p.photoUrl && <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{p.cardName}</div>
                    <div className="text-xs text-slate-500">{isBench ? 'Bench' : p.assignedPosition}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Played Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={stats[p.uid]?.played || false} onChange={e => updateStat(p.uid, 'played', e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Played</span>
                  </label>

                  {/* Goals */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">⚽ Goals</span>
                    <input type="number" min="0" value={stats[p.uid]?.goals || 0} onChange={e => updateStat(p.uid, 'goals', parseInt(e.target.value) || 0)} className="w-16 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-center" />
                  </div>

                  {/* Assists */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">👟 Assists</span>
                    <input type="number" min="0" value={stats[p.uid]?.assists || 0} onChange={e => updateStat(p.uid, 'assists', parseInt(e.target.value) || 0)} className="w-16 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-center" />
                  </div>

                  {/* MVP */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={stats[p.uid]?.mvp || false} onChange={e => updateStat(p.uid, 'mvp', e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-500">MVP 🏅</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 disabled:opacity-50">
            {saving ? 'Saving...' : 'End Match & Save Stats'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
