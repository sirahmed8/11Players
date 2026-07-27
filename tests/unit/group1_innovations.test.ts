import { describe, it, expect } from 'vitest';
import {
  getPositionPitchCoordinates,
  generateHeatmapClusterPoints,
  POSITION_GROUP_MAP,
  POSITION_PITCH_COORDINATES,
} from '../../src/components/pitch/DynamicPitchHeatmap';
import { TEST_DRAFT_POOL_22 as DEFAULT_DRAFT_POOL_22 } from '../fixtures/mockPlayers';
import {
  calculatePositionalCoverage,
  calculateDraftBalance,
  getNextDraftTurn,
  autoDraftPick,
} from '../../src/components/draft/CaptainDraftRoom';
import {
  updateMomentumState,
  calculateStoppageTime,
} from '../../src/components/broadcaster/LiveMatchBroadcaster';
import { PlayerProfile, PESPosition } from '../../src/types';

describe('Group 1 Innovations Unit Tests', () => {
  // ── 1. Heatmap Coordinate Mapping Logic ────────────────────────────────────
  describe('DynamicPitchHeatmap Coordinate Mapping Logic', () => {
    it('should map standard PES positions to valid field coordinates (0..100 scale)', () => {
      const positions: PESPosition[] = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'];

      positions.forEach((pos) => {
        const coords = getPositionPitchCoordinates(pos);
        expect(coords).toBeDefined();
        expect(coords.x).toBeGreaterThanOrEqual(0);
        expect(coords.x).toBeLessThanOrEqual(100);
        expect(coords.y).toBeGreaterThanOrEqual(0);
        expect(coords.y).toBeLessThanOrEqual(100);
      });
    });

    it('should place GK in the defensive box area (x <= 15) and CF in attack area (x >= 80)', () => {
      const gkCoords = getPositionPitchCoordinates('GK');
      const cfCoords = getPositionPitchCoordinates('CF');

      expect(gkCoords.x).toBeLessThanOrEqual(15);
      expect(cfCoords.x).toBeGreaterThanOrEqual(80);
    });

    it('should generate valid heatmap density cluster points around base location', () => {
      const clusters = generateHeatmapClusterPoints(50, 50, 20, 10, 10);
      expect(clusters.length).toBe(21); // 1 seed + 20 points
      expect(clusters[0]).toEqual({ x: 50, y: 50, weight: 1.0 });

      clusters.forEach((pt) => {
        expect(pt.x).toBeGreaterThanOrEqual(0);
        expect(pt.x).toBeLessThanOrEqual(100);
        expect(pt.y).toBeGreaterThanOrEqual(0);
        expect(pt.y).toBeLessThanOrEqual(100);
        expect(pt.weight).toBeGreaterThanOrEqual(0);
      });
    });

    it('should correctly map positions to position groups (GK, DEF, MID, ATT)', () => {
      expect(POSITION_GROUP_MAP['GK']).toBe('GK');
      expect(POSITION_GROUP_MAP['CB']).toBe('DEF');
      expect(POSITION_GROUP_MAP['LB']).toBe('DEF');
      expect(POSITION_GROUP_MAP['RB']).toBe('DEF');
      expect(POSITION_GROUP_MAP['CMF']).toBe('MID');
      expect(POSITION_GROUP_MAP['AMF']).toBe('MID');
      expect(POSITION_GROUP_MAP['CF']).toBe('ATT');
      expect(POSITION_GROUP_MAP['LWF']).toBe('ATT');
    });
  });

  // ── 2. Draft Balance & Turn Logic ─────────────────────────────────────────
  describe('CaptainDraftRoom Balance & Snake/Classic Turn Logic', () => {
    it('should calculate accurate positional coverage for a squad', () => {
      const sampleTeam: PlayerProfile[] = [
        DEFAULT_DRAFT_POOL_22[2], // Bounou (GK)
        DEFAULT_DRAFT_POOL_22[4], // Aguerd (CB)
        DEFAULT_DRAFT_POOL_22[0], // Hakimi (RB)
        DEFAULT_DRAFT_POOL_22[9], // Amrabat (DMF)
        DEFAULT_DRAFT_POOL_22[18], // En-Nesyri (CF)
      ];

      const coverage = calculatePositionalCoverage(sampleTeam);
      expect(coverage.GK).toBe(1);
      expect(coverage.DEF).toBe(2);
      expect(coverage.MID).toBe(1);
      expect(coverage.ATT).toBe(1);
    });

    it('should calculate team OVR, PSI, and OVR diff in draft balance', () => {
      const teamA = [DEFAULT_DRAFT_POOL_22[0], DEFAULT_DRAFT_POOL_22[2], DEFAULT_DRAFT_POOL_22[4]];
      const teamB = [DEFAULT_DRAFT_POOL_22[1], DEFAULT_DRAFT_POOL_22[3], DEFAULT_DRAFT_POOL_22[5]];

      const balance = calculateDraftBalance(teamA, teamB);
      expect(balance.teamAOvr).toBeGreaterThan(50);
      expect(balance.teamBOvr).toBeGreaterThan(50);
      expect(balance.ovrDiff).toBe(Math.abs(balance.teamAOvr - balance.teamBOvr));
      expect(balance.teamAPsi).toBeGreaterThan(0);
      expect(balance.teamBPsi).toBeGreaterThan(0);
    });

    it('should sequence alternating draft turns correctly for classic mode', () => {
      expect(getNextDraftTurn('classic', 0)).toBe('teamA');
      expect(getNextDraftTurn('classic', 1)).toBe('teamB');
      expect(getNextDraftTurn('classic', 2)).toBe('teamA');
      expect(getNextDraftTurn('classic', 3)).toBe('teamB');
    });

    it('should sequence snake draft turns correctly (A-B-B-A-A-B-B-A)', () => {
      // Pick index 0: Team A
      expect(getNextDraftTurn('snake', 0)).toBe('teamA');
      // Pick index 1: Team B
      expect(getNextDraftTurn('snake', 1)).toBe('teamB');
      // Pick index 2: Team B (Round 1 reverse)
      expect(getNextDraftTurn('snake', 2)).toBe('teamB');
      // Pick index 3: Team A
      expect(getNextDraftTurn('snake', 3)).toBe('teamA');
      // Pick index 4: Team A (Round 2 forward)
      expect(getNextDraftTurn('snake', 4)).toBe('teamA');
      // Pick index 5: Team B
      expect(getNextDraftTurn('snake', 5)).toBe('teamB');
    });

    it('should prioritize GK in auto-draft fallback if team has zero goalkeepers', () => {
      const teamWithoutGk = [DEFAULT_DRAFT_POOL_22[0], DEFAULT_DRAFT_POOL_22[1]];
      const autoPick = autoDraftPick(DEFAULT_DRAFT_POOL_22, teamWithoutGk);

      expect(autoPick).toBeDefined();
      expect(autoPick?.primaryPosition).toBe('GK');
    });

    it('should select highest OVR player in auto-draft if GK is already covered', () => {
      const teamWithGk = [DEFAULT_DRAFT_POOL_22[2]]; // Bounou (GK)
      const availablePool = DEFAULT_DRAFT_POOL_22.filter((p) => p.uid !== 'p3'); // remove Bounou

      const autoPick = autoDraftPick(availablePool, teamWithGk);
      expect(autoPick).toBeDefined();
      // Should pick Hakimi or Brahim Diaz (highest OVR in pool)
      expect(['c1', 'c2']).toContain(autoPick?.uid);
    });
  });

  // ── 3. Match Broadcaster Momentum & Stoppage Logic ────────────────────────
  describe('LiveMatchBroadcaster Momentum & Stoppage Logic', () => {
    it('should update momentum state correctly based on match events', () => {
      // Base neutral momentum = 50
      let m = 50;

      // Goal Team A shifts momentum towards Team A (-25)
      m = updateMomentumState(m, 'GOAL', 'teamA');
      expect(m).toBe(25);

      // Goal Team B shifts momentum towards Team B (+25)
      m = updateMomentumState(m, 'GOAL', 'teamB');
      expect(m).toBe(50);

      // Shot Team A shifts towards Team A (-15)
      m = updateMomentumState(m, 'SHOT', 'teamA');
      expect(m).toBe(35);

      // Red Card Team A penalizes Team A, shifting momentum towards Team B (+22)
      m = updateMomentumState(m, 'RED_CARD', 'teamA');
      expect(m).toBe(57);
    });

    it('should clamp momentum state within 0 to 100 range', () => {
      let m = 5;
      m = updateMomentumState(m, 'GOAL', 'teamA'); // 5 - 25 = -20 -> clamped to 0
      expect(m).toBe(0);

      m = 95;
      m = updateMomentumState(m, 'GOAL', 'teamB'); // 95 + 25 = 120 -> clamped to 100
      expect(m).toBe(100);
    });

    it('should calculate appropriate stoppage time (+1 to +6 mins)', () => {
      expect(calculateStoppageTime(20, 2)).toBe(0);
      expect(calculateStoppageTime(45, 1)).toBe(1);
      expect(calculateStoppageTime(90, 4)).toBe(2);
      expect(calculateStoppageTime(90, 15)).toBe(6); // max cap at 6 mins
    });
  });
});
