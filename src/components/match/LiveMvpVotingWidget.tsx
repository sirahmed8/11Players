"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Vote, CheckCircle2, Flame, Award } from "lucide-react";
import { soundFx } from "@/lib/soundEffects";

export interface MvpCandidate {
  uid: string;
  name: string;
  position: string;
  ovr: number;
  goals?: number;
  assists?: number;
  votes: number;
}

export interface LiveMvpVotingWidgetProps {
  candidates?: MvpCandidate[];
  onVoteCast?: (candidateUid: string) => void;
}

const DEFAULT_CANDIDATES: MvpCandidate[] = [
  { uid: "c1", name: "M. Salah", position: "RWF", ovr: 92, goals: 2, assists: 1, votes: 14 },
  { uid: "c2", name: "O. Marmoush", position: "CF", ovr: 88, goals: 1, assists: 2, votes: 9 },
  { uid: "c3", name: "K. De Bruyne", position: "CMF", ovr: 91, goals: 0, assists: 3, votes: 7 },
  { uid: "c4", name: "K. El-Sayed", position: "GK", ovr: 84, goals: 0, assists: 0, votes: 4 },
];

export const LiveMvpVotingWidget: React.FC<LiveMvpVotingWidgetProps> = ({
  candidates: initialCandidates,
  onVoteCast,
}) => {
  const [candidatesList, setCandidatesList] = useState<MvpCandidate[]>(initialCandidates || DEFAULT_CANDIDATES);
  const [userVotedUid, setUserVotedUid] = useState<string | null>(null);

  const totalVotes = candidatesList.reduce((acc, c) => acc + c.votes, 0);

  const handleVote = (candidateUid: string) => {
    if (userVotedUid) return;
    soundFx.playGoal();
    setUserVotedUid(candidateUid);

    setCandidatesList((prev) =>
      prev.map((c) => (c.uid === candidateUid ? { ...c, votes: c.votes + 1 } : c))
    );

    if (onVoteCast) onVoteCast(candidateUid);
  };

  return (
    <div className="w-full glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Man of the Match Poll
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                LIVE FAN VOTE
              </span>
            </h3>
            <p className="text-slate-400 text-xs">{totalVotes} Total Votes Cast</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {candidatesList.map((candidate) => {
          const votePercentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
          const isSelected = userVotedUid === candidate.uid;

          return (
            <motion.div
              key={candidate.uid}
              whileHover={{ scale: 1.01 }}
              onClick={() => handleVote(candidate.uid)}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                isSelected
                  ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Background Progress Fill */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-emerald-500/10 transition-all duration-700"
                style={{ width: `${votePercentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center border shadow-md ${
                      candidate.ovr >= 85
                        ? "bg-amber-500 text-slate-950 border-amber-300"
                        : "bg-emerald-600 text-white border-emerald-400"
                    }`}
                  >
                    {candidate.ovr}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{candidate.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        {candidate.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {candidate.goals !== undefined && <span>⚽ {candidate.goals} Goals</span>}
                      {candidate.assists !== undefined && <span>👟 {candidate.assists} Assists</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">{votePercentage}%</span>
                    <span className="text-[10px] text-slate-500 block">{candidate.votes} votes</span>
                  </div>

                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveMvpVotingWidget;
