"use client";
import React from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { ShieldCheck, Lock, Eye, Database, Server, UserCheck, Trash2, Globe, Mail } from "lucide-react";

export default function PrivacyPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 sm:px-6" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? "حماية البيانات والخصوصية" : "Data Protection & Privacy"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {isAr ? "سياسة الخصوصية الرسمية" : "Privacy Policy"}
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-xl mx-auto">
            {isAr
              ? "نحن نأخذ خصوصية بياناتك بأقصى درجات الجدية والأمان."
              : "We are committed to protecting your personal data and your right to privacy."}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl space-y-8 text-slate-300 leading-relaxed shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 text-xs font-semibold text-slate-400">
            <span>{isAr ? "منصة: 11Players" : "Platform: 11Players"}</span>
            <span>{isAr ? "آخر تحديث: أغسطس 2026" : "Last Updated: August 2026"}</span>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "1. البيانات التي نجمعها" : "1. Information We Collect"}</span>
            </h2>
            <p className="text-sm text-slate-400">
              {isAr
                ? "لتقديم خدمات موازنة الفرق والتقييم الواقعي للاعبين، نجمع الأنواع التالية من البيانات فقط:"
                : "To provide accurate player ratings, team balancing, and match management, we collect:"}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>
                <strong>{isAr ? "معلومات الحساب:" : "Account Information:"}</strong>{" "}
                {isAr
                  ? "الاسم الكامل، عنوان البريد الإلكتروني، وصورة الملف الشخصي كما تُقدَّم عبر مزود تسجيل الدخول (Google Authentication)."
                  : "Full name, email address, and profile photo as provided by your authentication provider (Google OAuth)."}
              </li>
              <li>
                <strong>{isAr ? "البيانات البدنية للاعب:" : "Player Physical Data:"}</strong>{" "}
                {isAr
                  ? "الطول، الوزن، تاريخ الميلاد، القدم المفضلة، والمراكز لحساب مؤشر الملاءمة الموضعية (PSI) والتقييم العام (OVR)."
                  : "Height, weight, date of birth, preferred foot, and preferred positions to calculate your Positional Suitability Index (PSI) and Overall Rating (OVR)."}
              </li>
              <li>
                <strong>{isAr ? "إحصائيات الأداء:" : "Performance Statistics:"}</strong>{" "}
                {isAr
                  ? "الأهداف، الأسيست، عدد المباريات، جوائز أفضل لاعب (MVP)، وتقييمات الأقران داخل مجتمعاتك."
                  : "Goals, assists, matches played, MVP awards, and peer review ratings within your communities."}
              </li>
              <li>
                <strong>{isAr ? "بيانات الاستخدام التقنية:" : "Technical Usage Data:"}</strong>{" "}
                {isAr
                  ? "نوع المتصفح، نظام التشغيل، عناوين IP المجهّلة، وبيانات الجلسة لتحسين استقرار المنصة وأمانها."
                  : "Browser type, operating system, anonymized IP addresses, and session data for platform stability and security."}
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "2. كيف نستخدم بياناتك" : "2. How We Use Your Data"}</span>
            </h2>
            <p className="text-sm text-slate-400">
              {isAr ? "نستخدم بياناتك حصراً للأغراض التالية:" : "We process your data exclusively for the following purposes:"}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>{isAr ? "توليد فرق متوازنة وعادلة باستخدام خوارزمية التقييم." : "Generating balanced and fair teams using our rating algorithm."}</li>
              <li>{isAr ? "توصيات 11AI التكتيكية بناءً على سماتك وأسلوب لعبك." : "Providing 11AI tactical recommendations based on your attributes and playstyle."}</li>
              <li>{isAr ? "احتساب الإنجازات والأوسمة ولوحات المتصدرين." : "Calculating achievements, badges, and leaderboard standings."}</li>
              <li>{isAr ? "تحسين استقرار المنصة وتجربة المستخدم." : "Improving platform stability and user experience."}</li>
              <li>{isAr ? "إرسال إشعارات ضرورية تتعلق بحسابك (لا رسائل تسويقية)." : "Sending essential account-related notifications (no marketing emails)."}</li>
            </ul>
            <p className="text-sm text-slate-400 mt-2">
              {isAr
                ? "نحن لا نستخدم بياناتك لأي أغراض تجارية أو إعلانية."
                : "We do not use your data for any commercial or advertising purposes."}
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "3. الخدمات الخارجية ومشاركة البيانات" : "3. Third-Party Services & Data Sharing"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "تعتمد المنصة على الخدمات التالية من جوجل لتشغيل البنية التحتية:"
                : "11Players operates on the following Google services for infrastructure:"}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li><strong>Firebase Authentication</strong> — {isAr ? "تسجيل الدخول الآمن عبر Google." : "Secure Google OAuth login."}</li>
              <li><strong>Cloud Firestore</strong> — {isAr ? "تخزين بيانات اللاعبين والمباريات." : "Player and match data storage."}</li>
              <li><strong>Firebase Hosting</strong> — {isAr ? "استضافة تطبيق الويب." : "Web application hosting."}</li>
            </ul>
            <p className="text-sm text-slate-400 mt-2">
              {isAr
                ? "تستوفي هذه الخدمات متطلبات اللائحة الأوروبية لحماية البيانات (GDPR) وسياسات خصوصية جوجل. نحن لا نبيع، نؤجر، أو نشارك بياناتك مع أي طرف ثالث خارج هذه الخدمات الأساسية."
                : "These services comply with GDPR and Google's privacy standards. We do not sell, rent, or share your data with any external third parties beyond these essential infrastructure services."}
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "4. أمان البيانات" : "4. Data Security"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "جميع البيانات مشفّرة أثناء النقل (TLS/HTTPS) وفي حالة السكون عبر بنية Firebase الموثوقة. يخضع الوصول إلى قاعدة البيانات لقواعد أمان Firestore الصارمة التي تمنع الوصول غير المصرح به من أي مصدر خارجي."
                : "All data is encrypted in transit (TLS/HTTPS) and at rest via Firebase's infrastructure. Access to the database is governed by strict Firestore Security Rules that prevent any unauthorized external access."}
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "5. مدة الاحتفاظ بالبيانات" : "5. Data Retention"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "نحتفظ بيانات حسابك وإحصائياتك طالما حسابك نشط على المنصة. عند حذف الحساب، يتم إزالة جميع البيانات الشخصية من قاعدة البيانات خلال 30 يوماً كحد أقصى، باستثناء ما قد تلزم به متطلبات قانونية."
                : "We retain your account data and statistics for as long as your account is active. Upon account deletion, all personal data is removed from our databases within 30 days, except where required by applicable law."}
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "6. حقوقك" : "6. Your Rights"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li><strong>{isAr ? "حق الوصول:" : "Right of Access:"}</strong> {isAr ? "يمكنك طلب نسخة من بياناتك الشخصية المحفوظة." : "You may request a copy of your stored personal data."}</li>
              <li><strong>{isAr ? "حق التعديل:" : "Right to Rectification:"}</strong> {isAr ? "يمكنك تعديل بياناتك في أي وقت عبر صفحة 'تعديل الملف الشخصي'." : "You may edit your data at any time via the 'Edit Profile' page."}</li>
              <li><strong>{isAr ? "حق الحذف:" : "Right to Erasure:"}</strong> {isAr ? "يمكنك طلب حذف حسابك وجميع بياناتك نهائياً عبر التواصل معنا." : "You may request permanent deletion of your account and all associated data by contacting us."}</li>
              <li><strong>{isAr ? "حق الاعتراض:" : "Right to Object:"}</strong> {isAr ? "يمكنك الاعتراض على أي نوع من معالجة بياناتك." : "You may object to any specific data processing activity."}</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "7. حسابات القاصرين" : "7. Minors"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "منصة 11Players غير مخصصة للأطفال دون سن 13 عاماً. لا نجمع عن قصد أي بيانات من أطفال دون هذا السن. إذا اكتشفنا ذلك، سنقوم بحذف الحساب والبيانات فوراً."
                : "11Players is not directed at children under 13 years of age. We do not knowingly collect personal data from children. If we discover such an account, we will immediately delete it and all associated data."}
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "8. التواصل معنا" : "8. Contact Us"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "إذا كان لديك أي استفسار أو طلب يتعلق بخصوصيتك أو بياناتك، يمكنك التواصل معنا عبر صفحة الدعم داخل المنصة. سنرد على طلبك خلال 7 أيام عمل."
                : "If you have any questions or requests regarding your privacy or personal data, please contact us via the Support page within the platform. We will respond within 7 business days."}
            </p>
            <p className="text-sm text-slate-400">
              {isAr
                ? "باستخدامك لمنصة 11Players، فأنت توافق على الشروط المذكورة في هذه السياسة. نحتفظ بالحق في تحديث هذه السياسة في أي وقت، مع الإشعار بالتغييرات الجوهرية."
                : "By using 11Players, you agree to the terms described in this policy. We reserve the right to update this policy at any time and will notify users of significant changes."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
