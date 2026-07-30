'use client';

import React, { useRef, useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import { microSpringButtonProps } from '@/lib/animations';
import { 
  Download, 
  Trophy, 
  Star, 
  Calendar, 
  Award, 
  Sparkles, 
  Globe, 
  Flame, 
  Check, 
  Newspaper,
  Layers
} from 'lucide-react';

// ── Interfaces & Types ──────────────────────────────────────────────────────

export interface MatchResultData {
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  matchType?: string;
  isComeback?: boolean;
  isPenaltyShootout?: boolean;
  isCleanSheet?: boolean;
  motm?: {
    name: string;
    photoUrl?: string;
    rating: number; // e.g. 9.4
    goals: number;
    assists: number;
    keyPasses?: number;
    tackles?: number;
  };
  lineupA?: string[];
  lineupB?: string[];
  venue?: string;
  date?: string;
}

export interface NewspaperHeadline {
  mainHeadline: { en: string; ar: string };
  subHeader: { en: string; ar: string };
  tagline: { en: string; ar: string };
  articleSummary: { en: string; ar: string };
  editionNumber: string;
  dateString: string;
}

// ── Headline Generator Function (Exported for Unit Tests) ─────────────────

export function generateNewspaperHeadline(data: MatchResultData): NewspaperHeadline {
  const { scoreA, scoreB, teamAName, teamBName, matchType, isComeback, isCleanSheet } = data;
  const totalGoals = scoreA + scoreB;
  const goalDiff = Math.abs(scoreA - scoreB);
  const winner = scoreA > scoreB ? teamAName : scoreB > scoreA ? teamBName : null;

  let mainEn = 'CLUTCH MATCH TRIUMPH';
  let mainAr = 'انتصار حاسم ومواجهة ملحمية';

  let subEn = `${winner || 'Both teams'} delivered a sensational performance in a thrilling contest.`;
  let subAr = `قدم ${winner || 'الفريقان'} أداءً استثنائياً في مباراة حابسة للأنفاس.`;

  let tagEn = 'HAGOOZAT ELITE MATCHDAY SPECIAL';
  let tagAr = 'تغطية خاصة لليلة المباراة من الحجوزات';

  if (scoreA === scoreB) {
    mainEn = 'HONORS EVEN IN EPIC CLASH';
    mainAr = 'تعادل مثير وخارج التوقعات';
    subEn = `A hard-fought ${scoreA}-${scoreB} stalemate leaving both sides sharing the points.`;
    subAr = `مباراة طاحنة تنتهي بالتعادل ${scoreA}-${scoreB} وتقاسم النقاط بين الفريقين.`;
  } else if (isComeback) {
    mainEn = 'UNBELIEVABLE COMEBACK DRAMA';
    mainAr = 'ريمونتادا خيالية تزلزل الملعب';
    subEn = `${winner} orchestrates a legendary turn-around to snatch victory from the jaws of defeat!`;
    subAr = `${winner} يقلب الطاولة بريمونتادا خيالية وينتزع الفوز من فم الأسد!`;
  } else if (goalDiff >= 3) {
    mainEn = 'TACTICAL MASTERCLASS';
    mainAr = 'عاصفة تكتيكية وفوز ساحق';
    subEn = `${winner} dominates the pitch with a crushing ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)} victory.`;
    subAr = `${winner} يكتسح الملعب بعرض تكتيكي مبهر ونتيجة ثقيلة ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`;
  } else if (totalGoals >= 5) {
    mainEn = 'THRILLING GOAL FESTIVAL';
    mainAr = 'مهرجان أهداف ودقائق مجنونة';
    subEn = `Spectators left in awe as ${scoreA + scoreB} goals shatter the net in a high-octane battle!`;
    subAr = `${totalGoals} أهداف تزلزل الشباك في سهرة كروية ممتعة وجنون هجومي!`;
  } else if (matchType?.toLowerCase().includes('derby') || matchType?.toLowerCase().includes('final')) {
    mainEn = 'DERBY TRIUMPH & GLORY';
    mainAr = 'انتصار ديربي حاسم ومجد كروي';
    subEn = `${winner} reigns supreme in the high-stakes clash to claim bragging rights!`;
    subAr = `${winner} يحسم ليلة الديربي ويكتب اسمه بحروف من ذهب!`;
  }

  const winnerStr = winner ? `${winner} (${Math.max(scoreA, scoreB)})` : `${teamAName} & ${teamBName}`;
  const loserStr = winner ? (winner === teamAName ? teamBName : teamAName) : '';

  const articleEn = winner
    ? `In an electrifying showdown at ${data.venue || 'The Elite Arena'}, ${winnerStr} secured a memorable ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)} victory over ${loserStr}. ${data.motm ? `${data.motm.name} stole the spotlight with a spectacular rating of ${data.motm.rating}, scoring ${data.motm.goals} goals.` : 'The tactical execution and relentless pressing defined the high-intensity tempo throughout 90 minutes.'}`
    : `A thrilling encounter ended with ${teamAName} and ${teamBName} locked at ${scoreA}-${scoreB}. Both managers utilized aggressive tactical setups, keeping fans on the edge of their seats until the final whistle.`;

  const articleAr = winner
    ? `في مواجهة نارية شهدها ملعب ${data.venue || 'الساحة الملكية'}، نجح ${winnerStr} في تحقيق فوز ثمين بنتيجة ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)} على حسابه منافسه ${loserStr}. ${data.motm ? `وكان النجم ${data.motm.name} رجل المباراة الأول بتقييم ${data.motm.rating} بعد تسجيله ${data.motm.goals} اهداف.` : 'وشهدت المباراة انضباطاً تكتيكياً ورغبة عارمة في تحقيق الفوز منذ الدقائق الأولى.'}`
    : `انتهت القمة الكروية المثيرة بين ${teamAName} و ${teamBName} بالتعادل الإيجابي ${scoreA}-${scoreB}. وقدم الفريقان مباراة تكتيكية عالية الإيقاع حبست أنفاس الجماهير حتى الصفارة الأخيرة.`;

  return {
    mainHeadline: { en: mainEn, ar: mainAr },
    subHeader: { en: subEn, ar: subAr },
    tagline: { en: tagEn, ar: tagAr },
    articleSummary: { en: articleEn, ar: articleAr },
    editionNumber: `#${(Math.abs([...(`${data.teamAName}${data.teamBName}${data.date || ''}`)]
      .reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 9000) + 1000}`,
    dateString: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

// ── Component Props ────────────────────────────────────────────────────────

export interface SportsNewspaperCoverProps {
  matchData?: MatchResultData;
  className?: string;
}

// ── Default Match Data ─────────────────────────────────────────────────────

export const DEFAULT_MATCH_DATA: MatchResultData = {
  teamAName: 'Team Alpha',
  teamBName: 'Team Bravo',
  scoreA: 3,
  scoreB: 2,
  matchType: 'Derby',
  isComeback: true,
  venue: 'Hagoozat Turf Pitch',
  date: 'JULY 27, 2026',
  motm: {
    name: 'Captain MOTM',
    photoUrl: '',
    rating: 9.2,
    goals: 2,
    assists: 1,
    keyPasses: 3,
    tackles: 2
  },
  lineupA: ['Player 1 (GK)', 'Player 2 (RB)', 'Player 3 (CB)', 'Player 4 (CB)', 'Player 5 (LB)', 'Player 6 (DMF)', 'Player 7 (CMF)'],
  lineupB: ['Player 8 (GK)', 'Player 9 (RB)', 'Player 10 (CB)', 'Player 11 (CB)', 'Player 12 (LB)', 'Player 13 (DMF)', 'Player 14 (CMF)']
};

export const SportsNewspaperCover: React.FC<SportsNewspaperCoverProps> = ({
  matchData = DEFAULT_MATCH_DATA,
  className = ''
}) => {
  const newspaperRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [theme, setTheme] = useState<'retro' | 'modern'>('retro');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const headline = useMemo(() => generateNewspaperHeadline(matchData), [matchData]);

  const handleDownloadPNG = async () => {
    if (!newspaperRef.current) return;
    try {
      setIsExporting(true);
      setExportSuccess(false);

      const canvas = await html2canvas(newspaperRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === 'retro' ? '#f4eedd' : '#0f172a',
        logging: false
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `hagoozat-daily-${matchData.teamAName.replace(/\s+/g, '_')}-vs-${matchData.teamBName.replace(/\s+/g, '_')}.png`;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export newspaper cover canvas:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* ── Controls Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
        <div className="flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-amber-400" />
          <h3 className="font-extrabold text-base text-white">
            {lang === 'ar' ? 'مولّد الغلاف الصحفي الرياضي' : 'Retro Sports Press Generator'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Theme Selector */}
          <motion.button
            whileHover={microSpringButtonProps.whileHover}
            whileTap={microSpringButtonProps.whileTap}
            transition={microSpringButtonProps.transition}
            onClick={() => setTheme(prev => (prev === 'retro' ? 'modern' : 'retro'))}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{theme === 'retro' ? 'Vintage Newsprint 📜' : 'Dark Cyber Edition ⚡'}</span>
          </motion.button>

          {/* Language Switch */}
          <motion.button
            whileHover={microSpringButtonProps.whileHover}
            whileTap={microSpringButtonProps.whileTap}
            transition={microSpringButtonProps.transition}
            onClick={() => setLang(prev => (prev === 'en' ? 'ar' : 'en'))}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'العربية 🇪🇬' : 'English 🇬🇧'}
          </motion.button>

          {/* Export PNG Button */}
          <motion.button
            whileHover={microSpringButtonProps.whileHover}
            whileTap={microSpringButtonProps.whileTap}
            transition={microSpringButtonProps.transition}
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-extrabold text-xs text-slate-950 shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>{lang === 'ar' ? 'تم التحميل!' : 'Downloaded!'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? (lang === 'ar' ? 'جاري التصدير...' : 'Exporting...') : (lang === 'ar' ? 'تحميل صورة PNG' : 'Download PNG Cover')}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Newspaper Canvas Reference Node ── */}
      <div
        ref={newspaperRef}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className={`p-6 sm:p-10 rounded-2xl shadow-2xl transition-colors duration-300 ${
          theme === 'retro'
            ? 'bg-[#f4eedd] text-[#1c1815] border-4 border-[#3a3028] font-serif'
            : 'bg-slate-950 text-slate-100 border-4 border-slate-800 font-sans'
        }`}
      >
        {/* Newspaper Top Bar */}
        <div className={`flex flex-col sm:flex-row items-center justify-between pb-4 mb-4 border-b-2 ${
          theme === 'retro' ? 'border-[#3a3028]' : 'border-slate-800'
        }`}>
          <div className="text-xs uppercase font-bold tracking-wider">
            {headline.editionNumber} • {headline.dateString}
          </div>
          <div className="text-xs font-black tracking-widest uppercase text-amber-600 dark:text-amber-400 my-1 sm:my-0">
            ★ {headline.tagline[lang]} ★
          </div>
          <div className="text-xs uppercase font-bold tracking-wider">
            {lang === 'ar' ? 'طبعة خاصة • مجاناً' : 'SPECIAL EDITION • PRICE: FREE'}
          </div>
        </div>

        {/* Newspaper Masthead Title */}
        <div className="text-center py-2 border-b-4 border-double border-current mb-6">
          <h1 className={`text-4xl sm:text-6xl font-black uppercase tracking-tighter ${
            theme === 'retro' ? 'font-serif text-[#110e0b]' : 'font-sans text-amber-400 drop-shadow-md'
          }`}>
            {lang === 'ar' ? 'صحيفة الحجوزات اليومية' : 'HAGOOZAT DAILY'}
          </h1>
          <p className="text-xs uppercase tracking-widest mt-1 opacity-80 font-bold">
            {lang === 'ar' ? 'الصحيفة الرياضية الرقمية الأولى لكرة القدم' : 'THE PREMIER FOOTBALL POST-MATCH JOURNAL'}
          </p>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight leading-none mb-3">
            {headline.mainHeadline[lang]}
          </h2>
          <p className="text-sm sm:text-base italic max-w-2xl mx-auto font-medium opacity-90">
            "{headline.subHeader[lang]}"
          </p>
        </div>

        {/* Match Result Score Banner */}
        <div className={`p-4 rounded-xl mb-8 flex items-center justify-around border-2 ${
          theme === 'retro' 
            ? 'bg-[#e8dec7] border-[#3a3028]' 
            : 'bg-slate-900 border-amber-500/40 text-amber-300'
        }`}>
          <div className="text-center flex-1">
            <h3 className="text-lg sm:text-2xl font-black">{matchData.teamAName}</h3>
          </div>

          <div className="px-6 py-2 rounded-lg bg-black/10 dark:bg-slate-800 font-black text-3xl sm:text-4xl tracking-wider text-amber-600 dark:text-amber-400">
            {matchData.scoreA} - {matchData.scoreB}
          </div>

          <div className="text-center flex-1">
            <h3 className="text-lg sm:text-2xl font-black">{matchData.teamBName}</h3>
          </div>
        </div>

        {/* Content Body: MOTM Spotlight + Article Writeup */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* MOTM Spotlight (5 Cols) */}
          {matchData.motm && (
            <div className={`md:col-span-5 p-5 rounded-xl border-2 flex flex-col justify-between ${
              theme === 'retro' ? 'bg-[#ede3ce] border-[#3a3028]' : 'bg-slate-900/80 border-amber-500/30'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold uppercase rounded bg-amber-500 text-slate-950">
                    ★ MOTM SPOTLIGHT
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span className="text-sm font-black">{matchData.motm.rating}/10</span>
                  </div>
                </div>

                <div className="text-center my-4">
                  <div className="w-24 h-24 mx-auto rounded-full border-4 border-amber-500/50 bg-black/20 flex items-center justify-center font-black text-2xl overflow-hidden mb-2">
                    {matchData.motm.photoUrl ? (
                      <img src={matchData.motm.photoUrl} alt={matchData.motm.name} className="w-full h-full object-cover" />
                    ) : (
                      matchData.motm.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <h4 className="text-xl font-black">{matchData.motm.name}</h4>
                  <span className="text-xs uppercase font-bold opacity-75">Man of the Match</span>
                </div>
              </div>

              {/* Stat Box */}
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-current/20">
                <div className="p-2 rounded bg-black/5 dark:bg-slate-800">
                  <span className="text-lg font-black block">{matchData.motm.goals}</span>
                  <span className="text-[10px] uppercase font-bold">{lang === 'ar' ? 'أهداف' : 'Goals'}</span>
                </div>
                <div className="p-2 rounded bg-black/5 dark:bg-slate-800">
                  <span className="text-lg font-black block">{matchData.motm.assists}</span>
                  <span className="text-[10px] uppercase font-bold">{lang === 'ar' ? 'تمريرات' : 'Assists'}</span>
                </div>
                <div className="p-2 rounded bg-black/5 dark:bg-slate-800">
                  <span className="text-lg font-black block">{matchData.motm.keyPasses || 3}</span>
                  <span className="text-[10px] uppercase font-bold">{lang === 'ar' ? 'صناعة' : 'Passes'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Article Commentary Summary (7 Cols) */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-extrabold uppercase border-b-2 border-current pb-1 mb-3">
                {lang === 'ar' ? 'التقرير الفني والميداني' : 'MATCH ANALYSIS REPORT'}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-justify mb-4 opacity-95">
                {headline.articleSummary[lang]}
              </p>
            </div>

            {/* Tactical Takeaway Banner */}
            <div className={`p-3 rounded-lg border italic text-xs ${
              theme === 'retro' ? 'bg-[#e2d6be] border-[#3a3028]' : 'bg-slate-900 border-slate-800'
            }`}>
              <span className="font-bold not-italic text-amber-600 dark:text-amber-400 block mb-0.5">
                {lang === 'ar' ? 'ملاحظة المحرر التكتيكي:' : 'Tactical Editor Note:'}
              </span>
              "{lang === 'ar' ? 'حسمت المباراة من خلال السيطرة على خط الوسط والتحولات السريعة عند فقدان الكرة.' : 'Match was decided through high pressing dominance and rapid transition counters.'}"
            </div>
          </div>
        </div>

        {/* Starting XI Line-up Box */}
        {(matchData.lineupA || matchData.lineupB) && (
          <div className={`pt-4 border-t-2 border-current ${
            theme === 'retro' ? 'border-[#3a3028]' : 'border-slate-800'
          }`}>
            <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-center">
              {lang === 'ar' ? 'التشكيلة الأساسية للفريقين' : 'MATCHDAY STARTING LINEUPS'}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold block border-b border-current/30 pb-0.5 mb-1">{matchData.teamAName}</span>
                <p className="opacity-80 leading-tight">
                  {(matchData.lineupA || []).slice(0, 7).join(' • ')}
                </p>
              </div>
              <div>
                <span className="font-bold block border-b border-current/30 pb-0.5 mb-1">{matchData.teamBName}</span>
                <p className="opacity-80 leading-tight">
                  {(matchData.lineupB || []).slice(0, 7).join(' • ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Barcode */}
        <div className="mt-6 pt-3 border-t border-current/20 flex items-center justify-between text-[10px] opacity-75">
          <span>HAGOOZAT FOOTBALL MEDIA PRESS • ALL RIGHTS RESERVED</span>
          <span className="font-mono tracking-widest font-bold">||||| || ||| |||| || |||||</span>
        </div>
      </div>
    </div>
  );
};

export default SportsNewspaperCover;
