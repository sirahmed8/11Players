import { describe, it, expect } from "vitest";
import { LEAGUE_TIERS } from "@/components/leaderboard/LeagueTiersWidget";

describe("League Division Tiers Specification", () => {
  it("should contain 4 distinct division tiers", () => {
    expect(LEAGUE_TIERS.length).toBe(4);
  });

  it("should properly order tiers from Champions down to Challenge", () => {
    expect(LEAGUE_TIERS[0].id).toBe("champions");
    expect(LEAGUE_TIERS[0].minOvr).toBe(88);

    expect(LEAGUE_TIERS[1].id).toBe("master");
    expect(LEAGUE_TIERS[1].minOvr).toBe(82);

    expect(LEAGUE_TIERS[2].id).toBe("premier");
    expect(LEAGUE_TIERS[2].minOvr).toBe(75);

    expect(LEAGUE_TIERS[3].id).toBe("challenge");
    expect(LEAGUE_TIERS[3].minOvr).toBe(0);
  });

  it("should have valid positive member counts and color definitions", () => {
    LEAGUE_TIERS.forEach((tier) => {
      expect(tier.name).toBeTruthy();
      expect(tier.memberCount).toBeGreaterThan(0);
      expect(tier.badgeColor).toContain("from-");
    });
  });
});
