/**
 * @module matchmaker
 * @description Production-grade deterministic matchmaking engine for 11Players.
 *
 * Features:
 *  - Position-Specific Index (PSI) calculation with 13 PES position weight maps
 *  - Physical modifier bonuses/penalties (height, BMI, age)
 *  - Backtracking conflict resolution for positional assignment
 *  - Dynamic formation selection (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2)
 *  - Iterative variance-minimisation team balancing (up to 1000 swaps)
 */

import type { PESPosition, PlayerAttributes, PlayerProfile } from '@/types';
import { getPlayerOverall } from '@/lib/playerUtils';
import { 
  sortPlayersByOvrDesc, 
  serpentineDraftStrategy, 
  buildGkRotationOrderStrategy, 
  calculateTeamTotalOvr, 
  calculateTeamAverageOvr 
} from '@/lib/matchmakingStrategy';

// ─── Exported Types ──────────────────────────────────────────────────────────

/** Aggregate team performance metrics (all values 1-99 scale). */
export interface TeamMetrics {
  overall: number;
  speed: number;
  stamina: number;
  defense: number;
  attack: number;
}

/** A player with their matchmaker-assigned position and computed PSI. */
export interface AssignedPlayer extends PlayerProfile {
  assignedPosition: PESPosition;
  psi: number;
}

/** Complete result returned by the balancing algorithm. */
export interface MatchmakingResult {
  teamA: AssignedPlayer[];
  teamB: AssignedPlayer[];
  benchA?: { player: PlayerProfile; reason: string }[];
  benchB?: { player: PlayerProfile; reason: string }[];
  bench?: { player: PlayerProfile; reason: string }[];
  formation: {
    teamA: string;
    teamB: string;
  };
  tipsAndTactics: {
    teamA: string;
    teamB: string;
    teamA_Ar?: string;
    teamB_Ar?: string;
  };
  metrics: {
    teamAOverall: number;
    teamBOverall: number;
    variance: {
      overall: number;
      speed: number;
      stamina: number;
      defense: number;
      attack: number;
      versatility?: number;
    };
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum swap iterations for the team-balancing phase. */
const MAX_BALANCE_ITERATIONS = 2000;

/** Convergence threshold – stop early when total variance drops below this. */
const CONVERGENCE_THRESHOLD = 0.0001;

/**
 * Penalty multipliers applied when a player is used outside their
 * primary position preference.
 */
const POSITION_FAMILIARITY = {
  primary: 1.0,
  secondary: 0.9,
  tertiary: 0.75,
  outOfPosition: 0.5,
} as const;

/** Height threshold (cm) for the tall-player bonus. */
const TALL_THRESHOLD_CM = 185;

/** BMI optimal range boundaries. */
const BMI_OPTIMAL_MIN = 20;
const BMI_OPTIMAL_MAX = 25;

/** Age thresholds for physical modifiers. */
const YOUNG_AGE_THRESHOLD = 22;
const VETERAN_AGE_THRESHOLD = 32;

// ─── PSI Weight Maps ─────────────────────────────────────────────────────────

/**
 * Position-Specific Index weight maps.
 *
 * Each key is a `PESPosition` and the value is a record mapping
 * `PlayerAttributes` keys to their normalised weights (sum = 1.0).
 */
const PSI_WEIGHTS: Record<PESPosition, Partial<Record<keyof PlayerAttributes, number>>> = {
  GK: {
    gkReflexes: 0.15,
    gkAwareness: 0.15,
    gkCatching: 0.10,
    gkClearing: 0.05,
    gkReach: 0.05,
    jump: 0.15,
    physicalContact: 0.15,
    defensiveAwareness: 0.10,
    loftedPass: 0.10,
  },
  CB: {
    defensiveAwareness: 0.25,
    ballWinning: 0.25,
    physicalContact: 0.15,
    heading: 0.15,
    jump: 0.10,
    speed: 0.05,
    stamina: 0.05,
  },
  LB: {
    speed: 0.20,
    stamina: 0.20,
    defensiveAwareness: 0.15,
    ballWinning: 0.15,
    acceleration: 0.10,
    loftedPass: 0.10,
    lowPass: 0.10,
  },
  RB: {
    speed: 0.20,
    stamina: 0.20,
    defensiveAwareness: 0.15,
    ballWinning: 0.15,
    acceleration: 0.10,
    loftedPass: 0.10,
    lowPass: 0.10,
  },
  DMF: {
    defensiveAwareness: 0.20,
    ballWinning: 0.20,
    stamina: 0.20,
    lowPass: 0.15,
    physicalContact: 0.15,
    loftedPass: 0.10,
  },
  CMF: {
    lowPass: 0.25,
    stamina: 0.20,
    loftedPass: 0.15,
    ballControl: 0.15,
    dribbling: 0.10,
    defensiveAwareness: 0.10,
    ballWinning: 0.05,
  },
  AMF: {
    lowPass: 0.20,
    ballControl: 0.20,
    dribbling: 0.20,
    offensiveAwareness: 0.15,
    loftedPass: 0.10,
    finishing: 0.10,
    balance: 0.05,
  },
  LMF: {
    speed: 0.20,
    stamina: 0.20,
    loftedPass: 0.15,
    lowPass: 0.15,
    dribbling: 0.15,
    ballControl: 0.10,
    acceleration: 0.05,
  },
  RMF: {
    speed: 0.20,
    stamina: 0.20,
    loftedPass: 0.15,
    lowPass: 0.15,
    dribbling: 0.15,
    ballControl: 0.10,
    acceleration: 0.05,
  },
  LWF: {
    speed: 0.25,
    acceleration: 0.20,
    dribbling: 0.20,
    ballControl: 0.15,
    offensiveAwareness: 0.10,
    finishing: 0.10,
  },
  RWF: {
    speed: 0.25,
    acceleration: 0.20,
    dribbling: 0.20,
    ballControl: 0.15,
    offensiveAwareness: 0.10,
    finishing: 0.10,
  },
  SS: {
    offensiveAwareness: 0.20,
    ballControl: 0.20,
    dribbling: 0.20,
    lowPass: 0.15,
    finishing: 0.15,
    speed: 0.10,
  },
  CF: {
    offensiveAwareness: 0.25,
    finishing: 0.25,
    kickingPower: 0.15,
    heading: 0.10,
    physicalContact: 0.10,
    speed: 0.10,
    jump: 0.05,
  },
};

// ─── Formation Definitions ───────────────────────────────────────────────────

/**
 * Mapping of formation name → ordered array of 11 position slots.
 * Index 0 is always GK.
 */
export const FORMATIONS: Record<string, PESPosition[]> = {
  // 5v5 (خماسي)
  '1-2-1': ['GK', 'CB', 'CMF', 'AMF', 'CF'],
  '2-1-1': ['GK', 'CB', 'CB', 'CMF', 'CF'],
  '1-1-2': ['GK', 'CB', 'CMF', 'LWF', 'RWF'],
  '2-2':   ['GK', 'CB', 'CB', 'CF', 'CF'],

  // 6v6 (سداسي)
  '2-2-1': ['GK', 'CB', 'CB', 'CMF', 'AMF', 'CF'],
  '2-1-2': ['GK', 'CB', 'CB', 'CMF', 'LWF', 'RWF'],
  '1-3-1': ['GK', 'CB', 'LMF', 'CMF', 'RMF', 'CF'],
  '3-1-1': ['GK', 'LB', 'CB', 'RB', 'CMF', 'CF'],

  // 7v7 (سباعي)
  '2-3-1': ['GK', 'CB', 'CB', 'LMF', 'CMF', 'RMF', 'CF'],
  '3-2-1': ['GK', 'LB', 'CB', 'RB', 'CMF', 'AMF', 'CF'],
  '2-2-2': ['GK', 'CB', 'CB', 'CMF', 'AMF', 'LWF', 'RWF'],
  '3-1-2': ['GK', 'LB', 'CB', 'RB', 'CMF', 'LWF', 'RWF'],
  '1-4-1': ['GK', 'CB', 'LMF', 'DMF', 'CMF', 'RMF', 'CF'],

  // 8v8 (ثماني)
  '3-3-1': ['GK', 'LB', 'CB', 'RB', 'LMF', 'CMF', 'RMF', 'CF'],
  '2-4-1': ['GK', 'CB', 'CB', 'LMF', 'DMF', 'CMF', 'RMF', 'CF'],
  '3-2-2': ['GK', 'LB', 'CB', 'RB', 'CMF', 'AMF', 'CF', 'CF'],
  '2-3-2': ['GK', 'CB', 'CB', 'LMF', 'CMF', 'RMF', 'LWF', 'RWF'],
  '4-2-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'AMF', 'CF'],

  // 9v9 (تساعي)
  '3-4-1': ['GK', 'LB', 'CB', 'RB', 'LMF', 'CMF', 'CMF', 'RMF', 'CF'],
  '3-3-2': ['GK', 'LB', 'CB', 'RB', 'LMF', 'CMF', 'RMF', 'CF', 'CF'],
  '4-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'AMF', 'CF'],
  '3-2-3': ['GK', 'LB', 'CB', 'RB', 'CMF', 'AMF', 'LWF', 'CF', 'RWF'],
  '2-4-2': ['GK', 'CB', 'CB', 'LMF', 'DMF', 'CMF', 'RMF', 'CF', 'CF'],

  // 10v10 (عشاري)
  '4-4-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'LMF', 'CMF', 'CMF', 'RMF', 'CF'],
  '4-3-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'AMF', 'LWF', 'RWF'],
  '3-4-2': ['GK', 'CB', 'CB', 'CB', 'LMF', 'CMF', 'DMF', 'RMF', 'CF', 'CF'],
  '3-5-1': ['GK', 'LB', 'CB', 'RB', 'LMF', 'DMF', 'CMF', 'AMF', 'RMF', 'CF'],
  '5-3-1': ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CMF', 'DMF', 'CMF', 'CF'],

  // 11v11 (أحد عشري)
  '4-3-3':          ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'AMF', 'LWF', 'CF', 'RWF'],
  '4-3-3 (Attack)': ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'CMF', 'AMF', 'LWF', 'CF', 'RWF'],
  '4-3-3 (Defend)': ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'DMF', 'CMF', 'LWF', 'CF', 'RWF'],
  '4-2-3-1':        ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'DMF', 'LMF', 'AMF', 'RMF', 'CF'],
  '4-4-2':          ['GK', 'LB', 'CB', 'CB', 'RB', 'LMF', 'CMF', 'CMF', 'RMF', 'CF', 'CF'],
  '4-2-2-2':        ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'DMF', 'AMF', 'AMF', 'CF', 'CF'],
  '4-1-4-1':        ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'LMF', 'CMF', 'AMF', 'RMF', 'CF'],
  '3-5-2':          ['GK', 'CB', 'CB', 'CB', 'LMF', 'CMF', 'DMF', 'CMF', 'RMF', 'CF', 'CF'],
  '3-4-3':          ['GK', 'CB', 'CB', 'CB', 'LMF', 'CMF', 'CMF', 'RMF', 'LWF', 'CF', 'RWF'],
  '3-4-1-2':        ['GK', 'CB', 'CB', 'CB', 'LMF', 'CMF', 'CMF', 'RMF', 'AMF', 'CF', 'CF'],
  '4-1-3-2':        ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'LMF', 'AMF', 'RMF', 'CF', 'CF'],
  '4-3-2-1':        ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'DMF', 'CMF', 'AMF', 'AMF', 'CF'],
  '4-1-2-1-2':      ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'CMF', 'CMF', 'AMF', 'CF', 'CF'],
  '5-3-2':          ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CMF', 'DMF', 'CMF', 'CF', 'CF'],
  '5-2-3':          ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'LWF', 'CF', 'RWF'],
  '4-2-4':          ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'LWF', 'CF', 'CF', 'RWF'],
  '5-4-1':          ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'LMF', 'CMF', 'CMF', 'RMF', 'CF'],
};

// ─── Helper Utilities ────────────────────────────────────────────────────────

/**
 * Clamp a value between a minimum and maximum.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate BMI from height (cm) and weight (kg).
 */
function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Compute the arithmetic mean of an array of numbers.
 * Returns 0 for an empty array.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ─── PSI Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the Position-Specific Index (PSI) for a player at a given position.
 *
 * The PSI combines:
 *  1. A weighted sum of relevant attributes (position-specific weights)
 *  2. A familiarity multiplier based on how well the position matches the
 *     player's preferred positions
 *  3. Physical modifiers based on height, BMI, and age
 *
 * @param player   - The player profile to evaluate.
 * @param position - The PES position to evaluate the player for.
 * @returns A numeric PSI score (higher is better).
 *
 * @example
 * ```ts
 * const psi = calculatePSI(myPlayer, 'CB');
 * console.log(`PSI at CB: ${psi.toFixed(2)}`);
 * ```
 */
/**
 * Evaluates positional familiarity & tactical compatibility for any position slot across the entire pitch.
 * Returns a precise familiarity multiplier [0.05 to 1.0].
 */
export function getPositionFamiliarityMultiplier(player: PlayerProfile, targetPosition: PESPosition): number {
  if (!player) return 0.20;
  const p1 = player.primaryPosition;
  const p2 = player.secondaryPosition;
  const p3 = player.tertiaryPosition;

  // Exact position matches
  if (targetPosition === p1) return POSITION_FAMILIARITY.primary; // 1.0
  if (targetPosition === p2) return POSITION_FAMILIARITY.secondary; // 0.90
  if (targetPosition === p3) return POSITION_FAMILIARITY.tertiary; // 0.75

  // GK Special Case: Non-GK playing GK
  if (targetPosition === 'GK') {
    return p1 === 'GK' ? 1.0 : 0.05;
  }

  const playerPositions = [p1, p2, p3].filter(Boolean) as PESPosition[];
  const hasDefensivePosition = playerPositions.some(p => ['CB', 'LB', 'RB', 'DMF'].includes(p));
  const isPureAttacker = playerPositions.every(p => ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(p));

  // Strict Protection 1: Pure attackers (CF/SS/LWF/RWF/AMF) MUST NOT play in defense (CB/LB/RB/DMF)
  if (['CB', 'LB', 'RB', 'DMF'].includes(targetPosition) && isPureAttacker) {
    return 0.15; // Extremely low score so engine picks natural defenders
  }

  // Strict Protection 2: Pure defenders MUST NOT play in attack (CF/SS/LWF/RWF)
  const isPureDefender = playerPositions.every(p => ['CB', 'LB', 'RB', 'GK'].includes(p));
  if (['CF', 'SS', 'LWF', 'RWF'].includes(targetPosition) && isPureDefender) {
    return 0.15;
  }

  // Opposite Fullback Crossover (RB playing LB or LB playing RB is very natural, 0.75)
  if ((targetPosition === 'LB' && playerPositions.includes('RB')) || (targetPosition === 'RB' && playerPositions.includes('LB'))) {
    return 0.75;
  }

  // Category matching
  const targetCat = POSITION_CATEGORIES[targetPosition];
  const p1Cat = POSITION_CATEGORIES[p1 || 'CMF'];
  const p2Cat = p2 ? POSITION_CATEGORIES[p2] : null;
  const p3Cat = p3 ? POSITION_CATEGORIES[p3] : null;

  // 1. Same exact Category (e.g. AMF playing CMF or LWF playing CF)
  if (p1Cat === targetCat || p2Cat === targetCat || p3Cat === targetCat) {
    // Exception: AMF <-> DMF within MID is NOT a smooth swap (AMF is playmaker, DMF is defensive anchor)
    if (targetPosition === 'DMF' && (p1 === 'AMF' || p2 === 'AMF' || p3 === 'AMF') && !hasDefensivePosition) {
      return 0.25;
    }
    if (targetPosition === 'AMF' && (p1 === 'DMF' || p2 === 'DMF' || p3 === 'DMF')) {
      return 0.35;
    }

    const isLeftSide = targetPosition === 'LB' || targetPosition === 'LMF' || targetPosition === 'LWF';
    const isRightSide = targetPosition === 'RB' || targetPosition === 'RMF' || targetPosition === 'RWF';

    const playerHasLeft = playerPositions.some(p => p === 'LB' || p === 'LMF' || p === 'LWF');
    const playerHasRight = playerPositions.some(p => p === 'RB' || p === 'RMF' || p === 'RWF');

    if ((isLeftSide && playerHasLeft) || (isRightSide && playerHasRight)) {
      return 0.70; // High side/category compatibility
    }
    return 0.65; // Same category
  }

  // 2. Adjacent Category Crossover Compatibility
  const isDefensiveMid = playerPositions.some(p => p === 'DMF' || p === 'CMF');
  const isWideMid = playerPositions.some(p => p === 'LMF' || p === 'RMF');
  const isFullback = playerPositions.some(p => p === 'LB' || p === 'RB');
  const isWinger = playerPositions.some(p => p === 'LWF' || p === 'RWF');
  const isAttackingMid = playerPositions.some(p => p === 'AMF' || p === 'SS');

  // Fullback <-> Wide Mid crossover (LMF/RMF <-> LB/RB)
  if ((targetPosition === 'LB' || targetPosition === 'RB') && isWideMid) {
    return 0.60;
  }
  if ((targetPosition === 'LMF' || targetPosition === 'RMF') && isFullback) {
    return 0.60;
  }

  // CB <-> DMF crossover
  if (targetPosition === 'CB' && isDefensiveMid) {
    return 0.55;
  }
  if (targetPosition === 'DMF' && (p1Cat === 'DEF' || playerPositions.includes('CB'))) {
    return 0.60;
  }

  // AMF <-> SS / Striker / Wing crossover
  if ((targetPosition === 'AMF' || targetPosition === 'SS') && (p1Cat === 'ATK' || isAttackingMid || isWinger)) {
    return 0.60;
  }

  // 3. Out-of-position role mismatch (e.g. CB playing CF, Attacker playing CB)
  return 0.20;
}

export function calculatePSI(player: PlayerProfile, position: PESPosition): number {
  const activeAttributes = player?.approvedAttributes || player?.attributes;
  if (!activeAttributes) {
    throw new Error(`calculatePSI: player "${player?.uid ?? 'unknown'}" has no attributes`);
  }

  const weights = PSI_WEIGHTS[position];
  if (!weights) {
    throw new Error(`calculatePSI: unknown position "${position}"`);
  }

  // ── Step 1: Weighted attribute sum ──
  let rawPSI = 0;
  for (const [attr, weight] of Object.entries(weights)) {
    const attrValue = activeAttributes[attr as keyof PlayerAttributes] ?? 40;
    rawPSI += weight * clamp(attrValue, 40, 99);
  }

  // ── Step 2: Universal Familiarity multiplier across ALL positions ──
  const familiarityMultiplier = getPositionFamiliarityMultiplier(player, position);

  let psi = rawPSI * familiarityMultiplier;

  // ── Step 3: Physical modifiers ──

  // Height bonus for CB and CF
  if (player.height > TALL_THRESHOLD_CM && (position === 'CB' || position === 'CF')) {
    psi *= 1.03;
  }

  // BMI speed bonus
  const bmi = calculateBMI(player.height, player.weight);
  if (bmi >= BMI_OPTIMAL_MIN && bmi <= BMI_OPTIMAL_MAX) {
    // Apply +2% to the speed-related component (not the full PSI)
    const speedWeight = weights.speed ?? 0;
    const accelWeight = weights.acceleration ?? 0;
    const speedComponent = speedWeight + accelWeight;
    if (speedComponent > 0) {
      psi *= 1 + 0.02 * speedComponent; // proportional to how much speed matters
    }
  }

  // Age modifiers
  const age = player.calculatedAge;
  if (age > 0 && age < YOUNG_AGE_THRESHOLD) {
    // Young player: +2% speed/acceleration bonus
    const speedWeight = weights.speed ?? 0;
    const accelWeight = weights.acceleration ?? 0;
    const speedComponent = speedWeight + accelWeight;
    if (speedComponent > 0) {
      psi *= 1 + 0.02 * speedComponent;
    }
  } else if (age >= VETERAN_AGE_THRESHOLD) {
    // Veteran: -3% stamina penalty
    const staminaWeight = weights.stamina ?? 0;
    if (staminaWeight > 0) {
      psi *= 1 - 0.03 * staminaWeight;
    }
  }

  // Footedness modifiers (Inverted Wingers / Fullbacks as requested)
  const foot = player.preferredFoot?.toLowerCase();
  if (foot === 'left' && ['LB', 'RWF', 'RMF'].includes(position)) {
    psi *= 1.05; // 5% bonus for preferred roles
  } else if (foot === 'right' && ['RB', 'LWF', 'LMF'].includes(position)) {
    psi *= 1.05; // 5% bonus for preferred roles
  }

  // ── Step 4: Position-specific Pace & Attribute Gating ──
  const pSpeed = activeAttributes.speed ?? 60;
  const pAccel = activeAttributes.acceleration ?? 60;
  const minPace = Math.min(pSpeed, pAccel);

  // Fullbacks (LB, RB) and Wingers (LWF, RWF, LMF, RMF) REQUIRE pace
  if (['LB', 'RB'].includes(position)) {
    if (minPace < 72) {
      // Steep penalty for slow fullbacks
      const penaltyFactor = Math.pow(minPace / 72, 2.0);
      psi *= penaltyFactor;
    } else if (minPace >= 78) {
      psi *= 1.05; // Pace bonus for fast fullbacks
    }
  } else if (['LWF', 'RWF', 'LMF', 'RMF'].includes(position)) {
    if (minPace < 70) {
      const penaltyFactor = Math.pow(minPace / 70, 2.0);
      psi *= penaltyFactor;
    } else if (minPace >= 78) {
      psi *= 1.05;
    }
  }

  // Defensive players with high defense/passing & low pace belong at CB, DMF, or CMF
  const pDefAware = activeAttributes.defensiveAwareness ?? 60;
  const pBallWin = activeAttributes.ballWinning ?? 60;
  const pLowPass = activeAttributes.lowPass ?? 60;

  if (['CB', 'DMF'].includes(position) && (pDefAware >= 72 || pBallWin >= 72)) {
    if (minPace < 72) {
      psi *= 1.10; // 10% boost for slow, high-def defensive pillars at CB/DMF
    }
  } else if (position === 'CMF' && (pLowPass >= 75 || pDefAware >= 70)) {
    if (minPace < 72) {
      psi *= 1.08; // 8% boost for central playmakers/midfielders with low pace
    }
  }

  return psi;
}

// ─── Team Metrics ────────────────────────────────────────────────────────────

/**
 * Calculate aggregate performance metrics for a team of players.
 *
 * Returns the average of each metric category across all team members.
 *
 * @param team - Array of player profiles.
 * @returns Aggregate `TeamMetrics`.
 */
export function calculateTeamMetrics(team: PlayerProfile[]): TeamMetrics {
  if (team.length === 0) {
    return { overall: 0, speed: 0, stamina: 0, defense: 0, attack: 0 };
  }

  const overalls: number[] = [];
  const speeds: number[] = [];
  const staminas: number[] = [];
  const defenses: number[] = [];
  const attacks: number[] = [];

  for (const p of team) {
    const a = p.approvedAttributes || p.attributes;
    if (!a) continue;

    // Overall uses positional weights
    const playerOverall = getPlayerOverall(p);
    overalls.push(playerOverall);
    speeds.push(mean([a.speed || 40, a.acceleration || 40]));
    staminas.push(a.stamina || 40);
    defenses.push(mean([a.defensiveAwareness || 40, a.ballWinning || 40]));
    attacks.push(mean([a.offensiveAwareness || 40, a.finishing || 40, a.kickingPower || 40]));
  }

  return {
    overall: mean(overalls),
    speed: mean(speeds),
    stamina: mean(staminas),
    defense: mean(defenses),
    attack: mean(attacks),
  };
}

// ─── Formation Selection ─────────────────────────────────────────────────────

/**
 * Determine how well a group of players fits a given formation.
 * Scores higher if more players can play in their 1st choice, then 2nd, then 3rd.
 */
function scoreFormation(players: PlayerProfile[], formation: PESPosition[]): number {
  let score = 0;
  const available = new Set(players.map((_, i) => i));
  const unfilledSlots = [...formation];

  // Pass 1: Primary positions
  for (let i = unfilledSlots.length - 1; i >= 0; i--) {
    const slot = unfilledSlots[i];
    let bestIdx = -1;
    let bestPSI = -Infinity;
    for (const idx of available) {
      if (players[idx].primaryPosition === slot) {
        const psi = calculatePSI(players[idx], slot);
        if (psi > bestPSI) { bestPSI = psi; bestIdx = idx; }
      }
    }
    if (bestIdx >= 0) {
      score += 1000 + bestPSI; // Heavy weight for 1st choice
      available.delete(bestIdx);
      unfilledSlots.splice(i, 1);
    }
  }

  // Pass 2: Secondary positions
  for (let i = unfilledSlots.length - 1; i >= 0; i--) {
    const slot = unfilledSlots[i];
    let bestIdx = -1;
    let bestPSI = -Infinity;
    for (const idx of available) {
      if (players[idx].secondaryPosition === slot) {
        const psi = calculatePSI(players[idx], slot);
        if (psi > bestPSI) { bestPSI = psi; bestIdx = idx; }
      }
    }
    if (bestIdx >= 0) {
      score += 100 + bestPSI; // Medium weight for 2nd choice
      available.delete(bestIdx);
      unfilledSlots.splice(i, 1);
    }
  }

  // Pass 3: Tertiary positions
  for (let i = unfilledSlots.length - 1; i >= 0; i--) {
    const slot = unfilledSlots[i];
    let bestIdx = -1;
    let bestPSI = -Infinity;
    for (const idx of available) {
      if (players[idx].tertiaryPosition === slot) {
        const psi = calculatePSI(players[idx], slot);
        if (psi > bestPSI) { bestPSI = psi; bestIdx = idx; }
      }
    }
    if (bestIdx >= 0) {
      score += 10 + bestPSI; // Light weight for 3rd choice
      available.delete(bestIdx);
      unfilledSlots.splice(i, 1);
    }
  }

  // Pass 4: Out of position (penalize incompatible role assignments heavy across ALL positions)
  for (let i = unfilledSlots.length - 1; i >= 0; i--) {
    const slot = unfilledSlots[i];
    let bestIdx = -1;
    let bestPSI = -Infinity;
    for (const idx of available) {
      const psi = calculatePSI(players[idx], slot);
      if (psi > bestPSI) { bestPSI = psi; bestIdx = idx; }
    }
    if (bestIdx >= 0) {
      const p = players[bestIdx];
      const mult = getPositionFamiliarityMultiplier(p, slot);
      const isMismatch = mult < 0.50;
      score += bestPSI - (isMismatch ? 1500 : 50);
      available.delete(bestIdx);
      unfilledSlots.splice(i, 1);
    }
  }

  return score;
}

/**
 * Select the best formation for a set of players from the supported catalogue.
 *
 * @param players - Exactly 11 players (or fewer; algorithm adapts).
 * @returns The formation name (e.g. `'4-3-3'`).
 */
export function selectBestFormation(players: PlayerProfile[]): string {
  const size = players.length;
  let bestFormation = '';
  let bestScore = -Infinity;

  // 1. Try to find formations matching exact team size
  for (const [name, slots] of Object.entries(FORMATIONS)) {
    if (slots.length === size) {
      const score = scoreFormation(players, slots);
      if (score > bestScore) {
        bestScore = score;
        bestFormation = name;
      }
    }
  }

  if (bestFormation) return bestFormation;

  // 2. Fallback for sizes < 5 or > 11: penalize size mismatch
  for (const [name, slots] of Object.entries(FORMATIONS)) {
    const score = scoreFormation(players, slots) - Math.abs(slots.length - size) * 100;
    if (score > bestScore) {
      bestScore = score;
      bestFormation = name;
    }
  }

  return bestFormation || '4-3-3';
}

// ─── Positional Assignment with Backtracking ─────────────────────────────────

/**
 * Candidate entry used during conflict resolution.
 */
interface Candidate {
  playerIndex: number;
  psi: number;
}

function popcount(value: number): number {
  let count = 0;
  while (value) {
    value &= value - 1;
    count += 1;
  }
  return count;
}

function buildSlotOrder(slots: PESPosition[], psiMatrix: number[][]): number[] {
  return Array.from({ length: slots.length }, (_, i) => i).sort((a, b) => {
    if (slots[a] === 'GK' && slots[b] !== 'GK') return -1;
    if (slots[b] === 'GK' && slots[a] !== 'GK') return 1;
    const spreadA = Math.max(...psiMatrix[a]) - Math.min(...psiMatrix[a]);
    const spreadB = Math.max(...psiMatrix[b]) - Math.min(...psiMatrix[b]);
    return spreadA - spreadB;
  });
}

function findOptimalAssignment(
  psiMatrix: number[][],
  slotOrder: number[],
  playersCount: number,
): number[] {
  const slotsCount = slotOrder.length;
  const maxMask = 1 << playersCount;
  const dp = new Float64Array(maxMask).fill(-Infinity);
  const choice = new Int32Array(maxMask).fill(-1);

  dp[0] = 0;

  for (let mask = 1; mask < maxMask; mask++) {
    const assignedSlots = popcount(mask);
    if (assignedSlots > slotsCount) continue;

    const slotIndex = assignedSlots - 1;
    let bestScore = -Infinity;
    let bestPlayer = -1;

    for (let p = 0; p < playersCount; p++) {
      const bit = 1 << p;
      if (!(mask & bit)) continue;
      const prevMask = mask ^ bit;
      const score = dp[prevMask] + psiMatrix[slotOrder[slotIndex]][p];
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = p;
      }
    }

    dp[mask] = bestScore;
    choice[mask] = bestPlayer;
  }

  let bestFinalMask = -1;
  let bestFinalScore = -Infinity;
  for (let mask = 0; mask < maxMask; mask++) {
    if (popcount(mask) !== slotsCount) continue;
    if (dp[mask] > bestFinalScore) {
      bestFinalScore = dp[mask];
      bestFinalMask = mask;
    }
  }

  if (bestFinalMask < 0) {
    return new Array(slotsCount).fill(-1);
  }

  const assignment = new Array(slotsCount).fill(-1);
  let mask = bestFinalMask;
  for (let slot = slotsCount - 1; slot >= 0; slot--) {
    const playerIndex = choice[mask];
    if (playerIndex < 0) break;
    assignment[slot] = playerIndex;
    mask ^= 1 << playerIndex;
  }

  return assignment;
}

/**
 * Assign players to formation slots using optimal assignment across all viable candidates.
 *
 * This algorithm uses a full slot-player PSI matrix and selects the assignment with the
 * highest total score, ensuring fallback when a slot cannot be filled by a natural player.
 * It prioritises specialist slots like GK while allowing secondary and tertiary players to
 * occupy roles they can perform confidently.
 *
 * @param players   - Array of player profiles.
 * @param formation - The formation name to use.
 * @returns Array of `AssignedPlayer` objects.
 */
export function assignPlayersToFormation(
  players: PlayerProfile[],
  formation: string,
): AssignedPlayer[] {
  const slots = FORMATIONS[formation];
  if (!slots) {
    throw new Error(`assignPlayersToFormation: unknown formation "${formation}"`);
  }

  const numSlots = Math.min(slots.length, players.length);
  const result: AssignedPlayer[] = new Array(numSlots).fill(null);
  const availablePlayers = new Set(players.map((_, i) => i));
  const unfilledSlots = new Set(slots.slice(0, numSlots).map((_, i) => i));

  // Helper to find the best player for a slot matching a specific position property
  const fillPass = (posProperty: 'primaryPosition' | 'secondaryPosition' | 'tertiaryPosition') => {
    // Sort slots by how many available players can play them (fewer options = fill first)
    const sortedSlots = Array.from(unfilledSlots).sort((a, b) => {
      let countA = 0, countB = 0;
      availablePlayers.forEach(pIdx => { if (players[pIdx][posProperty] === slots[a]) countA++; });
      availablePlayers.forEach(pIdx => { if (players[pIdx][posProperty] === slots[b]) countB++; });
      return countA - countB;
    });

    for (const slotIdx of sortedSlots) {
      if (!unfilledSlots.has(slotIdx)) continue;
      
      let bestIdx = -1;
      let bestPSI = -Infinity;
      
      for (const pIdx of availablePlayers) {
        if (players[pIdx][posProperty] === slots[slotIdx]) {
          const psi = calculatePSI(players[pIdx], slots[slotIdx]);
          if (psi > bestPSI) {
            bestPSI = psi;
            bestIdx = pIdx;
          }
        }
      }

      if (bestIdx >= 0) {
        result[slotIdx] = {
          ...players[bestIdx],
          assignedPosition: slots[slotIdx],
          psi: bestPSI
        };
        availablePlayers.delete(bestIdx);
        unfilledSlots.delete(slotIdx);
      }
    }
  };

  // 1. Fill 1st choices
  fillPass('primaryPosition');
  // 2. Fill 2nd choices
  fillPass('secondaryPosition');
  // 3. Fill 3rd choices
  fillPass('tertiaryPosition');

  // 3.5. Universal Category & Crossover Compatibility Pass for ALL 13 Positions across the Pitch
  for (const slotIdx of Array.from(unfilledSlots)) {
    const targetSlot = slots[slotIdx];
    let bestIdx = -1;
    let bestPSI = -Infinity;

    for (const pIdx of availablePlayers) {
      const p = players[pIdx];
      const mult = getPositionFamiliarityMultiplier(p, targetSlot);

      // Require at least category or tactical crossover compatibility (multiplier >= 0.50)
      if (mult >= 0.50) {
        const psi = calculatePSI(p, targetSlot);
        if (psi > bestPSI) {
          bestPSI = psi;
          bestIdx = pIdx;
        }
      }
    }

    if (bestIdx >= 0) {
      result[slotIdx] = {
        ...players[bestIdx],
        assignedPosition: targetSlot,
        psi: bestPSI
      };
      availablePlayers.delete(bestIdx);
      unfilledSlots.delete(slotIdx);
    }
  }

  // 4. Fill remaining slots with highest PSI overall
  for (const slotIdx of Array.from(unfilledSlots)) {
    const isGkSlot = slots[slotIdx] === 'GK';
    let bestIdx = -1;
    let bestPSI = -Infinity;
    
    for (const pIdx of availablePlayers) {
      let psi = calculatePSI(players[pIdx], slots[slotIdx]);
      
      // If it's a GK slot and player is an outfield player, severely penalize high-OVR stars
      if (isGkSlot && players[pIdx].primaryPosition !== 'GK') {
        const ovr = getPlayerOverall(players[pIdx]);
        psi *= (1 / (ovr * 10)); // Protect high-OVR outfield players from playing in goal
      }

      if (psi > bestPSI) {
        bestPSI = psi;
        bestIdx = pIdx;
      }
    }

    if (bestIdx >= 0) {
      result[slotIdx] = {
        ...players[bestIdx],
        assignedPosition: slots[slotIdx],
        psi: bestPSI
      };
      availablePlayers.delete(bestIdx);
      unfilledSlots.delete(slotIdx);
    }
  }

  // Add remaining unassigned players to the result (as bench/subs)
  for (const pIdx of availablePlayers) {
    result.push({
      ...players[pIdx],
      assignedPosition: players[pIdx].primaryPosition,
      psi: calculatePSI(players[pIdx], players[pIdx].primaryPosition)
    });
  }

  return result.filter(Boolean); // Clean out any nulls just in case
}

// ─── Team Balancing ──────────────────────────────────────────────────────────

/**
 * Calculate total variance between two teams across all metric categories including Attack & Versatility.
 */
function calculateTotalVariance(
  metricsA: TeamMetrics,
  metricsB: TeamMetrics,
  teamAPlayers?: PlayerProfile[],
  teamBPlayers?: PlayerProfile[],
): { overall: number; speed: number; stamina: number; defense: number; attack: number; versatility: number; total: number } {
  const diffOverall = Math.abs(metricsA.overall - metricsB.overall);
  const diffSpeed = Math.abs(metricsA.speed - metricsB.speed);
  const diffStamina = Math.abs(metricsA.stamina - metricsB.stamina);
  const diffDefense = Math.abs(metricsA.defense - metricsB.defense);
  const diffAttack = Math.abs(metricsA.attack - metricsB.attack);

  let diffVersatility = 0;
  if (teamAPlayers && teamBPlayers) {
    const versA = teamAPlayers.filter(p => p.secondaryPosition || p.tertiaryPosition).length;
    const versB = teamBPlayers.filter(p => p.secondaryPosition || p.tertiaryPosition).length;
    diffVersatility = Math.abs(versA - versB) * 0.15;
  }

  return {
    overall: diffOverall,
    speed: diffSpeed,
    stamina: diffStamina,
    defense: diffDefense,
    attack: diffAttack,
    versatility: diffVersatility,
    total: diffOverall * 2.0 + diffSpeed + diffStamina + diffDefense + diffAttack + diffVersatility,
  };
}

/**
 * Partition players into two balanced teams using category-partitioned serpentine draft
 * followed by iterative swap-based variance minimisation.
 * By drafting within each position category (GK, DEF, MID, ATK) independently,
 * we ensure both teams have equal positional balance and elite talent distribution.
 */
function partitionPlayers(players: PlayerProfile[]): [PlayerProfile[], PlayerProfile[]] {
  if (players.length < 2) {
    throw new Error('partitionPlayers: need at least 2 players');
  }

  const teamSize = Math.floor(players.length / 2);

  const teamA: PlayerProfile[] = [];
  const teamB: PlayerProfile[] = [];

  // Identify top 2 captains
  const captains = [...players]
    .filter(p => (p.captainVotes?.length || 0) > 0)
    .sort((a, b) => (b.captainVotes?.length || 0) - (a.captainVotes?.length || 0))
    .slice(0, 2);

  const captainIds = new Set(captains.map(c => c.uid));
  
  if (captains.length > 0) teamA.push(captains[0]);
  if (captains.length > 1) teamB.push(captains[1]);

  // Group remaining players by category: GK, DEF, MID, ATK
  const categories: Record<PositionCategory, PlayerProfile[]> = {
    GK: [],
    DEF: [],
    MID: [],
    ATK: [],
  };

  players.forEach(p => {
    if (captainIds.has(p.uid)) return;
    const cat = POSITION_CATEGORIES[p.primaryPosition || 'CMF'] || 'MID';
    categories[cat].push(p);
  });

  // Serpentine draft inside each position category —
  // sort by PSI at the player's own primary position so positional specialists
  // are picked ahead of high-OVR players who happen to share the same category.
  const catKeys: PositionCategory[] = ['GK', 'DEF', 'MID', 'ATK'];
  catKeys.forEach(cat => {
    const sortedCat = [...categories[cat]].sort((a, b) => {
      const psiA = calculatePSI(a, a.primaryPosition);
      const psiB = calculatePSI(b, b.primaryPosition);
      // Blend PSI (70%) and OVR (30%) so a super-star in the right role stays
      // ahead of an average player, but a specialist beats an OVR-padded misfit.
      const scoreA = psiA * 0.70 + getPlayerOverall(a) * 0.30;
      const scoreB = psiB * 0.70 + getPlayerOverall(b) * 0.30;
      return scoreB - scoreA;
    });

    for (let i = 0; i < sortedCat.length; i++) {
      if (cat === 'GK') {
        // Guarantee strictly 1 GK to Team A, 1 GK to Team B
        if (teamA.filter(p => p.primaryPosition === 'GK').length <= teamB.filter(p => p.primaryPosition === 'GK').length) {
          teamA.push(sortedCat[i]);
        } else {
          teamB.push(sortedCat[i]);
        }
      } else {
        const round = Math.floor(i / 2);
        if (i % 2 === 0) {
          (round % 2 === 0 ? teamA : teamB).push(sortedCat[i]);
        } else {
          (round % 2 === 0 ? teamB : teamA).push(sortedCat[i]);
        }
      }
    }
  });

  // Rebalance if one team ended up slightly larger due to odd counts across categories
  while (teamA.length > teamSize) teamB.push(teamA.pop()!);
  while (teamB.length > teamSize) teamA.push(teamB.pop()!);

  return [teamA, teamB];
}

/**
 * Attempt to reduce inter-team variance by swapping same-position players
 * between the two teams.
 */
function iterativeSwapBalance(
  teamA: PlayerProfile[],
  teamB: PlayerProfile[],
): [PlayerProfile[], PlayerProfile[]] {
  const a = [...teamA];
  const b = [...teamB];

  // Identify top captains again so we don't swap them
  const allPlayers = [...teamA, ...teamB];
  const captains = allPlayers
    .filter(p => (p.captainVotes?.length || 0) > 0)
    .sort((p1, p2) => (p2.captainVotes?.length || 0) - (p1.captainVotes?.length || 0))
    .slice(0, 2);
  const captainIds = new Set(captains.map(c => c.uid));

  let currentVariance = calculateTotalVariance(
    calculateTeamMetrics(a),
    calculateTeamMetrics(b),
    a,
    b,
  );

  for (let iter = 0; iter < MAX_BALANCE_ITERATIONS; iter++) {
    if (currentVariance.total < CONVERGENCE_THRESHOLD) break;

    let bestSwap: [number, number] | null = null;
    let bestNewVariance = currentVariance.total;

    for (let i = 0; i < a.length; i++) {
      if (captainIds.has(a[i].uid)) continue;
      for (let j = 0; j < b.length; j++) {
        if (captainIds.has(b[j].uid)) continue;
        if (!arePositionCompatible(a[i], b[j])) continue;

        const temp = a[i];
        a[i] = b[j];
        b[j] = temp;

        const trialVariance = calculateTotalVariance(
          calculateTeamMetrics(a),
          calculateTeamMetrics(b),
          a,
          b,
        );

        if (trialVariance.total < bestNewVariance - 0.0002) {
          bestSwap = [i, j];
          bestNewVariance = trialVariance.total;
        }

        b[j] = a[i];
        a[i] = temp;
      }
    }

    if (bestSwap) {
      const [i, j] = bestSwap;
      const temp = a[i];
      a[i] = b[j];
      b[j] = temp;
      currentVariance = calculateTotalVariance(
        calculateTeamMetrics(a),
        calculateTeamMetrics(b),
        a,
        b,
      );
    } else {
      break;
    }
  }

  return [a, b];
}

/**
 * Group positions into categories for swap compatibility.
 */
type PositionCategory = 'GK' | 'DEF' | 'MID' | 'ATK';

const POSITION_CATEGORIES: Record<PESPosition, PositionCategory> = {
  GK: 'GK',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  DMF: 'MID',
  CMF: 'MID',
  AMF: 'MID',
  LMF: 'MID',
  RMF: 'MID',
  LWF: 'ATK',
  RWF: 'ATK',
  SS: 'ATK',
  CF: 'ATK',
};

/**
 * Check if two players are in compatible position groups for swapping.
 * Evaluates 1st, 2nd, and 3rd positions to unlock flexible, realistic tactical rotation.
 */
function arePositionCompatible(a: PlayerProfile, b: PlayerProfile): boolean {
  const catA = POSITION_CATEGORIES[a.primaryPosition || 'CMF'] || 'MID';
  const catB = POSITION_CATEGORIES[b.primaryPosition || 'CMF'] || 'MID';

  if (catA === 'GK' || catB === 'GK') {
    return catA === catB;
  }

  if (catA === catB) return true;

  const adjacent: Record<PositionCategory, PositionCategory[]> = {
    GK: [],
    DEF: ['MID'],
    MID: ['DEF', 'ATK'],
    ATK: ['MID'],
  };

  // Check multi-position compatibility (2nd and 3rd positions)
  const aPosList = [a.primaryPosition, a.secondaryPosition, a.tertiaryPosition].filter(Boolean) as PESPosition[];
  const bPosList = [b.primaryPosition, b.secondaryPosition, b.tertiaryPosition].filter(Boolean) as PESPosition[];

  for (const posA of aPosList) {
    const cA = POSITION_CATEGORIES[posA] || 'MID';
    for (const posB of bPosList) {
      const cB = POSITION_CATEGORIES[posB] || 'MID';
      if (cA === 'GK' || cB === 'GK') continue;
      if (cA === cB || adjacent[cA]?.includes(cB)) {
        return true;
      }
    }
  }

  return adjacent[catA]?.includes(catB) ?? false;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Balance a pool of players into two fair teams with optimal formations.
 *
 * Pipeline:
 *  1. **Partition** players into two teams via serpentine draft
 *  2. **Swap-balance** to minimise inter-team variance
 *  3. **Select formation** independently for each team
 *  4. **Assign positions** using backtracking conflict resolution
 *  5. **Return** the full `MatchmakingResult`
 *
 * @param players - Array of player profiles (must have an even count, typically 22).
 * @returns A `MatchmakingResult` containing both teams, formations, and variance metrics.
 *
 * @throws {Error} If fewer than 2 players are provided.
 *
 * @example
 * ```ts
 * const result = balanceTeams(allPlayers);
 * console.log(result.formation); // { teamA: '4-3-3', teamB: '4-4-2' }
 * console.log(result.metrics.variance.overall); // ~0.5
 * ```
 */
/**
 * Generates a virtual squad filler for standard 11v11 matches when roster is below 22 players.
 */
function createVirtualFiller(position: PESPosition, index: number, avgOvr: number = 68): PlayerProfile {
  return {
    uid: `filler-${position}-${index}-${Date.now()}`,
    fullName: `AI Reserve (${position})`,
    cardName: `AI Reserve (${position})`,
    primaryPosition: position,
    secondaryPosition: undefined,
    tertiaryPosition: undefined,
    overallRating: avgOvr,
    attributes: {
      speed: avgOvr,
      acceleration: avgOvr,
      finishing: avgOvr - 2,
      offensiveAwareness: avgOvr - 2,
      defensiveAwareness: avgOvr + 2,
      ballWinning: avgOvr + 2,
      physicalContact: avgOvr + 2,
      stamina: avgOvr + 2,
      lowPass: avgOvr,
      loftedPass: avgOvr - 1,
      ballControl: avgOvr,
      dribbling: avgOvr - 1,
      kickingPower: avgOvr,
      heading: avgOvr,
      jump: avgOvr,
      balance: avgOvr,
      gkAwareness: position === 'GK' ? avgOvr + 8 : 35,
      gkCatching: position === 'GK' ? avgOvr + 8 : 35,
      gkClearing: position === 'GK' ? avgOvr + 8 : 35,
      gkReflexes: position === 'GK' ? avgOvr + 8 : 35,
      gkReach: position === 'GK' ? avgOvr + 8 : 35,
    },
    approvedAttributes: undefined,
    homeCommunityId: 'unlocked',
  } as unknown as PlayerProfile;
}

/**
 * Main standard 11v11 team balancing entry point.
 */
export function balanceTeams(players: PlayerProfile[]): MatchmakingResult {
  if (!Array.isArray(players) || players.length < 2) {
    throw new Error(
      `balanceTeams: expected an array of at least 2 players, got ${players?.length ?? 0}`,
    );
  }

  // ── 0. Group pool by position categories to ensure balanced 22-starter draft ──
  const getCat = (p: PlayerProfile): PositionCategory => POSITION_CATEGORIES[p.primaryPosition || 'CMF'] || 'MID';
  const gks = players.filter(p => getCat(p) === 'GK').sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  const defs = players.filter(p => getCat(p) === 'DEF').sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  const mids = players.filter(p => getCat(p) === 'MID').sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  const atks = players.filter(p => getCat(p) === 'ATK').sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));

  const startersPool: PlayerProfile[] = [];
  const benchPool: PlayerProfile[] = [];

  // Pick GKs (up to 2 for starters)
  startersPool.push(...gks.slice(0, 2));
  benchPool.push(...gks.slice(2));

  // Pick Defenders (up to 8 for starters)
  startersPool.push(...defs.slice(0, 8));
  benchPool.push(...defs.slice(8));

  // Pick Midfielders (up to 6 for starters)
  startersPool.push(...mids.slice(0, 6));
  benchPool.push(...mids.slice(6));

  // Pick Attackers (up to 6 for starters)
  startersPool.push(...atks.slice(0, 6));
  benchPool.push(...atks.slice(6));

  // Fill startersPool up to 22 if still under using highest OVR bench players
  if (startersPool.length < 22 && benchPool.length > 0) {
    benchPool.sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
    const needed = Math.min(22 - startersPool.length, benchPool.length);
    startersPool.push(...benchPool.splice(0, needed));
  }

  // ── 1. Partition 22 starters into Team A and Team B ──
  let [rawA, rawB] = partitionPlayers(startersPool);

  // ── 2. Swap-balance ──
  [rawA, rawB] = iterativeSwapBalance(rawA, rawB);

  // ── 3. Force EXACTLY 11 starters per team for standard 11v11 ──
  const fillTo11 = (pool: PlayerProfile[]): PlayerProfile[] => {
    const starters = pool.slice(0, 11);
    const needed = 11 - starters.length;
    if (needed <= 0) return starters;

    const fillPositions: PESPosition[] = ['CB', 'LB', 'RB', 'CMF', 'DMF', 'AMF', 'LWF', 'RWF', 'CF', 'SS'];
    for (let i = 0; i < needed; i++) {
      starters.push(createVirtualFiller(fillPositions[i % fillPositions.length], i + 1, 68));
    }
    return starters;
  };

  const startersA = fillTo11(rawA);
  const startersB = fillTo11(rawB);

  const extraA = rawA.length > 11 ? rawA.slice(11) : [];
  const extraB = rawB.length > 11 ? rawB.slice(11) : [];
  const allBenchPool = [...benchPool, ...extraA, ...extraB];

  // ── 4. Select formations for starters and assign positions ──
  const formationA = selectBestFormation(startersA);
  const formationB = selectBestFormation(startersB);

  const teamA = assignPlayersToFormation(startersA, formationA);
  const teamB = assignPlayersToFormation(startersB, formationB);

  const benchList = allBenchPool.map(p => ({ player: p, reason: "Substitute (Bench)" }));
  const halfBench = Math.ceil(benchList.length / 2);
  const benchA = benchList.slice(0, halfBench);
  const benchB = benchList.slice(halfBench);

  // ── 5. Generate AI Manager Advices ──
  const metricsA = calculateTeamMetrics(teamA);
  const metricsB = calculateTeamMetrics(teamB);
  
  const generateAdvice = (myTeam: AssignedPlayer[], oppTeam: AssignedPlayer[], myMetrics: TeamMetrics, oppMetrics: TeamMetrics, formation: string, oppFormation: string) => {
    let advice = "👔 Manager's Tactical Brief: ";
    
    // Pace & Physicality analysis
    if (myMetrics.speed > oppMetrics.speed + 1.5) {
      advice += "⚡ We possess a distinct speed and acceleration advantage over their defensive unit. Direct wing play and quick transition balls behind their fullbacks will create high-probability scoring chances. ";
    } else if (oppMetrics.speed > myMetrics.speed + 1.5) {
      advice += "🛡️ Notice that the opponent has rapid attackers. Instruct fullbacks to hold a deeper defensive line and avoid committing too high during build-up play. ";
    }

    if (myMetrics.defense > oppMetrics.attack + 1.5) {
      advice += "🔒 Our backline dominates their offensive rating. Maintain a compact low-mid block, force them into long-range shots, and launch rapid counter-attacks. ";
    } else if (myMetrics.attack > oppMetrics.defense + 1.5) {
      advice += "🔥 We hold a massive offensive mismatch. Press their center-backs aggressively in their defensive third and sustain high possession around their penalty area. ";
    } else if (myMetrics.stamina > oppMetrics.stamina + 1.5) {
      advice += "💪 Superior endurance and physical condition are on our side. Implement high-pressing trigger traps in the second half when their midfielders begin to fatigue. ";
    } else {
      advice += "⚖️ This fixture is tactically knife-edged. Midfield dominance, winning second balls, and clinical execution on corner kicks will determine the winner. ";
    }

    // Versatility & Depth Synergy
    const versatileCount = myTeam.filter(p => p.secondaryPosition || p.tertiaryPosition).length;
    if (versatileCount >= 4) {
      advice += `🔄 Tactical Fluidity: With ${versatileCount} versatile multi-position players in our lineup, encourage seamless rotational interchanging between wide and central areas without losing defensive structure. `;
    }
    
    // Formation synergy & Counter-tactic
    if (formation === '4-3-3') {
      advice += `Our 4-3-3 provides width against their ${oppFormation}. Ensure wide forwards stay on the touchline to isolate their fullbacks 1v1, allowing our central midfielders to make late underlapping runs.`;
    } else if (formation === '4-4-2') {
      advice += `Playing a classic 4-4-2 against their ${oppFormation} requires tight vertical compactness. Strikers should stagger their positioning—one dropping deep to link play while the other pins their central defenders back.`;
    } else if (formation === '3-5-2') {
      advice += `The 3-5-2 gives us numerical superiority in central midfield over their ${oppFormation}. Wing-backs must provide relentless box-to-box work rate to prevent wide overloads.`;
    } else if (formation === '4-2-3-1') {
      advice += `In our 4-2-3-1, the Attacking Midfielder (AMF) is the tactical pivot. Feed vertical line-breaking passes into the AMF's feet between their midfield and defensive lines.`;
    } else if (formation === '5-3-2') {
      advice += `Our solid 5-3-2 setup neutralizes their ${oppFormation} goal threats. Stay disciplined in defense and release quick diagonal long balls to our two center forwards upon regaining possession.`;
    } else {
      const parts = formation.split('-');
      if (parts.length >= 3) {
        advice += `Playing our ${formation} setup (with ${parts[0]} defenders, ${parts[1]} midfielders, and ${parts[2]} attackers) against their ${oppFormation} provides optimal balance for our squad size. Focus on maintaining compact distances between lines and executing rapid offensive transitions upon winning possession.`;
      } else {
        advice += `Maintain strict positional discipline in our ${formation} system and support the ball carrier at all times.`;
      }
    }

    return advice;
  };

  const generateAdviceAr = (myTeam: AssignedPlayer[], oppTeam: AssignedPlayer[], myMetrics: TeamMetrics, oppMetrics: TeamMetrics, formation: string, oppFormation: string) => {
    let advice = "👔 ملخص تعليمات المدرب: ";
    
    if (myMetrics.speed > oppMetrics.speed + 1.5) {
      advice += "⚡ نمتلك تفوقاً واضحاً في السرعة والانطلاقات مقارنة بدفاع الخصم. الاعتماد على اللعب عبر الأطراف وإرسال الكرات الطويلة خلف الأظهرة سيخلق فرصاً تهديفية محققة. ";
    } else if (oppMetrics.speed > myMetrics.speed + 1.5) {
      advice += "🛡️ انتبه: يمتلك الخصم مهاجمين يتميزون بالسرعة الفائقة. وجه تعليماتك للأظهرة بالبقاء في التغطية الدفاعية الخلفية وعدم التقدم المبالغ فيه أثناء بناء الهجمات. ";
    }

    if (myMetrics.defense > oppMetrics.attack + 1.5) {
      advice += "🔒 خط دفاعنا يتفوق بشكل ساحق على هجوم الخصم. حافظ على تماسك الخطوط مع إغلاق المساحات، واجبرهم على التسديد من خارج منطقة الجزاء مع الاعتماد على الهجمات المرتدة السريعة. ";
    } else if (myMetrics.attack > oppMetrics.defense + 1.5) {
      advice += "🔥 نمتلك تفوقاً هجومياً كاسحاً في هذا اللقاء. اضغط بشراسة على قلوب دفاع الخصم في مناطقهم، وحافظ على الاستحواذ العالي والمستمر حول منطقة جزائهم. ";
    } else if (myMetrics.stamina > oppMetrics.stamina + 1.5) {
      advice += "💪 نتفوق بوضوح في اللياقة البدنية والمعدل البدني. اعتمد على مصائد الضغط العالي في الشوط الثاني عندما يبدأ لاعبو خط وسط الخصم في الشعور بالإرهاق. ";
    } else {
      advice += "⚖️ المواجهة متكافئة وحساسة تكتيكياً إلى حد كبير. السيطرة على خط الوسط، والفوز بالكرات الثانية، والاستغلال الأمثل للكرات الثابتة والركنيات هو ما سيحسم نتيجة اللقاء. ";
    }
    
    const versatileCount = myTeam.filter(p => p.secondaryPosition || p.tertiaryPosition).length;
    if (versatileCount >= 4) {
      advice += `🔄 المرونة التكتيكية: بوجود ${versatileCount} لاعبين متعددي المراكز في التشكيلة، اعتمد على تبادل المراكز السريع بين العمق والأطراف لإرباك رقابة الخصم مع الحفاظ على التوازن الدفاعي. `;
    }

    if (formation === '4-3-3') {
      advice += `تشكيلة 4-3-3 تمنحنا انتشاراً وعرضاً مثالياً للملعب أمام تشكيلة الخصم ${oppFormation}. تأكد من بقاء الأجنحة على الخطوط الجانبية لعزل أظهرة الخصم في مواجهات فردية، مما يسمح للاعبي الوسط بالاختراق من العمق.`;
    } else if (formation === '4-4-2') {
      advice += `الاعتماد على تشكيلة 4-4-2 الكلاسيكية أمام ${oppFormation} يتطلب تقارباً عمودياً وتماسكاً بين الخطوط. يجب على المهاجمين تنويع تحركاتهم—أحدهما يسقط للخلف لربط اللعب والآخر يضغط على قلوب الدفاع.`;
    } else if (formation === '3-5-2') {
      advice += `تشكيلة 3-5-2 تمنحنا تفوقاً عددياً في عمق خط الوسط أمام ${oppFormation}. يجب على أظهرة الجناح تقديم مجهود بدني مضاعف تغطيةً وهجوماً لمنع أي تفوق للخصم على الأطراف.`;
    } else if (formation === '4-2-3-1') {
      advice += `في تشكيلة 4-2-3-1، يعتبر صانع الألعاب (AMF) هو المحور التكتيكي الأهم أمام ${oppFormation}. مرر كرات عمودية كاسرة للخطوط إلى قدميه في المساحة بين خطي وسط ودفاع الخصم.`;
    } else if (formation === '5-3-2') {
      advice += `تشكيلة 5-3-2 الصلبة تحيد خطورة هجوم الخصم أمام ${oppFormation}. التزم بالانضباط الدفاعي الصارم مع إرسال كرات قطرية طويلة ومباشرة لثنائي الهجوم فور استرجاع الكرة.`;
    } else {
      const parts = formation.split('-');
      if (parts.length >= 3) {
        advice += `الاعتماد على تشكيلة ${formation} (تتكون من ${parts[0]} مدافعين، ${parts[1]} لاعبي وسط، و ${parts[2]} مهاجمين) أمام تشكيلة الخصم ${oppFormation} يمنحنا توازناً ممتازاً لتناسب عدد لاعبي الفريق. ركز على التقارب بين الخطوط والتحول السريع من الدفاع للهجوم فور استرجاع الكرة.`;
      } else {
        advice += `حافظ على الانضباط التكتيكي والمركزية في تشكيلة ${formation} مع تقديم الدعم المستمر لحامل الكرة في جميع أرجاء الملعب.`;
      }
    }

    return advice;
  };

  const adviceA = generateAdvice(teamA, teamB, metricsA, metricsB, formationA, formationB);
  const adviceB = generateAdvice(teamB, teamA, metricsB, metricsA, formationB, formationA);
  const adviceA_Ar = generateAdviceAr(teamA, teamB, metricsA, metricsB, formationA, formationB);
  const adviceB_Ar = generateAdviceAr(teamB, teamA, metricsB, metricsA, formationB, formationA);

  return {
    teamA,
    teamB,
    benchA: benchA.length > 0 ? benchA : undefined,
    benchB: benchB.length > 0 ? benchB : undefined,
    bench: benchList,
    formation: {
      teamA: formationA,
      teamB: formationB,
    },
    tipsAndTactics: {
      teamA: adviceA,
      teamB: adviceB,
      teamA_Ar: adviceA_Ar,
      teamB_Ar: adviceB_Ar,
    } as any,
    metrics: {
      teamAOverall: metricsA.overall,
      teamBOverall: metricsB.overall,
      variance: calculateTotalVariance(metricsA, metricsB, teamA, teamB),
    },
  };
}


/**
 * @module turfMatchmaker
 * @description Multi-team Serpentine draft engine for turf/casual matchmaking.
 *
 * Supports:
 *  - 2, 3, or 4+ teams in small-sided games (4v4 to 8v8)
 *  - Serpentine (snake) draft for fair OVR distribution across N teams
 *  - GK rotation schedule (fixed or rotating every goal/time interval)
 *  - League or Knockout tournament fixtures generator
 */


// ─── Exported Types ───────────────────────────────────────────────────────────

export interface TurfTeam {
  id: string;
  name: string;
  players: PlayerProfile[];
  bench?: PlayerProfile[];
  totalOvr: number;
  avgOvr: number;
  gkOrder: PlayerProfile[]; // Rotating GK order for this team
  fixedGkUid?: string;      // UID if a fixed GK was picked for this team
  formation?: string;
  assignedPlayers?: AssignedPlayer[];
}

export interface TurfFixture {
  round: number;
  teamA: string; // team id
  teamB: string;
  label: string; // e.g. "Round 1: Team A vs Team B"
}

export interface TurfMatchmakingResult {
  teams: TurfTeam[];
  bench?: PlayerProfile[];
  waitingTeams?: TurfTeam[];
  gkRotationSchedule: { teamId: string; playerName: string; matchNumber: number }[];
  fixtures: TurfFixture[];
  matchType: 'league' | 'knockout' | 'winner_stays' | 'friendly';
  numTeams: number;
  playersPerTeam: number;
  gkMode: 'fixed' | 'rotating';
  gkRotationInterval: 'per_match' | 'per_goal' | 'per_time';
  matchDurationMins: number;
  endCondition?: 'time' | 'goals' | 'both';
  targetGoals?: number;
  enableCardsSystem?: boolean;
}

// ─── Fixture Generation ───────────────────────────────────────────────────────

/**
 * Generates round-robin league fixtures for N teams.
 * Each team plays every other team exactly once.
 */
function generateLeagueFixtures(teams: TurfTeam[]): TurfFixture[] {
  const fixtures: TurfFixture[] = [];
  let round = 1;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        round,
        teamA: teams[i].id,
        teamB: teams[j].id,
        label: `Round ${round}: ${teams[i].name} vs ${teams[j].name}`
      });
      round++;
    }
  }

  return fixtures;
}

/**
 * Generates knockout tournament brackets for N teams.
 * Pairs teams sequentially; for odd numbers last team gets a bye.
 */
function generateKnockoutFixtures(teams: TurfTeam[]): TurfFixture[] {
  const fixtures: TurfFixture[] = [];
  let round = 1;
  let remaining = [...teams];

  while (remaining.length > 1) {
    const roundFixtures: TurfFixture[] = [];
    const next: TurfTeam[] = [];

    for (let i = 0; i < remaining.length - 1; i += 2) {
      roundFixtures.push({
        round,
        teamA: remaining[i].id,
        teamB: remaining[i + 1].id,
        label: `KO Round ${round}: ${remaining[i].name} vs ${remaining[i + 1].name}`
      });
    }

    // Bye if odd
    if (remaining.length % 2 !== 0) {
      next.push(remaining[remaining.length - 1]);
    }

    fixtures.push(...roundFixtures);
    // Simulate next round winners as first-half (simplified)
    for (let i = 0; i < roundFixtures.length; i++) {
      next.push(remaining[i * 2]); // placeholder: team A always advances
    }

    remaining = next;
    round++;
    if (remaining.length === 1) break;
  }

  return fixtures;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export interface TurfConfig {
  numTeams: number;           // 2, 3, 4, ...
  playersPerTeam: number;     // 4 to 10 (outfield + GK)
  gkMode: 'fixed' | 'rotating';
  fixedGkTeamA?: string;
  fixedGkTeamB?: string;
  gkRotationInterval: 'per_match' | 'per_goal' | 'per_time';
  gkRotationMinutes?: number; // Only used when gkRotationInterval === 'per_time'
  matchType: 'league' | 'knockout' | 'winner_stays' | 'friendly';
  matchDurationMins: number;
  endCondition?: 'time' | 'goals' | 'both';
  targetGoals?: number;
  enableCardsSystem?: boolean;
}

function partitionPlayersMulti(players: PlayerProfile[], numTeams: number): PlayerProfile[][] {
  const teams: PlayerProfile[][] = Array.from({ length: numTeams }, () => []);
  const categories: Record<PositionCategory, PlayerProfile[]> = { GK: [], DEF: [], MID: [], ATK: [] };
  
  players.forEach(p => {
    const cat = POSITION_CATEGORIES[p.primaryPosition || 'CMF'] || 'MID';
    categories[cat].push(p);
  });

  let globalPickIndex = 0;
  const catKeys: PositionCategory[] = ['GK', 'DEF', 'MID', 'ATK'];
  catKeys.forEach(cat => {
    const sortedCat = sortPlayersByOvrDesc(categories[cat]);
    for (let i = 0; i < sortedCat.length; i++) {
      const round = Math.floor(globalPickIndex / numTeams);
      let teamIdx = globalPickIndex % numTeams;
      if (round % 2 !== 0) teamIdx = numTeams - 1 - teamIdx;
      teams[teamIdx].push(sortedCat[i]);
      globalPickIndex++;
    }
  });

  return teams;
}

function iterativeSwapBalanceMulti(teams: PlayerProfile[][]): PlayerProfile[][] {
  const currentTeams = teams.map(t => [...t]);
  const getTeamAvg = (team: PlayerProfile[]) => {
    if (team.length === 0) return 0;
    const total = team.reduce((sum, p) => sum + getPlayerOverall(p), 0);
    return total / team.length;
  };
  const getVariance = (teamsArray: PlayerProfile[][]) => {
    const avgs = teamsArray.map(getTeamAvg);
    return Math.max(...avgs) - Math.min(...avgs);
  };

  let currentVar = getVariance(currentTeams);
  for (let iter = 0; iter < 50; iter++) {
    if (currentVar < 0.5) break;
    let bestSwap: { t1: number; p1: number; t2: number; p2: number } | null = null;
    let bestNewVar = currentVar;

    const avgs = currentTeams.map((t, i) => ({ idx: i, avg: getTeamAvg(t) }));
    avgs.sort((a, b) => b.avg - a.avg);
    const t1 = avgs[0].idx;
    const t2 = avgs[avgs.length - 1].idx;

    for (let p1 = 0; p1 < currentTeams[t1].length; p1++) {
      for (let p2 = 0; p2 < currentTeams[t2].length; p2++) {
        if (!arePositionCompatible(currentTeams[t1][p1], currentTeams[t2][p2])) continue;
        const temp1 = currentTeams[t1][p1];
        currentTeams[t1][p1] = currentTeams[t2][p2];
        currentTeams[t2][p2] = temp1;
        const trialVar = getVariance(currentTeams);
        if (trialVar < bestNewVar - 0.05) {
          bestSwap = { t1, p1, t2, p2 };
          bestNewVar = trialVar;
        }
        currentTeams[t2][p2] = currentTeams[t1][p1];
        currentTeams[t1][p1] = temp1;
      }
    }
    if (bestSwap) {
      const { t1, p1, t2, p2 } = bestSwap;
      const temp = currentTeams[t1][p1];
      currentTeams[t1][p1] = currentTeams[t2][p2];
      currentTeams[t2][p2] = temp;
      currentVar = getVariance(currentTeams);
    } else {
      break;
    }
  }
  return currentTeams;
}

/**
 * Main turf matchmaking function.
 * Distributes available players across N teams using Serpentine draft,
 * builds GK rotation schedule, and generates match fixtures.
 */
export function generateTurfMatch(
  availablePlayers: PlayerProfile[],
  config: TurfConfig
): TurfMatchmakingResult {
  const { numTeams, playersPerTeam, gkMode, gkRotationInterval, matchType, matchDurationMins, endCondition, targetGoals, fixedGkTeamA, fixedGkTeamB, enableCardsSystem } = config;

  const totalNeeded = numTeams * playersPerTeam;
  const sortedAvailablePlayers = [...availablePlayers].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  const activePlayers = sortedAvailablePlayers.slice(0, totalNeeded);
  const leftoverPlayers = sortedAvailablePlayers.slice(totalNeeded);

  const waitingTeams: TurfTeam[] = leftoverPlayers.length > 0 ? [{
    id: 'waiting_1',
    name: 'Bench',
    players: leftoverPlayers,
    assignedPlayers: [],
    gkOrder: [],
    totalOvr: 0,
    avgOvr: 0
  }] : [];

  // Run Positional Draft & Swap Balancing
  let draftedTeams = partitionPlayersMulti(activePlayers, numTeams);
  draftedTeams = iterativeSwapBalanceMulti(draftedTeams);

  // Build TurfTeam objects
  const teams: TurfTeam[] = draftedTeams.map((players, idx) => {
    const totalOvr = calculateTeamTotalOvr(players);
    const avgOvr = calculateTeamAverageOvr(players);
    const gkOrder = buildGkRotationOrderStrategy(players);
    const fixedGkUid = idx === 0 ? fixedGkTeamA : idx === 1 ? fixedGkTeamB : undefined;

    const formation = selectBestFormation(players);
    const assignedPlayers = assignPlayersToFormation(players, formation);

    return {
      id: `team_${idx + 1}`,
      name: `Team ${String.fromCharCode(65 + idx)}`, // Team A, B, C...
      players,
      totalOvr,
      avgOvr,
      gkOrder,
      fixedGkUid,
      formation,
      assignedPlayers
    };
  });

  // Build GK rotation schedule (across all matches)
  let fixtures: TurfFixture[] = [];
  if (matchType === 'league') {
    fixtures = generateLeagueFixtures(teams);
  } else if (matchType === 'knockout') {
    fixtures = generateKnockoutFixtures(teams);
  } else if (matchType === 'winner_stays') {
    // We don't generate fixed fixtures for winner_stays, it's dynamic
    fixtures = [];
  } else if (matchType === 'friendly') {
    // Casual continuous friendly without tournament brackets
    fixtures = teams.length >= 2 ? [{ round: 1, teamA: teams[0].id, teamB: teams[1].id, label: '⚽ Casual Friendly (Continuous Play)' }] : [];
  }
  
  const gkRotationSchedule: TurfMatchmakingResult['gkRotationSchedule'] = [];
  if (gkMode === 'rotating') {
    teams.forEach(team => {
      team.gkOrder.forEach((player, matchIndex) => {
        gkRotationSchedule.push({
          teamId: team.id,
          playerName: player.cardName || player.fullName,
          matchNumber: matchIndex + 1
        });
      });
    });
  }

  // Distribute leftover reserve players to each team's own dedicated bench
  leftoverPlayers.forEach((player, idx) => {
    const targetTeamIdx = idx % teams.length;
    if (!teams[targetTeamIdx].bench) {
      teams[targetTeamIdx].bench = [];
    }
    teams[targetTeamIdx].bench!.push(player);
  });

  return {
    teams,
    bench: leftoverPlayers,
    gkRotationSchedule,
    fixtures,
    matchType,
    numTeams,
    playersPerTeam,
    gkMode,
    gkRotationInterval,
    matchDurationMins,
    endCondition,
    targetGoals,
    enableCardsSystem
  };
}
