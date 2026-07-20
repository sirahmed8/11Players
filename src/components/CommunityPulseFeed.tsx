"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCommunity } from "@/contexts/CommunityContext";
import { usePlayers } from "@/contexts/PlayersContext";
import { useLocale } from "@/components/ThemeProvider";
import { motion } from "framer-motion";
import { Trophy, Star, Activity, Award, Flame, Users, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import { calculateRealisticOverall } from "@/lib/overallCalculator";
import { getPlayerOverall } from "@/lib/playerUtils";

export default function CommunityPulseFeed() {
  const { activeCommunityId } = useCommunity();
  const { players, loading: playersLoading } = usePlayers();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    if (!activeCommunityId) {
      setLoadingMatches(false);
      return;
    }

    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const matchesRef = collection(db, "communities", activeCommunityId, "matches");
        const q = query(matchesRef, orderBy("date", "desc"), limit(10));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentMatches(fetched);
      } catch (err) {
        console.error("Failed to load community pulse matches:", err);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [activeCommunityId]);

  // Compute live statistics from community players
  const statsSummary = React.useMemo(() => {
    if (!players.length) return { totalPlayers: 0, totalMatches: 0, avgOvr: 0, mvpLeaders: [], peerStars: [] };

    let totalOvr = 0;
    let totalMatchesPlayed = 0;
    const mvpList: { uid: string; name: string; mvpCount: number; photo: string }[] = [];
    const peerList: { uid: string; name: string; peerAvg: number; peerCount: number; photo: string }[] = [];

    players.forEach((p) => {
      const ovr = getPlayerOverall(p);
      totalOvr += ovr;

      const played = p.stats?.matchesPlayed || 0;
      totalMatchesPlayed += played;

      const mvps = p.stats?.mvp || 0;
      const photo = p.photoUrl || (p as any).photoURL || p.googlePic || "";
      if (mvps > 0) {
        mvpList.push({ uid: p.uid, name: p.cardName || p.fullName, mvpCount: mvps, photo });
      }

      if (p.peerRatingAvg && p.peerRatingAvg >= 7.0 && (p.peerRatingCount || 0) >= 1) {
        peerList.push({ uid: p.uid, name: p.cardName || p.fullName, peerAvg: p.peerRatingAvg, peerCount: p.peerRatingCount || 1, photo });
      }
    });

    mvpList.sort((a, b) => b.mvpCount - a.mvpCount);
    peerList.sort((a, b) => b.peerAvg - a.peerAvg);

    return {
      totalPlayers: players.length,
      // Since 2 teams play per match, approximate unique matches if not count directly or show total matches played
      totalMatches: Math.ceil(totalMatchesPlayed / 14) || recentMatches.length,
      avgOvr: Math.round(totalOvr / players.length),
      mvpLeaders: mvpList.slice(0, 3),
      peerStars: peerList.slice(0, 4)
    };
  }, [players, recentMatches]);

  if (playersLoading || loadingMatches) {
    return <SiteSkeletonLoader variant="cards" />;
  }

  return (
    <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
      {/* 1. Live Community Summary Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900/90 dark:to-slate-800/90 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? "إجمالي اللاعبين" : "Total Players"}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{statsSummary.totalPlayers}</div>
          <div className="text-[11px] text-emerald-400/90 font-medium mt-1">
            {isAr ? "أعضاء مسجلون في المجتمع" : "Registered roster members"}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900/90 dark:to-slate-800/90 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? "متوسط التقييم العام" : "Community OVR Avg"}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{statsSummary.avgOvr}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            {isAr ? "مستوى التنافس العام" : "Overall skill average"}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900/90 dark:to-slate-800/90 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? "المباريات المكتملة" : "Matches Recorded"}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{recentMatches.length}</div>
          <div className="text-[11px] text-blue-400/90 font-medium mt-1">
            {isAr ? "نشاط المواجهات الأخير" : "Recent matches feed"}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900/90 dark:to-slate-800/90 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? "متصدر الـ MVP" : "MVP Leader"}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white truncate">
            {statsSummary.mvpLeaders[0]?.name || (isAr ? "لا يوجد بعد" : "None yet")}
          </div>
          <div className="text-[11px] text-purple-400/90 font-medium mt-1">
            {statsSummary.mvpLeaders[0] ? (isAr ? `${statsSummary.mvpLeaders[0].mvpCount} ألقاب رجل المباراة` : `${statsSummary.mvpLeaders[0].mvpCount} MVP Titles`) : (isAr ? "في انتظار المباراة القادمة" : "Awaiting next match")}
          </div>
        </motion.div>
      </div>

      {/* 2. Top Peer-Rated & Recognition Stars */}
      {statsSummary.peerStars.length > 0 && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? "نجوم تقدير الزملاء (Peer Recognition)" : "Peer Recognition Stars"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? "اللاعبون الأعلى تقييماً واحتراماً من قبل زملائهم في المجتمع" : "Highest rated and most respected players by their community teammates"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsSummary.peerStars.map((star, idx) => (
              <Link
                key={star.uid}
                href={`/profile?uid=${star.uid}`}
                className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-amber-500/50 transition-all flex items-center gap-3"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                  {star.photo ? (
                    <Image src={star.photo} alt={star.name} width={48} height={48} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                      {star.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                    #{idx + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                    {star.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-black text-amber-500">⭐ {star.peerAvg.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400">({star.peerCount} {isAr ? "أصوات" : "votes"})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. Recent Matches & Activity Feed */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? "سجل نشاط المباريات والمواجهات" : "Recent Matches & Activity Feed"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? "آخر نتائج المباريات، التقييمات المسجلة وأبطال رجل المباراة (MVP)" : "Latest match results, recorded stats, and MVP celebrations"}
              </p>
            </div>
          </div>
        </div>

        {recentMatches.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Award className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {isAr ? "لا توجد مباريات مسجلة حالياً" : "No match activities recorded yet"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {isAr ? "عندما تنتهي المباريات ويتم تسجيل الإحصاءات والتقييمات، ستظهر هنا كنبض مباشر للمجتمع." : "When matches conclude and stats are recorded, they will appear right here as a live community pulse."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMatches.map((m) => {
              const dateStr = m.date || m.finishedAt || m.createdAt;
              const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
              const hasRecordedStats = !!m.recordedStats || m.status === "finished";

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 font-black text-lg">
                      ⚽
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          {m.title || (isAr ? `مباراة في مجتمعك` : `Community Match`)}
                        </span>
                        {hasRecordedStats && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                            {isAr ? "مكتملة ومسجلة" : "Finished & Recorded"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>🗓️ {formattedDate}</span>
                        {m.location && <span>• 📍 {m.location}</span>}
                      </p>
                    </div>
                  </div>

                  {/* MVP Badge or Status */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {m.recordedStats && Object.entries(m.recordedStats).map(([uid, st]: any) => {
                      if (st.mvp) {
                        const mvpPlayer = players.find(p => p.uid === uid);
                        const name = mvpPlayer ? (mvpPlayer.cardName || mvpPlayer.fullName) : (isAr ? "بطل المباراة" : "Match MVP");
                        return (
                          <div key={uid} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
                            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>{isAr ? `رجل المباراة: ${name}` : `MVP: ${name}`}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
