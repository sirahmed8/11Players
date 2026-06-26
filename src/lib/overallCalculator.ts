import { PESPosition, PlayerAttributes } from '@/types';

type Weights = Record<keyof PlayerAttributes, number>;

const POSITION_WEIGHTS: Record<PESPosition, Weights> = {
  CF: { attackingProwess: 0.25, shotPower: 0.20, speed: 0.15, acceleration: 0.10, dribbling: 0.10, physicalContact: 0.10, passing: 0.05, stamina: 0.05, defensiveProwess: 0, goalkeeping: 0 },
  SS: { attackingProwess: 0.20, dribbling: 0.20, passing: 0.15, speed: 0.15, acceleration: 0.10, shotPower: 0.10, stamina: 0.05, physicalContact: 0.05, defensiveProwess: 0, goalkeeping: 0 },
  RWF: { speed: 0.20, acceleration: 0.20, dribbling: 0.20, attackingProwess: 0.15, passing: 0.10, shotPower: 0.05, stamina: 0.10, physicalContact: 0, defensiveProwess: 0, goalkeeping: 0 },
  LWF: { speed: 0.20, acceleration: 0.20, dribbling: 0.20, attackingProwess: 0.15, passing: 0.10, shotPower: 0.05, stamina: 0.10, physicalContact: 0, defensiveProwess: 0, goalkeeping: 0 },
  AMF: { passing: 0.25, dribbling: 0.20, attackingProwess: 0.15, shotPower: 0.10, speed: 0.10, acceleration: 0.10, stamina: 0.05, physicalContact: 0.05, defensiveProwess: 0, goalkeeping: 0 },
  RMF: { speed: 0.20, stamina: 0.20, passing: 0.15, dribbling: 0.15, acceleration: 0.10, attackingProwess: 0.10, defensiveProwess: 0.05, physicalContact: 0.05, shotPower: 0, goalkeeping: 0 },
  LMF: { speed: 0.20, stamina: 0.20, passing: 0.15, dribbling: 0.15, acceleration: 0.10, attackingProwess: 0.10, defensiveProwess: 0.05, physicalContact: 0.05, shotPower: 0, goalkeeping: 0 },
  CMF: { passing: 0.25, stamina: 0.20, dribbling: 0.15, defensiveProwess: 0.10, physicalContact: 0.10, attackingProwess: 0.05, speed: 0.05, acceleration: 0.05, shotPower: 0.05, goalkeeping: 0 },
  DMF: { defensiveProwess: 0.25, stamina: 0.20, physicalContact: 0.15, passing: 0.15, speed: 0.10, acceleration: 0.05, dribbling: 0.05, shotPower: 0.05, attackingProwess: 0, goalkeeping: 0 },
  CB: { defensiveProwess: 0.35, physicalContact: 0.25, stamina: 0.10, speed: 0.10, acceleration: 0.05, passing: 0.10, shotPower: 0.05, dribbling: 0, attackingProwess: 0, goalkeeping: 0 },
  LB: { speed: 0.20, stamina: 0.20, defensiveProwess: 0.20, acceleration: 0.15, passing: 0.15, physicalContact: 0.05, dribbling: 0.05, attackingProwess: 0, shotPower: 0, goalkeeping: 0 },
  RB: { speed: 0.20, stamina: 0.20, defensiveProwess: 0.20, acceleration: 0.15, passing: 0.15, physicalContact: 0.05, dribbling: 0.05, attackingProwess: 0, shotPower: 0, goalkeeping: 0 },
  GK: { goalkeeping: 0.70, physicalContact: 0.10, defensiveProwess: 0.10, passing: 0.10, speed: 0, acceleration: 0, stamina: 0, dribbling: 0, shotPower: 0, attackingProwess: 0 },
};

// Play Styles that give a flat bonus to overall rating based on synergy with the position
const STYLE_BONUSES: Record<string, number> = {
  'goal_poacher': 1, 'fox_in_the_box': 1, 'target_man': 1, // Attackers
  'creative_playmaker': 1, 'hole_player': 1, 'classic_no_10': 1, // Midfield
  'prolific_winger': 1, 'box_to_box': 2, 'orchestrator': 1, // Winger/CMF
  'the_destroyer': 1, 'anchor_man': 1, 'build_up': 1, // Defenders/DMF
  'offensive_fullback': 1, 'defensive_fullback': 1, // Fullbacks
  'offensive_gk': 1, 'defensive_gk': 1 // GKs
};

export function calculateRealisticOverall(
  attributes: PlayerAttributes,
  position: PESPosition,
  playStyle: string
): number {
  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.CF; // fallback
  
  let totalScore = 0;
  for (const [key, value] of Object.entries(attributes)) {
    const attrName = key as keyof PlayerAttributes;
    const weight = weights[attrName] || 0;
    totalScore += value * weight;
  }

  // Add play style synergy bonus (just a flat 1-2 points if they selected a valid style)
  const styleBonus = STYLE_BONUSES[playStyle] || 0;
  
  let finalOverall = Math.round(totalScore) + styleBonus;

  // Cap at 99
  if (finalOverall > 99) finalOverall = 99;
  if (finalOverall < 40) finalOverall = 40;

  return finalOverall;
}
