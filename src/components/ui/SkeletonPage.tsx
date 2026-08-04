"use client";

import React from "react";
import { motion } from "framer-motion";

export const SkeletonBox: React.FC<{
  className?: string;
  height?: string | number;
  width?: string | number;
}> = ({ className = "", height, width }) => (
  <div
    style={{ height, width }}
    className={`bg-slate-200 dark:bg-slate-800/80 animate-pulse rounded-lg ${className}`}
  />
);

export const SkeletonPageHeader: React.FC<{ titleWidth?: string }> = ({
  titleWidth = "w-48",
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
    <div className="space-y-2">
      <SkeletonBox className={`h-8 ${titleWidth} rounded-md`} />
      <SkeletonBox className="h-4 w-72 rounded-md" />
    </div>
    <div className="flex gap-2">
      <SkeletonBox className="h-10 w-28 rounded-xl" />
      <SkeletonBox className="h-10 w-28 rounded-xl" />
    </div>
  </div>
);

export const SkeletonCardGrid: React.FC<{ count?: number; columns?: string }> = ({
  count = 6,
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}) => (
  <div className={`grid ${columns} gap-5`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md space-y-4"
      >
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-6 w-32 rounded" />
          <SkeletonBox className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBox className="h-16 w-full rounded-xl" />
        <div className="flex justify-between items-center pt-2">
          <SkeletonBox className="h-4 w-24 rounded" />
          <SkeletonBox className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonListRows: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-36 rounded" />
            <SkeletonBox className="h-3 w-24 rounded" />
          </div>
        </div>
        <SkeletonBox className="h-8 w-24 rounded-lg" />
      </div>
    ))}
  </div>
);

export const SkeletonPitch: React.FC = () => (
  <div className="relative w-full aspect-[4/3] max-w-4xl mx-auto rounded-3xl overflow-hidden border border-emerald-900/30 bg-emerald-950/40 p-6 flex flex-col justify-between items-center">
    <SkeletonBox className="h-8 w-40 rounded-full bg-emerald-800/40" />
    <div className="w-full grid grid-cols-4 gap-4 my-auto">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center space-y-2">
          <SkeletonBox className="h-14 w-14 rounded-full bg-emerald-800/40" />
          <SkeletonBox className="h-3 w-16 rounded bg-emerald-800/40" />
        </div>
      ))}
    </div>
    <SkeletonBox className="h-10 w-64 rounded-xl bg-emerald-800/40" />
  </div>
);

export const SkeletonProfile: React.FC = () => (
  <div className="space-y-6">
    <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6">
      <SkeletonBox className="h-28 w-28 rounded-full" />
      <div className="space-y-3 flex-1 text-center md:text-left">
        <SkeletonBox className="h-8 w-48 rounded-md mx-auto md:mx-0" />
        <SkeletonBox className="h-4 w-32 rounded-md mx-auto md:mx-0" />
        <div className="flex justify-center md:justify-start gap-2 pt-1">
          <SkeletonBox className="h-6 w-20 rounded-full" />
          <SkeletonBox className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SkeletonBox className="h-72 w-full rounded-3xl" />
      <SkeletonBox className="h-72 w-full rounded-3xl" />
    </div>
  </div>
);

export const SkeletonLeaderboard: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonBox key={i} className="h-36 w-full rounded-2xl" />
      ))}
    </div>
    <SkeletonListRows count={7} />
  </div>
);

export default function SkeletonPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto space-y-6"
    >
      <SkeletonPageHeader />
      <SkeletonCardGrid count={6} />
    </motion.div>
  );
}
