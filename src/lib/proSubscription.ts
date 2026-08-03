import { PlayerProfile } from "@/types";

export interface ProAccessResult {
  hasProAccess: boolean;
  hasClubOrganizerAccess: boolean;
  plan: 'free' | 'pro_captain' | 'club_organizer';
  isOwner: boolean;
  reason?: string;
}

/**
 * Checks whether a user has active PRO or Club Organizer subscription access.
 * Platform Owner automatically receives full unrestricted access.
 */
export function checkProAccess(
  user: any | null,
  playerProfile: PlayerProfile | null | undefined,
  isOwner: boolean
): ProAccessResult {
  const ownerEmail = "a7medorabe7@gmail.com";
  const ownerUid = "G8vV7jTvd0VUeRlohrGFyARhiiw1";
  
  const userIsOwner =
    isOwner ||
    user?.email?.toLowerCase() === ownerEmail ||
    user?.uid === ownerUid;

  if (userIsOwner) {
    return {
      hasProAccess: true,
      hasClubOrganizerAccess: true,
      plan: 'club_organizer',
      isOwner: true,
      reason: 'Owner Unrestricted Access',
    };
  }

  if (!playerProfile || !playerProfile.subscription) {
    return {
      hasProAccess: false,
      hasClubOrganizerAccess: false,
      plan: 'free',
      isOwner: false,
      reason: 'No Active Subscription',
    };
  }

  const sub = playerProfile.subscription;
  const isActive = sub.status === 'active';
  const isNotExpired = !sub.expiresAt || new Date(sub.expiresAt).getTime() > Date.now();

  if (isActive && isNotExpired) {
    const isClub = sub.plan === 'club_organizer';
    const isPro = sub.plan === 'pro_captain' || isClub;
    return {
      hasProAccess: isPro,
      hasClubOrganizerAccess: isClub,
      plan: sub.plan,
      isOwner: false,
    };
  }

  return {
    hasProAccess: false,
    hasClubOrganizerAccess: false,
    plan: 'free',
    isOwner: false,
    reason: 'Subscription Expired or Inactive',
  };
}
