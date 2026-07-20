"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { getPlayerAchievements } from "@/lib/achievements";
import ProtectedRoute from "@/components/ProtectedRoute";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";
import Link from "next/link";
import { Trophy, Target, Handshake, Star, Sparkles, ShieldCheck } from "lucide-react";

export default function AchievementsPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const ref = doc(db, "players", user.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      const data = snap.data();
      setPlayer({ uid: snap.id, ...data, attributes: data.attributes || {}, stats: data.stats || {} } as PlayerProfile);
      setLoading(false);
    }, async () => {
      setLoading(false);
      try {
        const fallbackSnap = await getDoc(ref);
        if (fallbackSnap.exists()) {
          const data = fallbackSnap.data();
          setPlayer({ uid: fallbackSnap.id, ...data, attributes: data.attributes || {}, stats: data.stats || {} } as PlayerProfile);
        }
      } catch (error) {
        console.error(error);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (!user) {
    return null;
  }

  if (loading) {
    return <SiteSkeletonLoader variant="profile" />;
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-3xl font-black">{isAr ? "ملف اللاعب غير متوفر" : "Player profile not found"}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm text-center max-w-xl">
          {isAr
            ? "يجب أن تنشئ ملف لاعب أولاً حتى تتمكن من عرض إنجازاتك وسجل الجوائز."
            : "You need to create your player profile first to view achievements and awards."}
        </p>
        <Link href="/onboarding" className="mt-6 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 transition-all">
          {isAr ? "إنشاء ملف اللاعب" : "Create Player Profile"}
        </Link>
      </div>
    );
  }

  const achievements = getPlayerAchievements(player, locale === "ar" ? "ar" : "en");
  const earnedCount = achievements.filter((achievement) => achievement.earned).length;
  const totalCount = achievements.length;
  const trophyCount = player.trophies?.length || 0;
  const matchesPlayed = player.stats?.matchesPlayed || 0;
  const goalsPerMatch = matchesPlayed > 0 ? (player.stats?.goals || 0) / matchesPlayed : 0;
  const assistsPerMatch = matchesPlayed > 0 ? (player.stats?.assists || 0) / matchesPlayed : 0;

  const statCards = [
    {
      icon: <Target className="w-5 h-5 text-emerald-500" />,
      label: isAr ? "الأهداف" : "Goals",
      value: player.stats?.goals || 0,
    },
    {
      icon: <Handshake className="w-5 h-5 text-cyan-500" />,
      label: isAr ? "التمريرات الحاسمة" : "Assists",
      value: player.stats?.assists || 0,
    },
    {
      icon: <Star className="w-5 h-5 text-amber-500" />,
      label: isAr ? "ألقاب أفضل لاعب" : "MVPs",
      value: player.stats?.mvp || 0,
    },
    {
      icon: <Sparkles className="w-5 h-5 text-blue-500" />,
      label: isAr ? "المباريات" : "Matches",
      value: matchesPlayed,
    },
    {
      icon: <Target className="w-5 h-5 text-emerald-500" />,
      label: isAr ? "الأهداف لكل مباراة" : "Goals per Match",
      value: goalsPerMatch.toFixed(2),
    },
    {
      icon: <Handshake className="w-5 h-5 text-cyan-500" />,
      label: isAr ? "التمريرات لكل مباراة" : "Assists per Match",
      value: assistsPerMatch.toFixed(2),
    },
    {
      icon: <span className="text-yellow-500 text-lg">🟨</span>,
      label: isAr ? "الكروت الصفراء" : "Yellow Cards",
      value: player.stats?.yellowCards || 0,
    },
    {
      icon: <span className="text-red-500 text-lg">🟥</span>,
      label: isAr ? "الكروت الحمراء" : "Red Cards",
      value: player.stats?.redCards || 0,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-10">
          <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
              <div className="flex-1">
                <p className="uppercase text-xs font-black tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                  {isAr ? "سجل الإنجازات" : "Achievements & Records"}
                </p>
                <h1 className="mt-4 text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                  {isAr ? "إنجازاتك وقصّة الأداء" : "Your Achievements & Performance Journey"}
                </h1>
                <p className="mt-4 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-7">
                  {isAr
                    ? "استعرض كافة إنجازاتك، أرقامك القياسية، والجوائز التي حصلت عليها بلغتك الآن. تعرف على متى تُفتح كل جائزة وكيفية الحصول عليها." 
                    : "Review all your achievements, milestone records, and earned trophies in one place. See when each award unlocks and how to earn it."}
                </p>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-3xl bg-slate-100 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{isAr ? "الجوائز المكتسبة" : "Earned"}</p>
                    <p className="mt-3 text-3xl font-black text-emerald-700 dark:text-emerald-300">{earnedCount}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isAr ? `${totalCount} إنجازات` : `${totalCount} Achievements`}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-100 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{isAr ? "الجوائز" : "Trophies"}</p>
                    <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-300">{trophyCount}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isAr ? "ألقاب في الملف الشخصي" : "Profile Awards"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-100 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{isAr ? "الأهداف" : "Goals"}</p>
                    <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{player.stats?.goals || 0}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isAr ? "أهداف إجمالية" : "Total Goals"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-100 dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{isAr ? "التمريرات" : "Assists"}</p>
                    <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{player.stats?.assists || 0}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isAr ? "تمريرات حاسمة" : "Total Assists"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 border border-emerald-200 dark:border-emerald-700/50 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-white text-3xl shadow-lg shadow-emerald-500/20">
                    {player.cardName?.charAt(0) || player.fullName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] font-bold text-emerald-600 dark:text-emerald-300">{isAr ? "اسم اللاعب" : "Player"}</p>
                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{player.cardName || player.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isAr ? `المركز الرئيسي: ${player.primaryPosition}` : `Primary Position: ${player.primaryPosition}`}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {statCards.slice(0, 4).map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2">{stat.icon}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{stat.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي' : 'Total'}</p>
                        </div>
                      </div>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{isAr ? "قائمة الإنجازات" : "Achievement List"}</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {isAr
                      ? "تحقق من كل إنجاز، تقدمك، وطريقة الوصول إليه باللغة العربية والإنجليزية."
                      : "Track each achievement, your progress, and how to unlock it in Arabic and English."}
                  </p>
                </div>
                <div className="rounded-3xl bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-200 text-sm font-black">
                  {isAr ? "تقدم" : "Progress"}: {earnedCount}/{totalCount}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`rounded-3xl border p-5 transition ${achievement.earned ? 'border-emerald-300 bg-emerald-50/60 shadow-emerald-200/60' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'} `}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{isAr ? achievement.nameAr : achievement.nameEn}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{isAr ? achievement.descriptionAr : achievement.descriptionEn}</p>
                      </div>
                    </div>
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>{isAr ? "التقدم" : "Progress"}</span>
                        <span>{isAr ? achievement.progressAr : achievement.progressEn}</span>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${achievement.earned ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, Math.round((achievement.current / achievement.target) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="space-y-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {statCards.slice(4, 6).map((stat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="rounded-2xl bg-slate-200 dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-300 flex-shrink-0">{stat.icon}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{stat.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'متوسط الفريق' : 'Season Average'}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-2xl sm:text-2xl md:text-2xl font-black text-slate-900 dark:text-white whitespace-nowrap">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
              <div className="flex items-center gap-3">
                <div className="rounded-3xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-300">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{isAr ? "خزانة الجوائز" : "Trophy Cabinet"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? "جميع الألقاب المسجلة في ملفك الشخصي" : "All trophies awarded to your profile."}</p>
                </div>
              </div>

              {trophyCount === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? "لم تحصل على ألقاب بعد. سجل أهدافاً ومباريات أكثر لتحصل على الجوائز." : "No trophies yet. Score more goals and matches to earn awards."}
                </div>
              ) : (
                <div className="grid gap-3">
                  {player.trophies?.map((trophy, idx) => (
                    <div key={idx} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{trophy.name}</p>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{trophy.season || (isAr ? 'بدون موسم' : 'No season')}</p>
                        </div>
                        <span className="text-2xl">{trophy.name.includes('Golden Boot') || trophy.name.includes('Boot') ? '⚽' : trophy.name.includes('Ballon') ? '👑' : trophy.name.includes('Playmaker') ? '🎯' : trophy.name.includes('MVP') ? '⭐' : trophy.name.includes('Shield') ? '🛡️' : '🏆'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-3xl bg-slate-100 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                <p className="font-black mb-2">{isAr ? "كيفية الحصول على الجوائز" : "How to Earn Awards"}</p>
                <ul className="list-disc list-inside space-y-2 text-xs leading-5">
                  <li>{isAr ? "سجل أهداف وتمريرات في المباريات المسجلة للحصول على جوائز الهداف وصانع الألعاب." : "Score goals and assists in recorded matches to unlock scoring and playmaker awards."}</li>
                  <li>{isAr ? "احصل على لقب أفضل لاعب من خلال الأداء العالي في المباريات." : "Earn MVP awards through outstanding match performances."}</li>
                  <li>{isAr ? "أكمل المزيد من المباريات للحصول على إنجازات المتسابق والمشاركة." : "Complete more matches to unlock participation and streak achievements."}</li>
                  <li>{isAr ? "اجمع ألقاب الموسم خلال حفل تتويج الموسم، وسيتم إضافتها تلقائياً إلى ملفك الشخصي." : "Collect season trophies during the ceremony; awards are automatically added to your profile."}</li>
                </ul>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
