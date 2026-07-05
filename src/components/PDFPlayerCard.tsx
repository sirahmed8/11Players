import React from 'react';
import { PlayerProfile } from '@/types';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

interface Props {
  player: PlayerProfile;
}

function getAttributeColor(value: number): string {
  if (value >= 90) return 'text-emerald-400';
  if (value >= 75) return 'text-green-400';
  if (value >= 60) return 'text-yellow-400';
  if (value >= 45) return 'text-orange-400';
  return 'text-red-400';
}

function calculateMainStats(attrs: PlayerProfile['attributes']) {
  return [
    { label: 'PAC', value: Math.round((attrs.speed + attrs.acceleration) / 2) },
    { label: 'SHO', value: Math.round((attrs.finishing + attrs.kickingPower + attrs.offensiveAwareness) / 3) },
    { label: 'PAS', value: Math.round((attrs.lowPass + attrs.loftedPass) / 2) },
    { label: 'DRI', value: Math.round((attrs.dribbling + attrs.ballControl + attrs.balance) / 3) },
    { label: 'DEF', value: Math.round((attrs.defensiveAwareness + attrs.ballWinning + attrs.heading) / 3) },
    { label: 'PHY', value: Math.round((attrs.physicalContact + attrs.stamina + attrs.jump) / 3) },
  ];
}

// Ensure the component handles RTL and uses standard HTML <img> instead of next/image for immediate loading.
export default function PDFPlayerCard({ player }: Props) {
  const activeAttributes = player.approvedAttributes || player.attributes;
  const overall = player.overallRating || calculateRealisticOverall(
    activeAttributes,
    player.primaryPosition,
    player.playStyle || ''
  );

  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
  const nameDir = isArabic(player.cardName) ? 'rtl' : 'ltr';

  const stats = calculateMainStats(activeAttributes);

  return (
    <div
      id="pdf-player-card"
      className="relative flex flex-col w-[500px] h-[750px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 font-sans shadow-2xl"
      style={{
        boxSizing: 'border-box',
      }}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-600 blur-[120px] opacity-40"></div>
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-600 blur-[120px] opacity-40"></div>

      {/* Card Border wrapper */}
      <div className="relative flex flex-col flex-1 rounded-[1.5rem] border-[4px] border-amber-400 bg-black/40 backdrop-blur-sm p-6 overflow-hidden">
        
        {/* Top Section */}
        <div className="flex flex-row items-start justify-between z-10 w-full">
          {/* Rating & Position */}
          <div className="flex flex-col items-center">
            <span className="text-7xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{overall}</span>
            <span className="text-2xl font-bold text-amber-400 tracking-wider drop-shadow-md">{player.primaryPosition}</span>
          </div>
          
          {/* Player Image */}
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 rounded-full border-4 border-amber-400 overflow-hidden shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-slate-800 flex items-center justify-center">
              {player.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.photoUrl}
                  alt={player.cardName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <span className="text-amber-500 font-bold text-6xl opacity-50">?</span>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="mt-4 flex flex-col items-center border-b-2 border-amber-400/50 pb-3 z-10 w-full">
          <h1
            dir={nameDir}
            className="text-5xl font-black tracking-widest text-white uppercase drop-shadow-lg text-center"
          >
            {player.cardName}
          </h1>
          <div className="flex gap-3 text-sm text-amber-200 mt-2 font-bold tracking-widest uppercase">
            <span>{player.calculatedAge} YRS</span>
            <span>|</span>
            <span>{player.height} CM</span>
            <span>|</span>
            <span>{player.weight} KG</span>
          </div>
        </div>

        {/* Attributes Grid */}
        <div className="mt-6 flex flex-row w-full justify-between px-4 z-10">
          <div className="flex flex-col gap-3 w-[45%]">
            {stats.slice(0, 3).map((s) => (
              <div key={s.label} className="flex flex-row items-center justify-between text-2xl font-bold">
                <span className="text-white drop-shadow-md w-12">{s.value}</span>
                <span className={`tracking-wider ${getAttributeColor(s.value)} drop-shadow-sm`}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="w-[2px] bg-amber-400/30"></div>
          <div className="flex flex-col gap-3 w-[45%]">
            {stats.slice(3, 6).map((s) => (
              <div key={s.label} className="flex flex-row items-center justify-between text-2xl font-bold">
                <span className="text-white drop-shadow-md w-12">{s.value}</span>
                <span className={`tracking-wider ${getAttributeColor(s.value)} drop-shadow-sm`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Playstyle & Special Skills */}
        <div className="mt-auto flex flex-col gap-3 z-10 w-full border-t border-amber-400/30 pt-4">
          <div className="flex flex-row justify-between text-sm uppercase">
            <div className="flex flex-col gap-1 w-1/2 pr-2">
              <span className="text-amber-400 font-bold tracking-wider">Playstyle</span>
              <span className="text-white font-semibold">{player.playStyle ? player.playStyle.replace(/_/g, ' ') : 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1 w-1/2 pl-2 border-l border-amber-400/30">
              <span className="text-amber-400 font-bold tracking-wider">Preferred Foot</span>
              <span className="text-white font-semibold">
                {player.preferredFoot === 'Right' ? 'Right' : player.preferredFoot === 'Left' ? 'Left' : 'Ambidextrous'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <span className="text-amber-400 font-bold tracking-wider text-sm uppercase">Special Skills</span>
            <div className="flex flex-wrap gap-2">
              {player.specialSkills && player.specialSkills.length > 0 ? (
                player.specialSkills.map((skill, idx) => (
                  <span key={idx} className="bg-amber-500/20 text-amber-100 border border-amber-500/50 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">No special skills</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 opacity-60">
          <span className="text-amber-400 text-xs tracking-widest font-black uppercase">11PLAYERS ULTIMATE TEAM</span>
        </div>
      </div>
    </div>
  );
}
