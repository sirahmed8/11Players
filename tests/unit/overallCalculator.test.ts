import { describe, it, expect } from 'vitest';
import { calculateRealisticOverall, calculatePositionRating } from '../../src/lib/overallCalculator';

describe('Overall Calculator Tests', () => {
  const sampleAttrs = {
    speed: 80,
    acceleration: 80,
    dribbling: 80,
    ballControl: 80,
    offensiveAwareness: 80,
    finishing: 80,
    lowPass: 75,
    loftedPass: 70,
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
