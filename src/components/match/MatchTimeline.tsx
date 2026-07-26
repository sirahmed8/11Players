"use client";

import React from "react";

interface TimelineEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red';
  playerName: string;
  team: 'A' | 'B';
}

interface MatchTimelineProps {
  events?: TimelineEvent[];
  isAr: boolean;
}

export default function MatchTimeline({ events = [], isAr }: MatchTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
      <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
        <span>⏱️</span>
        <span>{isAr ? "الجدول الزمني لأحداث المباراة" : "Match Event Timeline"}</span>
      </h3>
      <div className="space-y-2">
        {events.map((ev, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-mono text-[10px]">
                {ev.minute}'
              </span>
              <span className="text-white">{ev.playerName}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                ev.team === 'A' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
              }`}>
                Team {ev.team}
              </span>
            </div>
            <div>
              {ev.type === 'goal' && <span className="text-emerald-400">⚽ Goal</span>}
              {ev.type === 'yellow' && <span className="text-yellow-400">🟨 Yellow Card</span>}
              {ev.type === 'red' && <span className="text-rose-400">🟥 Red Card</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
