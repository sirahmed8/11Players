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

  return (
    <Link href={`/profile?uid=${player.uid}`} className="block w-full">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative grid grid-cols-[4.5rem_minmax(0,1fr)_4.25rem] items-center gap-4 min-h-[168px] p-5 rounded-2xl shadow-sm border transition-all cursor-pointer overflow-hidden ${
          isCurrentUser
            ? 'border-emerald-400 bg-emerald-950/95 ring-1 ring-emerald-400/60 shadow-[0_12px_30px_rgba(16,185,129,0.16)]'
            : 'bg-slate-800/95 border-slate-700 hover:border-emerald-500/40 hover:shadow-md'
        }`}
      >

        {/* Photo */}
        <div className={`relative w-16 h-16 rounded-full border-2 overflow-hidden flex-shrink-0 ${
          isCurrentUser ? 'border-emerald-300 ring-4 ring-emerald-400/20 bg-slate-900' : 'border-emerald-500/40 bg-slate-700'
        }`}>
          {(() => {
            return displayPhoto && !imgError ? (
              <Image 
                src={displayPhoto} 
                alt="" 
                fill
                sizes="64px"
                style={{ objectFit: 'cover' }}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-300/70 font-bold text-xl">
                {player.cardName.charAt(0).toUpperCase()}
              </div>
            );
          })()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-lg font-black truncate ${isCurrentUser ? 'text-emerald-200' : 'text-white'}`}>
              {player.cardName}
            </h3>
            {player.form && (
              <div title="Current Form" className="bg-slate-700 rounded-full p-0.5">
                <FormIcon form={player.form} className="w-3.5 h-3.5" />
              </div>
            )}
            {player.hasWarning && (
              <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">
                ⚠
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {hasStats && (
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-sm flex items-center gap-1 animate-pulse">
                {pStats.goals > 0 && <span>⚽ {pStats.goals}</span>}
                {pStats.assists > 0 && <span>👟 {pStats.assists}</span>}
                {pStats.mvp && <span>⭐ MOTM</span>}
              </span>
            )}
            <span className="text-xs font-black px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300">
              {player.primaryPosition}
            </span>
            {player.playStyle && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300">
                {player.playStyle.replace(/_/g, ' ').trim()}
              </span>
            )}
            {player.secondaryPosition && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-700 text-slate-300">
                {player.secondaryPosition}
              </span>
            )}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center border-s border-slate-700 pl-4">
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">OVR</span>
          <div className="text-3xl font-black text-amber-400 drop-shadow-sm leading-none">
            {overall}
          </div>
          {player.peerRatingAvg && player.peerRatingAvg > 0 && (
            <div className="flex items-center gap-0.5 mt-0.5">
              <span className="text-[9px] text-amber-400">★</span>
              <span className="text-[10px] font-bold text-amber-300">{player.peerRatingAvg.toFixed(1)}</span>
            </div>
          )}
          <div className="flex flex-col items-center mt-1.5 gap-1">
            {onVoteCaptain && currentUserId && currentUserId !== player.uid && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onVoteCaptain(player.uid);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                  player.captainVotes?.includes(currentUserId)
                    ? 'bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 ring-2 ring-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:text-amber-600 hover:bg-amber-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-amber-500/20 dark:hover:text-amber-300'
                }`}
                title="Vote for Captain / تصويت كابتن"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={player.captainVotes?.includes(currentUserId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                <span>{player.captainVotes?.length || 0}</span>
              </button>
            )}
            {(player.captainVotes?.length || 0) > 0 && (!onVoteCaptain || !currentUserId || currentUserId === player.uid) && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold" title="Total Captain Votes">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
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
