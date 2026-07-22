import { PESPosition, PlayerAttributes } from '@/types';

type Weights = Record<keyof PlayerAttributes, number>;

const POSITION_WEIGHTS: Record<PESPosition, Weights> = {
  CF: { offensiveAwareness: 0.20, finishing: 0.20, kickingPower: 0.10, speed: 0.10, acceleration: 0.05, ballControl: 0.05, dribbling: 0.05, heading: 0.05, jump: 0.05, physicalContact: 0.05, balance: 0.05, stamina: 0.05, lowPass: 0, loftedPass: 0, defensiveAwareness: 0, ballWinning: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  SS: { offensiveAwareness: 0.15, ballControl: 0.15, dribbling: 0.15, lowPass: 0.10, finishing: 0.10, speed: 0.10, acceleration: 0.10, kickingPower: 0.05, balance: 0.05, stamina: 0.05, loftedPass: 0, heading: 0, jump: 0, physicalContact: 0, defensiveAwareness: 0, ballWinning: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  RWF: { speed: 0.20, acceleration: 0.15, dribbling: 0.15, ballControl: 0.10, offensiveAwareness: 0.10, lowPass: 0.05, loftedPass: 0.05, finishing: 0.05, kickingPower: 0.05, balance: 0.05, stamina: 0.05, heading: 0, jump: 0, physicalContact: 0, defensiveAwareness: 0, ballWinning: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  LWF: { speed: 0.20, acceleration: 0.15, dribbling: 0.15, ballControl: 0.10, offensiveAwareness: 0.10, lowPass: 0.05, loftedPass: 0.05, finishing: 0.05, kickingPower: 0.05, balance: 0.05, stamina: 0.05, heading: 0, jump: 0, physicalContact: 0, defensiveAwareness: 0, ballWinning: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  AMF: { lowPass: 0.20, ballControl: 0.15, dribbling: 0.15, offensiveAwareness: 0.10, loftedPass: 0.10, kickingPower: 0.05, finishing: 0.05, speed: 0.05, acceleration: 0.05, balance: 0.05, stamina: 0.05, heading: 0, jump: 0, physicalContact: 0, defensiveAwareness: 0, ballWinning: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  RMF: { speed: 0.15, stamina: 0.15, loftedPass: 0.15, lowPass: 0.10, dribbling: 0.10, ballControl: 0.10, acceleration: 0.10, offensiveAwareness: 0.05, balance: 0.05, defensiveAwareness: 0.05, finishing: 0, heading: 0, kickingPower: 0, jump: 0, physicalContact: 0, ballWinning: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  LMF: { speed: 0.15, stamina: 0.15, loftedPass: 0.15, lowPass: 0.10, dribbling: 0.10, ballControl: 0.10, acceleration: 0.10, offensiveAwareness: 0.05, balance: 0.05, defensiveAwareness: 0.05, finishing: 0, heading: 0, kickingPower: 0, jump: 0, physicalContact: 0, ballWinning: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  CMF: { lowPass: 0.20, loftedPass: 0.15, stamina: 0.15, ballControl: 0.10, dribbling: 0.10, defensiveAwareness: 0.05, ballWinning: 0.05, physicalContact: 0.05, speed: 0.05, acceleration: 0.05, balance: 0.05, offensiveAwareness: 0, finishing: 0, heading: 0, kickingPower: 0, jump: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  DMF: { defensiveAwareness: 0.20, ballWinning: 0.15, aggression: 0.05, stamina: 0.15, physicalContact: 0.10, lowPass: 0.10, loftedPass: 0.10, jump: 0.05, heading: 0.05, speed: 0.05, ballControl: 0, dribbling: 0, offensiveAwareness: 0, finishing: 0, acceleration: 0, kickingPower: 0, balance: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  CB: { defensiveAwareness: 0.25, ballWinning: 0.20, aggression: 0.05, physicalContact: 0.15, heading: 0.10, jump: 0.10, stamina: 0.05, speed: 0.05, lowPass: 0.05, loftedPass: 0, offensiveAwareness: 0, ballControl: 0, dribbling: 0, finishing: 0, acceleration: 0, kickingPower: 0, balance: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  LB: { speed: 0.15, stamina: 0.15, defensiveAwareness: 0.15, ballWinning: 0.10, acceleration: 0.10, loftedPass: 0.10, lowPass: 0.10, dribbling: 0.05, ballControl: 0.05, physicalContact: 0.05, offensiveAwareness: 0, finishing: 0, heading: 0, kickingPower: 0, jump: 0, balance: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  RB: { speed: 0.15, stamina: 0.15, defensiveAwareness: 0.15, ballWinning: 0.10, acceleration: 0.10, loftedPass: 0.10, lowPass: 0.10, dribbling: 0.05, ballControl: 0.05, physicalContact: 0.05, offensiveAwareness: 0, finishing: 0, heading: 0, kickingPower: 0, jump: 0, balance: 0, aggression: 0, gkAwareness: 0, gkCatching: 0, gkClearing: 0, gkReflexes: 0, gkReach: 0 },
  GK: { gkAwareness: 0.20, gkReflexes: 0.20, gkCatching: 0.15, gkClearing: 0.15, gkReach: 0.10, jump: 0.05, physicalContact: 0.05, defensiveAwareness: 0.05, loftedPass: 0.05, offensiveAwareness: 0, ballControl: 0, dribbling: 0, lowPass: 0, finishing: 0, heading: 0, speed: 0, acceleration: 0, kickingPower: 0, balance: 0, stamina: 0, ballWinning: 0, aggression: 0 },
};

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

  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.CF;

  let totalScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const attrValue = attributes[key as keyof PlayerAttributes] || 40;
    totalScore += attrValue * weight;
  }

  let finalOverall = Math.round(totalScore);

  // Height and Weight modifiers (BMI)
  if (height && weight && height > 0) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    if (['CB', 'DMF', 'GK'].includes(position)) {
      if (height >= 185) finalOverall += 1;
      if (bmi >= 24 && bmi <= 27) finalOverall += 1;
    } else if (['LWF', 'RWF', 'LMF', 'RMF', 'SS'].includes(position)) {
      if (bmi >= 20 && bmi <= 23) finalOverall += 1;
      if (weight > 85) finalOverall -= 1;
    } else if (['CF'].includes(position)) {
      if (height >= 185 && bmi >= 24) finalOverall += 1;
    }
  }

  // Age modifier — realistic physical development curve
  if (age && age > 0) {
    if (age >= 17 && age <= 22) {
      // Young players: stamina & speed ceiling slightly higher (potential indicator)
      if (['LWF', 'RWF', 'LMF', 'RMF', 'SS', 'CF'].includes(position)) {
        if ((attributes.speed || 40) >= 80 || (attributes.acceleration || 40) >= 80) {
          finalOverall += 1; // Pace potential bonus
        }
      }
    } else if (age >= 33) {
      // Veteran players: slight stamina reality check
      if ((attributes.stamina || 40) > 75) {
        finalOverall -= 1;
      }
      // But experience bonus for playmakers and defenders
      if (['CMF', 'AMF', 'DMF', 'CB'].includes(position)) {
        if ((attributes.defensiveAwareness || 40) >= 80 || (attributes.lowPass || 40) >= 80) {
          finalOverall += 1; // Veteran IQ bonus
        }
      }
    }
  }

  // Play Style Synergy Modifier with position
  if (playStyle) {
    const cleanStyle = playStyle.toLowerCase().replace(/_/g, ' ').trim();
    const cleanId = cleanStyle.replace(/ /g, '_');
    if (['CF', 'SS'].includes(position) && (['goal poacher', 'poacher', 'fox in the box', 'target man', 'deep-lying forward'].includes(cleanStyle) || ['goal_poacher', 'fox_in_the_box', 'target_man', 'deep_lying_forward'].includes(cleanId))) {
      finalOverall += 1;
    } else if (['AMF', 'CMF'].includes(position) && (['creative playmaker', 'orchestrator', 'classic no. 10', 'hole player'].includes(cleanStyle) || ['creative_playmaker', 'orchestrator', 'classic_no_10', 'hole_player'].includes(cleanId))) {
      finalOverall += 1;
    } else if (['CMF', 'DMF'].includes(position) && (['box-to-box', 'anchor man', 'the destroyer'].includes(cleanStyle) || ['box_to_box', 'anchor_man', 'the_destroyer'].includes(cleanId))) {
      finalOverall += 1;
    } else if (['LWF', 'RWF', 'LMF', 'RMF'].includes(position) && (['prolific winger', 'roaming flank', 'cross specialist'].includes(cleanStyle) || ['prolific_winger', 'roaming_flank', 'cross_specialist'].includes(cleanId))) {
      finalOverall += 1;
    } else if (['CB', 'LB', 'RB'].includes(position) && (['build up', 'offensive full-back', 'defensive full-back', 'extra frontman'].includes(cleanStyle) || ['build_up', 'offensive_fullback', 'defensive_fullback', 'extra_frontman'].includes(cleanId))) {
      finalOverall += 1;
    } else if (position === 'GK' && (['offensive goalkeeper', 'defensive goalkeeper'].includes(cleanStyle) || ['offensive_gk', 'defensive_gk'].includes(cleanId))) {
      finalOverall += 1;
    }
  }

  // Preferred Foot Nuance & Synergy
  if (preferredFoot) {
    if (preferredFoot === 'Ambidextrous' || preferredFoot.toLowerCase().includes('ambidextrous') || preferredFoot === 'both') {
      finalOverall += 1; // Dual foot mastery boost
    } else if (preferredFoot === 'Left' || preferredFoot.toLowerCase() === 'left') {
      if (['LWF', 'LMF', 'LB'].includes(position)) {
        finalOverall += 1; // Natural left-wing comfort
      }
    } else if (preferredFoot === 'Right' || preferredFoot.toLowerCase() === 'right') {
      if (['RWF', 'RMF', 'RB'].includes(position)) {
        finalOverall += 1; // Natural right-wing comfort
      }
    }
  }

  // Community Peer Rating Modifier (±2.0 max, requires at least 3 ratings for stability)
  if (peerRatingCount && peerRatingCount >= 3 && peerRatingAvg !== undefined && peerRatingAvg > 0) {
    const peerModifier = Math.max(-2, Math.min(2, Math.round((peerRatingAvg - 6.0) * 0.5)));
    finalOverall += peerModifier;
  }

  if (finalOverall > 99) finalOverall = 99;
  if (finalOverall < 40) finalOverall = 40;

  return finalOverall;
}

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
  const activeAttributes = player?.approvedAttributes || player?.attributes || ({} as any);
  const primaryPos = player?.primaryPosition || 'CMF';
  const primaryRating = calculatePositionRating(player as any, primaryPos);

  const ratings = [
    { position: primaryPos, rating: primaryRating, tier: 0 }
  ];

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
