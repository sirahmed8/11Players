export type PESPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'DMF' | 'CMF' | 'AMF' | 'LMF' | 'RMF' | 'LWF' | 'RWF' | 'SS' | 'CF';

export interface PlayerAttributes {
  offensiveAwareness: number; // 40-99
  ballControl: number;        // 40-99
  dribbling: number;          // 40-99
  lowPass: number;            // 40-99
  loftedPass: number;         // 40-99
  finishing: number;          // 40-99
  heading: number;            // 40-99
  speed: number;              // 40-99
  acceleration: number;       // 40-99
  kickingPower: number;       // 40-99
  jump: number;               // 40-99
  physicalContact: number;    // 40-99
  balance: number;            // 40-99
  stamina: number;            // 40-99
  defensiveAwareness: number; // 40-99
  ballWinning: number;        // 40-99
  goalkeeping: number;        // 40-99
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
