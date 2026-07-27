import React from 'react';

export const OVR_BADGE = ({ ovr }: { ovr: number }) => {
  const color =
    ovr >= 80 ? 'bg-amber-400/90 text-slate-950 border-amber-300/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]' :
    ovr >= 70 ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]' :
    ovr >= 60 ? 'bg-blue-500/90 text-white border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]' :
    'bg-slate-700/90 text-slate-200 border-slate-600/50 shadow-sm';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black backdrop-blur-md border hover:scale-110 transition-all duration-200 cursor-pointer ${color}`}>
      {ovr}
    </span>
  );
};
