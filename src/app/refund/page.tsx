"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Receipt, ShieldCheck, Clock, RefreshCcw, HelpCircle, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RefundPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6" dir={isAr ? "rtl" : "ltr"}>
      <main className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>{isAr ? "السياسات المالية والشفافية" : "Financial Transparency & Policies"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {isAr ? "سياسة الاسترداد والإلغاء" : "Refund & Cancellation Policy"}
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-xl mx-auto leading-relaxed">
            {isAr
              ? "نحرص على ضمان أعلى درجات الشفافية والعدالة المالية لجميع اللاعبين ومنظمي الحجوزات والمشتركين."
              : "We are committed to complete financial fairness and transparency for all players, organizers, and subscribers."}
          </p>
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 transition-colors p-6 sm:p-10 rounded-3xl space-y-8 text-slate-300 leading-relaxed shadow-2xl"
        >
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 text-xs font-semibold text-slate-400">
            <span>{isAr ? "المنصة: 11Players (حجوزات إيليت)" : "Platform: 11Players (Hagoozat Elite)"}</span>
            <span>{isAr ? "آخر تحديث: سبتمبر 2026" : "Last Updated: September 2026"}</span>
          </div>

          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "1. نطاق السياسة" : "1. Scope of Policy"}</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isAr
                ? "تحدد هذه السياسة الشروط الحاكمة لعمليات استرداد الأموال وإلغاء الحجوزات والاشتراكات الرقمية عبر منصة 11Players وفقاً لقانون حماية المستهلك المصري (رقم 181 لسنة 2018) والمعايير العالمية للتجارة الرقمية."
                : "This policy defines the terms governing refunds, match cancellations, and digital subscriptions on the 11Players platform in accordance with applicable consumer protection regulations and international digital commerce standards."}
            </p>
          </section>

          {/* Section 2: Pro Pass Digital Subscriptions */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <RefreshCcw className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "2. الاشتراكات والخدمات الرقمية (Pro Pass)" : "2. Digital Subscriptions (Pro Pass)"}</span>
            </h2>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                {isAr
                  ? "توفر المنصة اشتراكات Pro Pass الرقمية لتعزيز تجربة اللاعب الإحصائية والتحليلية:"
                  : "The platform offers Pro Pass digital subscriptions for enhanced analytical and statistical capabilities:"}
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4 rtl:pr-4">
                <li>
                  <strong>{isAr ? "ضمان الاسترداد خلال 7 أيام:" : "7-Day Unused Guarantee:"}</strong>{" "}
                  {isAr
                    ? "يحق للمستخدم طلب استرداد كامل قيمة الاشتراك خلال 7 أيام من تاريخ الدفع، شريطة عدم استهلاك مميزات الاشتراك المتقدمة (مثل توليد تقارير الـ PDF الشاملة أو إنشاء أكثر من مجتمع مميز)."
                    : "Users are entitled to request a full refund within 7 calendar days of purchase, provided that the advanced digital features have not been extensively utilized."}
                </li>
                <li>
                  <strong>{isAr ? "إلغاء التجديد التلقائي:" : "Renewal Cancellation:"}</strong>{" "}
                  {isAr
                    ? "يمكنك إلغاء التجديد في أي وقت من شاشة الإعدادات. سيظل اشتراكك سارياً حتى نهاية الدورة المدفوعة الحالية دون خصم أي مبالغ إضافية."
                    : "You may cancel automatic renewal at any time from your settings. Your access will remain active until the end of the current billing cycle without further charges."}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Turf Booking & Match Fees */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "3. حجوزات الملاعب والمباريات (الحجوزات)" : "3. Turf Match Bookings (Hagoozat)"}</span>
            </h2>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                {isAr
                  ? "توضيح قانوني هام لطبيعة دور المنصة في حجوزات الملاعب الترابية والنجيلية:"
                  : "Important legal clarification regarding platform role in pitch bookings:"}
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4 rtl:pr-4">
                <li>
                  <strong>{isAr ? "دور الوساطة التنظيمية:" : "Organizational Coordination Role:"}</strong>{" "}
                  {isAr
                    ? "منصة 11Players هي منصة برمجية ذكية لتنسيق الفرق وموازنتها وتقسيم الفاتورة (Split-Bill). مبالغ إيجار الملاعب تُدفع مباشرة لإدارات الملاعب المحلية أو لقائد الحجز المعين."
                    : "11Players serves as a software coordination tool for team balancing, attendance tracking, and split-billing. Pitch rental fees are collected by local pitch venue managers or designated match captains."}
                </li>
                <li>
                  <strong>{isAr ? "مهلة الإلغاء للمباريات:" : "Match Cancellation Window:"}</strong>{" "}
                  {isAr
                    ? "في حالة إلغاء مشاركة اللاعب قبل موعد المباراة بـ 12 ساعة على الأقل، يتم إعفاؤه من حصته في الفاتورة في نظام تقسيم الفاتورة التلقائي. الإلغاء المتأخر بعد هذه المهلة يخضع للقواعد الداخلية لكل مجتمع كروي."
                    : "Players who withdraw their match RSVP at least 12 hours prior to scheduled kickoff are exempted from their split-bill share. Late cancellations are subject to individual community match regulations."}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Refund Processing */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "4. إجراءات وتوقيت تنفيذ الاسترداد" : "4. Refund Processing Timeframes"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>
                {isAr
                  ? "تتم معالجة طلبات الاسترداد المعتمدة عبر نفس وسيلة الدفع الأصلية (البطاقة البنكية أو المحفظة الإلكترونية)."
                  : "Approved refunds are credited back to the original method of payment (credit card, bank account, or digital wallet)."}
              </li>
              <li>
                {isAr
                  ? "تستغرق عملية إيداع المبالغ في حسابك البنكي من 5 إلى 10 أيام عمل بحسب سياسة البنك المصدر لبطاقتك."
                  : "Refund credits typically reflect in your account within 5 to 10 business days depending on your issuing bank."}
              </li>
            </ul>
          </section>

          {/* Section 5: Non-Refundable Cases */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span>{isAr ? "5. الحالات المستثناة من الاسترداد" : "5. Non-Refundable Circumstances"}</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 pl-4 rtl:pr-4">
              <li>
                {isAr
                  ? "الاشتراكات التي تم استخدام مزاياها لأكثر من 7 أيام من تاريخ الشراء."
                  : "Subscriptions where features have been actively consumed beyond the 7-day period."}
              </li>
              <li>
                {isAr
                  ? "الحسابات التي تم حظرها أو إيقافها بسبب انتهاك شروط الخدمة (مثل التزوير، التلاعب بالإحصاءات، أو السلوك العدائي)."
                  : "Accounts suspended or banned due to documented Terms of Service violations (fraud, stat tampering, or abusive conduct)."}
              </li>
            </ul>
          </section>

          {/* Section 6: Contact */}
          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? "6. قنوات الدعم وتقديم طلبات الاسترداد" : "6. Support & Refund Inquiries"}</span>
            </h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? "لتقديم طلب استرداد أو الاستفسار عن أي معاملة مالية، يُرجى مراسلتنا مع ذكر رقم المعاملة وعنوان بريدك الإلكتروني المسجل:"
                : "To initiate a refund request or clarify a transaction, please reach out with your transaction ID and registered email:"}
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
              <div className="space-y-1">
                <p className="font-bold text-white">11Players Finance & Support</p>
                <p className="text-xs text-slate-400">Email: support@11players.com / billing@11players.com</p>
                <p className="text-xs text-slate-400">{isAr ? "القاهرة، جمهورية مصر العربية" : "Cairo, Arab Republic of Egypt"}</p>
              </div>
              <motion.a
                href="mailto:support@11players.com"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md active:scale-95 shrink-0 inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isAr ? "مراسلة الدعم المالي" : "Contact Support"}</span>
              </motion.a>
            </div>
          </section>

          {/* Back link */}
          <div className="pt-4 flex justify-between items-center text-xs font-bold text-slate-400">
            <Link href="/" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1">
              <span>{isAr ? "← العودة للرئيسية" : "← Back to Home"}</span>
            </Link>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                {isAr ? "الخصوصية" : "Privacy"}
              </Link>
              <Link href="/tos" className="hover:text-emerald-400 transition-colors">
                {isAr ? "الشروط" : "Terms"}
              </Link>
              <Link href="/cookie" className="hover:text-emerald-400 transition-colors">
                {isAr ? "الكوكيز" : "Cookies"}
              </Link>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
