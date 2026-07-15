/**
 * Centralized Firestore collection/document path builders.
 *
 * Eliminates scattered string literals like `communities/${cid}/matches/${mid}`
 * across the codebase — single source of truth, easier to audit and refactor.
 */

import { doc, collection, DocumentReference, CollectionReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Root Collections ──

export const playersCol = () => collection(db, 'players');
export const usersCol = () => collection(db, 'users');
export const communitiesCol = () => collection(db, 'communities');
export const siteFeedbackCol = () => collection(db, 'site_feedback');
export const editRequestsCol = () => collection(db, 'editRequests');
export const systemCol = () => collection(db, 'system');
export const supportThreadsCol = () => collection(db, 'support_threads');

// ── Player Paths ──

export const playerDoc = (uid: string) => doc(db, 'players', uid);

// ── User Notification Paths ──

export const userNotificationsCol = (uid: string) => collection(db, 'users', uid, 'notifications');
export const userNotificationDoc = (uid: string, notifId: string) => doc(db, 'users', uid, 'notifications', notifId);

// ── Community Paths ──

export const communityDoc = (cid: string) => doc(db, 'communities', cid);
export const communityPlayersCol = (cid: string) => collection(db, 'communities', cid, 'players');
export const communityPlayerDoc = (cid: string, uid: string) => doc(db, 'communities', cid, 'players', uid);
export const communityChatsCol = (cid: string) => collection(db, 'communities', cid, 'chats');
export const communityRequestsCol = (cid: string) => collection(db, 'communities', cid, 'requests');
export const communityEditRequestsCol = (cid: string) => collection(db, 'communities', cid, 'editRequests');
export const communitySettingsDoc = (cid: string, docId: string = 'main') => doc(db, 'communities', cid, 'settings', docId);

// ── Match Paths ──

export const communityMatchesCol = (cid: string) => collection(db, 'communities', cid, 'matches');
export const latestMatchDoc = (cid: string) => doc(db, 'communities', cid, 'matches', 'latest');
export const matchDoc = (cid: string, matchId: string) => doc(db, 'communities', cid, 'matches', matchId);
export const matchRatingsCol = (cid: string, matchId: string) => collection(db, 'communities', cid, 'matches', matchId, 'ratings');
export const matchRatingDoc = (cid: string, matchId: string, raterUid: string) =>
  doc(db, 'communities', cid, 'matches', matchId, 'ratings', raterUid);

// ── Peer Rating Paths ──

export const communityPlayerRatingsCol = (cid: string) => collection(db, 'communities', cid, 'playerRatings');
export const communityPlayerRatingDoc = (cid: string, raterUid: string, ratedUid: string) =>
  doc(db, 'communities', cid, 'playerRatings', `${raterUid}_${ratedUid}`);

// ── Support Paths ──

export const supportThreadDoc = (uid: string) => doc(db, 'support_threads', uid);
export const supportMessagesCol = (uid: string) => collection(db, 'support_threads', uid, 'messages');

// ── System Paths ──

export const dailyAggregationDoc = (dateStr: string) => doc(db, 'system', 'dailyRatingAggregation', dateStr, 'status');
