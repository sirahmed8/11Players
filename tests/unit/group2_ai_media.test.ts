import { describe, it, expect } from 'vitest';
import {
  calculateWeaknessZones,
  identifyKeyThreats,
  recommendCounterStrategy,
  determinePressIntensity,
  calculateOppositionScoutingReport,
  DEFAULT_OPPONENT_ROSTER,
} from '../../src/components/scouting/OppositionScoutingReport';

import {
  generateNewspaperHeadline,
  DEFAULT_MATCH_DATA,
  MatchResultData,
} from '../../src/components/newspaper/SportsNewspaperCover';

import {
  parseVoiceCommand,
} from '../../src/components/tactics/VoiceTacticsAssistant';

import { PlayerProfile } from '../../src/types';

describe('Group 2 AI & Media Generators Unit Tests', () => {
  // ── 1. Scouting Report & Weakness Zone Logic ──────────────────────────────
  describe('OppositionScoutingReport Vulnerability & Threat Calculations', () => {
    it('should calculate weakness zones correctly for default roster', () => {
      const zones = calculateWeaknessZones(DEFAULT_OPPONENT_ROSTER);
      expect(zones).toBeDefined();
      expect(zones.length).toBeGreaterThanOrEqual(3);

      const flankZone = zones.find((z) => z.id === 'flank_exploit');
      expect(flankZone).toBeDefined();
      expect(flankZone?.score).toBeGreaterThanOrEqual(0);
      expect(flankZone?.score).toBeLessThanOrEqual(100);
      expect(['CRITICAL', 'HIGH', 'MODERATE', 'LOW']).toContain(flankZone?.severity);
    });

    it('should generate higher stamina deficit score for a team with low stamina attributes', () => {
      const lowStaminaTeam: PlayerProfile[] = DEFAULT_OPPONENT_ROSTER.map((p) => ({
        ...p,
        attributes: {
          ...p.attributes,
          stamina: 45, // very low stamina
        },
      }));

      const normalZones = calculateWeaknessZones(DEFAULT_OPPONENT_ROSTER);
      const lowStaminaZones = calculateWeaknessZones(lowStaminaTeam);

      const normalStaminaScore = normalZones.find((z) => z.id === 'stamina_deficit')?.score || 0;
      const lowStaminaScore = lowStaminaZones.find((z) => z.id === 'stamina_deficit')?.score || 0;

      expect(lowStaminaScore).toBeGreaterThan(normalStaminaScore);
    });

    it('should identify top 3 key threat players from roster based on overall rating', () => {
      const threats = identifyKeyThreats(DEFAULT_OPPONENT_ROSTER);
      expect(threats.length).toBe(3);
      expect(threats[0].overall).toBeGreaterThanOrEqual(threats[1].overall);
      expect(threats[1].overall).toBeGreaterThanOrEqual(threats[2].overall);
      expect(threats[0].dangerTrait.en).toBeDefined();
      expect(threats[0].counterTip.ar).toBeDefined();
    });

    it('should recommend an appropriate counter formation and press intensity mode', () => {
      const zones = calculateWeaknessZones(DEFAULT_OPPONENT_ROSTER);
      const threats = identifyKeyThreats(DEFAULT_OPPONENT_ROSTER);

      const counter = recommendCounterStrategy(zones, threats);
      expect(counter.formation).toBeDefined();
      expect(counter.keyInstructions.en.length).toBeGreaterThan(0);
      expect(counter.keyInstructions.ar.length).toBeGreaterThan(0);

      const press = determinePressIntensity(DEFAULT_OPPONENT_ROSTER, zones);
      expect(['HIGH_PRESS', 'GEGENPRESS', 'MID_BLOCK', 'LOW_BLOCK']).toContain(press.mode);
      expect(press.intensityScore).toBeGreaterThanOrEqual(1);
      expect(press.intensityScore).toBeLessThanOrEqual(10);
    });

    it('should compute complete opposition scouting report object', () => {
      const report = calculateOppositionScoutingReport(DEFAULT_OPPONENT_ROSTER, 'Cairo Gladiators');
      expect(report.opponentTeamName).toBe('Cairo Gladiators');
      expect(report.overallThreatScore).toBeGreaterThan(50);
      expect(report.weaknessZones.length).toBeGreaterThan(0);
      expect(report.keyThreats.length).toBe(3);
      expect(report.tacticalTakeaways.length).toBe(4);
    });
  });

  // ── 2. Newspaper Headline Generation Logic ───────────────────────────────
  describe('SportsNewspaperCover Headline Generator Logic', () => {
    it('should generate "HONORS EVEN IN EPIC CLASH" headline for a draw', () => {
      const drawData: MatchResultData = {
        teamAName: 'Red Lions',
        teamBName: 'Blue Eagles',
        scoreA: 2,
        scoreB: 2,
      };

      const headline = generateNewspaperHeadline(drawData);
      expect(headline.mainHeadline.en).toBe('HONORS EVEN IN EPIC CLASH');
      expect(headline.mainHeadline.ar).toContain('تعادل');
    });

    it('should generate "UNBELIEVABLE COMEBACK DRAMA" headline for a comeback match', () => {
      const comebackData: MatchResultData = {
        ...DEFAULT_MATCH_DATA,
        isComeback: true,
      };

      const headline = generateNewspaperHeadline(comebackData);
      expect(headline.mainHeadline.en).toBe('UNBELIEVABLE COMEBACK DRAMA');
      expect(headline.mainHeadline.ar).toContain('ريمونتادا');
    });

    it('should generate "TACTICAL MASTERCLASS" headline for a 3+ goal blowout victory', () => {
      const blowoutData: MatchResultData = {
        teamAName: 'Giants FC',
        teamBName: 'Minnows FC',
        scoreA: 4,
        scoreB: 0,
      };

      const headline = generateNewspaperHeadline(blowoutData);
      expect(headline.mainHeadline.en).toBe('TACTICAL MASTERCLASS');
      expect(headline.subHeader.en).toContain('4-0');
    });

    it('should generate "THRILLING GOAL FESTIVAL" headline for high total goals (>= 5)', () => {
      const goalFestData: MatchResultData = {
        teamAName: 'Attackers A',
        teamBName: 'Attackers B',
        scoreA: 4,
        scoreB: 3,
      };

      const headline = generateNewspaperHeadline(goalFestData);
      expect(headline.mainHeadline.en).toBe('THRILLING GOAL FESTIVAL');
    });

    it('should generate "DERBY TRIUMPH & GLORY" for derby match types', () => {
      const derbyData: MatchResultData = {
        teamAName: 'City FC',
        teamBName: 'United FC',
        scoreA: 1,
        scoreB: 0,
        matchType: 'Derby',
      };

      const headline = generateNewspaperHeadline(derbyData);
      expect(headline.mainHeadline.en).toBe('DERBY TRIUMPH & GLORY');
    });

    it('should produce complete headline structure with edition and summary article writeups', () => {
      const headline = generateNewspaperHeadline(DEFAULT_MATCH_DATA);
      expect(headline.editionNumber).toMatch(/^#\d{4}$/);
      expect(headline.articleSummary.en.length).toBeGreaterThan(50);
      expect(headline.articleSummary.ar.length).toBeGreaterThan(50);
    });
  });

  // ── 3. Voice Tactics Assistant Command Parser Logic ───────────────────────
  describe('VoiceTacticsAssistant Voice Command Parser Logic', () => {
    it('should parse EN & AR "re-roll tactics" triggers', () => {
      const resEn = parseVoiceCommand('please re-roll tactics now');
      expect(resEn).not.toBeNull();
      expect(resEn?.command).toBe('REROLL_TACTICS');
      expect(resEn?.language).toBe('en');

      const resAr = parseVoiceCommand('تكتيك جديد يا كابتن');
      expect(resAr).not.toBeNull();
      expect(resAr?.command).toBe('REROLL_TACTICS');
      expect(resAr?.language).toBe('ar');
    });

    it('should parse EN & AR "substitute striker" triggers', () => {
      const resEn = parseVoiceCommand('substitute striker right away');
      expect(resEn).not.toBeNull();
      expect(resEn?.command).toBe('SUB_STRIKER');

      const resAr = parseVoiceCommand('تبديل المهاجم في الشوط الثاني');
      expect(resAr).not.toBeNull();
      expect(resAr?.command).toBe('SUB_STRIKER');
      expect(resAr?.formationSuggestion).toBe('4-4-2 Target Man');
    });

    it('should parse EN & AR "park the bus" triggers', () => {
      const resEn = parseVoiceCommand('park the bus to keep lead');
      expect(resEn).not.toBeNull();
      expect(resEn?.command).toBe('PARK_THE_BUS');

      const resAr = parseVoiceCommand('ركن الحافلة دفاعياً');
      expect(resAr).not.toBeNull();
      expect(resAr?.command).toBe('PARK_THE_BUS');
      expect(resAr?.formationSuggestion).toBe('5-4-1 Ultra Block');
    });

    it('should parse EN & AR "high press" triggers', () => {
      const resEn = parseVoiceCommand('execute high press');
      expect(resEn).not.toBeNull();
      expect(resEn?.command).toBe('HIGH_PRESS');

      const resAr = parseVoiceCommand('ضغط عالي على المدافعين');
      expect(resAr).not.toBeNull();
      expect(resAr?.command).toBe('HIGH_PRESS');
    });

    it('should parse EN & AR "flank attack" triggers', () => {
      const resEn = parseVoiceCommand('use flank attack strategy');
      expect(resEn).not.toBeNull();
      expect(resEn?.command).toBe('FLANK_ATTACK');

      const resAr = parseVoiceCommand('هجوم من الأطراف والتمرير السريع');
      expect(resAr).not.toBeNull();
      expect(resAr?.command).toBe('FLANK_ATTACK');
    });

    it('should return null for unrecognized input or empty strings', () => {
      expect(parseVoiceCommand('')).toBeNull();
      expect(parseVoiceCommand('random sentence hello world')).toBeNull();
    });
  });
});
