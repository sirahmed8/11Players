import { doc, collection, getDocs, addDoc, serverTimestamp, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile } from "@/types";
import { getPlayerOverall } from "@/lib/playerUtils";

const ADVICE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes per user request

interface BilingualAdvice {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

export async function generatePersonalizedAdvices(userUid: string, profile: PlayerProfile, isAr: boolean) {
  try {
    // 1. Check if we recently generated advices to avoid spam & collect recent titles to prevent repetition
    const notificationsRef = collection(db, "users", userUid, "notifications");
    const q = query(
      notificationsRef,
      where("type", "==", "advices"),
      limit(15)
    );
    const snap = await getDocs(q);
    
    const recentTitles = new Set<string>();
    if (!snap.empty) {
      // Sort in memory or check timestamps
      let lastTime = 0;
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.titleEn) recentTitles.add(data.titleEn);
        if (data.titleAr) recentTitles.add(data.titleAr);
        const docTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
        if (docTime > lastTime) lastTime = docTime;
      });
      if (Date.now() - lastTime < ADVICE_COOLDOWN_MS) {
        return []; // Too soon to generate more advices
      }
    }

    const advices: BilingualAdvice[] = [];

    // --- 0. Peer Rating Recognition & Community Synergy ---
    if ((profile.peerRatingCount || 0) > 0) {
      const avg = profile.peerRatingAvg || 6.0;
      if (avg >= 8.0) {
        advices.push({
          titleAr: "⭐ تقدير عالٍ وحب من زملائك!",
          titleEn: "⭐ High Peer Recognition & Respect!",
          bodyAr: `حصلت على تقييم رائع (${avg.toFixed(1)}/10) من زملائك في المجتمع! هذا يعكس روحك الرياضية العالية وتأثيرك الإيجابي داخل الملعب. استمر في قيادة وتوجيه الزملاء!`,
          bodyEn: `You've earned an outstanding peer rating (${avg.toFixed(1)}/10) from your community teammates! This reflects your high sportsmanship and positive impact on the pitch. Keep leading and inspiring your peers!`
        });
      } else if (avg < 6.0) {
        advices.push({
          titleAr: "🤝 تعزيز روح اللعب الجماعي",
          titleEn: "🤝 Boost Team Synergy & Fair Play",
          bodyAr: `تقييم زملائك لك بحاجة لبعض التعزيز (${avg.toFixed(1)}/10). ركز في مباراتك القادمة على اللعب التعاوني السهل، الالتزام بالتمركز، وتشجيع زملائك لكسب ثقتهم واحترامهم.`,
          bodyEn: `Your peer rating has room for growth (${avg.toFixed(1)}/10). In your next match, focus on unselfish team play, positional discipline, and encouraging teammates during tough moments to win their respect.`
        });
      }
    }

    // --- 1. Overall Rating (OVR) Based Advice ---
    const ovr = getPlayerOverall(profile);
    if (ovr < 70) {
      advices.push({
        titleAr: "🚀 مرحلة الصعود والتأسيس",
        titleEn: "🚀 Development Phase",
        bodyAr: "تقييمك العام في مرحلة الصعود الصاروخي. ركز على إتقان المهارات الأساسية: الاستلام والتسليم تحت الضغط والتمركز السليم دون تعقيد للوصول للمستوى التالي بسلاسة.",
        bodyEn: "Your overall rating is rapidly developing. Master basic ball control, simple passes under pressure, and positional discipline to quickly reach the next level."
      });
    } else if (ovr >= 85) {
      advices.push({
        titleAr: "👑 قيادة الفريق وحسم المواجهات",
        titleEn: "👑 Pitch Leadership & Mastery",
        bodyAr: "أنت أحد نجوم وقادة الفريق بناءً على تقييمك المرتفع. دورك الآن يشمل توجيه الزملاء، ضبط إيقاع اللعب في الأوقات الصعبة، وحسم المواجهات المعقدة بلمسة الذكاء.",
        bodyEn: "As one of the highest-rated stars on the pitch, your role extends to leadership—dictating tempo in crucial moments and guiding younger teammates."
      });
    }

    // --- 2. Position & Stat Synergies ---
    if (["SS", "CF", "LWF", "RWF"].includes(profile.primaryPosition || "")) {
      if ((profile.attributes?.finishing || 0) < 75) {
        advices.push({
          titleAr: "🎯 شحذ مهارة الإنهاء والتهديف",
          titleEn: "🎯 Sharpen Striker Finishing",
          bodyAr: "تسديداتك تحتاج إلى دقّة أعلى. ركز في التمارين على اللمسة الحاسمة من داخل منطقة الجزاء واختيار الزاوية البعيدة بهدوء لزيادة حصيلتك التهديفية.",
          bodyEn: "Your shooting precision needs improvement. Focus on finishing drills inside the box and calmly picking the far corner to multiply your goal tally."
        });
      }
      if ((profile.attributes?.offensiveAwareness || 0) < 75) {
        advices.push({
          titleAr: "🧠 التمركز والوعي الهجومي",
          titleEn: "🧠 Attacking Positioning & Movement",
          bodyAr: "وعيك الهجومي بحاجة للتطوير. حاول قراءة تحركات المدافعين واستغلال المساحات الشاغرة خلف الظهيرين وانطلق في اللحظة المناسبة لكسر التسلل.",
          bodyEn: "Your offensive awareness can grow. Read the defenders' movements and exploit empty spaces behind the fullbacks, timing your runs perfectly to beat the trap."
        });
      }
      if ((profile.stats?.goals || 0) === 0 && (profile.stats?.matchesPlayed || 0) > 3) {
        advices.push({
          titleAr: "🔥 كسر الصيام التهديفي بثقة",
          titleEn: "🔥 Break the Goal Drought with Confidence",
          bodyAr: "لم تسجل في مبارياتك الأخيرة. لا تتوتر! العب السهل لتفريغ المساحة وحاول التسديد من اللمسة الأولى بمجرد حصولك على فرصة سانحة.",
          bodyEn: "You haven't scored recently. Don't panic! Play simple lay-offs to open space and try shooting first-time the moment an opportunity presents itself."
        });
      }
      if (["LWF", "RWF"].includes(profile.primaryPosition || "")) {
        advices.push({
          titleAr: "⚡ استغلال وتفكيك دفاع الأطراف",
          titleEn: "⚡ Wing Play Exploitation",
          bodyAr: "كجناح هجومي، استخدم تنويع اللعب بين الدخول للعمق في أنصاف المساحات (Half-spaces) والركض على الخط لسحب أظهرة الخصم وتفكيك تماسك دفاعهم.",
          bodyEn: "As a winger, vary your movement between cutting inside into half-spaces and hugging the touchline to disorganize the opponent's fullbacks and pull them out of position."
        });
      }
    }

    if (["CMF", "DMF", "AMF", "LMF", "RMF"].includes(profile.primaryPosition || "")) {
      if ((profile.attributes?.lowPass || 0) < 75 || (profile.attributes?.loftedPass || 0) < 75) {
        advices.push({
          titleAr: "⚽ دقة التمرير وضبط إيقاع الوسط",
          titleEn: "⚽ Passing Accuracy & Tempo Control",
          bodyAr: "دقة تمريراتك بحاجة لتركيز أكبر. في المباراة القادمة، اعتمد على التمريرات القصيرة والمضمونة لبناء الثقة وإرهاق الخصم قبل لعب الكرات الطويلة العميقة.",
          bodyEn: "Your passing precision can improve. Next match, focus on short, safe passes to build confidence and tire out the opposition before attempting deep long balls."
        });
      }
      if ((profile.stats?.assists || 0) === 0 && (profile.stats?.matchesPlayed || 0) > 5) {
        advices.push({
          titleAr: "🌟 زيادة الرؤية وصناعة الأهداف",
          titleEn: "🌟 Boost Assists & Vision",
          bodyAr: "لم تقم بصناعة أهداف مؤخراً رغم لعبك لعدة مباريات. ارفع رأسك وامسح الملعب قبل استلام الكرة لاكتشاف المهاجمين المنطلقين في ظهر المدافعين.",
          bodyEn: "You haven't assisted recently despite playing several matches. Scan the pitch before receiving the ball to spot forward runners breaking behind the defensive line."
        });
      }
    }

    if (["CB", "RB", "LB"].includes(profile.primaryPosition || "")) {
      if ((profile.attributes?.defensiveAwareness || 0) < 75) {
        advices.push({
          titleAr: "🛡️ الانضباط والتمركز الدفاعي",
          titleEn: "🛡️ Defensive Positioning & Discipline",
          bodyAr: "تمركزك الدفاعي يحتاج للمزيد من الصلابة. ابقَ قريباً من المهاجمين ولا تندفع لقطع الكرة إلا وأنت واثق بنسبة عالية لتجنب ترك ثغرات خلفك.",
          bodyEn: "Your defensive positioning needs work. Stay tight to the attackers and don't commit to a tackle unless you are highly confident to avoid leaving gaps behind."
        });
      }
      if (profile.primaryPosition === "CB" && (profile.attributes?.heading || 0) < 75) {
        advices.push({
          titleAr: "✈️ الهيمنة في الكرات الهوائية",
          titleEn: "✈️ Dominating Aerial Duels",
          bodyAr: "كقلب دفاع، الرأسيات والتفوق الهوائي ضرورة قصوى. تدرب على التوقيت السليم للقفز واستخدام القوة البدنية لتوجيه الكرة وإبعاد الخطورة.",
          bodyEn: "As a CB, aerial dominance is crucial. Practice your jumping timing and core body strength to redirect high balls and clear danger convincingly."
        });
      }
      if (["LB", "RB"].includes(profile.primaryPosition || "") && (profile.attributes?.stamina || 0) < 75) {
        advices.push({
          titleAr: "🏃 لياقة الأظهرة وإدارة المجهود",
          titleEn: "🏃 Fullback Stamina & Pace Management",
          bodyAr: "الركض المستمر على الأطراف يتطلب مخزون لياقة عالي. نظم مجهودك بذكاء ولا تندفع للهجوم في كل هجمة إذا لم تكن التغطية الدفاعية متوفرة في الخلف.",
          bodyEn: "Running the flanks constantly demands high stamina reserves. Pace yourself smartly and don't push forward on every attack if defensive cover isn't guaranteed."
        });
      }
    }

    if (profile.primaryPosition === "GK") {
      if ((profile.attributes?.gkReflexes || 0) < 70) {
        advices.push({
          titleAr: "🧤 تطوير ردود الفعل وحراسة المرمى",
          titleEn: "🧤 Goalkeeper Reflexes & Agility",
          bodyAr: "ردود أفعالك تحتاج لشحذ مستمر. ركز على تدريبات الرشاقة والقفز السريع لتحسين تغطيتك للمرمى والتصدي للكرات المباغتة من مسافات قريبة.",
          bodyEn: "Your reflexes need continuous sharpening. Focus on agility and rapid jumping drills to improve goal coverage against close-range reflex shots."
        });
      }
    }

    // --- 3. Physical & Athletic Advices ---
    if ((profile.attributes?.speed || 0) < 65) {
      advices.push({
        titleAr: "⚡ زيادة الانفجارية والسرعة",
        titleEn: "⚡ Pace & Explosive Sprints",
        bodyAr: "سرعتك الانفجارية أقل من المعدل المطلوب للمواجهات السريعة. ركز على تمارين السبرنت القصير (10-20 متر) لزيادة قدرتك على تجاوز المدافعين أو اللحاق بالمهاجمين.",
        bodyEn: "Your burst pace is below average for high-tempo matches. Focus on short sprint drills (10-20m) to increase your ability to beat defenders or track back quickly."
      });
    }

    if ((profile.attributes?.physicalContact || 0) < 65) {
      advices.push({
        titleAr: "🏋️ القوة البدنية والصلابة في الالتحام",
        titleEn: "🏋️ Core Strength & Duels",
        bodyAr: "أنت تخسر بعض الالتحامات البدنية في وسط الملعب. تدريبات تقوية الجذع (Core Strength) والتوازن ستجعلك لاعباً لا يشق له طرف في الصراعات الثنائية.",
        bodyEn: "You're losing some physical duels in congested areas. Core strength and balance training will make you an immovable force in 1v1 challenges."
      });
    }
    
    if ((profile.attributes?.stamina || 0) < 70) {
      advices.push({
        titleAr: "🫁 التحمل البدني حتى الدقيقة الأخيرة",
        titleEn: "🫁 Last-Minute Stamina & Endurance",
        bodyAr: "قد ينخفض مردودك البدني في النصف الثاني من الشوط الثاني. خصص تمارين للجري المستمر (الكارديو) وتنظيم التنفس للحفاظ على تركيزك حتى صافرة النهاية.",
        bodyEn: "Your physical output may drop during the late stages of matches. Dedicate cardio workouts and breathing rhythms to stay sharp until the final whistle."
      });
    }

    // --- 4. Playstyle-based Advices ---
    const ps = profile.playStyle?.toLowerCase() || "";
    if (ps.includes("poacher") || ps.includes("قناص")) {
      advices.push({
        titleAr: "🎯 أسلوب اللعب: قناص الأهداف الخاطف",
        titleEn: "🎯 Playstyle: Lethal Goal Poacher",
        bodyAr: "العب دائماً على خط التسلل بذكاء. وظيفتك الأساسية هي اللمسة القاتلة وليس النزول الدائم للوسط؛ احتفظ بطاقتك للانطلاق الحاسم عند ثغرة الدفاع.",
        bodyEn: "Play intelligently on the shoulder of the last defender. Your primary job is the lethal touch, not dropping deep constantly; save burst energy for the decisive run."
      });
    } else if (ps.includes("box-to-box") || ps.includes("بوكس")) {
      advices.push({
        titleAr: "🔄 أسلوب اللعب: المحرك (بوكس تو بوكس)",
        titleEn: "🔄 Playstyle: Dynamic Box-to-Box Engine",
        bodyAr: "دورك يتطلب طاقة وجهد استثنائيين. كن القلب النابض الذي يربط الدفاع بالهجوم، لكن تذكر قراءة اللعب لعدم ترك فجوات دفاعية عند ارتداد الكرة.",
        bodyEn: "Your role demands immense engine endurance. Be the heartbeat linking defense to attack, but read game transitions to never leave defensive gaps on turnovers."
      });
    } else if (ps.includes("anchor") || ps.includes("ارتكاز")) {
      advices.push({
        titleAr: "⚓ أسلوب اللعب: الارتكاز الصلب والدرع",
        titleEn: "⚓ Playstyle: Solid Defensive Anchor",
        bodyAr: "أنت الدرع الواقي للخط الخلفي. ابقَ متمركزاً في العمق ولا تنجذب للأطراف لتغطية الثغرات وقطع الهجمات المرتدة قبل أن تتحول إلى خطورة.",
        bodyEn: "You are the protective shield before the defensive line. Stay centrally disciplined, don't get dragged wide, and stop counter-attacks before they become dangerous."
      });
    }

    // --- 5. Diverse Tactical, Positional & Mental Masterclass Pool ---
    advices.push(
      {
        titleAr: "🧠 التمركز والضغط الجماعي الذكي",
        titleEn: "🧠 Smart Positioning & Pressing",
        bodyAr: "لا تركض خلف الكرة بمفردك! اغلق زوايا التمرير أولاً واضغط في التوقيت الذي يستلم فيه الخصم الكرة وظهره للملعب أو في زاوية الملعب.",
        bodyEn: "Don't press alone impulsively! Cut off passing angles first and trigger the press precisely when the opponent receives with their back turned or in tight corner zones."
      },
      {
        titleAr: "👀 اتخاذ القرار السريع ومسح الملعب",
        titleEn: "👀 Scanning & Rapid Decision Making",
        bodyAr: "ارفع رأسك وامسح الملعب بنظرة سريعة قبل أن تصلك الكرة، لتعرف خيارك الأول والبديل وتنفذ التمريرة أو المراوغة من اللمسة الأولى بسلاسة.",
        bodyEn: "Scan the pitch thoroughly before the ball reaches your feet so you already know your primary and secondary options to execute first-time with fluid precision."
      },
      {
        titleAr: "🌟 الروح الإيجابية وكيمياء الفريق",
        titleEn: "🌟 Team Chemistry & Positive Leadership",
        bodyAr: "التواصل الإيجابي وتشجيع زميلك عند الخطأ يرفع المعنويات ويصنع الفارق النفسي الذي يحسم أصعب المباريات. كن قائداً بكلماتك وأفعالك!",
        bodyEn: "Positive communication and lifting up a teammate after a mistake boosts morale and creates the winning mentality needed in tough matches. Lead by example!"
      },
      {
        titleAr: "⚡ استغلال أنصاف المساحات (Half-Spaces)",
        titleEn: "⚡ Dominating the Half-Spaces",
        bodyAr: "أخطر مناطق الملعب هي الممرات بين قلب الدفاع والظهير. تحرك في هذه المنطقة لاستلام الكرة وخلق التفوق العددي وكسر الخطوط الدفاعية بلمسة واحدة.",
        bodyEn: "The most dangerous zones are the channels between CB and fullbacks. Position yourself in these half-spaces to receive on the half-turn and break defensive lines."
      },
      {
        titleAr: "🔀 اللعب على الرجل الثالث (Third-Man Runs)",
        titleEn: "🔀 Third-Man Combinations",
        bodyAr: "عندما يكون زميلك مضغوطاً، لا تنتظر الكرة منه مباشرة بل تحرك لتكون الخيار الثالث بعد تمريرة جدارية سريعة (One-Two) لاختراق التكتل الدفاعي.",
        bodyEn: "When your teammate is under heavy pressure, don't wait for a direct pass. Make dynamic third-man runs to receive immediately after a quick lay-off combination."
      },
      {
        titleAr: "🎯 إتقان التمويه الجسدي (Body Feints)",
        titleEn: "🎯 Mastery of Body Feints",
        bodyAr: "قبل استلام الكرة، استخدم تمويهاً جسدياً بسيطاً بالكتف أو الخصر في اتجاه ثم انطلق في الاتجاه المعاكس لترك المدافع خلفك دون لمس الكرة.",
        bodyEn: "Before touching the ball, drop your shoulder or feint with your torso one way before accelerating the other direction to completely off-balance your marker."
      },
      {
        titleAr: "🛡️ الوقاية الدفاعية عند الهجوم (Rest Defense)",
        titleEn: "🛡️ Smart Rest Defense",
        bodyAr: "حتى وأنت تهاجم، انتبه لمواقع مدافعي فريقك وضمان التفوق العددي ضد مهاجمي الخصم تحسباً لأي هجمة مرتدة سريعة في حال فقدان الكرة.",
        bodyEn: "Even while attacking, always check your team's structural balance behind the ball to ensure numerical superiority against counter-attacking targets upon turnovers."
      },
      {
        titleAr: "🔄 تغيير جهة اللعب ونقل الكرة للسعة",
        titleEn: "🔄 Switching the Point of Attack",
        bodyAr: "إذا تكتل الخصم في جهة واحدة من الملعب، لا تحاول الاختراق بالقوة. مرر كرة قطرية سريعة للجهة المقابلة حيث المساحة الشاغرة لزميلك غير المراقب.",
        bodyEn: "If the opponent overloads one flank, avoid forcing passes into congested traffic. Execute a quick diagonal switch to the opposite side where space is wide open."
      },
      {
        titleAr: "🔋 إدارة المخزون اللياقي والركض الذكي",
        titleEn: "🔋 Efficient Energy & Pace Regulation",
        bodyAr: "الركض المتواصل دون هدف يستنزف طاقتك قبل الدقائق الحاسمة. اختر أوقات السبرنت بذكاء واحتفظ بتركيزك العالي للقطات المصيرية في نهاية المباراة.",
        bodyEn: "Aimless running drains your fuel before crunch moments. Choose your sprint moments wisely so your technical execution remains sharp in the final crucial minutes."
      },
      {
        titleAr: "💬 التواصل الصوتي الفعال والتوجيه",
        titleEn: "💬 Vocal Pitch Communication",
        bodyAr: "النداء الواضح والمبكر لزملائك (مثل: وقتك، ظهرك، مرر هنا) يمنحهم ثانية إضافية حاسمة لاتخاذ القرار الصحيح ويمنع الأخطاء الفردية تحت الضغط.",
        bodyEn: "Clear, early calls to your teammates (e.g., 'Man on!', 'Time!', 'Turn!') grant them a precious extra second to execute correctly and prevent forced errors."
      },
      {
        titleAr: "⚖️ التوازن العاطفي والهدوء بعد قبول هدف",
        titleEn: "⚖️ Composure After Conceding",
        bodyAr: "أكبر الأخطاء تحدث بسبب التوتر بعد استقبال هدف. حافظ على هدوئك، ارفع معنويات الزملاء، وابدأ باللعب المضمون لاستعادة السيطرة وإيقاع اللقاء.",
        bodyEn: "The most expensive mistakes happen during panic after conceding. Stay calm, rally your teammates, and complete safe passes to rebuild control and momentum."
      },
      {
        titleAr: "🚀 استغلال الجري في المنطقة العمياء لمدافع الخصم",
        titleEn: "🚀 Blind-Side Attacking Runs",
        bodyAr: "تحرك دائماً في المنطقة التي لا يستطيع المدافع رؤيتك فيها مع رؤية الكرة في نفس الوقت (Blind side)، هذا يمنحك أفضلية التموضع والسباق نحو الكرة.",
        bodyEn: "Make attacking runs in the defender's blind spot where they can't watch both you and the ball simultaneously. This guarantees a positional split-second head start."
      }
    );

    // Filter out recently sent advice titles to guarantee fresh, non-repetitive suggestions every time
    const freshAdvices = advices.filter(ad => !recentTitles.has(ad.titleEn) && !recentTitles.has(ad.titleAr));
    
    // Strictly enforce deduplication: if no fresh advice is available, return nothing
    if (freshAdvices.length === 0) {
      return [];
    }

    // Select 1 random advice from the fresh pool so the user receives exactly one fresh notification
    const shuffled = freshAdvices.sort(() => 0.5 - Math.random());
    const selectedAdvices = shuffled.slice(0, 1);

    for (const ad of selectedAdvices) {
      const title = isAr ? ad.titleAr : ad.titleEn;
      const body = isAr ? ad.bodyAr : ad.bodyEn;
      await addDoc(notificationsRef, {
        type: "advices",
        title,
        body,
        titleAr: ad.titleAr,
        titleEn: ad.titleEn,
        bodyAr: ad.bodyAr,
        bodyEn: ad.bodyEn,
        read: false,
        createdAt: serverTimestamp(),
        link: "/profile?uid=" + userUid
      });
    }

    return selectedAdvices.map(ad => ({
      title: isAr ? ad.titleAr : ad.titleEn,
      body: isAr ? ad.bodyAr : ad.bodyEn,
      titleAr: ad.titleAr,
      titleEn: ad.titleEn,
      bodyAr: ad.bodyAr,
      bodyEn: ad.bodyEn
    }));
  } catch (err) {
    console.error("Failed to generate advice:", err);
    return [];
  }
}
