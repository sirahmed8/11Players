"use client";
import React from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Cookie, Settings, EyeOff, Trash2, ToggleLeft, Info, Mail } from "lucide-react";

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
              ? "تشرح هذه السياسة كيفية استخدام منصة 11Players لملفات الارتباط والتخزين المحلي وما يمكنك فعله حيال ذلك."
              : "This policy explains how 11Players uses cookies and local storage, and what choices you have regarding their use."}
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
              <Info className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "1. ما هي ملفات الارتباط؟" : "1. What Are Cookies?"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "ملفات الارتباط (Cookies) هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة موقع ويب. تُستخدم لتذكر تفضيلاتك والحفاظ على جلسة تسجيل دخولك. بالإضافة إلى ذلك، قد تستخدم المنصة التخزين المحلي للمتصفح (LocalStorage) لحفظ البيانات الضرورية على جهازك مباشرةً."
                : "Cookies are small text files stored on your device when you visit a website. They are used to remember your preferences and maintain your login session. Additionally, the platform may use browser LocalStorage to save necessary data directly on your device."}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "2. الملفات الضرورية التي نستخدمها" : "2. Essential Cookies & Storage We Use"}</span>
            </h2>
            <p className="text-sm text-slate-400">
              {isAr ? "تستخدم منصة 11Players فقط الأنواع التالية الضرورية لعمل الموقع:" : "11Players uses only the following types necessary for the platform to function:"}
            </p>
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-sm font-bold text-white">{isAr ? "مصادقة Firebase (ضروري)" : "Firebase Authentication (Essential)"}</p>
                <p className="text-xs text-slate-400">{isAr ? "المزود: Google Firebase" : "Provider: Google Firebase"}</p>
                <p className="text-xs text-slate-300">{isAr ? "الغرض: الاحتفاظ بجلسة تسجيل الدخول الآمنة عبر رمز Firebase Auth المشفر. بدونها لن تتمكن من تسجيل الدخول." : "Purpose: Maintaining your secure login session using encrypted Firebase Auth tokens. Without this, login is not possible."}</p>
                <p className="text-xs text-slate-400">{isAr ? "المدة: تنتهي عند تسجيل الخروج أو انتهاء الجلسة." : "Duration: Expires on logout or session expiry."}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-sm font-bold text-white">{isAr ? "تفضيلات اللغة والمظهر (وظيفي)" : "Language & Theme Preferences (Functional)"}</p>
                <p className="text-xs text-slate-400">{isAr ? "التخزين: LocalStorage" : "Storage: LocalStorage"}</p>
                <p className="text-xs text-slate-300">{isAr ? "الغرض: حفظ اختيارك للغة (عربي/إنجليزي) والوضع الليلي/النهاري حتى لا تحتاج لإعادة الاختيار في كل زيارة." : "Purpose: Saving your language choice (EN/AR) and light/dark mode preference so you don't need to reselect on each visit."}</p>
                <p className="text-xs text-slate-400">{isAr ? "المدة: دائمة حتى تمسحها يدوياً." : "Duration: Persistent until manually cleared."}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-sm font-bold text-white">{isAr ? "المجتمع النشط المختار (وظيفي)" : "Active Community Workspace (Functional)"}</p>
                <p className="text-xs text-slate-400">{isAr ? "التخزين: LocalStorage" : "Storage: LocalStorage"}</p>
                <p className="text-xs text-slate-300">{isAr ? "الغرض: تذكر المجتمع النشط الذي اخترته لعرض بياناته الصحيحة عند كل زيارة." : "Purpose: Remembering your selected active community to display the correct data on each visit."}</p>
                <p className="text-xs text-slate-400">{isAr ? "المدة: دائمة حتى تغيير المجتمع أو تسجيل الخروج." : "Duration: Persistent until you change communities or log out."}</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "3. ما لا نستخدمه" : "3. What We Do NOT Use"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>{isAr ? "لا نستخدم أي ملفات ارتباط إعلانية أو تتبعية من أطراف ثالثة." : "We do not use any third-party advertising or behavioral tracking cookies."}</li>
              <li>{isAr ? "لا نستخدم Google Analytics أو أي أداة تحليل خارجية لتتبع سلوكك." : "We do not use Google Analytics or any external analytics tool to track your behavior."}</li>
              <li>{isAr ? "لا نشارك أي بيانات من الكوكيز أو التخزين المحلي مع أطراف تجارية." : "We do not share any cookie or local storage data with commercial third parties."}</li>
              <li>{isAr ? "منصة 11Players خالية تماماً من الإعلانات والتتبع التجاري." : "11Players is completely free from advertisements and commercial tracking."}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <ToggleLeft className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "4. خياراتك وتحكمك" : "4. Your Choices & Control"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "يمكنك في أي وقت حذف ملفات الارتباط والتخزين المحلي من إعدادات متصفحك. يُرجى الملاحظة أن حذف ملف المصادقة سيتسبب في تسجيل خروجك من المنصة. يمكنك أيضاً ضبط متصفحك لرفض جميع ملفات الارتباط، لكن قد يُؤثر ذلك على عمل المنصة."
                : "You can delete cookies and local storage at any time through your browser settings. Please note that deleting authentication cookies will log you out of the platform. You may also configure your browser to block all cookies, though this may affect platform functionality."}
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-300 mb-2">{isAr ? "كيفية مسح التخزين المحلي في المتصفحات الشائعة:" : "How to clear LocalStorage in common browsers:"}</p>
              <ul className="space-y-1 text-xs text-slate-400">
                <li><strong className="text-slate-300">Chrome:</strong> {isAr ? "الإعدادات ← الخصوصية ← مسح بيانات التصفح." : "Settings → Privacy → Clear browsing data."}</li>
                <li><strong className="text-slate-300">Firefox:</strong> {isAr ? "الإعدادات ← الخصوصية والأمان ← الكوكيز والبيانات المخزنة." : "Settings → Privacy & Security → Cookies and Site Data."}</li>
                <li><strong className="text-slate-300">Safari:</strong> {isAr ? "التفضيلات ← الخصوصية ← إدارة بيانات الموقع." : "Preferences → Privacy → Manage Website Data."}</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "5. مدة الاحتفاظ بالبيانات" : "5. Data Retention"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "تُحذف ملفات الارتباط المتعلقة بالجلسة تلقائياً عند إغلاق المتصفح. بيانات التخزين المحلي تبقى على جهازك حتى تقوم أنت بحذفها يدوياً أو تسجيل الخروج. لا نحتفظ بأي نسخ من هذه البيانات على خوادمنا بشكل مستقل عن حساب Firebase الخاص بك."
                : "Session-related cookies are automatically deleted when you close your browser. LocalStorage data persists on your device until you manually delete it or log out. We do not retain independent copies of this data on our servers beyond your Firebase account."}
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "6. تحديثات السياسة والتواصل" : "6. Policy Updates & Contact"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "قد نُحدّث هذه السياسة من وقت لآخر. سنُعلمك بأي تغييرات جوهرية عبر المنصة. إذا كان لديك أي استفسار حول كيفية استخدامنا لملفات الارتباط، يمكنك التواصل معنا عبر صفحة الدعم."
                : "We may update this policy periodically. We will notify you of any significant changes through the platform. If you have any questions about our use of cookies, please contact us via the Support page."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
