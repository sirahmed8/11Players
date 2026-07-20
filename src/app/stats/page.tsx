"use client";

import React from "react";
import Image from "next/image";
import { usePlayers } from "@/contexts/PlayersContext";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ThemeProvider";
import { User } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { calculateRealisticOverall } from "@/lib/overallCalculator";
import { getPlayerOverall } from "@/lib/playerUtils";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";

function PlayerRowAvatar({ photoUrl, cardName }: { photoUrl?: string; cardName: string }) {
  const [imgError, setImgError] = React.useState(false);
  return (
    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0 flex items-center justify-center">
      {photoUrl && !imgError ? (
        <Image 
          src={photoUrl} 
          alt={cardName} 
          className="w-full h-full object-cover" 
          width={40} 
          height={40} 
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      )}
    </div>
  );
}

interface StatTableProps {
  tableId: string;
  title: string;
  data: PlayerProfile[];
  statKey: string;
  isOverall?: boolean;
  isGA?: boolean;
  isBallon?: boolean;
  expandedTables: Record<string, boolean>;
  onToggle: (id: string) => void;
  isAr: boolean;
  getOverall: (p: PlayerProfile) => number;
  currentUserUid?: string;
}

function StatTable({ tableId, title, data, statKey, isOverall = false, isGA = false, isBallon = false, expandedTables, onToggle, isAr, getOverall, currentUserUid }: StatTableProps) {
  const isExpanded = !!expandedTables[tableId];
  
  // Filter valid players with > 0 stats
  const validPlayers = data.filter((p) => {
    if (isOverall) return getOverall(p) > 0;
    if (isGA) return ((p.stats?.goals || 0) + (p.stats?.assists || 0)) > 0;
    if (isBallon) return (((p.stats?.goals || 0) * 2) + ((p.stats?.assists || 0) * 1) + ((p.stats?.mvp || 0) * 5)) > 0;
    return ((p.stats as any)?.[statKey] || 0) > 0;
  });

  const topThree = validPlayers.slice(0, 3);
  const remainingPlayers = validPlayers.slice(3);
  const hasAnyStats = validPlayers.length > 0;
  const remainingCount = remainingPlayers.length;

  const renderRow = (p: PlayerProfile, idx: number) => {
    const photo = p.photoUrl || p.googlePic || (p as any).photoURL || (p as any).userPic || '';
    const scoreVal = isOverall 
      ? getOverall(p) 
      : isGA 
        ? (p.stats?.goals || 0) + (p.stats?.assists || 0)
        : isBallon
          ? ((p.stats?.goals || 0) * 2) + ((p.stats?.assists || 0) * 1) + ((p.stats?.mvp || 0) * 5)
          : (p.stats as any)?.[statKey] || 0;

    const isCurrentUser = Boolean(currentUserUid && p.uid === currentUserUid);

    return (
      <div 
        key={p.uid}
        className={`flex items-center justify-between p-4 transition-colors ${
          isCurrentUser
            ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent dark:from-emerald-500/25 dark:via-emerald-500/10 dark:to-transparent border-l-4 border-emerald-500 relative z-10 font-bold"
            : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
        }`}
      >
        <div className="flex items-center gap-4">
          <span className={`font-black w-6 text-center ${idx === 0 ? 'text-amber-500 text-lg' : idx === 1 ? 'text-slate-400 text-base' : idx === 2 ? 'text-amber-700 text-base' : 'text-slate-500 text-sm'}`}>{idx + 1}</span>
          <Link href={`/profile?uid=${p.uid}`} className="flex items-center gap-3 group">
            <PlayerRowAvatar photoUrl={photo} cardName={p.cardName} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold group-hover:text-emerald-500 transition-colors ${isCurrentUser ? 'text-emerald-700 dark:text-emerald-300 font-black' : ''}`}>{p.cardName}</span>
                {isCurrentUser && (
                  <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                    {isAr ? "أنت" : "YOU"}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded inline-block mt-0.5 font-semibold">
                {p.primaryPosition}
              </div>
            </div>
          </Link>
        </div>
        <div className={`font-black text-xl ${isCurrentUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {scoreVal}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 flex flex-col h-fit self-start">
      <div className="bg-slate-100 dark:bg-slate-900 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-black text-lg text-emerald-600 dark:text-emerald-400">{title}</h3>
        {hasAnyStats && (
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {validPlayers.length} {isAr ? "لاعب" : "Players"}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1">
        {data.length === 0 || !hasAnyStats ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3 opacity-50">🫙</span>
            <p className="text-slate-500 font-semibold">{isAr ? "لا توجد إحصائيات بعد" : "No stats yet"}</p>
          </div>
        ) : (
          <>
            {topThree.map((p, idx) => renderRow(p, idx))}
            {remainingPlayers.length > 0 && (
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 border-t border-slate-100 dark:border-slate-700/50">
                  {remainingPlayers.map((p, idx) => renderRow(p, idx + 3))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {data.length > 3 && hasAnyStats && remainingCount > 0 && (
        <button 
          onClick={() => onToggle(tableId)}
          className="w-full py-3.5 px-6 bg-slate-100/80 hover:bg-emerald-500 hover:text-white dark:bg-slate-800/80 dark:hover:bg-emerald-500 dark:hover:text-white text-slate-700 dark:text-slate-300 text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 group border-t border-slate-200/60 dark:border-slate-700/60"
        >
          <span>{isExpanded ? (isAr ? "إخفاء القائمة" : "Collapse List") : (isAr ? `عرض باقي القائمة (${remainingCount})` : `Expand List (${remainingCount})`)}</span>
          <span className={`transform transition-transform duration-300 text-xs ${isExpanded ? "rotate-180" : ""}`}>▼</span>
        </button>
      )}
    </div>
  );
}

export default function StatsPage() {
  const { players, loading, refreshPlayers } = usePlayers();
  const { locale } = useLocale();
  const { user } = useAuth();
  const isAr = locale === "ar";
  const [refreshing, setRefreshing] = React.useState(false);

  // All tables expanded by default — avoids the "loads 2 then the rest" perception on mobile
  const [expandedTables, setExpandedTables] = React.useState<Record<string, boolean>>({
    ballon: true,
    overall: true,
    goals: true,
    assists: true,
    ga: true,
    mvp: true,
  });

  const handleToggle = (id: string) => {
    setExpandedTables((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleManualRefresh = async () => {
    if (refreshing || !refreshPlayers) return;
    setRefreshing(true);
    try {
      await refreshPlayers();
      toast.success(isAr ? "تمت مزامنة وتحديث إحصائيات جميع اللاعبين بنجاح! 🔄" : "All player stats refreshed & synced successfully! 🔄");
    } catch (err) {
      toast.error(isAr ? "فشلت المزامنة، يرجى المحاولة مرة أخرى." : "Failed to sync stats. Please try again.");
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const getOverall = React.useCallback((p: PlayerProfile) => {
    return getPlayerOverall(p);
  }, []);

  const topScorers = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0)).slice(0, 10);
  }, [players]);

  const topAssisters = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0)).slice(0, 10);
  }, [players]);

  const topGA = React.useMemo(() => {
    return [...players].sort((a, b) => ((b.stats?.goals || 0) + (b.stats?.assists || 0)) - ((a.stats?.goals || 0) + (a.stats?.assists || 0))).slice(0, 10);
  }, [players]);

  const topMVPs = React.useMemo(() => {
    return [...players].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0)).slice(0, 10);
  }, [players]);

  const ballonDOr = React.useMemo(() => {
    return [...players].sort((a, b) => {
      // Ballon d'Or formula: (Goals * 2) + (Assists * 1) + (MVPs * 5)
      const aScore = ((a.stats?.goals || 0) * 2) + ((a.stats?.assists || 0) * 1) + ((a.stats?.mvp || 0) * 5);
      const bScore = ((b.stats?.goals || 0) * 2) + ((b.stats?.assists || 0) * 1) + ((b.stats?.mvp || 0) * 5);
      return bScore - aScore;
    }).slice(0, 10);
  }, [players]);

  const highestRated = React.useMemo(() => {
    return [...players].sort((a, b) => getOverall(b) - getOverall(a)).slice(0, 10);
  }, [players, getOverall]);

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12" dir={isAr ? 'rtl' : 'ltr'}>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h2 className="text-3xl md:text-4xl font-black">{isAr ? "قائمة المتصدرين العالمية" : "Global Leaderboards"}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isAr ? "تحديث حي ومباشر" : "Live Updates"}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm" dir={isAr ? "rtl" : "ltr"}>{isAr ? "الأفضل بين الأفضل في 11Players يتم تحديثهم تلقائياً." : "The best of the best in 11Players updated in real-time."}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              <span className={`text-base ${refreshing ? "animate-spin" : ""}`}>🔄</span>
              <span>{refreshing ? (isAr ? "جارٍ المزامنة..." : "Syncing...") : (isAr ? "تحديث ومزامنة الإحصائيات" : "Refresh & Sync Stats")}</span>
            </button>
          </div>

          {loading ? (
            <SiteSkeletonLoader variant="table" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 lg:col-span-3 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <StatTable tableId="ballon" title={isAr ? "🏆 ترتيب الكرة الذهبية" : "🏆 Ballon d'Or Ranking"} data={ballonDOr} statKey="ballon" isBallon={true} expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} />
                  <StatTable tableId="overall" title={isAr ? "🌟 أعلى اللاعبين تقييماً" : "🌟 Highest Rated (OVR)"} data={highestRated} statKey="overall" isOverall={true} expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} />
                </div>
              </div>
              <StatTable tableId="goals" title={isAr ? "🎯 الهدافين" : "🎯 Top Scorers"} data={topScorers} statKey="goals" expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} />
              <StatTable tableId="assists" title={isAr ? "👟 صناع اللعب" : "👟 Top Assisters"} data={topAssisters} statKey="assists" expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} />
              <StatTable tableId="ga" title={isAr ? "🔥 المساهمات (أهداف + تمريرات)" : "🔥 Top G/A"} data={topGA} statKey="ga" isGA={true} expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} />
              <StatTable tableId="mvp" title={isAr ? "🏅 رجل المباراة (MVP)" : "🏅 Most MVPs"} data={topMVPs} statKey="mvp" expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
