import { describe, it, expect } from 'vitest';
import { POSITION_WEIGHTS } from '../../src/lib/pesConstants';
import { PESPosition } from '../../src/types';

describe('PES Constants Unit Tests', () => {
  const allPositions: PESPosition[] = [
    'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF'
  ];

  it('should define weight maps for all 13 PES positions', () => {
    allPositions.forEach((pos) => {
      expect(POSITION_WEIGHTS[pos]).toBeDefined();
    });
  });

  it('should have total weight sum equal to approximately 1.0 for each position', () => {
    allPositions.forEach((pos) => {
      const weights = POSITION_WEIGHTS[pos];
      const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
      expect(sum).toBeGreaterThanOrEqual(0.95);
      expect(sum).toBeLessThanOrEqual(1.05);
    });
  });

  it('should assign high defensive weights for CB and GK', () => {
    const cbDef = POSITION_WEIGHTS.CB.defensiveAwareness + POSITION_WEIGHTS.CB.ballWinning;
    expect(cbDef).toBeGreaterThan(0.3);

    const gkReflexes = POSITION_WEIGHTS.GK.gkReflexes + POSITION_WEIGHTS.GK.gkReach;
    expect(gkReflexes).toBeGreaterThan(0.3);
  });
});
