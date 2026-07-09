'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PlayerProfile } from '@/types';
import FormIcon from './FormIcon';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

interface PlayerCardProps {
  player: PlayerProfile;
}

function getAttributeColor(value: number): string {
  if (value >= 90) return 'text-emerald-300';
  if (value >= 75) return 'text-green-400';
  if (value >= 60) return 'text-yellow-300';
  if (value >= 45) return 'text-orange-400';
  return 'text-red-400';
}

function calculateMainStats(attrs?: PlayerProfile['attributes']) {
  const a = attrs || ({} as any);
  return [
    { label: 'PAC', value: Math.round(((a.speed || 40) + (a.acceleration || 40)) / 2) },
    { label: 'SHO', value: Math.round(((a.finishing || 40) + (a.kickingPower || 40) + (a.offensiveAwareness || 40)) / 3) },
    { label: 'PAS', value: Math.round(((a.lowPass || 40) + (a.loftedPass || 40)) / 2) },
    { label: 'DRI', value: Math.round(((a.dribbling || 40) + (a.ballControl || 40) + (a.tightPossession || 40) + (a.balance || 40)) / 4) },
    { label: 'DEF', value: Math.round(((a.defensiveAwareness || 40) + (a.ballWinning || 40) + (a.aggression || 40)) / 3) },
    { label: 'PHY', value: Math.round(((a.physicalContact || 40) + (a.stamina || 40) + (a.jump || 40)) / 3) },
  ];
}

function formatFoot(foot?: PlayerProfile['preferredFoot']): string {
  if (!foot) return 'Right Foot';
  switch (foot) {
    case 'Right':
      return 'Right Foot';
    case 'Left':
      return 'Left Foot';
    case 'Ambidextrous':
      return 'Ambidextrous';
    default:
      return String(foot || 'Right Foot');
  }
}

const PlayerCard = React.memo(function PlayerCard({ player }: PlayerCardProps) {
  const activeAttributes = player.approvedAttributes || player.attributes || {};
  const overall = calculateRealisticOverall(activeAttributes, player.primaryPosition || 'CMF', player.playStyle || '');
  const [imgError, setImgError] = useState(false);
  const displayPhoto = player.photoUrl || player.googlePic || (player as any).photoURL || (player as any).userPic || '';

  React.useEffect(() => {
    setImgError(false);
  }, [displayPhoto]);

  const CardWrapper = player.uid === 'preview' ? 'div' : Link;
  const wrapperProps = player.uid === 'preview' ? {} : { href: `/profile?uid=${player.uid}` };

  return (
    <CardWrapper {...wrapperProps as any} className="block w-fit">
      <motion.div
        whileHover={{
          scale: 1.03,
          boxShadow: '0 0 24px 6px rgba(16, 185, 129, 0.45)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-72 h-auto rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 shadow-lg overflow-hidden cursor-pointer relative"
      >
        {/* --- Header: Photo + Overall --- */}
        <div className="relative flex flex-col items-center pt-8 pb-3 px-4">


          {/* Player Photo */}
          <div className="relative w-24 h-24 rounded-full border-[3px] border-amber-300/80 overflow-hidden bg-amber-800/30 shadow-inner mt-3 flex items-center justify-center">
            {(() => {
              return displayPhoto && !imgError ? (
                <Image
                  src={displayPhoto}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-amber-500 font-bold text-3xl opacity-50">{player.fullName?.charAt(0) || '?'}</span>
              );
            })()}
          </div>

          {/* Overall Number */}
          <div className="mt-1 text-4xl font-extrabold text-white drop-shadow-md leading-none">
            {overall}
          </div>

          {/* Card Name + Form */}
          <div className="mt-1 flex items-center justify-center gap-1 w-full">
            <h3 className="text-base font-bold text-white tracking-wide truncate">
              {player.cardName || player.fullName || 'PLAYER'}
            </h3>
            {player.form && (
              <div title="Current Form" className="bg-slate-900/40 rounded-full p-0.5">
                <FormIcon form={player.form} className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Physical Info & Play Style */}
          <div className="flex gap-2 text-[10px] text-amber-100/80 mt-1 uppercase font-semibold">
            <span>{player.height || 175} cm</span>
            <span>•</span>
            <span>{player.weight || 70} kg</span>
            <span>•</span>
            <span>{player.calculatedAge || 20} y.o</span>
            {player.playStyle && (
              <>
                <span>•</span>
                <span className="text-amber-300 font-bold">{(player.playStyle || '').replace(/_/g, ' ').trim()}</span>
              </>
            )}
          </div>
        </div>

        {/* --- Position Badges --- */}
        <div className="flex flex-col items-center gap-1 pb-2">
          {/* Primary Position */}
          <span className="bg-amber-900/60 text-amber-100 text-sm font-bold px-3 py-0.5 rounded-md tracking-wider shadow">
            {player.primaryPosition || 'CMF'}
          </span>

          {/* Secondary + Tertiary */}
          <div className="flex items-center gap-1.5">
            {player.secondaryPosition && (
              <span className="bg-amber-800/40 text-amber-200/90 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide">
                {player.secondaryPosition}
              </span>
            )}
            {player.tertiaryPosition && (
              <span className="bg-amber-800/40 text-amber-200/90 text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide">
                {player.tertiaryPosition}
              </span>
            )}
          </div>
        </div>

        {/* --- Attributes Grid (2 columns × 3 rows) --- */}
        <div className="mx-3 mb-3 rounded-xl bg-amber-900/40 backdrop-blur-sm p-2.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {calculateMainStats(activeAttributes).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-200/70 tracking-wider">
                  {label}
                </span>
                <span
                  className={`text-[13px] font-bold tabular-nums ${getAttributeColor(value)}`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- Stats Footer --- */}
        <div className="grid grid-cols-4 border-t border-amber-400/30 text-center py-2 px-1">
          {[
            { label: 'G', value: player.stats?.goals || 0 },
            { label: 'A', value: player.stats?.assists || 0 },
            { label: 'MVP', value: player.stats?.mvp || 0 },
            { label: 'MP', value: player.stats?.matchesPlayed || 0 },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-[10px] text-amber-300/60 font-medium uppercase">
                {stat.label}
              </span>
              <span className="text-sm font-bold text-white leading-tight">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </CardWrapper>
  );
});

export default PlayerCard;
