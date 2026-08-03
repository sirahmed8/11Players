import { describe, it, expect } from 'vitest';
import { checkProAccess } from '@/lib/proSubscription';
import { PlayerProfile } from '@/types';

describe('proSubscription module', () => {
  it('automatically grants full access to platform owner by email or isOwner flag', () => {
    const ownerUser = { email: 'a7medorabe7@gmail.com', uid: 'any-uid' };
    const res = checkProAccess(ownerUser, null, true);
    expect(res.hasProAccess).toBe(true);
    expect(res.hasClubOrganizerAccess).toBe(true);
    expect(res.isOwner).toBe(true);
    expect(res.plan).toBe('club_organizer');
  });

  it('automatically grants full access to owner UID even if profile is missing', () => {
    const ownerUser = { email: 'test@example.com', uid: 'G8vV7jTvd0VUeRlohrGFyARhiiw1' };
    const res = checkProAccess(ownerUser, null, false);
    expect(res.hasProAccess).toBe(true);
    expect(res.hasClubOrganizerAccess).toBe(true);
    expect(res.isOwner).toBe(true);
  });

  it('denies access to regular user with no subscription', () => {
    const user = { email: 'regular@example.com', uid: 'user-123' };
    const profile: Partial<PlayerProfile> = { uid: 'user-123', fullName: 'Regular Player' };
    const res = checkProAccess(user, profile as PlayerProfile, false);
    expect(res.hasProAccess).toBe(false);
    expect(res.hasClubOrganizerAccess).toBe(false);
    expect(res.plan).toBe('free');
  });

  it('denies access to expired subscription', () => {
    const user = { email: 'regular@example.com', uid: 'user-123' };
    const profile: Partial<PlayerProfile> = {
      uid: 'user-123',
      fullName: 'Regular Player',
      subscription: {
        plan: 'pro_captain',
        status: 'active',
        expiresAt: '2020-01-01T00:00:00Z', // Expired
      },
    };
    const res = checkProAccess(user, profile as PlayerProfile, false);
    expect(res.hasProAccess).toBe(false);
  });

  it('grants PRO Captain access to active pro_captain subscriber', () => {
    const user = { email: 'pro@example.com', uid: 'user-456' };
    const profile: Partial<PlayerProfile> = {
      uid: 'user-456',
      fullName: 'Pro Captain',
      subscription: {
        plan: 'pro_captain',
        status: 'active',
        expiresAt: '2099-01-01T00:00:00Z',
      },
    };
    const res = checkProAccess(user, profile as PlayerProfile, false);
    expect(res.hasProAccess).toBe(true);
    expect(res.hasClubOrganizerAccess).toBe(false);
    expect(res.plan).toBe('pro_captain');
  });

  it('grants Club Organizer access to active club_organizer subscriber', () => {
    const user = { email: 'club@example.com', uid: 'user-789' };
    const profile: Partial<PlayerProfile> = {
      uid: 'user-789',
      fullName: 'Club Owner',
      subscription: {
        plan: 'club_organizer',
        status: 'active',
        expiresAt: '2099-01-01T00:00:00Z',
      },
    };
    const res = checkProAccess(user, profile as PlayerProfile, false);
    expect(res.hasProAccess).toBe(true);
    expect(res.hasClubOrganizerAccess).toBe(true);
    expect(res.plan).toBe('club_organizer');
  });
});
