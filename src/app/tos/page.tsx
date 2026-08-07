"use client";
import React from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { FileText, ShieldAlert, Users, Scale, AlertTriangle, CheckCircle2 } from "lucide-react";

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
              ? "يرجى قراءة هذه القواعد المحددة لضمان بيئة تنافسية عادلة ومحترمة لجميع لاعبي المنصة."
              : "Read our rules to guarantee fair, balanced, and respectful competition across all matches."}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl space-y-8 text-slate-300 leading-relaxed shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 text-xs font-semibold text-slate-400">
            <span>{isAr ? "منصة: 11Players (Hagoozat Elite)" : "Platform: 11Players (Hagoozat Elite)"}</span>
            <span>{isAr ? "آخر تحديث: أغسطس 2026" : "Last Updated: August 2026"}</span>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "1. قبول الشروط" : "1. Acceptance of Terms"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "إن وصولك واستخدامك لمنصة 11Players يعني موافقتك الكاملة وغير المشروطة على هذه الشروط والأحكام. إذا كنت لا توافق على أي بند منها، فيجب عليك عدم استخدام المنصة."
                : "By accessing or using 11Players, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the platform."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>{isAr ? "2. دقة بيانات اللاعب والنزاهة البدنية" : "2. Player Attributes Honesty & Accuracy"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "يتحمل كل لاعب مسؤولية إدخال بيانات حقيقية وواقعية (كالطول، الوزن، وتاريخ الميلاد والطاقات). يُحظر تماماً تعمد تضخيم الطاقات أو إدخال بيانات وهمية بهدف التلاعب بخوارزمية الموازنة. البيانات المضللة قد تؤدي إلى حظر الحساب فوراً."
                : "Users are strictly required to input authentic physical data (height, weight, date of birth, and stats). Artificially inflating attributes or submitting deceptive data to manipulate squad balance will result in account suspension."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "3. قواعد تقييم الأقران والسلوك" : "3. Peer Review Conduct & Fair Play"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>{isAr ? "موضوعية التقييم: يجب أن تعكس تقييمات الأقران (Peer Reviews) الأداء الفعلي للاعب في المباريات دون انحياز أو مجاملة." : "Objective Reviews: Peer reviews must strictly reflect match performance without bias."}</li>
              <li>{isAr ? "احترام المجتمع: يُحظر استخدام لغة مسيئة، أو إنشاء حسابات وهمية، أو محاولة تعطيل شات وتجربة المجتمع." : "Respectful Conduct: Abusive language, ghost accounts, or disruption of community chats is prohibited."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "4. صلاحيات الإدارة والمجتمع الأساسي" : "4. Home Community & Admin Governance"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "يمتلك مديرو المجتمعات الصلاحية الكاملة لإدارة قائمة اللاعبين والموافقة على تعديلات الطاقات. عند اختيار مجتمع أساسي (Home Community)، يتم قفل تعديل الطاقات لضمان صلاحية الأدمن."
                : "Community admins hold sole authority to manage rosters and validate attribute updates. Selecting a Home Community locks attribute edits to protect competitive integrity."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "5. تعديلات الخدمة والربط" : "5. System Evolution & Modifications"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "نحتفظ بالحق في تطوير الميزات وتعديل خوارزمية OVR وإضافة تحديثات مستمرة لتحسين موازنة الفرق وتجربة المستخدم."
                : "We reserve the right to upgrade algorithms, refine rating formulas, and release feature enhancements to elevate match balance."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
