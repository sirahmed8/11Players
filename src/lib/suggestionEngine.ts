import { PESPosition, PlayerAttributes } from '@/types';
import { PLAYER_STYLES } from '@/components/PlayerStylePicker';

export interface PositionSuggestion {
  position: PESPosition;
  score: number;
  matchPercentage: number;
  rationaleEn: string;
  rationaleAr: string;
}

export interface PlayStyleSuggestion {
  styleId: string;
  styleEn: string;
  styleAr: string;
  score: number;
  matchPercentage: number;
  rationaleEn: string;
  rationaleAr: string;
}

const ALL_POSITIONS: PESPosition[] = [
  'CF', 'SS', 'LWF', 'RWF', 'AMF', 'LMF', 'RMF', 'CMF', 'DMF', 'LB', 'RB', 'CB', 'GK'
];

/**
 * Calculates highly accurate position and play style suggestions based on
 * player attributes, height, weight, and preferred foot.
 */
export function getTacticalSuggestions(
  attributes: Partial<PlayerAttributes> | undefined | null,
  height: number = 175,
  weight: number = 70,
  preferredFoot: string = 'Right'
): {
  positions: PositionSuggestion[];
  playStyles: PlayStyleSuggestion[];
} {
  const attrs: Record<string, number> = (attributes || {}) as Record<string, number>;
  const getAttr = (key: string): number => {
    const val = attrs[key];
    return typeof val === 'number' ? val : 60; // default average
  };

  // Extract key attributes
  const offAware = getAttr('offensiveAwareness');
  const finishing = getAttr('finishing');
  const kickPower = getAttr('kickingPower');
  const heading = getAttr('heading');
  const ballControl = getAttr('ballControl');
  const dribbling = getAttr('dribbling');
  const lowPass = getAttr('lowPass');
  const loftedPass = getAttr('loftedPass');
  const speed = getAttr('speed');
  const accel = getAttr('acceleration');
  const jump = getAttr('jump');
  const phys = getAttr('physicalContact');
  const balance = getAttr('balance');
  const stamina = getAttr('stamina');
  const defAware = getAttr('defensiveAwareness');
  const ballWin = getAttr('ballWinning');
  const aggression = getAttr('aggression');
  const gkAware = getAttr('gkAwareness');
  const gkCatch = getAttr('gkCatching');
  const gkClear = getAttr('gkClearing');
  const gkReflex = getAttr('gkReflexes');
  const gkReach = getAttr('gkReach');

  const foot = (preferredFoot || 'Right').toLowerCase();
  const isLeftFoot = foot.includes('left');
  const isRightFoot = foot.includes('right');
  const isAmbi = foot.includes('ambidextrous') || foot.includes('both');

  // Physical profile scoring helpers
  const isTall = height >= 184;
  const isVeryTall = height >= 190;
  const isShort = height <= 173;
  const isStrong = phys >= 78 || weight >= 78;
  const isAgile = speed >= 78 && accel >= 78 && balance >= 78;

  const posScores: PositionSuggestion[] = ALL_POSITIONS.map((pos) => {
    let score = 0;
    let rationaleEn = '';
    let rationaleAr = '';

    switch (pos) {
      case 'GK': {
        const gkStatsAvg = (gkAware * 0.22 + gkCatch * 0.22 + gkClear * 0.16 + gkReflex * 0.22 + gkReach * 0.18);
        score = gkStatsAvg * 0.88 + jump * 0.12;
        
        // Height adjustments for GK
        if (height >= 190) score += 4;
        else if (height >= 185) score += 2;
        else if (height < 180) score -= 5;
        else if (height < 175) score -= 10;

        // If GK stats are very low, massive penalty to prevent field players getting GK
        if (gkStatsAvg < 55) score -= 60;
        else if (gkStatsAvg < 65) score -= 30;

        if (gkStatsAvg >= 75 && height >= 185) {
          rationaleEn = 'Elite reflexes, reach, and commanding height ideal for a top-tier goalkeeper.';
          rationaleAr = 'ردود فعل وحراسة مرمى استثنائية مع طول قامة مثالي للسيطرة التامة على منطقة المرمى.';
        } else if (gkStatsAvg >= 68) {
          rationaleEn = 'Solid handling, reflexes, and awareness suited for goalkeeping duties.';
          rationaleAr = 'وعي وردود فعل ممتازة ومسك كرة مناسب للقيام بمهام حراسة المرمى بثبات.';
        } else {
          rationaleEn = 'Lacks the specialized reflexes and reach required for a goalkeeper.';
          rationaleAr = 'يفتقر لردود الفعل المتخصصة والوصول المطلوب لحارس المرمى الأساسي.';
        }
        break;
      }

      case 'CB': {
        score = (defAware * 0.25 + ballWin * 0.20 + phys * 0.18 + heading * 0.15 + jump * 0.10 + aggression * 0.08 + speed * 0.04);
        if (isVeryTall) score += 4;
        else if (isTall) score += 2;
        if (isShort) score -= 6;
        
        if (defAware >= 75 && phys >= 75 && isTall) {
          rationaleEn = 'Dominant aerial presence, immense physical strength, and elite defensive awareness.';
          rationaleAr = 'حضور قوي في الكرات الهوائية، قوة بدنية هائلة، ووعي دفاعي من الطراز الرفيع.';
        } else if (speed >= 75 && defAware >= 70) {
          rationaleEn = 'Quick recovery pace and solid defensive instincts for a modern center back.';
          rationaleAr = 'سرعة ممتازة في التغطية العكسية وغريزة دفاعية صلبة تناسب قلب الدفاع الحديث.';
        } else {
          rationaleEn = 'Reliable defensive abilities and ball winning for center back duties.';
          rationaleAr = 'قدرات دفاعية موثوقة واستخلاص للكرة مناسب لمهام قلب الدفاع.';
        }
        break;
      }

      case 'LB': {
        score = (speed * 0.15 + accel * 0.12 + stamina * 0.15 + defAware * 0.12 + ballWin * 0.12 + loftedPass * 0.12 + dribbling * 0.08 + lowPass * 0.07 + aggression * 0.07);
        if (isLeftFoot) {
          score += 5;
          rationaleEn = 'Natural left foot with great pace, stamina, and crossing ability to dominate the left flank.';
          rationaleAr = 'قدم يسرى طبيعية مع سرعة عالية وتحمل وعرضيات متقنة للسيطرة على الرواق الأيسر.';
        } else if (isAmbi) {
          score += 3;
          rationaleEn = 'Ambidextrous fullback offering tactical flexibility and stamina on the left.';
          rationaleAr = 'ظهير يجيد اللعب بالقدمين يقدم مرونة تكتيكية ولياقة عالية في الجهة اليسرى.';
        } else {
          score -= 5;
          rationaleEn = 'Good pace and stamina, but playing inverted on the left with a right foot.';
          rationaleAr = 'سرعة وتحمل جيدين، لكنه يلعب كظهير عكسي في الجهة اليسرى بقدمه اليمنى.';
        }
        break;
      }

      case 'RB': {
        score = (speed * 0.15 + accel * 0.12 + stamina * 0.15 + defAware * 0.12 + ballWin * 0.12 + loftedPass * 0.12 + dribbling * 0.08 + lowPass * 0.07 + aggression * 0.07);
        if (isRightFoot) {
          score += 5;
          rationaleEn = 'Natural right foot combined with pace, stamina, and precise crossing for the right flank.';
          rationaleAr = 'قدم يمنى طبيعية مدمجة مع سرعة وتحمل وعرضيات دقيقة للسيطرة على الرواق الأيمن.';
        } else if (isAmbi) {
          score += 3;
          rationaleEn = 'Ambidextrous fullback offering tactical flexibility and stamina on the right.';
          rationaleAr = 'ظهير يجيد اللعب بالقدمين يقدم مرونة تكتيكية ولياقة عالية في الجهة اليمنى.';
        } else {
          score -= 5;
          rationaleEn = 'Solid full-back attributes, but playing inverted on the right with a left foot.';
          rationaleAr = 'طاقات ظهير ممتازة، لكنه يلعب كظهير عكسي في الجهة اليمنى بقدمه اليسرى.';
        }
        break;
      }

      case 'DMF': {
        score = (defAware * 0.16 + ballWin * 0.16 + lowPass * 0.16 + stamina * 0.12 + loftedPass * 0.12 + phys * 0.10 + aggression * 0.10 + ballControl * 0.08);
        if (defAware >= 75 && phys >= 75) {
          rationaleEn = 'A physically imposing shield for the defense with excellent interception awareness.';
          rationaleAr = 'درع بدني قوي لحماية الدفاع مع وعي استثنائي في اعتراض الكرات وافتكاكها.';
        } else if (lowPass >= 75 && loftedPass >= 75) {
          rationaleEn = 'Deep-lying playmaker who dictates the tempo and distributes cleanly from the base of midfield.';
          rationaleAr = 'صانع ألعاب متأخر يتحكم بإيقاع المباراة ويوزع التمريرات بدقة من عمق الوسط.';
        } else {
          rationaleEn = 'Balanced defensive traits and endurance suitable for a holding midfield role.';
          rationaleAr = 'توازن ممتاز بين الخصائص الدفاعية واللياقة للقيام بدور لاعب الارتكاز الدفاعي.';
        }
        break;
      }

      case 'CMF': {
        score = (lowPass * 0.18 + loftedPass * 0.15 + ballControl * 0.15 + stamina * 0.15 + dribbling * 0.10 + defAware * 0.08 + ballWin * 0.08 + offAware * 0.07 + kickPower * 0.04);
        if (stamina >= 80 && (defAware >= 70 || offAware >= 70)) {
          rationaleEn = 'Tireless box-to-box engine capable of linking defense and attack seamlessly.';
          rationaleAr = 'محرك لا يهدأ من صندوق لصندوق، يربط بين الدفاع والهجوم بسلاسة ولياقة عالية.';
        } else if (lowPass >= 78 && ballControl >= 78) {
          rationaleEn = 'Technically gifted central midfielder with exceptional passing vision and close control.';
          rationaleAr = 'لاعب وسط موهوب تقنياً برؤية تمرير استثنائية وتحكم دقيق بالكرة في المساحات الضيقة.';
        } else {
          rationaleEn = 'Well-rounded passing and control metrics suited for central midfield linking.';
          rationaleAr = 'قدرات تمرير وتحكم متوازنة تجعله حلقة الوصل المثالية في وسط الميدان.';
        }
        break;
      }

      case 'AMF': {
        score = (ballControl * 0.18 + dribbling * 0.18 + lowPass * 0.18 + offAware * 0.15 + loftedPass * 0.12 + finishing * 0.08 + speed * 0.06 + accel * 0.05);
        if (dribbling >= 80 && ballControl >= 80) {
          rationaleEn = 'Creative maestro with magical close control and dribbling to unlock tight defenses.';
          rationaleAr = 'مايسترو مبدع بتحكم سحري ومراوغات قادرة على فك شفرات أعتى الدفاعات.';
        } else if (lowPass >= 80 && offAware >= 75) {
          rationaleEn = 'Visionary playmaker specializing in killer final passes and sharp attacking movement.';
          rationaleAr = 'صانع ألعاب برؤية ثاقبة متخصص في التمريرات الحاسمة والتحركات الهجومية الذكية.';
        } else {
          rationaleEn = 'Dynamic attacking midfielder combining technical flair with offensive awareness.';
          rationaleAr = 'لاعب وسط هجومي ديناميكي يجمع بين المهارة الفنية والحس الهجومي العالي.';
        }
        break;
      }

      case 'LMF': {
        score = (speed * 0.15 + accel * 0.15 + dribbling * 0.15 + loftedPass * 0.15 + stamina * 0.13 + ballControl * 0.12 + lowPass * 0.10 + offAware * 0.05);
        if (isLeftFoot || isAmbi) {
          score += 4;
          rationaleEn = 'Tireless wide midfielder offering width, pace, and brilliant crossing from the left.';
          rationaleAr = 'لاعب وسط أيسر لا يكل، يوفر اتساعاً للملعب، سرعة، وعرضيات رائعة من اليسار.';
        } else {
          rationaleEn = 'Pacy wide operator on the left, favoring right-footed inverted combinations.';
          rationaleAr = 'لاعب سريع على الجهة اليسرى، يفضل الدخول للعمق بقدمه اليمنى لتبادل التمريرات.';
        }
        break;
      }

      case 'RMF': {
        score = (speed * 0.15 + accel * 0.15 + dribbling * 0.15 + loftedPass * 0.15 + stamina * 0.13 + ballControl * 0.12 + lowPass * 0.10 + offAware * 0.05);
        if (isRightFoot || isAmbi) {
          score += 4;
          rationaleEn = 'Tireless wide midfielder offering width, pace, and brilliant crossing from the right.';
          rationaleAr = 'لاعب وسط أيمن لا يكل، يوفر اتساعاً للملعب، سرعة، وعرضيات رائعة من اليمين.';
        } else {
          rationaleEn = 'Pacy wide operator on the right, favoring left-footed inverted combinations.';
          rationaleAr = 'لاعب سريع على الجهة اليمنى، يفضل الدخول للعمق بقدمه اليسرى لتبادل التمريرات.';
        }
        break;
      }

      case 'LWF': {
        score = (speed * 0.18 + accel * 0.18 + dribbling * 0.18 + ballControl * 0.14 + offAware * 0.12 + finishing * 0.10 + loftedPass * 0.10);
        if (isRightFoot && finishing >= 75) {
          score += 5;
          rationaleEn = 'Lethal inverted winger: cuts inside onto his stronger right foot to unleash dangerous shots.';
          rationaleAr = 'جناح عكسي قاتل: يخترق للداخل بقدمه اليمنى القوية لإطلاق تسديدات خطيرة على المرمى.';
        } else if (isLeftFoot && loftedPass >= 75) {
          score += 3;
          rationaleEn = 'Traditional pacy winger attacking the left byline to deliver pinpoint crosses.';
          rationaleAr = 'جناح أيسر كلاسيكي سريع يهاجم خط التماس لإرسال عرضيات دقيقة للغاية.';
        } else {
          rationaleEn = 'Explosive pace and dribbling skills specifically tailored for advanced wing attacks.';
          rationaleAr = 'سرعة متفجرة ومهارات مراوغة مصممة خصيصاً لقيادة الهجمات من الأجنحة المتقدمة.';
        }
        break;
      }

      case 'RWF': {
        score = (speed * 0.18 + accel * 0.18 + dribbling * 0.18 + ballControl * 0.14 + offAware * 0.12 + finishing * 0.10 + loftedPass * 0.10);
        if (isLeftFoot && finishing >= 75) {
          score += 5;
          rationaleEn = 'Lethal inverted winger: cuts inside onto his stronger left foot to curl shots into the far corner.';
          rationaleAr = 'جناح عكسي قاتل: يخترق للداخل بقدمه اليسرى القوية لتسديد كرات مقوسة في الزاوية البعيدة.';
        } else if (isRightFoot && loftedPass >= 75) {
          score += 3;
          rationaleEn = 'Traditional pacy winger attacking the right byline to deliver pinpoint crosses.';
          rationaleAr = 'جناح أيمن كلاسيكي سريع يهاجم خط التماس لإرسال عرضيات دقيقة للغاية.';
        } else {
          rationaleEn = 'Explosive pace and dribbling skills specifically tailored for advanced wing attacks.';
          rationaleAr = 'سرعة متفجرة ومهارات مراوغة مصممة خصيصاً لقيادة الهجمات من الأجنحة المتقدمة.';
        }
        break;
      }

      case 'SS': {
        score = (offAware * 0.18 + ballControl * 0.18 + dribbling * 0.16 + finishing * 0.15 + speed * 0.10 + accel * 0.10 + lowPass * 0.08 + kickPower * 0.05);
        if (offAware >= 78 && dribbling >= 78 && finishing >= 75) {
          rationaleEn = 'Elite false nine displaying sharp attacking movement, agility, and lethal finishing.';
          rationaleAr = 'مهاجم وهمي من النخبة يُظهر تحركات هجومية حادة، خفة حركة، وإنهاء قاتل للهجمات.';
        } else {
          rationaleEn = 'Agile forward with an excellent first touch and great instincts in and around the box.';
          rationaleAr = 'مهاجم خفيف الحركة بلمسة أولى ممتازة وغرائز هجومية رائعة داخل وحول منطقة الجزاء.';
        }
        break;
      }

      case 'CF': {
        score = (finishing * 0.22 + offAware * 0.22 + kickPower * 0.12 + heading * 0.10 + phys * 0.10 + speed * 0.08 + accel * 0.08 + jump * 0.08);
        if (isTall && phys >= 78) {
          score += 4;
          rationaleEn = 'Dominant focal point relying on immense physical strength, aerial ability, and clinical finishing.';
          rationaleAr = 'رأس حربة مهيمن يعتمد على القوة البدنية الهائلة، البراعة الهوائية، والإنهاء الحاسم للفرص.';
        } else if (speed >= 80 && accel >= 80) {
          score += 3;
          rationaleEn = 'Explosive goal poacher relying on lightning pace to break high defensive lines and finish.';
          rationaleAr = 'قناص أهداف متفجر يعتمد على سرعة البرق لكسر خطوط الدفاع المتقدمة وإنهاء الهجمات.';
        } else {
          rationaleEn = 'Highly clinical striker possessing strong offensive instincts and lethal shooting skills.';
          rationaleAr = 'مهاجم حاسم للغاية يمتلك غرائز هجومية قوية ومهارات تسديد قاتلة أمام المرمى.';
        }
        break;
      }
    }

    // Normalize match percentage between 40% and 99%
    const maxPoss = 99;
    const matchPercentage = Math.min(99, Math.max(40, Math.round((score / maxPoss) * 100)));

    return {
      position: pos,
      score,
      matchPercentage,
      rationaleEn,
      rationaleAr
    };
  });

  // Sort positions descending by score
  posScores.sort((a, b) => b.score - a.score);

  const topPosition = posScores[0]?.position || 'CF';

  // Deep Play Style synergy scoring
  const styleSuggestions: PlayStyleSuggestion[] = PLAYER_STYLES.map((style) => {
    let score = 50;
    let rationaleEn = style.descEn;
    let rationaleAr = style.descAr;

    const isPrimaryCompatible = style.positions.includes(topPosition);
    if (isPrimaryCompatible) score += 15;

    switch (style.id) {
      case 'goal_poacher':
        score += (offAware * 0.35 + speed * 0.25 + accel * 0.20 + finishing * 0.20) * 0.5;
        if (offAware >= 78 && speed >= 78) {
          rationaleEn = 'Perfect for exploiting high lines with blistering pace and masterclass off-the-ball runs.';
          rationaleAr = 'مثالي لاستغلال المساحات بسرعته الفائقة وانطلاقاته الذكية خلف خطوط الدفاع.';
        }
        break;
      case 'fox_in_the_box':
        score += (finishing * 0.40 + phys * 0.20 + kickPower * 0.20 + offAware * 0.20) * 0.5;
        if (finishing >= 78 && offAware >= 75) {
          rationaleEn = 'Thrives strictly inside the penalty box with lethal one-touch finishing and anticipation.';
          rationaleAr = 'يتألق حصرياً داخل منطقة الجزاء بإنهاء قاتل من لمسة واحدة وتوقع ممتاز للكرة.';
        }
        break;
      case 'target_man':
        score += (phys * 0.35 + heading * 0.25 + ballControl * 0.20 + jump * 0.20) * 0.5 + (isTall ? 12 : -15);
        if (isTall && phys >= 78) {
          rationaleEn = 'Unmatched physical build to pin defenders back, win aerial duels, and link up play.';
          rationaleAr = 'بنية جسدية لا تضاهى لتثبيت المدافعين، الفوز بالصراعات الهوائية، وربط اللعب زملائه.';
        }
        break;
      case 'creative_playmaker':
        score += (lowPass * 0.30 + ballControl * 0.30 + dribbling * 0.25 + loftedPass * 0.15) * 0.5;
        if (ballControl >= 80 && lowPass >= 78) {
          rationaleEn = 'Operates as the creative hub, utilizing supreme vision and touch to orchestrate attacks.';
          rationaleAr = 'يعمل كمحور الإبداع، مستغلاً رؤيته الثاقبة ولمسته الدقيقة لهندسة الهجمات الخطيرة.';
        }
        break;
      case 'hole_player':
        score += (offAware * 0.30 + speed * 0.25 + finishing * 0.25 + dribbling * 0.20) * 0.5;
        if (offAware >= 78 && speed >= 75) {
          rationaleEn = 'Specializes in making undetected late runs into the box to score crucial goals.';
          rationaleAr = 'متخصص في الانطلاقات المتأخرة وغير المكتشفة داخل الصندوق لتسجيل أهداف حاسمة.';
        }
        break;
      case 'orchestrator':
        score += (lowPass * 0.40 + loftedPass * 0.30 + ballControl * 0.20 + defAware * 0.10) * 0.5;
        if (lowPass >= 80) {
          rationaleEn = 'Sits deep to dictate the flow of the match with elite passing accuracy and calmness.';
          rationaleAr = 'يتمركز في الخلف ليتحكم برتم المباراة بدقة تمرير نادرة وهدوء تام تحت الضغط.';
        }
        break;
      case 'box_to_box':
        score += (stamina * 0.40 + speed * 0.20 + lowPass * 0.15 + defAware * 0.15 + ballWin * 0.10) * 0.5;
        if (stamina >= 82) {
          rationaleEn = 'Boasts an inexhaustible engine to cover every blade of grass, assisting both boxes.';
          rationaleAr = 'يتمتع بمحرك لا ينضب لتغطية كل شبر في الملعب، مسانداً في الدفاع والهجوم طوال المباراة.';
        }
        break;
      case 'the_destroyer':
        score += (aggression * 0.35 + ballWin * 0.35 + phys * 0.20 + stamina * 0.10) * 0.5;
        if (aggression >= 78 && ballWin >= 78) {
          rationaleEn = 'A ruthless enforcer who hunts down opponents and breaks up attacks with fierce tackles.';
          rationaleAr = 'منفذ قاسي يطارد الخصوم ويفسد هجماتهم بتدخلات وافتكاكات كروية شرسة.';
        }
        break;
      case 'anchor_man':
        score += (defAware * 0.40 + ballWin * 0.30 + phys * 0.20 + heading * 0.10) * 0.5;
        if (defAware >= 78) {
          rationaleEn = 'Shows extreme positional discipline, holding his ground deep to protect the center backs.';
          rationaleAr = 'يُظهر انضباطاً تكتيكياً بالغاً، حيث يحافظ على تمركزه العميق لحماية قلبي الدفاع دائماً.';
        }
        break;
      case 'build_up':
        score += (lowPass * 0.35 + loftedPass * 0.30 + defAware * 0.20 + ballControl * 0.15) * 0.5;
        if (lowPass >= 75 && defAware >= 75) {
          rationaleEn = 'Highly composed under pressure, capable of launching attacks from the deepest defensive line.';
          rationaleAr = 'هادئ جداً تحت الضغط، وقادر على بدء الهجمات بدقة تمرير من أعمق خطوط الدفاع.';
        }
        break;
      case 'prolific_winger':
        score += (speed * 0.30 + accel * 0.25 + dribbling * 0.25 + finishing * 0.20) * 0.5;
        if (speed >= 80 && dribbling >= 78) {
          rationaleEn = 'Direct and explosive, excelling at bypassing fullbacks and cutting inside to score.';
          rationaleAr = 'مباشر ومتفجر، يتألق في تجاوز الأظهرة والدخول للعمق لتسجيل الأهداف بنفسه.';
        }
        break;
      case 'roaming_flank':
        score += (dribbling * 0.30 + lowPass * 0.25 + ballControl * 0.25 + offAware * 0.20) * 0.5;
        if (dribbling >= 78 && offAware >= 75) {
          rationaleEn = 'Intelligently drifts centrally from the wing to overload the middle and combine plays.';
          rationaleAr = 'يتحرك بذكاء من الجناح للعمق لخلق تفوق عددي وتبادل التمريرات مع خط الوسط.';
        }
        break;
      case 'cross_specialist':
        score += (loftedPass * 0.40 + speed * 0.20 + stamina * 0.20 + dribbling * 0.20) * 0.5;
        if (loftedPass >= 78) {
          rationaleEn = 'A master of wide delivery, serving impeccable lofted crosses precisely onto strikers heads.';
          rationaleAr = 'سيد العرضيات، يرسل كرات مقوسة وعالية بدقة متناهية على رؤوس المهاجمين.';
        }
        break;
      case 'offensive_fullback':
        score += (speed * 0.30 + stamina * 0.30 + loftedPass * 0.25 + dribbling * 0.15) * 0.5;
        if (speed >= 78 && stamina >= 78) {
          rationaleEn = 'Provides relentless overlapping runs, acting as an extra winger while maintaining stamina.';
          rationaleAr = 'يقدم انطلاقات هجومية متواصلة، ليعمل كجناح إضافي مع الحفاظ على لياقته لـ90 دقيقة.';
        }
        break;
      case 'defensive_fullback':
        score += (defAware * 0.40 + ballWin * 0.30 + speed * 0.20 + phys * 0.10) * 0.5;
        if (defAware >= 78) {
          rationaleEn = 'Prioritizes extreme defensive solidity, refusing to push up to keep the backline airtight.';
          rationaleAr = 'يعطي الأولوية للصلابة الدفاعية القصوى، رافضاً التقدم للأمام لإبقاء الخط الخلفي محكماً.';
        }
        break;
      case 'offensive_gk':
        score += (speed * 0.30 + gkReflex * 0.30 + gkAware * 0.25 + accel * 0.15) * 0.5;
        if (speed >= 65 && gkReflex >= 75) {
          rationaleEn = 'Proactive sweeper-keeper, instantly rushing out to clear through balls behind high lines.';
          rationaleAr = 'حارس مرمى هجومي يندفع بسرعة خارج منطقته لقطع الكرات البينية خلف الدفاع المتقدم.';
        }
        break;
      case 'defensive_gk':
        score += (gkCatch * 0.35 + gkAware * 0.35 + gkClear * 0.30) * 0.5;
        if (gkCatch >= 75) {
          rationaleEn = 'A traditional shot-stopper rooted to his line, prioritizing safe catches over taking risks.';
          rationaleAr = 'حارس تقليدي ثابت على خطه، يعطي الأولوية للإمساك الآمن للكرات دون اتخاذ مخاطرات.';
        }
        break;
      default:
        score += 30;
    }

    const matchPercentage = Math.min(99, Math.max(45, Math.round((score / 95) * 100)));
    return {
      styleId: style.id,
      styleEn: style.en,
      styleAr: style.ar,
      score,
      matchPercentage,
      rationaleEn,
      rationaleAr
    };
  });

  styleSuggestions.sort((a, b) => b.score - a.score);

  return {
    positions: posScores,
    playStyles: styleSuggestions
  };
}
