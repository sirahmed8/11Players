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
import { calculateRealisticOverall } from '@/lib/overallCalculator';

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
    };
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum swap iterations for the team-balancing phase. */
const MAX_BALANCE_ITERATIONS = 1000;

/** Convergence threshold – stop early when total variance drops below this. */
const CONVERGENCE_THRESHOLD = 0.001;

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
  // 5v5
  '1-2-1': ['GK', 'CB', 'CMF', 'AMF', 'CF'],
  '2-1-1': ['GK', 'CB', 'CB', 'CMF', 'CF'],
  '1-1-2': ['GK', 'CB', 'CMF', 'LWF', 'RWF'],
  // 6v6
  '2-2-1': ['GK', 'CB', 'CB', 'CMF', 'AMF', 'CF'],
  '2-1-2': ['GK', 'CB', 'CB', 'CMF', 'CF', 'CF'],
  '1-3-1': ['GK', 'CB', 'LMF', 'CMF', 'RMF', 'CF'],
  // 7v7
  '2-3-1': ['GK', 'CB', 'CB', 'LMF', 'CMF', 'RMF', 'CF'],
  '3-2-1': ['GK', 'LB', 'CB', 'RB', 'CMF', 'AMF', 'CF'],
  '2-2-2': ['GK', 'CB', 'CB', 'CMF', 'AMF', 'CF', 'CF'],
  // 8v8
  '3-3-1': ['GK', 'LB', 'CB', 'RB', 'LMF', 'CMF', 'RMF', 'CF'],
  '2-3-2': ['GK', 'CB', 'CB', 'LMF', 'CMF', 'RMF', 'CF', 'CF'],
  '3-2-2': ['GK', 'LB', 'CB', 'RB', 'CMF', 'AMF', 'CF', 'CF'],
  // 9v9
  '3-4-1': ['GK', 'LB', 'CB', 'RB', 'LMF', 'CMF', 'CMF', 'RMF', 'CF'],
  '3-3-2': ['GK', 'LB', 'CB', 'RB', 'LMF', 'CMF', 'RMF', 'CF', 'CF'],
  '4-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'AMF', 'CF'],
  // 10v10
  '4-4-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'LMF', 'CMF', 'CMF', 'RMF', 'CF'],
  '4-3-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'AMF', 'CF', 'CF'],
  '3-4-2': ['GK', 'CB', 'CB', 'CB', 'LMF', 'CMF', 'DMF', 'RMF', 'CF', 'CF'],
  // 11v11
  '4-3-3':   ['GK', 'LB', 'CB', 'CB', 'RB', 'CMF', 'CMF', 'AMF', 'LWF', 'CF', 'RWF'],
  '4-4-2':   ['GK', 'LB', 'CB', 'CB', 'RB', 'LMF', 'CMF', 'CMF', 'RMF', 'CF', 'CF'],
  '3-5-2':   ['GK', 'CB', 'CB', 'CB', 'LMF', 'CMF', 'DMF', 'CMF', 'RMF', 'CF', 'CF'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'DMF', 'LMF', 'AMF', 'RMF', 'CF'],
  '5-3-2':   ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'CMF', 'DMF', 'CMF', 'CF', 'CF'],
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

  // ── Step 2: Familiarity multiplier ──
  let familiarityMultiplier: number;
  if (position === player.primaryPosition) {
    familiarityMultiplier = POSITION_FAMILIARITY.primary;
  } else if (position === player.secondaryPosition) {
    familiarityMultiplier = POSITION_FAMILIARITY.secondary;
  } else if (position === player.tertiaryPosition) {
    familiarityMultiplier = POSITION_FAMILIARITY.tertiary;
  } else {
    familiarityMultiplier = POSITION_FAMILIARITY.outOfPosition;
  }

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
    const playerOverall = calculateRealisticOverall(a, p.primaryPosition || 'CMF', p.playStyle || '');
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
 *
 * Score = sum of each player's best possible PSI for each slot,
 * assigned greedily (highest-PSI candidate first, no duplicates).
 */
function scoreFormation(players: PlayerProfile[], formation: PESPosition[]): number {
  const available = new Set(players.map((_, i) => i));
  let totalPSI = 0;

  for (const slot of formation) {
    let bestIdx = -1;
    let bestPSI = -Infinity;

    for (const idx of available) {
      const psi = calculatePSI(players[idx], slot);
      if (psi > bestPSI) {
        bestPSI = psi;
        bestIdx = idx;
      }
    }

    if (bestIdx >= 0) {
      totalPSI += bestPSI;
      available.delete(bestIdx);
    }
  }

  return totalPSI;
}

/**
 * Select the best formation for a set of players from the supported catalogue.
 *
 * @param players - Exactly 11 players (or fewer; algorithm adapts).
 * @returns The formation name (e.g. `'4-3-3'`).
 */
function selectBestFormation(players: PlayerProfile[]): string {
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

/**
 * Assign players to formation slots using greedy assignment with
 * backtracking conflict resolution.
 *
 * Algorithm:
 *  1. For each slot, rank all unassigned candidates by PSI.
 *  2. Assign the best candidate; mark them as used.
 *  3. If a candidate is displaced from their primary position:
 *     a. Try their secondary position (if still open or if they beat the
 *        current holder via PSI comparison).
 *     b. Fall back to their tertiary position.
 *  4. Any remaining unassigned players are placed in the lowest-impact
 *     remaining slot with their out-of-position penalty.
 *
 * @param players   - Array of player profiles (length should equal slots).
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

  // Build PSI matrix: psiMatrix[slotIndex][playerIndex] = PSI
  const psiMatrix: number[][] = [];
  for (let s = 0; s < numSlots; s++) {
    psiMatrix[s] = [];
    for (let p = 0; p < players.length; p++) {
      psiMatrix[s][p] = calculatePSI(players[p], slots[s]);
    }
  }

  // Greedy assignment: slot-by-slot, pick the best unassigned player.
  // We process GK first (slot 0) since it's the most specialised.
  const assignment: number[] = new Array(numSlots).fill(-1); // slot → playerIndex
  const assignedPlayers = new Set<number>();

  // Prioritise slots by how specialised they are (fewer good candidates).
  // We measure "specialisation" as the standard deviation of PSI across candidates.
  const slotOrder = Array.from({ length: numSlots }, (_, i) => i);
  slotOrder.sort((a, b) => {
    // GK always first
    if (slots[a] === 'GK' && slots[b] !== 'GK') return -1;
    if (slots[b] === 'GK' && slots[a] !== 'GK') return 1;

    // Then by PSI spread (ascending – most specialised first)
    const spreadA = Math.max(...psiMatrix[a]) - Math.min(...psiMatrix[a]);
    const spreadB = Math.max(...psiMatrix[b]) - Math.min(...psiMatrix[b]);
    return spreadA - spreadB;
  });

  for (const slotIdx of slotOrder) {
    const candidates: Candidate[] = [];
    for (let p = 0; p < players.length; p++) {
      if (assignedPlayers.has(p)) continue;
      candidates.push({ playerIndex: p, psi: psiMatrix[slotIdx][p] });
    }

    if (candidates.length === 0) continue;

    // Sort descending by PSI
    candidates.sort((a, b) => b.psi - a.psi);
    const best = candidates[0];

    assignment[slotIdx] = best.playerIndex;
    assignedPlayers.add(best.playerIndex);
  }

  // ── Backtracking phase ──
  // Check if any assigned player would be significantly better in another slot
  // and the swap improves total PSI.
  let improved = true;
  let backtrackIterations = 0;
  const MAX_BACKTRACK = 200;

  while (improved && backtrackIterations < MAX_BACKTRACK) {
    improved = false;
    backtrackIterations++;

    for (let s1 = 0; s1 < numSlots; s1++) {
      for (let s2 = s1 + 1; s2 < numSlots; s2++) {
        const p1 = assignment[s1];
        const p2 = assignment[s2];
        if (p1 < 0 || p2 < 0) continue;

        const currentTotal = psiMatrix[s1][p1] + psiMatrix[s2][p2];
        const swappedTotal = psiMatrix[s1][p2] + psiMatrix[s2][p1];

        if (swappedTotal > currentTotal + 0.01) {
          // Swap improves total PSI
          assignment[s1] = p2;
          assignment[s2] = p1;
          improved = true;
        }
      }
    }
  }

  // ── Build result ──
  const result: AssignedPlayer[] = [];
  for (let s = 0; s < numSlots; s++) {
    const pIdx = assignment[s];
    if (pIdx < 0) continue;

    result.push({
      ...players[pIdx],
      assignedPosition: slots[s],
      psi: psiMatrix[s][pIdx],
    });
  }

  // Handle any unassigned players (if players.length > slots.length)
  for (let p = 0; p < players.length; p++) {
    if (!assignedPlayers.has(p)) {
      // Assign to their primary position with out-of-position treatment
      result.push({
        ...players[p],
        assignedPosition: players[p].primaryPosition,
        psi: calculatePSI(players[p], players[p].primaryPosition),
      });
    }
  }

  return result;
}

// ─── Team Balancing ──────────────────────────────────────────────────────────

/**
 * Calculate total variance between two teams across all metric categories.
 */
function calculateTotalVariance(
  metricsA: TeamMetrics,
  metricsB: TeamMetrics,
): { overall: number; speed: number; stamina: number; defense: number; total: number } {
  const diffOverall = Math.abs(metricsA.overall - metricsB.overall);
  const diffSpeed = Math.abs(metricsA.speed - metricsB.speed);
  const diffStamina = Math.abs(metricsA.stamina - metricsB.stamina);
  const diffDefense = Math.abs(metricsA.defense - metricsB.defense);

  return {
    overall: diffOverall,
    speed: diffSpeed,
    stamina: diffStamina,
    defense: diffDefense,
    total: diffOverall + diffSpeed + diffStamina + diffDefense,
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

  // Serpentine draft inside each position category
  const catKeys: PositionCategory[] = ['GK', 'DEF', 'MID', 'ATK'];
  catKeys.forEach(cat => {
    const sortedCat = [...categories[cat]].sort((a, b) => {
      const attrsA = a.approvedAttributes || a.attributes || {};
      const attrsB = b.approvedAttributes || b.attributes || {};
      const overallA = calculateRealisticOverall(attrsA, a.primaryPosition || 'CMF', a.playStyle || '');
      const overallB = calculateRealisticOverall(attrsB, b.primaryPosition || 'CMF', b.playStyle || '');
      return overallB - overallA;
    });

    for (let i = 0; i < sortedCat.length; i++) {
      const round = Math.floor(i / 2);
      // If teamA currently has fewer players overall or equal, use round-robin
      if (i % 2 === 0) {
        (round % 2 === 0 ? teamA : teamB).push(sortedCat[i]);
      } else {
        (round % 2 === 0 ? teamB : teamA).push(sortedCat[i]);
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
        );

        if (trialVariance.total < bestNewVariance - 0.0005) {
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
 * GKs only swap with GKs. Others swap strictly within category or adjacent category.
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
export function balanceTeams(players: PlayerProfile[]): MatchmakingResult {
  if (!Array.isArray(players) || players.length < 2) {
    throw new Error(
      `balanceTeams: expected an array of at least 2 players, got ${players?.length ?? 0}`,
    );
  }

  // ── 0. Determine Bench ──
  // Sort players by their Primary Position PSI descending
  const sortedPlayers = [...players].sort(
    (a, b) =>
      calculatePSI(b, b.primaryPosition) - calculatePSI(a, a.primaryPosition)
  );

  // ── 1. Partition ──
  let [rawA, rawB] = partitionPlayers(sortedPlayers);

  // ── 2. Swap-balance ──
  [rawA, rawB] = iterativeSwapBalance(rawA, rawB);

  // ── 3. Sort players by overall/PSI to separate starters (top 11) from bench ──
  const sortPool = (pool: PlayerProfile[]) => [...pool].sort((a, b) => calculatePSI(b, b.primaryPosition) - calculatePSI(a, a.primaryPosition));
  const sortedRawA = sortPool(rawA);
  const sortedRawB = sortPool(rawB);

  const startersA = sortedRawA.slice(0, 11);
  const benchPoolA = sortedRawA.slice(11);
  const startersB = sortedRawB.slice(0, 11);
  const benchPoolB = sortedRawB.slice(11);

  // ── 4. Select formations for starters and assign positions ──
  const formationA = selectBestFormation(startersA);
  const formationB = selectBestFormation(startersB);

  const teamA = assignPlayersToFormation(startersA, formationA);
  const teamB = assignPlayersToFormation(startersB, formationB);

  const benchA = benchPoolA.map(p => ({ player: p, reason: "Substitute (Bench)" }));
  const benchB = benchPoolB.map(p => ({ player: p, reason: "Substitute (Bench)" }));

  // ── 5. Generate AI Manager Advices ──
  const metricsA = calculateTeamMetrics(teamA);
  const metricsB = calculateTeamMetrics(teamB);
  
  const generateAdvice = (myMetrics: TeamMetrics, oppMetrics: TeamMetrics, formation: string, oppFormation: string) => {
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

  const generateAdviceAr = (myMetrics: TeamMetrics, oppMetrics: TeamMetrics, formation: string, oppFormation: string) => {
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

  const adviceA = generateAdvice(metricsA, metricsB, formationA, formationB);
  const adviceB = generateAdvice(metricsB, metricsA, formationB, formationA);
  const adviceA_Ar = generateAdviceAr(metricsA, metricsB, formationA, formationB);
  const adviceB_Ar = generateAdviceAr(metricsB, metricsA, formationB, formationA);

  return {
    teamA,
    teamB,
    benchA: benchA.length > 0 ? benchA : undefined,
    benchB: benchB.length > 0 ? benchB : undefined,
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
      variance: calculateTotalVariance(metricsA, metricsB),
    },
  };
}
