"use client";
import React from "react";
import { useLocale } from "@/components/ui/ThemeProvider";

export default function TosPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black text-emerald-500 mb-8">{isAr ? "شروط الخدمة" : "Terms of Service"}</h1>
        
        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            {isAr ? "آخر تحديث: يوليو 2026" : "Last Updated: July 2026"}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "1. قبول الشروط" : "1. Acceptance of Terms"}</h2>
            <p>{isAr ? "باستخدامك لمنصة 11Players، فإنك توافق على الالتزام الكامل بهذه الشروط. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة." : "By using the 11Players platform, you agree to be fully bound by these Terms. If you do not agree to any part of the terms, you may not access the service."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "2. الحسابات والمسؤولية" : "2. Accounts and Responsibility"}</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{isAr ? "أنت مسؤول عن الحفاظ على سرية حسابك ومعلومات تسجيل الدخول عبر Google." : "You are responsible for safeguarding your account and Google login credentials."}</li>
              <li>{isAr ? "يجب أن تكون البيانات المدخلة في ملفك الشخصي دقيقة وواقعية، خاصة الطول والوزن والقدم المفضلة لتجنب التلاعب." : "Profile data must be accurate and realistic, especially height, weight, and preferred foot to avoid manipulation."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "3. سلوك المجتمع والمراجعات" : "3. Community Conduct & Peer Reviews"}</h2>
            <p className="mb-2">
              {isAr ? "منصة 11Players مبنية على التنافس العادل والمحترم:" : "11Players is built on fair and respectful competition:"}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{isAr ? "المراجعات (Peer Reviews): يجب أن تكون تقييماتك للاعبين الآخرين موضوعية وتستند إلى أدائهم الفعلي في الملعب." : "Peer Reviews: Your ratings of other players must be objective and based on actual pitch performance."}</li>
              <li>{isAr ? "يُمنع منعاً باتاً استخدام لغة مسيئة، أو التلاعب بنظام التقييمات والإحصائيات، أو إنشاء حسابات وهمية." : "Abusive language, manipulating the rating and stats system, or creating fake accounts is strictly prohibited."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "4. إدارة المجتمعات" : "4. Community Administration"}</h2>
            <p>{isAr ? "مديرو المجتمعات لهم الحق الكامل في الموافقة على انضمام اللاعبين أو طردهم من المجتمع الخاص بهم بناءً على تقديرهم. المنصة توفر الأدوات، ولكن الإدارة الداخلية للمجتمع تقع على عاتق مديريه." : "Community admins have the full right to approve or remove players from their community at their discretion. The platform provides the tools, but internal management is the responsibility of the admins."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "5. التغييرات في الخدمة" : "5. Changes to the Service"}</h2>
            <p>{isAr ? "نحتفظ بالحق في تعديل أو إيقاف الخدمة (بما في ذلك الميزات أو الإحصائيات أو الخوارزميات) في أي وقت دون إشعار مسبق لضمان تحسين المنصة المستمر." : "We reserve the right to modify or discontinue the service (including features, stats, or algorithms) at any time without prior notice to ensure continuous platform improvement."}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
