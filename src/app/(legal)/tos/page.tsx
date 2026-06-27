"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/ThemeProvider';

const content = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: June 2026",
    intro: "Welcome to 11Players! These Terms of Service govern your use of our website and applications. By accessing or using our Service, you agree to be bound by these Terms.",
    sections: [
      {
        title: "1. Acceptance of Terms",
        body: "By creating an account, or by accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, you may not use the Service."
      },
      {
        title: "2. User Accounts",
        body: "To use certain features of the Service, you must register for an account using your Google account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
      },
      {
        title: "3. Community Guidelines",
        body: "You agree to interact respectfully with other members of the 11Players community. Harassment, abuse, cheating, stat manipulation, or unsporting conduct will result in account suspension or termination."
      },
      {
        title: "4. Intellectual Property",
        body: "The Service and its original content, features, and functionality are and will remain the exclusive property of 11Players and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of 11Players."
      },
      {
        title: "5. Termination",
        body: "We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
      },
      {
        title: "6. Limitation of Liability",
        body: "In no event shall 11Players, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service."
      }
    ],
    returnHome: "Return to Home"
  },
  ar: {
    title: "شروط الخدمة",
    lastUpdated: "آخر تحديث: يونيو 2026",
    intro: "مرحبًا بك في 11Players! تحكم شروط الخدمة هذه استخدامك لموقعنا وتطبيقاتنا. من خلال الوصول إلى الخدمة أو استخدامها، فإنك توافق على الالتزام بهذه الشروط.",
    sections: [
      {
        title: "1. قبول الشروط",
        body: "من خلال إنشاء حساب، أو من خلال الوصول إلى الخدمة أو استخدامها، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق، فلا يجوز لك استخدام الخدمة."
      },
      {
        title: "2. حسابات المستخدمين",
        body: "لاستخدام ميزات معينة في الخدمة، يجب عليك التسجيل للحصول على حساب باستخدام حساب جوجل الخاص بك. أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك وعن جميع الأنشطة التي تحدث تحت حسابك."
      },
      {
        title: "3. إرشادات المجتمع",
        body: "أنت توافق على التفاعل باحترام مع الأعضاء الآخرين في مجتمع 11Players. سيؤدي التحرش أو الإساءة أو الغش أو التلاعب بالإحصائيات أو السلوك غير الرياضي إلى تعليق الحساب أو إنهائه."
      },
      {
        title: "4. الملكية الفكرية",
        body: "الخدمة ومحتواها الأصلي وميزاتها ووظائفها هي وستظل ملكية حصرية لـ 11Players ومرخصيها. لا يجوز استخدام علاماتنا التجارية ومظهرنا التجاري فيما يتعلق بأي منتج أو خدمة دون موافقة كتابية مسبقة من 11Players."
      },
      {
        title: "5. الإنهاء",
        body: "يجوز لنا إنهاء أو تعليق حسابك على الفور، دون إشعار مسبق أو مسؤولية، لأي سبب كان، بما في ذلك على سبيل المثال لا الحصر إذا انتهكت الشروط."
      },
      {
        title: "6. حدود المسؤولية",
        body: "لن تكون 11Players بأي حال من الأحوال، ولا مديروها أو موظفوها أو شركاؤها أو وكلاؤها أو موردوها أو الشركات التابعة لها، مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية، بما في ذلك على سبيل المثال لا الحصر، خسارة الأرباح أو البيانات أو الاستخدام أو الشهرة أو الخسائر غير الملموسة الأخرى الناتجة عن وصولك إلى الخدمة أو استخدامها أو عدم قدرتك على الوصول إليها أو استخدامها."
      }
    ],
    returnHome: "العودة إلى الصفحة الرئيسية"
  }
};

export default function TermsOfService() {
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
