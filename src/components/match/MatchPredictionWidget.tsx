"use client";

import React, { useState, useEffect } from "react";
import { Vote, Sparkles, CheckCircle2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

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
    const fetchPredictionVotes = async () => {
      try {
        const predRef = doc(db, "communities", communityId, "predictions", matchId);
        const snap = await getDoc(predRef);
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
      } catch (err) {
        console.error("Prediction fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictionVotes();
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

      let a = 0, b = 0, d = 0;
      Object.values(newVoters).forEach((v) => {
        if (v === 'teamA') a++;
        else if (v === 'teamB') b++;
        else if (v === 'draw') d++;
      });

      setVotes({ teamA: a, teamB: b, draw: d, userVote: choice });
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

  if (loading) return null;

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
            <Vote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">
              {isAr ? "توقعات الجماهير (Match Prediction)" : "Pre-Match Prediction Poll"}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              {isAr ? "من تتوقع أن يفوز بالمباراة القادمة؟" : "Who will win the upcoming match?"}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-950 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-800">
          {votes.teamA + votes.teamB + votes.draw} {isAr ? "صوت" : "Votes"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleVote('teamA')}
          className={`p-3.5 rounded-2xl border text-center transition-all ${
            votes.userVote === 'teamA'
              ? 'bg-cyan-950 border-cyan-500 text-cyan-400 shadow'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <span className="block text-xs font-black mb-1">Team A</span>
          <span className="text-lg font-black font-mono block">{pctA}%</span>
          {votes.userVote === 'teamA' && <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1 text-cyan-400" />}
        </button>

        <button
          type="button"
          onClick={() => handleVote('draw')}
          className={`p-3.5 rounded-2xl border text-center transition-all ${
            votes.userVote === 'draw'
              ? 'bg-amber-950 border-amber-500 text-amber-400 shadow'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <span className="block text-xs font-black mb-1">{isAr ? "تعادل" : "Draw"}</span>
          <span className="text-lg font-black font-mono block">{pctD}%</span>
          {votes.userVote === 'draw' && <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1 text-amber-400" />}
        </button>

        <button
          type="button"
          onClick={() => handleVote('teamB')}
          className={`p-3.5 rounded-2xl border text-center transition-all ${
            votes.userVote === 'teamB'
              ? 'bg-rose-950 border-rose-500 text-rose-400 shadow'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <span className="block text-xs font-black mb-1">Team B</span>
          <span className="text-lg font-black font-mono block">{pctB}%</span>
          {votes.userVote === 'teamB' && <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1 text-rose-400" />}
        </button>
      </div>
    </div>
  );
}
