/**
 * @module matchmakingStrategy
 * @description Unified strategy module for 11Players matchmaking algorithms.
 * Consolidates player sorting, OVR tier calculation, serpentine drafting, and variance checks
 * shared across 11v11 (matchmaker.ts) and small-sided casual turf draft (turfMatchmaker.ts).
 */

import type { PlayerProfile } from '@/types';
import { getPlayerOverall } from '@/lib/playerUtils';

/**
 * Returns a new array of players sorted by their Overall Rating (OVR) in descending order (highest first).
 */
export function sortPlayersByOvrDesc<T extends PlayerProfile>(players: T[]): T[] {
  return [...players].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
}

/**
 * Returns a new array of players sorted by their Overall Rating (OVR) in ascending order (lowest first).
 */
export function sortPlayersByOvrAsc<T extends PlayerProfile>(players: T[]): T[] {
  return [...players].sort((a, b) => getPlayerOverall(a) - getPlayerOverall(b));
}

/**
 * Computes the sum of all player OVRs in a team.
 */
export function calculateTeamTotalOvr(players: PlayerProfile[]): number {
  if (!players || players.length === 0) return 0;
  return players.reduce((sum, p) => sum + getPlayerOverall(p), 0);
}

/**
 * Computes the average OVR of a team rounded to one decimal place.
 */
export function calculateTeamAverageOvr(players: PlayerProfile[]): number {
  if (!players || players.length === 0) return 0;
  const avg = calculateTeamTotalOvr(players) / players.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Computes the absolute difference (variance) between two teams' average OVRs.
 */
export function evaluateVariance(teamA: PlayerProfile[], teamB: PlayerProfile[]): number {
  const avgA = calculateTeamAverageOvr(teamA);
  const avgB = calculateTeamAverageOvr(teamB);
  return Math.abs(avgA - avgB);
}

/**
 * Distributes N players across T teams using a Serpentine (snake) draft order.
 * Ensures the weakest and strongest teams are balanced across all rounds.
 */
export function serpentineDraftStrategy<T extends PlayerProfile>(players: T[], numTeams: number): T[][] {
  const sorted = sortPlayersByOvrDesc(players);
  const teams: T[][] = Array.from({ length: numTeams }, () => []);

  let forward = true;
  let teamIndex = 0;

  for (const player of sorted) {
    teams[teamIndex].push(player);
    if (forward) {
      teamIndex++;
      if (teamIndex >= numTeams) {
        teamIndex = numTeams - 1;
        forward = false;
      }
    } else {
      teamIndex--;
      if (teamIndex < 0) {
        teamIndex = 0;
        forward = true;
      }
    }
  }

  return teams;
}

/**
 * Determines GK rotation order for a team based on overall rating (lowest OVR goes first in goal).
 * Returns an ordered array of players for fair GK rotation.
 */
export function buildGkRotationOrderStrategy<T extends PlayerProfile>(players: T[]): T[] {
  return sortPlayersByOvrAsc(players);
}
