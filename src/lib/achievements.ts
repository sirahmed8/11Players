import type { PlayerProfile } from '@/types';

export interface AchievementRecord {
  id: string;
  icon: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  current: number;
  target: number;
  earned: boolean;
  progressEn: string;
  progressAr: string;
}

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_match',
    icon: '🎉',
    nameEn: 'First Match Played',
    nameAr: 'أول مباراة',
    descriptionEn: 'Play your first recorded match.',
    descriptionAr: 'العب أول مباراة مسجلة لك.',
    stat: 'matchesPlayed',
    target: 1,
  },
  {
    id: 'first_goal',
    icon: '⚽',
    nameEn: 'First Goal Scored',
    nameAr: 'أول هدف',
    descriptionEn: 'Score your first goal in a recorded match.',
    descriptionAr: 'سجل هدفك الأول في مباراة مسجلة.',
    stat: 'goals',
    target: 1,
  },
  {
    id: 'first_assist',
    icon: '🎯',
    nameEn: 'First Assist',
    nameAr: 'أول تمريرة حاسمة',
    descriptionEn: 'Provide your first assist in a recorded match.',
    descriptionAr: 'سجل أول تمريرة حاسمة لك في مباراة مسجلة.',
    stat: 'assists',
    target: 1,
  },
  {
    id: 'first_mvp',
    icon: '⭐',
    nameEn: 'First MVP',
    nameAr: 'أول أفضل لاعب',
    descriptionEn: 'Win your first MVP award in a match.',
    descriptionAr: 'احصل على جائزة أفضل لاعب لأول مرة في المباراة.',
    stat: 'mvp',
    target: 1,
  },
  {
    id: 'match_10',
    icon: '🏁',
    nameEn: '10 Matches Completed',
    nameAr: '10 مباريات مكتملة',
    descriptionEn: 'Complete 10 recorded matches.',
    descriptionAr: 'أكمل 10 مباريات مسجلة.',
    stat: 'matchesPlayed',
    target: 10,
  },
  {
    id: 'match_25',
    icon: '🎖️',
    nameEn: '25 Matches Completed',
    nameAr: '25 مباراة مكتملة',
    descriptionEn: 'Complete 25 recorded matches.',
    descriptionAr: 'أكمل 25 مباراة مسجلة.',
    stat: 'matchesPlayed',
    target: 25,
  },
  {
    id: 'goal_5',
    icon: '🥅',
    nameEn: '5 Goals Scored',
    nameAr: '5 أهداف',
    descriptionEn: 'Score 5 goals in total.',
    descriptionAr: 'سجل 5 أهداف إجمالية.',
    stat: 'goals',
    target: 5,
  },
  {
    id: 'goal_10',
    icon: '🔥',
    nameEn: '10 Goals Scored',
    nameAr: '10 أهداف',
    descriptionEn: 'Score 10 goals in total.',
    descriptionAr: 'سجل 10 أهداف إجمالية.',
    stat: 'goals',
    target: 10,
  },
  {
    id: 'goal_25',
    icon: '🚀',
    nameEn: '25 Goals Scored',
    nameAr: '25 هدفاً',
    descriptionEn: 'Score 25 goals in total.',
    descriptionAr: 'سجل 25 هدفاً إجمالياً.',
    stat: 'goals',
    target: 25,
  },
  {
    id: 'assist_5',
    icon: '🅰️',
    nameEn: '5 Assists',
    nameAr: '5 تمريرات حاسمة',
    descriptionEn: 'Create 5 assists in total.',
    descriptionAr: 'اصنع 5 تمريرات حاسمة إجمالاً.',
    stat: 'assists',
    target: 5,
  },
  {
    id: 'assist_10',
    icon: '🔄',
    nameEn: '10 Assists',
    nameAr: '10 تمريرات',
    descriptionEn: 'Create 10 assists in total.',
    descriptionAr: 'اصنع 10 تمريرات حاسمة إجمالاً.',
    stat: 'assists',
    target: 10,
  },
  {
    id: 'assist_25',
    icon: '🎯',
    nameEn: '25 Assists',
    nameAr: '25 تمريرة حاسمة',
    descriptionEn: 'Create 25 assists in total.',
    descriptionAr: 'اصنع 25 تمريرة حاسمة إجمالاً.',
    stat: 'assists',
    target: 25,
  },
  {
    id: 'mvp_5',
    icon: '🏆',
    nameEn: '5 MVP Awards',
    nameAr: '5 جوائز أفضل لاعب',
    descriptionEn: 'Win MVP in 5 matches.',
    descriptionAr: 'احصل على جائزة أفضل لاعب في 5 مباريات.',
    stat: 'mvp',
    target: 5,
  },
  {
    id: 'mvp_10',
    icon: '🥇',
    nameEn: '10 MVP Awards',
    nameAr: '10 جوائز أفضل لاعب',
    descriptionEn: 'Win MVP in 10 matches.',
    descriptionAr: 'احصل على جائزة أفضل لاعب في 10 مباريات.',
    stat: 'mvp',
    target: 10,
  },
  {
    id: 'trophy_1',
    icon: '🏆',
    nameEn: 'First Trophy',
    nameAr: 'أول لقب',
    descriptionEn: 'Earn your first season trophy or award.',
    descriptionAr: 'احصل على أول لقب أو جائزة موسمية.',
    stat: 'trophies',
    target: 1,
  },
  {
    id: 'trophy_5',
    icon: '🥈',
    nameEn: '5 Trophies Collected',
    nameAr: '5 ألقاب',
    descriptionEn: 'Collect 5 trophies in your profile.',
    descriptionAr: 'اجمع 5 ألقاب في ملفك الشخصي.',
    stat: 'trophies',
    target: 5,
  },
  {
    id: 'trophy_10',
    icon: '👑',
    nameEn: '10 Trophies Collected',
    nameAr: '10 ألقاب',
    descriptionEn: 'Collect 10 trophies in your profile.',
    descriptionAr: 'اجمع 10 ألقاب في ملفك الشخصي.',
    stat: 'trophies',
    target: 10,
  },
];

export function getPlayerAchievements(player: PlayerProfile, locale: 'ar' | 'en' = 'en'): AchievementRecord[] {
  const stats = {
    goals: player.stats?.goals || 0,
    assists: player.stats?.assists || 0,
    mvp: player.stats?.mvp || 0,
    matchesPlayed: player.stats?.matchesPlayed || 0,
    trophies: player.trophies?.length || 0,
  };

  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const current = stats[definition.stat as keyof typeof stats] || 0;
    const earned = current >= definition.target;

    return {
      id: definition.id,
      icon: definition.icon,
      nameEn: definition.nameEn,
      nameAr: definition.nameAr,
      descriptionEn: definition.descriptionEn,
      descriptionAr: definition.descriptionAr,
      current,
      target: definition.target,
      earned,
      progressEn: earned
        ? `Unlocked (${definition.target}/${definition.target})`
        : `${current}/${definition.target}`,
      progressAr: earned
        ? `تم الإنجاز (${definition.target}/${definition.target})`
        : `${current}/${definition.target}`,
    };
  });
}
