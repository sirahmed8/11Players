import React from 'react';
import { PlayerProfile } from '@/types';
import { getPlayerOverall } from '@/lib/playerUtils';

interface Props {
  profiles: PlayerProfile[];
  pageIndex: number;
  totalPages: number;
  locale?: 'en' | 'ar';
}

export default function PDFBulkTable({ profiles, pageIndex, totalPages, locale = 'en' }: Props) {
  const isAr = locale === 'ar';

  return (
    <div
      id="pdf-bulk-table"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        width: '1123px',
        height: '794px',
        boxSizing: 'border-box',
        backgroundColor: '#060911',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '28px',
        border: '3px solid #f59e0b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Ambient Corner Glows */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      {/* Outer Golden Inner Frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '22px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0b101d',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid rgba(245, 158, 11, 0.35)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b', letterSpacing: '2.5px', lineHeight: 1 }}>
                11PLAYERS
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1.5px', marginTop: '2px' }}>
                {isAr ? 'دليل النخبة الرسمي للاعبين' : 'OFFICIAL ULTIMATE TEAM ROSTER DIRECTORY'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                height: '28px',
                padding: '0 14px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24', letterSpacing: '1px' }}>
                {isAr ? 'موسم 2026 النخبة' : 'ELITE SEASON 2026'}
              </span>
            </div>

            <div
              style={{
                height: '28px',
                padding: '0 16px',
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24', letterSpacing: '1px' }}>
                {isAr ? `صفحة ${pageIndex + 1} من ${totalPages}` : `PAGE ${pageIndex + 1} OF ${totalPages}`}
              </span>
            </div>
          </div>
        </div>

        {/* Master Roster Table */}
        <div style={{ flex: 1, marginTop: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '10px 12px', textAlign: isAr ? 'right' : 'left', borderRadius: isAr ? '0 10px 10px 0' : '10px 0 0 10px', width: '50px' }}>
                  {isAr ? 'الترتيب' : 'RANK'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: isAr ? 'right' : 'left' }}>
                  {isAr ? 'اللاعب' : 'PLAYER'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>
                  {isAr ? 'التقييم' : 'OVR'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>
                  {isAr ? 'المركز' : 'POS'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>
                  {isAr ? 'العمر' : 'AGE'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>
                  {isAr ? 'القدم' : 'FOOT'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '100px' }}>
                  {isAr ? 'الحالة' : 'STATUS'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>
                  {isAr ? 'أهداف' : 'GOALS'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>
                  {isAr ? 'تمريرات' : 'ASTS'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', borderRadius: isAr ? '10px 0 0 10px' : '0 10px 10px 0', width: '70px' }}>
                  {isAr ? 'أفضل لاعب' : 'MVP'}
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, idx) => {
                const globalRank = pageIndex * 12 + idx + 1;
                const overall = getPlayerOverall(p);

                const footLabel = isAr
                  ? (p.preferredFoot === 'Left' ? 'يسرى' : 'يمنى')
                  : (p.preferredFoot || 'Right');

                const statusLabel = isAr
                  ? (p.isVerifiedByAdmin ? 'موثق' : 'عادي')
                  : (p.isVerifiedByAdmin ? 'Verified' : 'Member');

                const pStats = p.stats || { goals: 0, assists: 0, mvp: 0 };

                // Tier Styling for OVR
                let ovrBg = 'rgba(245, 158, 11, 0.2)';
                let ovrBorder = '1px solid rgba(245, 158, 11, 0.5)';
                let ovrColor = '#fbbf24';
                if (overall >= 88) {
                  ovrBg = 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(236, 72, 153, 0.35))';
                  ovrBorder = '1px solid rgba(236, 72, 153, 0.6)';
                  ovrColor = '#f43f5e';
                } else if (overall >= 80) {
                  ovrBg = 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.35))';
                  ovrBorder = '1px solid rgba(245, 158, 11, 0.6)';
                  ovrColor = '#fbbf24';
                } else if (overall < 70) {
                  ovrBg = 'rgba(100, 116, 139, 0.25)';
                  ovrBorder = '1px solid rgba(100, 116, 139, 0.4)';
                  ovrColor = '#cbd5e1';
                }

                // Medal decoration for top 3
                let rankDisplay = `#${globalRank}`;
                let rankColor = '#94a3b8';
                if (globalRank === 1) { rankDisplay = '🏆 #1'; rankColor = '#fbbf24'; }
                else if (globalRank === 2) { rankDisplay = '🥈 #2'; rankColor = '#cbd5e1'; }
                else if (globalRank === 3) { rankDisplay = '🥉 #3'; rankColor = '#f97316'; }

                return (
                  <tr
                    key={p.uid || idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'rgba(30, 41, 59, 0.65)' : 'rgba(15, 23, 42, 0.65)',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '8px 12px', color: rankColor, fontWeight: globalRank <= 3 ? 900 : 700, borderRadius: isAr ? '0 10px 10px 0' : '10px 0 0 10px' }}>
                      {rankDisplay}
                    </td>

                    {/* Avatar + Player Name */}
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.photoUrl ? (
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              border: '1.5px solid #f59e0b',
                              backgroundImage: `url("${p.photoUrl}")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center 20%',
                              backgroundRepeat: 'no-repeat',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: '#1e293b',
                              border: '1px solid #f59e0b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fbbf24',
                              fontWeight: 900,
                              fontSize: '14px',
                              flexShrink: 0,
                            }}
                          >
                            {p.cardName?.charAt(0) || '11'}
                          </div>
                        )}
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                          {p.cardName}
                        </span>
                      </div>
                    </td>

                    {/* Overall Badge */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div
                        style={{
                          height: '24px',
                          padding: '0 10px',
                          background: ovrBg,
                          border: ovrBorder,
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 900, color: ovrColor }}>
                          {overall}
                        </span>
                      </div>
                    </td>

                    {/* Position Pill */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div
                        style={{
                          height: '22px',
                          padding: '0 10px',
                          backgroundColor: 'rgba(51, 65, 85, 0.85)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          borderRadius: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#cbd5e1' }}>
                          {p.primaryPosition || 'CMF'}
                        </span>
                      </div>
                    </td>

                    {/* Age */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#e2e8f0' }}>
                      {p.calculatedAge || 20}
                    </td>

                    {/* Preferred Foot */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>
                      {footLabel}
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div
                        style={{
                          height: '22px',
                          padding: '0 10px',
                          backgroundColor: p.isVerifiedByAdmin ? 'rgba(16, 185, 129, 0.18)' : 'rgba(148, 163, 184, 0.15)',
                          border: p.isVerifiedByAdmin ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(148, 163, 184, 0.3)',
                          borderRadius: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: p.isVerifiedByAdmin ? '#34d399' : '#94a3b8',
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </td>

                    {/* Career Goals */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '14px', fontWeight: 900, color: '#10b981' }}>
                      {pStats.goals || 0}
                    </td>

                    {/* Career Assists */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>
                      {pStats.assists || 0}
                    </td>

                    {/* Career MVP */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '14px', fontWeight: 900, color: '#fbbf24', borderRadius: isAr ? '10px 0 0 10px' : '0 10px 10px 0' }}>
                      {pStats.mvp || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(245, 158, 11, 0.25)',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 800,
            color: '#64748b',
          }}
        >
          <span>{isAr ? 'تم الإنشاء بواسطة منصة 11PLAYERS الرسمية للنخبة' : 'OFFICIAL 11PLAYERS ULTIMATE TEAM MASTER DIRECTORY • GENERATED High-Resolution PDF'}</span>
          <span style={{ color: '#f59e0b' }}>{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
        </div>
      </div>
    </div>
  );
}
