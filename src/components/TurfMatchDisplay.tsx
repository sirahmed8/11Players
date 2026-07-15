"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, RotateCw, Trophy, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import type { TurfMatchmakingResult, TurfTeam } from '@/lib/turfMatchmaker';

interface TurfMatchDisplayProps {
  turfResult: TurfMatchmakingResult;
  isAr?: boolean;
}

const OVR_BADGE = ({ ovr }: { ovr: number }) => {
  const color =
    ovr >= 80 ? 'bg-amber-400 text-black' :
    ovr >= 70 ? 'bg-emerald-500 text-white' :
    ovr >= 60 ? 'bg-blue-500 text-white' :
    'bg-slate-500 text-white';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${color}`}>
      {ovr}
    </span>
  );
};

const TeamCard = ({ team, isAr, gkMode }: { team: TurfTeam; isAr: boolean; gkMode: string }) => {
  const [expanded, setExpanded] = useState(true);

  const teamColorClass = (() => {
    const colors = [
      'from-emerald-600 to-teal-600',
      'from-blue-600 to-indigo-600',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-600',
    ];
    const idx = parseInt(team.id.replace('team_', '')) - 1;
    return colors[idx % colors.length];
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Team Header */}
      <div className={`bg-gradient-to-r ${teamColorClass} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{team.name}</h3>
            <p className="text-xs text-white/80">
              {isAr ? `متوسط التقييم: ${team.avgOvr}` : `Avg OVR: ${team.avgOvr}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-black text-white">{team.avgOvr}</div>
            <div className="text-xs text-white/70">{isAr ? 'متوسط OVR' : 'Avg OVR'}</div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Players List */}
      {expanded && (
        <div className="p-4 space-y-2">
          {team.players.map((player, idx) => {
            const isGk = gkMode === 'rotating'
              ? team.gkOrder[0]?.uid === player.uid // First in rotation is current GK
              : idx === team.players.length - 1; // Last added as fixed GK

            const ovr = Math.round(
              Object.values(player.attributes || {}).reduce((a: number, b: number) => a + b, 0) / 
              Math.max(1, Object.values(player.attributes || {}).length)
            );

            return (
              <div
                key={player.uid}
                className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-black text-slate-500">
                      {(player.cardName || player.fullName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {player.cardName || player.fullName}
                    </span>
                    {isGk && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md">
                        🥅 GK
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {player.primaryPosition}
                  </div>
                </div>
                <OVR_BADGE ovr={ovr || 60} />
              </div>
            );
          })}
        </div>
      )}

      {/* GK Rotation Order */}
      {gkMode === 'rotating' && expanded && team.gkOrder.length > 1 && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
            <div className="text-xs font-black text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              {isAr ? 'ترتيب دوران حارس المرمى:' : 'GK Rotation Order:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {team.gkOrder.map((player, i) => (
                <span
                  key={player.uid}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    i === 0
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {i + 1}. {player.cardName || player.fullName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function TurfMatchDisplay({ turfResult, isAr = false }: TurfMatchDisplayProps) {
  const [showFixtures, setShowFixtures] = useState(true);

  const {
    teams,
    fixtures,
    matchType,
    numTeams,
    playersPerTeam,
    gkMode,
    gkRotationInterval,
    matchDurationMins
  } = turfResult;

  const formatLabel = isAr
    ? `${numTeams} فرق × ${playersPerTeam} لاعبين — ${matchDurationMins} دق — ${gkMode === 'rotating' ? `دوران الحراسة ${gkRotationInterval === 'per_goal' ? 'كل هدف' : 'كل مباراة'}` : 'حارس ثابت'}`
    : `${numTeams} teams × ${playersPerTeam} players — ${matchDurationMins} min — ${gkMode === 'rotating' ? `rotating GK ${gkRotationInterval === 'per_goal' ? 'per goal' : 'per match'}` : 'fixed GK'}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            ⚽
          </div>
          <div>
            <h2 className="text-xl font-black">
              {isAr ? 'حجز كورة عادي / خماسي' : 'Turf / Casual Match'}
            </h2>
            <p className="text-xs text-white/80">{formatLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {numTeams} {isAr ? 'فرق' : 'teams'}
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            <Timer className="w-3.5 h-3.5" />
            {matchDurationMins} {isAr ? 'دق' : 'min'}
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            {matchType === 'league' ? (isAr ? 'دوري' : 'League') : (isAr ? 'كأس' : 'Knockout')}
          </div>
          {gkMode === 'rotating' && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
              <RotateCw className="w-3.5 h-3.5" />
              {isAr ? 'دوران الحراسة' : 'Rotating GK'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Teams Grid */}
      <div className={`grid gap-4 ${numTeams === 2 ? 'grid-cols-1 sm:grid-cols-2' : numTeams === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {teams.map((team, idx) => (
          <TeamCard
            key={team.id}
            team={team}
            isAr={isAr}
            gkMode={gkMode}
          />
        ))}
      </div>

      {/* Fixture Schedule */}
      {fixtures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
        >
          <button
            onClick={() => setShowFixtures(f => !f)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <Trophy className="w-5 h-5 text-amber-500" />
              {isAr
                ? `جدول المباريات (${matchType === 'league' ? 'دوري' : 'كأس'}) — ${fixtures.length} مباراة`
                : `${matchType === 'league' ? 'League' : 'Knockout'} Schedule — ${fixtures.length} matches`
              }
            </div>
            {showFixtures ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showFixtures && (
            <div className="px-4 pb-4 space-y-2">
              {fixtures.map((fixture, idx) => {
                const teamA = teams.find(t => t.id === fixture.teamA);
                const teamB = teams.find(t => t.id === fixture.teamB);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
                  >
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-12 shrink-0 text-center">
                      {isAr ? `م ${fixture.round}` : `R${fixture.round}`}
                    </span>
                    <div className="flex-1 flex items-center justify-center gap-3">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{teamA?.name || fixture.teamA}</span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-xs font-black text-slate-600 dark:text-slate-400 rounded-full">
                        {isAr ? 'ضد' : 'vs'}
                      </span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">{teamB?.name || fixture.teamB}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      <Timer className="w-3.5 h-3.5" />
                      {matchDurationMins}&apos;
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
