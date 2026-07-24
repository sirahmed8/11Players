import React from 'react';

export const OVR_BADGE = ({ ovr }: { ovr: number }) => {
  const color =
    ovr >= 80 ? 'bg-amber-400 text-black' :
    ovr >= 70 ? 'bg-emerald-500 text-white' :
    ovr >= 60 ? 'bg-blue-500 text-white' :
    'bg-slate-500 text-white';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${color}`}>
      {ovr}
    </span>
  );
};
