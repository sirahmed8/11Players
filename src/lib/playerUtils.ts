import { PlayerProfile } from '@/types';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

/**
 * Returns a unique array of community IDs the player belongs to.
 * Includes memberCommunities, joinedCommunities, and an optional activeCommunityId.
 */
export function getAllPlayerCommunities(player: Partial<PlayerProfile>, activeCommunityId?: string | null): string[] {
  return Array.from(
    new Set([
      ...(player.memberCommunities || []),
      ...(player.joinedCommunities || []),
      ...(activeCommunityId ? [activeCommunityId] : [])
    ])
  ) as string[];
}

/**
 * Calculates a realistic age based on birthDate.
 */
export function calculateAge(birthDate: Date | string | number | undefined | null): number {
  if (!birthDate) return 20; // Default
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return 20;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Computes exact realistic overall rating using all active attributes and physical/consensus modifiers.
 * Guarantees 100% parity between sorting and PlayerCard display.
 */
export function getPlayerOverall(player: Partial<PlayerProfile>): number {
  if (!player) return 72;

  const defaultAttrs = {
    offensiveAwareness: 70, ballControl: 70, dribbling: 70, lowPass: 70, loftedPass: 70,
    finishing: 70, heading: 70, speed: 70, acceleration: 70, kickingPower: 70,
    jump: 70, physicalContact: 70, balance: 70, stamina: 70, defensiveAwareness: 70,
    ballWinning: 70, aggression: 70, gkAwareness: 70, gkCatching: 70, gkClearing: 70,
    gkReflexes: 70, gkReach: 70
  };

  const activeAttributes = {
    ...defaultAttrs,
    ...(player.approvedAttributes || player.attributes || {})
  } as import('@/types').PlayerAttributes;

  const calculatedOverall = calculateRealisticOverall(
    activeAttributes,
    player.primaryPosition || 'CMF',
    player.playStyle || '',
    player.height || 175,
    player.weight || 70,
    player.calculatedAge || calculateAge(player.dateOfBirth),
    player.peerRatingAvg,
    player.peerRatingCount,
    player.preferredFoot,
    player.specialSkills,
    player.stats
  );

  return calculatedOverall || player.overallRating || 72;
}

/**
 * Returns the effective home community ID for a player.
 * If homeCommunityId is 'unlocked', returns null.
 * Otherwise returns homeCommunityId or the first joined community.
 */
export function getEffectiveHomeCommunityId(player: Partial<PlayerProfile>): string | null {
  if (!player) return null;
  if (player.homeCommunityId === 'unlocked') return null;
  
  if (player.homeCommunityId) return player.homeCommunityId;
  
  // Fallback to first joined community
  if (player.memberCommunities && player.memberCommunities.length > 0) {
    return player.memberCommunities[0];
  }
  if (player.joinedCommunities && player.joinedCommunities.length > 0) {
    return player.joinedCommunities[0];
  }
  return null;
}

