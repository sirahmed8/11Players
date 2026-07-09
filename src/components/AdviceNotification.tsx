import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
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
      const lastShown = sessionStorage.getItem("adviceLastShown");
      const now = Date.now();
      // Show advice check once every 10 minutes to avoid spamming Firestore reads on navigation
      if (lastShown && now - parseInt(lastShown) < 600000) return;
      
      try {
        const playerDoc = await getDoc(doc(db, "players", user.uid));
        if (playerDoc.exists()) {
          const { generatePersonalizedAdvices } = await import("@/lib/adviceGenerator");
          const generated = await generatePersonalizedAdvices(user.uid, playerDoc.data() as any, isAr);
          
          if (generated && generated.length > 0) {
            setAdvice(generated[0].body);
            // Delay showing advice slightly for better UX
            setTimeout(() => {
              setIsVisible(true);
              sessionStorage.setItem("adviceLastShown", Date.now().toString());
            }, 1000);
          } else {
            // Either on 24h cooldown or failed
            sessionStorage.setItem("adviceLastShown", Date.now().toString());
          }
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
          className="fixed top-20 right-4 md:top-24 md:right-8 z-50 max-w-sm w-[calc(100vw-2rem)] md:w-full"
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
