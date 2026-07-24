import { PESPosition, PlayerAttributes } from '@/types';
import { POSITION_WEIGHTS, SKILL_POSITION_RELEVANCE } from './pesConstants';

// ─── DIMINISHING RETURNS CURVE ───────────────────────────────────────────────
// Attributes > 85 yield compressed returns (like real football games)
function applyAttributeCurve(val: number): number {
  if (val <= 60) return val;
  const clamped = Math.min(val, 99);
  if (clamped <= 85) return 60 + (clamped - 60) * 1.0;
  return 85 + (clamped - 85) * 0.55;
}

function getSpecialSkillsBonus(specialSkills: string[] | undefined, position: PESPosition): number {
  if (!specialSkills || specialSkills.length === 0) return 0;
  const relevant = specialSkills.filter((skill) => {
    const positions = SKILL_POSITION_RELEVANCE[skill];
    return positions && positions.includes(position);
  });
  if (relevant.length >= 5) return 2;
  if (relevant.length >= 3) return 1;
  return 0;
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────
export function calculateRealisticOverall(
  attributes: PlayerAttributes,
  position: PESPosition,
  playStyle: string,
  height?: number,
  weight?: number,
  age?: number,
  peerRatingAvg?: number,
  peerRatingCount?: number,
  preferredFoot?: string,
  specialSkills?: string[],
  stats?: { goals?: number; assists?: number; mvp?: number; cleanSheets?: number; matchesPlayed?: number }
): number {
  if (!attributes) return 40;

  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.CMF;

  // Base weighted score with diminishing returns curve applied to each attribute
  let totalScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (weight === 0) continue;
    const rawValue = attributes[key as keyof PlayerAttributes] || 40;
    const curvedValue = applyAttributeCurve(rawValue);
    totalScore += curvedValue * weight;
  }

  let finalOverall = Math.round(totalScore);

  // ── Modifiers ──────────────────────────────────────────────────────────────
  // Feature disabled per user request: height, weight, age, foot, play style, and peer ratings no longer grant overall bonuses.
  // The overall is now purely based on the player's attributes mathematically matching the position.
  // ───────────────────────────────────────────────────────────────────────────

  // ── Clamp ──────────────────────────────────────────────────────────────────
  if (finalOverall > 99) finalOverall = 99;
  if (finalOverall < 40) finalOverall = 40;

  return finalOverall;
}

// ─── POSITION RATING with out-of-position penalties ──────────────────────────
export function calculatePositionRating(
  player: {
    attributes?: PlayerAttributes;
    approvedAttributes?: PlayerAttributes;
    primaryPosition?: PESPosition;
    secondaryPosition?: PESPosition;
    tertiaryPosition?: PESPosition;
    playStyle?: string;
    height?: number;
    weight?: number;
    calculatedAge?: number;
    age?: number;
    peerRatingAvg?: number;
    peerRatingCount?: number;
    preferredFoot?: string;
    specialSkills?: string[];
    stats?: { goals?: number; assists?: number; mvp?: number; cleanSheets?: number; matchesPlayed?: number };
  },
  targetPosition: PESPosition
): number {
  const activeAttributes = player?.approvedAttributes || player?.attributes || ({} as any);
  const primaryPos = player?.primaryPosition || 'CMF';
  const age = player?.calculatedAge || player?.age;

  const rawRating = calculateRealisticOverall(
    activeAttributes,
    targetPosition,
    player?.playStyle || '',
    player?.height,
    player?.weight,
    age,
    player?.peerRatingAvg,
    player?.peerRatingCount,
    player?.preferredFoot,
    player?.specialSkills,
    player?.stats
  );

  if (targetPosition === primaryPos) {
    return rawRating;
  }
  if (player?.secondaryPosition && targetPosition === player.secondaryPosition) {
    return Math.max(40, rawRating - 1);
  }
  if (player?.tertiaryPosition && targetPosition === player.tertiaryPosition) {
    return Math.max(40, rawRating - 3);
  }

  // Out of position penalty based on position group distance
  const getGroup = (pos: PESPosition) => {
    if (pos === 'GK') return 0;
    if (['CB', 'LB', 'RB'].includes(pos)) return 1;
    if (['DMF', 'CMF', 'LMF', 'RMF', 'AMF'].includes(pos)) return 2;
    if (['LWF', 'RWF', 'SS', 'CF'].includes(pos)) return 3;
    return 2;
  };

  const primaryGroup = getGroup(primaryPos);
  const targetGroup = getGroup(targetPosition);
  const dist = Math.abs(primaryGroup - targetGroup);

  let penalty = 2; // general unfamiliarity
  if (dist === 1) penalty = 4;
  else if (dist === 2) penalty = 7;
  else if (dist === 3) penalty = 12; // e.g. GK as CF or CF as GK

  return Math.max(40, rawRating - penalty);
}

// ─── GET ALL POSITION RATINGS FOR A PLAYER ───────────────────────────────────
export function getPlayerPositionRatings(player: {
  attributes: PlayerAttributes;
  approvedAttributes?: PlayerAttributes;
  primaryPosition: PESPosition;
  secondaryPosition?: PESPosition;
  tertiaryPosition?: PESPosition;
  playStyle?: string;
  height?: number;
  weight?: number;
  calculatedAge?: number;
  peerRatingAvg?: number;
  peerRatingCount?: number;
  preferredFoot?: string;
}) {
  const primaryPos = player?.primaryPosition || 'CMF';
  const primaryRating = calculatePositionRating(player as any, primaryPos);

  const ratings = [{ position: primaryPos, rating: primaryRating, tier: 0 }];

  if (player.secondaryPosition) {
    const secondaryRating = calculatePositionRating(player as any, player.secondaryPosition);
    ratings.push({ position: player.secondaryPosition, rating: secondaryRating, tier: 1 });
  }

  if (player.tertiaryPosition) {
    const tertiaryRating = calculatePositionRating(player as any, player.tertiaryPosition);
    ratings.push({ position: player.tertiaryPosition, rating: tertiaryRating, tier: 2 });
  }

  return ratings;
}
