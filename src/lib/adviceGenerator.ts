import { doc, collection, getDocs, addDoc, serverTimestamp, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { calculateRealisticOverall } from "@/lib/overallCalculator";

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

    // --- 0. Overall Rating (OVR) Based Advice ---
    const ovr = calculateRealisticOverall(profile.approvedAttributes || profile.attributes || {}, profile.primaryPosition || 'CMF', profile.playStyle || '');
    if (ovr < 70) {
      advices.push({
        title: isAr ? "نصيحة الصعود والتدريب" : "Development Phase",
        body: isAr ? "تقييمك العام في مرحلة الصعود. ركز على إتقان المهارات الأساسية: الاستلام والتسليم والتمركز السليم دون تعقيد للوصول للمستوى التالي." : "Your overall rating is developing. Master basic ball control, simple passes, and positional discipline to quickly reach the next level."
      });
    } else if (ovr >= 85) {
      advices.push({
        title: isAr ? "قيادة الفريق في الملعب" : "Pitch Leadership",
        body: isAr ? "أنت أحد نجوم وقادة الفريق بناءً على تقييمك المرتفع. دورك الآن يشمل توجيه الزملاء، ضبط إيقاع اللعب، وحسم المواجهات المعقدة." : "As one of the highest-rated players on the pitch, your role extends to leadership—dictating tempo and guiding younger teammates."
      });
    }

    // --- 1. Position & Stat Synergies ---
    if (profile.primaryPosition === "SS" || profile.primaryPosition === "CF" || profile.primaryPosition === "LWF" || profile.primaryPosition === "RWF") {
      if ((profile.attributes?.finishing || 0) < 75) {
        advices.push({
          title: isAr ? "نصيحة للمهاجم" : "Striker Advice",
          body: isAr ? "تسديداتك تحتاج إلى تطوير. ركز على التدريب على الإنهاء من داخل منطقة الجزاء لزيادة فرصك في التسجيل." : "Your shooting needs improvement. Focus on finishing drills inside the box to increase your scoring chances."
        });
      }
      if ((profile.attributes?.offensiveAwareness || 0) < 75) {
        advices.push({
          title: isAr ? "التمركز الهجومي" : "Attacking Positioning",
          body: isAr ? "وعيك الهجومي منخفض نسبياً. حاول قراءة تحركات المدافعين واستغلال المساحات الخالية خلفهم." : "Your offensive awareness is a bit low. Try to read the defenders' movements and exploit empty spaces behind them."
        });
      }
      if ((profile.stats?.goals || 0) === 0 && (profile.stats?.matchesPlayed || 0) > 3) {
        advices.push({
          title: isAr ? "كسر الصيام التهديفي" : "Break the Goal Drought",
          body: isAr ? "لم تسجل في مبارياتك الأخيرة. لا تتوتر! العب السهل، وحاول التمركز بشكل أفضل والتسديد من اللمسة الأولى." : "You haven't scored recently. Don't panic! Play simple, position yourself better and shoot first-time."
        });
      }
      if (["LWF", "RWF"].includes(profile.primaryPosition)) {
        advices.push({
          title: isAr ? "استغلال مساحات الأطراف" : "Wing Play Exploitation",
          body: isAr ? "كجناح هجومي، استخدم تنويع اللعب بين الدخول للعمق في أنصاف المساحات (Half-spaces) والركض على الخط لسحب أظهرة الخصم وتفكيك دفاعهم." : "As a winger, vary your movement between cutting inside into half-spaces and hugging the touchline to disorganize the opponent's fullbacks."
        });
      }
    }

    if (["CMF", "DMF", "AMF", "LMF", "RMF"].includes(profile.primaryPosition)) {
      if ((profile.attributes?.lowPass || 0) < 75 || (profile.attributes?.loftedPass || 0) < 75) {
        advices.push({
          title: isAr ? "نصيحة لخط الوسط" : "Midfielder Advice",
          body: isAr ? "دقة تمريراتك منخفضة. في المباراة القادمة، حاول التركيز على التمريرات القصيرة والمضمونة لبناء الثقة قبل لعب الكرات الطويلة المعقدة." : "Your passing accuracy is low. Next match, focus on short, safe passes to build confidence before attempting complex long balls."
        });
      }
      if ((profile.stats?.assists || 0) === 0 && (profile.stats?.matchesPlayed || 0) > 5) {
        advices.push({
          title: isAr ? "زيادة صناعة الأهداف" : "Boost Assists",
          body: isAr ? "لم تقم بصناعة أي هدف رغم لعبك لعدة مباريات. حاول رفع رأسك قبل استلام الكرة والبحث عن المهاجمين المنطلقين." : "You haven't assisted any goals despite playing several matches. Scan the pitch before receiving the ball to find runners."
        });
      }
    }

    if (["CB", "RB", "LB"].includes(profile.primaryPosition)) {
      if ((profile.attributes?.defensiveAwareness || 0) < 75) {
        advices.push({
          title: isAr ? "نصيحة للمدافع" : "Defender Advice",
          body: isAr ? "تمركزك الدفاعي يحتاج للعمل. ابقَ قريباً من المهاجمين ولا تندفع لقطع الكرة إلا وأنت متأكد لتجنب ترك مساحات خلفك." : "Your defensive positioning needs work. Stay tight to the attackers and don't commit to a tackle unless you are sure to avoid leaving spaces."
        });
      }
      if (profile.primaryPosition === "CB" && (profile.attributes?.heading || 0) < 75) {
        advices.push({
          title: isAr ? "الكرات الهوائية" : "Aerial Duels",
          body: isAr ? "كقلب دفاع، الرأسيات ضرورية لك. تدرب على التوقيت الصحيح للقفز وتوجيه الكرة." : "As a CB, headers are crucial. Practice your jumping timing and ball direction."
        });
      }
      if (["LB", "RB"].includes(profile.primaryPosition) && (profile.attributes?.stamina || 0) < 75) {
        advices.push({
          title: isAr ? "لياقة الأطراف" : "Fullback Stamina",
          body: isAr ? "الركض على الأطراف يتطلب لياقة بدنية عالية. حاول تنظيم مجهودك ولا تندفع للهجوم في كل هجمة إذا كنت متعباً." : "Running the flanks requires high stamina. Pace yourself and don't push forward on every attack if you're tired."
        });
      }
    }

    if (profile.primaryPosition === "GK") {
      if ((profile.attributes?.goalkeeping || 0) < 70) {
        advices.push({
          title: isAr ? "نصيحة لحارس المرمى" : "Goalkeeper Advice",
          body: isAr ? "ردود أفعالك تحتاج للتطوير. ركز على تدريبات الرشاقة والقفز لتحسين تغطيتك للمرمى ومجاراة التسديدات المباغتة." : "Your reflexes need development. Focus on agility and jumping drills to improve goal coverage against sudden shots."
        });
      }
      if ((profile.attributes?.jump || 0) < 70) {
        advices.push({
          title: isAr ? "القفز وتغطية الزوايا" : "Jumping & Reach",
          body: isAr ? "تغطيتك للزوايا البعيدة ضعيفة وتحتاج للقفز بشكل أفضل. حاول تحسين تمركزك والوقوف في منتصف زاوية التسديد لتسهيل التصدي." : "Your reach to far posts is lacking. Improve your positioning and jumping to be in the bisector of the shooting angle."
        });
      }
    }

    // --- 2. Physical & Athletic Advices ---
    if ((profile.attributes?.speed || 0) < 65) {
      advices.push({
        title: isAr ? "تطوير اللياقة والسرعة" : "Pace & Fitness",
        body: isAr ? "سرعتك أقل من المعدل المطلوب للمباريات التنافسية. ركز على الجري لمسافات قصيرة (سبرنت) لزيادة انفجاريتك في الملعب." : "Your pace is below average for competitive games. Focus on short sprints to increase your explosiveness."
      });
    }

    if ((profile.attributes?.physicalContact || 0) < 65) {
      advices.push({
        title: isAr ? "القوة البدنية" : "Physical Strength",
        body: isAr ? "أنت تخسر الكثير من الالتحامات الثنائية. تدريبات القوة في الصالة الرياضية، خاصة الجذع (Core)، ستجعلك لاعباً أصلب." : "You're losing many 1v1 physical duels. Core strength training in the gym will make you much more solid."
      });
    }
    
    if ((profile.attributes?.stamina || 0) < 70) {
      advices.push({
        title: isAr ? "القدرة على التحمل" : "Stamina",
        body: isAr ? "قد تجد صعوبة في إكمال المباراة بنفس الإيقاع. خصص أياماً للجري الطويل (الكارديو) لتحسين لياقتك التنفسية." : "You might struggle to finish the game at high intensity. Dedicate days to long runs (Cardio) to improve your breathing stamina."
      });
    }

    // --- 3. Playstyle-based Advices ---
    const ps = profile.playStyle?.toLowerCase() || "";
    if (ps.includes("poacher") || ps.includes("قناص")) {
      advices.push({
        title: isAr ? "أسلوب اللعب: قناص الأهداف" : "Playstyle: Goal Poacher",
        body: isAr ? "العب دائماً على خط التسلل. وظيفتك الرئيسية هي إنهاء الهجمات وليس بنائها؛ احتفظ بطاقتك للركض الحاسم." : "Play on the shoulders of the last defender. Your main job is finishing, not building up; save energy for the final run."
      });
    } else if (ps.includes("box-to-box") || ps.includes("بوكس")) {
      advices.push({
        title: isAr ? "أسلوب اللعب: بوكس تو بوكس" : "Playstyle: Box-to-Box",
        body: isAr ? "دورك يتطلب طاقة هائلة. كن حلقة الوصل بين الدفاع والهجوم، لكن احرص على عدم ترك مساحات فارغة عند تقدمك." : "Your role demands massive energy. Be the link between defense and attack, but ensure you don't leave gaps behind."
      });
    } else if (ps.includes("anchor") || ps.includes("ارتكاز")) {
      advices.push({
        title: isAr ? "أسلوب اللعب: ارتكاز صلب" : "Playstyle: Anchor Man",
        body: isAr ? "أنت الدرع الواقي للدفاع. ابقَ متمركزاً ولا تنجذب للأطراف لتغطية العمق دائماً وقطع الهجمات المرتدة." : "You are the shield. Stay centrally positioned, don't get dragged wide, and stop counter-attacks early."
      });
    } else if (ps.includes("target") || ps.includes("محطة")) {
      advices.push({
        title: isAr ? "أسلوب اللعب: مهاجم محطة" : "Playstyle: Target Man",
        body: isAr ? "استخدم جسمك لحماية الكرة وانتظار القادمين من الخلف. تمريرتك القادمة أهم من محاولتك الدوران في مساحة ضيقة." : "Use your body to shield the ball and wait for runners. Laying it off is often better than trying to turn blindly."
      });
    }

    // --- 4. Form & Match Activity ---
    if (profile.form === "⬆️" || profile.form === "↗️") {
      advices.push({
        title: isAr ? "فورمة ممتازة" : "Excellent Form",
        body: isAr ? "مستواك الحالي ممتاز وتمر بفترة جيدة. استغل ثقتك في الملعب وخذ المبادرة لصناعة الفارق في المباريات المعقدة." : "You're in great form right now. Use your confidence on the pitch to take the initiative in tight matches."
      });
    } else if (profile.form === "↘️" || profile.form === "⬇️") {
      advices.push({
        title: isAr ? "تراجع المستوى" : "Form Slump",
        body: isAr ? "مستواك متراجع قليلاً هذه الفترة. هذا طبيعي في كرة القدم. العب السهل لتستعيد ثقتك تدريجياً وابتعد عن الفلسفة." : "Your form has dipped recently. This is normal. Play simple passes to rebuild your confidence."
      });
    }

    // --- 5. Overall General Tips (Fallback) ---
    if (advices.length === 0) {
      advices.push(
        {
          title: isAr ? "نصيحة عامة" : "General Advice",
          body: isAr ? "أرقامك متوازنة! تذكر أن التواصل مع زملائك في الملعب نصف الطريق للفوز بالبطولات." : "Your stats are balanced! Remember that communicating with your teammates on the pitch is half the battle won."
        },
        {
          title: isAr ? "الراحة والتعافي" : "Rest & Recovery",
          body: isAr ? "التعافي الجيد هو سر الأداء الثابت. احرص على النوم الجيد والإطالات بعد كل مباراة تتجاوز 60 دقيقة." : "Good recovery is the secret to consistency. Ensure you sleep well and stretch after every 60+ min game."
        }
      );
    }

    // Select 2 random advices from the generated pool so it feels dynamic
    const shuffled = advices.sort(() => 0.5 - Math.random());
    const selectedAdvices = shuffled.slice(0, 2);

    for (const ad of selectedAdvices) {
      await addDoc(notificationsRef, {
        type: "advices",
        title: ad.title,
        body: ad.body,
        read: false,
        createdAt: serverTimestamp(),
        link: "/profile"
      });
    }

  } catch (err) {
    console.error("Failed to generate advice:", err);
  }
}
