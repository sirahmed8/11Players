"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trash2, Eye, Calendar, MapPin } from "lucide-react";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface MatchHistoryProps {
  historyLoading: boolean;
  historyMatches: any[];
  isAr: boolean;
  isAdmin: boolean;
  activeCommunityId: string | null;
  onSelectHistoryMatch: (match: any) => void;
}

export default function MatchHistory({
  historyLoading,
  historyMatches,
  isAr,
  isAdmin,
  activeCommunityId,
  onSelectHistoryMatch,
}: MatchHistoryProps) {
  if (historyLoading) return <SiteSkeletonLoader variant="match" />;

  if (historyMatches.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center gap-4">
        <span className="text-5xl">📜</span>
        <h3 className="text-xl font-black text-white">
          {isAr ? "لا توجد مباريات مسجلة في السجل بعد" : "No Match History Found"}
        </h3>
        <p className="text-xs text-slate-400 max-w-md font-medium">
          {isAr ? "ستظهر هنا جميع المباريات السابقة وإحصائياتها بمجرد إنهاء المباريات." : "All past matches will appear here once matches are finished."}
        </p>
      </div>
    );
  }

  const handleDeleteHistoryMatch = async (mId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeCommunityId) return;
    if (!confirm(isAr ? 'هل تريد حذف هذه المباراة نهائياً؟' : 'Delete this match permanently?')) return;
    try {
      await deleteDoc(doc(db, 'communities', activeCommunityId, 'matches', mId));
      toast.success(isAr ? "تم حذف المباراة من السجل" : "Match deleted from history");
    } catch (err) {
      console.error('Failed to delete match:', err);
      toast.error(isAr ? 'فشل في حذف المباراة' : 'Failed to delete match');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {historyMatches.map((m) => {
        const isFinished = m.status === 'finished' || m.recordedStats;
        const scoreA = m.recordedStats?.teamAScore;
        const scoreB = m.recordedStats?.teamBScore;
        const hasScore = typeof scoreA === 'number' && typeof scoreB === 'number';

        return (
          <div
            key={m.id}
            className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{m.config?.date || new Date(m.finishedAt || m.generatedAt || Date.now()).toLocaleDateString()}</span>
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                  isFinished 
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' 
                    : 'bg-amber-950 text-amber-400 border-amber-500/40'
                }`}>
                  <span>{isFinished ? '✅' : '⏳'}</span>
                  <span>{isFinished ? (isAr ? 'مكتملة' : 'Finished') : (isAr ? 'مسجلة' : 'Recorded')}</span>
                </span>
              </div>

              {m.config?.location && (
                <p className="text-xs text-slate-400 mb-4 flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{m.config.location}</span>
                </p>
              )}

              {/* Matchup Score Card */}
              <div className="bg-slate-950 rounded-2xl p-4 my-4 flex items-center justify-between border border-slate-800">
                <div className="text-center flex-1">
                  <p className="text-xs font-black text-cyan-400 mb-1">Team A</p>
                  <span className="text-[10px] font-mono bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-800 font-bold">
                    {m.formation?.teamA || '4-3-3'}
                  </span>
                </div>

                <div className="px-3 flex flex-col items-center justify-center">
                  {hasScore ? (
                    <div className="flex items-center gap-2 bg-amber-600 text-slate-950 font-black text-base px-3.5 py-1 rounded-xl shadow">
                      <span>{scoreA}</span>
                      <span>-</span>
                      <span>{scoreB}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs text-slate-400">
                      VS
                    </div>
                  )}
                </div>

                <div className="text-center flex-1">
                  <p className="text-xs font-black text-rose-400 mb-1">Team B</p>
                  <span className="text-[10px] font-mono bg-slate-900 text-rose-300 px-2 py-0.5 rounded border border-slate-800 font-bold">
                    {m.formation?.teamB || '4-4-2'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onSelectHistoryMatch(m)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl border border-slate-800 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? "عرض تفاصيل المباراة" : "View Full Details"}</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteHistoryMatch(m.id, e)}
                  className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 text-xs font-bold rounded-2xl border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حذف المباراة' : 'Delete Match'}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
