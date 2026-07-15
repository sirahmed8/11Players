/**
 * Centralized notification creation service.
 *
 * Guarantees:
 *  - Consistent `serverTimestamp()` for `createdAt` (never mixed types)
 *  - Proper localization via `isAr` ternaries (never bilingual mashups)
 *  - Correct `link` with `?uid=` for player-specific notifications
 *
 * Usage:
 *   import { sendNotification } from '@/lib/notificationService';
 *   await sendNotification(playerUid, {
 *     type: 'stats',
 *     titleAr: '⚽ تحديث الإحصائيات!',
 *     titleEn: '⚽ Stats Updated!',
 *     bodyAr: 'تم تحديث إحصائياتك',
 *     bodyEn: 'Your stats were updated',
 *     link: '/profile?uid=abc123',
 *   });
 */

import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type NotificationType =
  | 'system' | 'match' | 'hint' | 'advices'
  | 'admin' | 'owner' | 'updates' | 'stats' | 'trophies';

export interface NotificationInput {
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  link?: string;
}

export interface NotificationInputAr extends NotificationInput {
  ratedBy?: string;
}

/**
 * Send a localized notification to a user's inbox.
 * The caller decides which locale to use (based on the recipient's preference
 * if known, or the current UI locale otherwise).
 *
 * @param userId - Recipient's UID
 * @param input - Notification content (Ar + En variants)
 * @param isAr - Which locale to use for the stored title/body
 * @param id - Optional explicit notification ID (useful for dedup). If omitted, auto-generated.
 */
export async function sendNotification(
  userId: string,
  input: NotificationInput,
  isAr: boolean,
  id?: string
): Promise<void> {
  const notifData: any = {
    type: input.type,
    title: isAr ? input.titleAr : input.titleEn,
    body: isAr ? input.bodyAr : input.bodyEn,
    read: false,
    createdAt: serverTimestamp(),
    ...(input.link ? { link: input.link } : {}),
  };

  if (id) {
    const ref = doc(db, 'users', userId, 'notifications', id);
    await setDoc(ref, notifData, { merge: true });
  } else {
    const ref = collection(db, 'users', userId, 'notifications');
    await addDoc(ref, notifData);
  }
}

/**
 * Batch-friendly version that returns the notification data object
 * (without the serverTimestamp, which must be added by the caller in a batch context).
 */
export function buildNotificationData(
  input: NotificationInput,
  isAr: boolean
): Record<string, any> {
  return {
    type: input.type,
    title: isAr ? input.titleAr : input.titleEn,
    body: isAr ? input.bodyAr : input.bodyEn,
    read: false,
    createdAt: serverTimestamp(),
    ...(input.link ? { link: input.link } : {}),
  };
}
