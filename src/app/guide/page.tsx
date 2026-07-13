"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Target, Shuffle, Star, Rocket, Globe, Scale, CheckCircle2, BarChart3, Trophy } from "lucide-react";
import { PLAYER_STYLES } from "@/components/PlayerStylePicker";
import { SKILLS } from "@/components/SkillsChecklist";
import SiteSkeletonLoader from "@/components/SiteSkeletonLoader";

type Tab = 'overview' | 'positions' | 'playstyles' | 'skills' | 'features';

export default function GuidePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const tabs: { id: Tab; label: string; Icon: React.FC<any>; color: string }[] = [
    { id: 'overview', label: isAr ? "نظرة عامة" : "Overview", Icon: BookOpen, color: "text-emerald-500" },
    { id: 'positions', label: isAr ? "المراكز" : "Positions", Icon: Target, color: "text-red-500" },
    { id: 'playstyles', label: isAr ? "أساليب اللعب" : "Play Styles", Icon: Shuffle, color: "text-blue-500" },
    { id: 'skills', label: isAr ? "المهارات الخاصة" : "Special Skills", Icon: Star, color: "text-amber-500" },
    { id: 'features', label: isAr ? "مميزات المنصة" : "Platform Features", Icon: Rocket, color: "text-purple-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
              {/* Title */}
              <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg mb-5 animate-pulse" />
              {/* Nav items */}
              <div className="flex flex-row lg:flex-col gap-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse ${i === 0 ? "bg-emerald-500/20" : "bg-slate-100 dark:bg-slate-800"}`}
                  >
                    <div className={`w-5 h-5 rounded-md flex-shrink-0 ${i === 0 ? "bg-emerald-400/50" : "bg-slate-300 dark:bg-slate-600"}`} />
                    <div className={`h-3.5 rounded-md ${i === 0 ? "bg-emerald-400/50 w-20" : "bg-slate-300 dark:bg-slate-600 w-16"}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Panel Skeleton */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800 space-y-6">
            {/* Page title */}
            <div className="space-y-3 animate-pulse">
              <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
            {/* Section heading */}
            <div className="space-y-2 animate-pulse">
              <div className="h-6 w-80 bg-emerald-200 dark:bg-emerald-900/40 rounded-xl" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
            {/* Highlight box */}
            <div className="h-14 w-full bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/40 rounded-xl animate-pulse" />
            {/* More text lines */}
            <div className="space-y-2 animate-pulse">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
            {/* Content cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
              ))}
            </div>
            {/* Another section */}
            <div className="space-y-2 animate-pulse">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 self-start">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-4 px-2">
              {isAr ? "دليل 11Players" : "11Players Guide"}
            </h2>
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                      isActive 
                      ? 'bg-emerald-500 text-white font-bold shadow-md' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`text-xl ${isActive ? 'text-white' : tab.color}`}>
                      <tab.Icon className="w-5 h-5" />
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 min-h-[80vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200 dark:border-slate-800"
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-4">
                      {isAr ? "مرحباً بك في 11Players" : "Welcome to 11Players"}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                      {isAr 
                        ? "المنصة الأولى لإدارة مجتمعات كرة القدم. قم بإنشاء مجتمعك الخاص، أضف اللاعبين، ونظم المباريات بتقييمات حقيقية وصناعة مباريات عادلة."
                        : "The premier platform for managing football communities. Create your own community, add players, and organize matches with true-to-life ratings and fair matchmaking."}
                    </p>
                  </div>

                  <section>
                    <h2 className="text-2xl font-bold mb-3 text-emerald-600 dark:text-emerald-400">
                      {isAr ? "كيف يتم حساب التقييم الكلي (OVR)؟" : "How is the Overall Rating (OVR) calculated?"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      {isAr 
                        ? "يتم حساب التقييم الكلي بناءً على مركز اللاعب الأساسي. كل مركز له طاقات أساسية ذات وزن أكبر. على سبيل المثال، المهاجم يعتمد بشكل كبير على الإنهاء، بينما يعتمد قلب الدفاع على افتكاك الكرة."
                        : "The Overall Rating is calculated based on the player's primary position. Each position has key attributes that carry more weight. For example, a Forward relies heavily on Finishing, while a Center Back relies on Ball Winning."}
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        {isAr 
                          ? "💡 يتم تقييم المركز الثانوي والثالث بنفس طريقة الأساسي ولكن بنسبة كفاءة أقل قليلاً (ينخفض التقييم)."
                          : "💡 Secondary and Tertiary positions are calculated similarly but with a slight efficiency penalty (lower rating)."}
                      </p>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'positions' && (
                <div className="space-y-6">
                  <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                    {isAr ? "مراكز اللعب" : "Playing Positions"}
                  </h1>
                  
                  <div className="grid gap-4">
                    {[
                      { pos: "CF (Center Forward)", ar: "مهاجم صريح", desc: isAr ? "رأس الحربة الهداف. يعتمد على الإنهاء والوعي الهجومي." : "The main goalscorer. Relies on Finishing and Offensive Awareness." },
                      { pos: "SS (Second Striker)", ar: "مهاجم متأخر", desc: isAr ? "يلعب خلف المهاجم الصريح لربط اللعب وصناعة الفرص." : "Plays behind the main striker to link play and create chances." },
                      { pos: "LWF / RWF (Wingers)", ar: "جناح أيسر / أيمن", desc: isAr ? "يعتمدون على السرعة والمراوغة لاختراق الأطراف." : "Relies on Speed and Dribbling to penetrate the flanks." },
                      { pos: "LMF / RMF (Side Midfielders)", ar: "وسط أيسر / أيمن", desc: isAr ? "لاعبو الأطراف في خط الوسط. يدعمون الهجوم والدفاع." : "Wide midfielders who provide width and support both attack and defense." },
                      { pos: "AMF (Attacking Mid)", ar: "صانع ألعاب", desc: isAr ? "محور الهجوم. يعتمد على التمرير القصير والتحكم بالكرة." : "The attacking hub. Relies on Low Pass and Ball Control." },
                      { pos: "LMF / RMF (Wide Midfielders)", ar: "جناح أيسر / أيمن", desc: isAr ? "لاعبو الأطراف. يوفرون العرضيات والسرعة على الأجنحة." : "Wide midfielders. Provide width, speed, and crosses." },
                      { pos: "CMF (Center Mid)", ar: "خط وسط", desc: isAr ? "حلقة الوصل بين الدفاع والهجوم. يحتاج لياقة وتمرير عالي." : "The link between defense and attack. Requires Stamina and Passing." },
                      { pos: "DMF (Defensive Mid)", ar: "وسط مدافع", desc: isAr ? "الدرع الواقي للدفاع. يعتمد على افتكاك الكرة والوعي الدفاعي." : "The defensive shield. Relies on Ball Winning and Defensive Awareness." },
                      { pos: "LB / RB (Fullbacks)", ar: "ظهير أيسر / أيمن", desc: isAr ? "مدافعو الأطراف. يدعمون الهجوم والدفاع بسرعتهم ولياقتهم." : "Flank defenders. Support attack and defense with Speed and Stamina." },
                      { pos: "CB (Center Back)", ar: "قلب دفاع", desc: isAr ? "صخرة الدفاع. يعتمد على القوة البدنية والقفز وافتكاك الكرة." : "The rock of the defense. Relies on Physical Contact, Jump, and Ball Winning." },
                      { pos: "GK (Goalkeeper)", ar: "حارس مرمى", desc: isAr ? "حامي العرين. الطاقات الوحيدة المهمة هي حراسة المرمى والتمركز." : "The last line of defense. The only stats that matter are Goalkeeping and positioning." },
                    ].map((p, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-1">
                          {isAr ? p.ar : p.pos}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'playstyles' && (
                <div className="space-y-6">
                  <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                    {isAr ? "أساليب اللعب (Play Styles)" : "Play Styles"}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {isAr ? "أسلوب اللعب يحدد تحركات اللاعب داخل الملعب بالذكاء الاصطناعي." : "Play Style defines how the player moves on the pitch automatically."}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {PLAYER_STYLES.map((s) => (
                      <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          {isAr ? s.ar : s.en}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                          {isAr ? s.descAr : s.descEn}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                    {isAr ? "المهارات الخاصة (Special Skills)" : "Special Skills"}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {isAr ? "مهارات تمنح اللاعب أفضلية في مواقف محددة." : "Skills that grant the player an advantage in specific situations."}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {SKILLS.map((s) => (
                      <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          {isAr ? s.labelAr : s.label}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                          {isAr ? s.descriptionAr : s.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-8">
                  <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                    {isAr ? "مميزات المنصة" : "Platform Features"}
                  </h1>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🌍 {isAr ? "المجتمعات (Communities)" : "Communities"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "الآن يمكنك إنشاء أو الانضمام إلى عدة مجتمعات مختلفة (مثل حجز الإثنين، حجز الجمعة). إحصائياتك تنفصل لكل مجتمع لضمان التنافس العادل!"
                        : "You can now create or join multiple communities (e.g., Monday League, Friday League). Your stats are separated per community for fair competition!"}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      ⚖️ {isAr ? "صناعة المباريات العادلة (Matchmaking)" : "Fair Matchmaking"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "تقوم الخوارزمية باختيار أفضل 22 لاعباً بناءً على مراكزهم (PSI)، وتقسيمهم لفريقين متكافئين تماماً بناءً على الطاقات. يتم تحويل الباقي لدكة البدلاء."
                        : "The algorithm selects the best 22 players based on Position Specific Index (PSI), and divides them into perfectly balanced teams. The rest are sent to the bench."}
                    </p>
                  </section>
                  
                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      ✅ {isAr ? "مراجعة الأقران وتوثيق الطاقات" : "Peer Reviews & Approvals"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "طاقات اللاعبين تعتمد على مراجعة باقي اللاعبين (Peer Review) ليتم حساب المتوسط، ثم يعتمدها المسؤول لضمان عدم المبالغة في التقييمات وتوثيق البطاقة."
                        : "Player attributes are based on Peer Reviews to calculate averages, which are then approved by the admin to prevent inflated stats and verify the card."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      📊 {isAr ? "تتبع الإحصائيات (Stats Tracking)" : "Stats Tracking"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "يمكن لكل مجتمع تسجيل الأهداف والتمريرات الحاسمة وجوائز رجل المباراة في كل مباراة."
                        : "Each community can record Goals, Assists, and MVP awards in every match."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🌟 {isAr ? "المزاج والحالة (Mood & Form)" : "Mood & Form"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "يمكن للاعبين تحديث حالتهم ومزاجهم (مثل ↗️، ↘️) قبل المباريات لعكس مستوى لياقتهم الحالية."
                        : "Players can update their form/mood (e.g., ↗️, ↘️) before matches to reflect their current fitness level."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🏆 {isAr ? "نهاية الموسم وتوزيع الجوائز" : "Season End & Trophies"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "مسؤول المجتمع يمكنه إنهاء الموسم في أي وقت، ليتم تصفير الإحصائيات (أهداف/أسيست) وتوزيع الجوائز (كرة ذهبية، حذاء ذهبي، صانع ألعاب) بشكل دائم على ملفات اللاعبين."
                        : "The community admin can end the season at any time. This resets stats (Goals/Assists) to 0 and permanently awards trophies (Ballon d'Or, Golden Boot, Playmaker) to players' profiles."}
                    </p>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
