'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { PlayerProfile } from '@/types';
import FormIcon from '@/components/ui/FormIcon';
import { getPlayerOverall } from '@/lib/playerUtils';
import { useLocale } from '@/components/ui/ThemeProvider';
import { PLAYER_STYLES } from '@/components/player/PlayerStylePicker';
import { ArrowRightLeft, Crown, Sparkles, Shield, Trophy, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import OVRHistoryChart from '@/components/player/OVRHistoryChart';

export interface PlayerCardProps {
  player: PlayerProfile;
  variant?: 'full' | 'compact';
  recordedStats?: Record<string, any>;
  onVoteCaptain?: (uid: string) => void;
  onCompare?: (player: PlayerProfile) => void;
  currentUserId?: string;
  isMatchCaptain?: boolean;
  isMatchGK?: boolean;
  isMatchSuspended?: boolean;
  matchVoteCount?: number;
  rightActionSlot?: React.ReactNode;
}

function getAttributeColor(value: number): string {
  if (value >= 85) return 'text-emerald-400 font-black';
  if (value >= 75) return 'text-teal-300 font-bold';
  if (value >= 65) return 'text-amber-300 font-bold';
  if (value >= 50) return 'text-orange-400 font-bold';
  return 'text-rose-400 font-bold';
}

function calculateMainStats(attrs?: PlayerProfile['attributes']) {
  const a = attrs || ({} as any);
  const def = 70;
  return [
    { label: 'PAC', value: Math.round(((a.speed || def) + (a.acceleration || def)) / 2) },
    { label: 'SHO', value: Math.round(((a.finishing || def) + (a.kickingPower || def) + (a.offensiveAwareness || def)) / 3) },
    { label: 'PAS', value: Math.round(((a.lowPass || def) + (a.loftedPass || def)) / 2) },
    { label: 'DRI', value: Math.round(((a.dribbling || def) + (a.ballControl || def) + (a.balance || def)) / 3) },
    { label: 'DEF', value: Math.round(((a.defensiveAwareness || def) + (a.ballWinning || def) + (a.aggression || def)) / 3) },
    { label: 'PHY', value: Math.round(((a.physicalContact || def) + (a.stamina || def) + (a.jump || def)) / 3) },
  ];
}

const PlayerCard = React.memo(function PlayerCard({
  player,
  variant = 'full',
  recordedStats,
  onVoteCaptain,
  onCompare,
  currentUserId,
  isMatchCaptain,
  isMatchGK,
  isMatchSuspended,
  matchVoteCount,
  rightActionSlot,
}: PlayerCardProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const activeAttributes = player.approvedAttributes || player.attributes || {};
  const overall = getPlayerOverall(player);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Motion Perspective
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXRaw = useTransform(y, [-150, 150], [15, -15]);
  const rotateYRaw = useTransform(x, [-150, 150], [-15, 15]);
  const sheenXRaw = useTransform(x, [-150, 150], ["0%", "100%"]);
  const sheenYRaw = useTransform(y, [-150, 150], ["0%", "100%"]);

  const rotateX = useSpring(rotateXRaw, { stiffness: 400, damping: 25 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 400, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant === 'compact' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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

  // Card theme styling based on overall
  const getTierTheme = (ovr: number) => {
    if (ovr >= 85) {
      return {
        cardBg: 'bg-slate-900',
        border: 'border-2 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)]',
        ovrText: 'text-emerald-400 drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
        badgeBg: 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300',
        accentBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black',
        statBorder: 'border-emerald-500/20',
      };
    }
    if (ovr >= 75) {
      return {
        cardBg: 'bg-slate-900',
        border: 'border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)]',
        ovrText: 'text-amber-300 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]',
        badgeBg: 'bg-amber-500/20 border border-amber-400/40 text-amber-300',
        accentBtn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
        statBorder: 'border-amber-500/20',
      };
    }
    if (ovr >= 65) {
      return {
        cardBg: 'bg-slate-900',
        border: 'border-2 border-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.2)]',
        ovrText: 'text-cyan-300 drop-shadow-[0_2px_10px_rgba(34,211,238,0.4)]',
        badgeBg: 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300',
        accentBtn: 'bg-cyan-600 hover:bg-cyan-500 text-white font-black',
        statBorder: 'border-cyan-500/20',
      };
    }
    return {
      cardBg: 'bg-slate-900',
      border: 'border-2 border-slate-700 shadow-xl',
      ovrText: 'text-slate-300',
      badgeBg: 'bg-slate-800 border border-slate-700 text-slate-300',
      accentBtn: 'bg-slate-800 hover:bg-slate-700 text-white',
      statBorder: 'border-slate-800',
    };
  };

  const theme = getTierTheme(overall);

  // --- Compact Variant ---
  if (variant === 'compact') {
    const pStats = recordedStats?.[player.uid];
    const hasStats = pStats && (pStats.goals > 0 || pStats.assists > 0 || pStats.mvp);
    const isCurrentUser = Boolean(currentUserId && player.uid === currentUserId);
    const captainVotesCount = player.captainVotes?.length || 0;
    const profileUrl = player.username ? `/${player.username}` : `/profile?uid=${player.uid}`;

    return (
      <Link href={profileUrl} className="block w-full">
        <motion.div
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`relative backdrop-blur-xl bg-slate-900/80 rounded-3xl shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border ${
            isCurrentUser
              ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20'
              : 'border-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          }`}
        >
          {/* OVR Badge - Top Corner */}
          <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 z-10">
            <span className={`px-2.5 py-1 rounded-xl font-black text-white text-xs shadow-md ${theme.badgeBg}`}>
              {overall} OVR
            </span>
          </div>

          <div className="p-4 flex items-center gap-3.5 pr-20 rtl:pr-4 rtl:pl-20">
            {/* Avatar */}
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 bg-slate-950 ${
              isCurrentUser ? 'border-emerald-500 shadow-md' : 'border-slate-700'
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
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 font-black text-xl sm:text-2xl">
                  {player.cardName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-base sm:text-lg font-black truncate leading-tight flex items-center gap-1.5 ${isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                <span>{player.cardName || player.fullName}</span>
                {(player.subscription?.status === 'active' || player.email?.toLowerCase() === 'a7medorabe7@gmail.com' || player.uid === 'G8vV7jTvd0VUeRlohrGFyARhiiw1') && (
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30 shrink-0" />
                )}
              </h3>

              <div className="flex flex-wrap items-center gap-1 mt-1.5 mb-1.5">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {player.primaryPosition}
                </span>
                {isMatchCaptain && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-md shadow-sm">
                    ©️ {isAr ? 'الكابتن' : 'Captain'}
                  </span>
                )}
                {isMatchGK && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500/20 text-amber-400 rounded-md">
                    🥅 GK
                  </span>
                )}
                {isMatchSuspended && (
                  <span title={isAr ? 'موقوف عن اللعب (كرت أحمر)' : 'Suspended (Red Card)'} className="px-1.5 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-md shadow-sm">
                    🚫 {isAr ? 'موقوف' : 'Suspended'}
                  </span>
                )}
                {!isMatchCaptain && !isMatchGK && !isMatchSuspended && player.secondaryPosition && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {player.secondaryPosition}
                  </span>
                )}
                {!isMatchCaptain && !isMatchGK && !isMatchSuspended && player.tertiaryPosition && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                    {player.tertiaryPosition}
                  </span>
                )}
              </div>

              {player.playStyle && (
                <span className="text-[11px] font-bold text-amber-400 truncate block">
                  {formatPlayStyle(player.playStyle)}
                </span>
              )}

              <div className="flex items-center gap-3 text-[11px] mt-1">
                {player.height && player.weight && (
                  <span className="text-slate-400 font-semibold">
                    {player.height}cm / {player.weight}kg
                  </span>
                )}
                {captainVotesCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 font-black">
                    <span>👑</span>
                    <span>{captainVotesCount}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Custom Right Action Slot */}
            {rightActionSlot && (
              <div className="ml-auto rtl:ml-0 rtl:mr-auto pl-2 rtl:pl-0 rtl:pr-2 flex items-center justify-center relative z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                {rightActionSlot}
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          {(onVoteCaptain || onCompare) && (
            <div className="flex items-center gap-2 p-3 bg-slate-950 border-t border-slate-800">
              {onVoteCaptain && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onVoteCaptain(player.uid);
                  }}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 text-center"
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
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 border border-slate-700"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isAr ? "مقارنة" : "Compare"}</span>
                </button>
              )}
            </div>
          )}

          {hasStats && (
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                {pStats.goals > 0 && (
                  <span className="font-black text-emerald-400">
                    ⚽ {pStats.goals} {pStats.goals === 1 ? 'Goal' : 'Goals'}
                  </span>
                )}
                {pStats.assists > 0 && (
                  <span className="font-black text-blue-400">
                    🎯 {pStats.assists} {pStats.assists === 1 ? 'Assist' : 'Assists'}
                  </span>
                )}
                {pStats.mvp && (
                  <span className="font-black text-amber-400 flex items-center gap-1">
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

  // --- Full FUT Card Variant ---
  const CardWrapper = player.uid === 'preview' ? 'div' : Link;
  const wrapperProps = player.uid === 'preview' ? {} : { href: `/profile?uid=${player.uid}` };

  return (
    <CardWrapper {...wrapperProps as any} className="block w-fit perspective-1000" style={{ perspective: 1000 }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.96 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`w-72 sm:w-80 rounded-3xl backdrop-blur-xl ${theme.cardBg} ${theme.border} hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] overflow-hidden cursor-pointer relative shadow-2xl flex flex-col justify-between transition-colors duration-300`}
      >
        {/* Holographic Glossy Top Shine Effect */}
        <motion.div 
          className="pointer-events-none absolute inset-0 z-10 opacity-60"
          style={{
            background: `radial-gradient(circle at ${sheenXRaw} ${sheenYRaw}, rgba(255,255,255,0.15), transparent 60%)`
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-10" />

        {/* --- Card Top Header --- */}
        <div className="relative flex flex-col items-center pt-6 pb-3 px-4 z-20">
          {/* Avatar Ring */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-amber-400/80 overflow-hidden bg-slate-950 shadow-2xl mt-1 flex items-center justify-center">
            {displayPhoto && !imgError ? (
              <Image
                src={displayPhoto}
                alt=""
                fill
                sizes="128px"
                style={{ objectFit: 'cover' }}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-amber-400 font-black text-4xl opacity-80">{player.cardName?.charAt(0) || player.fullName?.charAt(0) || '?'}</span>
            )}
          </div>

          {/* OVR Number */}
          <div className={`mt-2 text-5xl sm:text-6xl font-black tracking-tight leading-none ${theme.ovrText}`}>
            {overall}
          </div>

          {/* Player Name + Form */}
          <div className="mt-2 flex items-center justify-center gap-1.5 w-full">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide truncate text-center">
              {player.cardName || player.fullName || 'PLAYER'}
            </h3>
            {player.form && (
              <div title="Current Form" className="bg-slate-950/80 rounded-full p-1 border border-slate-800 shadow">
                <FormIcon form={player.form} className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Physical Info & Play Style */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 text-[11px] text-slate-300 mt-1 uppercase font-bold">
            <span>{player.height || 175} CM</span>
            <span className="text-slate-600">•</span>
            <span>{player.weight || 70} KG</span>
            <span className="text-slate-600">•</span>
            <span>{player.calculatedAge || 20} Y.O</span>
            {player.playStyle && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-black">{formatPlayStyle(player.playStyle)}</span>
              </>
            )}
          </div>
        </div>

        {/* --- Position Badges --- */}
        <div className="flex flex-col items-center gap-1.5 pb-3 z-20">
          <span className={`text-sm font-black px-4 py-1 rounded-xl tracking-wider shadow-md ${theme.badgeBg}`}>
            {player.primaryPosition || 'CMF'}
          </span>

          <div className="flex items-center gap-1.5">
            {player.secondaryPosition && (
              <span className="bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg">
                {player.secondaryPosition}
              </span>
            )}
            {player.tertiaryPosition && (
              <span className="bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg">
                {player.tertiaryPosition}
              </span>
            )}
          </div>
        </div>

        {/* --- Attributes Grid (2 columns × 3 rows) --- */}
        <div className={`mx-4 mb-3 rounded-2xl bg-slate-950/80 backdrop-blur-md p-3.5 border ${theme.statBorder} relative z-20 shadow-inner`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {calculateMainStats(activeAttributes).map(({ label, value }) => (
              <div 
                key={label} 
                className="flex items-center justify-between px-1"
              >
                <span className="text-xs font-black text-slate-400 tracking-wider">
                  {label}
                </span>
                <span className={`text-sm ${getAttributeColor(value)}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- Stats Footer Grid --- */}
        <div className="grid grid-cols-4 border-t border-slate-800/80 bg-slate-950/90 text-center py-2.5 px-2 z-20">
          {[
            { label: 'G', value: player.stats?.goals || 0 },
            { label: 'A', value: player.stats?.assists || 0 },
            { label: 'MVP', value: player.stats?.mvp || 0 },
            { label: 'MP', value: player.stats?.matchesPlayed || 0 },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                {stat.label}
              </span>
              <span className="text-sm font-black text-white leading-tight">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* --- OVR Rating Growth History --- */}
        {variant === 'full' && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 z-20">
            <OVRHistoryChart currentOVR={overall} initialOVR={Math.max(50, overall - 8)} isAr={isAr} />
          </div>
        )}

        {/* --- Action Buttons (Captain Vote / Compare / Share) --- */}
        <div className="flex items-center gap-2 p-3 bg-slate-950 border-t border-slate-800 z-20">
          {onVoteCaptain && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onVoteCaptain(player.uid);
              }}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
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
              className={`flex-1 py-2 px-3 ${theme.accentBtn} rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isAr ? "مقارنة" : "Compare"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const profilePath = player.username ? `/${player.username}` : `/profile?uid=${player.uid}`;
              const url = typeof window !== 'undefined' ? `${window.location.origin}${profilePath}` : '';
              if (navigator.clipboard) {
                navigator.clipboard.writeText(url);
                toast.success(isAr ? `تم نسخ رابط ملف ${player.cardName || player.fullName}!` : `Profile link for ${player.cardName || player.fullName} copied!`);
              }
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 rounded-xl text-xs flex items-center justify-center shadow transition-all active:scale-95 cursor-pointer"
            title={isAr ? "مشاركة الملف" : "Share Profile"}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </CardWrapper>
  );
});

export default PlayerCard;
