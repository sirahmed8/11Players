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
import {
  serpentineDraftStrategy,
  buildGkRotationOrderStrategy,
  calculateTeamTotalOvr,
  calculateTeamAverageOvr,
} from '@/lib/matchmakingStrategy';

// ─── Exported Types ───────────────────────────────────────────────────────────

export interface TurfTeam {
  id: string;
  name: string;
  players: PlayerProfile[];
  totalOvr: number;
  avgOvr: number;
  gkOrder: PlayerProfile[]; // Rotating GK order for this team
  fixedGkUid?: string;      // UID if a fixed GK was picked for this team
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
  const activePlayers = availablePlayers.slice(0, totalNeeded);

  // Run Serpentine draft
  const draftedTeams = serpentineDraftStrategy(activePlayers, numTeams);

  // Build TurfTeam objects
  const teams: TurfTeam[] = draftedTeams.map((players, idx) => {
    const totalOvr = calculateTeamTotalOvr(players);
    const avgOvr = calculateTeamAverageOvr(players);
    const gkOrder = buildGkRotationOrderStrategy(players);
    const fixedGkUid = idx === 0 ? fixedGkTeamA : idx === 1 ? fixedGkTeamB : undefined;

    return {
      id: `team_${idx + 1}`,
      name: `Team ${String.fromCharCode(65 + idx)}`, // Team A, B, C...
      players,
      totalOvr,
      avgOvr,
      gkOrder,
      fixedGkUid
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

  return {
    teams,
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
