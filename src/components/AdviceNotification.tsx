import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/components/ThemeProvider";

export default function AdviceNotification() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [advice, setAdvice] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchProfileAndGenerateAdvice = async () => {
      // Show advice only once per session to avoid spamming
      if (sessionStorage.getItem("adviceShown")) return;
      
      try {
        const playerDoc = await getDoc(doc(db, "players", user.uid));
        if (playerDoc.exists()) {
          const data = playerDoc.data();
          const position = data.primaryPosition || "Player";
          const stats = data.stats || {};
          
          const advices = [
            isAr ? `تذكر يا ${position}، التمركز الصحيح هو نصف الدفاع!` : `Remember ${position}, good positioning is half the defense!`,
            isAr ? `أرقامك في التصاعد! استمر في العمل الجاد.` : `Your stats are looking great! Keep up the hard work.`,
            isAr ? `كـ ${position}، التواصل مع زملائك في الملعب يصنع الفارق.` : `As a ${position}, communication on the pitch makes all the difference.`,
            isAr ? `لا تنسى الإحماء جيداً قبل المباراة القادمة.` : `Don't forget to warm up properly before your next match.`
          ];
          
          if (stats.goals > 10) {
            advices.push(isAr ? `هداف رائع! حافظ على هذا المعدل التهديفي العالي.` : `Incredible goalscorer! Maintain that high scoring rate.`);
          }
          if (stats.assists > 10) {
            advices.push(isAr ? `صانع ألعاب من طراز رفيع! تمريراتك الحاسمة مذهلة.` : `Top class playmaker! Your assists are amazing.`);
          }
          
          const randomAdvice = advices[Math.floor(Math.random() * advices.length)];
          setAdvice(randomAdvice);
          
          // Delay showing advice slightly for better UX
          setTimeout(() => {
            setIsVisible(true);
            sessionStorage.setItem("adviceShown", "true");
          }, 3000);
        }
      } catch (err) {
        console.error("Failed to generate advice", err);
      }
    };
    
    fetchProfileAndGenerateAdvice();
  }, [user, isAr]);

  return (
    <AnimatePresence>
      {isVisible && advice && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-20 right-4 md:top-24 md:right-8 z-50 max-w-sm w-full"
          dir={isAr ? "rtl" : "ltr"}
        >
          <div className="bg-emerald-600 text-white rounded-2xl shadow-2xl p-4 pr-12 rtl:pr-4 rtl:pl-12 relative overflow-hidden border border-emerald-400/30">
            <div className="absolute -right-6 -top-6 rtl:-left-6 rtl:-right-auto opacity-20">
              <Sparkles className="w-24 h-24" />
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-3 rtl:left-3 ltr:right-3 bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex gap-3 relative z-10">
              <div className="bg-emerald-500 rounded-full p-2 h-fit flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-100 text-sm mb-1">{isAr ? "نصيحة المدرب" : "Coach Advice"}</h4>
                <p className="text-sm leading-relaxed font-medium">{advice}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
