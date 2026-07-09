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

const STYLE_BONUSES: Record<string, number> = {
  'Goal Poacher': 1, 'Fox in the Box': 1, 'Target Man': 1, 'Dummy Runner': 1,
  'Creative Playmaker': 1, 'Hole Player': 1, 'Classic No. 10': 1,
  'Prolific Winger': 1, 'Roaming Flank': 1, 'Cross Specialist': 1,
  'Box-to-Box': 2, 'Orchestrator': 1,
  'The Destroyer': 1, 'Anchor Man': 1, 'Build Up': 1, 'Extra Frontman': 1,
  'Offensive Full-back': 1, 'Defensive Full-back': 1, 'Full-back Finisher': 1,
  'Offensive Goalkeeper': 1, 'Defensive Goalkeeper': 1
};

export function calculateRealisticOverall(
  attributes: PlayerAttributes,
  position: PESPosition,
  playStyle: string,
  height?: number,
  weight?: number
): number {
  if (!attributes) return 40;

  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.CF;
  
  let totalScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const attrValue = attributes[key as keyof PlayerAttributes] || 40;
    totalScore += attrValue * weight;
  }

  const styleBonus = STYLE_BONUSES[playStyle] || 0;
  let finalOverall = Math.round(totalScore) + styleBonus;

  // Height and Weight modifiers (BMI)
  if (height && weight && height > 0) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    // Different positions benefit differently from BMI/Height
    if (['CB', 'DMF', 'GK'].includes(position)) {
      if (height >= 185) finalOverall += 1; // Tall advantage for defense/GK
      if (bmi >= 24 && bmi <= 27) finalOverall += 1; // Strong build advantage
    } else if (['LWF', 'RWF', 'LMF', 'RMF', 'SS'].includes(position)) {
      if (bmi >= 20 && bmi <= 23) finalOverall += 1; // Lean build advantage for wingers
      if (weight > 85) finalOverall -= 1; // Heavy penalty for wingers
    } else if (['CF'].includes(position)) {
      if (height >= 185 && bmi >= 24) finalOverall += 1; // Target man advantage
    }
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
}) {
  const activeAttributes = player?.approvedAttributes || player?.attributes || ({} as any);
  const primaryPos = player?.primaryPosition || 'CMF';
  const primaryRating = calculateRealisticOverall(activeAttributes, primaryPos, player?.playStyle || '', player?.height, player?.weight);
  
  const ratings = [
    { position: primaryPos, rating: primaryRating, tier: 0 }
  ];

  if (player.secondaryPosition) {
    ratings.push({ position: player.secondaryPosition, rating: primaryRating, tier: 1 });
  }

  if (player.tertiaryPosition) {
    let tertiary = calculateRealisticOverall(activeAttributes, player.tertiaryPosition, player.playStyle || '', player.height, player.weight) - 2;
    if (tertiary < 40) tertiary = 40;
    ratings.push({ position: player.tertiaryPosition, rating: tertiary, tier: 2 });
  }

  return ratings;
}
