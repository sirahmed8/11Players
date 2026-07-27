import { describe, it, expect } from 'vitest';
import { getAllPlayerCommunities, calculateAge, getPlayerOverall, getEffectiveHomeCommunityId } from '../../src/lib/playerUtils';

describe('Player Utilities Unit Tests', () => {
  describe('getAllPlayerCommunities', () => {
    it('should return deduplicated list of communities', () => {
      const result = getAllPlayerCommunities(
        { memberCommunities: ['c1', 'c2'], joinedCommunities: ['c2', 'c3'] },
        'c3'
      );
      expect(result).toEqual(['c1', 'c2', 'c3']);
    });

    it('should handle empty or undefined communities gracefully', () => {
      const result = getAllPlayerCommunities({}, null);
      expect(result).toEqual([]);
    });
  });

  describe('calculateAge', () => {
    it('should return default 20 when birthDate is missing', () => {
      expect(calculateAge(null)).toBe(20);
      expect(calculateAge(undefined)).toBe(20);
    });

    it('should return default 20 for invalid date strings', () => {
      expect(calculateAge('invalid-date')).toBe(20);
    });

    it('should correctly calculate age from valid DOB string', () => {
      const age = calculateAge('2000-01-01');
      expect(age).toBeGreaterThanOrEqual(25);
    });
  });

  describe('getPlayerOverall', () => {
    it('should return default overall 70 when player is empty', () => {
      expect(getPlayerOverall({})).toBe(70);
    });

    it('should compute valid overall rating for a player with attributes', () => {
      const ovr = getPlayerOverall({
        primaryPosition: 'CF',
        attributes: {
          offensiveAwareness: 85,
          ballControl: 80,
          dribbling: 80,
          lowPass: 70,
          loftedPass: 65,
          finishing: 85,
          heading: 75,
          speed: 82,
          acceleration: 82,
          kickingPower: 80,
          jump: 75,
          physicalContact: 75,
          balance: 75,
          stamina: 75,
          defensiveAwareness: 40,
          ballWinning: 40,
          aggression: 40,
          gkAwareness: 40,
          gkCatching: 40,
          gkClearing: 40,
          gkReflexes: 40,
          gkReach: 40,
        },
      });
      expect(ovr).toBeGreaterThan(60);
      expect(ovr).toBeLessThanOrEqual(99);
    });
  });

  describe('getEffectiveHomeCommunityId', () => {
    it('should return null if homeCommunityId is unlocked', () => {
      expect(getEffectiveHomeCommunityId({ homeCommunityId: 'unlocked' })).toBeNull();
    });

    it('should return homeCommunityId if set', () => {
      expect(getEffectiveHomeCommunityId({ homeCommunityId: 'comm-123' })).toBe('comm-123');
    });

    it('should fallback to first member community if homeCommunityId not set', () => {
      expect(getEffectiveHomeCommunityId({ memberCommunities: ['comm-abc', 'comm-def'] })).toBe('comm-abc');
    });
  });
});
