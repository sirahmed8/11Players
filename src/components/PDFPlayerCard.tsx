import React from 'react';
import { PlayerProfile } from '@/types';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

interface Props {
  player: PlayerProfile;
}

function calculateMainStats(attrs: PlayerProfile['attributes']) {
  return [
    { label: 'PAC', nameAr: 'السرعة', value: Math.round((attrs.speed + attrs.acceleration) / 2) },
    { label: 'SHO', nameAr: 'التسديد', value: Math.round((attrs.finishing + attrs.kickingPower + attrs.offensiveAwareness) / 3) },
    { label: 'PAS', nameAr: 'التمرير', value: Math.round((attrs.lowPass + attrs.loftedPass) / 2) },
    { label: 'DRI', nameAr: 'المراوغة', value: Math.round((attrs.dribbling + attrs.ballControl + attrs.balance) / 3) },
    { label: 'DEF', nameAr: 'الدفاع', value: Math.round((attrs.defensiveAwareness + attrs.ballWinning + attrs.heading) / 3) },
    { label: 'PHY', nameAr: 'البدنية', value: Math.round((attrs.physicalContact + attrs.stamina + attrs.jump) / 3) },
  ];
}

export default function PDFPlayerCard({ player }: Props) {
  const activeAttributes = player.approvedAttributes || player.attributes || {
    speed: 70, acceleration: 70, finishing: 65, kickingPower: 70,
    offensiveAwareness: 68, lowPass: 72, loftedPass: 70,
    dribbling: 72, ballControl: 74, balance: 70,
    defensiveAwareness: 60, ballWinning: 62, heading: 65,
    physicalContact: 68, stamina: 75, jump: 68
  };

  const overall = calculateRealisticOverall(
    activeAttributes,
    player.primaryPosition || 'CMF',
    player.playStyle || ''
  );

  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text || '');
  const nameDir = isArabic(player.cardName) ? 'rtl' : 'ltr';

  const stats = calculateMainStats(activeAttributes);
  const pStats = player.stats || { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 };

  return (
    <div
      id="pdf-player-card"
      style={{
        width: '520px',
        height: '760px',
        boxSizing: 'border-box',
        backgroundColor: '#070b14',
        backgroundImage: 'linear-gradient(145deg, #0f172a 0%, #070b14 60%, #1e1b4b 100%)',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '32px',
        border: '3px solid #f59e0b',
      }}
    >
      {/* Decorative Golden Corner Accents */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(0,0,0,0) 70%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)' }} />

      {/* Card Inner Frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '2px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.3)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b', letterSpacing: '2px' }}>11PLAYERS</span>
            <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '6px' }}>ELITE</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>SEASON 2026</span>
        </div>

        {/* Hero Section: Rating, Position, Photo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 8px' }}>
          {/* Left Badge: OVR & Position */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '110px' }}>
            <span style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1, color: '#ffffff', textShadow: '0 2px 10px rgba(245,158,11,0.4)' }}>
              {overall}
            </span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#fbbf24', marginTop: '4px', letterSpacing: '1px' }}>
              {player.primaryPosition || 'CMF'}
            </span>
            {player.playStyle && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', backgroundColor: 'rgba(16,185,129,0.15)', padding: '3px 10px', borderRadius: '12px', marginTop: '6px' }}>
                {player.playStyle}
              </span>
            )}
          </div>

          {/* Right Portrait */}
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <div
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                border: '4px solid #f59e0b',
                overflow: 'hidden',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {player.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.photoUrl}
                  alt={player.cardName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span style={{ fontSize: '56px', fontWeight: 900, color: '#f59e0b' }}>
                  {player.cardName?.charAt(0) || '11'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Player Name & Bio Banner */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
          <h1
            dir={nameDir}
            style={{
              fontSize: '32px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '1px',
            }}
          >
            {player.cardName}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
            <span>{player.calculatedAge || 20} YRS</span>
            <span style={{ color: '#f59e0b' }}>•</span>
            <span>{player.height || 175} CM</span>
            <span style={{ color: '#f59e0b' }}>•</span>
            <span>{player.preferredFoot === 'Left' ? 'LEFT FOOT' : 'RIGHT FOOT'}</span>
          </div>
        </div>

        {/* Attributes Grid (2x3) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '8px 0' }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '12px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24' }}>{s.value}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{s.nameAr}</span>
            </div>
          ))}
        </div>

        {/* Bottom Match Career Performance Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '12px 8px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>{pStats.goals || 0}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>GOALS</div>
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8' }}>{pStats.assists || 0}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>ASSISTS</div>
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24' }}>{pStats.mvp || 0}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>MVP</div>
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#e2e8f0' }}>{pStats.matchesPlayed || 0}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>MATCHES</div>
          </div>
        </div>
      </div>
    </div>
  );
}
