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

  // ── Height / Weight / BMI modifiers ────────────────────────────────────────
  if (height && weight && height > 0) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    if (['CB', 'DMF', 'GK'].includes(position)) {
      if (height >= 188) finalOverall += 2;
      else if (height >= 185) finalOverall += 1;
      if (bmi >= 24 && bmi <= 27) finalOverall += 1;
    } else if (['LWF', 'RWF', 'LMF', 'RMF', 'SS'].includes(position)) {
      if (bmi >= 19 && bmi <= 22) finalOverall += 1;
      if (weight > 90) finalOverall -= 1;
    } else if (['CF'].includes(position)) {
      if (height >= 185 && bmi >= 23) finalOverall += 1;
    } else if (['LB', 'RB'].includes(position)) {
      if (bmi >= 21 && bmi <= 24) finalOverall += 1;
    }
  }

  // ── Age modifier — realistic physical development curve ────────────────────
  if (age && age > 0) {
    if (age >= 16 && age <= 19) {
      // Young talent bonus: pace-based positions benefit more
      if (['LWF', 'RWF', 'LMF', 'RMF', 'SS', 'CF'].includes(position)) {
        if ((attributes.speed || 40) >= 82 || (attributes.acceleration || 40) >= 82) {
          finalOverall += 1; // Pace potential bonus
        }
      }
    } else if (age >= 20 && age <= 29) {
      // Prime age: no modifier — this is peak performance range
    } else if (age >= 30 && age <= 32) {
      // Slight drop in pace-reliant positions
      if (['LWF', 'RWF', 'SS'].includes(position) && (attributes.speed || 40) < 72) {
        finalOverall -= 1;
      }
    } else if (age >= 33) {
      // Veteran reality check
      if ((attributes.stamina || 40) > 75) {
        finalOverall -= 1;
      }
      // But IQ bonus for playmakers and defenders
      if (['CMF', 'AMF', 'DMF', 'CB'].includes(position)) {
        if ((attributes.defensiveAwareness || 40) >= 82 || (attributes.lowPass || 40) >= 82) {
          finalOverall += 1; // Veteran IQ bonus
        }
      }
    }
  }

  // ── Play Style Synergy — now ±2 bonus for full match synergy ──────────────
  if (playStyle) {
    const cleanStyle = playStyle.toLowerCase().replace(/_/g, ' ').trim();
    const cleanId = cleanStyle.replace(/ /g, '_');

    const STYLE_SYNERGIES: Array<{ positions: PESPosition[]; styles: string[]; ids: string[] }> = [
      {
        positions: ['CF', 'SS'],
        styles: ['goal poacher', 'poacher', 'fox in the box', 'target man', 'deep-lying forward', 'dummy runner'],
        ids: ['goal_poacher', 'fox_in_the_box', 'target_man', 'deep_lying_forward', 'dummy_runner'],
      },
      {
        positions: ['AMF', 'CMF'],
        styles: ['creative playmaker', 'orchestrator', 'classic no. 10', 'hole player'],
        ids: ['creative_playmaker', 'orchestrator', 'classic_no_10', 'hole_player'],
      },
      {
        positions: ['CMF', 'DMF'],
        styles: ['box-to-box', 'anchor man', 'the destroyer'],
        ids: ['box_to_box', 'anchor_man', 'the_destroyer'],
      },
      {
        positions: ['LWF', 'RWF', 'LMF', 'RMF'],
        styles: ['prolific winger', 'roaming flank', 'cross specialist'],
        ids: ['prolific_winger', 'roaming_flank', 'cross_specialist'],
      },
      {
        positions: ['CB', 'LB', 'RB'],
        styles: ['build up', 'offensive full-back', 'defensive full-back', 'extra frontman', 'full-back finisher'],
        ids: ['build_up', 'offensive_fullback', 'defensive_fullback', 'extra_frontman', 'fullback_finisher'],
      },
      {
        positions: ['GK'],
        styles: ['offensive goalkeeper', 'defensive goalkeeper'],
        ids: ['offensive_gk', 'defensive_gk', 'offensive_goalkeeper', 'defensive_goalkeeper'],
      },
    ];

    for (const synergy of STYLE_SYNERGIES) {
      if (
        synergy.positions.includes(position) &&
        (synergy.styles.includes(cleanStyle) || synergy.ids.includes(cleanId))
      ) {
        finalOverall += 2; // Full synergy bonus (was +1, now +2)
        break;
      }
    }
  }

  // ── Preferred Foot Synergy ─────────────────────────────────────────────────
  // Winger logic uses INVERTED foot: left-footed players on RIGHT wing (RWF/RMF) can
  // cut inside and shoot with dominant foot — modern inverted winger concept.
  // Full-backs use NATURAL foot (LB=left, RB=right) for correct crossing/tracking.
  if (preferredFoot) {
    const foot = preferredFoot.toLowerCase();
    if (foot.includes('ambidextrous') || foot === 'both') {
      finalOverall += 2; // Dual foot mastery is a massive real-world advantage
    } else if (foot === 'left') {
      // Left foot: natural for LB/LMF, inverted winger bonus for RWF
      if (['LB', 'LMF'].includes(position)) finalOverall += 1;
      if (['RWF'].includes(position)) finalOverall += 1; // inverted winger
    } else if (foot === 'right') {
      // Right foot: natural for RB/RMF, inverted winger bonus for LWF
      if (['RB', 'RMF'].includes(position)) finalOverall += 1;
      if (['LWF'].includes(position)) finalOverall += 1; // inverted winger
    }
  }

  // ── Community Peer Rating Modifier ────────────────────────────────────────
  // Requires 5+ ratings for stability (was 3); range ±3 (was ±2)
  if (peerRatingCount && peerRatingCount >= 5 && peerRatingAvg !== undefined && peerRatingAvg > 0) {
    const peerModifier = Math.max(-3, Math.min(3, Math.round((peerRatingAvg - 6.0) * 0.75)));
    finalOverall += peerModifier;
  }

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
