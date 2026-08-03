"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Trash2, Users, Crown, Shield, Activity, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";

interface GlobalUserRowProps {
  u: PlayerProfile;
  isAr: boolean;
  communitiesMap: Record<string, string>;
  userCommMap: Record<string, string[]>;
  onBanUser: (user: PlayerProfile) => void;
  onManageCommunities: (user: PlayerProfile) => void;
  onTogglePro?: (user: PlayerProfile) => void;
}

const GlobalUserRow = React.memo(function GlobalUserRow({
  u,
  isAr,
  communitiesMap,
  userCommMap,
  onBanUser,
  onManageCommunities,
  onTogglePro,
}: GlobalUserRowProps) {
  const photo = u.photoUrl || u.googlePic || (u as any).photoURL || (u as any).userPic || "";
  const ovr = getPlayerOverall(u);

  const commIds = React.useMemo(() => {
    const activeLocalComm = typeof window !== "undefined" ? localStorage.getItem("activeCommunityId") : null;
    return Array.from(
      new Set([
        ...(u.memberCommunities || []),
        ...(u.joinedCommunities || []),
        ...(userCommMap[u.uid] || []),
        ...((u as any).lastCommunityId ? [(u as any).lastCommunityId] : []),
        ...((activeLocalComm && (userCommMap[u.uid] || u.memberCommunities?.includes(activeLocalComm))) ? [activeLocalComm] : []),
      ].filter(Boolean))
    ) as string[];
  }, [u, userCommMap]);

  // Activity Score calculation
  const matches = u.stats?.matchesPlayed || 0;
  const goals = u.stats?.goals || 0;
  const assists = u.stats?.assists || 0;
  const totalImpact = matches + goals + assists;
  const activityTier = totalImpact > 25 ? "high" : totalImpact > 5 ? "moderate" : "inactive";

  return (
    <>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {photo ? (
              <Image src={photo} alt={u.fullName} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-800" width={40} height={40} referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0 text-sm">
                {u.fullName?.charAt(0) || "?"}
              </div>
            )}
            <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.2 rounded-md bg-emerald-600 border border-emerald-500 text-white text-[9px] font-black leading-none">
              {ovr}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-black text-white text-xs truncate flex items-center gap-1.5">
              <span>{u.cardName || u.fullName}</span>
              {(u as any).isOwner && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5" />
                  <span>{isAr ? "مالك" : "Owner"}</span>
                </span>
              )}
              {(u as any).isAdmin && !(u as any).isOwner && (
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-black flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" />
                  <span>{isAr ? "مشرف" : "Admin"}</span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{u.email || "N/A"}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="space-y-0.5">
          <div className="text-xs font-black text-amber-400">
            {u.primaryPosition || "CMF"}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold truncate">
            {u.playStyle ? u.playStyle.replace(/_/g, " ") : (isAr ? "أسلوب متوازن" : "Balanced")}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {commIds.length > 0 ? (
              commIds.slice(0, 2).map((c) => (
                <span key={c} className="text-[10px] bg-slate-950 text-emerald-400 border border-slate-800 font-bold px-2 py-0.5 rounded-lg">
                  {communitiesMap[c] || c}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic">{isAr ? "لا يوجد" : "None"}</span>
            )}
            {commIds.length > 2 && (
              <span className="text-[9px] font-bold text-slate-400 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-lg">
                +{commIds.length - 2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>
              {activityTier === "high" && <span className="text-emerald-400 font-black">🔥 {isAr ? "نشاط مرتفع" : "High Activity"}</span>}
              {activityTier === "moderate" && <span className="text-amber-400 font-bold">⚡ {isAr ? "نشاط متوسط" : "Moderate"}</span>}
              {activityTier === "inactive" && <span className="text-slate-500 font-bold">💤 {isAr ? "غير نشط" : "Inactive"}</span>}
            </span>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {onTogglePro && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              type="button"
              onClick={() => onTogglePro(u)}
              className={`px-3 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                u.subscription?.status === 'active'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
              title={isAr ? "تغيير اشتراك PRO" : "Toggle PRO Subscription"}
            >
              <Crown className={`w-3.5 h-3.5 ${u.subscription?.status === 'active' ? 'text-amber-400 fill-amber-400/30' : 'text-slate-500'}`} />
              <span>{u.subscription?.status === 'active' ? (isAr ? 'PRO مفعل' : 'PRO Active') : (isAr ? 'ترقية PRO' : 'Grant PRO')}</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            type="button"
            onClick={() => onManageCommunities(u)}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isAr ? "إدارة المجتمعات" : "Manage Communities"}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? "المجتمعات" : "Communities"}</span>
          </motion.button>
          <Link
            href={`/profile?uid=${u.uid}`}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title={isAr ? "عرض الملف الشخصي" : "View Profile"}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? "الملف الشخصي" : "Profile"}</span>
          </Link>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            type="button"
            onClick={() => onBanUser(u)}
            className="p-1.5 text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/40 rounded-xl transition-colors cursor-pointer"
            title={isAr ? "حظر / حذف" : "Ban / Delete User"}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </td>
    </>
  );
});

export default GlobalUserRow;
