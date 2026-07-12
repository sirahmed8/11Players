import React from 'react';
import { PlayerProfile } from '@/types';

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
      className="w-[1123px] h-[794px] flex flex-col p-10 font-sans relative overflow-hidden rounded-3xl"
      style={{ boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      {/* Explicit solid colors for 100% html2canvas reliability */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '16px', backgroundColor: '#059669' }}></div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', backgroundColor: '#0f172a' }}></div>

      <div className="flex flex-row justify-between items-end border-b-2 border-slate-200 pb-4 mb-6 z-10 mt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {isAr ? 'دليل اللاعبين الشامل' : 'MASTER PLAYER DIRECTORY'}
          </h1>
          <p className="text-slate-500 font-bold mt-1 tracking-wider text-sm">
            {isAr ? '11PLAYERS تقرير القائمة النخبة' : '11PLAYERS ULTIMATE TEAM EXPORT'}
          </p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full font-bold text-sm tracking-wider">
          {isAr ? `صفحة ${pageIndex + 1} من ${totalPages}` : `PAGE ${pageIndex + 1} OF ${totalPages}`}
        </div>
      </div>

      <div className="flex-1 z-10">
        <table className="w-full text-left border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
              <th className={`py-3.5 px-4 font-bold ${isAr ? 'rounded-tr-2xl text-right' : 'rounded-tl-2xl text-left'}`}>
                {isAr ? 'الاسم' : 'Name'}
              </th>
              <th className="py-3.5 px-4 font-bold text-center">{isAr ? 'المركز' : 'POS'}</th>
              <th className="py-3.5 px-4 font-bold text-center">{isAr ? 'العمر' : 'Age'}</th>
              <th className="py-3.5 px-4 font-bold text-center">{isAr ? 'القدم' : 'Foot'}</th>
              <th className="py-3.5 px-4 font-bold text-center">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="py-3.5 px-4 font-bold text-center">{isAr ? 'الإنذارات' : 'Warn.'}</th>
              <th className="py-3.5 px-4 font-bold text-center">{isAr ? 'الأهداف' : 'Goals'}</th>
              <th className={`py-3.5 px-4 font-bold text-center ${isAr ? 'rounded-tl-2xl' : 'rounded-tr-2xl'}`}>
                {isAr ? 'التمريرات' : 'Asts'}
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-800 text-sm">
            {profiles.map((p, idx) => {
              const footLabel = isAr
                ? (p.preferredFoot === 'Left' ? 'يسرى' : 'يمنى')
                : (p.preferredFoot || 'Right');
              const statusLabel = isAr
                ? (p.isVerifiedByAdmin ? 'موثق' : 'عادي')
                : (p.isVerifiedByAdmin ? 'Verified' : 'Unverified');
              return (
                <tr
                  key={p.uid}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'} font-semibold`}
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/30 shadow-sm" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                        {p.cardName?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className="text-base text-slate-900 font-bold">{p.cardName}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block bg-slate-100 text-slate-800 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                      {p.primaryPosition || 'CMF'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{p.calculatedAge || 20}</td>
                  <td className="py-3 px-4 text-center text-slate-600">{footLabel}</td>
                  <td className="py-3 px-4 text-center">
                    {p.isVerifiedByAdmin ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {statusLabel}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {statusLabel}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.hasWarning ? (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {isAr ? 'إنذار' : 'Warning'}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">{p.stats?.goals || 0}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{p.stats?.assists || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs text-slate-400 font-semibold z-10">
        <span>{isAr ? 'تم الإنشاء بواسطة منصة 11PLAYERS' : 'GENERATED BY 11PLAYERS PLATFORM'}</span>
        <span>{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
      </div>
    </div>
  );
}
