'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { PESPosition } from '@/types';
import { calculateRealisticOverall, calculatePositionRating } from '@/lib/overallCalculator';
import { FORMATIONS, assignPlayersToFormation } from '@/lib/matchmaker';
import { Crown, RefreshCw, Layers, Check } from 'lucide-react';

interface AssignedPlayer {
  uid: string;
  cardName: string;
  photoUrl?: string;
  primaryPosition: PESPosition;
  secondaryPosition?: PESPosition;
  tertiaryPosition?: PESPosition;
  attributes: any;
  playStyle?: string;
  assignedPosition: PESPosition;
  psi: number;
  height?: number;
  weight?: number;
  calculatedAge?: number;
}

interface MatchPitchDisplayProps {
  team: AssignedPlayer[];
  teamName: string;
  color: 'blue' | 'red';
  isReversed?: boolean;
  onPlayerClick?: (player: AssignedPlayer) => void;
  recordedStats?: Record<string, any>;
  isAdmin?: boolean;
  currentFormation?: string;
  onFormationOrPositionChange?: (updatedTeam: AssignedPlayer[], newFormation?: string) => void;
  captainVotes?: Record<string, string>; // voterUid -> candidateUid
  onVoteCaptain?: (targetUid: string) => void;
  currentUserUid?: string;
  isAr?: boolean;
}

const POSITIONS: Record<PESPosition, { x: number; y: number }> = {
  GK: { x: 50, y: 90 },
  CB: { x: 50, y: 75 },
  LB: { x: 15, y: 70 },
  RB: { x: 85, y: 70 },
  DMF: { x: 50, y: 60 },
  CMF: { x: 50, y: 45 },
  LMF: { x: 15, y: 45 },
  RMF: { x: 85, y: 45 },
  AMF: { x: 50, y: 30 },
  LWF: { x: 20, y: 20 },
  RWF: { x: 80, y: 20 },
  SS: { x: 50, y: 18 },
  CF: { x: 50, y: 10 },
};

function PitchPlayerNode({
  p,
  actualX,
  top,
  theme,
  onPlayerClick,
  recordedStats,
  isCaptain,
  voteCount,
  onVote,
  canVote,
  isSwapSelected,
  onStartSwap,
  isAdmin,
  isAr
}: {
  p: AssignedPlayer;
  actualX: number;
  top: number;
  theme: string;
  onPlayerClick?: (player: AssignedPlayer) => void;
  recordedStats?: Record<string, any>;
  isCaptain?: boolean;
  voteCount: number;
  onVote?: () => void;
  canVote?: boolean;
  isSwapSelected?: boolean;
  onStartSwap?: () => void;
  isAdmin?: boolean;
  isAr?: boolean;
}) {
  const [imgError, setImgError] = React.useState(false);
  const photo = p.photoUrl || (p as any).googlePic || (p as any).photoURL || (p as any).userPic;
  
  React.useEffect(() => {
    setImgError(false);
  }, [photo]);

  // Use realistic overall adapted specifically to assignedPosition!
  const overall = calculatePositionRating(p as any, p.assignedPosition);
  const pStats = recordedStats?.[p.uid];
  const hasStats = pStats && (pStats.goals > 0 || pStats.assists > 0 || pStats.mvp);

  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10 transition-transform ${isSwapSelected ? 'scale-125 z-30' : 'hover:scale-110'}`}
      style={{ left: `${actualX}%`, top: `${top}%` }}
    >
      {/* Captain Golden Badge */}
      {isCaptain && (
        <div className="absolute -top-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-yellow-200 flex items-center gap-1 z-20 animate-bounce">
          <Crown className="w-3 h-3 fill-black" />
          <span>©️ CAPTAIN</span>
        </div>
      )}

      {/* Avatar Circle */}
      <button
        type="button"
        onClick={() => {
          if (isAdmin && onStartSwap) {
            onStartSwap();
          } else {
            onPlayerClick?.(p);
          }
        }}
        className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 shadow-lg bg-gradient-to-br ${theme} transition-all duration-300 ${isSwapSelected ? 'ring-4 ring-amber-400 shadow-amber-500/50 scale-110' : 'group-hover:scale-105 group-hover:shadow-cyan-500/50'}`}
      >
        {(() => {
          return photo && !imgError ? (
            <Image
              src={photo}
              alt={p.cardName}
              fill
              sizes="56px"
              style={{ objectFit: 'cover' }}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-black text-sm md:text-base">
              {overall}
            </div>
          );
        })()}
      </button>

      {/* Label & OVR Badge */}
      <div className="mt-1 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] md:text-xs text-white font-bold whitespace-nowrap border border-white/10 shadow-sm">
        <span className="truncate max-w-[80px]">{p.cardName}</span>
        <span className={`px-1 py-0.2 rounded text-[9px] font-black ${overall >= 80 ? 'bg-amber-400 text-black' : overall >= 70 ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
          {overall}
        </span>
      </div>

      {/* Recorded Stats Badge */}
      {hasStats && (
        <div className="mt-0.5 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md border border-white/20 animate-pulse">
          {pStats.goals > 0 && <span>⚽ {pStats.goals}</span>}
          {pStats.assists > 0 && <span>👟 {pStats.assists}</span>}
          {pStats.mvp && <span>⭐ MOTM</span>}
        </div>
      )}

      {/* Position Badge & Swap Indicator */}
      <div className={`absolute -top-2 -right-2 ${isSwapSelected ? 'bg-amber-500 text-black animate-pulse' : 'bg-slate-900 text-white'} text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-700 shadow-sm flex items-center gap-0.5`}>
        {p.assignedPosition}
        {isAdmin && <RefreshCw className="w-2.5 h-2.5 ml-0.5 opacity-70" />}
      </div>

      {/* Vote Captain Button */}
      {onVote && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onVote();
          }}
          disabled={!canVote}
          title={!canVote ? (isAr ? 'لا يمكنك التصويت لنفسك' : 'Cannot vote for yourself') : (isAr ? 'صوت ككابتن الفريق' : 'Vote as Captain')}
          className={`mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black transition-all shadow-md ${
            canVote
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black cursor-pointer'
              : 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-white/10'
          }`}
        >
          <Crown className="w-3 h-3" />
          <span>{voteCount > 0 ? `${voteCount} ${isAr ? 'صوت' : 'votes'}` : (isAr ? 'صوت كابتن' : 'Vote')}</span>
        </button>
      )}
    </div>
  );
}

const MatchPitchDisplay = React.memo(function MatchPitchDisplay({
  team = [],
  teamName,
  color,
  isReversed,
  onPlayerClick,
  recordedStats,
  isAdmin,
  currentFormation = '4-3-3',
  onFormationOrPositionChange,
  captainVotes = {},
  onVoteCaptain,
  currentUserUid,
  isAr = false
}: MatchPitchDisplayProps) {
  const theme = color === 'blue' ? 'from-blue-600 to-cyan-600 border-blue-400' : 'from-red-600 to-orange-600 border-red-400';
  
  const [selectedForSwap, setSelectedForSwap] = useState<AssignedPlayer | null>(null);
  const [localTeam, setLocalTeam] = useState<AssignedPlayer[]>(team);
  const [selectedFormation, setSelectedFormation] = useState<string>(currentFormation);

  React.useEffect(() => {
    setLocalTeam(team);
  }, [team]);

  React.useEffect(() => {
    setSelectedFormation(currentFormation);
  }, [currentFormation]);

  // Compute Captain Votes for this team
  const { topCaptainUid, voteCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    let topUid = '';
    let maxVotes = 0;

    // Filter candidate IDs belonging to this team
    const teamUids = new Set(localTeam.map(p => p.uid));

    Object.values(captainVotes || {}).forEach(candidateUid => {
      if (teamUids.has(candidateUid)) {
        counts[candidateUid] = (counts[candidateUid] || 0) + 1;
        if (counts[candidateUid] > maxVotes) {
          maxVotes = counts[candidateUid];
          topUid = candidateUid;
        }
      }
    });

    return { topCaptainUid: maxVotes > 0 ? topUid : (localTeam[0]?.uid || ''), voteCounts: counts };
  }, [captainVotes, localTeam]);

  // Handle player click when in Admin Swap mode
  const handleStartSwap = (p: AssignedPlayer) => {
    if (!isAdmin || !onFormationOrPositionChange) return;
    if (!selectedForSwap) {
      setSelectedForSwap(p);
    } else if (selectedForSwap.uid === p.uid) {
      setSelectedForSwap(null); // deselect
    } else {
      // Swap positions between selectedForSwap and p
      const updated = localTeam.map(item => {
        if (item.uid === selectedForSwap.uid) {
          const newPos = p.assignedPosition;
          return { ...item, assignedPosition: newPos, psi: calculatePositionRating(item as any, newPos) };
        }
        if (item.uid === p.uid) {
          const newPos = selectedForSwap.assignedPosition;
          return { ...item, assignedPosition: newPos, psi: calculatePositionRating(item as any, newPos) };
        }
        return item;
      });
      setLocalTeam(updated);
      setSelectedForSwap(null);
      onFormationOrPositionChange(updated, selectedFormation);
    }
  };

  // Handle Formation change
  const handleFormationSelect = (newForm: string) => {
    setSelectedFormation(newForm);
    if (onFormationOrPositionChange && FORMATIONS[newForm]) {
      try {
        const reAssigned = assignPlayersToFormation(localTeam as any, newForm) as AssignedPlayer[];
        // Re-compute realistic adapted rating for each position
        const updatedWithPsi = reAssigned.map(p => ({
          ...p,
          psi: calculatePositionRating(p as any, p.assignedPosition)
        }));
        setLocalTeam(updatedWithPsi);
        onFormationOrPositionChange(updatedWithPsi, newForm);
      } catch (e) {
        console.error("Formation change error:", e);
      }
    }
  };

  // Group players by assigned position to handle overlaps nicely
  const byPos: Record<string, AssignedPlayer[]> = {};
  localTeam.forEach((p) => {
    if (!byPos[p.assignedPosition]) byPos[p.assignedPosition] = [];
    byPos[p.assignedPosition].push(p);
  });

  // Available formations for this team size
  const availableFormations = useMemo(() => {
    const size = localTeam.length;
    return Object.keys(FORMATIONS).filter(f => FORMATIONS[f].length === size || (size >= 11 && FORMATIONS[f].length === 11));
  }, [localTeam.length]);

  return (
    <div className="w-full space-y-3">
      {/* Admin Controls Banner for Formations / Position Swapping */}
      {isAdmin && onFormationOrPositionChange && (
        <div className="p-3 bg-slate-900/90 dark:bg-slate-950/90 border border-amber-500/40 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-400 block">
                {isAr ? '⚡ وضع المدير: تخصيص التشكيلة والمراكز' : '⚡ Admin Mode: Formation & Position Editor'}
              </span>
              <span className="text-[11px] text-slate-300">
                {isAr
                  ? (selectedForSwap ? `انقر على لاعب آخر للتبديل مع ${selectedForSwap.cardName}` : 'انقر على أي لاعبين على الملعب لتبديل مراكزهم مباشرة وتحديث التقييم الواقعي')
                  : (selectedForSwap ? `Click another player to swap with ${selectedForSwap.cardName}` : 'Click any two players to swap positions dynamically & update realistic OVR')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedFormation}
              onChange={(e) => handleFormationSelect(e.target.value)}
              className="bg-slate-800 text-amber-400 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="" disabled>{isAr ? 'اختر التشكيلة' : 'Select Formation'}</option>
              {availableFormations.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            {selectedForSwap && (
              <button
                type="button"
                onClick={() => setSelectedForSwap(null)}
                className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-colors"
              >
                {isAr ? 'إلغاء التحديد' : 'Cancel Swap'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* The Pitch */}
      <div className="relative w-full max-w-md mx-auto aspect-[2/3] bg-emerald-800 rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-inner">
        {/* Pitch Lines */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 w-full h-1/2 border-b-2 border-white/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/50" />
          {/* Penalty Areas */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-1/2 h-[15%] border-x-2 border-white/50 ${isReversed ? 'bottom-0 border-t-2' : 'top-0 border-b-2'}`} />
          <div className={`absolute left-1/2 -translate-x-1/2 w-1/4 h-[5%] border-x-2 border-white/50 ${isReversed ? 'bottom-0 border-t-2' : 'top-0 border-b-2'}`} />
          {/* Goal Areas */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-1/5 h-2 bg-white/30 ${isReversed ? 'bottom-0' : 'top-0'}`} />
        </div>

        {/* Players */}
        {localTeam.map((p) => {
          const basePos = POSITIONS[p.assignedPosition];
          if (!basePos) return null;
          
          const group = byPos[p.assignedPosition];
          const count = group.length;
          const index = group.indexOf(p);
          
          let actualX = basePos.x;
          if (count > 1) {
            const spread = 20; // 20% gap between players sharing the same position role
            const totalWidth = spread * (count - 1);
            const startX = basePos.x - totalWidth / 2;
            actualX = startX + index * spread;
          }

          // Adjust Y based on reversed
          const top = isReversed ? 100 - basePos.y : basePos.y;
          const isCaptain = p.uid === topCaptainUid;
          const voteCount = voteCounts[p.uid] || 0;
          const canVote = Boolean(currentUserUid && currentUserUid !== p.uid);

          return (
            <PitchPlayerNode
              key={p.uid}
              p={p}
              actualX={actualX}
              top={top}
              theme={theme}
              onPlayerClick={onPlayerClick}
              recordedStats={recordedStats}
              isCaptain={isCaptain}
              voteCount={voteCount}
              onVote={onVoteCaptain ? () => onVoteCaptain(p.uid) : undefined}
              canVote={canVote}
              isSwapSelected={selectedForSwap?.uid === p.uid}
              onStartSwap={() => handleStartSwap(p)}
              isAdmin={isAdmin}
              isAr={isAr}
            />
          );
        })}
      </div>
    </div>
  );
});

export default MatchPitchDisplay;
