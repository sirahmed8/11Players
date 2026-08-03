import { describe, it, expect } from "vitest";
import { TIER_DEFS } from "@/components/leaderboard/LeagueTiersWidget";

describe("League Division Tiers Specification", () => {
  it("should contain 4 distinct division tiers", () => {
    expect(TIER_DEFS.length).toBe(4);
  });

  it("should properly order tiers from Champions down to Challenge", () => {
    expect(TIER_DEFS[0].id).toBe("champions");
    expect(TIER_DEFS[0].minOvr).toBe(88);

    expect(TIER_DEFS[1].id).toBe("master");
    expect(TIER_DEFS[1].minOvr).toBe(82);

    expect(TIER_DEFS[2].id).toBe("premier");
    expect(TIER_DEFS[2].minOvr).toBe(75);

    expect(TIER_DEFS[3].id).toBe("challenge");
    expect(TIER_DEFS[3].minOvr).toBe(0);
  });

  it("should have valid tier names and color definitions", () => {
    TIER_DEFS.forEach((tier) => {
      expect(tier.nameEn).toBeTruthy();
      expect(tier.nameAr).toBeTruthy();
      expect(tier.badgeColor).toContain("from-");
    });
  });
});
