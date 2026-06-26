"use client";

import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/ThemeProvider';

const content = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: June 2026",
    intro: "This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.",
    sections: [
      {
        title: "1. Information Collection",
        body: "We collect information to provide better services to all our users. We may collect personal information such as your name, email address, physical characteristics (height, weight, preferred foot) and performance statistics within our application."
      },
      {
        title: "2. Use of Information",
        body: "The information we collect is used to personalize your experience, improve our website, generate your player card, and provide our core matchmaking service which requires analyzing your stats and play style to balance teams."
      },
      {
        title: "3. Data Sharing and Disclosure",
        body: "We do not sell your personal data. We may share your player profile statistics and matchmaking rating with other users within the platform to facilitate games. Administrators can access your data to manage community guidelines and verify accounts."
      },
      {
        title: "4. Data Security",
        body: "We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information. All supplied sensitive information is transmitted via Secure Socket Layer (SSL) technology."
      },
      {
        title: "5. Your Privacy Rights",
        body: "Depending on your location, you may have rights under applicable law to request access to, correction of, or deletion of your personal data. Please contact us to exercise these rights."
      }
    ],
    returnHome: "Return to Home"
  },
  ar: {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: يونيو 2026",
    intro: "تصف سياسة الخصوصية هذه سياساتنا وإجراءاتنا المتعلقة بجمع معلوماتك واستخدامها والإفصاح عنها عند استخدامك للخدمة، وتخبرك بحقوق الخصوصية الخاصة بك وكيف يحميك القانون.",
    sections: [
      {
        title: "1. جمع المعلومات",
        body: "نحن نجمع المعلومات لتقديم خدمات أفضل لجميع مستخدمينا. قد نقوم بجمع معلومات شخصية مثل اسمك وعنوان بريدك الإلكتروني وخصائصك البدنية (الطول والوزن والقدم المفضلة) وإحصائيات الأداء داخل تطبيقنا."
      },
      {
        title: "2. استخدام المعلومات",
        body: "يتم استخدام المعلومات التي نجمعها لتخصيص تجربتك، وتحسين موقعنا، وإنشاء بطاقة اللاعب الخاصة بك، وتقديم خدمة تكوين المباريات الأساسية لدينا والتي تتطلب تحليل إحصائياتك وأسلوب لعبك لموازنة الفرق."
      },
      {
        title: "3. مشاركة البيانات والإفصاح عنها",
        body: "نحن لا نبيع بياناتك الشخصية. قد نشارك إحصائيات ملف تعريف اللاعب الخاص بك وتصنيف تكوين المباريات مع مستخدمين آخرين داخل المنصة لتسهيل المباريات. يمكن للمسؤولين الوصول إلى بياناتك لإدارة إرشادات المجتمع والتحقق من الحسابات."
      },
      {
        title: "4. أمن البيانات",
        body: "نحن ننفذ مجموعة متنوعة من الإجراءات الأمنية للحفاظ على سلامة معلوماتك الشخصية عند إدخال أو إرسال أو الوصول إلى معلوماتك الشخصية. يتم نقل جميع المعلومات الحساسة المقدمة عبر تقنية طبقة المقابس الآمنة (SSL)."
      },
      {
        title: "5. حقوق الخصوصية الخاصة بك",
        body: "اعتمادًا على موقعك، قد يكون لديك حقوق بموجب القانون المعمول به لطلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها. يرجى الاتصال بنا لممارسة هذه الحقوق."
      }
    ],
    returnHome: "العودة إلى الصفحة الرئيسية"
  }
};

export default function PrivacyPolicy() {
  const { locale, isRTL } = useLocale();
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
          <Link href="/" className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors">
            {t.returnHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
