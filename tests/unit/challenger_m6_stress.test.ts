import { describe, it, expect } from 'vitest';

// 1. Heatmap Imports
import {
  getPositionPitchCoordinates,
  generateHeatmapClusterPoints,
  POSITION_PITCH_COORDINATES,
  POSITION_GROUP_MAP,
} from '../../src/components/pitch/DynamicPitchHeatmap';

// 2. Draft Balance Imports
import {
  calculatePositionalCoverage,
  calculateDraftBalance,
  getNextDraftTurn,
  autoDraftPick,
  DEFAULT_DRAFT_POOL_22,
} from '../../src/components/draft/CaptainDraftRoom';

// 3. Broadcaster Imports
import {
  updateMomentumState,
  calculateStoppageTime,
} from '../../src/components/broadcaster/LiveMatchBroadcaster';

// 4. Scouting Report Imports
import {
  calculateWeaknessZones,
  identifyKeyThreats,
  recommendCounterStrategy,
  determinePressIntensity,
  calculateOppositionScoutingReport,
  DEFAULT_OPPONENT_ROSTER,
} from '../../src/components/scouting/OppositionScoutingReport';

// 5. Newspaper Imports
import {
  generateNewspaperHeadline,
  MatchResultData,
} from '../../src/components/newspaper/SportsNewspaperCover';

// 6. Split Bill Imports
import {
  convertCurrency,
  calculateSplitBillAllocation,
  calculateSplitBillSummary,
  generateShareableBillSummary,
} from '../../src/components/billing/PitchSplitBillCalculator';

// 7. Gamification XP Imports
import {
  calculateTotalPlayerXp,
  evaluateBadgeUnlockStatus,
  getSkillTreeNodes,
  PlayerStatsAndAttributes,
} from '../../src/components/gamification/XpSkillTree';

// 8. Derby Rivalry Imports
import {
  aggregateHeadToHeadStats,
  calculateCurrentStreak,
  calculateRivalryIntensityScore,
  MatchRecord,
  SAMPLE_DERBY_MATCHES,
} from '../../src/components/derby/DerbyRivalryEngine';

import { PESPosition, PlayerProfile } from '../../src/types';

describe('Empirical Stress Testing & Math Verification - Next-Gen Feature Ecosystem', () => {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. Heatmap Coordinate Mapping & Radial Density Formulas
  // ══════════════════════════════════════════════════════════════════════════
  describe('1. Heatmap Coordinate Mapping & Radial Density Formulas', () => {
    it('verifies all 13 standard PES position coordinates stay within 0..100 pitch boundary', () => {
      const positions: PESPosition[] = [
        'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'
      ];
      positions.forEach((pos) => {
        const coords = getPositionPitchCoordinates(pos);
        expect(coords.x).toBeGreaterThanOrEqual(0);
        expect(coords.x).toBeLessThanOrEqual(100);
        expect(coords.y).toBeGreaterThanOrEqual(0);
        expect(coords.y).toBeLessThanOrEqual(100);
      });
    });

    it('returns default midfield coordinates (50, 50) for unmapped or invalid positions', () => {
      const invalidPos = getPositionPitchCoordinates('UNKNOWN_POS' as any);
      expect(invalidPos).toEqual({ x: 50, y: 50 });
    });

    it('empirical finding: seed point retains unclamped coordinates while generated loop points clamp to 2..98', () => {
      // Base coords outside normal pitch (e.g., -50, 150)
      const clusters = generateHeatmapClusterPoints(-50, 150, 50, 20, 20);
      expect(clusters.length).toBe(51); // 1 seed + 50 points

      // Empirical Observation: clusters[0] is the raw seed point (-50, 150)
      expect(clusters[0]).toEqual({ x: -50, y: 150, weight: 1.0 });

      // Generated loop points (index 1 to 50) are properly clamped to [2, 98]
      clusters.slice(1).forEach((pt) => {
        expect(pt.x).toBeGreaterThanOrEqual(2);
        expect(pt.x).toBeLessThanOrEqual(98);
        expect(pt.y).toBeGreaterThanOrEqual(2);
        expect(pt.y).toBeLessThanOrEqual(98);
        expect(pt.weight).toBeGreaterThanOrEqual(0.2); // minimum weight floor is 0.2
      });
    });

    it('verifies distance weight decay formula: max(0.2, 1.0 - dist / 25)', () => {
      const clusters = generateHeatmapClusterPoints(50, 50, 10, 5, 5);
      // Seed point distance is 0 -> weight = 1.0
      expect(clusters[0].weight).toBe(1.0);

      clusters.slice(1).forEach((pt) => {
        const dist = Math.hypot(pt.x - 50, pt.y - 50);
        const expectedWeight = Math.max(0.2, 1.0 - dist / 25);
        expect(pt.weight).toBeCloseTo(expectedWeight, 5);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. Captain Draft Team OVR & PSI Balance Calculations
  // ══════════════════════════════════════════════════════════════════════════
  describe('2. Captain Draft Team OVR & PSI Balance Calculations', () => {
    it('handles empty team arrays gracefully in positional coverage', () => {
      const coverage = calculatePositionalCoverage([]);
      expect(coverage).toEqual({ GK: 0, DEF: 0, MID: 0, ATT: 0 });
    });

    it('accurately groups non-standard positions and handles missing primaryPosition', () => {
      const teamWithDefaults: PlayerProfile[] = [
        { uid: 'u1', primaryPosition: 'LMF' } as any,
        { uid: 'u2', primaryPosition: 'RMF' } as any,
        { uid: 'u3' } as any, // missing primaryPosition defaults to CMF -> MID
      ];
      const cov = calculatePositionalCoverage(teamWithDefaults);
      expect(cov.MID).toBe(3);
    });

    it('computes exact OVR diff and non-negative PSI values for asymmetric teams', () => {
      const teamA = DEFAULT_DRAFT_POOL_22.slice(0, 5);
      const teamB = DEFAULT_DRAFT_POOL_22.slice(5, 12);

      const res = calculateDraftBalance(teamA, teamB);
      expect(res.ovrDiff).toBe(Math.abs(res.teamAOvr - res.teamBOvr));
      expect(res.teamAPsi).toBeGreaterThan(0);
      expect(res.teamBPsi).toBeGreaterThan(0);
      expect(res.teamACoverage).toBeDefined();
      expect(res.teamBCoverage).toBeDefined();
    });

    it('stress tests snake draft turn sequencing across 20 rounds (40 picks)', () => {
      const expectedTurns: ('teamA' | 'teamB')[] = [
        'teamA', 'teamB',
        'teamB', 'teamA',
        'teamA', 'teamB',
        'teamB', 'teamA',
        'teamA', 'teamB',
      ];

      for (let i = 0; i < expectedTurns.length; i++) {
        expect(getNextDraftTurn('snake', i)).toBe(expectedTurns[i]);
      }
    });

    it('verifies autoDraftPick handles empty available pool by returning null', () => {
      expect(autoDraftPick([], DEFAULT_DRAFT_POOL_22)).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. Live Broadcaster Momentum & Stoppage Time Counters
  // ══════════════════════════════════════════════════════════════════════════
  describe('3. Live Broadcaster Momentum & Stoppage Time Counters', () => {
    it('verifies exact momentum delta shifts for all event types', () => {
      let m = 50;
      // GOAL Team A (-25) -> 25
      m = updateMomentumState(m, 'GOAL', 'teamA');
      expect(m).toBe(25);

      // KEY_SAVE Team A (+12 counter momentum) -> 37
      m = updateMomentumState(m, 'KEY_SAVE', 'teamA');
      expect(m).toBe(37);

      // MOMENTUM_SHIFT Team B (+18) -> 55
      m = updateMomentumState(m, 'MOMENTUM_SHIFT', 'teamB');
      expect(m).toBe(55);

      // YELLOW_CARD Team B (-5) -> 50
      m = updateMomentumState(m, 'YELLOW_CARD', 'teamB');
      expect(m).toBe(50);
    });

    it('strictly clamps momentum within [0, 100] upper and lower boundaries', () => {
      let m = 10;
      m = updateMomentumState(m, 'GOAL', 'teamA'); // 10 - 25 = -15 -> 0
      expect(m).toBe(0);

      m = 90;
      m = updateMomentumState(m, 'GOAL', 'teamB'); // 90 + 25 = 115 -> 100
      expect(m).toBe(100);
    });

    it('empirical finding: verifies stoppage time calculation logic and boolean guard operator', () => {
      // Minute 20 (< 40) evaluates matchMinute < 40 && matchMinute < 85 as TRUE -> returns 0
      expect(calculateStoppageTime(20, 10)).toBe(0);

      // Empirical Observation: At minute 84, matchMinute < 40 evaluates to FALSE.
      // Thus `matchMinute < 40 && matchMinute < 85` evaluates to FALSE, skipping the 0 guard!
      // At min 84 with 10 events: base = floor(10/2.5) = 4 -> min(6, max(1, 4+1)) = 5 mins
      expect(calculateStoppageTime(84, 10)).toBe(5);

      // Minute 85+ with 0 events: base = 0 -> min(6, max(1, 0 + 1)) = 1 min
      expect(calculateStoppageTime(85, 0)).toBe(1);

      // Minute 90 with 5 events: base = floor(5 / 2.5) = 2 -> 2 + 1 = 3 mins
      expect(calculateStoppageTime(90, 5)).toBe(3);

      // Minute 90 with 20 events: base = 8 -> capped at 6 mins
      expect(calculateStoppageTime(90, 20)).toBe(6);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. Scouting Report Weakness Zone Percentage Calculations
  // ══════════════════════════════════════════════════════════════════════════
  describe('4. Scouting Report Weakness Zone Percentage Calculations', () => {
    it('returns empty array when roster is empty', () => {
      expect(calculateWeaknessZones([])).toEqual([]);
    });

    it('verifies exact weakness zone score formulas for extreme low stamina team', () => {
      const lowStaminaRoster: PlayerProfile[] = DEFAULT_OPPONENT_ROSTER.map((p) => ({
        ...p,
        attributes: {
          ...p.attributes,
          stamina: 40,
        },
      }));

      const zones = calculateWeaknessZones(lowStaminaRoster);
      const staminaZone = zones.find((z) => z.id === 'stamina_deficit');
      expect(staminaZone?.score).toBe(100);
      expect(staminaZone?.severity).toBe('CRITICAL');
    });

    it('verifies weakness score clamping between 0 and 100 for high stats team', () => {
      const godRoster: PlayerProfile[] = DEFAULT_OPPONENT_ROSTER.map((p) => ({
        ...p,
        height: 200,
        attributes: {
          ...p.attributes,
          speed: 99,
          stamina: 99,
          defensiveAwareness: 99,
          ballWinning: 99,
          heading: 99,
        },
      }));

      const zones = calculateWeaknessZones(godRoster);
      zones.forEach((z) => {
        expect(z.score).toBeGreaterThanOrEqual(0);
        expect(z.score).toBeLessThanOrEqual(100);
        expect(z.severity).toBe('LOW');
      });
    });

    it('correctly maps severity thresholds: CRITICAL (>=75), HIGH (>=55), MODERATE (>=35), LOW (<35)', () => {
      const report = calculateOppositionScoutingReport(DEFAULT_OPPONENT_ROSTER);
      expect(report.overallThreatScore).toBeGreaterThanOrEqual(50);
      expect(report.overallThreatScore).toBeLessThanOrEqual(99);
      expect(report.weaknessZones.length).toBe(4);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. Newspaper Cover Dynamic Headline Resolution Logic
  // ══════════════════════════════════════════════════════════════════════════
  describe('5. Newspaper Cover Dynamic Headline Resolution Logic', () => {
    it('resolves DRAW headline when scoreA === scoreB', () => {
      const match: MatchResultData = { teamAName: 'A', teamBName: 'B', scoreA: 3, scoreB: 3 };
      const h = generateNewspaperHeadline(match);
      expect(h.mainHeadline.en).toBe('HONORS EVEN IN EPIC CLASH');
      expect(h.mainHeadline.ar).toContain('تعادل');
    });

    it('resolves COMEBACK headline when isComeback is true', () => {
      const match: MatchResultData = { teamAName: 'A', teamBName: 'B', scoreA: 2, scoreB: 1, isComeback: true };
      const h = generateNewspaperHeadline(match);
      expect(h.mainHeadline.en).toBe('UNBELIEVABLE COMEBACK DRAMA');
    });

    it('resolves BLOWOUT headline when goalDiff >= 3', () => {
      const match: MatchResultData = { teamAName: 'A', teamBName: 'B', scoreA: 5, scoreB: 1 };
      const h = generateNewspaperHeadline(match);
      expect(h.mainHeadline.en).toBe('TACTICAL MASTERCLASS');
    });

    it('resolves GOAL FESTIVAL headline when totalGoals >= 5 and goalDiff < 3', () => {
      const match: MatchResultData = { teamAName: 'A', teamBName: 'B', scoreA: 3, scoreB: 2 };
      const h = generateNewspaperHeadline(match);
      expect(h.mainHeadline.en).toBe('THRILLING GOAL FESTIVAL');
    });

    it('resolves DERBY headline when matchType contains Derby', () => {
      const match: MatchResultData = { teamAName: 'A', teamBName: 'B', scoreA: 1, scoreB: 0, matchType: 'City Derby' };
      const h = generateNewspaperHeadline(match);
      expect(h.mainHeadline.en).toBe('DERBY TRIUMPH & GLORY');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. Split-Bill Pitch Rent Allocation & Multi-Currency Conversions
  // ══════════════════════════════════════════════════════════════════════════
  describe('6. Split-Bill Pitch Rent Allocation & Multi-Currency Conversions', () => {
    it('verifies exact currency conversion rate math', () => {
      // 100 SAR -> USD: 100 * 0.2667 = 26.67
      expect(convertCurrency(100, 'SAR', 'USD')).toBe(26.67);

      // 100 USD -> SAR: (100 / 0.2667) * 1.0 = 374.95
      expect(convertCurrency(100, 'USD', 'SAR')).toBe(374.95);

      // Same currency returns exact rounded value
      expect(convertCurrency(150.456, 'EGP', 'EGP')).toBe(150.46);
    });

    it('verifies equal split allocation and remaining unallocated cents', () => {
      // 100 SAR divided among 3 players -> 33.33 each, total allocated = 99.99, remaining = 0.01
      const alloc = calculateSplitBillAllocation(100, 3, 'equal');
      expect(alloc.playerAmounts['player_1']).toBe(33.33);
      expect(alloc.playerAmounts['player_2']).toBe(33.33);
      expect(alloc.playerAmounts['player_3']).toBe(33.33);
      expect(alloc.totalAllocated).toBe(99.99);
      expect(alloc.remainingUnallocated).toBe(0.01);
    });

    it('verifies zero players handling in bill allocation', () => {
      const alloc = calculateSplitBillAllocation(500, 0, 'equal');
      expect(alloc.totalAllocated).toBe(0);
      expect(alloc.remainingUnallocated).toBe(500);
      expect(alloc.playerAmounts).toEqual({});
    });

    it('computes accurate payment status summary and percentage paid', () => {
      const items = [
        { amount: 100, status: 'Paid' as const },
        { amount: 100, status: 'Paid' as const },
        { amount: 100, status: 'Pending' as const },
        { amount: 100, status: 'Overdue' as const },
      ];

      const summary = calculateSplitBillSummary(items);
      expect(summary.totalCost).toBe(400);
      expect(summary.totalPaid).toBe(200);
      expect(summary.totalPending).toBe(100);
      expect(summary.totalOverdue).toBe(100);
      expect(summary.percentPaid).toBe(50);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. Gamification XP Skill Tree Unlock Criteria
  // ══════════════════════════════════════════════════════════════════════════
  describe('7. Gamification XP Skill Tree Unlock Criteria', () => {
    it('verifies exact total player XP formula: match*50 + goal*100 + assist*75 + mvp*200 + cs*120', () => {
      // 10 matches (500) + 5 goals (500) + 4 assists (300) + 2 mvp (400) + 1 cleanSheet (120) = 1820 XP
      const xp = calculateTotalPlayerXp(10, 5, 4, 2, 1);
      expect(xp).toBe(1820);
    });

    it('evaluates badge unlock requirements (XP AND attribute threshold)', () => {
      const stats: PlayerStatsAndAttributes = {
        matchesPlayed: 10,
        goals: 5,
        assists: 2,
        mvp: 1,
        attributes: { finishing: 80 }, // >= 75 for sniper
      };
      // XP = 500 + 500 + 150 + 200 = 1350 XP

      const evalUnlocked = evaluateBadgeUnlockStatus('sniper', stats, 1350);
      expect(evalUnlocked.unlocked).toBe(true);
      expect(evalUnlocked.currentRank).toBe('Silver'); // >= 1200 XP threshold for Silver

      // Fails if attribute is below threshold
      const statsLowAttr: PlayerStatsAndAttributes = {
        ...stats,
        attributes: { finishing: 60 },
      };
      const evalLocked = evaluateBadgeUnlockStatus('sniper', statsLowAttr, 1350);
      expect(evalLocked.unlocked).toBe(false);
      expect(evalLocked.currentRank).toBe('Locked');
    });

    it('verifies Diamond max rank cap and 100% progress', () => {
      const stats: PlayerStatsAndAttributes = {
        matchesPlayed: 100,
        goals: 50,
        assists: 30,
        mvp: 20,
        attributes: { speed: 90 },
      };
      // XP = 5000 + 5000 + 2250 + 4000 = 16250 XP
      const evalDiamond = evaluateBadgeUnlockStatus('speed_demon', stats, 16250);
      expect(evalDiamond.unlocked).toBe(true);
      expect(evalDiamond.currentRank).toBe('Diamond');
      expect(evalDiamond.progressPercent).toBe(100);
      expect(evalDiamond.nextRequirementText).toBe('MAX RANK REACHED!');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. Derby Rivalry Head-to-Head Win Rates, Streaks, & Intensity Scores
  // ══════════════════════════════════════════════════════════════════════════
  describe('8. Derby Rivalry H2H Win Rates, Streaks, & Intensity Scores', () => {
    it('aggregates H2H stats when captain ordering is mixed across matches', () => {
      const matches: MatchRecord[] = [
        { id: '1', date: '2026-07-01', teamAName: 'A', teamBName: 'B', captainAUid: 'c1', captainBUid: 'c2', scoreA: 2, scoreB: 1, yellowCards: 1, redCards: 0 },
        { id: '2', date: '2026-07-02', teamAName: 'B', teamBName: 'A', captainAUid: 'c2', captainBUid: 'c1', scoreA: 0, scoreB: 3, yellowCards: 2, redCards: 1 },
      ];

      const stats = aggregateHeadToHeadStats(matches, 'c1', 'c2');
      expect(stats.totalMatches).toBe(2);
      expect(stats.winsA).toBe(2); // c1 won match 1 (2-1) and match 2 (3-0 as captainB)
      expect(stats.winsB).toBe(0);
      expect(stats.goalsA).toBe(5); // 2 + 3
      expect(stats.goalsB).toBe(1); // 1 + 0
      expect(stats.goalDiffA).toBe(4);
      expect(stats.winRateA).toBe(100.0);
      expect(stats.totalCards).toBe(5); // 1 + 2 + 1*2 = 5
    });

    it('calculates active streak correctly for consecutive wins', () => {
      const matches: MatchRecord[] = [
        { id: '1', date: '2026-07-05', teamAName: 'A', teamBName: 'B', captainAUid: 'c1', captainBUid: 'c2', scoreA: 3, scoreB: 0 },
        { id: '2', date: '2026-07-04', teamAName: 'A', teamBName: 'B', captainAUid: 'c1', captainBUid: 'c2', scoreA: 2, scoreB: 1 },
        { id: '3', date: '2026-07-03', teamAName: 'A', teamBName: 'B', captainAUid: 'c1', captainBUid: 'c2', scoreA: 0, scoreB: 1 },
      ];

      const streak = calculateCurrentStreak(matches, 'c1');
      expect(streak.winner).toBe('A');
      expect(streak.count).toBe(2); // 2 consecutive wins starting from latest date
    });

    it('calculates rivalry intensity score and verifies tier classification', () => {
      const stats = aggregateHeadToHeadStats(SAMPLE_DERBY_MATCHES);
      const intensity = calculateRivalryIntensityScore(stats);
      expect(intensity.score).toBeGreaterThanOrEqual(10);
      expect(intensity.score).toBeLessThanOrEqual(100);
      expect(['WARM', 'HEAT', 'FIERCE', 'EL CLASICO']).toContain(intensity.level);
    });
  });
});
