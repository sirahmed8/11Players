import type { PlayerProfile } from '@/types';
import { getPlayerOverall } from './playerUtils';

export interface AchievementTier {
  tierLevel: number;
  target: number;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export interface AchievementRecord {
  id: string;
  groupId: string;
  icon: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  current: number;
  target: number;
  earned: boolean;
  isAllCompleted: boolean;
  currentTierLevel: number;
  maxTierLevel: number;
  completedTiersCount: number;
  progressEn: string;
  progressAr: string;
  tiers?: AchievementTier[];
}

export interface GroupDefinition {
  groupId: string;
  stat: string;
  tiers: AchievementTier[];
}

const TIERED_ACHIEVEMENT_GROUPS: GroupDefinition[] = [
  {
    groupId: 'goals_series',
    stat: 'goals',
    tiers: [
      { tierLevel: 1, target: 1, nameEn: 'First Goal', nameAr: 'أول هدف', descriptionEn: 'Score 1 goal in a recorded match.', descriptionAr: 'سجل هدفك الأول في مباراة مسجلة.', icon: '⚽' },
      { tierLevel: 2, target: 5, nameEn: 'Goal Hunter', nameAr: 'صياد الأهداف', descriptionEn: 'Reach 5 total goals.', descriptionAr: 'سجل 5 أهداف إجمالية.', icon: '🥅' },
      { tierLevel: 3, target: 15, nameEn: 'Clinical Striker', nameAr: 'مهاجم حاسم', descriptionEn: 'Reach 15 total goals.', descriptionAr: 'سجل 15 هدفاً إجمالياً.', icon: '🔥' },
      { tierLevel: 4, target: 30, nameEn: 'Sniper Supreme', nameAr: 'قناص ممتاز', descriptionEn: 'Reach 30 total goals.', descriptionAr: 'سجل 30 هدفاً إجمالياً.', icon: '🚀' },
      { tierLevel: 5, target: 50, nameEn: 'Golden Boot Contender', nameAr: 'منافس الحذاء الذهبي', descriptionEn: 'Reach 50 total goals.', descriptionAr: 'سجل 50 هدفاً إجمالياً.', icon: '👑' },
      { tierLevel: 6, target: 100, nameEn: 'Century Legend', nameAr: 'أسطورة المئة هدف', descriptionEn: 'Reach 100 total goals.', descriptionAr: 'سجل 100 هدف إجمالياً.', icon: '🏆' },
    ],
  },
  {
    groupId: 'assists_series',
    stat: 'assists',
    tiers: [
      { tierLevel: 1, target: 1, nameEn: 'First Assist', nameAr: 'أول تمريرة حاسمة', descriptionEn: 'Provide 1 assist in a match.', descriptionAr: 'اصنع هدفاً واحداً في مباراة.', icon: '🎯' },
      { tierLevel: 2, target: 5, nameEn: 'Playmaker Bronze', nameAr: 'صانع ألعاب برونزي', descriptionEn: 'Reach 5 total assists.', descriptionAr: 'اصنع 5 تمريرات حاسمة.', icon: '🅰️' },
      { tierLevel: 3, target: 15, nameEn: 'Visionary Master', nameAr: 'مهندس التمريرات', descriptionEn: 'Reach 15 total assists.', descriptionAr: 'اصنع 15 تمريرة حاسمة.', icon: '🔄' },
      { tierLevel: 4, target: 30, nameEn: 'Assist Architect', nameAr: 'مصمم الأهداف', descriptionEn: 'Reach 30 total assists.', descriptionAr: 'اصنع 30 تمريرة حاسمة.', icon: '🪄' },
      { tierLevel: 5, target: 50, nameEn: 'Midfield Maestro', nameAr: 'مايسترو الوسط', descriptionEn: 'Reach 50 total assists.', descriptionAr: 'اصنع 50 تمريرة حاسمة.', icon: '💎' },
    ],
  },
  {
    groupId: 'matches_series',
    stat: 'matchesPlayed',
    tiers: [
      { tierLevel: 1, target: 1, nameEn: 'Debutant', nameAr: 'الظهور الأول', descriptionEn: 'Play 1 recorded match.', descriptionAr: 'العب اول مباراة مسجلة لك.', icon: '🎉' },
      { tierLevel: 2, target: 10, nameEn: 'Squad Regular', nameAr: 'لاعب أساسي', descriptionEn: 'Complete 10 recorded matches.', descriptionAr: 'أكمل 10 مباريات مسجلة.', icon: '🏁' },
      { tierLevel: 3, target: 25, nameEn: 'Pitch Veteran', nameAr: 'مخضرم الملاعب', descriptionEn: 'Complete 25 recorded matches.', descriptionAr: 'أكمل 25 مباراة مسجلة.', icon: '🎖️' },
      { tierLevel: 4, target: 50, nameEn: 'Club Iron Man', nameAr: 'الرجل الحديدي للمكعب', descriptionEn: 'Complete 50 recorded matches.', descriptionAr: 'أكمل 50 مباراة مسجلة.', icon: '🛡️' },
      { tierLevel: 5, target: 100, nameEn: '100 Matches Hall of Fame', nameAr: 'قاعة مشاهير الـ 100 مباراة', descriptionEn: 'Complete 100 recorded matches.', descriptionAr: 'أكمل 100 مباراة مسجلة.', icon: '🏛️' },
    ],
  },
  {
    groupId: 'mvp_series',
    stat: 'mvp',
    tiers: [
      { tierLevel: 1, target: 1, nameEn: 'First MVP', nameAr: 'أول أفضل لاعب', descriptionEn: 'Win 1 MVP award.', descriptionAr: 'احصل على جائزة أفضل لاعب.', icon: '⭐' },
      { tierLevel: 2, target: 5, nameEn: 'Star Performer', nameAr: 'نجم المباراة', descriptionEn: 'Win 5 MVP awards.', descriptionAr: 'احصل على جائزة أفضل لاعب 5 مرات.', icon: '🏆' },
      { tierLevel: 3, target: 15, nameEn: 'Match Winner', nameAr: 'حاسم المباريات', descriptionEn: 'Win 15 MVP awards.', descriptionAr: 'احصل على جائزة أفضل لاعب 15 مرة.', icon: '🥇' },
      { tierLevel: 4, target: 30, nameEn: 'Ballon d\'Or Favorite', nameAr: 'المرشح للكرة الذهبية', descriptionEn: 'Win 30 MVP awards.', descriptionAr: 'احصل على جائزة أفضل لاعب 30 مرة.', icon: '🌟' },
    ],
  },
  {
    groupId: 'ovr_series',
    stat: 'overall',
    tiers: [
      { tierLevel: 1, target: 70, nameEn: 'Pro Player (70 OVR)', nameAr: 'لاعب محترف (70 OVR)', descriptionEn: 'Reach 70 Overall Rating.', descriptionAr: 'الوصول لتقييم عام 70.', icon: '📊' },
      { tierLevel: 2, target: 75, nameEn: 'Elite Rating (75 OVR)', nameAr: 'تقييم نخبة (75 OVR)', descriptionEn: 'Reach 75 Overall Rating.', descriptionAr: 'الوصول لتقييم عام 75.', icon: '⚡' },
      { tierLevel: 3, target: 80, nameEn: 'Superstar (80 OVR)', nameAr: 'سوبر ستار (80 OVR)', descriptionEn: 'Reach 80 Overall Rating.', descriptionAr: 'الوصول لتقييم عام 80.', icon: '🔥' },
      { tierLevel: 4, target: 85, nameEn: 'World Class (85 OVR)', nameAr: 'مستوى عالمي (85 OVR)', descriptionEn: 'Reach 85 Overall Rating.', descriptionAr: 'الوصول لتقييم عام 85.', icon: '💎' },
      { tierLevel: 5, target: 90, nameEn: 'Emerald God (90 OVR)', nameAr: 'أسطورة الزمرد (90 OVR)', descriptionEn: 'Reach 90 Overall Rating.', descriptionAr: 'الوصول لتقييم عام 90.', icon: '👑' },
    ],
  },
  {
    groupId: 'trophies_series',
    stat: 'trophies',
    tiers: [
      { tierLevel: 1, target: 1, nameEn: 'First Silverware', nameAr: 'أول لقب منصة', descriptionEn: 'Collect 1 trophy or award.', descriptionAr: 'احصل على أول كأس أو لقب.', icon: '🏆' },
      { tierLevel: 2, target: 5, nameEn: 'Trophy Collector', nameAr: 'جامع الكؤوس', descriptionEn: 'Collect 5 trophies.', descriptionAr: 'اجمع 5 ألقاب في ملفك.', icon: '🥈' },
      { tierLevel: 3, target: 10, nameEn: 'Cabinet Champion', nameAr: 'خزانة البطولات', descriptionEn: 'Collect 10 trophies.', descriptionAr: 'اجمع 10 ألقاب.', icon: '👑' },
    ],
  },
];

export function getPlayerAchievements(player: PlayerProfile, locale: 'ar' | 'en' = 'en'): AchievementRecord[] {
  const overall = getPlayerOverall(player);
  const stats = {
    goals: player.stats?.goals || 0,
    assists: player.stats?.assists || 0,
    mvp: player.stats?.mvp || 0,
    matchesPlayed: player.stats?.matchesPlayed || 0,
    trophies: player.trophies?.length || 0,
    overall,
  };

  const records: AchievementRecord[] = [];

  TIERED_ACHIEVEMENT_GROUPS.forEach((group) => {
    const currentVal = stats[group.stat as keyof typeof stats] || 0;
    const completedCount = group.tiers.filter((t) => currentVal >= t.target).length;
    const isAllCompleted = completedCount === group.tiers.length;

    // Active tier is the next uncompleted tier, or highest tier if all done
    const activeTierIndex = Math.min(completedCount, group.tiers.length - 1);
    const activeTier = group.tiers[activeTierIndex];
    const currentTierLevel = activeTierIndex + 1;
    const maxTierLevel = group.tiers.length;
    const isEarned = currentVal >= activeTier.target;

    records.push({
      id: `${group.groupId}_t${currentTierLevel}`,
      groupId: group.groupId,
      icon: activeTier.icon,
      nameEn: `${activeTier.nameEn} (Tier ${currentTierLevel}/${maxTierLevel})`,
      nameAr: `${activeTier.nameAr} (المستوى ${currentTierLevel}/${maxTierLevel})`,
      descriptionEn: activeTier.descriptionEn,
      descriptionAr: activeTier.descriptionAr,
      current: currentVal,
      target: activeTier.target,
      earned: isEarned,
      isAllCompleted,
      currentTierLevel,
      maxTierLevel,
      completedTiersCount: completedCount,
      progressEn: isEarned
        ? `Unlocked (${currentVal}/${activeTier.target})`
        : `${currentVal}/${activeTier.target}`,
      progressAr: isEarned
        ? `تم الفتح (${currentVal}/${activeTier.target})`
        : `${currentVal}/${activeTier.target}`,
      tiers: group.tiers,
    });
  });

  return records;
}
