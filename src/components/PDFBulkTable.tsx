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
      className="w-[1123px] h-[794px] bg-slate-50 flex flex-col p-10 font-sans shadow-2xl relative overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>

      <div className="flex flex-row justify-between items-end border-b-4 border-emerald-500 pb-4 mb-6 z-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">MASTER PLAYER DIRECTORY</h1>
          <p className="text-slate-500 font-medium mt-1">11PLAYERS ULTIMATE TEAM EXPORT</p>
        </div>
        <div className="text-emerald-600 font-bold text-lg">
          PAGE {pageIndex + 1} OF {totalPages}
        </div>
      </div>

      <div className="flex-1 z-10">
        <table className="w-full text-left border-collapse" dir="rtl">
          <thead>
            <tr className="bg-slate-900 text-white text-sm uppercase tracking-wider">
              <th className="py-3 px-4 font-bold rounded-tr-xl">Name (الاسم)</th>
              <th className="py-3 px-4 font-bold text-center">POS</th>
              <th className="py-3 px-4 font-bold text-center">Age</th>
              <th className="py-3 px-4 font-bold text-center">Foot</th>
              <th className="py-3 px-4 font-bold text-center">Ver.</th>
              <th className="py-3 px-4 font-bold text-center">Warn.</th>
              <th className="py-3 px-4 font-bold text-center">Goals</th>
              <th className="py-3 px-4 font-bold text-center rounded-tl-xl">Asts</th>
            </tr>
          </thead>
          <tbody className="text-slate-800">
            {profiles.map((p, idx) => (
              <tr
                key={p.uid}
                className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} font-semibold`}
              >
                <td className="py-2.5 px-4 flex items-center gap-3">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-300" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs">{p.cardName.charAt(0)}</div>
                  )}
                  <span className="text-base text-slate-900">{p.cardName}</span>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">{p.primaryPosition}</span>
                </td>
                <td className="py-2.5 px-4 text-center">{p.calculatedAge}</td>
                <td className="py-2.5 px-4 text-center text-sm">{p.preferredFoot === 'Right' ? 'R' : p.preferredFoot === 'Left' ? 'L' : 'A'}</td>
                <td className="py-2.5 px-4 text-center">{p.isVerifiedByAdmin ? '✅' : '❌'}</td>
                <td className="py-2.5 px-4 text-center">{p.hasWarning ? '⚠️' : '-'}</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">{p.stats?.goals || 0}</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">{p.stats?.assists || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-center text-xs text-slate-400 font-medium z-10 uppercase tracking-widest">
        Generated on {new Date().toLocaleDateString('en-GB')}
      </div>
    </div>
  );
}
