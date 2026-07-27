import { describe, it, expect } from "vitest";

import {
  calculateFutAttributes,
  calculateFutOvr,
  getFutTierConfig,
  FutCardTier,
} from "../../src/components/fut/Holographic3DFutCard";

import {
  generateKitPatternData,
  getShieldPath,
  exportKitConfigToJSON,
  importKitConfigFromJSON,
  DEFAULT_KIT_CONFIG,
  KitConfig,
} from "../../src/components/builder/KitBadgeBuilder";

import {
  calculateSplitBillAllocation,
  calculateSplitBillSummary,
  convertCurrency,
  generateShareableBillSummary,
  SplitBillPlayer,
} from "../../src/components/billing/PitchSplitBillCalculator";

import {
  calculateTotalPlayerXp,
  evaluateBadgeUnlockStatus,
  getSkillTreeNodes,
  PlayerStatsAndAttributes,
} from "../../src/components/gamification/XpSkillTree";

import {
  aggregateHeadToHeadStats,
  calculateCurrentStreak,
  calculateRivalryIntensityScore,
  MatchRecord,
  SAMPLE_DERBY_MATCHES,
} from "../../src/components/derby/DerbyRivalryEngine";

describe("Group 3: Competitive Ecosystem, FUT & Turf Tools Unit Tests", () => {
  // ── 1. Holographic 3D FUT Card Unit Tests ─────────────────────────────────
  describe("Holographic3DFutCard Logic", () => {
    it("should calculate 6 FUT attributes correctly from player profile attributes", () => {
      const sampleAttributes = {
        speed: 90,
        acceleration: 84,
        finishing: 88,
        kickingPower: 82,
        lowPass: 76,
        loftedPass: 74,
        dribbling: 86,
        ballControl: 84,
        defensiveAwareness: 45,
        ballWinning: 49,
        stamina: 80,
        physicalContact: 76,
      };

      const futStats = calculateFutAttributes(sampleAttributes);

      expect(futStats.pac).toBe(87); // (90 + 84)/2
      expect(futStats.sho).toBe(85); // (88 + 82)/2
      expect(futStats.pas).toBe(75); // (76 + 74)/2
      expect(futStats.dri).toBe(85); // (86 + 84)/2
      expect(futStats.def).toBe(47); // (45 + 49)/2
      expect(futStats.phy).toBe(78); // (80 + 76)/2
    });

    it("should compute weighted FUT OVR rating within 40-99 range", () => {
      const sampleAttributes = {
        speed: 95,
        acceleration: 95,
        finishing: 90,
        kickingPower: 90,
        lowPass: 85,
        loftedPass: 85,
        dribbling: 92,
        ballControl: 90,
        defensiveAwareness: 60,
        ballWinning: 60,
        stamina: 85,
        physicalContact: 85,
      };

      const ovr = calculateFutOvr(sampleAttributes);
      expect(ovr).toBeGreaterThanOrEqual(80);
      expect(ovr).toBeLessThanOrEqual(99);
    });

    it("should return correct tier configuration properties for multi-tier card styles", () => {
      const goldTier = getFutTierConfig("Gold");
      expect(goldTier.name).toBe("Gold Elite");
      expect(goldTier.accentColor).toBe("#f59e0b");

      const pitchEmerald = getFutTierConfig("Pitch Emerald");
      expect(pitchEmerald.name).toBe("Pitch Emerald");
      expect(pitchEmerald.accentColor).toBe("#10b981");

      const iconTier = getFutTierConfig("Icon");
      expect(iconTier.name).toBe("Icon");
      expect(iconTier.accentColor).toBe("#fcd34d");

      const diamondTier = getFutTierConfig("Elite Diamond");
      expect(diamondTier.name).toBe("Elite Diamond");
      expect(diamondTier.accentColor).toBe("#22d3ee");

      const retroTier = getFutTierConfig("Retro Legend");
      expect(retroTier.name).toBe("Retro Legend");
      expect(retroTier.accentColor).toBe("#d97706");
    });
  });

  // ── 2. Kit & Badge Builder Unit Tests ─────────────────────────────────────
  describe("KitBadgeBuilder Logic", () => {
    it("should generate kit pattern data with correct colors and line counts", () => {
      const patternData = generateKitPatternData("Stripes", "#0f172a", "#f59e0b", "#ffffff", 400, 480);
      expect(patternData.pattern).toBe("Stripes");
      expect(patternData.primaryColor).toBe("#0f172a");
      expect(patternData.secondaryColor).toBe("#f59e0b");
      expect(patternData.patternLines).toBe(6);
      expect(patternData.dimensions.width).toBe(400);
    });

    it("should return valid SVG path string for custom crest shield shapes", () => {
      const classicPath = getShieldPath("Classic Shield", 380, 440);
      expect(classicPath).toContain("M ");
      expect(classicPath).toContain("Z");

      const circlePath = getShieldPath("Modern Circle", 380, 440);
      expect(circlePath).toContain("A ");

      const diamondPath = getShieldPath("Diamond Badge", 380, 440);
      expect(diamondPath).toContain("L ");
    });

    it("should export and import kit configuration JSON losslessly", () => {
      const customConfig: KitConfig = {
        ...DEFAULT_KIT_CONFIG,
        kitName: "Custom Test Squad FC",
        pattern: "Hoops",
        primaryColor: "#ff0000",
        secondaryColor: "#00ff00",
        squadNumber: 7,
      };

      const jsonStr = exportKitConfigToJSON(customConfig);
      expect(jsonStr).toContain("Custom Test Squad FC");
      expect(jsonStr).toContain("Hoops");

      const imported = importKitConfigFromJSON(jsonStr);
      expect(imported.kitName).toBe("Custom Test Squad FC");
      expect(imported.pattern).toBe("Hoops");
      expect(imported.primaryColor).toBe("#ff0000");
      expect(imported.squadNumber).toBe(7);
    });
  });

  // ── 3. Pitch Split Bill Calculator Unit Tests ──────────────────────────────
  describe("PitchSplitBillCalculator Logic", () => {
    it("should divide total rent cost equally among players in equal split mode", () => {
      const allocation = calculateSplitBillAllocation(350, 7, "equal");
      expect(allocation.playerAmounts["player_1"]).toBe(50);
      expect(allocation.totalAllocated).toBe(350);
      expect(allocation.remainingUnallocated).toBe(0);
    });

    it("should calculate custom split amounts and remaining balance accurately", () => {
      const customAmounts = {
        player_1: 100,
        player_2: 100,
        player_3: 50,
      };
      const allocation = calculateSplitBillAllocation(350, 3, "custom", customAmounts);
      expect(allocation.totalAllocated).toBe(250);
      expect(allocation.remainingUnallocated).toBe(100);
    });

    it("should convert currencies using correct exchange rate ratios", () => {
      const inUsd = convertCurrency(375, "SAR", "USD");
      expect(inUsd).toBe(100.01); // 375 * 0.2667

      const inEgp = convertCurrency(10, "SAR", "EGP");
      expect(inEgp).toBe(128.5);
    });

    it("should calculate payment status summary metrics correctly", () => {
      const items: { amount: number; status: "Paid" | "Pending" | "Overdue" }[] = [
        { amount: 50, status: "Paid" },
        { amount: 50, status: "Paid" },
        { amount: 50, status: "Pending" },
        { amount: 50, status: "Overdue" },
      ];

      const summary = calculateSplitBillSummary(items);
      expect(summary.totalCost).toBe(200);
      expect(summary.totalPaid).toBe(100);
      expect(summary.totalPending).toBe(50);
      expect(summary.totalOverdue).toBe(50);
      expect(summary.percentPaid).toBe(50);
    });

    it("should generate a shareable WhatsApp text summary string", () => {
      const players: SplitBillPlayer[] = [
        { id: "1", name: "Ahmed", amount: 50, status: "Paid" },
        { id: "2", name: "Tariq", amount: 50, status: "Pending" },
      ];

      const summaryText = generateShareableBillSummary("Al-Malaz Match", 100, "SAR", players);
      expect(summaryText).toContain("PITCH SPLIT BILL");
      expect(summaryText).toContain("Ahmed: 50 ر.س (Paid)");
      expect(summaryText).toContain("Tariq: 50 ر.س (Pending)");
    });
  });

  // ── 4. XP Skill Tree & Gamification Unit Tests ─────────────────────────────
  describe("XpSkillTree Logic", () => {
    it("should calculate total player XP from matches, goals, assists, and MVPs", () => {
      // 20 matches (1000) + 10 goals (1000) + 5 assists (375) + 2 MVPs (400) + 1 CleanSheet (120) = 2895 XP
      const xp = calculateTotalPlayerXp(20, 10, 5, 2, 1);
      expect(xp).toBe(2895);
    });

    it("should evaluate badge unlock status correctly for locked vs unlocked states", () => {
      const playerStats: PlayerStatsAndAttributes = {
        matchesPlayed: 10,
        goals: 5,
        assists: 2,
        mvp: 1,
        attributes: {
          finishing: 85,
        },
      };
      // Total XP = 500 + 500 + 150 + 200 = 1350 XP

      const sniperEval = evaluateBadgeUnlockStatus("sniper", playerStats, 1350);
      expect(sniperEval.unlocked).toBe(true);
      expect(sniperEval.currentRank).toBe("Silver"); // >= 1200 XP threshold for Silver

      // High XP test for Diamond rank
      const diamondEval = evaluateBadgeUnlockStatus("sniper", playerStats, 6000);
      expect(diamondEval.currentRank).toBe("Diamond");
      expect(diamondEval.progressPercent).toBe(100);
    });

    it("should keep badge locked if attribute requirement is not met even with high XP", () => {
      const lowFinishingStats: PlayerStatsAndAttributes = {
        matchesPlayed: 50,
        goals: 20,
        assists: 10,
        mvp: 5,
        attributes: {
          finishing: 60, // Below 75 requirement
        },
      };

      const evalResult = evaluateBadgeUnlockStatus("sniper", lowFinishingStats, 5000);
      expect(evalResult.unlocked).toBe(false);
      expect(evalResult.currentRank).toBe("Locked");
    });

    it("should return default skill tree nodes list", () => {
      const nodes = getSkillTreeNodes();
      expect(nodes.length).toBeGreaterThanOrEqual(6);
      expect(nodes.some((n) => n.id === "sniper")).toBe(true);
      expect(nodes.some((n) => n.id === "engine")).toBe(true);
    });
  });

  // ── 5. Derby Rivalry Engine Unit Tests ────────────────────────────────────
  describe("DerbyRivalryEngine Logic", () => {
    it("should aggregate head-to-head stats accurately from sample matches", () => {
      const stats = aggregateHeadToHeadStats(SAMPLE_DERBY_MATCHES, "capt_ahmed", "capt_tariq");
      expect(stats.totalMatches).toBe(5);
      expect(stats.winsA).toBe(2); // m1 (3-2), m3 (4-1)
      expect(stats.winsB).toBe(1); // m4 (2-3)
      expect(stats.draws).toBe(2); // m2 (1-1), m5 (2-2)
      expect(stats.goalsA).toBe(12); // 3+1+4+2+2
      expect(stats.goalsB).toBe(9); // 2+1+1+3+2
      expect(stats.goalDiffA).toBe(3);
      expect(stats.winRateA).toBe(40.0);
    });

    it("should calculate active win streak correctly for latest matches", () => {
      const streak = calculateCurrentStreak(SAMPLE_DERBY_MATCHES, "capt_ahmed");
      // m1 (latest match) is 3-2 win for Capt. Ahmed (A)
      expect(streak.winner).toBe("A");
      expect(streak.count).toBe(1);
      expect(streak.streakText).toContain("Capt. Ahmed");
    });

    it("should compute rivalry intensity score (0-100) and label tier", () => {
      const stats = aggregateHeadToHeadStats(SAMPLE_DERBY_MATCHES, "capt_ahmed", "capt_tariq");
      const intensity = calculateRivalryIntensityScore(stats);

      expect(intensity.score).toBeGreaterThanOrEqual(10);
      expect(intensity.score).toBeLessThanOrEqual(100);
      expect(["WARM", "HEAT", "FIERCE", "EL CLASICO"]).toContain(intensity.level);
    });
  });
});
