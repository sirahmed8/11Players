'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PlayerProfile } from '@/types';
import FormIcon from './FormIcon';
import { getPlayerOverall } from '@/lib/playerUtils';
import { useLocale } from '@/components/ThemeProvider';
import { PLAYER_STYLES } from '@/components/PlayerStylePicker';
import OvrExplanationModal from '@/components/OvrExplanationModal';
import { HelpCircle } from 'lucide-react';

export interface PlayerCardProps {
  player: PlayerProfile;
  variant?: 'full' | 'compact';
  recordedStats?: Record<string, any>;
  onVoteCaptain?: (uid: string) => void;
  onCompare?: (player: PlayerProfile) => void;
  currentUserId?: string;
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

const PlayerCard = React.memo(function PlayerCard({
  player,
  variant = 'full',
  recordedStats,
  onVoteCaptain,
  onCompare,
  currentUserId,
}: PlayerCardProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const activeAttributes = player.approvedAttributes || player.attributes || {};
  const overall = getPlayerOverall(player);
  const [imgError, setImgError] = useState(false);
  const [showOvrModal, setShowOvrModal] = useState(false);
  const displayPhoto = player.photoUrl || (player as any).photoURL || player.googlePic || (player as any).userPic || '';

  const formatPlayStyle = (val?: string) => {
    if (!val) return null;
    const cleaned = val.toLowerCase().replace(/ /g, '_').trim();
    const match = PLAYER_STYLES.find(s => s.id === cleaned || s.en.toLowerCase() === val.toLowerCase() || s.ar === val);
    return match ? (isAr ? match.ar : match.en) : val.replace(/_/g, ' ').trim();
  };

  React.useEffect(() => {
    setImgError(false);
  }, [displayPhoto]);

  // --- Compact Variant ---
  if (variant === 'compact') {
    const pStats = recordedStats?.[player.uid];
    const hasStats = pStats && (pStats.goals > 0 || pStats.assists > 0 || pStats.mvp);
    const isCurrentUser = Boolean(currentUserId && player.uid === currentUserId);
    const captainVotesCount = player.captainVotes?.length || 0;

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
            <div className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 border-2 ${
              isCurrentUser ? 'border-emerald-500 shadow-md' : 'border-slate-200 dark:border-slate-600'
            }`}>
              {displayPhoto && !imgError ? (
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-400 dark:text-slate-500 font-bold text-2xl sm:text-3xl">
                  {player.cardName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              {/* Name & Rating */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`text-lg sm:text-xl font-black truncate ${isCurrentUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {player.cardName}
                </h3>
                <span className={`px-2 py-0.5 rounded-md font-bold text-white text-sm ${getOverallColor(overall)}`}>
                  {overall}
                </span>
              </div>

              {/* Positions */}
              <div className="flex flex-wrap items-center gap-1 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  {player.primaryPosition}
                </span>
                {player.secondaryPosition && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {player.secondaryPosition}
                  </span>
                )}
                {player.tertiaryPosition && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {player.tertiaryPosition}
                  </span>
                )}
              </div>

              {/* Play Style */}
              {player.playStyle && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate block">
                    {formatPlayStyle(player.playStyle)}
                  </span>
                </div>
              )}

              {/* Physicals & Voting */}
              <div className="flex items-center gap-3 text-xs">
                {player.height && player.weight && (
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {player.height}cm / {player.weight}kg
                  </span>
                )}
                {captainVotesCount > 0 && (
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                    <span>👑</span>
                    <span>{captainVotesCount}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons or Captain Voted status */}
            {(onVoteCaptain || onCompare) && (
              <div className="flex flex-col gap-1.5 flex-shrink-0 justify-center">
                {onVoteCaptain && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onVoteCaptain(player.uid);
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                  >
                    {isAr ? "تصويت كابتن" : "Vote Captain"}
                  </button>
                )}
                {onCompare && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCompare(player);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>⚖️</span>
                    <span>{isAr ? "مقارنة" : "Compare"}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats Section if present */}
          {hasStats && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                {pStats.goals > 0 && (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ⚽ {pStats.goals} {pStats.goals === 1 ? 'Goal' : 'Goals'}
                  </span>
                )}
                {pStats.assists > 0 && (
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    🎯 {pStats.assists} {pStats.assists === 1 ? 'Assist' : 'Assists'}
                  </span>
                )}
                {pStats.mvp && (
                  <span className="font-bold text-amber-500 flex items-center gap-1">
                    🏆 MVP
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </Link>
    );
  }

  // --- Full Variant ---
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
            {displayPhoto && !imgError ? (
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
            )}
          </div>

          {/* Overall Number */}
          <div className="mt-1 text-4xl font-extrabold text-white drop-shadow-md leading-none">
            {overall}
          </div>

          {/* Peer Rating Badge */}
          {player.peerRatingAvg && player.peerRatingAvg > 0 && (
            <div className="mt-1 flex items-center gap-1 bg-slate-900/40 rounded-full px-2 py-0.5">
              <span className="text-amber-300 text-[10px]">⭐</span>
              <span className="text-[10px] font-bold text-amber-200">
                {player.peerRatingAvg.toFixed(1)}
              </span>
              {player.peerRatingCount && (
                <span className="text-[9px] text-amber-200/60">({player.peerRatingCount})</span>
              )}
            </div>
          )}

          {/* Match Star Rating Badge */}
          {player.matchStarRatingAvg && player.matchStarRatingAvg > 0 && (
            <div className="mt-0.5 flex items-center gap-1 bg-amber-500/20 rounded-full px-2 py-0.5">
              <span className="text-amber-300 text-[10px]">{'★'.repeat(Math.round(player.matchStarRatingAvg))}</span>
              <span className="text-[10px] font-bold text-amber-300">
                {player.matchStarRatingAvg.toFixed(1)}
              </span>
            </div>
          )}

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
                <span className="text-amber-300 font-bold">{formatPlayStyle(player.playStyle)}</span>
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
        <div className="mx-3 mb-3 rounded-xl bg-amber-900/40 backdrop-blur-sm p-2.5 relative group">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {calculateMainStats(activeAttributes).map(({ label, value }) => (
              <div 
                key={label} 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowOvrModal(true);
                }}
                className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
                title={isAr ? "اضغط لمعرفة طريقة حساب هذا المؤشر" : "Click to see formula breakdown"}
              >
                <span className="text-[11px] font-semibold text-amber-200/70 tracking-wider flex items-center gap-1">
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

        {(onVoteCaptain || onCompare) && (
          <div className="flex items-center gap-1.5 p-2 bg-slate-900/80 border-t border-amber-400/30">
            {onVoteCaptain && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVoteCaptain(player.uid);
                }}
                className="flex-1 py-1 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg shadow transition-all active:scale-95"
              >
                {isAr ? "تصويت كابتن" : "Vote Captain"}
              </button>
            )}
            {onCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCompare(player);
                }}
                className="flex-1 py-1 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg shadow transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                <span>⚖️</span>
                <span>{isAr ? "مقارنة" : "Compare"}</span>
              </button>
            )}
          </div>
        )}
        <OvrExplanationModal isOpen={showOvrModal} onClose={() => setShowOvrModal(false)} player={player} isOwnProfile={currentUserId === player.uid} />
      </motion.div>
    </CardWrapper>
  );
});

export default PlayerCard;
