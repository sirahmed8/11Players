"use client";

import React from "react";
import Image from "next/image";
import { usePlayers } from "@/contexts/PlayersContext";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ui/ThemeProvider";
import { User } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { getPlayerOverall } from "@/lib/playerUtils";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import FormIcon from "@/components/ui/FormIcon";
import { RefreshCw, Trophy, Target, Zap, Award, Medal, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  icon?: React.ReactNode;
}

function StatTable({ tableId, title, data, statKey, isOverall = false, isGA = false, isBallon = false, expandedTables, onToggle, isAr, getOverall, currentUserUid, icon }: StatTableProps) {
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
    const player = p;

    return (
      <div 
        key={p.uid}
        className={`flex items-center justify-between p-4 transition-all duration-200 ${
          isCurrentUser
            ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white dark:from-slate-600 dark:to-slate-700 relative z-10 font-semibold shadow-md"
            : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`font-black w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            idx === 0 ? 'bg-amber-400 text-white border-amber-500 shadow-md' : 
            idx === 1 ? 'bg-slate-300 text-slate-700 border-slate-400 shadow-sm' : 
            idx === 2 ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 
            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
          }`}>
            {idx + 1}
          </div>
          <Link href={`/profile?uid=${p.uid}`} className="flex items-center gap-3 group">
            <PlayerRowAvatar photoUrl={photo} cardName={p.cardName} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ${isCurrentUser ? 'text-white font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>{p.cardName}</span>
                {player.form && (
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-1">
                    <FormIcon form={player.form} className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {p.primaryPosition}
                </span>
                {p.playStyle && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {p.playStyle.replace(/_/g, ' ').trim()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
        <div className={`font-black text-2xl ${isCurrentUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
          {scoreVal}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 flex flex-col h-fit self-start">
      <div className="bg-slate-100 dark:bg-slate-900 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">{icon}</div>}
          <h3 className="font-black text-lg text-emerald-600 dark:text-emerald-400">{title}</h3>
        </div>
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
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="expanded-rows"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50 border-t border-slate-100 dark:border-slate-700/50 will-change-[height,opacity]"
                  >
                    {remainingPlayers.map((p, idx) => renderRow(p, idx + 3))}
                  </motion.div>
                )}
              </AnimatePresence>
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

const POS_GROUPS = [
  { id: 'ALL', labelEn: 'All Positions', labelAr: 'كل المراكز', positions: [] as string[] },
  { id: 'CF_SS', labelEn: 'Strikers (CF/SS)', labelAr: 'الهجوم (CF/SS)', positions: ['CF', 'SS'] },
  { id: 'LWF_RWF', labelEn: 'Wingers (LWF/RWF)', labelAr: 'الأجنحة (LWF/RWF)', positions: ['LWF', 'RWF'] },
  { id: 'AMF_CMF', labelEn: 'Playmakers (AMF/CMF/RMF/LMF)', labelAr: 'الوسط (AMF/CMF/RMF/LMF)', positions: ['AMF', 'CMF', 'RMF', 'LMF'] },
  { id: 'DMF', labelEn: 'Defensive Mid (DMF)', labelAr: 'الارتكاز (DMF)', positions: ['DMF'] },
  { id: 'CB_RB_LB', labelEn: 'Defenders (CB/RB/LB)', labelAr: 'الدفاع (CB/RB/LB)', positions: ['CB', 'RB', 'LB'] },
  { id: 'GK', labelEn: 'Goalkeepers (GK)', labelAr: 'حراس المرمى (GK)', positions: ['GK'] },
];

export default function StatsPage() {
  const { players, loading, refreshPlayers } = usePlayers();
  const { locale } = useLocale();
  const { user } = useAuth();
  const isAr = locale === "ar";
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedPosGroup, setSelectedPosGroup] = React.useState<string>('ALL');
  const [isPosDropdownOpen, setIsPosDropdownOpen] = React.useState(false);

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
      toast.success(isAr ? "تمت مزامنة وتحديث إحصائيات جميع اللاعبين بنجاح!" : "All player stats refreshed & synced successfully!");
    } catch (err) {
      toast.error(isAr ? "فشلت المزامنة، يرجى المحاولة مرة أخرى." : "Failed to sync stats. Please try again.");
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const getOverall = React.useCallback((p: PlayerProfile) => {
    return getPlayerOverall(p);
  }, []);

  const filteredPlayers = React.useMemo(() => {
    if (selectedPosGroup === 'ALL') return players;
    const group = POS_GROUPS.find(g => g.id === selectedPosGroup);
    if (!group || !group.positions.length) return players;
    return players.filter(p => group.positions.includes(p.primaryPosition));
  }, [players, selectedPosGroup]);

  const topScorers = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0)).slice(0, 10);
  }, [filteredPlayers]);

  const topAssisters = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0)).slice(0, 10);
  }, [filteredPlayers]);

  const topGA = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => ((b.stats?.goals || 0) + (b.stats?.assists || 0)) - ((a.stats?.goals || 0) + (a.stats?.assists || 0))).slice(0, 10);
  }, [filteredPlayers]);

  const topMVPs = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0)).slice(0, 10);
  }, [filteredPlayers]);

  const ballonDOr = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      // Ballon d'Or formula: (Goals * 2) + (Assists * 1) + (MVPs * 5)
      const aScore = ((a.stats?.goals || 0) * 2) + ((a.stats?.assists || 0) * 1) + ((a.stats?.mvp || 0) * 5);
      const bScore = ((b.stats?.goals || 0) * 2) + ((b.stats?.assists || 0) * 1) + ((b.stats?.mvp || 0) * 5);
      return bScore - aScore;
    }).slice(0, 10);
  }, [filteredPlayers]);

  const highestRated = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => getOverall(b) - getOverall(a)).slice(0, 10);
  }, [filteredPlayers, getOverall]);

  return (
    <ProtectedRoute requireCommunity>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-12" dir={isAr ? 'rtl' : 'ltr'}>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h2 className="text-3xl md:text-4xl font-black">{isAr ? "قائمة المتصدرين العالمية" : "Global Leaderboards"}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isAr ? "تحديث حي ومباشر" : "Live Updates"}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm" dir={isAr ? "rtl" : "ltr"}>{isAr ? "الأفضل بين الأفضل في 11Players حسب المراكز والأداء." : "The best of the best in 11Players ranked by position and match impact."}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? (isAr ? "جارٍ المزامنة..." : "Syncing...") : (isAr ? "تحديث ومزامنة الإحصائيات" : "Refresh & Sync Stats")}</span>
            </button>
          </div>

          {/* Position Leaderboard Filter Dropdown */}
          <div className="mb-8 flex justify-start">
            <div className="relative">
              <button 
                onClick={() => setIsPosDropdownOpen(!isPosDropdownOpen)}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm hover:border-emerald-500 transition-colors"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "تصفية حسب المركز:" : "Filter by Position:"}{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {(() => {
                      const grp = POS_GROUPS.find(g => g.id === selectedPosGroup);
                      return grp ? (isAr ? grp.labelAr : grp.labelEn) : (isAr ? "كل المراكز" : "All Positions");
                    })()}
                  </span>
                </span>
                <motion.div animate={{ rotate: isPosDropdownOpen ? 180 : 0 }}>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isPosDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-30 top-full mt-2 w-full sm:w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    {POS_GROUPS.map((grp) => {
                      const count = grp.id === 'ALL' 
                        ? players.length 
                        : players.filter(p => grp.positions.includes(p.primaryPosition)).length;
                      const isActive = selectedPosGroup === grp.id;
                      return (
                        <button
                          key={grp.id}
                          onClick={() => { setSelectedPosGroup(grp.id); setIsPosDropdownOpen(false); }}
                          className={`flex items-center justify-between w-full text-start px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold transition-colors ${
                            isActive ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span>{isAr ? grp.labelAr : grp.labelEn}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {loading ? (
            <SiteSkeletonLoader variant="table" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 lg:col-span-3 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <StatTable tableId="ballon" title={isAr ? "ترتيب الكرة الذهبية" : "Ballon d'Or Ranking"} data={ballonDOr} statKey="ballon" isBallon={true} expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} icon={<Trophy className="w-5 h-5 text-amber-500" />} />
                  <StatTable tableId="overall" title={isAr ? "أعلى اللاعبين تقييماً" : "Highest Rated (OVR)"} data={highestRated} statKey="overall" isOverall={true} expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} icon={<Medal className="w-5 h-5 text-emerald-500" />} />
                </div>
              </div>
              <StatTable tableId="goals" title={isAr ? "الهدافين" : "Top Scorers"} data={topScorers} statKey="goals" expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} icon={<Target className="w-5 h-5 text-red-500" />} />
              <StatTable tableId="assists" title={isAr ? "صناع اللعب" : "Top Assisters"} data={topAssisters} statKey="assists" expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} icon={<Zap className="w-5 h-5 text-blue-500" />} />
              <StatTable tableId="ga" title={isAr ? "المساهمات (أهداف + تمريرات)" : "Top G/A"} data={topGA} statKey="ga" isGA={true} expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} icon={<Award className="w-5 h-5 text-orange-500" />} />
              <StatTable tableId="mvp" title={isAr ? "رجل المباراة (MVP)" : "Most MVPs"} data={topMVPs} statKey="mvp" expandedTables={expandedTables} onToggle={handleToggle} isAr={isAr} getOverall={getOverall} currentUserUid={user?.uid} icon={<Medal className="w-5 h-5 text-purple-500" />} />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
