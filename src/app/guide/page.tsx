"use client";

import React, { useState } from "react";
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
                      { pos: "LMF / RMF (Side Midfielders)", ar: "وسط أيسر / أيمن", desc: isAr ? "لاعبو الأطراف في خط الوسط. يدعمون الهجوم والدفاع." : "Wide midfielders who provide width and support both attack and defense." },
                      { pos: "AMF (Attacking Mid)", ar: "صانع ألعاب", desc: isAr ? "محور الهجوم. يعتمد على التمرير القصير والتحكم بالكرة." : "The attacking hub. Relies on Low Pass and Ball Control." },
                      { pos: "CMF (Center Mid)", ar: "خط وسط", desc: isAr ? "حلقة الوصل بين الدفاع والهجوم. يحتاج لياقة وتمرير عالي." : "The link between defense and attack. Requires Stamina and Passing." },
                      { pos: "DMF (Defensive Mid)", ar: "وسط مدافع", desc: isAr ? "الدرع الواقي للدفاع. يعتمد على افتكاك الكرة والوعي الدفاعي." : "The defensive shield. Relies on Ball Winning and Defensive Awareness." },
                      { pos: "LB / RB (Fullbacks)", ar: "ظهير أيسر / أيمن", desc: isAr ? "مدافعو الأطراف. يدعمون الهجوم والدفاع بسرعتهم ولياقتهم." : "Flank defenders. Support attack and defense with Speed and Stamina." },
                      { pos: "CB (Center Back)", ar: "قلب دفاع", desc: isAr ? "صخرة الدفاع. يعتمد على القوة البدنية والقفز وافتكاك الكرة." : "The rock of the defense. Relies on Physical Contact, Jump, and Ball Winning." },
                      { pos: "GK (Goalkeeper)", ar: "حارس مرمى", desc: isAr ? "حامي العرين. الطاقات الوحيدة المهمة هي حراسة المرمى والتمركز." : "The last line of defense. The only stats that matter are Goalkeeping and positioning." },
                    ].map((p, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-1">
                          {p.pos} {isAr && <span className="text-sm text-slate-500 font-normal">({p.ar})</span>}
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
                    {[
                      { style: "Goal Poacher", ar: "مهاجم قناص", descEn: "Always looking to run off the last defender.", descAr: "يسعى دائماً للهروب من آخر مدافع." },
                      { style: "Fox in the Box", ar: "ثعلب المربع", descEn: "Lurks in the box waiting for the ball.", descAr: "يتربص داخل منطقة الجزاء في انتظار الكرة." },
                      { style: "Target Man", ar: "محطة لعب", descEn: "Holds up the ball to bring others into play.", descAr: "يستلم الكرة ويهيئها لزملائه." },
                      { style: "Creative Playmaker", ar: "صانع لعب مبدع", descEn: "Takes advantage of any opening in the defense.", descAr: "يستغل أي ثغرة في الدفاع." },
                      { style: "Hole Player", ar: "لاعب ثغرات", descEn: "Makes late runs into the box to score.", descAr: "يقوم بانطلاقات متأخرة لمنطقة الجزاء للتسجيل." },
                      { style: "Classic No. 10", ar: "رقم 10 كلاسيكي", descEn: "An old-style static playmaker.", descAr: "صانع ألعاب كلاسيكي يركز على التمرير." },
                      { style: "Prolific Winger", ar: "جناح هداف", descEn: "Positions himself on the wing to cut inside.", descAr: "يتمركز على الجناح ليخترق للداخل." },
                      { style: "Orchestrator", ar: "مايسترو", descEn: "Dictates the play from deep positions.", descAr: "يتحكم في إيقاع اللعب من مناطق متأخرة." },
                      { style: "Box-to-Box", ar: "من الصندوق للصندوق", descEn: "Tirelessly covers the whole pitch.", descAr: "يغطي الملعب بالكامل بلا كلل." },
                      { style: "The Destroyer", ar: "المدمر", descEn: "A tenacious tackler who stops attacks.", descAr: "مدافع شرس يوقف هجمات الخصم." },
                      { style: "Anchor Man", ar: "ارتكاز دفاعي", descEn: "Protects the backline defensively.", descAr: "يحمي خط الدفاع بشكل أساسي." },
                      { style: "Build Up", ar: "بناء اللعب", descEn: "Drops back to receive the ball and trigger attacks.", descAr: "يتراجع لاستلام الكرة وبدء الهجمات." },
                      { style: "Offensive Full-back", ar: "ظهير هجومي", descEn: "Constantly runs up the wing to attack.", descAr: "يتقدم باستمرار على الجناح للهجوم." },
                      { style: "Defensive Full-back", ar: "ظهير دفاعي", descEn: "Prefers to stay back and fulfill defensive duties.", descAr: "يفضل البقاء في الخلف للقيام بالمهام الدفاعية." },
                      { style: "Offensive Goalkeeper", ar: "حارس هجومي", descEn: "Often comes out of the goal area.", descAr: "غالباً ما يخرج من منطقة المرمى." },
                      { style: "Defensive Goalkeeper", ar: "حارس دفاعي", descEn: "Prefers to stay on the goal line.", descAr: "يفضل البقاء على خط المرمى." },
                    ].map((s, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          {s.style} {isAr && <span className="text-sm text-slate-500 font-normal">({s.ar})</span>}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">{isAr ? s.descAr : s.descEn}</div>
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
                      { skill: 'One-touch Pass', ar: 'التمريرة بلمسة واحدة', descEn: 'Accurate passes with just one touch', descAr: 'تمريرات دقيقة بلمسة واحدة' },
                      { skill: 'Through Passing', ar: 'التمريرة البينية', descEn: 'Precise through balls behind the defense', descAr: 'تمريرات بينية دقيقة خلف الدفاع' },
                      { skill: 'Pinpoint Crossing', ar: 'العرضية الدقيقة', descEn: 'Highly accurate crosses into the box', descAr: 'عرضيات دقيقة جداً داخل منطقة الجزاء' },
                      { skill: 'Outside Curler', ar: 'الكيرفة الخارجية', descEn: 'Curl passes and shots with outside of foot', descAr: 'تمريرات وتسديدات منحنية بخارج القدم' },
                      { skill: 'Weighted Pass', ar: 'التمريرة الموزونة', descEn: 'Perfectly weighted passes to teammates', descAr: 'تمريرات بقوة مثالية للزملاء' },
                      { skill: 'Long Throw', ar: 'الرمية الطويلة', descEn: 'Can throw the ball far into the box', descAr: 'قادر على رمي الكرة لمسافة بعيدة' },
                      { skill: 'Long Range Drive', ar: 'التسديدة البعيدة', descEn: 'Powerful and accurate long-range shots', descAr: 'تسديدات قوية ودقيقة من مسافات بعيدة' },
                      { skill: 'Knuckle Shot', ar: 'الكرة المتذبذبة', descEn: 'Shots that swerve unpredictably in the air', descAr: 'تسديدات تتذبذب في الهواء بشكل غير متوقع' },
                      { skill: 'Rising Shot', ar: 'التسديدة الصاعدة', descEn: 'Powerful rising shots that climb towards goal', descAr: 'تسديدات قوية صاعدة نحو المرمى' },
                      { skill: 'First-time Shot', ar: 'التسديدة المباشرة', descEn: 'Accurate shots without controlling the ball first', descAr: 'تسديدات دقيقة بدون السيطرة على الكرة أولاً' },
                      { skill: 'Penalty Specialist', ar: 'متخصص ركلات الجزاء', descEn: 'Calm and accurate penalty kick taker', descAr: 'مسدد ركلات جزاء هادئ ودقيق' },
                      { skill: 'Chip Shot Control', ar: 'التسديدة اللوبية', descEn: 'Delicate chip shots over the goalkeeper', descAr: 'تسديدات لوبية ناعمة فوق حارس المرمى' },
                      { skill: 'Rabona', ar: 'رابونا', descEn: 'Can perform the rabona kick technique', descAr: 'قادر على تنفيذ تقنية الرابونا' },
                      { skill: 'Acrobatic Clearance', ar: 'التشتيت البهلواني', descEn: 'Spectacular clearances in difficult situations', descAr: 'تشتيتات رائعة في المواقف الصعبة' },
                      { skill: 'Interception', ar: 'قطع الكرات', descEn: 'Excellent at reading and cutting passing lanes', descAr: 'ممتاز في قراءة وقطع خطوط التمرير' },
                      { skill: 'Man Marking', ar: 'المراقبة اللصيقة', descEn: 'Tight man-to-man marking ability', descAr: 'قدرة عالية على المراقبة اللصيقة' },
                      { skill: 'Track Back', ar: 'الرجوع الدفاعي', descEn: 'Willingness to chase back and defend', descAr: 'الاستعداد للرجوع والمساهمة دفاعياً' },
                      { skill: 'Sliding Tackle', ar: 'الانزلاق', descEn: 'Clean and effective sliding tackles', descAr: 'انزلاقات نظيفة وفعالة' },
                      { skill: 'Scissors Feint', ar: 'المقص', descEn: 'Quick scissors feint to deceive defenders', descAr: 'حركة المقص السريعة لخداع المدافعين' },
                      { skill: 'Step On Skill', ar: 'الدوس على الكرة', descEn: 'Skillful step-on moves for close control', descAr: 'حركات الدوس على الكرة للتحكم القريب' },
                      { skill: 'Double Touch', ar: 'اللمسة المزدوجة', descEn: 'Quick double-touch to change direction', descAr: 'اللمسة المزدوجة السريعة لتغيير الاتجاه' },
                      { skill: 'Flip Flap', ar: 'فليب فلاب', descEn: 'Elastico-style flip flap move', descAr: 'حركة الفليب فلاب على طريقة الإلاستيكو' },
                      { skill: 'Marseille Turn', ar: 'لفة مارسيليا', descEn: 'The classic Zidane roulette spin move', descAr: 'حركة الدوران الكلاسيكية على طريقة زيدان' },
                      { skill: 'Sombrero', ar: 'سومبريرو', descEn: 'Flick the ball over the opponent\'s head', descAr: 'رفع الكرة فوق رأس الخصم' },
                      { skill: 'Elastico', ar: 'إلاستيكو', descEn: 'The famous elastico dribbling technique', descAr: 'تقنية الإلاستيكو الشهيرة' },
                      { skill: 'Heel Trick', ar: 'خدعة الكعب', descEn: 'Clever heel flicks and passes', descAr: 'تمريرات وحركات ذكية بالكعب' },
                      { skill: 'Speed Merchant', ar: 'تاجر السرعة', descEn: 'Exceptional pace to outrun defenders', descAr: 'سرعة استثنائية لتجاوز المدافعين' },
                      { skill: 'Captaincy', ar: 'القيادة', descEn: 'Natural leader that inspires the team', descAr: 'قائد طبيعي يلهم الفريق' },
                      { skill: 'Super Sub', ar: 'البديل الخارق', descEn: 'Performs better when coming off the bench', descAr: 'أداء أفضل عند الدخول كبديل' },
                      { skill: 'Fighting Spirit', ar: 'الروح القتالية', descEn: 'Never gives up, fights until the end', descAr: 'لا يستسلم أبداً، يقاتل حتى النهاية' },
                      { skill: 'Aerial Superiority', ar: 'التفوق الهوائي', descEn: 'Dominant in aerial duels and headers', descAr: 'مسيطر في الصراعات الهوائية والضربات الرأسية' },
                      { skill: 'Low Punt Trajectory', ar: 'الركلة المنخفضة', descEn: 'Goal kicks with a low, fast trajectory', descAr: 'ركلات مرمى بمسار منخفض وسريع' },
                      { skill: 'GK Long Throw', ar: 'رمية الحارس الطويلة', descEn: 'Goalkeeper can throw the ball far distances', descAr: 'قدرة الحارس على رمي الكرة لمسافات بعيدة' },
                      { skill: 'GK Reflexes', ar: 'ردود فعل الحارس', descEn: 'Lightning-fast reflexes to make saves', descAr: 'ردود فعل سريعة كالبرق لإنقاذ المرمى' },
                    ].map((s, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          {s.skill} {isAr && <span className="text-sm text-slate-500 font-normal">({s.ar})</span>}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">{isAr ? s.descAr : s.descEn}</div>
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
