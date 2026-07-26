"use client";

import React, { useState } from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Target, Shuffle, Star, Rocket, Scale, CheckCircle2, Shield, Sparkles, Trophy, Bot, MessageSquare } from "lucide-react";
import { PLAYER_STYLES } from "@/components/player/PlayerStylePicker";
import { SKILLS } from "@/components/player/SkillsChecklist";

type Tab = 'overview' | 'positions' | 'playstyles' | 'skills' | 'features' | 'rules';

export default function GuidePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; labelAr: string; Icon: React.FC<any> }[] = [
    { id: 'overview', label: "Overview", labelAr: "نظرة عامة", Icon: BookOpen },
    { id: 'positions', label: "Positions", labelAr: "المراكز", Icon: Target },
    { id: 'playstyles', label: "Play Styles", labelAr: "أساليب اللعب", Icon: Shuffle },
    { id: 'skills', label: "Special Skills", labelAr: "المهارات الخاصة", Icon: Star },
    { id: 'features', label: "Platform Features", labelAr: "مميزات المنصة", Icon: Rocket },
    { id: 'rules', label: "Rules & Fair Play", labelAr: "القوانين والروح الرياضية", Icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white transition-colors duration-300 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation — Solid Dark Slate */}
        <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 self-start min-w-0">
          <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-800 overflow-hidden min-w-0">
            <div className="flex items-center justify-between mb-4 px-2 pt-1">
              <h2 className="text-base font-black text-amber-400 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>{isAr ? "دليل 11Players" : "11Players Guide"}</span>
              </h2>
            </div>
            
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none touch-pan-x w-full">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={(e) => {
                      setActiveTab(tab.id);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all whitespace-nowrap shrink-0 text-xs font-black ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <tab.Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{isAr ? tab.labelAr : tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area — Solid Dark Slate */}
        <div className="flex-1 min-w-0 min-h-[80vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-800"
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-950 text-emerald-400 border border-slate-800 mb-2">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>{isAr ? "دليل المحاكاة الرياضية" : "Sports Simulation Manual"}</span>
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                      {isAr ? "مرحباً بك في منصة 11Players" : "Welcome to 11Players"}
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mt-2 font-medium">
                      {isAr 
                        ? "المنصة الأولى لإدارة مجتمعات كرة القدم. قم بإنشاء مجتمعك الخاص، أضف اللاعبين، ونظم المباريات بتقييمات واقعية وصناعة مباريات عادلة بالذكاء الاصطناعي."
                        : "The premier platform for managing football communities. Create your community, add players, and organize matches with true-to-life ratings and AI matchmaking."}
                    </p>
                  </div>

                  <section className="space-y-6 pt-4 border-t border-slate-800">
                    <div>
                      <h2 className="text-lg font-black text-amber-400 mb-1">
                        {isAr ? "كيف يتم حساب التقييم الكلي (OVR) وإحصائيات البطاقة؟" : "How Overall Rating (OVR) & Card Stats Are Calculated"}
                      </h2>
                      <p className="text-slate-400 text-xs font-semibold">
                        {isAr 
                          ? "معادلة واقعية تعتمد على المركز ومستوحاة من المحاكيات الاحترافية العالمية"
                          : "Realistic, position-based formula inspired by pro football simulations"}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-sm font-black text-white">
                        {isAr ? "شرح إحصائيات البطاقة الستة (PAC, SHO, PAS, DRI, DEF, PHY)" : "Card Profile Stats Explained (PAC, SHO, PAS, DRI, DEF, PHY)"}
                      </h3>
                      <p className="text-slate-400 text-xs font-medium">
                        {isAr 
                          ? "التقييمات الستة الرئيسية المعروضة على بطاقة اللاعب هي متوسطات دقيقة مشتقة من الطاقات الأساسية:"
                          : "The 6 headline ratings displayed on player cards are precise composites derived from core abilities:"}
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 font-medium">
                        <li className="p-3 bg-slate-900 rounded-xl border border-slate-800"><strong className="text-emerald-400">{isAr ? "PAC (السرعة):" : "PAC (Pace):"}</strong> {isAr ? "متوسط السرعة + التسارع" : "Average of Speed + Acceleration"}</li>
                        <li className="p-3 bg-slate-900 rounded-xl border border-slate-800"><strong className="text-amber-400">{isAr ? "SHO (التسديد):" : "SHO (Shooting):"}</strong> {isAr ? "متوسط الإنهاء + قوة التسديد + الوعي الهجومي" : "Average of Finishing + Kicking Power + Offensive Awareness"}</li>
                        <li className="p-3 bg-slate-900 rounded-xl border border-slate-800"><strong className="text-cyan-400">{isAr ? "PAS (التمرير):" : "PAS (Passing):"}</strong> {isAr ? "متوسط التمرير القصير + التمرير الطويل" : "Average of Low Pass + Lofted Pass"}</li>
                        <li className="p-3 bg-slate-900 rounded-xl border border-slate-800"><strong className="text-purple-400">{isAr ? "DRI (المراوغة):" : "DRI (Dribbling):"}</strong> {isAr ? "متوسط المراوغة + التحكم بالكرة + التوازن" : "Average of Dribbling + Ball Control + Balance"}</li>
                        <li className="p-3 bg-slate-900 rounded-xl border border-slate-800"><strong className="text-rose-400">{isAr ? "DEF (الدفاع):" : "DEF (Defense):"}</strong> {isAr ? "متوسط الوعي الدفاعي + افتكاك الكرة + الشراسة" : "Average of Defensive Awareness + Ball Winning + Aggression"}</li>
                        <li className="p-3 bg-slate-900 rounded-xl border border-slate-800"><strong className="text-indigo-400">{isAr ? "PHY (البدنية):" : "PHY (Physicality):"}</strong> {isAr ? "متوسط الالتحام البدني + التحمل + القفز" : "Average of Physical Contact + Stamina + Jump"}</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-white">
                        {isAr ? "1. أوزان الطاقات حسب المركز" : "1. Position-Specific Attribute Weights"}
                      </h3>
                      <ul className="list-disc list-inside text-xs text-slate-400 space-y-2 font-medium">
                        <li><strong className="text-white">CF / SS / RWF / LWF:</strong> {isAr ? "التركيز على: الوعي الهجومي، الإنهاء، والسرعة." : "Heavily weights: Offensive Awareness, Finishing, & Speed."}</li>
                        <li><strong className="text-white">AMF / CMF / RMF / LMF:</strong> {isAr ? "التركيز على: التمرير القصير/الطويل، التحكم بالكرة، والمراوغة." : "Heavily weights: Low/Lofted Pass, Ball Control, & Dribbling."}</li>
                        <li><strong className="text-white">DMF / CB / LB / RB:</strong> {isAr ? "التركيز على: الوعي الدفاعي، افتكاك الكرة، والالتحام البدني." : "Heavily weights: Defensive Awareness, Ball Winning, & Physical Contact."}</li>
                        <li><strong className="text-white">GK:</strong> {isAr ? "التركيز على: ردود أفعال الحارس، الوصول، والتقاط الكرة." : "Heavily weights: GK Reflexes, GK Reach, & GK Catching."}</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <p className="text-xs font-bold text-amber-400">
                        {isAr 
                          ? "💡 ملحوظة: المراكز الثانوية والثالثة تُحسب بنفس المعادلة مع نسبة كفاءة واقعية تعكس قدرة اللاعب في المراكز البديلة."
                          : "💡 Note: Secondary positions calculate OVR with position adaptation efficiency ratios."}
                      </p>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'positions' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-black text-white mb-6">
                    {isAr ? "مراكز اللعب الـ 11 (PES Positions)" : "11 PES Playing Positions"}
                  </h1>
                  
                  <div className="grid gap-3">
                    {[
                      { pos: "CF (Center Forward)", ar: "مهاجم صريح", desc: isAr ? "رأس الحربة الهداف. يعتمد على الإنهاء والوعي الهجومي وقوة التسديد." : "The main goalscorer. Relies on Finishing, Kicking Power, and Positioning." },
                      { pos: "SS (Second Striker)", ar: "مهاجم متأخر", desc: isAr ? "يلعب خلف المهاجم الصريح لربط اللعب وصناعة الفرص والمراوغة." : "Plays behind main striker to link play, dribble, and create chances." },
                      { pos: "LWF / RWF (Wingers)", ar: "جناح أيسر / أيمن", desc: isAr ? "يعتمدون على السرعة والمراوغة والعرضيات لاختراق الأطراف." : "Relies on Speed, Dribbling, and Crossing to penetrate flanks." },
                      { pos: "AMF (Attacking Mid)", ar: "صانع ألعاب", desc: isAr ? "محور الهجوم. يعتمد على التمرير القصير والرؤية والتحكم بالكرة." : "The attacking hub. Relies on Low Pass, Vision, and Ball Control." },
                      { pos: "CMF (Center Mid)", ar: "خط وسط", desc: isAr ? "حلقة الوصل بين الدفاع والهجوم. يحتاج لياقة عالية وتمرير متزن." : "The link between defense and attack. Requires Stamina and Passing." },
                      { pos: "DMF (Defensive Mid)", ar: "وسط مدافع", desc: isAr ? "الدرع الواقي للدفاع. يعتمد على افتكاك الكرة والوعي الدفاعي." : "The defensive shield. Relies on Ball Winning and Aggression." },
                      { pos: "LB / RB (Fullbacks)", ar: "ظهير أيسر / أيمن", desc: isAr ? "مدافعو الأطراف. يدعمون الهجوم والدفاع بسرعتهم ولياقتهم." : "Flank defenders. Support attack and defense with Speed and Stamina." },
                      { pos: "CB (Center Back)", ar: "قلب دفاع", desc: isAr ? "صخرة الدفاع. يعتمد على القوة البدنية والقفز وافتكاك الكرة." : "The rock of the defense. Relies on Physical Contact, Jump, and Tackling." },
                      { pos: "GK (Goalkeeper)", ar: "حارس مرمى", desc: isAr ? "حامي العرين. يعتمد على ردود الأفعال، والوصول، والالتقاط." : "The last line of defense. Relies on Reflexes, Reach, and Catching." },
                    ].map((p, i) => (
                      <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="font-black text-sm text-emerald-400 mb-1">
                          {isAr ? p.ar : p.pos}
                        </div>
                        <div className="text-slate-400 text-xs font-medium leading-relaxed">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'playstyles' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-black text-white mb-2">
                    {isAr ? "أساليب اللعب (Play Styles)" : "Play Styles"}
                  </h1>
                  <p className="text-slate-400 text-xs font-semibold mb-6">
                    {isAr ? "أسلوب اللعب يحدد التمركزي التكتيكي والتحركات التلقائية للاعب." : "Play Styles dictate automatic tactical positioning and off-ball movement."}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {PLAYER_STYLES.map((s) => (
                      <div key={s.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="font-black text-xs text-amber-400 mb-1">
                          {isAr ? s.ar : s.en}
                        </div>
                        <div className="text-slate-400 text-xs font-medium leading-relaxed">
                          {isAr ? s.descAr : s.descEn}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-black text-white mb-2">
                    {isAr ? "المهارات الخاصة (Special Skills)" : "Special Skills"}
                  </h1>
                  <p className="text-slate-400 text-xs font-semibold mb-6">
                    {isAr ? "مهارات تمنح اللاعب تفوقاً وحركات استعراضية في مواقف محددة." : "Skills granting execution advantages and moves in key moments."}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {SKILLS.map((s) => (
                      <div key={s.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="font-black text-xs text-cyan-400 mb-1">
                          {isAr ? s.labelAr : s.label}
                        </div>
                        <div className="text-slate-400 text-xs font-medium leading-relaxed">
                          {isAr ? s.descriptionAr : s.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-black text-white mb-6">
                    {isAr ? "مميزات منصة 11Players" : "11Players Platform Features"}
                  </h1>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: <Bot className="w-5 h-5 text-emerald-400" />, title: isAr ? "مساعد 11AI التكتيكي والدردشة" : "11AI Tactical Advisor & Chatbot", desc: isAr ? "مساعد ذكاء اصطناعي مدمج بـ 3 أقسام (تحليل تكتيكي، دعم فني، ودردشة عامة) مع صوت عربي واقعي." : "3-in-1 AI chatbot with tactical analysis, support center, and human Arabic voice." },
                      { icon: <Rocket className="w-5 h-5 text-amber-400" />, title: isAr ? "صناعة المباريات والخلط العادل" : "Smart AI Matchmaking", desc: isAr ? "توزيع وتوازن الفرق تلقائياً بناءً على تقييمات اللاعبين ومراكزهم لضمان تكافؤ الفرص." : "Automated team generation and balancing based on OVR and positions." },
                      { icon: <MessageSquare className="w-5 h-5 text-cyan-400" />, title: isAr ? "محادثة المجتمع والإعلانات" : "Community Live Chat & Broadcasts", desc: isAr ? "غرفة محادثة حية للمجتمع وبث الإعلانات الرسمية وإشعارات الهاتف الفورية." : "Real-time community chat and instant bilingual push notifications." },
                      { icon: <Trophy className="w-5 h-5 text-purple-400" />, title: isAr ? "حفل التتويج والمواسم" : "Season Ceremony & Archives", desc: isAr ? "أرشفة المواسم وتوزيع ألقاب خزانة الجوائز (الكرة الذهبية، الهداف، صانع الألعاب)." : "Season history archiving and awarding digital trophies (Ballon d'Or, Golden Boot)." },
                    ].map((f, i) => (
                      <div key={i} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">{f.icon}</div>
                          <h3 className="font-black text-sm text-white">{f.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-black text-white mb-6">
                    {isAr ? "القوانين والروح الرياضية" : "Rules & Fair Play Guidelines"}
                  </h1>

                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                      {isAr
                        ? "هذه القوانين وضعت لحماية جميع اللاعبين وضمان تجربة عادلة وممتعة على 11Players. نرجو اتباعها بدقة:"
                        : "Designed to protect all members and guarantee a fair, competitive experience. Please strictly adhere:"}
                    </p>
                    <ul className="list-disc list-inside space-y-2.5 text-xs text-slate-400 font-medium">
                      <li>{isAr ? "الاحترام المتبادل والامتناع عن أي سلوك أو لفظ غير رياضي." : "Maintain mutual respect; zero tolerance for abusive or unsportsmanlike behavior."}</li>
                      <li>{isAr ? "التزام الحضور والمشاركة الفعالة في المباريات المسجل بها." : "Commit to confirmed match bookings; do not abandon teams."}</li>
                      <li>{isAr ? "تقييم الأقران بإنصاف وموضوعية بدون تحيز شخصي." : "Submit honest, unbiased peer ratings after matches."}</li>
                      <li>{isAr ? "احترام قرارات مسؤولي المجتمع ومالك الحجز." : "Respect decisions made by community admins and match hosts."}</li>
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
