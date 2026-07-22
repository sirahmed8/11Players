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
        const gkAvg = (gkAware + gkCatch + gkClear + gkReflex + gkReach) / 5;
        // Normalize score: out of 100 max.
        // If gk stats are very low (e.g. 40), penalty is high so it doesn't get suggested.
        score = gkAvg * 0.85 + jump * 0.15;
        if (height >= 185) score += 5;
        else if (height < 180) score -= 5;
        
        // Massive penalty if user is clearly not a GK
        if (gkAvg < 55) {
          score -= 50;
        }

        if (gkAvg >= 75 && height >= 185) {
          rationaleEn = 'Superior goalkeeper reflexes, reach, and tall height ideal for commanding the goal area.';
          rationaleAr = 'ردود فعل وحراسة مرمى ممتازة مع طول قامة مثالي للسيطرة على منطقة المرمى.';
        } else if (gkAvg >= 68) {
          rationaleEn = 'Good handling and awareness suited for goalkeeping.';
          rationaleAr = 'وعي ومسك كرة مناسب للقيام بمهام حراسة المرمى.';
        } else {
          rationaleEn = 'Goalkeeper skills require further development.';
          rationaleAr = 'مهارات حراسة المرمى تحتاج إلى مزيد من التطوير.';
        }
        break;
      }

      case 'CB': {
        score = (defAware * 0.3 + ballWin * 0.3 + phys * 0.2 + heading * 0.1 + jump * 0.1);
        if (isTall) score += 6;
        if (isVeryTall) score += 4;
        if (isShort) score -= 8;
        if (defAware >= 75 && ballWin >= 75 && isTall) {
          rationaleEn = 'Dominant aerial presence, high physical contact, and elite defensive awareness.';
          rationaleAr = 'حضور قوي في الكرات الهوائية والتحامات بدنية صلبة ووعي دفاعي ممتاز.';
        } else {
          rationaleEn = 'Solid defensive abilities and ball winning for center back duties.';
          rationaleAr = 'قدرات دفاعية جيدة واستخلاص للكرة مناسب لقلب الدفاع.';
        }
        break;
      }

      case 'LB': {
        score = (speed * 0.2 + accel * 0.15 + stamina * 0.2 + defAware * 0.2 + loftedPass * 0.15 + dribbling * 0.1);
        if (isLeftFoot || isAmbi) {
          score += 8;
          rationaleEn = 'Natural left foot with great pace, stamina, and crossing ability on the left flank.';
          rationaleAr = 'قدم يسرى طبيعية مع سرعة عالية وتحمل ومجهود رائع على الرواق الأيسر.';
        } else {
          score -= 6;
          rationaleEn = 'Good pace and stamina, but right footed on the left side.';
          rationaleAr = 'سرعة وتحمل جيدين لكن مع الاعتماد على القدم اليمنى في الجهة اليسرى.';
        }
        break;
      }

      case 'RB': {
        score = (speed * 0.2 + accel * 0.15 + stamina * 0.2 + defAware * 0.2 + loftedPass * 0.15 + dribbling * 0.1);
        if (isRightFoot || isAmbi) {
          score += 8;
          rationaleEn = 'Natural right foot combined with pace, stamina, and crossing precision.';
          rationaleAr = 'قدم يمنى أساسية وسرعة وتحمل مع دقة في إرسال العرضيات من الرواق الأيمن.';
        } else {
          score -= 6;
          rationaleEn = 'Good full-back attributes, though left footed on the right flank.';
          rationaleAr = 'طاقات أظهرة جيدة رغم الاعتماد على القدم اليسرى في الرواق الأيمن.';
        }
        break;
      }

      case 'DMF': {
        score = (defAware * 0.25 + ballWin * 0.25 + lowPass * 0.2 + stamina * 0.15 + phys * 0.15);
        if (defAware >= 75 && lowPass >= 75) {
          rationaleEn = 'Elite interception awareness with clean distribution to shield the defense.';
          rationaleAr = 'قراءة ممتازة للهجمات وتمريرات دقيقة لحماية خط الدفاع وبناء الهجمات.';
        } else {
          rationaleEn = 'Balanced defensive traits and endurance for holding midfield.';
          rationaleAr = 'توازن دفاعي ولياقة عالية للقيام بدور ارتكاز وسط الميدان.';
        }
        break;
      }

      case 'CMF': {
        score = (lowPass * 0.25 + loftedPass * 0.15 + ballControl * 0.2 + stamina * 0.2 + dribbling * 0.1 + defAware * 0.1);
        if (lowPass >= 78 && stamina >= 80) {
          rationaleEn = 'Complete box-to-box engine with sharp passing vision and tireless stamina.';
          rationaleAr = 'محرك وسط ملعب متكامل برؤية تمرير ثاقبة ولمسة دقيقة وتحمل بدني عالٍ.';
        } else {
          rationaleEn = 'Well-rounded passing and control suited for central midfield linking.';
          rationaleAr = 'قدرات تمرير وتحكم متوازنة لربط الخطوط في عمق الملعب.';
        }
        break;
      }

      case 'AMF': {
        score = (lowPass * 0.25 + ballControl * 0.25 + dribbling * 0.2 + offAware * 0.15 + finishing * 0.15);
        if (ballControl >= 80 && lowPass >= 78) {
          rationaleEn = 'High-level playmaker with supreme ball control, vision, and final pass ability.';
          rationaleAr = 'صانع ألعاب من الطراز الرفيع بتحكم استثنائي للكرة وصناعة الأهداف الحاسمة.';
        } else {
          rationaleEn = 'Good technical skills and attacking flair between the lines.';
          rationaleAr = 'مهارات فنية جيدة ولمسة هجومية إبداعية خلف المهاجمين.';
        }
        break;
      }

      case 'LMF': {
        score = (speed * 0.2 + stamina * 0.2 + dribbling * 0.2 + loftedPass * 0.2 + ballControl * 0.2);
        if (isLeftFoot || isAmbi) score += 5;
        rationaleEn = 'Wide midfielder endurance with crossing and touch for the left touchline.';
        rationaleAr = 'لياقة أطراف ممتازة مع مهارات تمرير وعرضيات لضبط الجهة اليسرى.';
        break;
      }

      case 'RMF': {
        score = (speed * 0.2 + stamina * 0.2 + dribbling * 0.2 + loftedPass * 0.2 + ballControl * 0.2);
        if (isRightFoot || isAmbi) score += 5;
        rationaleEn = 'Wide midfielder endurance with crossing and touch for the right touchline.';
        rationaleAr = 'لياقة أطراف ممتازة مع مهارات تمرير وعرضيات لضبط الجهة اليمنى.';
        break;
      }

      case 'LWF': {
        score = (speed * 0.25 + accel * 0.2 + dribbling * 0.25 + ballControl * 0.15 + finishing * 0.15);
        if (isAgile) score += 5;
        if (isRightFoot && finishing >= 75) {
          score += 6;
          rationaleEn = 'Lethal inverted winger: cuts inside onto right foot to shoot with pace and dribbling.';
          rationaleAr = 'جناح عكسي خطير يخترق للداخل بالقدم اليمنى للتسديد والمراوغة بسرعته.';
        } else if (isLeftFoot) {
          score += 4;
          rationaleEn = 'Natural left winger with speed and dribbling to beat defenders out wide.';
          rationaleAr = 'جناح أيسر سريع بمهارات مراوغة لتجاوز المدافعين ولعب العرضيات.';
        } else {
          rationaleEn = 'Dynamic pace and dribbling suited for wing attacks.';
          rationaleAr = 'سرعة ومراوغات مناسبة لشن الهجمات من الجناح.';
        }
        break;
      }

      case 'RWF': {
        score = (speed * 0.25 + accel * 0.2 + dribbling * 0.25 + ballControl * 0.15 + finishing * 0.15);
        if (isAgile) score += 5;
        if (isLeftFoot && finishing >= 75) {
          score += 6;
          rationaleEn = 'Lethal inverted winger: cuts inside onto left foot to curl shots into the far corner.';
          rationaleAr = 'جناح عكسي خطير يخترق للداخل بالقدم اليسرى لتسديد كرات مقوسة حاسمة.';
        } else if (isRightFoot) {
          score += 4;
          rationaleEn = 'Natural right winger with explosive pace and close control out wide.';
          rationaleAr = 'جناح أيمن بسرعته وتحكمه بالكرة لخلق الخطورة على الطرف الأيمن.';
        } else {
          rationaleEn = 'Dynamic pace and dribbling suited for wing attacks.';
          rationaleAr = 'سرعة ومراوغات مناسبة لشن الهجمات من الجناح.';
        }
        break;
      }

      case 'SS': {
        score = (offAware * 0.25 + dribbling * 0.2 + ballControl * 0.2 + finishing * 0.2 + accel * 0.15);
        if (offAware >= 78 && dribbling >= 78) {
          rationaleEn = 'Sharp attacking movement, agility, and finishing for a second striker or false nine role.';
          rationaleAr = 'تحركات هجومية ذكية ومراوغة وإنهاء حاسم لدور المهاجم الثاني أو المهاجم الوهمي.';
        } else {
          rationaleEn = 'Agile forward with good touch and goal instincts.';
          rationaleAr = 'مهاجم خفيف الحركة بلمسة جيدة وحس تهديفي أمام المرمى.';
        }
        break;
      }

      case 'CF': {
        score = (finishing * 0.3 + offAware * 0.25 + kickPower * 0.15 + speed * 0.15 + heading * 0.15);
        if (isTall && isStrong) {
          score += 6;
          rationaleEn = 'Dominant focal point: physical strength, heading ability, and clinical finishing inside the box.';
          rationaleAr = 'رأس حربة كلاسيكي بقوة بدنية ولمسة رأسية وإنهاء قاتل للفرص داخل الصندوق.';
        } else if (speed >= 80 && finishing >= 78) {
          score += 6;
          rationaleEn = 'Explosive goal poacher with lightning pace to break defensive lines and finish.';
          rationaleAr = 'مهاجم قناص بسرعته الخاطفة لكسر مصائد التسلل وتسجيل الأهداف.';
        } else {
          rationaleEn = 'Clinical finisher with strong offensive instincts.';
          rationaleAr = 'هداّف بحس هجومي رائع داخل منطقة الجزاء.';
        }
        break;
      }
    }

    // Normalize match percentage between 40% and 99%
    const maxPoss = 98;
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

  // Score Play Styles based on attributes, height, and suggested position
  const styleSuggestions: PlayStyleSuggestion[] = PLAYER_STYLES.map((style) => {
    let score = 50;
    let rationaleEn = style.descEn;
    let rationaleAr = style.descAr;

    const isPrimaryCompatible = style.positions.includes(topPosition);
    if (isPrimaryCompatible) score += 20;

    switch (style.id) {
      case 'goal_poacher':
        score += (offAware * 0.4 + speed * 0.3 + finishing * 0.3) * 0.5;
        if (offAware >= 78 && speed >= 78) {
          rationaleEn = 'Ideal for breaking defensive traps with high speed and sharp attacking awareness.';
          rationaleAr = 'مثالي لكسر خطوط الخصم بسرعته العالية ووعيه الهجومي الممتاز.';
        }
        break;
      case 'fox_in_the_box':
        score += (finishing * 0.45 + phys * 0.3 + kickPower * 0.25) * 0.5;
        if (finishing >= 78 && phys >= 75) {
          rationaleEn = 'Uses physical presence and deadly accuracy to dominate inside the penalty box.';
          rationaleAr = 'يستغل قوته البدنية ودقته القاتلة للسيطرة والتسجيل من داخل الصندوق.';
        }
        break;
      case 'target_man':
        score += (phys * 0.4 + heading * 0.3 + ballControl * 0.3) * 0.5 + (isTall ? 10 : -10);
        if (isTall && phys >= 78) {
          rationaleEn = 'Perfect physical build and strength to hold up the ball and link with teammates.';
          rationaleAr = 'بنية جسدية وقوة بدنية مثالية لاستلام الكرة بالظهر وتهيئة الفرص للقادمين من الخلف.';
        }
        break;
      case 'creative_playmaker':
        score += (lowPass * 0.35 + ballControl * 0.35 + dribbling * 0.3) * 0.5;
        if (ballControl >= 80 && lowPass >= 78) {
          rationaleEn = 'Leverages elite touch and precision passing to unlock tight defenses.';
          rationaleAr = 'يستفيد من تحكمه الفائق ودقة تمريراته لصناعة ثغرات في دفاع الخصم.';
        }
        break;
      case 'hole_player':
        score += (offAware * 0.35 + speed * 0.35 + finishing * 0.3) * 0.5;
        if (offAware >= 78 && speed >= 75) {
          rationaleEn = 'Times runs perfectly from midfield into the box to score clutch goals.';
          rationaleAr = 'يقوم بانطلاقات ذكية ومفاجئة من خط الوسط إلى منطقة الجزاء للتسجيل.';
        }
        break;
      case 'orchestrator':
        score += (lowPass * 0.4 + loftedPass * 0.3 + ballControl * 0.3) * 0.5;
        if (lowPass >= 80) {
          rationaleEn = 'Controls the tempo of the match from deep with superior passing distribution.';
          rationaleAr = 'يضبط إيقاع اللعب وينظم الهجمات من العمق بتمريراته المتقنة.';
        }
        break;
      case 'box_to_box':
        score += (stamina * 0.45 + speed * 0.25 + lowPass * 0.15 + defAware * 0.15) * 0.5;
        if (stamina >= 82) {
          rationaleEn = 'Relentless stamina and work rate allowing full pitch coverage both ways.';
          rationaleAr = 'لياقة بدنية ومجهود وافر يتيح له التغطية والدعم المستمر في الدفاع والهجوم.';
        }
        break;
      case 'the_destroyer':
        score += (aggression * 0.4 + ballWin * 0.35 + phys * 0.25) * 0.5;
        if (aggression >= 78 && ballWin >= 75) {
          rationaleEn = 'Aggressive tackling and physical dominance that halts counter-attacks instantly.';
          rationaleAr = 'شراسة في افتكاك الكرة وقوة بدنية توقف هجمات الخصم في مهدها.';
        }
        break;
      case 'anchor_man':
        score += (defAware * 0.45 + ballWin * 0.3 + phys * 0.25) * 0.5;
        if (defAware >= 78) {
          rationaleEn = 'Exceptional positional discipline staying deep to shield the center backs.';
          rationaleAr = 'انضباط تكتيكي استثنائي بالبقاء أمام قلبي الدفاع لتأمين العمق.';
        }
        break;
      case 'build_up':
        score += (lowPass * 0.35 + loftedPass * 0.3 + defAware * 0.35) * 0.5;
        if (lowPass >= 75 && defAware >= 75) {
          rationaleEn = 'Composed defender capable of bypassing pressing with clean passes.';
          rationaleAr = 'مدافع هادئ وقادر على كسر ضغط الخصم بتمريرات دقيقة وبناء اللعب بسلاسة.';
        }
        break;
      case 'prolific_winger':
        score += (speed * 0.35 + dribbling * 0.35 + finishing * 0.3) * 0.5;
        if (speed >= 80 && dribbling >= 78) {
          rationaleEn = 'Explosive wing play, dribbling past defenders before cutting in for the finish.';
          rationaleAr = 'سرعة ومراوغة رائعة على الأطراف مع القدرة على الدخول للعمق والتسديد.';
        }
        break;
      case 'roaming_flank':
        score += (dribbling * 0.35 + lowPass * 0.35 + ballControl * 0.3) * 0.5;
        if (dribbling >= 78 && lowPass >= 75) {
          rationaleEn = 'Drifts inside centrally to combine with midfielders and create overload spaces.';
          rationaleAr = 'يتحرك للعمق لتبادل التمريرات مع لاعبي الوسط وصناعة التفوق العددي.';
        }
        break;
      case 'cross_specialist':
        score += (loftedPass * 0.5 + speed * 0.25 + stamina * 0.25) * 0.5;
        if (loftedPass >= 78) {
          rationaleEn = 'Delivers pinpoint crosses from wide areas directly to the forwards.';
          rationaleAr = 'يرسل كرات عرضية مقوسة ودقيقة جداً من الأطراف مباشرة لرؤوس المهاجمين.';
        }
        break;
      case 'offensive_fullback':
        score += (speed * 0.35 + stamina * 0.35 + loftedPass * 0.3) * 0.5;
        if (speed >= 78 && stamina >= 78) {
          rationaleEn = 'Endless overlaps down the wing providing constant width and attacking threats.';
          rationaleAr = 'انطلاقات هجومية مستمرة على الرواق لتقديم الدعم والكرات العرضية طوال المباراة.';
        }
        break;
      case 'defensive_fullback':
        score += (defAware * 0.45 + ballWin * 0.35 + speed * 0.2) * 0.5;
        if (defAware >= 75) {
          rationaleEn = 'Reliable backline protection shutting down opposition wingers completely.';
          rationaleAr = 'حماية دفاعية صلبة وإغلاق تام للمساحات أمام أجنحة الخصم السريعة.';
        }
        break;
      case 'offensive_gk':
        score += (speed * 0.35 + gkReflex * 0.35 + gkAware * 0.3) * 0.5;
        if (speed >= 65 && gkReflex >= 75) {
          rationaleEn = 'Quick off the line to sweep up through balls behind high defensive lines.';
          rationaleAr = 'سريع في الخروج من مرماه لقطع الكرات الطولية خلف خط الدفاع المتقدم.';
        }
        break;
      case 'defensive_gk':
        score += (gkCatch * 0.4 + gkAware * 0.4 + (height > 185 ? 80 : 60) * 0.2) * 0.5;
        if (gkCatch >= 75) {
          rationaleEn = 'Commanding shot-stopper who dominates his goal line with safe handling.';
          rationaleAr = 'حارس مرمى صلب يتمركز بامتياز على خط مرماه مع أمان عالٍ في التقاط الكرات.';
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
