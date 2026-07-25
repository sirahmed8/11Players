import { describe, it, expect } from 'vitest';
import { getPositionFamiliarityMultiplier, calculatePSI, selectBestFormation } from '../../src/lib/engine';
import { PlayerProfile } from '../../src/types';

describe('Engine Unit Tests', () => {
  const dummyPlayer: PlayerProfile = {
    uid: 'p1',
    cardName: 'Test Attacker',
    fullName: 'Test Attacker',
    primaryPosition: 'LWF',
    secondaryPosition: 'RWF',
    tertiaryPosition: 'SS',
    attributes: {
      speed: 85,
      acceleration: 85,
      dribbling: 80,
      ballControl: 80,
      offensiveAwareness: 80,
      finishing: 75,
    },
  };

  it('should return primary familiarity (1.0) for primary position', () => {
    const mult = getPositionFamiliarityMultiplier(dummyPlayer, 'LWF');
    expect(mult).toBe(1.0);
  });

  it('should return low multiplier (0.15) for pure attacker assigned to LB', () => {
    const mult = getPositionFamiliarityMultiplier(dummyPlayer, 'LB');
    expect(mult).toBe(0.15);
  });

  it('should calculate PSI correctly for valid position', () => {
    const psi = calculatePSI(dummyPlayer, 'LWF');
    expect(psi).toBeGreaterThan(60);
  });
});
