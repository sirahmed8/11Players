'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayerProfile } from '@/types';
import { getPlayerOverall } from '@/lib/playerUtils';
import FormIcon from './FormIcon';

interface PlayerCardCompactProps {
  player: PlayerProfile;
  recordedStats?: Record<string, any>;
  onVoteCaptain?: (uid: string) => void;
  currentUserId?: string;
}

const PlayerCardCompact = React.memo(function PlayerCardCompact({ player, recordedStats, onVoteCaptain, currentUserId }: PlayerCardCompactProps) {
  const overall = getPlayerOverall(player);
  const [imgError, setImgError] = React.useState(false);
  const displayPhoto = player.photoUrl || player.googlePic || (player as any).photoURL || (player as any).userPic || '';

  React.useEffect(() => {
    setImgError(false);
  }, [displayPhoto]);

  const pStats = recordedStats?.[player.uid];
  const hasStats = pStats && (pStats.goals > 0 || pStats.assists > 0 || pStats.mvp);
  const isCurrentUser = Boolean(currentUserId && player.uid === currentUserId);

  const getOverallColor = (ovr: number) => {
    if (ovr >= 90) return 'bg-emerald-500';
    if (ovr >= 80) return 'bg-blue-500';
    if (ovr >= 70) return 'bg-slate-500';
    return 'bg-slate-600';
  };

  return (
    <Link href={`/profile?uid=${player.uid}`} className="block w-full">
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border ${
          isCurrentUser
            ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        {/* Top Section - Photo and Basic Info */}
        <div className="p-4 flex items-start gap-3 sm:gap-4">
          {/* Photo */}
          <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 ${
            isCurrentUser ? 'border-emerald-500 shadow-md' : 'border-slate-200 dark:border-slate-600'
          }`}>
            {displayPhoto && !imgError ? (
              <Image
                src={displayPhoto}
                alt=""
                fill
                sizes="80px"
                style={{ objectFit: 'cover' }}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xl sm:text-2xl">
                {player.cardName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-base sm:text-lg font-bold truncate ${isCurrentUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {player.cardName}
              </h3>
              {player.form && (
                <div title="Current Form" className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-1 flex-shrink-0">
                  <FormIcon form={player.form} className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Position and Style */}
            <div className="flex flex-wrap items-center gap-1 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {player.primaryPosition}
              </span>
              {player.secondaryPosition && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {player.secondaryPosition}
                </span>
              )}
              {player.playStyle && (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
                  • {player.playStyle.replace(/_/g, ' ').trim()}
                </span>
              )}
            </div>

            {/* Stats Badge */}
            {hasStats && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex items-center gap-1">
                  {pStats.goals > 0 && <span>⚽ {pStats.goals}</span>}
                  {pStats.assists > 0 && <span>👟 {pStats.assists}</span>}
                  {pStats.mvp && <span>⭐</span>}
                </span>
              </div>
            )}
          </div>

          {/* Overall Rating */}
          <div className="flex flex-col items-center justify-center flex-shrink-0">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${getOverallColor(overall)} flex items-center justify-center shadow-md`}>
              <span className="text-xl sm:text-2xl font-black text-white">{overall}</span>
            </div>
            {player.peerRatingAvg && player.peerRatingAvg > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                <span className="text-[10px] text-amber-500">★</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{player.peerRatingAvg.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Actions */}
        <div className="px-4 pb-4 pt-0">
          {/* Physical Info */}
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-medium">{player.height || 175} cm</span>
              <span className="font-medium">{player.weight || 70} kg</span>
              <span className="font-medium">{player.calculatedAge || 20} yo</span>
            </div>
          </div>

          {/* Captain Vote */}
          <div className="flex items-center justify-end">
            {onVoteCaptain && currentUserId && currentUserId !== player.uid && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onVoteCaptain(player.uid);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                  player.captainVotes?.includes(currentUserId)
                    ? 'bg-amber-500 text-white shadow-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300'
                }`}
                title="Vote for Captain / تصويت كابتن"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={player.captainVotes?.includes(currentUserId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                <span>{player.captainVotes?.length || 0}</span>
              </button>
            )}
            {(player.captainVotes?.length || 0) > 0 && (!onVoteCaptain || !currentUserId || currentUserId === player.uid) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                <span>{player.captainVotes?.length || 0}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
});

export default PlayerCardCompact;
