import React from 'react';

const PITCH_COORDS: Record<string, {x:number;y:number}> = {
  GK:  {x:50,y:88}, LB:{x:15,y:70}, CB:{x:35,y:70},
  RB:  {x:85,y:70}, DMF:{x:50,y:55}, LMF:{x:20,y:45},
  CMF: {x:50,y:45}, RMF:{x:80,y:45}, AMF:{x:50,y:30},
  LWF: {x:18,y:18}, RWF:{x:82,y:18}, CF:{x:50,y:10}, SS:{x:50,y:18},
};

export const renderMiniPitch = (team: any[], color: string, formation?: string) => {
  return (
    <div
      className="relative w-full rounded-b-none border-b border-emerald-600/40"
      style={{
        background: 'repeating-linear-gradient(180deg,rgba(34,197,94,0.18) 0 16.66%,rgba(22,163,74,0.22) 16.66% 33.33%)',
        paddingTop: '65%',
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-16 h-16 rounded-full border border-white/20" style={{bottom:'-32px'}}/>
        <div className="absolute left-1/4 right-1/4 bottom-0 h-[15%] border-t border-x border-white/20"/>
        <div className="absolute left-1/3 right-1/3 top-0 h-[10%] border-b border-x border-white/20"/>
      </div>

      {(() => {
        const rowGroups: Record<number, any[]> = {};
        team.forEach((p: any, i: number) => {
          const pos = p.assignedPosition || p.primaryPosition || 'CMF';
          const coords = PITCH_COORDS[pos] || {x:50,y:50};
          if (!rowGroups[coords.y]) rowGroups[coords.y] = [];
          rowGroups[coords.y].push({ ...p, originalX: coords.x, originalIndex: i, pos, coords });
        });

        const renderList: any[] = [];
        Object.values(rowGroups).forEach(group => {
          group.sort((a, b) => a.originalX - b.originalX);
          const n = group.length;
          group.forEach((p, index) => {
            let x = 50;
            if (n > 1) {
              const minX = 15;
              const maxX = 85;
              x = minX + ((maxX - minX) / (n - 1)) * index;
            }
            renderList.push({ ...p, calculatedX: x });
          });
        });

        return renderList.map((p: any) => {
          const pos = p.pos;
          const y = p.coords.y * 0.7 + 5; 
          const ovr = Math.round(
            (Object.values(p.attributes || {}) as number[]).reduce((a: number, b: number) => a + b, 0) / 
            Math.max(1, Object.values(p.attributes || {}).length)
          ) || 70;
          const name = (p.cardName || p.fullName || '?').split(' ')[0];
          
          return (
            <div
              key={p.uid || p.originalIndex}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group transition-all duration-300"
              style={{left:`${p.calculatedX}%`, top:`${y}%`}}
            >
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-[9px] sm:text-[10px] text-white shadow-lg border-2 border-white/80 transition-transform group-hover:scale-110"
              style={{backgroundColor: color, boxShadow:`0 2px 8px ${color}55`}}
            >
              {ovr}
            </div>
            <div className="mt-0.5 px-1 py-0.5 rounded-[4px] bg-slate-900/80 text-white text-[6px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
              {pos}
            </div>
            <div className="mt-0.5 text-[6px] font-bold text-white bg-slate-800/70 px-1 rounded truncate max-w-[40px] text-center leading-tight">
              {name}
            </div>
          </div>
        );
      })})()}
    </div>
  );
};
