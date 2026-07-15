import { collection, getDocs, doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Daily Peer Rating Aggregator
 *
 * Client-side function that computes the average peer rating for each player
 * in a community. Designed to run once per day (on first admin visit after midnight).
 *
 * Uses a guard doc at `system/dailyRatingAggregation/{YYYY-MM-DD}` to prevent
 * re-running on the same day.
 *
 * @param communityId - The community to aggregate ratings for
 * @returns Object with stats: { updatedCount, skippedCount, error? }
 */
export async function runDailyRatingAggregation(communityId: string): Promise<{
  updatedCount: number;
  skippedCount: number;
  error?: string;
}> {
  try {
    // 1. Check if already run today
    const today = new Date().toISOString().split('T')[0]; // "2026-07-15"
    const guardRef = doc(db, 'system', 'dailyRatingAggregation', today, 'status');
    const guardSnap = await getDoc(guardRef);

    if (guardSnap.exists()) {
      return { updatedCount: 0, skippedCount: 0 };
    }

    // 2. Fetch all peer ratings for this community
    const ratingsRef = collection(db, 'communities', communityId, 'playerRatings');
    const ratingsSnap = await getDocs(ratingsRef);

    if (ratingsSnap.empty) {
      // Mark as done even if no ratings exist
      await setDoc(guardRef, {
        communityId,
        ranAt: serverTimestamp(),
        ratingCount: 0,
        playersUpdated: 0,
      });
      return { updatedCount: 0, skippedCount: 0 };
    }

    // 3. Group ratings by ratedUid — keep only the LATEST rating per rater
    //    (so editing a rating replaces the old one)
    const latestRatingsByPlayer: Record<string, { raterUid: string; rating: number; timestamp: any }[]> = {};

    for (const docSnap of ratingsSnap.docs) {
      const data = docSnap.data();
      const ratedUid = data.ratedUid;
      if (!ratedUid) continue;

      if (!latestRatingsByPlayer[ratedUid]) {
        latestRatingsByPlayer[ratedUid] = [];
      }
      latestRatingsByPlayer[ratedUid].push({
        raterUid: data.raterUid,
        rating: data.rating,
        timestamp: data.timestamp,
      });
    }

    // 4. Deduplicate: per rater, keep only the latest rating per rated player
    const deduplicatedRatings: Record<string, number[]> = {};

    for (const [ratedUid, ratings] of Object.entries(latestRatingsByPlayer)) {
      // Sort by timestamp descending, keep first per rater
      const sorted = ratings.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      const seenRaters = new Set<string>();
      const validRatings: number[] = [];

      for (const r of sorted) {
        if (!seenRaters.has(r.raterUid)) {
          seenRaters.add(r.raterUid);
          validRatings.push(r.rating);
        }
      }

      if (validRatings.length > 0) {
        deduplicatedRatings[ratedUid] = validRatings;
      }
    }

    // 5. Compute averages and write to player docs
    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const [ratedUid, ratings] of Object.entries(deduplicatedRatings)) {
      const avg = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
      const roundedAvg = Math.round(avg * 10) / 10; // One decimal place

      // Update on the community player doc
      const commPlayerRef = doc(db, 'communities', communityId, 'players', ratedUid);
      batch.set(commPlayerRef, {
        peerRatingAvg: roundedAvg,
        peerRatingCount: ratings.length,
      }, { merge: true });

      // Also update on the global player doc
      const globalPlayerRef = doc(db, 'players', ratedUid);
      batch.set(globalPlayerRef, {
        peerRatingAvg: roundedAvg,
        peerRatingCount: ratings.length,
      }, { merge: true });

      updatedCount++;
    }

    await batch.commit();

    // 6. Mark today's aggregation as complete
    await setDoc(guardRef, {
      communityId,
      ranAt: serverTimestamp(),
      ratingCount: ratingsSnap.size,
      playersUpdated: updatedCount,
    });

    return { updatedCount, skippedCount: 0 };
  } catch (err) {
    console.error('Daily rating aggregation failed:', err);
    return { updatedCount: 0, skippedCount: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Check if today's aggregation has already run for a community.
 */
export async function hasAggregationRunToday(communityId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const guardRef = doc(db, 'system', 'dailyRatingAggregation', today, 'status');
    const snap = await getDoc(guardRef);
    return snap.exists();
  } catch {
    return false;
  }
}
