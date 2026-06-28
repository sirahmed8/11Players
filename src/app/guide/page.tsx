"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { useLocale } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

export default function GuidePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-800"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
              {isAr ? "دليل 11Players" : "11Players Guide"}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              {isAr 
                ? "كيف يتم تقييم اللاعبين، وصناعة المباريات، واحتساب الجوائز؟"
                : "How players are rated, matches are made, and trophies are awarded."}
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                {isAr ? "1. نظام التقييم الكلي (OVR)" : "1. Overall Rating System (OVR)"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {isAr 
                  ? "يتم حساب التقييم الكلي (Overall) بناءً على مركز اللاعب الأساسي. كل مركز له طاقات أساسية ذات وزن أكبر. على سبيل المثال، المهاجم (CF) يعتمد بشكل كبير على الوعي الهجومي، والإنهاء، والسرعة، بينما يعتمد قلب الدفاع (CB) على الوعي الدفاعي، وافتكاك الكرة، والقوة البدنية."
                  : "The Overall Rating (OVR) is calculated based on the player's primary position. Each position has key attributes that carry more weight. For example, a Center Forward (CF) relies heavily on Offensive Awareness, Finishing, and Speed, while a Center Back (CB) relies on Defensive Awareness, Ball Winning, and Physical Contact."}
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {isAr 
                    ? "💡 ملاحظة: الحد الأدنى لأي طاقة هو 40، والحد الأقصى هو 99."
                    : "💡 Note: The minimum for any attribute is 40, and the maximum is 99."}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                {isAr ? "2. صناعة المباريات العادلة (Matchmaking)" : "2. Fair Matchmaking"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {isAr 
                  ? "تستخدم خوارزمية صناعة المباريات التقييمات المعتمدة (Approved Attributes) لتقسيم اللاعبين الـ 22 إلى فريقين متكافئين. تحلل الخوارزمية تقييم كل لاعب، وتضمن توازن القوى الإجمالية بين الفريقين لتوفير تجربة لعب عادلة وتنافسية."
                  : "The matchmaking algorithm uses Approved Attributes to divide 22 players into two balanced teams. The algorithm analyzes each player's rating and ensures the total team strength is nearly identical, providing a fair and competitive playing experience."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                {isAr ? "3. التقييم حسب المركز والبدلاء (Position Ratings & The Bench)" : "3. Position Ratings & The Bench"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {isAr 
                  ? "لاختيار أفضل 22 لاعب للمباراة، يقوم النظام بحساب (مؤشر التقييم الخاص بالمركز - PSI) لكل لاعب. يأخذ هذا المؤشر في عين الاعتبار طاقات اللاعب ومدى ملاءمتها للمراكز المطلوبة في التشكيلة المحددة. أعلى 22 لاعب تقييماً في مراكزهم يبدؤون المباراة أساسيين، بينما يتم نقل البقية إلى دكة البدلاء مع توضيح سبب الاستبعاد."
                  : "To select the best 22 players for a match, the system calculates a Position Specific Index (PSI) for each player. This considers the player's attributes and how well they fit the required positions in the chosen formation. The top 22 highest-rated players for the available positions start the match, while the rest are placed on the Bench with a 'Benched Reason'."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                {isAr ? "4. الكرة الذهبية والجوائز (Ballon d'Or & Trophies)" : "4. Ballon d'Or & Trophies"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {isAr 
                  ? "في نهاية كل موسم، يقوم النظام بتوزيع الجوائز تلقائياً بناءً على إحصائيات المباريات:"
                  : "At the end of each season, the system automatically awards trophies based on match statistics:"}
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2 ml-4">
                <li><strong>{isAr ? "الكرة الذهبية 🏆:" : "Ballon d'Or 🏆:"}</strong> {isAr ? "تُمنح للاعب صاحب أعلى نقاط مساهمة (الأهداف × 2 + التمريرات الحاسمة × 1 + رجل المباراة × 5)." : "Awarded to the player with the highest contribution score (Goals × 2 + Assists × 1 + MVPs × 5)."}</li>
                <li><strong>{isAr ? "الحذاء الذهبي ⚽:" : "Golden Boot ⚽:"}</strong> {isAr ? "أكثر لاعب تسجيلاً للأهداف." : "Top goal scorer."}</li>
                <li><strong>{isAr ? "صانع الألعاب 👟:" : "Playmaker 👟:"}</strong> {isAr ? "أكثر لاعب صناعة للأهداف." : "Top assist provider."}</li>
                <li><strong>{isAr ? "رجل المباراة 🏅:" : "MVP 🏅:"}</strong> {isAr ? "أكثر لاعب حصل على جائزة رجل المباراة." : "Player with the most 'Man of the Match' awards."}</li>
              </ul>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
