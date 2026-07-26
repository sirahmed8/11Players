import { describe, it, expect } from 'vitest';
import { calculateRealisticOverall, calculatePositionRating } from '../../src/lib/overallCalculator';
import { PlayerAttributes } from '../../src/types';

describe('Overall Calculator Tests', () => {
  const sampleAttrs: PlayerAttributes = {
    offensiveAwareness: 80,
    ballControl: 80,
    dribbling: 80,
    lowPass: 75,
    loftedPass: 70,
    finishing: 80,
    heading: 60,
    speed: 80,
    acceleration: 80,
    kickingPower: 75,
    jump: 65,
    physicalContact: 65,
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
  };

  it('should calculate realistic overall for CMF', () => {
    const ovr = calculateRealisticOverall(sampleAttrs, 'CMF', 'Box-to-Box');
    expect(ovr).toBeGreaterThanOrEqual(40);
    expect(ovr).toBeLessThanOrEqual(99);
  });

  it('should apply out-of-position penalty correctly', () => {
    const player = {
      attributes: sampleAttrs,
      primaryPosition: 'CF' as const,
    };
    const cfRating = calculatePositionRating(player, 'CF');
    const gkRating = calculatePositionRating(player, 'GK');
    expect(gkRating).toBeLessThan(cfRating);
  });
});

