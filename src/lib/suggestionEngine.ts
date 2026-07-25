import { PESPosition, PlayerAttributes } from '@/types';
import { PLAYER_STYLES } from '@/components/player/PlayerStylePicker';
import { calculateRealisticOverall } from '@/lib/overallCalculator';

export interface PositionSuggestion {
  position: PESPosition;
  score: number;
  baseOvr: number;
  matchPercentage: number;
  rationaleEn: string;
  rationaleAr: string;
  bestPlayStyle?: string;
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
 * Calculates attribute fit score for a specific play style based on core composites.
 */
function calculatePlayStyleFitScore(
  styleId: string,
  getAttr: (key: string) => number,
  height: number,
  weight: number,
  preferredFoot: string
): number {
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
  const stamina = getAttr('stamina');
  const defAware = getAttr('defensiveAwareness');
  const ballWin = getAttr('ballWinning');
  const aggression = getAttr('aggression');
  const gkAware = getAttr('gkAwareness');
  const gkCatch = getAttr('gkCatching');
  const gkClear = getAttr('gkClearing');
  const gkReflex = getAttr('gkReflexes');

  // Composites
  const pac = (speed + accel) / 2;
  const sho = (finishing + kickPower + offAware) / 3;
  const pas = (lowPass + loftedPass) / 2;
  const dri = (dribbling + ballControl) / 2;
  const def = (defAware + ballWin + aggression) / 3;
  const phy = (phys + stamina + jump) / 3;

  const isTall = height >= 183;

  switch (styleId) {
    case 'goal_poacher':
      return offAware * 0.35 + pac * 0.30 + finishing * 0.25 + sho * 0.10;
    case 'fox_in_the_box':
      return finishing * 0.40 + phy * 0.25 + kickPower * 0.20 + offAware * 0.15;
    case 'target_man':
      return phys * 0.35 + heading * 0.25 + ballControl * 0.20 + jump * 0.20 + (isTall ? 12 : -15);
    case 'deep_lying_forward':
      return pas * 0.35 + dri * 0.30 + offAware * 0.20 + finishing * 0.15;
    case 'dummy_runner':
      return pac * 0.35 + offAware * 0.35 + stamina * 0.15 + dri * 0.15;
    case 'creative_playmaker':
      return pas * 0.35 + dri * 0.35 + offAware * 0.15 + loftedPass * 0.15;
    case 'hole_player':
      return offAware * 0.35 + sho * 0.25 + pac * 0.20 + dri * 0.20;
    case 'classic_no_10':
      return pas * 0.40 + ballControl * 0.30 + loftedPass * 0.15 + kickPower * 0.15;
    case 'prolific_winger':
      return pac * 0.35 + dri * 0.30 + finishing * 0.20 + offAware * 0.15;
    case 'roaming_flank':
      return dri * 0.35 + pas * 0.30 + offAware * 0.20 + pac * 0.15;
    case 'cross_specialist':
      return loftedPass * 0.45 + pac * 0.25 + stamina * 0.15 + dri * 0.15;
    case 'orchestrator':
      return lowPass * 0.40 + loftedPass * 0.30 + ballControl * 0.20 + def * 0.10;
    case 'box_to_box':
      return stamina * 0.40 + pac * 0.20 + pas * 0.20 + def * 0.20;
    case 'the_destroyer':
      return aggression * 0.35 + ballWin * 0.35 + phys * 0.15 + defAware * 0.15;
    case 'anchor_man':
      return defAware * 0.40 + ballWin * 0.30 + phys * 0.20 + heading * 0.10;
    case 'build_up':
      return pas * 0.35 + defAware * 0.35 + ballControl * 0.15 + loftedPass * 0.15;
    case 'extra_frontman':
      return heading * 0.30 + phys * 0.25 + offAware * 0.25 + defAware * 0.20;
    case 'offensive_fullback':
      return pac * 0.35 + stamina * 0.30 + loftedPass * 0.20 + dri * 0.15;
    case 'defensive_fullback':
      return def * 0.45 + pac * 0.25 + phys * 0.20 + stamina * 0.10;
    case 'fullback_finisher':
      return dri * 0.35 + pas * 0.25 + offAware * 0.25 + finishing * 0.15;
    case 'offensive_gk':
      return speed * 0.35 + gkReflex * 0.30 + gkAware * 0.25 + accel * 0.10;
    case 'defensive_gk':
      return gkCatch * 0.40 + gkAware * 0.35 + gkClear * 0.25;
    default:
      return 50;
  }
}

/**
 * Determines the absolute best play style for a specific position.
 */
export function selectBestPlayStyleForPosition(
  pos: PESPosition,
  getAttr: (key: string) => number,
  height: number,
  weight: number,
  preferredFoot: string
): string {
  const compatible = PLAYER_STYLES.filter(s => s.positions.includes(pos));
  if (compatible.length === 0) return 'box_to_box';

  let bestStyle = compatible[0].id;
  let bestScore = -Infinity;

  for (const style of compatible) {
    const score = calculatePlayStyleFitScore(style.id, getAttr, height, weight, preferredFoot);
    if (score > bestScore) {
      bestScore = score;
      bestStyle = style.id;
    }
  }

  return bestStyle;
}

export function getBestPlayStyleNameForPosition(player: any, position: PESPosition): string {
  if (!player) return 'Box-to-Box';
  const attrs = player.attributes || player.approvedAttributes || {};
  const getAttr = (key: string) => Number(attrs[key as keyof PlayerAttributes]) || 60;
  const height = Number(player.height) || 175;
  const weight = Number(player.weight) || 70;
  const preferredFoot = player.preferredFoot || 'Right';

  const styleId = selectBestPlayStyleForPosition(position, getAttr, height, weight, preferredFoot);
  const found = PLAYER_STYLES.find(s => s.id === styleId);
  return found?.en || player.playStyle || 'Box-to-Box';
}

/**
 * Calculates highly accurate position and play style suggestions.
 * Primary position is strictly the position that yields the MAXIMUM OVR.
 */
export function getTacticalSuggestions(
  attributes: Partial<PlayerAttributes> | undefined | null,
  height: number = 175,
  weight: number = 70,
  preferredFoot: string = 'Right',
  age: number = 25,
  peerAvg: number = 0,
  peerCount: number = 0
): {
  positions: PositionSuggestion[];
  playStyles: PlayStyleSuggestion[];
} {
  const attrs: Record<string, number> = (attributes || {}) as Record<string, number>;
  const getAttr = (key: string): number => {
    const val = attrs[key];
    return typeof val === 'number' ? val : 60;
  };

  const offAware = getAttr('offensiveAwareness');
  const finishing = getAttr('finishing');
  const heading = getAttr('heading');
  const ballControl = getAttr('ballControl');
  const dribbling = getAttr('dribbling');
  const lowPass = getAttr('lowPass');
  const loftedPass = getAttr('loftedPass');
  const speed = getAttr('speed');
  const accel = getAttr('acceleration');
  const phys = getAttr('physicalContact');
  const stamina = getAttr('stamina');
  const defAware = getAttr('defensiveAwareness');
  const ballWin = getAttr('ballWinning');
  const gkAware = getAttr('gkAwareness');
  const gkCatch = getAttr('gkCatching');
  const gkClear = getAttr('gkClearing');
  const gkReflex = getAttr('gkReflexes');
  const gkReach = getAttr('gkReach');

  const foot = (preferredFoot || 'Right').toLowerCase();
  const isLeftFoot = foot.includes('left');
  const isRightFoot = foot.includes('right');
  const isAmbi = foot.includes('ambidextrous') || foot.includes('both');

  const posScores: PositionSuggestion[] = ALL_POSITIONS.map((pos) => {
    // 1. Exact mathematical base OVR for this position
    const baseOvr = calculateRealisticOverall(
      attrs as unknown as PlayerAttributes,
      pos,
      '',
      height,
      weight,
      age,
      peerAvg,
      peerCount,
      preferredFoot
    );

    let score = baseOvr;
    let rationaleEn = '';
    let rationaleAr = '';

    switch (pos) {
      case 'GK': {
        const gkStatsAvg = (gkAware * 0.22 + gkCatch * 0.22 + gkClear * 0.16 + gkReflex * 0.22 + gkReach * 0.18);
        if (gkStatsAvg < 55) score -= 60; // Field player penalty
        else if (gkStatsAvg < 65) score -= 30;

        if (gkStatsAvg >= 75 && height >= 185) {
          rationaleEn = 'Elite reflexes, reach, and commanding height ideal for a top-tier goalkeeper.';
          rationaleAr = 'ردود فعل وحراسة مرمى استثنائية مع طول قامة مثالي للسيطرة التامة على منطقة المرمى.';
        } else {
          rationaleEn = 'Goalkeeping reflexes and positioning metrics.';
          rationaleAr = 'قدرات وردود فعل متخصصة لحراسة المرمى.';
        }
        break;
      }

      case 'CB': {
        if ((defAware >= 72 || ballWin >= 72) && Math.min(speed, accel) < 72) score += 3.0;
        rationaleEn = 'Dominant defensive awareness, tackling, and physical presence in central defense.';
        rationaleAr = 'حضور دفاعي وافتكاك قوي للكرة ووعي ممتاز لمركز قلب الدفاع.';
        break;
      }

      case 'LB': {
        if (Math.min(speed, accel) < 72) score -= 15.0; // Pace penalty
        if (isLeftFoot) score += 2.0;
        rationaleEn = 'Pace, stamina, and left-flank defensive coverage.';
        rationaleAr = 'سرعة وتحمل وتغطية دفاعية ممتازة في الجناح الأيسر.';
        break;
      }

      case 'RB': {
        if (Math.min(speed, accel) < 72) score -= 15.0; // Pace penalty
        if (isRightFoot) score += 2.0;
        rationaleEn = 'Pace, stamina, and right-flank defensive coverage.';
        rationaleAr = 'سرعة وتحمل وتغطية دفاعية ممتازة في الجناح الأيمن.';
        break;
      }

      case 'DMF': {
        if ((defAware >= 72 || ballWin >= 72) && Math.min(speed, accel) < 72) score += 3.0;
        rationaleEn = 'Holding midfield anchor with strong interception and passing skills.';
        rationaleAr = 'لاعب ارتكاز دفاعي متميز في قطع التمريرات وتوزيع الكرة.';
        break;
      }

      case 'CMF': {
        rationaleEn = 'Box-to-box engine with balanced passing, control, and stamina.';
        rationaleAr = 'لاعب وسط متوازن يربط بين الدفاع والهجوم بلياقة وتتمرير دقيق.';
        break;
      }

      case 'AMF': {
        rationaleEn = 'Creative playmaker with sharp passing, vision, and attacking movement.';
        rationaleAr = 'صانع ألعاب هجومي مبدع يمتلك تمريرات حاسمة ورؤية واسعة.';
        break;
      }

      case 'LMF':
      case 'RMF':
      case 'LWF':
      case 'RWF': {
        if (Math.min(speed, accel) < 70) score -= 12.0; // Pace penalty
        rationaleEn = 'Pacy winger/midfielder creating chances and cutting inside from wide areas.';
        rationaleAr = 'جناح سريع وصانع فرص يتألق على الأطراف والدخول لعمق الدفاع.';
        break;
      }

      case 'SS':
      case 'CF': {
        rationaleEn = 'Clinical forward possessing lethal offensive awareness and finishing ability.';
        rationaleAr = 'مهاجم حاسم يمتلك حس هجومي عالي وإنهاء ممتاز للفرص.';
        break;
      }
    }

    const bestStyle = selectBestPlayStyleForPosition(pos, getAttr, height, weight, preferredFoot);

    return {
      position: pos,
      baseOvr,
      score,
      matchPercentage: 0,
      rationaleEn,
      rationaleAr,
      bestPlayStyle: bestStyle
    };
  });

  // Sort strictly PRIMARY BY baseOvr DESCENDING! Secondary by tactical score descending!
  posScores.sort((a, b) => {
    if (b.baseOvr !== a.baseOvr) {
      return b.baseOvr - a.baseOvr;
    }
    return b.score - a.score;
  });

  // Recalculate matchPercentage
  const maxScore = posScores[0]?.score || 99;
  const minScore = posScores[posScores.length - 1]?.score || 40;
  const scoreRange = maxScore - minScore || 1;
  posScores.forEach((ps) => {
    const relativePct = Math.round(45 + ((ps.score - minScore) / scoreRange) * 54);
    ps.matchPercentage = Math.min(99, Math.max(45, relativePct));
  });

  // Play Style Suggestions across all 22 styles
  const styleSuggestions: PlayStyleSuggestion[] = PLAYER_STYLES.map((style) => {
    const score = calculatePlayStyleFitScore(style.id, getAttr, height, weight, preferredFoot);
    const matchPercentage = Math.min(99, Math.max(45, Math.round((score / 95) * 100)));
    return {
      styleId: style.id,
      styleEn: style.en,
      styleAr: style.ar,
      score,
      matchPercentage,
      rationaleEn: style.descEn,
      rationaleAr: style.descAr
    };
  });

  styleSuggestions.sort((a, b) => b.score - a.score);

  return {
    positions: posScores,
    playStyles: styleSuggestions
  };
}
