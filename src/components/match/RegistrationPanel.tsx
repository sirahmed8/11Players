"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, UserPlus, Users, Loader2, Sparkles } from "lucide-react";
import { PlayerProfile } from "@/types";

interface RegistrationPanelProps {
  matchData: any;
  user: any;
  players: PlayerProfile[];
  isAr: boolean;
  isSubmitting: boolean;
  isAdmin: boolean;
  onToggleSignIn: () => void;
  onGenerateTeams: () => void;
}

export default function RegistrationPanel({
  matchData,
  user,
  players,
  isAr,
  isSubmitting,
  isAdmin,
  onToggleSignIn,
  onGenerateTeams,
}: RegistrationPanelProps) {
  if (!matchData) return null;

  const signedUpUids: string[] = matchData.signedUpPlayerUids || [];
  const isSignedUp = user ? signedUpUids.includes(user.uid) : false;
  const maxCapacity = matchData.maxPlayers || 12;
  const count = signedUpUids.length;
  const percent = Math.min((count / maxCapacity) * 100, 100);

  const signedUpPlayers = players.filter((p) => signedUpUids.includes(p.uid));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl mb-8"
    >
      {/* Top Accent Gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {isAr ? "فترة تسجيل الحضور مفتوحة" : "Registration Open"}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {isAr ? "حجز المباراة القادمة" : "Upcoming Match Booking"}
          </h2>
        </div>

        {/* Action Button */}
        {user && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleSignIn}
            disabled={isSubmitting}
            className={`px-6 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 flex items-center gap-2.5 shadow-xl ${
              isSignedUp
                ? "bg-slate-800 hover:bg-red-900/40 text-red-400 border border-red-500/30"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignedUp ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{isAr ? "مسجل (اضغط للإلغاء)" : "Signed In (Click to cancel)"}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>{isAr ? "تسجيل الحضور للمباراة ⚽" : "Sign Up For Match ⚽"}</span>
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Progress Capacity Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-400">
          <span>{isAr ? "اللاعبون الحاضرون" : "Checked-in Players"}</span>
          <span>
            <span className="text-emerald-400 text-sm font-black">{count}</span> / {maxCapacity} {isAr ? "لاعب" : "Players"}
          </span>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full shadow-md shadow-emerald-500/40"
          />
        </div>
      </div>

      {/* Roster Grid */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {isAr ? "قائمة الحضور المسجلين" : "Registered Players Roster"}
        </h4>
        {signedUpPlayers.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-slate-500 text-sm">
            {isAr ? "لم يقم أحد بتسجيل الحضور بعد. كن أول المسجلين!" : "No players checked in yet. Be the first!"}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {signedUpPlayers.map((p) => (
              <div
                key={p.uid}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-700 shrink-0">
                  {p.photoUrl || p.googlePic ? (
                    <Image
                      src={(p.photoUrl || p.googlePic)!}
                      alt={p.cardName || p.fullName}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-300 flex items-center justify-center h-full">
                      {(p.cardName || p.fullName || "?").charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{p.cardName || p.fullName}</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">{p.primaryPosition}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Generate Teams Action */}
      {isAdmin && count >= 4 && (
        <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGenerateTeams}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? "توليد وموازنة الفرق الآن" : "Generate & Balance Teams Now"}</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
