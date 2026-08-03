"use client";

import React, { useState, useEffect } from "react";
import { Vote, CheckCircle2 } from "lucide-react";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface MatchPredictionWidgetProps {
  matchId: string;
  communityId: string;
  userUid?: string;
  isAr: boolean;
}

export default function MatchPredictionWidget({
  matchId,
  communityId,
  userUid,
  isAr,
}: MatchPredictionWidgetProps) {
  const [votes, setVotes] = useState<{ teamA: number; teamB: number; draw: number; userVote: string | null }>({
    teamA: 0,
    teamB: 0,
    draw: 0,
    userVote: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId || !matchId) return;

    const predRef = doc(db, "communities", communityId, "predictions", matchId);
    
    // Real-time Firestore snapshot subscription
    const unsubscribe = onSnapshot(
      predRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const voterMap = data.voters || {};
          let a = 0, b = 0, d = 0;
          Object.values(voterMap).forEach((v) => {
            if (v === 'teamA') a++;
            else if (v === 'teamB') b++;
            else if (v === 'draw') d++;
          });
          setVotes({
            teamA: a,
            teamB: b,
            draw: d,
            userVote: userUid ? voterMap[userUid] || null : null,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Prediction realtime sync error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [communityId, matchId, userUid]);

  const handleVote = async (choice: 'teamA' | 'teamB' | 'draw') => {
    if (!userUid) {
      toast.error(isAr ? "يرجى تسجيل الدخول للتصويت" : "Please log in to vote");
      return;
    }
    if (!communityId || !matchId) return;

    try {
      const predRef = doc(db, "communities", communityId, "predictions", matchId);
      const snap = await getDoc(predRef);
      const currentVoters = snap.exists() ? snap.data().voters || {} : {};

      const newVoters = { ...currentVoters, [userUid]: choice };
      await setDoc(predRef, { matchId, voters: newVoters, updatedAt: new Date().toISOString() }, { merge: true });

      toast.success(isAr ? "تم تسجيل توقعك بنجاح! 🗳️" : "Your prediction vote was recorded! 🗳️");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل تسجيل التوقع" : "Failed to record vote");
    }
  };

  const total = votes.teamA + votes.teamB + votes.draw || 1;
  const pctA = Math.round((votes.teamA / total) * 100);
  const pctB = Math.round((votes.teamB / total) * 100);
  const pctD = Math.round((votes.draw / total) * 100);
  const totalVotesCount = votes.teamA + votes.teamB + votes.draw;

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4 backdrop-blur-xl"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-black">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {isAr ? "توقعات الجماهير" : "Pre-Match Predictions"}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {isAr ? "من تتوقع أن يفوز بالمباراة القادمة؟" : "Who will win the upcoming match?"}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-950 text-emerald-400 px-3 py-1 rounded-full border border-slate-800 shadow-inner">
          {totalVotesCount} {isAr ? "صوت" : "Votes"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Team A Option */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleVote('teamA')}
          className={`p-4 rounded-2xl border text-center transition-all relative overflow-hidden ${
            votes.userVote === 'teamA'
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <span className="block text-xs font-black mb-1">Team A</span>
          <span className="text-xl font-black font-mono block text-white">{pctA}%</span>

          <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {votes.userVote === 'teamA' && (
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] font-bold text-cyan-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? "توقعك" : "Voted"}</span>
            </div>
          )}
        </motion.button>

        {/* Draw Option */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleVote('draw')}
          className={`p-4 rounded-2xl border text-center transition-all relative overflow-hidden ${
            votes.userVote === 'draw'
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <span className="block text-xs font-black mb-1">{isAr ? "تعادل" : "Draw"}</span>
          <span className="text-xl font-black font-mono block text-white">{pctD}%</span>

          <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${pctD}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {votes.userVote === 'draw' && (
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] font-bold text-amber-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? "توقعك" : "Voted"}</span>
            </div>
          )}
        </motion.button>

        {/* Team B Option */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleVote('teamB')}
          className={`p-4 rounded-2xl border text-center transition-all relative overflow-hidden ${
            votes.userVote === 'teamB'
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <span className="block text-xs font-black mb-1">Team B</span>
          <span className="text-xl font-black font-mono block text-white">{pctB}%</span>

          <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-rose-400"
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {votes.userVote === 'teamB' && (
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] font-bold text-rose-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? "توقعك" : "Voted"}</span>
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
