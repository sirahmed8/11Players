export type PESPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'DMF' | 'CMF' | 'AMF' | 'LMF' | 'RMF' | 'LWF' | 'RWF' | 'SS' | 'CF';

export interface PlayerAttributes {
  attackingProwess: number; // 1-99
  defensiveProwess: number; // 1-99
  speed: number;            // 1-99
  acceleration: number;     // 1-99
  stamina: number;          // 1-99
  dribbling: number;        // 1-99
  passing: number;          // 1-99
  physicalContact: number;  // 1-99
  shotPower: number;        // 1-99
  goalkeeping: number;      // 1-99
}

export interface PlayerProfile {
  uid: string;
  fullName: string;
  cardName: string;
  dateOfBirth: string; // YYYY-MM-DD
  calculatedAge: number;
  height: number; // cm
  weight: number; // kg
  preferredFoot: 'Right' | 'Left' | 'Ambidextrous';
  primaryPosition: PESPosition;
  secondaryPosition: PESPosition;
  tertiaryPosition: PESPosition;
  attributes: PlayerAttributes;
  specialSkills: string[];
  playStyle?: string;
  photoUrl: string;
  isVerifiedByAdmin: boolean;
  hasWarning: boolean;
  stats: {
    goals: number;
    assists: number;
    mvp: number;
    matchesPlayed: number;
  };
}
