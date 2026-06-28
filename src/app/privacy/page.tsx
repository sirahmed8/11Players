"use client";
import React from "react";
import { useLocale } from "@/components/ThemeProvider";

export default function PrivacyPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black text-amber-500 mb-8">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
        
        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "1. جمع المعلومات" : "1. Information Collection"}</h2>
            <p>{isAr ? "نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حسابك، مثل اسمك وبريدك الإلكتروني وصورة ملفك الشخصي المأخوذة من Google." : "We collect information you provide directly to us when you create an account, such as your name, email, and Google profile picture."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "2. استخدام المعلومات" : "2. Use of Information"}</h2>
            <p>{isAr ? "نستخدم المعلومات التي نجمعها لتوفير خدمات المنصة، صيانة وتحسين الميزات، وإنشاء المباريات وتقييمات اللاعبين." : "We use the information we collect to provide our services, maintain and improve features, and generate matchmakings and player ratings."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "3. مشاركة المعلومات" : "3. Information Sharing"}</h2>
            <p>{isAr ? "لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التي تتطلبها القوانين أو لغرض تقديم خدمات المنصة (مثل عرض تقييمك للمجتمع)." : "We do not share your personal information with third parties except when required by law or to provide our platform services (such as displaying your rating to the community)."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "4. أمان البيانات" : "4. Data Security"}</h2>
            <p>{isAr ? "نحن نتخذ تدابير معقولة للمساعدة في حماية معلوماتك من الفقدان أو السرقة أو الوصول غير المصرح به. جميع البيانات مخزنة بأمان على خوادم Firebase." : "We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. All data is securely stored on Firebase servers."}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
