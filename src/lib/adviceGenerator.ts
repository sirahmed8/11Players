import { doc, collection, getDocs, addDoc, serverTimestamp, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";

const ADVICE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function generatePersonalizedAdvices(userUid: string, profile: PlayerProfile, isAr: boolean) {
  try {
    // 1. Check if we recently generated advices to avoid spam
    const notificationsRef = collection(db, "users", userUid, "notifications");
    const q = query(
      notificationsRef,
      where("type", "==", "advices"),
      limit(1)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const lastAdvice = snap.docs[0].data();
      const lastTime = lastAdvice.createdAt?.toMillis ? lastAdvice.createdAt.toMillis() : Date.now();
      if (Date.now() - lastTime < ADVICE_COOLDOWN_MS) {
        return; // Too soon to generate more advices
      }
    }

    const advices = [];

    // Analyze Position & Stats
    if (profile.primaryPosition === "SS" || profile.primaryPosition === "CF") {
      if ((profile.attributes?.finishing || 0) < 75) {
        advices.push({
          title: isAr ? "نصيحة للمهاجم" : "Striker Advice",
          body: isAr ? "تسديداتك تحتاج إلى تطوير. ركز على التدريب على الإنهاء من داخل منطقة الجزاء لزيادة فرصك في التسجيل." : "Your shooting needs improvement. Focus on finishing drills inside the box to increase your scoring chances."
        });
      } else if ((profile.stats?.goals || 0) === 0 && (profile.stats?.matchesPlayed || 0) > 3) {
        advices.push({
          title: isAr ? "كسر الصيام التهديفي" : "Break the Goal Drought",
          body: isAr ? "لم تسجل في آخر مبارياتك. حاول التمركز بشكل أفضل والتسديد من اللمسة الأولى لمفاجأة الحارس." : "You haven't scored recently. Try positioning yourself better and shoot first-time to surprise the keeper."
        });
      }
    }

    if (["CMF", "DMF", "AMF"].includes(profile.primaryPosition)) {
      if ((profile.attributes?.lowPass || 0) < 75) {
        advices.push({
          title: isAr ? "نصيحة لصانع الألعاب" : "Playmaker Advice",
          body: isAr ? "دقة تمريراتك منخفضة. في المباراة القادمة، حاول التركيز على التمريرات القصيرة والمضمونة قبل محاولة الكرات الطويلة." : "Your passing accuracy is low. Next match, focus on short, safe passes before attempting risky long balls."
        });
      }
    }

    if (["CB", "RB", "LB"].includes(profile.primaryPosition)) {
      if ((profile.attributes?.defensiveAwareness || 0) < 75) {
        advices.push({
          title: isAr ? "نصيحة للمدافع" : "Defender Advice",
          body: isAr ? "تمركزك الدفاعي يحتاج للعمل. ابقَ قريباً من المهاجمين ولا تندفع لقطع الكرة إلا وأنت متأكد." : "Your defensive positioning needs work. Stay tight to the attackers and don't commit to a tackle unless you are sure."
        });
      }
    }

    if (profile.primaryPosition === "GK") {
      if ((profile.attributes?.goalkeeping || 0) < 70) {
        advices.push({
          title: isAr ? "نصيحة لحارس المرمى" : "Goalkeeper Advice",
          body: isAr ? "ردود أفعالك تحتاج للتطوير. ركز على تدريبات الرشاقة والقفز لتحسين تغطيتك للمرمى." : "Your reflexes need development. Focus on agility and jumping drills to improve goal coverage."
        });
      }
    }

    // Stamina/Pace
    if ((profile.attributes?.speed || 0) < 65) {
      advices.push({
        title: isAr ? "تطوير اللياقة والسرعة" : "Pace & Fitness",
        body: isAr ? "سرعتك أقل من المعدل المطلوب. ركز على الجري لمسافات قصيرة (سبرنت) لزيادة انفجاريتك في الملعب." : "Your pace is below average. Focus on short sprints to increase your explosiveness on the pitch."
      });
    }

    if ((profile.attributes?.physicalContact || 0) < 65) {
      advices.push({
        title: isAr ? "القوة البدنية" : "Physical Strength",
        body: isAr ? "أنت تخسر الكثير من الالتحامات. تدريبات القوة في الصالة الرياضية ستجعلك لاعباً أقوى وتمنع الخصوم من دفعك." : "You're losing many duels. Strength training in the gym will make you harder to push off the ball."
      });
    }

    // Playstyle Advice
    if (profile.playStyle === "Goal Poacher" || profile.playStyle === "قناص الأهداف") {
      advices.push({
        title: isAr ? "أسلوب اللعب: قناص الأهداف" : "Playstyle: Goal Poacher",
        body: isAr ? "استمر في الركض خلف خط الدفاع. أفضل تمركز لك هو على حافة مصيدة التسلل لاستغلال البينيات." : "Keep making runs behind the defensive line. Your best positioning is on the edge of the offside trap to exploit through balls."
      });
    }

    // General if empty
    if (advices.length === 0) {
      advices.push({
        title: isAr ? "نصيحة عامة" : "General Advice",
        body: isAr ? "أرقامك تبدو ممتازة! استمر في التدريب وحافظ على تركيزك العالي في المباريات القادمة." : "Your stats look excellent! Keep training and maintain your high focus in upcoming matches."
      });
    }

    // Pick a random advice from the generated ones
    const selectedAdvice = advices[Math.floor(Math.random() * advices.length)];

    await addDoc(notificationsRef, {
      title: selectedAdvice.title,
      body: selectedAdvice.body,
      type: "advices",
      read: false,
      createdAt: serverTimestamp(),
      link: "/profile"
    });

  } catch (err) {
    console.error("Failed to generate advice:", err);
  }
}
