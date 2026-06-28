export type PESPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'DMF' | 'CMF' | 'AMF' | 'LMF' | 'RMF' | 'LWF' | 'RWF' | 'SS' | 'CF';

export interface EditRequest {
  id?: string;
  playerId: string;
  playerName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  attributes?: Partial<PlayerAttributes>;
  stats?: Partial<CommunityStats>;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  adminUid: string;
  communityModerators?: string[];
  isPrivate: boolean;
  password?: string;
  createdAt: string;
}

export interface CommunitySettings {
  slowModeDelay: number; // in seconds, 0 means off
}

export interface ChatMessage {
  id?: string;
  senderUid: string;
  senderName: string;
  senderPic?: string;
  text: string;
  imageUrl?: string;
  timestamp: any;
  replyToId?: string; // ID of the message being replied to
  reactions?: Record<string, string>; // uid -> emoji
  isEdited?: boolean;
}

export interface SupportThread {
  id: string; // The user's UID who started the thread
  userName: string;
  userPic?: string;
  lastMessage: string;
  lastUpdatedAt: any;
  unreadCount: number;
}

export interface CommunityStats {
  goals: number;
  assists: number;
  mvp: number;
  matchesPlayed: number;
  form?: '⬆️' | '↗️' | '➡️' | '↘️' | '⬇️';
  trophies?: {
    name: string;
    season: string;
    date: string;
  }[];
}

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
  email?: string;
  googlePic?: string;
  googleName?: string;
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
  memberCommunities?: string[];
  pendingCommunities?: string[];
  attributes: PlayerAttributes;
  selfAttributes?: PlayerAttributes;
  approvedAttributes?: PlayerAttributes;
  peerReviews?: { reviewerUid: string; reviewerName: string; timestamp: string; ratings: Partial<PlayerAttributes>; }[];
  averagePeerAttributes?: Partial<PlayerAttributes>;
  isMockData?: boolean;
  specialSkills: string[];
  playStyle?: string;
  photoUrl: string;
  isVerifiedByAdmin: boolean;
  hasWarning: boolean;
  isGlobalModerator?: boolean;
  form?: '⬆️' | '↗️' | '➡️' | '↘️' | '⬇️';
  // Global total stats (aggregated)
  stats: {
    goals: number;
    assists: number;
    mvp: number;
    matchesPlayed: number;
  };
  trophies?: {
    name: string;
    season: string;
    date: string;
  }[];
  // Which communities this player is a part of
  joinedCommunities?: string[];
  // Community-specific stats stored on the root player document for easy access
  // Record<communityId, CommunityStats>
  communityStats?: Record<string, CommunityStats>;
  defaultPage?: string;
  isExcludedFromMatchmaking?: boolean;
}
