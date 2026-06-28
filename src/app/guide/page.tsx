"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useLocale } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

type Tab = 'overview' | 'positions' | 'playstyles' | 'skills' | 'features';

export default function GuidePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: isAr ? "نظرة عامة" : "Overview", icon: "📖" },
    { id: 'positions', label: isAr ? "المراكز" : "Positions", icon: "🎯" },
    { id: 'playstyles', label: isAr ? "أساليب اللعب" : "Play Styles", icon: "🎭" },
    { id: 'skills', label: isAr ? "المهارات الخاصة" : "Special Skills", icon: "⭐" },
    { id: 'features', label: isAr ? "مميزات المنصة" : "Platform Features", icon: "🚀" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800 sticky top-24">
            <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-4 px-2">
              {isAr ? "دليل 11Players" : "11Players Guide"}
            </h2>
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'bg-emerald-500 text-white font-bold shadow-md' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
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
                      { pos: "AMF (Attacking Mid)", ar: "صانع ألعاب", desc: isAr ? "محور الهجوم. يعتمد على التمرير القصير والتحكم بالكرة." : "The attacking hub. Relies on Low Pass and Ball Control." },
                      { pos: "CMF (Center Mid)", ar: "خط وسط", desc: isAr ? "حلقة الوصل بين الدفاع والهجوم. يحتاج لياقة وتمرير عالي." : "The link between defense and attack. Requires Stamina and Passing." },
                      { pos: "DMF (Defensive Mid)", ar: "وسط مدافع", desc: isAr ? "الدرع الواقي للدفاع. يعتمد على افتكاك الكرة والوعي الدفاعي." : "The defensive shield. Relies on Ball Winning and Defensive Awareness." },
                      { pos: "LB / RB (Fullbacks)", ar: "ظهير أيسر / أيمن", desc: isAr ? "مدافعو الأطراف. يدعمون الهجوم والدفاع بسرعتهم ولياقتهم." : "Flank defenders. Support attack and defense with Speed and Stamina." },
                      { pos: "CB (Center Back)", ar: "قلب دفاع", desc: isAr ? "صخرة الدفاع. يعتمد على القوة البدنية والقفز وافتكاك الكرة." : "The rock of the defense. Relies on Physical Contact, Jump, and Ball Winning." },
                      { pos: "GK (Goalkeeper)", ar: "حارس مرمى", desc: isAr ? "حامي العرين. الطاقات الوحيدة المهمة هي حراسة المرمى والتمركز." : "The last line of defense. The only stats that matter are Goalkeeping and positioning." },
                    ].map((p, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-1">{p.pos} <span className="text-sm text-slate-500 font-normal">({p.ar})</span></div>
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
                    {[
                      { style: "Goal Poacher", desc: "Always looking to run behind the defensive line." },
                      { style: "Fox in the Box", desc: "Waits in the penalty box to finish chances." },
                      { style: "Target Man", desc: "Holds up the ball using physical strength to bring others into play." },
                      { style: "Creative Playmaker", desc: "Drops deep to receive the ball and orchestrate attacks." },
                      { style: "Box-to-Box", desc: "Tirelessly runs between both penalty boxes all game." },
                      { style: "Anchor Man", desc: "Stays deep in midfield to protect the backline." },
                      { style: "Build Up", desc: "Drops deep to receive the ball and initiate attacks from the defense." },
                      { style: "Offensive Goalkeeper", desc: "Plays as a sweeper keeper, rushing out to clear through balls." },
                      { style: "Defensive Goalkeeper", desc: "Prefers to stay on the goal line to react to shots." },
                    ].map((s, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">{s.style}</div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">{s.desc}</div>
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
                    {[
                      { skill: "Scissors Feint", desc: "Can execute the scissors feint dribble at high speed." },
                      { skill: "Double Touch", desc: "Quickly shifts the ball from one foot to the other to bypass defenders." },
                      { skill: "Sombrero", desc: "Flicks the ball over the opponent's head." },
                      { skill: "Heading", desc: "Improves accuracy and downward trajectory of headers." },
                      { skill: "Long Range Shooting", desc: "More accurate shots from outside the box." },
                      { skill: "One-touch Pass", desc: "Improves the accuracy of passes played first-time." },
                      { skill: "Through Passing", desc: "Increases the accuracy and curve of through balls." },
                      { skill: "Outside Curler", desc: "Allows shooting and passing using the outside of the boot with curve." },
                      { skill: "Man Marking", desc: "Sticks tightly to an assigned opponent defensively." },
                      { skill: "Interception", desc: "Better positioning to cut out opponent's passes." },
                      { skill: "GK Penalty Saver", desc: "Improves reactions when facing penalty kicks." },
                    ].map((s, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">{s.skill}</div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">{s.desc}</div>
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
