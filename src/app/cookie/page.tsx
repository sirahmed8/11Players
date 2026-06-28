"use client";
import React from "react";
import { useLocale } from "@/components/ThemeProvider";

export default function CookiePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black text-amber-500 mb-8">{isAr ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"}</h1>
        
        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "1. ما هي ملفات تعريف الارتباط؟" : "1. What are Cookies?"}</h2>
            <p>{isAr ? "ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم حفظها على جهازك لتذكر تفضيلاتك وتسهيل عملية تسجيل الدخول." : "Cookies are small text files saved on your device to remember your preferences and facilitate the login process."}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "2. كيف نستخدمها؟" : "2. How We Use Them"}</h2>
            <p>{isAr ? "نستخدم ملفات تعريف الارتباط الأساسية فقط التي يتطلبها النظام مثل مصادقة Google للحفاظ على جلسة تسجيل الدخول، وحفظ المجتمع النشط الخاص بك." : "We only use essential cookies required by the system, such as Google authentication to maintain your login session, and saving your active community."}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
