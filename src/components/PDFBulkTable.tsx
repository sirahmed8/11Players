import React from 'react';
import { PlayerProfile } from '@/types';
import { calculateRealisticOverall } from '@/lib/overallCalculator';
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
        backgroundColor: '#070b14',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '32px',
        border: '3px solid #f59e0b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Ambient Corner Glows */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      {/* Outer Golden Inner Frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '2px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '24px',
          padding: '20px 24px',
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
            borderBottom: '2px solid rgba(245, 158, 11, 0.35)',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', letterSpacing: '2px' }}>
              11PLAYERS
            </span>
            <div
              style={{
                height: '24px',
                padding: '0 14px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', letterSpacing: '1px', transform: 'translateY(-2.5px)' }}>
                {isAr ? 'قائمة النخبة الرسمية' : 'ULTIMATE TEAM ROSTER'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>
              {isAr ? 'موسم 2026' : 'SEASON 2026'}
            </span>
            <div
              style={{
                height: '26px',
                padding: '0 16px',
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24', letterSpacing: '1px', transform: 'translateY(-2.5px)' }}>
                {isAr ? `صفحة ${pageIndex + 1} من ${totalPages}` : `PAGE ${pageIndex + 1} OF ${totalPages}`}
              </span>
            </div>
          </div>
        </div>

        {/* Master Roster Table */}
        <div style={{ flex: 1, marginTop: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '12px 14px', textAlign: isAr ? 'right' : 'left', borderRadius: isAr ? '0 12px 12px 0' : '12px 0 0 12px' }}>
                  #
                </th>
                <th style={{ padding: '12px 14px', textAlign: isAr ? 'right' : 'left' }}>
                  {isAr ? 'اللاعب' : 'PLAYER'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {isAr ? 'التقييم' : 'OVR'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {isAr ? 'المركز' : 'POS'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {isAr ? 'العمر' : 'AGE'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {isAr ? 'القدم' : 'FOOT'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {isAr ? 'الحالة' : 'STATUS'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {isAr ? 'أهداف' : 'GOALS'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  {isAr ? 'تمريرات' : 'ASTS'}
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center', borderRadius: isAr ? '12px 0 0 12px' : '0 12px 12px 0' }}>
                  {isAr ? 'أفضل لاعب' : 'MVP'}
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, idx) => {
                const activeAttributes = p.approvedAttributes || p.attributes || {
                  speed: 70, acceleration: 70, finishing: 65, kickingPower: 70,
                  offensiveAwareness: 68, lowPass: 72, loftedPass: 70,
                  dribbling: 72, ballControl: 74, balance: 70,
                  defensiveAwareness: 60, ballWinning: 62, heading: 65,
                  physicalContact: 68, stamina: 75, jump: 68
                };

                const overall = getPlayerOverall(p);

                const footLabel = isAr
                  ? (p.preferredFoot === 'Left' ? 'يسرى' : 'يمنى')
                  : (p.preferredFoot || 'Right');

                const statusLabel = isAr
                  ? (p.isVerifiedByAdmin ? 'موثق' : 'عادي')
                  : (p.isVerifiedByAdmin ? 'Verified' : 'Member');

                const pStats = p.stats || { goals: 0, assists: 0, mvp: 0 };

                return (
                  <tr
                    key={p.uid || idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'rgba(30, 41, 59, 0.75)' : 'rgba(15, 23, 42, 0.75)',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <td style={{ padding: '10px 14px', color: '#94a3b8', borderRadius: isAr ? '0 12px 12px 0' : '12px 0 0 12px' }}>
                      {pageIndex * 15 + idx + 1}
                    </td>

                    {/* Avatar + Player Name */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {p.photoUrl ? (
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              border: '2px solid #f59e0b',
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
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              backgroundColor: '#1e293b',
                              border: '1px solid #f59e0b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fbbf24',
                              fontWeight: 900,
                              fontSize: '15px',
                              flexShrink: 0,
                            }}
                          >
                            {p.cardName?.charAt(0) || '11'}
                          </div>
                        )}
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                          {p.cardName}
                        </span>
                      </div>
                    </td>

                    {/* Overall Badge */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div
                        style={{
                          height: '24px',
                          padding: '0 10px',
                          backgroundColor: 'rgba(245, 158, 11, 0.22)',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', transform: 'translateY(-2.5px)' }}>
                          {overall}
                        </span>
                      </div>
                    </td>

                    {/* Position Pill */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div
                        style={{
                          height: '22px',
                          padding: '0 10px',
                          backgroundColor: 'rgba(51, 65, 85, 0.8)',
                          borderRadius: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#cbd5e1', transform: 'translateY(-2.5px)' }}>
                          {p.primaryPosition || 'CMF'}
                        </span>
                      </div>
                    </td>

                    {/* Age */}
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#e2e8f0' }}>
                      {p.calculatedAge || 20}
                    </td>

                    {/* Preferred Foot */}
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94a3b8' }}>
                      {footLabel}
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div
                        style={{
                          height: '24px',
                          padding: '0 12px',
                          backgroundColor: p.isVerifiedByAdmin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                          border: p.isVerifiedByAdmin ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(148, 163, 184, 0.3)',
                          borderRadius: '12px',
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
                            transform: 'translateY(-2.5px)',
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </td>

                    {/* Career Goals */}
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '15px', fontWeight: 900, color: '#10b981' }}>
                      {pStats.goals || 0}
                    </td>

                    {/* Career Assists */}
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '15px', fontWeight: 900, color: '#38bdf8' }}>
                      {pStats.assists || 0}
                    </td>

                    {/* Career MVP */}
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '15px', fontWeight: 900, color: '#fbbf24', borderRadius: isAr ? '12px 0 0 12px' : '0 12px 12px 0' }}>
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
            paddingTop: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 800,
            color: '#64748b',
          }}
        >
          <span>{isAr ? 'تم الإنشاء بواسطة منصة 11PLAYERS الرسمية' : 'OFFICIAL 11PLAYERS ULTIMATE TEAM MASTER DIRECTORY'}</span>
          <span style={{ color: '#f59e0b' }}>{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
        </div>
      </div>
    </div>
  );
}
