import { PlayerProfile } from '@/types';

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
