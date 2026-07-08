"use client";
import React from "react";
import { useLocale } from "@/components/ThemeProvider";

export default function CookiePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black text-emerald-500 mb-8">{isAr ? "سياسة ملفات الارتباط" : "Cookie Policy"}</h1>
        
        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            {isAr ? "آخر تحديث: يوليو 2026" : "Last Updated: July 2026"}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "1. ما هي ملفات الارتباط؟" : "1. What are Cookies?"}</h2>
            <p>{isAr ? "ملفات الارتباط (Cookies) هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة منصة 11Players. تساعدنا هذه الملفات على تذكر تفضيلاتك وتوفير تجربة مستخدم سلسة." : "Cookies are small text files stored on your device when you visit the 11Players platform. They help us remember your preferences and provide a seamless user experience."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "2. كيف نستخدم ملفات الارتباط؟" : "2. How We Use Cookies"}</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{isAr ? "المصادقة: نستخدم ملفات الارتباط للحفاظ على تسجيل دخولك وتأمين حسابك." : "Authentication: We use cookies to keep you logged in and secure your account."}</li>
              <li>{isAr ? "التفضيلات: نتذكر إعداداتك المفضلة مثل اللغة (عربي/إنجليزي) والوضع الليلي/النهاري." : "Preferences: We remember your preferred settings such as language (Ar/En) and dark/light mode."}</li>
              <li>{isAr ? "المجتمع النشط: حفظ المجتمع الذي قمت باختياره لعدم الحاجة لتحديده في كل زيارة." : "Active Community: Saving your currently selected community so you don't have to choose it on every visit."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "3. ملفات ارتباط الطرف الثالث" : "3. Third-Party Cookies"}</h2>
            <p>{isAr ? "نحن لا نستخدم ملفات ارتباط إعلانية لتتبعك. نستخدم فقط خدمات ضرورية مثل Firebase لضمان استقرار التطبيق ومزامنة البيانات في الوقت الفعلي." : "We do not use advertising cookies to track you. We only use essential services like Firebase to ensure app stability and real-time data synchronization."}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
