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
  peerRatingCount?: number
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

  // Community Peer Rating Modifier (±2.0 max, requires at least 3 ratings for stability)
  if (peerRatingCount && peerRatingCount >= 3 && peerRatingAvg !== undefined && peerRatingAvg > 0) {
    const peerModifier = Math.max(-2, Math.min(2, Math.round((peerRatingAvg - 6.0) * 0.5)));
    finalOverall += peerModifier;
  }

  if (finalOverall > 99) finalOverall = 99;
  if (finalOverall < 40) finalOverall = 40;

  return finalOverall;
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
}) {
  const activeAttributes = player?.approvedAttributes || player?.attributes || ({} as any);
  const primaryPos = player?.primaryPosition || 'CMF';
  const primaryRating = calculateRealisticOverall(activeAttributes, primaryPos, player?.playStyle || '', player?.height, player?.weight, player?.calculatedAge, player?.peerRatingAvg, player?.peerRatingCount);

  const ratings = [
    { position: primaryPos, rating: primaryRating, tier: 0 }
  ];

  // Secondary: recalculate for the actual secondary position (not copy primary)
  if (player.secondaryPosition) {
    const secondaryRating = calculateRealisticOverall(activeAttributes, player.secondaryPosition, player?.playStyle || '', player?.height, player?.weight, player?.calculatedAge, player?.peerRatingAvg, player?.peerRatingCount);
    // Secondary position is usually less comfortable, so apply a small penalty
    const adjustedSecondary = Math.max(40, secondaryRating - 1);
    ratings.push({ position: player.secondaryPosition, rating: adjustedSecondary, tier: 1 });
  }

  // Tertiary: recalculate with a larger penalty for lower familiarity
  if (player.tertiaryPosition) {
    let tertiaryRating = calculateRealisticOverall(activeAttributes, player.tertiaryPosition, player?.playStyle || '', player?.height, player?.weight, player?.calculatedAge, player?.peerRatingAvg, player?.peerRatingCount) - 3;
    if (tertiaryRating < 40) tertiaryRating = 40;
    ratings.push({ position: player.tertiaryPosition, rating: tertiaryRating, tier: 2 });
  }

  return ratings;
}
