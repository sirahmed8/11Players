"use client";

import React, { useState } from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { ChevronDown, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
}

const FAQS: FAQItem[] = [
  {
    qAr: "كيف يعمل مؤشر الملاءمة التكتيكية (PSI) لموازنة الفرق؟",
    qEn: "How does the Positional Suitability Index (PSI) balance teams?",
    aAr: "يعتمد خوارزمية PSI على تقييم 24 مهارة بدنية وتكتيكية حقيقية، ويحسب مدى توافق اللاعب مع مركزه الأساسي والبديل لضمان تكافؤ فرص الفوز بين الفريقين بدقة رياضية متناهية.",
    aEn: "The proprietary PSI algorithm computes ratings across 24 technical and physical attributes, matching players to primary and secondary positions to ensure mathematically balanced squads.",
  },
  {
    qAr: "كيف تعمل حاسبة تقسيم مصروفات حجز الملعب (Split-Bill)؟",
    qEn: "How does the turf pitch split-bill calculator work?",
    aAr: "تتيح للمنظمين تقسيم تكلفة حجز الملعب بالتساوي أو بمبالغ مخصصة مع دعم 4 عملات (الجنيه المصري، الريال السعودي، الدولار، اليورو)، وتتبع حالة الدفع لكل لاعب فورياً.",
    aEn: "It allows organizers to split pitch rental fees equally or with custom amounts across EGP, SAR, USD, and EUR, tracking each player's payment status in real-time.",
  },
  {
    qAr: "هل تقييمات اللاعبين المتبادلة سرية وموثوقة؟",
    qEn: "Are peer player ratings anonymous and verified?",
    aAr: "نعم، التقييمات الفردية مجهولة الهوية بالكامل وتخضع لخوارزمية وزن إحصائي تمنع التلاعب أو التقييمات الانتقامية، مع اشتراط مشاركة اللاعبين في المباراة نفسها.",
    aEn: "Yes, individual peer reviews are strictly anonymous and moderated by statistical outlier detection to prevent retaliation or score inflation.",
  },
  {
    qAr: "ما هي مميزات اشتراكات برو كابتن ومنظم النوادي (Pro Pass)؟",
    qEn: "What are the Pro Pass and Club Organizer benefits?",
    aAr: "تمنحك شارات ملف تعريف مميزة، أولوية اختيار التشكيلات، استوديو أطقم الفرق المخصص، وتحليلات الذكاء الاصطناعي التكتيكية لأداء المباريات.",
    aEn: "Subscribers unlock exclusive verified profile badges, priority squad drafting, custom kit design studio access, and tactical AI match performance analytics.",
  },
  {
    qAr: "ما هو ضمان استرداد الأموال للخدمات المدفوعة؟",
    qEn: "What is your refund guarantee for paid features?",
    aAr: "نضمن استرداد الأموال بنسبة 100% خلال 7 أيام من الاشتراك في باقات برو وفقاً لقانون حماية المستهلك المصري، كما تتوفر نافذة إلغاء لحجوزات الملاعب حتى 12 ساعة قبل موعد المباراة.",
    aEn: "We offer a 100% money-back guarantee within 7 days for Pro subscriptions under Egyptian consumer protection law, plus a 12-hour cancellation window for match bookings.",
  },
];

export default function LandingFaqSection() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Generate structured FAQPage JSON-LD for AI search engines
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map((faq) => ({
      "@type": "Question",
      "name": isAr ? faq.qAr : faq.qEn,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": isAr ? faq.aAr : faq.aEn,
      },
    })),
  };

  return (
    <section className="py-24 px-4 sm:px-6 bg-slate-900/50 border-t border-b border-slate-800/80 relative overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? "الأسئلة الشائعة والأجوبة" : "Frequently Asked Questions"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {isAr ? "كل ما تود معرفته عن المنصة" : "Everything You Need to Know"}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            {isAr
              ? "إجابات واضحة ودقيقة حول نظام الموازنة الرياضي، إدارة الحجوزات، والضمانات القانونية."
              : "Clear answers regarding our matchmaking algorithm, turf booking, and legal guarantees."}
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-start flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-850 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-white leading-snug">
                    {isAr ? faq.qAr : faq.qEn}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 sm:p-6 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40">
                        {isAr ? faq.aAr : faq.aEn}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
