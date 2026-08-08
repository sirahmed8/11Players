"use client";
import React from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { FileText, ShieldAlert, Users, Scale, AlertTriangle, CheckCircle2, Ban, Mail, Gavel } from "lucide-react";

export default function TosPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 sm:px-6" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>{isAr ? "القواعد والتنظيم" : "Terms & Regulations"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {isAr ? "شروط الخدمة والاستخدام" : "Terms of Service"}
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-xl mx-auto">
            {isAr
              ? "يرجى قراءة هذه الشروط بعناية قبل استخدام المنصة. استخدامك للمنصة يُعدّ قبولاً كاملاً لهذه الشروط."
              : "Please read these Terms carefully before using the platform. Your use of 11Players constitutes your full acceptance of these Terms."}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl space-y-8 text-slate-300 leading-relaxed shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 text-xs font-semibold text-slate-400">
            <span>{isAr ? "منصة: 11Players" : "Platform: 11Players"}</span>
            <span>{isAr ? "آخر تحديث: أغسطس 2026" : "Last Updated: August 2026"}</span>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "1. قبول الشروط" : "1. Acceptance of Terms"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "بالوصول إلى منصة 11Players أو استخدامها بأي شكل من الأشكال، فأنت تقر بأنك قرأت هذه الشروط وفهمتها ووافقت على الالتزام بها. إذا كنت لا توافق على أي من هذه الشروط، يجب عليك التوقف عن استخدام المنصة فوراً. هذه الشروط تُشكّل اتفاقاً ملزماً قانونياً بينك وبين منصة 11Players."
                : "By accessing or using 11Players in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these Terms, you must immediately discontinue use of the platform. These Terms constitute a legally binding agreement between you and 11Players."}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "2. وصف الخدمة" : "2. Description of Service"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "11Players (حجوزات إيليت) هي منصة رقمية لإدارة مباريات كرة القدم الغير رسمية (الحجوزات)، تتيح: تقييم اللاعبين وفق مؤشر الملاءمة الموضعية (PSI)، توليد فرق متوازنة، تسجيل إحصائيات المباريات، وإدارة المجتمعات الرياضية. المنصة مخصصة للاستخدام الترفيهي والتنظيمي للألعاب غير الرسمية فقط."
                : "11Players (Hagoozat Elite) is a digital platform for managing informal football matches (hagoozat), enabling: player rating via the Positional Suitability Index (PSI), balanced team generation, match statistics recording, and sports community management. The platform is intended exclusively for recreational and organizational use of non-professional games."}
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "3. أهلية المستخدم" : "3. User Eligibility"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>{isAr ? "يجب أن يكون عمرك 13 عاماً أو أكثر لاستخدام المنصة." : "You must be at least 13 years of age to use the platform."}</li>
              <li>{isAr ? "إذا كنت دون سن 18، فأنت تقرّ بأنك حصلت على إذن من ولي أمرك." : "If you are under 18, you confirm that you have obtained parental or guardian consent."}</li>
              <li>{isAr ? "يجب أن تكون قادراً قانونياً على إبرام عقود ملزمة في دولتك." : "You must have the legal capacity to enter into binding contracts in your jurisdiction."}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>{isAr ? "4. دقة البيانات ونزاهة اللاعب" : "4. Data Accuracy & Fair Play"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "أنت مسؤول مسؤولية كاملة عن دقة المعلومات التي تقدمها، بما في ذلك: الطول، الوزن، تاريخ الميلاد، والقدرات الرياضية. يُحظر تعمّد تضخيم الطاقات أو إدخال بيانات مزيفة بهدف التلاعب بخوارزمية موازنة الفرق. انتهاك هذا البند قد يُفضي إلى إيقاف الحساب أو حظره نهائياً دون إنذار مسبق."
                : "You are solely responsible for the accuracy of the information you submit, including height, weight, date of birth, and athletic abilities. Intentionally inflating stats or entering false data to manipulate the team-balancing algorithm is strictly prohibited and may result in immediate account suspension or permanent ban without prior notice."}
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              <span>{isAr ? "5. السلوك المحظور" : "5. Prohibited Conduct"}</span>
            </h2>
            <p className="text-sm text-slate-400">{isAr ? "يُحظر تحديداً ما يلي:" : "The following are strictly prohibited:"}</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>{isAr ? "إنشاء حسابات وهمية أو متعددة لشخص واحد." : "Creating fake accounts or multiple accounts for the same person."}</li>
              <li>{isAr ? "التحرش، التنمر، أو استخدام لغة مسيئة في أي من مساحات المجتمع أو الدردشة." : "Harassment, bullying, or abusive language in any community space or chat."}</li>
              <li>{isAr ? "محاولة اختراق أو تعطيل خوادم المنصة أو قواعد بياناتها." : "Attempting to hack, reverse engineer, or disrupt platform servers or databases."}</li>
              <li>{isAr ? "انتحال شخصية لاعب آخر أو مسؤول في المنصة." : "Impersonating another player or platform administrator."}</li>
              <li>{isAr ? "نشر محتوى مخالف للقانون أو مسيء أو ذو طابع سياسي أو ديني." : "Publishing unlawful, offensive, political, or religious content."}</li>
              <li>{isAr ? "استخدام المنصة لأي غرض تجاري دون موافقة خطية مسبقة." : "Using the platform for any commercial purpose without prior written consent."}</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "6. صلاحيات إدارة المجتمع" : "6. Community Admin Authority"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "يمتلك مديرو المجتمعات الصلاحية الكاملة لإدارة قائمة اللاعبين، والموافقة على تعديلات الطاقات، وإزالة الأعضاء المخالفين. قرارات المدير داخل مجتمعه تعدّ نهائية ومُلزمة. 11Players غير مسؤولة عن قرارات إدارة المجتمعات الفردية."
                : "Community admins hold full authority to manage rosters, validate attribute edits, and remove violating members. Admin decisions within their community are final and binding. 11Players is not liable for decisions made by individual community administrators."}
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>{isAr ? "7. إخلاء المسؤولية" : "7. Disclaimer of Warranties"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "تُقدَّم منصة 11Players \"كما هي\" دون أي ضمانات صريحة أو ضمنية. نحن لا نضمن أن الخدمة ستكون خالية من الأخطاء أو الانقطاعات في جميع الأوقات. لا تتحمل المنصة أي مسؤولية عن أي أضرار ناجمة عن استخدامها أو عدم القدرة على استخدامها."
                : "11Players is provided \"as is\" without any express or implied warranties. We do not guarantee that the service will be error-free or uninterrupted at all times. The platform is not liable for any damages arising from use or inability to use the service."}
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Gavel className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "8. تعديلات الخدمة والشروط" : "8. Modifications to Terms & Service"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "نحتفظ بالحق في تعديل هذه الشروط أو أي جزء من الخدمة في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر المنصة. استمرارك في استخدام المنصة بعد نشر التعديلات يُعدّ قبولاً صريحاً لها."
                : "We reserve the right to modify these Terms or any aspect of the service at any time. You will be notified of material changes through the platform. Continued use of the platform after changes are posted constitutes your explicit acceptance."}
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "9. التواصل والنزاعات" : "9. Contact & Disputes"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "إذا كان لديك أي شكوى أو نزاع يتعلق بهذه الشروط أو الخدمة، يُرجى التواصل معنا أولاً عبر صفحة الدعم للوصول إلى حل ودي. في حال تعذّر ذلك، يُحسم أي نزاع وفق القوانين المعمول بها في جمهورية مصر العربية."
                : "If you have any complaints or disputes regarding these Terms or the service, please first contact us via the Support page to reach an amicable resolution. If unresolved, any dispute shall be governed by the applicable laws of the Arab Republic of Egypt."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
