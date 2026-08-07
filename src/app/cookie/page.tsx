"use client";
import React from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { ShieldCheck, Cookie, Settings, Server, EyeOff } from "lucide-react";

export default function CookiePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 sm:px-6" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Cookie className="w-4 h-4" />
            <span>{isAr ? "إدارة الجلسات والملفات" : "Session & Storage Policy"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {isAr ? "سياسة ملفات الارتباط (Cookies)" : "Cookie Policy"}
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-xl mx-auto">
            {isAr 
              ? "تعرف على كيفية استخدامنا لملفات الارتباط الضرورية لتأمين جلساتك وتخصيص تفضيلاتك."
              : "Understand how essential storage and cookies keep your session safe and preferences saved."}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl space-y-8 text-slate-300 leading-relaxed shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 text-xs font-semibold text-slate-400">
            <span>{isAr ? "منصة: 11Players (Hagoozat Elite)" : "Platform: 11Players (Hagoozat Elite)"}</span>
            <span>{isAr ? "آخر تحديث: أغسطس 2026" : "Last Updated: August 2026"}</span>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Cookie className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "1. ما هي ملفات الارتباط والتخزين المحلي؟" : "1. What Are Cookies & Local Storage?"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "ملفات الارتباط (Cookies) والتخزين المحلي (LocalStorage) هي تقنيات آمنة تتيح للمتصفح حفظ الجلسة وتفضيلات اللغة والوضع الليلي دون الحاجة إلى إعادة اختيارها عند كل زيارة."
                : "Cookies and LocalStorage are secure technical mechanisms that enable your browser to maintain your session tokens, language choices, and theme preferences."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "2. أغراض الاستخدام التقني" : "2. Technical Usage Objectives"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li><strong>{isAr ? "تأمين الجلسة والمصادقة" : "Authentication & Session Security"}:</strong> {isAr ? "تخزين رمز الدخول المشفر لـ Firebase Auth لضمان بقائك متصلاً بحسابك بأمان." : "Storing encrypted Firebase Auth tokens to maintain your login securely."}</li>
              <li><strong>{isAr ? "تفضيلات واجهة المستخدم" : "UI & Localization Preferences"}:</strong> {isAr ? "حفظ اختيار اللغة (عربي / إنجليزي) والمجتمع النشط المختار." : "Saving active language choice (EN / AR) and active community workspace ID."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "3. لا وجود لملفات التتبع الإعلاني" : "3. No Advertising Trackers"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "نحن لا نستخدم أي ملفات ارتباط إعلانية أو تتبع تجاري للأنشطة الخارجية على الإطلاق. منصة 11Players خالية تماماً من الإعلانات وملفات التتبع التابعة لأطراف ثالثة."
                : "We do not utilize any third-party advertising, remarketing, or behavioral tracking cookies. 11Players is completely ad-free and dedicated solely to football match organization."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
