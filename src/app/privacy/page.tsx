"use client";
import React from "react";
import { useLocale } from "@/components/ThemeProvider";

export default function PrivacyPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-black text-emerald-500 mb-8">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
        
        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            {isAr ? "آخر تحديث: يوليو 2026" : "Last Updated: July 2026"}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "1. جمع المعلومات" : "1. Information Collection"}</h2>
            <p className="mb-2">
              {isAr ? "نقوم بجمع المعلومات التي تقدمها لنا مباشرة لتمكين ميزات المنصة (الإحصائيات، النصائح والميزات). يشمل ذلك:" : "We collect information you provide directly to us to enable platform features (stats, advices, and features). This includes:"}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{isAr ? "معلومات الحساب: الاسم، البريد الإلكتروني، والصورة عبر تسجيل الدخول بحساب Google." : "Account Information: Name, email, and photo via Google authentication."}</li>
              <li>{isAr ? "بيانات اللاعب: الطول، الوزن، العمر، والقدم المفضلة لبناء تقييمات واقعية للإحصائيات الخاصة بك." : "Player Data: Height, weight, age, and preferred foot to build realistic stats and ratings."}</li>
              <li>{isAr ? "بيانات اللعب: التقييمات عبر مراجعات الأقران (Peer Reviews)، الأهداف، التمريرات، وحالة المزاج الخاصة بك." : "Gameplay Data: Ratings via peer reviews, goals, assists, and mood/form status."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "2. كيف نستخدم معلوماتك" : "2. How We Use Your Information"}</h2>
            <p className="mb-2">
              {isAr ? "تستخدم 11Players هذه البيانات لتوفير تجربة لا مثيل لها في تنظيم المباريات:" : "11Players uses this data to provide an unmatched matchmaking experience:"}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{isAr ? "خوارزمية صناعة المباريات: نستخدم طاقاتك لتقسيم الفرق بشكل عادل لضمان تنافسية المباريات." : "Matchmaking Algorithm: We use your attributes to divide teams fairly to ensure competitive matches."}</li>
              <li>{isAr ? "تتبع الإحصائيات (Stats): تتبع تاريخك وإنجازاتك في المجتمع لعرض جوائز نهاية الموسم." : "Stats Tracking: Tracking your history and achievements to display end-of-season trophies."}</li>
              <li>{isAr ? "نظام النصائح والإشعارات (Advices): لتقديم نصائح شخصية وتحديثات هامة لمجتمعك." : "Advices & Notifications: To provide personalized advices and important updates for your community."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "3. مشاركة المعلومات وحمايتها" : "3. Information Sharing and Security"}</h2>
            <p className="mb-2">
              {isAr 
                ? "خصوصيتك محمية بالكامل. لا نشارك بياناتك مع معلنين أو أطراف ثالثة خارجية. داخل المنصة، إحصائياتك وتقييماتك (Stats & Features) تكون مرئية لأعضاء مجتمعك لتسهيل تنظيم المباريات. يتم تخزين البيانات بشكل آمن على خوادم Firebase المشفرة."
                : "Your privacy is fully protected. We do not share your data with advertisers or external third parties. Within the platform, your stats and ratings (Stats & Features) are visible to your community members to facilitate match organization. Data is securely stored on encrypted Firebase servers."}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{isAr ? "4. حقوقك" : "4. Your Rights"}</h2>
            <p>
              {isAr 
                ? "لك كامل الحق في تعديل بياناتك الشخصية في أي وقت من خلال ملفك الشخصي. في حال رغبتك بحذف بياناتك بالكامل، يمكنك التواصل مع مسؤول المجتمع أو مسؤول النظام لإزالة حسابك نهائياً." 
                : "You have the full right to modify your personal data at any time through your profile. If you wish to completely delete your data, you can contact your community admin or the system administrator to permanently remove your account."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
