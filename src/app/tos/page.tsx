"use client";
import React from "react";
import { useLocale } from "@/components/ThemeProvider";

export default function TosPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black text-emerald-500 mb-8">{isAr ? "شروط الخدمة" : "Terms of Service"}</h1>
        
        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "1. قبول الشروط" : "1. Acceptance of Terms"}</h2>
            <p>{isAr ? "باستخدامك لمنصة 11Players، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق، يرجى عدم استخدام خدماتنا." : "By using the 11Players platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "2. سلوك المستخدم" : "2. User Conduct"}</h2>
            <p>{isAr ? "أنت توافق على عدم استخدام الخدمة لأي غرض غير قانوني. يتضمن ذلك الاحترام المتبادل في غرف الدردشة وفي تقييمات اللاعبين. سيتم حظر أي مستخدم يسيء استخدام المنصة." : "You agree not to use the service for any unlawful purpose. This includes mutual respect in chat rooms and player ratings. Any user abusing the platform will be banned."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "3. المجتمعات والإدارة" : "3. Communities and Administration"}</h2>
            <p>{isAr ? "للمسؤولين الحق في قبول أو رفض أي طلب انضمام. يحق لمالك المنصة إغلاق أي مجتمع يخالف القوانين العامة." : "Admins have the right to accept or reject any join request. The platform owner reserves the right to close any community that violates general rules."}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
