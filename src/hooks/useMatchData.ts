import { useState, useEffect } from "react";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useMatchData(activeCommunityId: string | null) {
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyMatches, setHistoryMatches] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!activeCommunityId) {
      setMatchData(null);
      setHistoryMatches([]);
      setLoading(false);
      setHistoryLoading(false);
      return;
    }

    setLoading(true);
    const unsubMatch = onSnapshot(
      doc(db, "communities", activeCommunityId, "matches", "latest"),
      (docSnap) => {
        if (docSnap.exists()) {
          setMatchData(docSnap.data());
        } else {
          setMatchData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load match details:", err);
        setError("Failed to load match details.");
        setLoading(false);
      }
    );

    setHistoryLoading(true);
    const unsubHistory = onSnapshot(
      collection(db, "communities", activeCommunityId, "matches"),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== "latest") {
            list.push({ id: docSnap.id, ...docSnap.data() });
          }
        });
        list.sort((a, b) => {
          const timeA = a.finishedAt || a.generatedAt || "";
          const timeB = b.finishedAt || b.generatedAt || "";
          return timeB.localeCompare(timeA);
        });
        setHistoryMatches(list);
        setHistoryLoading(false);
      },
      (err) => {
        console.error("Failed to load match history:", err);
        setHistoryLoading(false);
      }
    );

    return () => {
      unsubMatch();
      unsubHistory();
    };
  }, [activeCommunityId]);

  return {
    matchData,
    loading,
    error,
    historyMatches,
    historyLoading,
  };
}
