import { writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";
import { PlayerProfile, PESPosition } from "@/types";

const POSITIONS: PESPosition[] = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF'];

const ARABIC_FIRST_NAMES = ["أحمد", "محمد", "محمود", "عمر", "علي", "كريم", "يوسف", "حسن", "حسين", "طارق", "سامي", "رامي", "سعد", "خالد", "ماجد", "وليد", "ياسر"];
const ARABIC_LAST_NAMES = ["عبدالله", "إبراهيم", "سعيد", "صلاح", "تريزيجيه", "حجازي", "الشناوي", "عبدالمجيد", "عطية", "النيني", "مصطفى", "زكي", "متعب", "جمعة"];

const ENGLISH_FIRST_NAMES = ["John", "Michael", "David", "Chris", "James", "Kevin", "Robert", "William", "Joseph", "Thomas", "Daniel", "Paul", "Mark", "George"];
const ENGLISH_LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"];

const PLAY_STYLES = [
  "Goal Poacher", "Fox in the Box", "Creative Playmaker", "Hole Player",
  "Box-to-Box", "Anchor Man", "Destroyer", "Orchestrator", "Cross Specialist",
  "Offensive Full-back", "Defensive Full-back", "Build Up", "Extra Frontman",
  "Offensive Goalkeeper", "Defensive Goalkeeper"
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomAttributes(position: PESPosition) {
  // Base attributes
  const attr = {
    offensiveAwareness: randomInt(50, 75),
    ballControl: randomInt(50, 75),
    dribbling: randomInt(50, 75),
    lowPass: randomInt(50, 75),
    loftedPass: randomInt(50, 75),
    finishing: randomInt(50, 75),
    heading: randomInt(50, 75),
    speed: randomInt(50, 85),
    acceleration: randomInt(50, 85),
    kickingPower: randomInt(50, 85),
    jump: randomInt(50, 85),
    physicalContact: randomInt(50, 85),
    balance: randomInt(50, 85),
    stamina: randomInt(60, 85),
    defensiveAwareness: randomInt(50, 75),
    ballWinning: randomInt(50, 75),
    goalkeeping: 40,
  };

  // Adjust based on position
  if (position === 'GK') {
    attr.goalkeeping = randomInt(70, 90);
    attr.jump = randomInt(70, 90);
    attr.defensiveAwareness = randomInt(70, 90);
  } else if (['CB', 'LB', 'RB'].includes(position)) {
    attr.defensiveAwareness = randomInt(70, 90);
    attr.ballWinning = randomInt(70, 90);
    attr.physicalContact = randomInt(70, 90);
    attr.heading = randomInt(70, 90);
  } else if (['DMF', 'CMF'].includes(position)) {
    attr.lowPass = randomInt(75, 90);
    attr.loftedPass = randomInt(75, 90);
    attr.stamina = randomInt(75, 95);
  } else if (['AMF', 'LMF', 'RMF', 'LWF', 'RWF'].includes(position)) {
    attr.dribbling = randomInt(75, 95);
    attr.speed = randomInt(75, 95);
    attr.ballControl = randomInt(75, 90);
    attr.offensiveAwareness = randomInt(70, 85);
  } else if (['CF', 'SS'].includes(position)) {
    attr.finishing = randomInt(75, 95);
    attr.offensiveAwareness = randomInt(80, 95);
    attr.kickingPower = randomInt(70, 90);
  }

  return attr;
}

export async function generateDummyPlayersForCommunity(communityId: string) {
  try {
    const batch = writeBatch(db);
    let totalGenerated = 0;

    // Generate 32 players
    for (let i = 0; i < 32; i++) {
      const isArabic = Math.random() > 0.5;
      const firstName = isArabic ? randomChoice(ARABIC_FIRST_NAMES) : randomChoice(ENGLISH_FIRST_NAMES);
      const lastName = isArabic ? randomChoice(ARABIC_LAST_NAMES) : randomChoice(ENGLISH_LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      
      const position = randomChoice(POSITIONS);
      
      const uid = `dummy_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`;
      
        const isLeftPref = ['LWF', 'LMF', 'LB'].includes(position);
        const isRightPref = ['RWF', 'RMF', 'RB'].includes(position);
        let foot = 'Right';
        const footRand = Math.random();
        if (isLeftPref) {
          foot = footRand > 0.15 ? 'Left' : (footRand > 0.05 ? 'Ambidextrous' : 'Right');
        } else if (isRightPref) {
          foot = footRand > 0.15 ? 'Right' : (footRand > 0.05 ? 'Ambidextrous' : 'Left');
        } else {
          foot = footRand > 0.25 ? 'Right' : (footRand > 0.05 ? 'Left' : 'Ambidextrous');
        }

        const dummyProfile: PlayerProfile = {
          uid,
          email: `dummy${i}@11players.com`,
          fullName,
          cardName: lastName,
          dateOfBirth: "2000-01-01",
          calculatedAge: randomInt(16, 40),
          height: randomInt(165, 195),
          weight: randomInt(60, 90),
          preferredFoot: foot as 'Right' | 'Left' | 'Ambidextrous',
        primaryPosition: position,
        secondaryPosition: randomChoice(POSITIONS),
        tertiaryPosition: randomChoice(POSITIONS),
        attributes: generateRandomAttributes(position),
        specialSkills: [],
        playStyle: randomChoice(PLAY_STYLES),
        photoUrl: "",
        isVerifiedByAdmin: true,
        hasWarning: false,
        stats: { goals: randomInt(0, 10), assists: randomInt(0, 10), mvp: randomInt(0, 3), matchesPlayed: randomInt(0, 15) },
        isMockData: true,
        memberCommunities: [communityId],
        joinedCommunities: [communityId]
      };

      // Add to global players
      batch.set(doc(db, "players", uid), dummyProfile);
      
      // Add to community's players
      batch.set(doc(db, "communities", communityId, "players", uid), {
        ...dummyProfile,
        joinedAt: new Date().toISOString(),
        role: "member"
      });

      totalGenerated++;
    }

    await batch.commit();
    return totalGenerated;
  } catch (error) {
    console.error("Error generating dummy players:", error);
    throw error;
  }
}
