"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Target, Shuffle, Star, Rocket, Globe, Scale, CheckCircle2, BarChart3, Trophy } from "lucide-react";
import { PLAYER_STYLES } from "@/components/PlayerStylePicker";
import { SKILLS } from "@/components/SkillsChecklist";

type Tab = 'overview' | 'positions' | 'playstyles' | 'skills' | 'features' | 'rules';

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
    { id: 'overview', label: isAr ? "نظرة عامة" : "Overview", Icon: BookOpen, color: "text-blue-500" },
    { id: 'positions', label: isAr ? "المراكز" : "Positions", Icon: Target, color: "text-red-500" },
    { id: 'playstyles', label: isAr ? "أساليب اللعب" : "Play Styles", Icon: Shuffle, color: "text-indigo-500" },
    { id: 'skills', label: isAr ? "المهارات الخاصة" : "Special Skills", Icon: Star, color: "text-amber-500" },
    { id: 'features', label: isAr ? "مميزات المنصة" : "Platform Features", Icon: Rocket, color: "text-purple-500" },
    { id: 'rules', label: isAr ? "القوانين" : "Rules", Icon: Scale, color: "text-emerald-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? 'rtl' : 'ltr'}>
        <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
          
          {/* Real Luxury Sidebar during loading */}
          <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 self-start">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 mb-4 px-2">
                {isAr ? "دليل 11Players" : "11Players Guide"}
              </h2>
              <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                {tabs.map((tab, idx) => {
                  const isActive = idx === 0;
                  return (
                    <div
                      key={tab.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                        isActive 
                        ? 'bg-blue-600 text-white font-bold shadow-md' 
                        : 'text-slate-600 dark:text-slate-400 opacity-75'
                      }`}
                    >
                      <span className={`text-xl ${isActive ? 'text-white' : tab.color}`}>
                        <tab.Icon className="w-5 h-5" />
                      </span>
                      <span>{tab.label}</span>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Luxury Shimmering Main Content Box */}
          <div className="flex-1 min-w-0 min-h-[80vh]">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 dark:via-blue-400/5 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              
              <div className="space-y-4">
                <div className="h-9 w-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
                <div className="h-5 w-5/6 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
              </div>

              <div className="space-y-4 pt-2">
                <div className="h-7 w-64 bg-blue-500/20 rounded-xl" />
                <div className="h-5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
                <div className="h-5 w-4/5 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 h-16 w-full mt-4" />
              </div>

              <div className="grid gap-4 pt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 h-24 space-y-3">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700/60 rounded-lg" />
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md" />
                  </div>
                ))}
              </div>
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
            <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 mb-4 px-2">
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
                      ? 'bg-blue-600 text-white font-bold shadow-md' 
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
                    <h2 className="text-2xl font-bold mb-3 text-blue-600 dark:text-blue-400">
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
                        <div className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-1">
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
                        <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">
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
                        <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">
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
                      🌍 {isAr ? "المجتمعات المتعددة (Multiple Communities)" : "Multiple Communities"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "يمكنك إنشاء أو الانضمام إلى عدة مجتمعات مختلفة (مثل حجز الإثنين، حجز الجمعة). إحصائياتك منفصلة لكل مجتمع لضمان التنافس العادل!"
                        : "You can create or join multiple communities (e.g., Monday League, Friday League). Your stats are separated per community for fair competition!"}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      ⚖️ {isAr ? "صناعة المباريات الذكية (Smart Matchmaking)" : "Smart Matchmaking"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "عندما تعمل حجز، يمكنك استخدام الموقع لتقسيم وتوزيع اللاعبين وتشكيل الفرق بشكل عادل بناءً على الطاقات والمراكز."
                        : "When you book a match, you can use the platform to divide and distribute players, creating fair teams based on their stats and positions."}
                    </p>
                  </section>
                  
                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      ✅ {isAr ? "نظام تقييم الأقران (Peer Rating System)" : "Peer Rating System"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام تقييم متبادل بين اللاعبين بعد المباريات، حيث يتم تسجيل كل شيء ومن ثم التواصل بمعلومات من قام بتقييمك."
                        : "A mutual rating system between players after matches, where everything is recorded and you get notified about who rated you."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🏆 {isAr ? "نظام البطولات والمواسم (Tournaments & Seasons)" : "Tournaments & Seasons System"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام بطولات أو دوري مستمر مع أي فكرة تخطر ببالك. كل شيء موجود على الموقع ويمكن للجميع رؤيته."
                        : "A continuous tournament or league system with any idea you can think of. Everything is available on the platform and visible to everyone."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🏆 {isAr ? "الإنجازات (Achievements)" : "Achievements"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "تابع إنجازاتك، الجوائز الموسمية، والمتوسطات لكل لاعب. يوفر الموقع لوحة إنجازات تعرض تقدمك وجوائزك الشخصية."
                        : "Track your achievements, seasonal awards, and per-match averages. The platform shows an achievements dashboard with your progress and personal trophies."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      💡 {isAr ? "نصائح ذكية (Smart Advice)" : "Smart Advice"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نصائح تصل إليك بشكل دوري لمساعدتك في تحسين أدائك."
                        : "Advice that comes to you periodically to help you improve your performance."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🏆 {isAr ? "الإنجازات (Achievements)" : "Achievements"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "تابع إنجازاتك، الجوائز الموسمية، والمتوسطات لكل لاعب. يوفر الموقع لوحة إنجازات تعرض تقدمك وجوائزك الشخصية."
                        : "Track your achievements, seasonal awards, and per-match averages. The platform shows an achievements dashboard with your progress and personal trophies."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      ⭐ {isAr ? "رجل المباراة MOTM" : "Man of the Match (MOTM)"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام لاختيار أفضل لاعب في كل مباراة."
                        : "A system to select the best player in each match."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      � {isAr ? "شات المجتمع (Community Chat)" : "Community Chat"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام شات للتواصل بين اللاعبين، بالإضافة إلى إمكانية مواجهة مجتمع ضد مجتمع (تحتاج شهرة الموقع)."
                        : "A chat system for communication between players, plus the ability to have community vs community matches (requires platform popularity)."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      � {isAr ? "دعم اللغتين العربية والإنجليزية" : "Arabic & English Support"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "الموقع يدعم اللغتين العربية والإنجليزية بالكامل."
                        : "The platform fully supports both Arabic and English languages."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      👑 {isAr ? "تصويت على كابتن الفريق" : "Team Captain Voting"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام تصويت اللاعبين لاختيار كابتن الفريق."
                        : "A player voting system to choose the team captain."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🎖️ {isAr ? "نظام المواسم والجوائز الرقمية" : "Seasons & Digital Trophies"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام مواسم مع بطولات وجوائز رقمية للفائزين."
                        : "A seasons system with tournaments and digital trophies for winners."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      ⚽ {isAr ? "ركلات الترجيح الذكية" : "Smart Penalty Shootouts"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام ركلات الترجيح يختار أفضل اللاعبين للضربات."
                        : "A penalty shootout system that selects the best players for penalty kicks."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🔄 {isAr ? "تعديل التشكيلة ديناميكي" : "Dynamic Lineup Changes"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "يمكنك تغيير التشكيلة داخل المباراة أو قبل البداية، ويظهر إذا كان اللاعب ضعيف في هذا المركز."
                        : "You can change the lineup during the match or before it starts, and it shows if a player is weak in that position."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🟨🟥 {isAr ? "نظام الكروت الصفراء والحمراء والوقت الضائع" : "Yellow/Red Cards & Stoppage Time"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "نظام الكروت الصفراء والحمراء والوقت بدل الضائع لإدارة المباريات بشكل احترافي."
                        : "Yellow and red cards system plus stoppage time for professional match management."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      📊 {isAr ? "تتبع الإحصائيات الشامل" : "Comprehensive Stats Tracking"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "تسجيل شامل للأهداف والتمريرات الحاسمة والمباريات اللعبة وكل شيء يخص الأداء."
                        : "Comprehensive recording of goals, assists, matches played, and everything related to performance."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      ⚖️ {isAr ? "مقارنة اللاعبين وجهًا لوجه (Player Comparison)" : "Head-to-Head Player Comparison"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "يمكنك مقارنة بطاقتين أو لاعبين وجهًا لوجه لعرض الفرق في الطاقات الـ22 والتقييم العام والإحصائيات، وتحديد نقطة التفوق في كل جانب سواء الهجوم، الدفاع، التمرير، أو اللياقة البدنية."
                        : "Compare two player cards or profiles head-to-head to analyze exact differences across all 22 attributes, overall ratings, and match stats, highlighting clear tactical advantages in attack, defense, passing, and stamina."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      🔮 {isAr ? "المزيد قادم" : "More Coming Soon"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {isAr 
                        ? "هناك الكثير من المميزات الأخرى القادمة، وإذا كان لديك أي فكرة فأخبرنا وسنقوم بتنفيذها!"
                        : "There are many more features coming soon, and if you have any idea, let us know and we'll implement it!"}
                    </p>
                  </section>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-8">
                  <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                    {isAr ? "القوانين" : "Rules"}
                  </h1>

                  <section className="space-y-3">
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {isAr
                        ? "هذه القوانين وضعت لحماية جميع اللاعبين وضمان تجربة عادلة وممتعة على 11Players. الرجاء اتباعها بدقة."
                        : "These rules are designed to protect all players and ensure a fair, enjoyable experience on 11Players. Please follow them carefully."}
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                      <li>{isAr ? "احترم اللاعبين الآخرين وامتنع عن الإساءة أو السلوك العنصري أو المسيء." : "Respect other players; do not use abusive, racist, or offensive language."}</li>
                      <li>{isAr ? "لا تستخدم حسابات مزيفة أو بيانات تجريبية للتلاعب بالترتيب أو الجوائز." : "Do not use fake accounts or mock data to manipulate rankings or awards."}</li>
                      <li>{isAr ? "شارك فقط في المباريات التي يمكنك إتمامها، ولا تترك الفريق من دون سبب." : "Only join matches you can complete; do not abandon teams without cause."}</li>
                      <li>{isAr ? "احترم قرارات مديري المجتمع والمالكين أثناء تنظيم المباريات وإدارة التسجيلات." : "Respect community admins' and owners' decisions when organizing matches and managing registrations."}</li>
                      <li>{isAr ? "لا تحاول التلاعب بأسماء اللاعبين أو الإحصائيات للحصول على مزايا غير عادلة." : "Do not attempt to alter player names or stats for unfair advantage."}</li>
                      <li>{isAr ? "استخدم نظام التقييم والنقاد بصدق، ولا تقم بإرسال تقييمات خادعة." : "Use peer ratings honestly; do not submit fraudulent ratings."}</li>
                      <li>{isAr ? "المكافآت الموسمية والإنجازات تُمنح على أساس الأداء الحقيقي داخل الموقع فقط." : "Seasonal awards and achievements are granted based on real on-platform performance only."}</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      {isAr ? "قواعد خاصة بالإنجازات" : "Achievements Rules"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {isAr
                        ? "الإنجازات تُحتسب حسب الأداء الفعلي في المباريات وحسب التعليقات التي يحصل عليها اللاعب. لا يمكن ترحيل إنجازات إلى موسم آخر بدون إتمامه." 
                        : "Achievements are calculated based on actual match performance and received ratings. They cannot be carried over to the next season without completing it."}
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                      <li>{isAr ? "كل لاعب يكسب الجوائز الموسمية بناءً على الأهداف والتمريرات وأداء منتخب الأفضل لاعب." : "Players earn seasonal awards based on goals, assists, and Man of the Match performance."}</li>
                      <li>{isAr ? "إحصائيات الأهداف والتمريرات لكل مباراة تحسب فقط من المباريات المسجلة في المجتمع." : "Goals and assists per match are counted only from matches recorded in the community."}</li>
                      <li>{isAr ? "المستخدمون الذين يحاولون التلاعب بنظام التتويج قد يتم منعهم من المباريات المستقبلية." : "Users who attempt to manipulate the ceremony system may be banned from future matches."}</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
                      {isAr ? "التقارير والمخالفات" : "Reporting & Violations"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {isAr
                        ? "إذا رأيت لاعباً ينتهك القوانين، استخدم نظام الدعم أو اتصل بمالك المجتمع. سيتم النظر في المخالفات واتخاذ الإجراءات المناسبة." 
                        : "If you see a player violating the rules, use the support system or contact the community owner. Violations will be reviewed and appropriate action taken."}
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
