"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Trash2, Users } from "lucide-react";
import { PlayerProfile } from "@/types";

interface GlobalUserRowProps {
  u: PlayerProfile;
  isAr: boolean;
  communitiesMap: Record<string, string>;
  userCommMap: Record<string, string[]>;
  onBanUser: (user: PlayerProfile) => void;
  onManageCommunities: (user: PlayerProfile) => void;
}

const GlobalUserRow = React.memo(function GlobalUserRow({
  u,
  isAr,
  communitiesMap,
  userCommMap,
  onBanUser,
  onManageCommunities,
}: GlobalUserRowProps) {
  const photo = u.photoUrl || u.googlePic || (u as any).photoURL || (u as any).userPic || "";

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
  }, [u, u.memberCommunities, u.joinedCommunities, userCommMap, u.uid]);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {photo ? (
            <Image src={photo} alt={u.fullName} className="w-10 h-10 rounded-full object-cover shrink-0" width={40} height={40} referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold shrink-0">
              {u.fullName?.charAt(0) || "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white truncate">{u.fullName}</div>
            <div className="text-sm text-slate-500 truncate">{u.cardName}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
        {u.email || "N/A"}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {commIds.length > 0 ? (
            commIds.map((c) => (
              <span key={c} className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
                {communitiesMap[c] || c}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">-</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onManageCommunities(u)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            title={isAr ? "إدارة المجتمعات" : "Manage Communities"}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? "المجتمعات" : "Communities"}</span>
          </button>
          <Link
            href={`/profile?uid=${u.uid}`}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            title={isAr ? "عرض الملف الشخصي" : "View Profile"}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? "الملف الشخصي" : "Profile"}</span>
          </Link>
          <button
            onClick={() => onBanUser(u)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title={isAr ? "حظر / حذف" : "Ban / Delete User"}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default GlobalUserRow;
