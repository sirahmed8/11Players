import React from 'react';
import { PlayerProfile } from '@/types';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

interface Props {
  player: PlayerProfile;
  locale?: 'en' | 'ar';
}

function calculateMainStats(attrs: PlayerProfile['attributes']) {
  return [
    { labelEn: 'PAC', labelAr: 'السرعة', value: Math.round((attrs.speed + attrs.acceleration) / 2) },
    { labelEn: 'SHO', labelAr: 'التسديد', value: Math.round((attrs.finishing + attrs.kickingPower + attrs.offensiveAwareness) / 3) },
    { labelEn: 'PAS', labelAr: 'التمرير', value: Math.round((attrs.lowPass + attrs.loftedPass) / 2) },
    { labelEn: 'DRI', labelAr: 'المراوغة', value: Math.round((attrs.dribbling + attrs.ballControl + attrs.balance) / 3) },
    { labelEn: 'DEF', labelAr: 'الدفاع', value: Math.round((attrs.defensiveAwareness + attrs.ballWinning + attrs.heading) / 3) },
    { labelEn: 'PHY', labelAr: 'البدنية', value: Math.round((attrs.physicalContact + attrs.stamina + attrs.jump) / 3) },
  ];
}

export default function PDFPlayerCard({ player, locale = 'en' }: Props) {
  const isAr = locale === 'ar';
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

  const stats = calculateMainStats(activeAttributes);
  const pStats = player.stats || { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 };

  const footText = isAr
    ? (player.preferredFoot === 'Left' ? 'قدم يسرى' : 'قدم يمنى')
    : (player.preferredFoot === 'Left' ? 'LEFT FOOT' : 'RIGHT FOOT');

  return (
    <div
      id="pdf-player-card"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        width: '540px',
        height: '780px',
        boxSizing: 'border-box',
        backgroundColor: '#070b14',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '36px',
        border: '3px solid #f59e0b',
      }}
    >
      {/* Subtle Ambient Corner Glows */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(0,0,0,0) 70%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)' }} />

      {/* Outer Card Gold Frame with Rounded Corners */}
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '2px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '26px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0d1322',
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b', letterSpacing: '2px' }}>
              11PLAYERS
            </span>
            {/* ELITE Badge - Optically Centered with translateY(-2.5px) */}
            <div
              style={{
                height: '24px',
                padding: '0 14px',
                backgroundColor: 'rgba(245, 158, 11, 0.22)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', letterSpacing: '1px', transform: 'translateY(-2.5px)' }}>
                {isAr ? 'نخبة' : 'ELITE'}
              </span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>
            {isAr ? 'موسم 2026' : 'SEASON 2026'}
          </span>
        </div>

        {/* Hero Section: Rating + Large Rounded Player Frame */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', padding: '6px 4px' }}>
          {/* OVR + POS + PlayStyle Left Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '135px' }}>
            <span
              style={{
                fontSize: '76px',
                fontWeight: 900,
                lineHeight: 0.9,
                color: '#ffffff',
                textShadow: '0 4px 12px rgba(245,158,11,0.3)',
              }}
            >
              {overall}
            </span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#fbbf24',
                marginTop: '6px',
                letterSpacing: '1.5px',
              }}
            >
              {player.primaryPosition || 'CMF'}
            </span>
            {player.playStyle && (
              <div
                style={{
                  height: '26px',
                  padding: '0 16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '10px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', transform: 'translateY(-2.5px)' }}>
                  {player.playStyle}
                </span>
              </div>
            )}
          </div>

          {/* Large Premium Player Portrait Frame using background-image to avoid html2canvas object-fit stretching */}
          <div
            style={{
              width: '200px',
              height: '215px',
              borderRadius: '24px',
              border: '3px solid #f59e0b',
              overflow: 'hidden',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              position: 'relative',
              backgroundImage: player.photoUrl ? `url("${player.photoUrl}")` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {!player.photoUrl && (
              <span style={{ fontSize: '64px', fontWeight: 900, color: '#f59e0b' }}>
                {player.cardName?.charAt(0) || '11'}
              </span>
            )}
          </div>
        </div>

        {/* Player Name & Info Row */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '14px' }}>
          <h1
            style={{
              fontSize: '34px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '1.5px',
            }}
          >
            {player.cardName}
          </h1>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              fontSize: '13px',
              fontWeight: 800,
              color: '#cbd5e1',
            }}
          >
            <span>{player.calculatedAge || 20} {isAr ? 'سنة' : 'YRS'}</span>
            <span style={{ color: '#f59e0b' }}>•</span>
            <span>{player.height || 175} {isAr ? 'سم' : 'CM'}</span>
            <span style={{ color: '#f59e0b' }}>•</span>
            <span>{footText}</span>
          </div>
        </div>

        {/* EA FC Ultimate Team Styled Attributes Grid (2x3) - Clean Baseline Alignment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {stats.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '16px',
                padding: '14px 22px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                {s.value}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                {isAr ? s.labelAr : s.labelEn}
              </span>
            </div>
          ))}
        </div>

        {/* Career Stats Footer Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: '#0a0f1d',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '18px',
            padding: '14px 8px',
          }}
        >
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>{pStats.goals || 0}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginTop: '4px' }}>
              {isAr ? 'أهداف' : 'GOALS'}
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8' }}>{pStats.assists || 0}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginTop: '4px' }}>
              {isAr ? 'تمريرات' : 'ASSISTS'}
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24' }}>{pStats.mvp || 0}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginTop: '4px' }}>
              {isAr ? 'أفضل لاعب' : 'MVP'}
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#e2e8f0' }}>{pStats.matchesPlayed || 0}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginTop: '4px' }}>
              {isAr ? 'مباريات' : 'MATCHES'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
