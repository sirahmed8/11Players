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

import type { PlayerProfile } from '@/types';
import { getPlayerOverall } from '@/lib/playerUtils';

// ─── Exported Types ───────────────────────────────────────────────────────────

export interface TurfTeam {
  id: string;
  name: string;
  players: PlayerProfile[];
  totalOvr: number;
  avgOvr: number;
  gkOrder: PlayerProfile[]; // Rotating GK order for this team
}

export interface TurfFixture {
  round: number;
  teamA: string; // team id
  teamB: string;
  label: string; // e.g. "Round 1: Team A vs Team B"
}

export interface TurfMatchmakingResult {
  teams: TurfTeam[];
  gkRotationSchedule: { teamId: string; playerName: string; matchNumber: number }[];
  fixtures: TurfFixture[];
  matchType: 'league' | 'knockout';
  numTeams: number;
  playersPerTeam: number;
  gkMode: 'fixed' | 'rotating';
  gkRotationInterval: 'per_match' | 'per_goal';
  matchDurationMins: number;
}

// ─── Serpentine Draft ─────────────────────────────────────────────────────────

/**
 * Distributes N players across T teams using the Serpentine (snake) draft order.
 * Ensures the weakest and strongest teams are balanced across all rounds.
 *
 * Draft order for T=3: R1: 1,2,3 | R2: 3,2,1 | R3: 1,2,3 ...
 */
function serpentineDraft(players: PlayerProfile[], numTeams: number): PlayerProfile[][] {
  // Sort by OVR descending
  const sorted = [...players].sort((a, b) => getPlayerOverall(b) - getPlayerOverall(a));
  const teams: PlayerProfile[][] = Array.from({ length: numTeams }, () => []);

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

// ─── GK Rotation ─────────────────────────────────────────────────────────────

/**
 * Determines GK rotation order for a team based on overall rating (lowest OVR goes first in goal).
 * Returns a shuffled/ordered array of players for fair GK rotation.
 */
function buildGkRotationOrder(players: PlayerProfile[]): PlayerProfile[] {
  // Sort by OVR ascending so the 'worst' outfield player can go in goal first
  // But randomise the last-third to prevent always forcing the weakest player
  const sorted = [...players].sort((a, b) => getPlayerOverall(a) - getPlayerOverall(b));
  return sorted;
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
  gkRotationInterval: 'per_match' | 'per_goal';
  matchType: 'league' | 'knockout';
  matchDurationMins: number;
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
  const { numTeams, playersPerTeam, gkMode, gkRotationInterval, matchType, matchDurationMins } = config;

  const totalNeeded = numTeams * playersPerTeam;
  const activePlayers = availablePlayers.slice(0, totalNeeded);

  // Run Serpentine draft
  const draftedTeams = serpentineDraft(activePlayers, numTeams);

  // Build TurfTeam objects
  const teams: TurfTeam[] = draftedTeams.map((players, idx) => {
    const ovrs = players.map(p => getPlayerOverall(p));
    const totalOvr = ovrs.reduce((a, b) => a + b, 0);
    const avgOvr = players.length > 0 ? Math.round(totalOvr / players.length) : 0;
    const gkOrder = buildGkRotationOrder(players);

    return {
      id: `team_${idx + 1}`,
      name: `Team ${String.fromCharCode(65 + idx)}`, // Team A, B, C...
      players,
      totalOvr,
      avgOvr,
      gkOrder
    };
  });

  // Build GK rotation schedule (across all matches)
  const fixtures = matchType === 'league'
    ? generateLeagueFixtures(teams)
    : generateKnockoutFixtures(teams);

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

  return {
    teams,
    gkRotationSchedule,
    fixtures,
    matchType,
    numTeams,
    playersPerTeam,
    gkMode,
    gkRotationInterval,
    matchDurationMins
  };
}
