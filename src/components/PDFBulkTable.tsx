import React from 'react';
import { PlayerProfile } from '@/types';

interface Props {
  profiles: PlayerProfile[];
  pageIndex: number;
  totalPages: number;
}

export default function PDFBulkTable({ profiles, pageIndex, totalPages }: Props) {
  return (
    <div
      id="pdf-bulk-table"
      className="w-[1123px] h-[794px] flex flex-col p-10 font-sans relative overflow-hidden"
      style={{ boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      {/* Explicit solid colors for 100% html2canvas reliability */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '16px', backgroundColor: '#059669' }}></div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', backgroundColor: '#0f172a' }}></div>

      <div className="flex flex-row justify-between items-end border-b-2 border-slate-200 pb-4 mb-6 z-10 mt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">MASTER PLAYER DIRECTORY</h1>
          <p className="text-slate-500 font-bold mt-1 tracking-wider text-sm">11PLAYERS ULTIMATE TEAM EXPORT</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full font-bold text-sm tracking-wider">
          PAGE {pageIndex + 1} OF {totalPages}
        </div>
      </div>

      <div className="flex-1 z-10">
        <table className="w-full text-left border-collapse" dir="rtl">
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
              <th className="py-3.5 px-4 font-bold rounded-tr-xl">Name (الاسم)</th>
              <th className="py-3.5 px-4 font-bold text-center">POS</th>
              <th className="py-3.5 px-4 font-bold text-center">Age</th>
              <th className="py-3.5 px-4 font-bold text-center">Foot</th>
              <th className="py-3.5 px-4 font-bold text-center">Status</th>
              <th className="py-3.5 px-4 font-bold text-center">Warn.</th>
              <th className="py-3.5 px-4 font-bold text-center">Goals</th>
              <th className="py-3.5 px-4 font-bold text-center rounded-tl-xl">Asts</th>
            </tr>
          </thead>
          <tbody className="text-slate-800 text-sm">
            {profiles.map((p, idx) => (
              <tr
                key={p.uid}
                className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'} font-semibold`}
              >
                <td className="py-3 px-4 flex items-center gap-3">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/30 shadow-sm" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">{p.cardName.charAt(0)}</div>
                  )}
                  <span className="text-base text-slate-900 font-bold">{p.cardName}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-black">{p.primaryPosition}</span>
                </td>
                <td className="py-3 px-4 text-center font-bold">{p.calculatedAge}</td>
                <td className="py-3 px-4 text-center font-bold">{p.preferredFoot === 'Right' ? 'Right' : p.preferredFoot === 'Left' ? 'Left' : 'Both'}</td>
                <td className="py-3 px-4 text-center">
                  {p.isVerifiedByAdmin ? (
                    <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[11px] font-bold">VERIFIED</span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-bold">PENDING</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {p.hasWarning ? (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[11px] font-bold">WARNING</span>
                  ) : (
                    <span className="text-slate-400 font-bold">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-emerald-600 font-black text-base">{p.stats?.goals || 0}</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-black text-base">{p.stats?.assists || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center text-xs text-slate-400 font-bold z-10 uppercase tracking-widest border-t border-slate-100 pt-3">
        <span>11PLAYERS ULTIMATE TEAM</span>
        <span>Generated on {new Date().toLocaleDateString('en-GB')}</span>
      </div>
    </div>
  );
}
