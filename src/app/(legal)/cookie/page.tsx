"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/ThemeProvider';

const content = {
  en: {
    title: "Cookie Policy",
    lastUpdated: "Last updated: June 2026",
    intro: "This Cookie Policy explains what Cookies are and how We use them. You should read this policy so You can understand what type of cookies We use, or the information We collect using Cookies and how that information is used.",
    sections: [
      {
        title: "1. What are Cookies?",
        body: "Cookies are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses."
      },
      {
        title: "2. How We Use Cookies",
        body: "We use Cookies to improve your experience on our site, including keeping you signed in, remembering your theme preferences (light/dark mode) and your language preference (Arabic/English)."
      },
      {
        title: "3. Types of Cookies We Use",
        body: "We primarily use Essential Cookies (to authenticate users and prevent fraudulent use of user accounts), Preference Cookies (to remember choices you make like language and theme), and Analytics Cookies (to track information about traffic to the website)."
      },
      {
        title: "4. Your Choices Regarding Cookies",
        body: "If You prefer to avoid the use of Cookies on the Website, first You must disable the use of Cookies in your browser and then delete the Cookies saved in your browser associated with this website. You may use this option for preventing the use of Cookies at any time."
      }
    ],
    returnHome: "Return to Home"
  },
  ar: {
    title: "سياسة ملفات تعريف الارتباط",
    lastUpdated: "آخر تحديث: يونيو 2026",
    intro: "توضح سياسة ملفات تعريف الارتباط هذه ماهية ملفات تعريف الارتباط وكيفية استخدامنا لها. يجب عليك قراءة هذه السياسة حتى تتمكن من فهم نوع ملفات تعريف الارتباط التي نستخدمها، أو المعلومات التي نجمعها باستخدام ملفات تعريف الارتباط وكيفية استخدام هذه المعلومات.",
    sections: [
      {
        title: "1. ما هي ملفات تعريف الارتباط؟",
        body: "ملفات تعريف الارتباط هي ملفات صغيرة يتم وضعها على جهاز الكمبيوتر أو الجهاز المحمول أو أي جهاز آخر بواسطة موقع ويب، وتحتوي على تفاصيل سجل التصفح الخاص بك على هذا الموقع من بين استخداماتها العديدة."
      },
      {
        title: "2. كيف نستخدم ملفات تعريف الارتباط",
        body: "نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا، بما في ذلك إبقائك مسجلاً للدخول، وتذكر تفضيلات المظهر الخاص بك (الوضع الفاتح/الداكن) وتفضيلات اللغة الخاصة بك (العربية/الإنجليزية)."
      },
      {
        title: "3. أنواع ملفات تعريف الارتباط التي نستخدمها",
        body: "نحن نستخدم بشكل أساسي ملفات تعريف الارتباط الأساسية (لمصادقة المستخدمين ومنع الاستخدام الاحتيالي لحسابات المستخدمين)، وملفات تعريف ارتباط التفضيلات (لتذكر الاختيارات التي تقوم بها مثل اللغة والمظهر)، وملفات تعريف ارتباط التحليلات (لتتبع المعلومات حول حركة المرور إلى موقع الويب)."
      },
      {
        title: "4. خياراتك فيما يتعلق بملفات تعريف الارتباط",
        body: "إذا كنت تفضل تجنب استخدام ملفات تعريف الارتباط على موقع الويب، فيجب عليك أولاً تعطيل استخدام ملفات تعريف الارتباط في متصفحك ثم حذف ملفات تعريف الارتباط المحفوظة في متصفحك المرتبطة بهذا الموقع. يمكنك استخدام هذا الخيار لمنع استخدام ملفات تعريف الارتباط في أي وقت."
      }
    ],
    returnHome: "العودة إلى الصفحة الرئيسية"
  }
};

export default function CookiePolicy() {
  const { locale, isRTL } = useLocale();
  const router = useRouter();
  const t = content[locale as 'en' | 'ar'] ?? content.ar;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center py-16 px-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">{t.title}</h1>
        <p className="mb-4 text-slate-600 dark:text-slate-400 text-sm font-medium">{t.lastUpdated}</p>
        <p className="mb-8 leading-relaxed text-slate-800 dark:text-slate-300">{t.intro}</p>
        
        {t.sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-white">{section.title}</h2>
            <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">{section.body}</p>
          </div>
        ))}
        
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <button onClick={() => router.back()} className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors">
            {t.returnHome}
          </button>
        </div>
      </div>
    </div>
  );
}
