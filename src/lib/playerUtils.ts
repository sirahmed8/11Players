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
  if (!player) return 40;
  const activeAttributes = (player.approvedAttributes || player.attributes || {}) as import('@/types').PlayerAttributes;
  const calculatedOverall = calculateRealisticOverall(
    activeAttributes,
    player.primaryPosition || 'CMF',
    player.playStyle || '',
    player.height,
    player.weight,
    player.calculatedAge || calculateAge(player.dateOfBirth),
    player.peerRatingAvg,
    player.peerRatingCount,
    player.preferredFoot,
    player.specialSkills
  );
  const hasAttributes = Object.keys(activeAttributes).length > 0;
  if (hasAttributes && calculatedOverall > 40) {
    return calculatedOverall;
  }
  return player.overallRating || calculatedOverall || 40;
}

