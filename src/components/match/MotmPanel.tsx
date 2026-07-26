"use client";

import React from "react";
import Image from "next/image";
import { Download, Sparkles } from "lucide-react";

interface MotmPanelProps {
  aiMotm?: any;
  recordedStats?: any;
  teamA?: any[];
  teamB?: any[];
  turfResult?: any;
  isAr: boolean;
}

export default function MotmPanel({
  aiMotm,
  recordedStats,
  teamA = [],
  teamB = [],
  turfResult,
  isAr,
}: MotmPanelProps) {
  const motm = aiMotm || (() => {
    let best: any = null;
    let max = -999;
    const all = [
      ...teamA,
      ...teamB,
      ...(turfResult?.teams || []).flatMap((t: any) => t.players || [])
    ];
    all.forEach((p: any) => {
      if (!p || !p.uid) return;
      const st = recordedStats?.[p.uid] || { goals: 0, assists: 0, mvp: false };
      const sc = (Number(st.goals || 0) * 4) + (Number(st.assists || 0) * 2.5) + (st.mvp ? 6 : 0) + ((Number(p.overallRating) || 70) * 0.15);
      if (sc > max) {
        max = sc;
        best = {
          uid: p.uid,
          name: p.cardName || p.fullName,
          photoUrl: p.photoUrl,
          score: Math.round(sc * 10) / 10,
          goals: st.goals || 0,
          assists: st.assists || 0,
          reasonEn: `AI selection based on match rating (${p.overallRating || 75} OVR) & performance.`,
          reasonAr: `اختيار الذكاء الاصطناعي بناءً على التقييم العام (${p.overallRating || 75} OVR) والإحصائيات.`
        };
      }
    });
    return best;
  })();

  if (!motm) return null;

  const handleExportGraphic = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('motm-banner-export');
      if (!el) return;
      const btn = el.querySelector('#motm-export-btn') as HTMLElement;
      if (btn) btn.style.display = 'none';
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      if (btn) btn.style.display = '';
      const link = document.createElement('a');
      link.download = `${motm.name.replace(/\s+/g, '_')}_MOTM.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export MOTM graphic', err);
    }
  };

  return (
    <div
      id="motm-banner-export"
      className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
    >
      <div className="flex items-center gap-5 z-10">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border-2 border-amber-400 shadow-xl overflow-hidden flex items-center justify-center shrink-0 text-3xl font-black text-amber-400">
            {motm.photoUrl ? (
              <Image src={motm.photoUrl} alt={motm.name} className="w-full h-full object-cover" width={96} height={96} />
            ) : (
              motm.name?.slice(0, 2).toUpperCase() || '🌟'
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-black border border-amber-400 shadow">
            MOTM
          </div>
        </div>
        <div className="space-y-1 text-center sm:text-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-950 text-amber-400 border border-slate-800">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{isAr ? "نجم المباراة (AI MOTM)" : "AI Man of the Match"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {motm.name}
          </h3>
          <p className="text-xs font-bold text-slate-300 max-w-xl">
            {isAr ? motm.reasonAr : motm.reasonEn}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 shrink-0 z-10">
        <div className="text-center">
          <span className="block text-[9px] font-black uppercase text-slate-400">{isAr ? "نقاط الذكاء" : "AI Score"}</span>
          <span className="text-xl font-black font-mono text-amber-400">{motm.score || '9.5'}</span>
        </div>
        {motm.goals !== undefined && (
          <>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="block text-[9px] font-black uppercase text-slate-400">{isAr ? "أهداف" : "Goals"}</span>
              <span className="text-lg font-black font-mono text-emerald-400">{motm.goals}</span>
            </div>
          </>
        )}
        {motm.assists !== undefined && (
          <>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <span className="block text-[9px] font-black uppercase text-slate-400">{isAr ? "صناعة" : "Assists"}</span>
              <span className="text-lg font-black font-mono text-cyan-400">{motm.assists}</span>
            </div>
          </>
        )}
      </div>

      {/* Export MVP Graphic Button */}
      <button
        type="button"
        onClick={handleExportGraphic}
        id="motm-export-btn"
        className="absolute top-4 left-4 p-2 bg-slate-950 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors border border-slate-800 z-20"
        title={isAr ? "تصدير صورة النجم" : "Export Graphic"}
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}
