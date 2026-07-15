"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { PlayerProfile } from "@/types";

interface AdminTableRowProps {
  player: PlayerProfile;
  locale: string;
  loadingUid: string | null;
  onToggleWarning: (player: PlayerProfile) => void;
  onToggleVerify: (player: PlayerProfile) => void;
  onOpenEditModal: (player: PlayerProfile) => void;
  onOpenAttrModal: (player: PlayerProfile) => void;
  onOpenStatsModal: (player: PlayerProfile) => void;
  onGeneratePDF: (player: PlayerProfile) => void;
  onOpenResetModal: (player: PlayerProfile) => void;
  onOpenDeleteModal: (player: PlayerProfile) => void;
}

const t = (locale: string, en: string, ar: string) => (locale === "ar" ? ar : en);

const AdminTableRow = React.memo(function AdminTableRow({
  player,
  locale,
  loadingUid,
  onToggleWarning,
  onToggleVerify,
  onOpenEditModal,
  onOpenAttrModal,
  onOpenStatsModal,
  onGeneratePDF,
  onOpenResetModal,
  onOpenDeleteModal,
}: AdminTableRowProps) {
  const photo = player.photoUrl || player.googlePic || (player as any).photoURL || (player as any).userPic || "";

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {photo ? (
            <Image
              src={photo}
              alt={player.fullName}
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              {player.fullName?.charAt(0) || "?"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-slate-900 dark:text-slate-200 truncate">
              {player.googleName || player.email?.split("@")[0] || player.fullName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {player.fullName} • {player.cardName}
            </span>
          </div>
        </div>
      </td>

      {/* Position */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {player.primaryPosition}
          </span>
          {player.secondaryPosition && (
            <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {player.secondaryPosition}
            </span>
          )}
          {player.tertiaryPosition && (
            <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 opacity-75">
              {player.tertiaryPosition}
            </span>
          )}
        </div>
      </td>

      {/* Age */}
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{player.calculatedAge}</td>

      {/* Foot */}
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
        {locale === "ar"
          ? player.preferredFoot === "Right"
            ? "يمنى"
            : player.preferredFoot === "Left"
            ? "يسرى"
            : "كلتاهما"
          : player.preferredFoot}
      </td>

      {/* Warning */}
      <td className="px-4 py-3">
        <button
          disabled={loadingUid === player.uid}
          onClick={() => onToggleWarning(player)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            player.hasWarning
              ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 hover:bg-amber-500/30"
              : "bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          } disabled:opacity-50`}
          title={t(locale, "Toggle warning", "تبديل التحذير")}
        >
          {player.hasWarning ? "⚠️" : "—"}
          <span>{player.hasWarning ? t(locale, "Yes", "نعم") : t(locale, "No", "لا")}</span>
        </button>
      </td>

      {/* Verified */}
      <td className="px-4 py-3">
        <button
          disabled={loadingUid === player.uid}
          onClick={() => onToggleVerify(player)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            player.isVerifiedByAdmin
              ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30"
              : "bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/25"
          } disabled:opacity-50`}
          title={t(locale, "Toggle verification", "تبديل التوثيق")}
        >
          {player.isVerifiedByAdmin ? "✅" : "❌"}
          <span>
            {player.isVerifiedByAdmin ? t(locale, "Verified", "موثق") : t(locale, "Unverified", "غير موثق")}
          </span>
        </button>
      </td>

      {/* Goals */}
      <td className="px-4 py-3">
        <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{player.stats?.goals || 0}</span>
      </td>

      {/* Assists */}
      <td className="px-4 py-3">
        <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{player.stats?.assists || 0}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Edit Profile */}
          <button
            onClick={() => onOpenEditModal(player)}
            className="rounded-lg bg-indigo-50 dark:bg-indigo-600/20 p-2 text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-600/40 hover:text-indigo-700 dark:hover:text-indigo-300"
            title={t(locale, "Edit Profile", "تعديل الملف الشخصي")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>

          {/* Edit Attributes */}
          <button
            onClick={() => onOpenAttrModal(player)}
            className="rounded-lg bg-purple-50 dark:bg-purple-600/20 p-2 text-purple-600 dark:text-purple-400 transition-colors hover:bg-purple-100 dark:hover:bg-purple-600/40 hover:text-purple-700 dark:hover:text-purple-300"
            title={t(locale, "Edit Attributes", "تعديل الطاقات")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>

          {/* Edit Stats */}
          <button
            onClick={() => onOpenStatsModal(player)}
            className="rounded-lg bg-emerald-50 dark:bg-emerald-600/20 p-2 text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-600/40 hover:text-emerald-700 dark:hover:text-emerald-300"
            title={t(locale, "Edit Stats", "تعديل الإحصائيات")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>

          {/* PDF Export */}
          <button
            onClick={() => onGeneratePDF(player)}
            className="rounded-lg bg-blue-50 dark:bg-blue-600/20 p-2 text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-100 dark:hover:bg-blue-600/40 hover:text-blue-700 dark:hover:text-blue-300"
            title={t(locale, "Export PDF", "تصدير PDF")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </button>

          {/* Reset Stats */}
          <button
            onClick={() => onOpenResetModal(player)}
            disabled={loadingUid === player.uid}
            className="rounded-lg bg-orange-50 dark:bg-orange-600/20 p-2 text-orange-600 dark:text-orange-400 transition-colors hover:bg-orange-100 dark:hover:bg-orange-600/40 hover:text-orange-700 dark:hover:text-orange-300 disabled:opacity-50"
            title={t(locale, "Reset Stats", "تصفير الإحصائيات")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => onOpenDeleteModal(player)}
            disabled={loadingUid === player.uid}
            className="rounded-lg bg-red-50 dark:bg-red-600/20 p-2 text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-600/40 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
            title={t(locale, "Delete Player", "حذف اللاعب")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </td>
    </motion.tr>
  );
});

export default AdminTableRow;
