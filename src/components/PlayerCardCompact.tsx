'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayerProfile } from '@/types';
import { calculateRealisticOverall } from '@/lib/overallCalculator';
import FormIcon from './FormIcon';

interface PlayerCardCompactProps {
  player: PlayerProfile;
}

export default function PlayerCardCompact({ player }: PlayerCardCompactProps) {
  const overall = calculateRealisticOverall(player.attributes, player.primaryPosition, player.playStyle || '');

  return (
    <Link href={`/profile?uid=${player.uid}`} className="block w-full">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      >
        {/* Verification Status */}
        <div
          className={`absolute top-0 right-0 h-full w-1.5 ${
            player.isVerifiedByAdmin ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        />

        {/* Photo */}
        <div className="w-14 h-14 rounded-full border-2 border-emerald-500/30 overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
          {player.photoUrl ? (
            <Image src={player.photoUrl} alt="" className="w-full h-full object-cover" width={56} height={56} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald-600/50 dark:text-emerald-400/50 font-bold text-xl">
              {player.cardName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {player.cardName}
            </h3>
            {player.form && (
              <div title="Current Form" className="bg-slate-100 dark:bg-slate-700/50 rounded-full p-0.5">
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
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              {player.primaryPosition}
            </span>
            {player.playStyle && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                {player.playStyle.replace(/_/g, ' ').trim()}
              </span>
            )}
            {player.secondaryPosition && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {player.secondaryPosition}
              </span>
            )}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="flex-shrink-0 px-2 flex flex-col items-center justify-center border-s border-slate-200 dark:border-slate-700 pl-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">OVR</span>
          <div className="text-2xl font-black text-amber-500 drop-shadow-sm leading-none">
            {overall}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
