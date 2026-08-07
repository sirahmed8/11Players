"use client";
import React from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { ShieldCheck, Lock, Eye, Database, Server, UserCheck } from "lucide-react";

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
            {isAr ? "سياسة الخصوصية الرسمية" : "Official Privacy Policy"}
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-xl mx-auto">
            {isAr 
              ? "نحن نأخذ خصوصية بياناتك الرياضية وشخصيتك بأقصى درجات الجدية والأمان."
              : "We prioritize the security, privacy, and integrity of your personal and sports data."}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl space-y-8 text-slate-300 leading-relaxed shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 text-xs font-semibold text-slate-400">
            <span>{isAr ? "منصة: 11Players" : "Platform: 11Players"}</span>
            <span>{isAr ? "آخر تحديث: أغسطس 2026" : "Last Updated: August 2026"}</span>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "1. البيانات التي نجمعها" : "1. Information We Collect"}</span>
            </h2>
            <p className="text-sm text-slate-400">
              {isAr 
                ? "لتقديم أفضل تجربة موازنة فرق وتقييم واقعي للاعبين، نقوم بجمع البيانات التالية فقط:"
                : "To deliver accurate matchmaking, player ratings, and stats, we process the following data:"}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li><strong>{isAr ? "معلومات الحساب" : "Account Identifiers"}:</strong> {isAr ? "الاسم الكامل، البريد الإلكتروني، وصورة الحساب المزامنة عبر Google Authentication." : "Full name, email address, and profile photo synchronized via Google Auth."}</li>
              <li><strong>{isAr ? "البيانات الرياضية البدنية" : "Physical Attributes"}:</strong> {isAr ? "الطول، الوزن، العمر المتقدر، القدم المفضلة، والمراكز الأساسية/الثانوية لتحديد خوارزمية التقييم العام (OVR)." : "Height, weight, calculated age, preferred foot, and positions to drive the Positional Suitability Index (PSI)."}</li>
              <li><strong>{isAr ? "إحصائيات اللعب" : "Match & Performance Stats"}:</strong> {isAr ? "الأهداف، الصناعة، التمريرات، عدد المباريات، وتقييمات الأقران (Peer Reviews) في مجتمعاتك." : "Goals, assists, matches played, MVPs, and community peer review ratings."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "2. استخدام وتوظيف البيانات" : "2. How We Utilize Your Data"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>{isAr ? "توزيع الفرق العادل: استخدام سماتك وحساب الـ OVR لضمان عدم انحياز أي فريق في المباريات." : "Deterministic Matchmaking: Utilizing attributes and OVR to auto-generate balanced squads."}</li>
              <li>{isAr ? "التوصيات التكتيكية من 11AI: تقديم مقترحات الملاءمة للمراكز وأسلوب اللعب بناءً على البنية البدنية." : "11AI Tactical Coaching: Recommending best positions and playstyles tailored to your build."}</li>
              <li>{isAr ? "عرض الإنجازات والجوائز: احتساب الأوسمة وتصنيفات الأداء في لوحة المتصدرين للمجتمع." : "Leaderboard & Skill Tree: Granting badges and tracking season trophy standings."}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "3. الأمان وعدم بيع البيانات" : "3. Security & Zero Commercial Sharing"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "نحن نلتزم بشرط صارم: لا يتم بيع، أو تأجير، أو مشاركة أي من بياناتك الشخصية مع أي جهات إعلانية أو أطراف ثالثة خارجية على الإطلاق. يتم مشفر وتخزين جميع البيانات عبر خوادم Firebase الموثوقة."
                : "We enforce a strict zero commercial sharing policy. Your private data is never sold, rented, or distributed to advertising networks. All transactions are securely stored on encrypted Firebase cloud infrastructure."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "4. حقوق الحذف والتعديل" : "4. Control, Modifications & Deletion"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr 
                ? "يمكنك تعديل بياناتك الشخصية في أي وقت عبر زر 'تعديل الملف الشخصي'. إذا رغبت في حذف حسابك وبياناتك نهائياً من قاعدة البيانات، يمكنك طلب ذلك مباشرة من مدير مجتمعك أو التواصل معنا."
                : "You maintain full ownership of your data. You can edit your attributes at any time via 'Edit Profile'. Permanent deletion requests can be initiated directly through your community admin or support."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
