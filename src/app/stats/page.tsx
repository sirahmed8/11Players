"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayers } from "@/contexts/PlayersContext";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PlayerProfile } from "@/types";
import { useLocale } from "@/components/ui/ThemeProvider";
import { User, RefreshCw, Trophy, Target, Zap, Award, Star, Crown, Shield, ChevronUp, Flame } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPlayerOverall } from "@/lib/playerUtils";
import SiteSkeletonLoader from "@/components/ui/SiteSkeletonLoader";
import FormIcon from "@/components/ui/FormIcon";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainerVariants, staggerItemVariants, microSpringProps, microSpringRowProps } from "@/lib/animations";
import LeagueTiersWidget from "@/components/leaderboard/LeagueTiersWidget";

// ─── Avatar ─────────────────────────────────────────────────────────────────
function PlayerAvatar({
  photoUrl,
  cardName,
  size = 40,
  className = "",
}: {
  photoUrl?: string;
  cardName: string;
  size?: number;
  className?: string;
}) {
  const [err, setErr] = React.useState(false);
  return (
    <div
      className={`rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {photoUrl && !err ? (
        <Image
          src={photoUrl}
          alt={cardName}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          referrerPolicy="no-referrer"
          onError={() => setErr(true)}
        />
      ) : (
        <User className="w-1/2 h-1/2 text-slate-400" />
      )}
    </div>
  );
}

// ─── Podium Card ─────────────────────────────────────────────────────────────
const PODIUM_CONFIG = [
  {
    rank: 1,
    label: "🥇",
    height: "h-32",
    gradient: "from-amber-400 via-yellow-300 to-amber-500",
    border: "border-amber-400",
    shadow: "shadow-amber-400/50",
    glow: "from-amber-400/30 to-yellow-300/10",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    ring: "ring-amber-400",
    order: "order-2",
    avatarRing: "ring-4 ring-amber-400",
  },
  {
    rank: 2,
    label: "🥈",
    height: "h-24",
    gradient: "from-slate-300 via-slate-200 to-slate-400",
    border: "border-slate-300",
    shadow: "shadow-slate-400/40",
    glow: "from-slate-300/20 to-slate-200/10",
    text: "text-slate-500 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-800/30",
    ring: "ring-slate-300",
    order: "order-1",
    avatarRing: "ring-4 ring-slate-300",
  },
  {
    rank: 3,
    label: "🥉",
    height: "h-20",
    gradient: "from-amber-700 via-orange-600 to-amber-800",
    border: "border-amber-700",
    shadow: "shadow-amber-700/40",
    glow: "from-amber-700/20 to-orange-600/10",
    text: "text-amber-700 dark:text-amber-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    ring: "ring-amber-700",
    order: "order-3",
    avatarRing: "ring-4 ring-amber-600",
  },
];

function PodiumCard({
  player,
  rank,
  value,
  label,
  isAr,
  delay,
}: {
  player: PlayerProfile | null;
  rank: 1 | 2 | 3;
  value: number;
  label: string;
  isAr: boolean;
  delay: number;
}) {
  const cfg = PODIUM_CONFIG[rank - 1];
  const photo = player
    ? player.photoUrl || player.googlePic || (player as any).photoURL || ""
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center gap-3 ${cfg.order}`}
    >
      {/* Player card */}
      <div
        className={`relative px-4 py-4 rounded-2xl border ${cfg.border} ${cfg.bg} flex flex-col items-center gap-2 shadow-xl ${cfg.shadow} w-full`}
      >
        {/* Crown for #1 */}
        {rank === 1 && (
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-5 text-2xl"
          >
            👑
          </motion.div>
        )}

        <div className={`relative ${cfg.avatarRing} rounded-full`}>
          <PlayerAvatar
            photoUrl={photo}
            cardName={player?.cardName || "?"}
            size={rank === 1 ? 72 : 56}
          />
          <span className="absolute -bottom-1 -right-1 text-base">{cfg.label}</span>
        </div>

        {player ? (
          <Link
            href={`/profile?uid=${player.uid}`}
            className="flex flex-col items-center gap-0.5 text-center"
          >
            <span
              className={`font-black text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${rank === 1 ? "text-base" : "text-sm"} leading-tight`}
            >
              {player.cardName}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {player.primaryPosition}
            </span>
          </Link>
        ) : (
          <span className="text-sm text-slate-400 font-bold">—</span>
        )}

        <div className={`font-black text-2xl ${cfg.text}`}>{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>

      {/* Podium bar */}
      <div
        className={`w-full ${cfg.height} rounded-t-xl bg-gradient-to-b ${cfg.gradient} flex items-start justify-center pt-2 shadow-lg font-black text-white text-xl opacity-90`}
      >
        {rank}
      </div>
    </motion.div>
  );
}

// ─── Award Shelf Card ─────────────────────────────────────────────────────────
function AwardCard({
  icon,
  title,
  player,
  value,
  subtitle,
  delay,
  isAr,
}: {
  icon: React.ReactNode;
  title: string;
  player: PlayerProfile | null;
  value: string | number;
  subtitle: string;
  delay: number;
  isAr: boolean;
}) {
  const photo = player
    ? player.photoUrl || player.googlePic || (player as any).photoURL || ""
    : "";

  return (
    <motion.div
      variants={staggerItemVariants}
      whileHover={microSpringProps.whileHover}
      whileTap={microSpringProps.whileTap}
      transition={microSpringProps.transition}
      className="relative backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col gap-3 overflow-hidden text-white cursor-pointer"
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">{icon}</div>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {subtitle}
        </span>
      </div>
      <div className="relative z-10">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{title}</div>
        {player ? (
          <Link href={`/profile?uid=${player.uid}`} className="flex items-center gap-2 group">
            <PlayerAvatar photoUrl={photo} cardName={player.cardName} size={32} />
            <div>
              <div className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm">
                {player.cardName}
              </div>
              <div className="text-xs text-slate-400">{player.primaryPosition}</div>
            </div>
            <div className="ms-auto font-black text-xl text-emerald-600 dark:text-emerald-400">
              {value}
            </div>
          </Link>
        ) : (
          <div className="text-sm text-slate-400 font-bold">{isAr ? "لا يوجد" : "None yet"}</div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Leaderboard Row ─────────────────────────────────────────────────────────
function LeaderboardRow({
  player,
  rank,
  value,
  isCurrentUser,
  isAr,
}: {
  player: PlayerProfile;
  rank: number;
  value: number;
  isCurrentUser: boolean;
  isAr: boolean;
}) {
  const photo =
    player.photoUrl || player.googlePic || (player as any).photoURL || "";

  const rankBadge =
    rank === 1
      ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white border-amber-500"
      : rank === 2
      ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white border-slate-400"
      : rank === 3
      ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white border-amber-700"
      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  return (
    <motion.div
      whileHover={microSpringRowProps.whileHover}
      whileTap={microSpringRowProps.whileTap}
      transition={microSpringRowProps.transition}
      className={`flex items-center justify-between px-4 py-3 transition-colors duration-150 rounded-xl cursor-pointer ${
        isCurrentUser
          ? "bg-emerald-950/40 border-s-2 border-emerald-500"
          : "hover:bg-slate-800/60"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Rank badge */}
        <div
          className={`font-black w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm flex-shrink-0 ${rankBadge}`}
        >
          {rank}
        </div>

        {/* Avatar + info */}
        <Link href={`/profile?uid=${player.uid}`} className="flex items-center gap-2.5 group">
          <div className="relative">
            <PlayerAvatar photoUrl={photo} cardName={player.cardName} size={38} />
            {isCurrentUser && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            )}
          </div>
          <div>
            <div
              className={`font-bold text-sm group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 ${
                isCurrentUser ? "text-emerald-400" : "text-white"
              }`}
            >
              {player.cardName}
              {isCurrentUser && (
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-500 text-slate-950 rounded-full uppercase tracking-wide">
                  {isAr ? "أنت" : "You"}
                </span>
              )}
              {player.form && (
                <div className="bg-slate-800 rounded-full p-0.5 border border-slate-700">
                  <FormIcon form={player.form} className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              {player.primaryPosition}
              {player.playStyle && (
                <span className="ms-1 opacity-60">· {player.playStyle.replace(/_/g, " ").trim()}</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Value */}
      <div
        className={`font-black text-xl tabular-nums ${
          isCurrentUser
            ? "text-emerald-400"
            : rank <= 3
            ? "text-amber-400"
            : "text-slate-300"
        }`}
      >
        {value}
      </div>
    </motion.div>
  );
}

// ─── Leaderboard Table ────────────────────────────────────────────────────────
function LeaderboardTable({
  tableId,
  title,
  data,
  statKey,
  isOverall = false,
  isGA = false,
  isBallon = false,
  isAr,
  getOverall,
  currentUserUid,
  icon,
  accentColor = "emerald",
}: {
  tableId: string;
  title: string;
  data: PlayerProfile[];
  statKey: string;
  isOverall?: boolean;
  isGA?: boolean;
  isBallon?: boolean;
  isAr: boolean;
  getOverall: (p: PlayerProfile) => number;
  currentUserUid?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const getValue = (p: PlayerProfile): number => {
    if (isOverall) return getOverall(p);
    if (isGA) return (p.stats?.goals || 0) + (p.stats?.assists || 0);
    if (isBallon)
      return (
        (p.stats?.goals || 0) * 2 +
        (p.stats?.assists || 0) * 1 +
        (p.stats?.mvp || 0) * 5
      );
    return (p.stats as any)?.[statKey] || 0;
  };

  const valid = data.filter((p) => getValue(p) > 0);
  const top3 = valid.slice(0, 3);
  const rest = valid.slice(3);
  const hasStats = valid.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col text-white"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              {icon}
            </div>
          )}
          <h3 className="font-black text-base text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        {hasStats && (
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {valid.length}
          </span>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/40 flex-1">
        {!hasStats ? (
          <div className="py-12 flex flex-col items-center text-center gap-2 text-slate-400">
            <span className="text-4xl opacity-40">🫙</span>
            <p className="font-bold text-sm">{isAr ? "لا توجد إحصائيات بعد" : "No stats yet"}</p>
          </div>
        ) : (
          <>
            {top3.map((p, i) => (
              <LeaderboardRow
                key={p.uid}
                player={p}
                rank={i + 1}
                value={getValue(p)}
                isCurrentUser={p.uid === currentUserUid}
                isAr={isAr}
              />
            ))}

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                expanded && rest.length > 0
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40">
                {rest.map((p, i) => (
                  <LeaderboardRow
                    key={p.uid}
                    player={p}
                    rank={i + 4}
                    value={getValue(p)}
                    isCurrentUser={p.uid === currentUserUid}
                    isAr={isAr}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Expand/Collapse */}
      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full py-3 px-5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronUp className="w-4 h-4" />
          </motion.div>
          {expanded
            ? isAr
              ? "إخفاء القائمة"
              : "Collapse"
            : isAr
            ? `عرض باقي القائمة (${rest.length})`
            : `Show more (${rest.length})`}
        </button>
      )}
    </motion.div>
  );
}

// ─── Position Filter Tabs ─────────────────────────────────────────────────────
const POS_GROUPS = [
  { id: "ALL", labelEn: "All", labelAr: "الكل" },
  { id: "CF_SS", labelEn: "Strikers", labelAr: "الهجوم", positions: ["CF", "SS"] },
  { id: "LWF_RWF", labelEn: "Wingers", labelAr: "الأجنحة", positions: ["LWF", "RWF"] },
  { id: "AMF_CMF", labelEn: "Midfield", labelAr: "الوسط", positions: ["AMF", "CMF", "RMF", "LMF"] },
  { id: "DMF", labelEn: "D.Mid", labelAr: "الارتكاز", positions: ["DMF"] },
  { id: "CB_RB_LB", labelEn: "Defenders", labelAr: "الدفاع", positions: ["CB", "RB", "LB"] },
  { id: "GK", labelEn: "GK", labelAr: "الحراس", positions: ["GK"] },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { players, loading } = usePlayers();
  const { locale } = useLocale();
  const { user } = useAuth();
  const isAr = locale === "ar";
  const [selectedPos, setSelectedPos] = React.useState("ALL");
  const [isPosDropdownOpen, setIsPosDropdownOpen] = React.useState(false);

  const getOverall = React.useCallback((p: PlayerProfile) => getPlayerOverall(p), []);

  const filteredPlayers = React.useMemo(() => {
    const grp = POS_GROUPS.find((g) => g.id === selectedPos);
    if (!grp || !grp.positions?.length) return players;
    return players.filter((p) => grp.positions!.includes(p.primaryPosition));
  }, [players, selectedPos]);

  const sorted = {
    ballon: React.useMemo(
      () =>
        [...filteredPlayers]
          .sort(
            (a, b) =>
              ((b.stats?.goals || 0) * 2 + (b.stats?.assists || 0) + (b.stats?.mvp || 0) * 5) -
              ((a.stats?.goals || 0) * 2 + (a.stats?.assists || 0) + (a.stats?.mvp || 0) * 5)
          )
          .slice(0, 10),
      [filteredPlayers]
    ),
    overall: React.useMemo(
      () =>
        [...filteredPlayers].sort((a, b) => getOverall(b) - getOverall(a)).slice(0, 10),
      [filteredPlayers, getOverall]
    ),
    goals: React.useMemo(
      () =>
        [...filteredPlayers]
          .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
          .slice(0, 10),
      [filteredPlayers]
    ),
    assists: React.useMemo(
      () =>
        [...filteredPlayers]
          .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))
          .slice(0, 10),
      [filteredPlayers]
    ),
    ga: React.useMemo(
      () =>
        [...filteredPlayers]
          .sort(
            (a, b) =>
              (b.stats?.goals || 0) +
              (b.stats?.assists || 0) -
              ((a.stats?.goals || 0) + (a.stats?.assists || 0))
          )
          .slice(0, 10),
      [filteredPlayers]
    ),
    mvp: React.useMemo(
      () =>
        [...filteredPlayers]
          .sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0))
          .slice(0, 10),
      [filteredPlayers]
    ),
    matches: React.useMemo(
      () =>
        [...filteredPlayers]
          .sort((a, b) => (b.stats?.matchesPlayed || 0) - (a.stats?.matchesPlayed || 0))
          .slice(0, 10),
      [filteredPlayers]
    ),
  };

  const top1 = sorted.ballon[0] ?? null;
  const top2 = sorted.ballon[1] ?? null;
  const top3 = sorted.ballon[2] ?? null;

  const ballonScore = (p: PlayerProfile | null) =>
    p
      ? (p.stats?.goals || 0) * 2 +
        (p.stats?.assists || 0) * 1 +
        (p.stats?.mvp || 0) * 5
      : 0;

  // Season summary stats
  const totalGoals = players.reduce((s, p) => s + (p.stats?.goals || 0), 0);
  const totalMatches = players.reduce((s, p) => s + (p.stats?.matchesPlayed || 0), 0) / Math.max(players.length, 1);
  const totalMVPs = players.reduce((s, p) => s + (p.stats?.mvp || 0), 0);

  if (loading) {
    return (
      <ProtectedRoute requireCommunity>
        <SiteSkeletonLoader variant="stats" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireCommunity>
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ── Hero Banner ───────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="relative bg-slate-900/90 border border-slate-800 overflow-hidden rounded-3xl shadow-2xl">
            <div className="relative z-10 px-6 py-8">
              {/* Title + Refresh */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-7 h-7 text-amber-400" />
                    <h1 className="text-3xl md:text-4xl font-black text-white">
                      {isAr ? "قائمة المتصدرين" : "Leaderboards"}
                    </h1>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-black">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      {isAr ? "مباشر" : "Live"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">
                    {isAr
                      ? "أفضل اللاعبين في 11Players مرتبون حسب الأداء والإنجازات"
                      : "The best players in 11Players ranked by performance & achievements"}
                  </p>
                </div>
              </div>

              {/* Season Summary Pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    icon: <Flame className="w-4 h-4 text-orange-400" />,
                    value: players.length,
                    label: isAr ? "لاعب مسجّل" : "Players",
                  },
                  {
                    icon: <Target className="w-4 h-4 text-red-400" />,
                    value: totalGoals,
                    label: isAr ? "هدف هذا الموسم" : "Goals this season",
                  },
                  {
                    icon: <Crown className="w-4 h-4 text-amber-400" />,
                    value: totalMVPs,
                    label: isAr ? "جائزة أفضل لاعب" : "MVP awards",
                  },
                  {
                    icon: <Star className="w-4 h-4 text-emerald-400" />,
                    value: Math.round(totalMatches),
                    label: isAr ? "متوسط مباريات/لاعب" : "Avg matches/player",
                  },
                ].map(({ icon, value, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 bg-white/8 border border-white/12 rounded-2xl px-4 py-2.5"
                  >
                    {icon}
                    <div>
                      <div className="text-white font-black text-lg leading-none">{value}</div>
                      <div className="text-slate-400 text-[10px] font-semibold leading-tight">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
          {/* ── Position Filter Bar (List Button & Glass Tabs) ───────────── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Mobile / Quick Dropdown List Button */}
            <div className="relative z-30">
              <button
                onClick={() => setIsPosDropdownOpen((v) => !v)}
                className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-all font-bold text-sm text-slate-800 dark:text-slate-200 active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium text-xs">
                    {isAr ? "تصفية المراكز:" : "Filter Position:"}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    {(() => {
                      const grp = POS_GROUPS.find((g) => g.id === selectedPos);
                      return grp ? (isAr ? grp.labelAr : grp.labelEn) : (isAr ? "الكل" : "All");
                    })()}
                  </span>
                </div>
                <motion.div animate={{ rotate: isPosDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isPosDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute top-full mt-2 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 divide-y divide-slate-100 dark:divide-slate-800/60"
                  >
                    {POS_GROUPS.map((grp) => {
                      const count =
                        grp.id === "ALL"
                          ? players.length
                          : players.filter((p) =>
                              (grp.positions ?? []).includes(p.primaryPosition)
                            ).length;
                      const active = selectedPos === grp.id;
                      return (
                        <button
                          key={grp.id}
                          onClick={() => {
                            setSelectedPos(grp.id);
                            setIsPosDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
                            active
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            {isAr ? grp.labelAr : grp.labelEn}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              active
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}
                          >
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
            <SiteSkeletonLoader variant="stats" />
          ) : (
            <>
              {/* Competitive Division Tiers — real player counts */}
              <LeagueTiersWidget players={filteredPlayers} isAr={isAr} />

              {/* ── Ballon d'Or Podium ───────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">
                    {isAr ? "الكرة الذهبية 🌟" : "Ballon d'Or 🌟"}
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">
                    {isAr ? "(أهداف ×2 + تمريرات ×1 + MVP ×5)" : "(Goals ×2 + Assists ×1 + MVP ×5)"}
                  </span>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-800 shadow-xl">
                  {sorted.ballon.filter(p => ballonScore(p) > 0).length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <span className="text-5xl block mb-3 opacity-30">🏆</span>
                      <p className="font-bold">{isAr ? "لا توجد إحصائيات بعد" : "No stats yet"}</p>
                      <p className="text-xs mt-1 opacity-60">{isAr ? "ستظهر القائمة بعد تسجيل أهداف أو تمريرات أو جوائز MVP" : "Rankings will appear once goals, assists or MVPs are recorded"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto">
                      <PodiumCard
                        player={ballonScore(top2) > 0 ? top2 : null}
                        rank={2}
                        value={ballonScore(top2)}
                        label={isAr ? "نقطة" : "pts"}
                        isAr={isAr}
                        delay={0.15}
                      />
                      <PodiumCard
                        player={ballonScore(top1) > 0 ? top1 : null}
                        rank={1}
                        value={ballonScore(top1)}
                        label={isAr ? "نقطة" : "pts"}
                        isAr={isAr}
                        delay={0}
                      />
                      <PodiumCard
                        player={ballonScore(top3) > 0 ? top3 : null}
                        rank={3}
                        value={ballonScore(top3)}
                        label={isAr ? "نقطة" : "pts"}
                        isAr={isAr}
                        delay={0.3}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* ── Awards Shelf ─────────────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">
                    {isAr ? "جوائز الموسم" : "Season Awards"}
                  </h2>
                </div>
                <motion.div
                  variants={staggerContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  <AwardCard
                    icon={<Target className="w-5 h-5 text-red-500" />}
                    title={isAr ? "الهداف" : "Top Scorer"}
                    player={(sorted.goals[0]?.stats?.goals ?? 0) > 0 ? (sorted.goals[0] ?? null) : null}
                    value={sorted.goals[0]?.stats?.goals ?? 0}
                    subtitle={isAr ? "أهداف" : "Goals"}
                    delay={0}
                    isAr={isAr}
                  />
                  <AwardCard
                    icon={<Zap className="w-5 h-5 text-blue-500" />}
                    title={isAr ? "صانع الألعاب" : "Best Playmaker"}
                    player={(sorted.assists[0]?.stats?.assists ?? 0) > 0 ? (sorted.assists[0] ?? null) : null}
                    value={sorted.assists[0]?.stats?.assists ?? 0}
                    subtitle={isAr ? "تمريرات حاسمة" : "Assists"}
                    delay={0.08}
                    isAr={isAr}
                  />
                  <AwardCard
                    icon={<Crown className="w-5 h-5 text-amber-500" />}
                    title={isAr ? "أفضل لاعب (MVP)" : "Most MVPs"}
                    player={(sorted.mvp[0]?.stats?.mvp ?? 0) > 0 ? (sorted.mvp[0] ?? null) : null}
                    value={sorted.mvp[0]?.stats?.mvp ?? 0}
                    subtitle={isAr ? "جائزة MVP" : "MVP Awards"}
                    delay={0.16}
                    isAr={isAr}
                  />
                  <AwardCard
                    icon={<Shield className="w-5 h-5 text-emerald-500" />}
                    title={isAr ? "الأعلى تقييماً" : "Highest Rated"}
                    player={sorted.overall[0] && getOverall(sorted.overall[0]) > 0 ? sorted.overall[0] : null}
                    value={sorted.overall[0] ? getOverall(sorted.overall[0]) : 0}
                    subtitle={isAr ? "تقييم عام" : "OVR"}
                    delay={0.24}
                    isAr={isAr}
                  />
                  <AwardCard
                    icon={<Flame className="w-5 h-5 text-orange-500" />}
                    title={isAr ? "أكثر مشاركة" : "Most Matches"}
                    player={(sorted.matches[0]?.stats?.matchesPlayed ?? 0) > 0 ? (sorted.matches[0] ?? null) : null}
                    value={sorted.matches[0]?.stats?.matchesPlayed ?? 0}
                    subtitle={isAr ? "مباريات" : "Matches"}
                    delay={0.32}
                    isAr={isAr}
                  />
                  <AwardCard
                    icon={<Star className="w-5 h-5 text-purple-500" />}
                    title={isAr ? "الأفضل مساهمةً" : "Best Contributor"}
                    player={sorted.ga[0] && ((sorted.ga[0].stats?.goals || 0) + (sorted.ga[0].stats?.assists || 0)) > 0 ? sorted.ga[0] : null}
                    value={
                      sorted.ga[0]
                        ? (sorted.ga[0].stats?.goals || 0) + (sorted.ga[0].stats?.assists || 0)
                        : 0
                    }
                    subtitle={isAr ? "أهداف + تمريرات" : "G/A Combined"}
                    delay={0.4}
                    isAr={isAr}
                  />
                </motion.div>
              </section>

              {/* ── Leaderboard Tables Grid ───────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">
                    {isAr ? "ترتيب المتصدرين" : "Full Rankings"}
                  </h2>
                </div>

                {/* Top 2 wide tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <LeaderboardTable
                    tableId="ballon"
                    title={isAr ? "ترتيب الكرة الذهبية" : "Ballon d'Or Ranking"}
                    data={sorted.ballon}
                    statKey="ballon"
                    isBallon
                    isAr={isAr}
                    getOverall={getOverall}
                    currentUserUid={user?.uid}
                    icon={<Trophy className="w-4 h-4 text-amber-500" />}
                  />
                  <LeaderboardTable
                    tableId="overall"
                    title={isAr ? "أعلى اللاعبين تقييماً (OVR)" : "Highest Rated (OVR)"}
                    data={sorted.overall}
                    statKey="overall"
                    isOverall
                    isAr={isAr}
                    getOverall={getOverall}
                    currentUserUid={user?.uid}
                    icon={<Shield className="w-4 h-4 text-emerald-500" />}
                  />
                </div>

                {/* 3-col grid for remaining tables */}
                <motion.div
                  variants={staggerContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  <motion.div variants={staggerItemVariants}>
                    <LeaderboardTable
                      tableId="goals"
                      title={isAr ? "الهدافون" : "Top Scorers"}
                      data={sorted.goals}
                      statKey="goals"
                      isAr={isAr}
                      getOverall={getOverall}
                      currentUserUid={user?.uid}
                      icon={<Target className="w-4 h-4 text-red-500" />}
                    />
                  </motion.div>
                  <motion.div variants={staggerItemVariants}>
                    <LeaderboardTable
                      tableId="assists"
                      title={isAr ? "صنّاع الألعاب" : "Top Assisters"}
                      data={sorted.assists}
                      statKey="assists"
                      isAr={isAr}
                      getOverall={getOverall}
                      currentUserUid={user?.uid}
                      icon={<Zap className="w-4 h-4 text-blue-500" />}
                    />
                  </motion.div>
                  <motion.div variants={staggerItemVariants}>
                    <LeaderboardTable
                      tableId="ga"
                      title={isAr ? "المساهمات الهجومية (G/A)" : "G/A Combined"}
                      data={sorted.ga}
                      statKey="ga"
                      isGA
                      isAr={isAr}
                      getOverall={getOverall}
                      currentUserUid={user?.uid}
                      icon={<Star className="w-4 h-4 text-purple-500" />}
                    />
                  </motion.div>
                  <motion.div variants={staggerItemVariants}>
                    <LeaderboardTable
                      tableId="mvp"
                      title={isAr ? "جوائز أفضل لاعب (MVP)" : "Most MVPs"}
                      data={sorted.mvp}
                      statKey="mvp"
                      isAr={isAr}
                      getOverall={getOverall}
                      currentUserUid={user?.uid}
                      icon={<Crown className="w-4 h-4 text-amber-500" />}
                    />
                  </motion.div>
                  <motion.div variants={staggerItemVariants}>
                    <LeaderboardTable
                      tableId="matches"
                      title={isAr ? "أكثر اللاعبين مشاركةً" : "Most Matches Played"}
                      data={sorted.matches}
                      statKey="matchesPlayed"
                      isAr={isAr}
                      getOverall={getOverall}
                      currentUserUid={user?.uid}
                      icon={<Flame className="w-4 h-4 text-orange-500" />}
                    />
                  </motion.div>
                </motion.div>
              </section>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
