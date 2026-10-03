"use client";

import React, { useState } from "react";
import { useLocale } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  Bot, 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  FileQuestion,
  ExternalLink,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

interface FaqItem {
  id: string;
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
}

const FAQS: FaqItem[] = [
  {
    id: "matchmaking",
    qEn: "How does the 13-position squad balancing algorithm work?",
    qAr: "كيف يعمل خوارزمية التوازن التكتيكي للمراكز الـ 13 وتوزيع الفرق؟",
    aEn: "Our deterministic algorithm maps every player across 13 PES positional matrices (GK, CB, LB, RB, DMF, CMF, AMF, LMF, RMF, LWF, RW, SS, CF). It minimizes rating variance, ensures tactical role complementarity, and factors in physical stamina and verified peer ratings to create fair, competitive teams.",
    aAr: "تعتمد خوارزميتنا الحتمية على مصفوفة أوزان PES التكتيكية لـ 13 مركزاً كروياً، حيث تقلل الفوارق التهديفية وتضمن توازناً في خطوط الدفاع والوسط والهجوم مع مراعاة طاقات اللاعبين والتقييمات المعتمدة من الزملاء."
  },
  {
    id: "ratings",
    qEn: "How do post-match peer ratings affect player OVR and badges?",
    qAr: "كيف تؤثر تقييمات الزملاء بعد المباراة على طاقات اللاعب وشاراته؟",
    aEn: "After matches are recorded, teammates can submit peer ratings (1 to 5 stars) alongside tactical feedback. Consensus ratings adjust overall rating (OVR) through a weighted formula, unlocking holographic FUT badges, tier promotions, and Ballon d'Or points.",
    aAr: "عقب تسجيل نتيجة كل مباراة، يمكن للاعبين تقديم تقييمات النجوم (من 1 إلى 5) وإبداء الملاحظات الفنية. يتم دمج التقييمات وفق معادلة ترجيحية لحساب التقييم العام (OVR) وترقية بطاقة اللاعب وفتح شارات FUT والكرة الذهبية."
  },
  {
    id: "split-bill",
    qEn: "How does the Turf Split-Bill Calculator work with InstaPay and Vodafone Cash?",
    qAr: "كيف تعمل حاسبة تقسيم فاتورة الحجز ومشاركتها عبر انستاباي وفودافون كاش؟",
    aEn: "Enter total pitch rental, referee fees, and water costs. The calculator splits the total per attendee, generates instant copyable WhatsApp summaries, and formats payment details for direct settlement via InstaPay username or mobile wallet.",
    aAr: "أدخل تكلفة إيجار الملعب وأجر الحكم ومصاريف المياه. تقوم الحاسبة باقتسام الإجمالي على الحاضرين تلقائياً مع توليد رسالة واتساب جاهزة للنسخ والمشاركة تتضمن تفاصيل التحويل الفوري عبر حساب انستاباي أو المحفظة الإلكترونية."
  },
  {
    id: "pro-pass",
    qEn: "What are the subscription plans and refund policies under Egyptian Law?",
    qAr: "ما هي خطط الاشتراكات الممتازة وسياسة الاسترجاع وفق القانون المصري؟",
    aEn: "We offer Free Tier, Match Pass (15 EGP/match), PRO Captain (99 EGP/month), and Club Organizer (299 EGP/month). Under Egyptian Consumer Protection Law (Law 181/2018), unused subscription fees are eligible for a 100% refund within 7 calendar days of activation.",
    aAr: "نوفر الخطة المجانية، وتذكرة المباراة (15 ج.م)، وباقة كابتن برو (99 ج.م/شهرياً)، وباقة منظم النادي (299 ج.م/شهرياً). وتماشياً مع قانون حماية المستهلك المصري (قانون 181 لسنة 2018)، يحق للمشترك طلب استرداد كامل خلال 7 أيام من التفعيل."
  },
  {
    id: "appeals",
    qEn: "How can I dispute an incorrect match stat or appeal a rejected attribute edit?",
    qAr: "كيف أقدم التماساً لتعديل طاقات مرفوض أو تصحيح نتيجة مباراة غير دقيقة؟",
    aEn: "Submit a support ticket below selecting 'Stats & Ratings Dispute' or contact your community administrator directly. Community admins review audit logs and can adjust verified match events or approve peer rating revisions.",
    aAr: "يمكنك تقديم تذكرة دعم أدناه باختيار 'نزاع طاقات أو إحصائيات' أو التواصل مع مشرف مجتمعك مباشرة. يمتلك المشرفون صلاحية مراجعة سجلات المباريات وتعديل الإحصائيات أو قبول مقترحات تعديل الطاقات."
  }
];

export default function SupportPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const { user } = useAuth();
  const { activeCommunity } = useCommunity();

  // Ticket Form State
  const [category, setCategory] = useState("general");
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<string | null>("matchmaking");

  const handleLaunchAI = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-11ai-chat", { detail: { tab: "ai" } }));
      toast.success(isAr ? "تم تشغيل مساعد 11AI في الزاوية السفلى! 🤖" : "Launched 11AI Assistant in floating widget! 🤖");
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim() || !subject.trim()) {
      toast.error(isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const threadRef = doc(db, "support_threads", user?.uid || ticketId);

      const ticketPayload = {
        id: ticketId,
        uid: user?.uid || null,
        userName: name.trim() || "Visitor",
        userEmail: email.trim(),
        userPhone: phone.trim() || null,
        communityId: activeCommunity?.id || null,
        communityName: activeCommunity?.name || null,
        category,
        subject: subject.trim(),
        lastMessage: message.trim(),
        status: "open",
        unreadForAdmin: true,
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
      };

      await setDoc(threadRef, ticketPayload, { merge: true });

      // Secondary message document in subcollection
      try {
        const msgRef = doc(collection(threadRef, "messages"));
        await setDoc(msgRef, {
          senderUid: user?.uid || "guest",
          senderName: name.trim() || "Visitor",
          text: message.trim(),
          category,
          timestamp: serverTimestamp(),
        });
      } catch (_) {}

      setSubmittedTicketId(ticketId);
      toast.success(isAr ? "تم إرسال تذكرتك بنجاح! سيصلك الرد قريباً." : "Support ticket submitted successfully!");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Support ticket submission error:", err);
      // Fallback local persistence if offline
      try {
        const localTickets = JSON.parse(localStorage.getItem("offline_support_tickets") || "[]");
        localTickets.push({ name, email, phone, subject, message, date: new Date().toISOString() });
        localStorage.setItem("offline_support_tickets", JSON.stringify(localTickets));
        setSubmittedTicketId(`offline_${Date.now()}`);
        toast.success(isAr ? "تم حفظ التذكرة محلياً وسيتم مزامنتها فور توفر الاتصال" : "Ticket saved locally for cloud sync");
      } catch (_) {
        toast.error(isAr ? "تعذر إرسال التذكرة حالياً" : "Failed to submit support ticket");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-slate-950" dir={isAr ? "rtl" : "ltr"}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-emerald-500/8 via-teal-500/4 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? "مركز الدعم والمساعدة وحل النزاعات" : "11Players Support & Resolution Hub"}</span>
          </motion.div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isAr ? "كيف يمكننا مساعدتك اليوم؟" : "How Can We Help You Today?"}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            {isAr
              ? "فريق الدعم ومساعد 11AI التكتيكي جاهزون للإجابة على استفساراتك حول التشكيلات، وحاسبة الحجز، والاشتراكات، والتقييمات."
              : "Direct support and our 24/7 AI tactical assistant are ready to assist with matchmaking, turf split billing, subscriptions, and player ratings."}
          </p>
        </div>

        {/* 3 Instant Support Channel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: 11AI Assistant */}
          <div className="bg-slate-900/80 border border-emerald-500/30 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-500/60 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-white">{isAr ? "مساعد 11AI الذكي (24/7)" : "11AI Tactical Assistant"}</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {isAr
                  ? "حل فوري لأي تساؤل تكتيكي، وتوليد التشكيلات المتوازنة، وحسابات أسعار الحجز بدون انتظار."
                  : "Instant answers for tactical formations, team balance rules, and subscription pricing with zero wait time."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLaunchAI}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? "تشغيل المساعد الذكي الآن" : "Launch 11AI Chat"}</span>
            </button>
          </div>

          {/* Card 2: WhatsApp Line */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-white">{isAr ? "واتساب إدارة المنصة" : "Direct WhatsApp Support"}</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {isAr
                  ? "تواصل مباشر مع الإدارة والمؤسس لتنظيم بطولات مجتمعية أو استفسارات الحسابات البنكية."
                  : "Direct line with the founder and management for community leagues, commercial turf deals, and payment inquiries."}
              </p>
            </div>
            <a
              href="https://wa.me/201099684344"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-green-600 hover:text-white text-green-400 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-green-500/30"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isAr ? "محادثة عبر واتساب (+20)" : "Chat on WhatsApp"}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

          {/* Card 3: Email Support */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-white">{isAr ? "البريد الإلكتروني الرسمي" : "Official Support Email"}</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {isAr
                  ? "لطلبات حذف البيانات (GDPR Art. 17)، والنزاعات الرسمية، واستفسارات الفواتير والضرائب."
                  : "For GDPR Art. 17 data deletion requests, formal rating disputes, and official commercial inquiries."}
              </p>
            </div>
            <a
              href="mailto:a7medorabe7@gmail.com?subject=11Players%20Support%20Request"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-blue-500/30"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>a7medorabe7@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Main Grid: Ticket Form (Left/Top) & FAQ Accordion (Right/Bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Submit Support Ticket Card (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-1 block">
                {isAr ? "فتح تذكرة مساعدة رسمية" : "Official Support Ticket"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? "إرسال رسالة إلى فريق الدعم" : "Send a Message to Support"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {isAr ? "سيتم مراجعة تذكرتك والرد خلال 24 ساعة كحد أقصى." : "Your inquiry will be logged and reviewed within 24 hours."}
              </p>
            </div>

            {submittedTicketId ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-black text-white">
                  {isAr ? "تم تسجيل تذكرتك بنجاح!" : "Ticket Submitted Successfully!"}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  {isAr ? "رقم المرجع:" : "Reference ID:"} <span className="text-emerald-400 font-bold">{submittedTicketId}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedTicketId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  {isAr ? "إرسال تذكرة أخرى" : "Submit Another Ticket"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {isAr ? "اسمك الكامل *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? "مثال: أحمد عبد الله" : "e.g. Ahmed Abdallah"}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {isAr ? "البريد الإلكتروني *" : "Email Address *"}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {isAr ? "رقم الهاتف / واتساب (اختياري)" : "Phone / WhatsApp (Optional)"}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {isAr ? "نوع المشكلة أو الاستفسار *" : "Topic Category *"}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-white outline-none transition-all cursor-pointer"
                    >
                      <option value="general">{isAr ? "استفسار عام" : "General Inquiry"}</option>
                      <option value="matchmaking">{isAr ? "توازن التشكيلات والمطابقة" : "Matchmaking & Balance"}</option>
                      <option value="ratings_dispute">{isAr ? "نزاع طاقات أو تقييمات" : "Stats & Ratings Dispute"}</option>
                      <option value="turf_split_bill">{isAr ? "حاسبة حجز الملعب وتقسيم الفاتورة" : "Turf Split-Bill Issue"}</option>
                      <option value="subscription_billing">{isAr ? "الاشتراكات وباقة برو (PRO Pass)" : "PRO Pass & Billing"}</option>
                      <option value="community_admin">{isAr ? "صلاحيات مشرف مجتمع" : "Community Admin Rights"}</option>
                      <option value="bug_report">{isAr ? "إبلاغ عن عطل فني" : "Bug / Technical Glitch"}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    {isAr ? "عنوان التذكرة *" : "Subject *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={isAr ? "ملخص قصير للمشكلة..." : "Brief summary of the issue..."}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    {isAr ? "تفاصيل الرسالة *" : "Detailed Message *"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isAr ? "اشرح ما حدث بالتفصيل وكيف يمكننا مساعدتك..." : "Provide as much context as possible..."}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? "جاري الإرسال..." : "Submitting Ticket..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 rtl:-scale-x-100" />
                      <span>{isAr ? "إرسال التذكرة إلى الدعم" : "Submit Support Ticket"}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Frequently Asked Questions Accordion (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileQuestion className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-white">
                {isAr ? "الأسئلة الشائعة والأكثر تكراراً" : "Frequently Asked Questions"}
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-colors hover:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="w-full p-4 text-start flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
                    >
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed font-medium border-t border-slate-800/60">
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
        </div>
      </div>
    </div>
  );
}
