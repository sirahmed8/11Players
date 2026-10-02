import { PlayerProfile } from "@/types";

export type PlanType = 'free' | 'match_pass' | 'pro_captain' | 'club_organizer';

export interface ProAccessResult {
  hasProAccess: boolean;
  hasClubOrganizerAccess: boolean;
  plan: 'free' | 'pro_captain' | 'club_organizer';
  isOwner: boolean;
  reason?: string;
}

/**
 * Standardized Unified Pricing Matrix across 11Players
 * Prices in EGP (with USD parallel estimates)
 */
export const SUBSCRIPTION_PRICING = {
  free: {
    egpMonthly: 0,
    egpAnnualMonthly: 0,
    usdMonthly: 0,
    usdAnnualMonthly: 0,
  },
  match_pass: {
    egpOneTime: 25,
    usdOneTime: 0.99,
  },
  pro_captain: {
    egpMonthly: 59,
    egpAnnualMonthly: 49, // Save ~25%
    usdMonthly: 1.49,
    usdAnnualMonthly: 0.99,
  },
  club_organizer: {
    egpMonthly: 179,
    egpAnnualMonthly: 149, // Save ~25%
    usdMonthly: 3.99,
    usdAnnualMonthly: 2.99,
  },
} as const;

export type FeatureKey =
  | 'tactical_ai_scouting'
  | 'custom_3d_kit'
  | 'newspaper_cover'
  | 'golden_pro_badge'
  | 'pitch_split_bill'
  | 'live_2d_broadcast'
  | 'derby_rivalry'
  | 'unlimited_communities'
  | 'unlimited_ai_chat'
  | 'stats_exporter';

/**
 * Maps each feature to its minimum required plan tier.
 */
export const FEATURE_PLAN_REQUIREMENTS: Record<FeatureKey, 'free' | 'pro_captain' | 'club_organizer'> = {
  tactical_ai_scouting: 'pro_captain',
  custom_3d_kit: 'pro_captain',
  newspaper_cover: 'pro_captain',
  golden_pro_badge: 'pro_captain',
  unlimited_communities: 'pro_captain',
  unlimited_ai_chat: 'pro_captain',
  stats_exporter: 'pro_captain',
  pitch_split_bill: 'club_organizer',
  live_2d_broadcast: 'club_organizer',
  derby_rivalry: 'club_organizer',
};

/**
 * Centralized Feature-Flagging Gate: canAccessFeature
 * Determines if a given user/session is allowed to access a specific feature.
 * The Platform Owner always has total unrestricted bypass access.
 */
export function canAccessFeature(
  user: any | null,
  feature: FeatureKey,
  subState?: {
    hasProAccess: boolean;
    hasClubOrganizerAccess: boolean;
    isOwner: boolean;
  }
): boolean {
  if (subState?.isOwner) return true;

  const ownerEmail = "a7medorabe7@gmail.com";
  const ownerUid = "G8vV7jTvd0VUeRlohrGFyARhiiw1";
  if (
    user?.email?.toLowerCase() === ownerEmail ||
    user?.uid === ownerUid
  ) {
    return true;
  }

  const requiredTier = FEATURE_PLAN_REQUIREMENTS[feature];
  if (requiredTier === 'free') return true;

  if (requiredTier === 'club_organizer') {
    return !!subState?.hasClubOrganizerAccess;
  }

  if (requiredTier === 'pro_captain') {
    return !!(subState?.hasProAccess || subState?.hasClubOrganizerAccess);
  }

  return false;
}

/**
 * Format currency in Egyptian Pounds (EGP)
 */
export function formatCurrencyEGP(amount: number, isAr: boolean = true): string {
  try {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return isAr ? `${amount} ج.م` : `${amount} EGP`;
  }
}

/**
 * Format currency in US Dollars (USD)
 */
export function formatCurrencyUSD(amount: number, isAr: boolean = false): string {
  try {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
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

